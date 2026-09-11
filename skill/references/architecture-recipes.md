---
name: outsystems-architecture-recipes
description: >
  Architecture-level design principles for OutSystems ODC builds — not
  Mentor-prompt fixes for a specific widget/bug, but structural decisions
  that shape how a wave is scoped and how assets relate to each other.
  Read this BEFORE scoping any wave that introduces a new kind of asset
  (an AI Agent, an external integration, a shared Library) or that could
  tempt bundling a new capability directly into an existing app's own
  server actions. Companion to `recipes.md` (UI/Mentor-prompt patterns)
  and `backend-and-data-gotchas.md` (Server Action/entity/aggregate
  gotchas) — this file is one level up: decisions about asset boundaries,
  not about what happens inside one action.
---

# Architecture recipes

Each entry here is a structural principle, not a copy-paste prompt block
— apply it when *scoping* a wave (deciding what asset does what), before
writing any spec or firing Mentor.

## Recipe: an agent must not be coupled to the project that calls it

**When to use:** any wave that introduces an AI/LLM-backed capability —
suggestion generation, summarization, classification, extraction,
orchestration — not just one specific project. This applies the moment a
wave's spec says something like "the app calls an AI model to produce
X," regardless of how small that first version looks.

**The principle:** Build the agent as its own independent asset — in
this tenant, OutSystems' native `AIAgent` asset type (confirmed to exist
as a first-class, independently-published asset kind alongside
`WebApplication`/`Library`/`Workflow` — `context_agents` lists 21 of them
in this tenant already, none of them owned by or embedded inside a
calling app) — with its own interface, versioning, and test surface.
Never implement the agent's actual logic (prompt construction, model
call, response parsing) as server actions living inside the calling
WebApplication's own OML. The calling app treats the agent the same way
it would treat any third-party API: through a thin, explicit integration
boundary, never by having the agent's reasoning embedded in the app's
own action flow.

**Why this matters:**
1. **Independent iteration.** A prompt tweak or model swap on the agent
   should never force a republish of the calling app, and should never
   re-run that app's unrelated E2E suite. If the agent's logic lives
   inside the app's own server actions, every agent change is
   indistinguishable from an app change.
2. **No data-model leakage into the agent.** If the agent's own
   interface is shaped around the calling app's specific entities (e.g.
   an `AnalisarItemComIA` action that takes an `ItemFicha` record
   directly instead of generic text), the agent becomes unreusable for
   a second ficha type, a second app, or a second tenant. The agent's
   input/output contract should be generic (text in → structured text
   out), not app-entity-shaped.
3. **Failure isolation.** An agent timeout, rate limit, or bad response
   needs to be distinguishable from an app bug at a glance — a stack
   trace inside the calling app's own action means "the app broke";
   isolating the agent as its own asset means an agent failure surfaces
   as an integration/dependency failure instead, which is the correct
   framing and the correct place to retry/fallback logic.
4. **Independent rollback.** A regressive prompt change must be
   revertable by rolling back the agent's own revision, without
   touching (or needing to understand) the calling app's deploy state at
   all — this is the same reasoning behind "revert to last known good"
   in `backend-and-data-gotchas.md` #6, applied one layer up: the
   smaller and more independent the reverted unit, the safer the revert.

**How to apply:**
- The agent's actual reasoning (prompt, model call, response parsing)
  lives in its own `AIAgent` asset, built and published independently.
  Its inputs/outputs are generic (raw text, structured text) — nothing
  named after the calling app's entities.
- The calling app gets exactly one thin integration action per
  capability (e.g. `SolicitarSugestaoIA`) that: reads the app-specific
  data it needs, converts it into the agent's generic input shape, calls
  the agent, and maps the generic output back onto the app's own fields.
  This action — and only this action — is allowed to know about both
  the agent's interface and the app's data model.
- Verify the boundary actually holds: publish a change to the agent
  alone and confirm the calling app's own revision/modelDigest (via
  `app_revisions`) does not change. If it does, something leaked across
  the boundary.

**Red flag this recipe exists to catch:** a wave spec that lists the
AI/LLM call as one more server action alongside the app's other server
actions, with no separate asset mentioned at all — that is the coupling
this recipe prevents. Split it out before scoping the wave further, not
after building it.

## Recipe: test a new agent isolated before integrating it into the calling app

**When to use:** any time a new `AIAgent` asset (or a change to an
existing one) is being wired into a calling app for the first time — the
moment a wave's plan is "call the agent, parse its response, write the
result into the app's own fields."

**The principle:** verify the agent works correctly **on its own**,
calling its `AgentFlow`/service action directly via the harness with a
real input, and inspecting its raw output — before writing or debugging
any code in the calling app that consumes it. Only once the agent's own
output is confirmed correct should the calling app's integration action
(parsing, field mapping, persistence) be built or debugged.

**Why this matters:** when a symptom appears after integration (e.g. "the
suggestion comes back empty" or "the fields are blank"), there are two
independent places it could originate — the agent's own reasoning/output,
or the calling app's parsing/mapping of that output — and without an
isolated test of the agent alone, every debugging turn has to hold both
hypotheses open at once, doubling the search space. This was the decisive
move in resolving W20f Bug 3 (`logs/w20f.md`): the calling app's
`SolicitarSugestaoIA` reported success but wrote empty fields; three
plausible-sounding Mentor-authored diagnoses were floated for what might
be wrong in the *app's* logic before anyone confirmed the agent itself
was fine. Calling the agent's `AgentFlow` directly, in isolation, with a
real input, and inspecting the raw JSON it returned, immediately proved
the agent was correct and isolated the bug to one specific place in the
app's own parsing — collapsing what could have been another multi-turn
guessing cycle into one direct read.

**How to apply:**
- Before wiring a new/changed agent into any calling app action, call its
  own service action (or `AgentFlow` directly, if accessible) via the
  test harness with a real, representative input. Read the raw output
  verbatim — don't paraphrase or assume its shape from the spec.
- Only after that output is confirmed correct, write or debug the calling
  app's parsing/mapping/persistence logic — and when a symptom appears
  post-integration, re-run this isolated agent test FIRST, before
  assuming the bug is in the app's own code. It rules out (or confirms)
  half the search space in one call.
- Never invent or assume field names in the calling app's parsing logic
  from the spec's prose alone — read them from the agent's actual raw
  output. Passing through field names that sound right but weren't
  verified against the real response reproduces the same class of bug
  the isolated test exists to catch.

**Verify:** the agent's isolated raw output, read directly from the
harness call — not the calling app's summary of what it did with that
output, and not an assumption about what the agent "should" return based
on its prompt/spec.

## Recipe: a cross-asset request/response is a Service Action out and the owner's own public event back

**When to use:** any wave where one asset asks another to do work and
needs to hear back when it's done — a web app handing a document to an
agent, an app kicking off a job owned by a separate asset. The natural
design is a symmetric pub/sub pair ("the web app publishes a request
event, the agent publishes a result event"). Only half of that is
implementable.

**The principle:** ODC's node for firing a global event
(`ITriggerGlobalNode.Event`) only accepts a **local** event of the same
asset — no asset can trigger another asset's event. So:
- **Request leg = a Service Action**, exposed by the asset that does the
  work (input: whatever it needs). It must return immediately, before
  the actual processing finishes, so the caller never blocks waiting on
  an LLM or a long job.
- **Completion leg = an event owned and fired by the asset that did the
  work**, triggered locally when its processing finishes. The caller's
  only role is a Global Event Handler subscribing to it; its screen shows
  a "processing" state until that event arrives.
- **Both must be set to Public explicitly.** ODC creates events (and
  Service Actions) as private to their own asset by default. A private
  event publishes cleanly with no error, and the gap only surfaces later,
  in the *consuming* asset's Mentor session, as "this event doesn't
  exist" — which reads like it was never built.

**How to apply:**
- In the working asset's prompt: name the Service Action and its contract
  ("returns immediately, does not wait for the model"), name the
  completion event and its parameters, and say "set both to **Public**."
- In the caller's prompt: it *calls* that Service Action directly and
  *subscribes* to that event — never "publishes an event to" the other
  asset for the request leg.
- Build and publish the working asset first; the caller can only
  reference what is already published.

**Verify:** after publishing the owning asset, confirm the consuming
asset can actually see and reference both the Service Action and the
event. If the consuming session still reports either as missing right
after the visibility fix, re-check that the owning asset was published,
not just saved — the consumer reads published dependency metadata.

## When this file isn't enough

This file holds structural/asset-boundary principles, not UI fixes or
Server Action gotchas — see `recipes.md` and `backend-and-data-gotchas.md`
for those, and `outsystems-app-architecture`/`outsystems-tenant-architecture`
skills for tenant-wide surveys rather than build-time decisions. Add a
new entry here when a wave-scoping decision (not a bug, not a widget
fix) turns out to matter enough that a future wave should make the same
call automatically instead of re-deriving it.
