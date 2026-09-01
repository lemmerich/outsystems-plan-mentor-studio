---
name: outsystems-plan-mentor-studio
version: "0.8.0-ms.1"
date: "2026-08-30"
upstream: "0.7.0"
description: >
  Guides you from a blank folder to a complete OutSystems build plan through
  a short interactive interview. Reads your spec and reference screens, proposes
  a wave breakdown where every wave ends with something clickable and visually
  verifiable, and generates RUNBOOK.md + one spec file per wave + Playwright
  test scaffolding. Every wave is prototyped in HTML and approved BEFORE Mentor
  ever touches it — the prototype, not ASCII art, is the screen's source of
  truth. Use when starting a new OutSystems project or planning a new feature
  set: "plan this project", "break into waves", "create plan from SDD",
  "start planning".
  FORK - Mentor Studio channel: this variant assumes no OutSystems MCP. Every
  wave's prompt is EMITTED for a human to paste into the ODC Studio assistant,
  and the plan is tuned for PoC delivery (demo path first, fidelity budgeted).
license: MIT
allowed-tools: AskUserQuestion Bash Read Write Edit Artifact
---

# OutSystems Plan — interactive planning from spec to waves

## What this produces

Running this skill in a project folder creates:

```
SPEC-REVIEW.md          ambiguities and assumptions, signed off before planning
RUNBOOK.md              the single source of truth: waves, gates, execution order
spec-w1.md … spec-wN.md one file per wave
prompts/w1.md … wN.md   the paste-ready Mentor Studio prompt for each wave
tests/
  playwright.config.ts
  package.json
  .env.example
  support/selectors.ts  all locators and verbatim messages in one place
  support/fixtures.ts   one authenticated Page per role
  auth.setup.ts         logs in once, saves storageState for every spec
  demo.spec.ts          replays the demo script end to end — must never be red
  w1.spec.ts … wN.spec.ts
  files/README.md       where test fixture files (PDFs, etc.) live
```

The skill produces the **plan** and the **prompts**. Execution (pasting a prompt
into Mentor Studio, publishing, running the tests) is the RUNBOOK's job and the
operator's hands.

---

## The channel: Mentor Studio, not MCP

Upstream `outsystems-plan` drives Mentor through the OutSystems MCP: it fires a
turn, polls for a terminal state, reads the model back with `context_entities` /
`context_actions` / `context_screens`, and publishes. **This fork has none of
that.** The assistant here is Mentor Studio, the chat inside ODC Studio: a human
pastes a prompt into it and watches it work.

Four consequences shape everything below.

**1. Execute becomes Emit + Paste.** The skill never fires anything. It writes
`prompts/wN.md` and shows the prompt in a fenced block for the operator to copy.
The operator pastes it, lets Mentor work, publishes, and comes back saying
"W3 done" (or "W3 did X instead"). Turn IDs, poll intervals, retry counts and
`change_applied` do not exist here - never write a log line that implies they do.

**2. The static gate is manual and weaker.** There is no programmatic entity /
action / screen count. The gate becomes a short read-back the operator performs
in the ODC Studio module tree, plus whatever the Compare step sees. Accept that
this is softer than upstream's gate and do not pretend otherwise: compensate by
leaning harder on Compare (step 4) and on the E2E tests, which are the only
checks left that a machine performs.

**3. The prompt must be self-contained AND small.** Upstream re-sends the wave
spec plus the SDD plus the design system on every turn, because an MCP prompt is
cheap and the session carries `fresh_context`. Mentor Studio is an IDE chat with
no memory across sessions and a human doing the pasting - a 4,000-line paste is
not viable. Every prompt therefore carries a **context pack**: only the modules,
entities, screens and actions that already exist and matter for this wave, plus
an explicit do-not-touch list. Generate it at emit time from the RUNBOOK wave
table and the previous waves' specs. Never version a separate `CONTEXT.md` - it
is derived, and a derived file that gets stored is a file that goes stale.

**4. There is no image channel - so send the HTML, not a description of it.**
Upstream attaches a prototype screenshot and then spends guardrail 9 describing
in words the box-model facts a picture cannot carry. Here there is no picture at
all, which turns out to be an advantage: paste the **pruned HTML and CSS of that
one screen** from the living prototype directly into the prompt. It is text, it
is the literal contract, and it carries max-width, stacking and flex behaviour
exactly instead of approximately. Prune it first (see
`references/mentor-studio-prompt.md`): one screen only, no nav switcher, no JS,
no unrelated CSS. Target 120 lines. If a screen's markup cannot be cut below
roughly 200 lines, the wave is too big.

**Verify before the first project:** if the Mentor Studio build in use does
accept image attachments, keep the pruned HTML anyway (it is strictly more
precise) and add the screenshot on top.

**5. A project can span more than one ODC artifact — provision them all before W0.**
A web app is not the only artifact type Mentor Studio edits: an Agentic App
(an Agent Workbench agent) is a separate artifact with its own module tree,
and a project that needs an AI agent needs at least one of each. Creating
these mid-plan means later prompts either guess at names or get renamed
out from under them. Instead, run a manual **Step 0 — Provisioning** before
any wave: the operator creates every artifact the plan will touch — the web
app and each Agentic App — empty, in ODC, with the **final names fixed up
front**. Record them in the RUNBOOK under "Project facts" as a small table
(artifact name → type → which waves touch it). Every wave prompt from then
on opens each of its sections with `Módulo alvo: <ArtifactName>` so the
operator knows which ODC module to have open before pasting that section.

This does not relax the one-testable-outcome-per-wave rule (see "The core
principle" below) — a wave is still sized by what a human can click and
verify at the end, never by "one artifact, one wave." A wave whose outcome
needs both an agent configured and a screen that calls it is **one wave**
with a prompt split into two `Módulo alvo` sections, pasted into two
different Mentor Studio sessions in sequence, gated together once both
land. Splitting by artifact instead would produce a wave that ends with an
agent nobody can see working — exactly the kind of non-verifiable wave the
core principle exists to prevent.

**Step 0 — Provisioning is not a wave, and it never gets a wave number.**
Creating an empty artifact has nothing a human can click or verify — it
fails the core principle outright — so it does not belong in the wave table
(no `W0`, no `W-1`, no row at all) and it gets no `spec-w0.md` or
`prompts/w0.md` of its own. It lives entirely as its own section in
RUNBOOK.md: the provisioned-artifacts table (name, type, which waves carry
a `Módulo alvo:` section for it) plus a one-line instruction to create them
manually, empty, before anything else starts. `W0` is still the first
*wave* — the theme wave — and starts only once Step 0's table is fully
checked off.

---

## The core principle

Every wave must end with **something a human can click and verify visually**.

This means a wave can be smaller than a full feature screen. Examples of valid
wave boundaries:

- The list screen exists with the correct layout and empty state (no data yet)
- The same screen now shows seeded data
- The create form exists and validates (no backend action yet)
- The form submits and the record appears in the list
- The detail screen opens from the list

Each of these is independently observable. Each can be tested with a single
Playwright scenario. Each can be approved or rejected on its own.

**A wave that only creates entities with no screen is never valid.**

---

## The prototype-first principle

**ASCII layout diagrams in a spec are not a sufficient reference for Mentor.**
In practice Mentor follows a written description of field grouping loosely —
fields that should sit on the same row end up one-per-line, and screens that
were never explicitly speced (a detail view reached by clicking a list row,
for instance) simply don't get built. Text under-specifies layout; a picture
doesn't.

So for every wave that touches UI, the sequence is always:

```
1. Cut the wave (functional slice — Step 2 below)
2. Prototype it in HTML (this step) — build or evolve the artifact, get it approved
3. Derive the wave spec's Screen layout section FROM the approved prototype
4. Emit the wave prompt (RUNBOOK Step — pruned prototype markup embedded, no screenshot)
5. Verify the published result against the prototype, not just against the spec text
6. Any change made to reconcile — in either direction — gets written back:
   prototype edits go into the spec; implementation constraints Mentor surfaces
   go back into the prototype before the next wave reuses that pattern
```

**One cumulative prototype, not one per wave.** Build a single HTML file
(e.g. `prototipo-<projectname>.html`) with a lightweight tab/nav switcher
between screens, and evolve it wave over wave — republishing the same
Artifact URL each time (see Artifact tool: pass `url` on subsequent
publishes to update in place rather than creating a new page). This keeps
one link the user can always open to see "what does the app look like right
now, across every wave so far." Each new wave adds its screen(s) to the same
file; screens from earlier waves stay in it as an always-current reference,
not a throwaway mockup.

**How to prototype a wave:**

1. Base the visual system on whatever reference material Question 3
   provided (colors, spacing, component patterns). If nothing was provided,
   propose a palette and ask the user to approve it before building more
   than one screen on top of it — a theme decision made silently in HTML
   is a theme decision the user didn't actually make.
2. Build with real interactivity where it clarifies behavior: list rows
   that navigate to a detail view on click, a form that validates and
   inserts a new row into the list, a date picker instead of free text —
   anything that would otherwise be ambiguous from a static picture. This
   is cheap in HTML/JS and removes an entire class of "I assumed X" gaps.
3. Publish as an Artifact and iterate with the user in the same
   conversation turn — this is a fast, cheap loop; do not wait for a
   "final" version before showing it. Treat early rejection as the system
   working, not as rework.
4. Only once the user explicitly approves a screen does it graduate into
   that wave's spec.

**The prototype is transferred as pruned markup, not as a picture.** A
screenshot carries color, typography and field grouping faithfully and
systematically fails to carry box model - max-width constraints,
block-vs-inline stacking, and flex shrink behaviour (`min-width: 0`) are
invisible or ambiguous in a static image, and Mentor defaults every OutSystems
UI container to fill-parent unless told otherwise in words. Since this fork has
no image channel at all (see "The channel" above), the wave prompt embeds the
screen's own markup and CSS instead, which carries those three facts exactly.
State them in prose next to the markup anyway: Mentor follows a written
constraint more reliably than it infers one from CSS, and the redundancy costs
three lines. Skipping this is what produces the "looks right, then a week later
someone compares it pixel-by-pixel and finds five divergences" loop - cheap
to prevent up front, expensive to find one bug at a time after publish.

**Before writing any wave's Screen layout section, read
[`references/prototype-to-widgets.md`](references/prototype-to-widgets.md)**
— a conversion guide from recurring real bugs (title/subtitle landing in
different layout placeholders, fill-parent-by-default containers, flex
`min-width` shrink behavior, `Adaptive` margin misalignment, reserved theme
class names, canonical vs. invented CSS variables, and when a pattern like
list→detail is already a built-in OutSystems UI block). It points into
`outsystems-design-to-app`'s deeper reference library for anything beyond
these recurring cases.

**Cross-wave decisions surfaced by the prototype** (a theme change, a screen
that turns out to already belong in a different wave, a UX pattern like
list→detail navigation) are still plan-level decisions — confirm scope with
the user (`AskUserQuestion`) before rewriting specs for waves other than the
one currently being planned, the same way any other plan revision is
confirmed.

**A list→detail pair discovered this way is two waves, not one**, even
though it's natural (and correct) to prototype and approve both screens in
the same sitting — see the one-screen-per-wave hard cap below. Approving
two screens together in the prototype conversation does not mean they
execute together against Mentor; write two spec files and fire two prompts.

---

## The wave execution cycle

Executing a wave is not "paste the prompt, publish, done" — it is a fixed
six-step loop, and it applies whether the wave is brand new or a fix on top
of one already published. **Skip a step only when the user explicitly says
to; never skip a step silently.**

**Before starting the cycle for the next wave, re-check the plan itself**:
re-read that wave's `spec-wN.md` in full (not from memory — see
`prototype-to-widgets.md` #16) and check whether anything discovered while
executing *previous* waves changes what this wave should do — a data-model
exception granted mid-build, a renumbering, a scope item that moved, a bug
fix that already covers part of this wave's stated scope. Update
`RUNBOOK.md`/`spec-wN.md` first if something's stale, *then* start step 1.
This is a standing check, every wave, not a one-time planning-phase step.

```
1. Prototype    — build or evolve the screen(s) in the living prototype (HTML)
2. Approve      — get the user's explicit sign-off on the prototype change
3. Emit         — update the wave spec from the approved prototype, then
                  write prompts/wN.md and show it for the operator to paste
                  into Mentor Studio. If Mentor Studio replies with a written
                  plan instead of executing immediately (it often does, and
                  asks "proceed or discard"), the operator pastes that plan
                  back before clicking proceed — see "Plan check" below.
                  Once clear to proceed, the operator publishes and reports back
4. Compare      — open the published screen and the approved prototype
                  side by side; list every visual/behavioral difference —
                  don't stop at the first one found. When the wave
                  introduces a new computed/derived field (a score, a
                  status, a rollup), also check every OTHER already-built
                  screen that lists or references the same entity — a wave
                  spec is typically written against the one screen the
                  feature "lives on," and an existing list/summary screen
                  elsewhere showing a static "—" placeholder for that same
                  data is easy to miss because it renders without error,
                  just wrong data. **For any new form/card container,
                  explicitly re-measure the box-model facts from step 3
                  against the live screen — container width (capped, or
                  did it stretch to fill-parent?) and inter-element spacing
                  (button gaps, padding) — by measuring, not eyeballing.**
                  A prompt that skipped stating those facts (the single
                  most common authoring gap — see
                  `references/prototype-to-widgets.md` #2) will produce a
                  screen that "looks right" in a quick glance but is
                  visibly wrong on width/spacing once actually compared.
5. Reconcile    — for each difference: fix the app (usually), or fix the
                  prototype/spec if the difference was the prototype's own
                  oversight (see the prototype-first principle) — then
                  re-publish and go back to step 4, within the budget below.
                  **Before writing any CSS fix prompt targeting an element
                  a PRIOR wave already patched** (any overlay/modal/card
                  named in an earlier `wN-fix.md` prompt), first dump every
                  stylesheet rule that currently matches that element on
                  the live page (see `references/recipes.md` → "fixing CSS
                  on any element that has been patched before") — a prior
                  wave's leftover workaround (often `!important` on a broad
                  `> *` selector) silently outranks a plain new rule
                  regardless of specificity, and Mentor cannot see this
                  itself since it never renders the page. If a fix's
                  post-publish measurement comes back UNCHANGED, that is
                  the signature of exactly this — don't write a stronger
                  version of the same fix, run the rule dump instead. And
                  when a turn replaces an old stopgap with the real fix,
                  the SAME turn must explicitly remove the stopgap —
                  otherwise it lies dormant until some later, unrelated
                  wave touches the same element and loses to it.
                  **Any fix touching the platform shell's sidebar/header/
                  nav containers (`.aside-navigation`, `.header`,
                  `.app-menu-content`, `.main`) must be re-verified at
                  both a desktop and a tablet/mobile viewport width before
                  being considered done** — see `references/recipes.md` →
                  "any CSS fix touching the platform shell's sidebar/
                  header/nav containers." A fix scoped to one width can
                  silently break the platform's built-in responsive
                  drawer/hamburger behavior at the other, with zero
                  validation errors and no visible sign at the width it
                  was tested on.
6. Test         — update/add E2E test cases for what changed, then ask the
                  user whether to run them now (never auto-run — see the
                  RUNBOOK's per-wave procedure)
```

**A prior approval is not a standing approval.** A prototype screen may have
been approved long before its wave is actually executed (e.g. all 8 waves
planned and their screens sketched up front, then executed one wave at a
time over separate sessions). When a wave's turn comes, re-open its
prototype screen and walk it with the user again **before** step 3 (Emit) —
don't treat "approved" from the planning pass as still current. Digging into
a screen's real details at execution time routinely surfaces things the
planning pass didn't: a field that needs to come from an upstream document
instead of being typed, a control that's missing a state, wording that reads
as internal jargon rather than end-user copy. Fold what surfaces into the
prototype/spec, get sign-off on the refined version, then Emit. Skipping
this re-confirmation doesn't save a step — it just moves the same rework to
after publish, where it costs a Compare/Reconcile round instead of a prompt
edit.

**Plan check — free when Mentor Studio offers it, never required.** Some
Mentor Studio builds return a written plan before touching the module and
wait for "proceed" or "discard" rather than executing immediately. Treat
that plan as a free preview: read it against the prompt's own CHANGES list,
GUARDRAILS and DO NOT TOUCH before telling the operator to proceed. This
catches the same class of misunderstanding Compare catches after publish —
a CHANGES item silently reinterpreted, a guardrail about to be skipped, a
plan step that reaches past DO NOT TOUCH — except here it costs nothing: no
publish, no undo, no Compare round.

What to check the returned plan against, in order:
- Every CHANGES item has a matching plan step, and no extra one appeared —
  scope creep reads more clearly in a plan than in a published screen.
- Nothing in the plan names an artifact from DO NOT TOUCH.
- No plan step already contradicts a numbered GUARDRAILS rule — a plan that
  says "hex color #1E88E5" or describes one field per row has told you it
  will fail guardrails 1 and 3 before it runs.
- The plan's screen-building steps account for the LAYOUT FACTS (max-width,
  stacking, `min-width: 0`) named in the prompt — a plan that is silent on
  them is a plan that will build fill-parent containers.

If the plan looks right, tell the operator to click proceed. If it doesn't,
never discard and re-paste the whole prompt — that just repeats whatever
produced the misreading. Instead give the operator one short correction to
paste into the same session before it executes (a sentence or two naming
the misunderstood point, not a new prompt). This is cheaper than a
post-publish re-prompt precisely because nothing has been built yet.

If the same misunderstanding shows up in a plan twice across a project, the
cause is in the prompt's wording, not in Mentor: fix the phrasing pattern in
`prompts/wN.md` for later waves, and if the shape looks likely to recur on
other projects, add it to `references/mentor-studio-prompt.md` section 4.
This is the same discipline as the re-prompt retrospective below — a
misreading you don't write down as a prompt-wording problem is one you pay
for again next wave.

Log a plan check only when it changed something: `[Plan check: <one line —
what was corrected before Mentor executed>]`, alongside re-prompts, in the
Step 5 execution log.

**Reconcile styling by replacement, not by patch.** The first reconcile round
may be a short list of named fixes. From the second round on — and immediately,
on any round where a previous round's correct result came back wrong — send the
screen's **complete** stylesheet at its final values and say the listed rules
replace what exists, rather than another list of deltas. Diffs against a
stylesheet the other side is also rewriting are path-dependent: each one fixes
its named item and disturbs a neighbour, which reads to the user as churn on
work that was already approved. See `references/mentor-studio-prompt.md` §4.

**Never trust "done" — read the published result back.** Mentor's recap of
what it changed is a claim, not a fact; verify against the actual published
CSS/DOM/screen the same way Compare verifies against the spec, especially
before reporting a round finished. And once one isolated, single-property
fix has failed twice through chat-mediated rounds — even after changing the
mechanism, not just the wording — weigh handing it to the operator as a
direct edit in ODC Studio over a third round-trip; some structural
corrections are a few-second click and are not obviously more likely to land
on attempt three. See `references/mentor-studio-prompt.md` §4 for the
mechanics behind both of these.

**Reconcile has a budget: two rounds per wave.** Upstream loops steps 4 to 5 to
4 until nothing is left, which is right when reconciling costs one more MCP
call. Here every round costs a human copy/paste, a Mentor run and a publish, so
an unbounded loop is how a two-day PoC becomes a two-week one. After the second
round, stop: record the remaining differences in the wave log as accepted and
move on. The exception is a wave marked `fidelidade: demo` - a screen on the
demo path gets as many rounds as it needs, because that screen is the product.
Everything else is scenery.

**After every step completes, state what just finished and name the next
step in the cycle before doing anything else** — even when the user's last
message already tells you to continue. This is not optional narration: the
whole point of a fixed cycle is that neither the model nor the person
reviewing it has to hold "what comes next" in their head. A short line is
enough: *"Prototype approved — updating spec-w5.md and emitting the W5 prompt next."*
If the user redirects mid-cycle (a different bug to chase, a question), pick
the cycle back up at the step you were on rather than silently dropping it.

**The user can jump straight to any step** ("just fix the app, skip the
prototype" / "don't bother re-running tests") — that's a valid shortcut, not
a violation of the cycle. What breaks the cycle is *not naming* the skipped
step, so a shortcut silently becomes the new unstated default for every wave
after it.

This cycle is why `RUNBOOK.md`'s per-wave procedure (Step 6 below) is
written as prototype → approve → spec → emit → paste → publish → compare
against prototype → tests, not as a single "build the wave" instruction — and it is
why the static gate includes "screen matches the approved
prototype" as a checklist item, not just "matches the spec text."

---

## Step 0 — Spec review and PoC classification

Upstream goes straight from "share your spec" to the wave interview. That works
when the spec is your own. In a PoC factory the spec arrives from a customer and
is normally incomplete in ways that only surface at W4, when they are expensive.
Two things happen before the interview.

**Write `SPEC-REVIEW.md`** (template in `templates/SPEC-REVIEW.md`) and get an
explicit sign-off. Four lists, nothing else:

- **Ambiguities** - the question, and the reading you will assume if it goes
  unanswered. Never leave the assumption implicit.
- **Contradictions** - where the spec disagrees with itself, quoted.
- **Missing but required** - what is not in the spec and cannot be skipped: the
  auth model, the states an entity moves through, what an empty list shows.
- **Out of scope** - what you are deliberately not building, written down so the
  demo conversation cannot drift into it three days later.

Be aggressive. An ambiguity caught here costs one line; caught in W4 it costs a
wave, and in this channel a wave costs a human.

**Classify the project: PoC or final application.** Ask; do not infer it from
the word "PoC" in a filename. The classification changes real decisions:

| | PoC | Final application |
|---|---|---|
| Modules | as few as possible, usually one | proper UI / Core / integration split |
| Stubs and seed data | a feature - seed generously, stub every external boundary | debt - must be real before handover |
| Data model | derived from the screens; normalize only where it hurts | modeled first |
| Fidelity | high on the demo path, good enough elsewhere | uniform |
| Handover | `templates/POC-HANDOVER.md` | upstream pre-production checklist |

Write the classification into the RUNBOOK header. Every later judgment call
refers back to it.

---

## Step 1 — Gather inputs

Ask the following questions in order, using `AskUserQuestion` for each.
Stop and wait for the answer before proceeding to the next.

### Question 1 — The spec

> "Share your specification document (SDD, PRD, or functional spec).
> You can paste the text, share a file path, or drop an attachment."

Read it completely before continuing. Extract and note internally:
- Screen inventory (names, purpose, fields)
- Entity list and relationships
- Business rules that produce calculated values (scores, statuses, classifications)
- Exact user-facing messages and validation text — these become test assertions
- Any external integrations or AI boundaries

### Question 2 — Additional reference materials

> "Do you have any other reference documents? For example: a design system
> file, an existing data model, API contracts, or a glossary. Share anything
> that gives context the spec doesn't cover. If none, just say so."

Read whatever is provided. Note any constraints, naming conventions, or
technical boundaries that should shape the wave specs.

### Question 3 — Reference screens

> "Do you have reference screenshots or Figma exports showing the expected
> visual style? If yes, share them. If no, the plan will have limited visual
> direction."

If provided, extract:
- Color tokens (background, surface, accent colors)
- Form layout pattern (single column vs grid — is one-field-per-line the default?)
- Component patterns (list rows, badges, step indicators)
- Any existing block inventory from the target OutSystems UI version

**Before carrying any extracted color or component forward, read
[`references/outsystems-ui-design-tokens.md`](references/outsystems-ui-design-tokens.md)**
— OutSystems UI ships a complete token system (semantic color roles, a
12-hue × 7-shade ramp, an 11-step neutral scale, spacing/radius/shadow
scales, a responsive type scale) and ~90 named UI patterns. Map every
extracted brand color onto the closest real token (Section 1 of that file)
instead of carrying it forward as a raw hex value, and map every screenshot
element onto the closest named pattern (Section 6) instead of a generic
description. This is what makes a wave prompt say `Card` instead of "a
card-like container," and `--color-primary` instead of a made-up
`--accent` nothing in the platform actually reads.

If not provided, note that the wave specs will have minimal UI direction and
the zero-hex-literal gate cannot be enforced. The token reference above still
applies even with no visual direction supplied — it becomes the default
palette instead of a mapping target.

### Question 4 — The value path

> "What is the shortest sequence of actions a user needs to complete for the
> product to be useful? For example: create → process → review → finalize.
> Everything else (admin screens, reporting) can come later."

This answer sets the wave order. Value path waves come first, fully working.
Admin and reporting waves come last.

**In a PoC the value path is the demo script.** Ask for it as one: the exact
click sequence you will run in front of the customer, in order, with what
appears on screen at each step. Written that way it does three jobs at once - it
orders the waves, it decides which screens get `fidelidade: demo`, and it is the
one Playwright spec that must never go red. Keep it verbatim in the RUNBOOK.

### Question 5 — Target environment

> "Is this a new app or an existing one? And: is the app open (no login) or
> does it require authentication? If it uses the ODC Web template, it ships
> with some screens and roles already — do you know what baseline it has?"

This determines:
- Whether W0 creates the app (AppGen or by hand - never Mentor Studio, see
  "Choosing the channel per wave") or an existing app is extended
- What the module tree already contains, since every context pack has to state it
- Whether test user provisioning and a saved Playwright `storageState` are needed
- **The access level every wave's context pack must restate.** Record the
  answer once in RUNBOOK "Project facts," then carry it into every wave's
  `CONTEXT` block verbatim (see `references/mentor-studio-prompt.md` §2) and
  into guardrail 13 for any wave that creates a screen. A public-app project
  whose prompts never say so gets a login-required screen every time — ODC's
  default, not the operator's intent — see "The wave execution cycle" for how
  a Plan check catches this before publish, and the RUNBOOK per-wave
  procedure for fixing it after.

**Also ask which channels are available:** AppGen in the ODC portal, Mentor
Studio in the IDE, Mentor MCP. They are not interchangeable and every wave gets
a `canal:`.

**Also ask for the tenant's base URL** (e.g. `https://<tenant>.outsystems.app`)
and record it once in RUNBOOK "Project facts." Every published screen's URL
follows `<tenant-url>/<módulo>/<tela>`, so once this is on file the Compare
step (see "The wave execution cycle") never has to ask the operator for a URL
again — it's derived from the wave's own `Módulo alvo` and the screen name
already in the spec.

**Also ask whether the plan needs any AI agent (Agent Workbench).** If yes,
each agent is a separate Agentic App artifact, provisioned manually before
W0 (see consequence 5 under "The channel," above) with its final name fixed
up front. Note in the RUNBOOK which waves will carry a `Módulo alvo:`
section for each agent — this is decided now, not improvised at emit time.

### Question 6 — Confirm the wave proposal

After answering questions 1–4, **propose the wave breakdown** before generating
any files. Show for each wave:
- What the user will be able to click and see
- The single sentence that describes what the wave proves
- Approximate scope (entities created, actions, screens)

Then ask:
> "Does this breakdown look right? Any wave too large, too small, or in the
> wrong order?"

Adjust based on feedback. Only generate files after this is confirmed.

---

## Step 2 — Derive the waves

### Sizing rule

**Hard cap: never more than one screen per wave — no exceptions.** A wave
that touches two screens (even a trivial list + its detail view) is two
waves. This is deliberately stricter than "small waves" as a vague goal —
it's a checkable rule with no judgment call attached, which is the point:
"is this small enough" invites rationalizing a bundle ("these two screens
came from the same design decision, so they're really one unit") the way
a hard numeric cap doesn't. A list screen and its detail screen are two
waves even when they were prototyped and approved together in the same
sitting — prototype scope and Mentor-execution scope are not the same
thing, and conflating them is exactly how a wave quietly grows past what
the static gate and the compare-against-prototype step can verify in one
pass.

**Maximum per wave:** ~3–4 server actions plus the one screen. Logic-heavy
waves (scoring, multi-guard finalization) should have fewer actions than
that, not more, even though they still get only one screen.

**Minimum per wave:** one screen in any state — even a layout-only shell
with no data is a valid wave if it can be verified visually.

**Data seeds don't count against the one-screen cap, but check the total
anyway.** A wave that seeds reference data (a checklist, a lookup table)
alongside the one screen that reads it is normal and still one wave — the
seed isn't a screen. But if the seed itself is non-trivial (many records,
several entity types, business-rule-shaped data like scoring bands), treat
it as real wave weight when judging size, even though it isn't a screen or
an action in the usual sense.

### The shape that usually emerges

```
W0  App + theme    app exists, OutSystems UI theme customised, shell renders
                   (canal: appgen or manual — never Mentor Studio)
W1  Foundation     reference data seed, the first screen (layout only)
W2  First feature  data loads in that screen; create form exists and validates
W3  Core action    the main business action works end to end
W4  Review step    the human decision / override / confirmation flow
W5  Commit step    finalization, immutability, status transitions
W6+ Admin          CRUD for reference data the seed populated in W1
W…  Reporting      aggregates and dashboards
```

Commit to building through the last value-path wave. Mark admin and reporting
waves as **DEFERRED** — write their specs anyway, mark them clearly, exclude
them from the initial test run.

### Choosing the channel per wave

Mentor Studio is good at changing a module that already exists and bad at
creating structure from nothing. The first wave is therefore not a Mentor Studio
wave.

| Wave shape | Channel | Why |
|---|---|---|
| Create every ODC artifact empty, with final names (Step 0 — Provisioning) | manual | neither AppGen nor Mentor Studio should be the first thing to name an artifact other waves will reference |
| Base theme + shell on the provisioned web app | AppGen or by hand | Studio has no reliable start-from-empty behaviour; AppGen produces a coherent baseline in one shot |
| Theme refinement on an existing app | Mentor Studio | it is a variables-and-CSS edit, which Studio does well |
| One screen plus up to 4 actions | Mentor Studio | the default |
| Configuring one Agentic App (an agent's inputs/outputs/instructions) | Mentor Studio, targeting that Agentic App's own module | agents are edited the same conversational way, just in a different artifact |
| Bulk repetitive change across many artifacts | MCP, if available | pasting the same prompt eight times is not a plan |

Every wave spec states its `canal:` on the header line. A wave whose channel is
not Mentor Studio still gets a spec and a gate; it just gets no `prompts/wN.md`.

**A wave touching more than one artifact gets one `prompts/wN.md` with more
than one `Módulo alvo` section** — see consequence 5 above. Do not create a
separate `prompts/wN-agentapp.md`; one file, sectioned, keeps the wave's
"one thing to hand the operator" property intact.

### W0 — theme first, always

Every project starts by building a theme on top of OutSystems UI, before any
feature wave. Two reasons: the prototype's palette has to land somewhere real or
every later wave re-litigates it, and design direction that reaches a prompt as
"use the brand blue" produces a hex literal, which the gate then rejects. W0's
output is a theme whose variables later prompts refer to **by name**, and a shell
that renders.

**Those variables are the platform's own, not invented ones.** Read
[`references/outsystems-ui-design-tokens.md`](references/outsystems-ui-design-tokens.md)
before writing W0's theme table. OutSystems UI already ships `--color-primary`,
`--color-secondary`, `--color-success/-warning/-error/-info` (+ `-light`
variants), an 11-step `--color-neutral-0..10` ramp, a 12-hue × 7-shade color
system, and spacing/radius/shadow/typography scales — every native widget in
the app already reads these. W0's theme table says *which brand value
overrides which platform token* ("`--color-primary` → `#0e8873`," not
"`--accent` → `#0e8873`"). Inventing a parallel `--accent`/`--danger`/
`--neutral-soft` set instead means the brand looks right only on the screens
this project's prompts happened to touch, and silently wrong (default
OutSystems blue) on every native component and every screen a future wave
adds without rereading this file. The one legitimate exception: a role the
platform genuinely has no token for — note that explicitly in the theme
table rather than silently adding a variable.

**W0 has two parts, and the second one is a Mentor Studio prompt, not just
AppGen.** Part 1 (manual/AppGen): create the app on the artifact provisioned
in Step 0, base OutSystems UI theme, shell/nav that renders. Part 2 (Mentor
Studio, `prompts/w0.md`): apply the actual theme tokens and, critically,
**build a permanent "Tema & Identidade Visual" screen** — color swatches
labeled with their token name (not just the swatch), a contrast check
between text and background pairs, a typography specimen (each face/weight
in use), the icon set, and every reusable state (button variants, status
pills, badges) rendered side by side. This is what gives W0 the same
"something a human can click and verify" property every other wave has —
without it, W0's gate is entirely a human's word that the theme "looks
right," which is exactly the kind of unverifiable wave the core principle
forbids. Keep this screen in the app permanently (a `/tema` route reachable
by URL, or a sidebar item if the project's IA allows it) — it earns its keep
again every time a later wave's Compare step needs to check a color or a
component state against the source of truth instead of eyeballing it.

**The living prototype gets the same screen, and gets it first.** Before
building any feature screen in the prototype, build its Tema/Identidade
Visual screen using the same tokens documented in the RUNBOOK's theme
table (see Step 6) — this is what Question 3's palette decision (see Step
1) graduates into once approved, and it is the reference every subsequent
prototype screen is built against for consistency.

From W1 on, design direction in a wave prompt names the native OutSystems UI
block it maps to (`Card`, `Tabs`, `ListItem`, `Columns2`), never a generic
description. A prompt that says "a card-like container" gets a `<div>`; one that
says `Card` gets a `Card`.

**"Apply the tokens to the shell" is too vague to act on — name the actual
selectors and the actual numbers.** OutSystems UI's shell chrome (the sidebar,
its nav items, the content area's width cap) is styled by the framework's own
classes and its own CSS variables (`.app-menu-content`, `.app-menu-links a`,
`--side-menu-size`, `.ThemeGrid_Container` with its own default `max-width`) —
none of which resemble the project's theme variable names. A CHANGES item that
says "apply the theme to the sidebar and content area" without naming which
framework selector to override and what value to set gets read as "leave the
framework defaults alone and only style what's explicitly named" — which is a
reasonable, cautious reading (guardrail 10 says stop rather than improvise),
and it means the shell stays completely unthemed while every custom class the
prompt did name gets built correctly. Two box-model facts belong in every
W0 prompt's `LAYOUT FACTS`, sourced from the spec's Screen layout section, not
left implicit: the sidebar's fixed width in px, and the content area's
max-width in px (state it as "override the framework's default container
max-width, currently narrower than this" — otherwise the prompt reads as
additive styling on top of a default that was never flagged as wrong).

### Data model rule

Create all entities needed for the value path by the end of W2. Later waves
add logic and screens only, never new entities. This lets every wave spec say
"no data model changes" — a verifiable gate.

### Naming user-defined actions

Never name an action `Create<X>`, `Get<X>`, `Update<X>`, or `Delete<X>` where
`X` is the name of an entity — ODC's implicit CRUD action silently blocks it
with no error. Use `RegisterX`, `NewX`, `OpenX`, `CommitX` instead.

---

## Step 3 — Write the wave specs

One file per wave. Each file follows this structure:

```
## W<N> — <short name>

`canal: appgen | mentor-studio | manual` · `fidelidade: demo | secundária`

### What this wave proves
One sentence. What can a human do and verify after this wave is published?

### Scope
- Creates: [entity list, action list, screen list]
- Consumes (must not alter): [what earlier waves built]
- No data model changes: [yes/no]

### Screen layout
**Approved visual reference**: HTML prototype link (Artifact URL) +
which tab/state this screen is on. This is the primary reference — the
pruned markup and CSS for this screen go verbatim into `prompts/wN.md`; there is no
image channel (see "The channel"). An ASCII sketch may follow as a quick summary of field grouping, but it is never the sole
reference; if a prototype does not exist yet for this screen, one must be
built and approved (see "The prototype-first principle") before this
section is written. Explicitly say how form fields are grouped — e.g.,
"date and code on the same row, never one field per line" — and call out
any gate-worthy visual rule the prototype embodies (grid layout, which
fields span full width and why, native input types like date pickers).

**Box model facts (mandatory, read from the prototype's CSS, not from the
image)**: for every container that must not fill-parent, state its
max-width/width in px explicitly (e.g. "the form card caps at 640px — it
must NOT stretch to the content area's full width, which is a different,
larger number"); for every pair of elements that must stack as separate
blocks, say so explicitly even if it looks obvious in the markup; for
any flex child that must shrink below its content's natural width, name the
container and require `min-width: 0`. State them in prose even though the markup
is embedded in the prompt — the redundancy costs three lines and Mentor follows
a written constraint more reliably than it infers one from CSS. These three
facts do not survive a prose-only prompt — see "The prototype-first
principle" above and `references/prototype-to-widgets.md` for the recurring
failure modes behind each of these three facts.

**Before writing the Mentor prompt, check `references/recipes.md` for the
UI pattern this wave is building.** Fourteen recurring patterns — a
dropdown with an "all"/empty option, a modal containing a form, a sticky
footer, per-row list controls, bulk-save actions, icon+label link
wrapping, reserved theme class names, MasterDetail, appearance resets,
external fonts, and more — have copy-paste prompt blocks there that
already encode the fix for every mechanical gap hit building that pattern
the first time. Use the recipe verbatim (adjusted for names) instead of
re-describing the pattern from scratch — a natural-language description
of the same pattern is exactly what produced the multi-turn fixes
`recipes.md` now exists to prevent.

### Actions
[For each action: name, inputs, outputs, exact error messages verbatim]

### E2E test cases
[Numbered list: W<N>-01, W<N>-02, etc.]
- W<N>-01: [what is navigated, what is asserted] — happy path
- W<N>-02: [guard or validation being tested]
- W<N>-03: [visual / layout assertion]

### Out of scope
[What the next wave owns. Be explicit — this is how Mentor stays in bounds.]
```

**Rules for writing specs:**

- Set `fidelidade: demo` only for screens on the demo script. Those get an
  unbounded reconcile loop and a case in `demo.spec.ts`. Everything else is
  `secundária`: two reconcile rounds, then accept the diff and log it.
- Set `canal:` deliberately. Only `mentor-studio` waves get a `prompts/wN.md`.
- Quote every user-facing message verbatim. "Invalid format. Please upload a PDF." not "a validation message."
- Mark every `Text` field that must be truly unbounded — Mentor silently creates them as `Text(50)` otherwise.
- The out-of-scope section must name what the previous wave owns (so Mentor cannot helpfully rebuild it) and what the next wave will own (so it does not build ahead).
- Write a `§10 — If this wave stalls` section naming where to split the wave if Mentor times out (~30 min without a terminal state).

---

## Step 4 — Write the test files

One `tests/wN.spec.ts` per wave, with test IDs matching the spec (`W2-01`, `W2-02`).

Key rules:

- `playwright.config.ts` must set `testIdAttribute: 'data-test'` — Playwright's default is `data-testid` which OutSystems never sets. This must live **inside `use: {}`**, not at the config's top level — a top-level `testIdAttribute` is silently ignored by current Playwright (no error, no warning), and every `getByTestId(...)` in every spec then matches zero elements. This is easy to reintroduce by hand-writing a config instead of copying `templates/playwright.config.ts`, which already has it in the right place — when in doubt, run one spec that calls `getByTestId` and confirm it actually finds the element before writing the rest of the suite.
- `fullyParallel: false`, `workers: 1` — waves share one environment.
- `reporter` must include `['html', { open: 'never', outputFolder: 'playwright-report' }]` alongside `['list']` — `list` alone only prints to the terminal, and terminal output is not evidence once the turn scrolls away. The HTML report (with screenshots and traces on failure) is what makes "5 passed" a checkable claim instead of a summary someone has to trust. It's overwritten by the next run of the same project — if the user wants a specific run preserved across future runs, that's a separate ask (copy the folder, or init git and commit it), not something to assume.
- All locators and all verbatim messages live in `support/selectors.ts`. A UI rename is one edit.
- Prefer accessible role + visible text. Never target generated OutSystems DOM ids — they change on republish.
- For negative RBAC: assert controls are **absent**, not disabled.
- Log in once by hand and save Playwright's `storageState`; every spec reuses it
  through `support/fixtures.ts`. Re-authenticating per test against the ODC login
  screen is slow, flaky, and the first thing that will break the suite.
- Keep one `demo.spec.ts` replaying the demo script end to end, separate from the
  per-wave specs. It is the only suite that must be green before the PoC is shown
  to anyone; per-wave specs are allowed to carry accepted diffs.

**Known OutSystems selector pitfalls** (write tests to avoid these from the start):

- `LayoutSideMenu` sidebar entries have ARIA role `menuitem` inside `menubar`, not `link`.
- The platform `Upload` widget's label is not wired to its `<input>` — use `input[type="file"]` by position, not `getByLabel`.
- `Title` widget renders a `<span>`, not a heading — `getByRole('heading')` never matches it.
- `TableRecords` `data-test` attributes land on `<td>` cells, not `<tr>` — locate rows via `page.locator('tr').filter({ hasText })`.
- A data-driven dropdown defaults to its placeholder — always call `selectOption({ label })` before asserting the happy path.
- Status badges bound to the wrong column show the English `Label` instead of the PT-BR `LabelPtBr` — assert the exact localized string.
- `getByRole('radio'/'checkbox'/'button', { name })` matches by substring by default — two options where one's label is a prefix of another's (e.g. "Não" / "Não se aplica") resolve to 2 elements and throw a strict-mode violation. Pass `{ name, exact: true }` whenever any two option labels in the same group could overlap as substrings.
- A helper function that clicks a button which triggers navigation must wait for that navigation to actually land (`page.waitForURL(...)` or wait for a locator unique to the destination screen) before returning — a caller that does `const url = page.url()` immediately after calling the helper can capture the pre-navigation URL if the helper returns before the redirect completes, then silently operate on the wrong screen for the rest of the test.
- When manually verifying a reactive OutSystems screen's behavior via browser automation (not through Playwright's own `.click()`, which is a trusted event) — e.g. probing a bug hypothesis with `element.click()` or dispatching synthetic `input`/`change` events via `page.evaluate` — expect those synthetic events to update the DOM's local `checked`/`value` state but **not** reliably fire the framework's own reactive `OnChange` binding. A synthetic click can look like a repro failure (or success) that has nothing to do with the app: confirm any finding from synthetic interaction with a **real** click (via a genuine pointer-driven click tool, or Playwright's own `.click()`) before reporting it as a bug.
- When a wave's prototype introduces a new dynamic visual block (counters, computed labels, status pills) that a test will need to assert on, put explicit `data-test` attribute names for its pieces directly in the Mentor prompt. Without it, Mentor names elements after its own internal widget IDs (e.g. `#ClassificacaoPill`, `.audit-resumo-score-val`) that only surface after the fact via DOM inspection — working, but an avoidable extra round-trip.

**Tests are written into the spec but executed separately.** When a wave is
implemented and published, ask:

> "Wave N is published. Do you want to run the E2E tests now, or continue to
> the next wave first?"

Never auto-run tests. The user decides when.

**After running tests, record the evidence, not just the tally.** In the
wave's `logs/wN.md`, write the actual pass/fail count AND the path to the
generated `playwright-report/index.html` for that run (note explicitly that
it is overwritten by the next run in the same project — this is expected,
not a gap, as long as it's stated). A bare "3/3 passed" sentence with
nothing backing it is exactly the kind of claim that erodes trust once
someone asks "how do you know" — see the wave execution cycle's Test step.

---

## Step 5 — Create execution-log.md

Create `execution-log.md` in the project folder alongside RUNBOOK.md.
Seed it with the project header and an empty entry for W1:

```markdown
# Execution log — [Project name]

Started: <!-- fill with `date "+%Y-%m-%dT%H-%M-%S"` at first session -->

---
```

At the **start of each wave** (before pasting the prompt), run:
```bash
date "+%H:%M:%S"
```
Store the result as `<started>`.

At the **end of each wave** (after gate passed and tests decision made), run:
```bash
date "+%H:%M:%S"
```
Store the result as `<finished>`.

Then append one entry in this exact format — nothing more:

```markdown
## W<N> — <name>  |  <started> → <finished>
- Prompt: prompts/w<N>.md (<N> lines), canal <x> — pasted once
- [Plan check: <one line — what was corrected before Mentor executed>]
- [Re-prompt <n>: <one line: what was missing or wrong in the prompt>]
- [Deviation: <what Mentor did instead> → <how resolved>]
- Compare: <N> differences — <N> reconciled, <N> accepted (fidelidade <x>)
- Gate: PASS | FAIL (<reason>)
- Tests: <N>/<N> pass [(<IDs> deferred — <reason>)]
- Status: DONE | BLOCKED (<reason>)
```

Lines in `[brackets]` are optional — include only when something actually
happened. A clean wave is four lines. A messy wave names what was messy.

**What belongs in the log:**
- Every paste and every re-prompt, with a one-line reason for the re-prompt
  (this is the raw material for the retrospective that improves the prompts)
- Every plan-check correction, with what was wrong in the plan before it ran —
  the cheapest signal available that a prompt's wording, not Mentor, caused it
- Differences Compare found, and which ones were accepted instead of fixed
- Every deviation from the spec and its resolution (one line each)
- Gate verdict and test result
- Known gaps that carry forward

**What does not belong:**
- Intermediate poll results
- Reasoning about why a step was taken
- Restating what a tool returned
- Anything git already records

## Step 6 — Write RUNBOOK.md

The RUNBOOK is the operator's guide. It is generated once at plan creation and
updated as waves execute. It contains:

1. **Resumption pointer** — `## Current wave` updated to the active wave before each fire
2. **Project facts** — classification (PoC or final application), the demo script verbatim, and the **provisioned artifacts table**: one row per ODC artifact (web app, each Agentic App) with its fixed name and which waves carry a `Módulo alvo:` section for it. Every artifact in this table must exist, empty, before W0 starts (Step 0 — Provisioning).
3. **Wave table** — name, scope summary, committed vs deferred, status
4. **Living prototype pointer** — the Artifact URL of the cumulative HTML
   prototype (see "The prototype-first principle"), plus a one-line rule:
   no wave's Mentor prompt fires without an approved prototype screen for
   it, and no prototype change ships without being written back into the
   wave's spec.
5. **Per-wave procedure** — prototype/evolve the wave's screen(s) in the
   living prototype → get user approval → update `spec-wN.md` Screen layout
   from the approved prototype → emit `prompts/wN.md` and show it for the
   operator to paste into Mentor Studio → operator publishes and reports back
   → manual static gate (module-tree read-back) → compare against the
   prototype → reconcile within budget → ask about tests
6. **Mentor prompt guardrails** — prepended to every Mentor prompt, every wave
7. **Static gate checklist** — entity, action and screen counts read back from the ODC Studio module tree by the operator, zero hex literals, no unauthorized roles, **screen matches the approved prototype** (layout, grouping, negrito/weight, dynamic vs static text — verify by opening the published screen and comparing, not by re-reading the spec). **For any screen rendering a repeated list of rows with a selectable control per row** (radio group, dropdown, checkbox — an audit checklist, a survey, a set of per-item toggles): interact with the control in **two different rows**, not just one, and confirm the first row's selection survived the second row's click. A single-row test cannot catch a control accidentally bound to one shared screen variable instead of a per-row list attribute — that bug makes every row mirror whichever row was clicked last, and looks completely correct if only one row is ever touched during verification (see `references/prototype-to-widgets.md` #15).
8. **Failure playbook** — what to do when things go wrong
9. **Timing log** — one row per milestone, cumulative across waves
10. **Never list** — absolute prohibitions

### Mentor prompt guardrails

Every Mentor prompt, every wave, must be prepended with these guardrails
verbatim. Write them into the RUNBOOK under a `## Prompt guardrails` section
so they are never forgotten:

```
GUARDRAILS (apply to every screen and action in this wave):

1. No hex literals. Every color must be one of OutSystems UI's own theme
   tokens (`--color-primary`, `--color-error`, `--color-neutral-N`, a hue
   from the 12-hue ramp, etc. — see references/outsystems-ui-design-tokens.md),
   overridden with the brand's value, never a project-invented variable name.

2. CSS token declared ≠ CSS token applied. After declaring variables in the
   theme stylesheet, you must also set `background-color`, `color`, and
   `border-color` on `.form-control`, `.dropdown-display`, `input`, `select`,
   `textarea`, and the Upload widget's control element, with enough specificity
   to override browser UA defaults. Without this step, form inputs render with
   a white background even when the variable is correctly defined.

3. Forms use a multi-column grid — never one field per line. Group related
   fields on the same row. Use `Columns2`, `Columns3`, `ColumnsSmallLeft`, or
   `ColumnsSmallRight` blocks. The default vertical stack from the Form widget
   is not acceptable.

4. Action flows must be readable top-to-bottom without zooming. Do not place
   two assignments, conditions, or calls at the same vertical coordinate.
   Space each node so its label is fully visible and individually selectable.
   Overlapping nodes are a defect, not a style choice.

5. Use verified OutSystems UI block names only — no bare HTML elements. See
   references/outsystems-ui-design-tokens.md Section 6 for the canonical
   pattern inventory before naming or describing anything.

6. ODC terminology only: no "Service Studio", no "eSpace".

7. Add every `data-test` attribute listed in the wave spec, spelled exactly.

8. The approved prototype's markup for this screen is included verbatim below,
   under PROTOTYPE MARKUP. It is the primary layout reference. Match it,
   including whether elements stack on separate lines (block) or share one line
   (flex row). Translate it into OutSystems UI blocks: do not paste raw HTML
   into the screen, and do not invent structure the markup does not have.

9. State the box model in words as well, even though the markup is right there:
   (a) any element that must NOT fill its parent width — name it and give the
   exact max-width in px (every OutSystems UI container defaults to fill-parent,
   so "don't stretch" is always opt-in), (b) which sibling elements stack as
   separate blocks vs. share a row, and (c) any flex child that must shrink
   below its content width (name the container, require `min-width: 0`).

10. Scope is absolute. Do not create, rename or delete anything listed under
    DO NOT TOUCH, and do not build ahead into the next wave. If something here
    is impossible, or contradicts what is already in the module, stop and say so
    instead of improvising a workaround. There is a human reading your answer
    who can re-plan in a minute; a silent improvisation costs a full
    compare-and-reconcile round to even discover.

11. If this wave calls an AI agent (Agent Workbench), the call MUST be
    asynchronous via the ODC event mechanism (publish/subscribe) — never a
    synchronous call that blocks the UI waiting for the agent's response.
    The screen must reflect a "processing" state until the completion event
    is received.

12. If this prompt has more than one `Módulo alvo:` section, paste each
    section into that artifact's own Mentor Studio session — never paste a
    web-app section into an Agentic App's session or vice versa. Each
    section is otherwise self-contained and independently gated.

13. Every screen this wave creates must state its access level explicitly —
    `Everyone` (public, no login) or the specific role(s) required, per the
    project's authentication model recorded in RUNBOOK "Project facts."
    A screen never inherits the right access level by default: ODC creates
    new screens as login-required unless told otherwise, so a public-app
    project that never says so in the prompt gets an authenticated screen
    every time.
```

---

## Checklist before handing the plan over

- [ ] Every `PROTOTYPE MARKUP` block carries the CSS rule for every class and
      shell-level selector it uses, not HTML alone — HTML without its CSS is
      a guess wearing the right tag names (see `references/mentor-studio-prompt.md` §3)
- [ ] Every UI wave has an approved prototype screen, and its spec's Screen
      layout section was derived from that approved screen, not written first
- [ ] After publish, the live screen was compared against the prototype
      directly (open both side by side) — not just checked
      against the spec's prose description, which is where subtle misses
      (stacking vs inline, font weight, static vs dynamic text) slip through
- [ ] Every wave ends with something clickable — no entity-only waves
- [ ] Every wave spec has a "What this wave proves" sentence
- [ ] Running totals are consistent across all specs and RUNBOOK
- [ ] All verbatim messages in specs appear in `support/selectors.ts`
- [ ] Each spec names what its neighbouring waves own
- [ ] Each spec has a split point for if it stalls
- [ ] Test IDs in specs match the `.spec.ts` files exactly
- [ ] RUNBOOK has the failure playbook and never list
- [ ] SPEC-REVIEW.md exists and its assumptions were signed off
- [ ] The project is classified PoC or final application in the RUNBOOK header
- [ ] Every `mentor-studio` wave has a `prompts/wN.md` under 200 lines per fence
- [ ] Every wave has `canal:` and `fidelidade:` set deliberately, not defaulted
- [ ] The demo script is in the RUNBOOK verbatim and covered by `demo.spec.ts`
- [ ] Every `prompts/wN.md` prompt is a single self-contained fenced code block per `Módulo alvo:` (guardrails included inline) — no prose the operator must merge in before pasting, and every non-prompt line outside a fence is marked `> **Nota do operador (não copiar):**`
- [ ] Step 0 — Provisioning has no wave number and no row in the wave table — it is its own RUNBOOK section only
- [ ] W0's theme table maps brand colors onto real OutSystems UI tokens (`--color-primary`, `--color-neutral-N`, etc. — see references/outsystems-ui-design-tokens.md), not invented variable names
