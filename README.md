# outsystems-plan

An AI skill for planning OutSystems projects built with ODC Mentor.
Guides you from a blank folder to a complete build plan through a short
interactive interview — and, since v0.2.0, through executing each wave
via a fixed **prototype-first cycle**: every screen is built and approved
as an HTML prototype *before* Mentor ever touches it, and the published
result is compared against that prototype (not just re-read against the
spec) before a wave is considered done.

---

## What it produces

Running `/outsystems-plan` in any project folder creates:

```
RUNBOOK.md          execution guide — wave order, gates, failure playbook
execution-log.md    one entry per wave: turns, deviations, test results
spec-w1.md          wave 1 spec (what to build + E2E test cases)
spec-w2.md          wave 2 spec
…
tests/
  playwright.config.ts
  package.json
  .env.example
  support/selectors.ts   all locators and PT-BR messages in one place
  support/fixtures.ts    one Page per role
  w1.spec.ts
  w2.spec.ts
  …
  files/README.md
```

---

## Installation (once)

```bash
git clone <this-repo> outsystems-plan
cd outsystems-plan
mkdir -p ~/.claude/skills/outsystems-plan
cp skill/SKILL.md ~/.claude/skills/outsystems-plan/SKILL.md
cp -r skill/references ~/.claude/skills/outsystems-plan/references
```

To confirm it installed, open any Claude Code session and type `/outsystems-plan`.
You should see the skill offered.

---

## Starting a new project

```bash
mkdir my-project
cd my-project
claude
```

Inside Claude Code:

```
/outsystems-plan
```

The skill asks 6 questions in order:

1. **Specification** — paste text, give a file path, or attach the document
2. **Additional reference materials** — design system, data model, API contracts, glossary (or skip)
3. **Reference screens** — screenshots or Figma exports showing the visual style (or skip)
4. **Value path** — the shortest sequence a user needs to complete for the product to be useful
5. **Target environment** — new or existing app, open or authenticated
6. **Wave breakdown review** — the skill proposes waves; you confirm or adjust

After confirmation, all files are generated in the current folder.

---

## Executing the plan

Follow `RUNBOOK.md`. Each wave follows the same fixed six-step cycle —
skip a step only if you explicitly say so; the skill will otherwise name
the next step before doing anything else:

```
1. Prototype    — build/evolve the screen(s) in the living HTML prototype
2. Approve      — you sign off on the prototype change explicitly
3. Execute      — spec updated from the approved prototype; Mentor fires
                  with box-model facts in the prompt (not just a picture);
                  publish
4. Compare      — the published screen is opened next to the approved
                  prototype and every difference is listed — not just the
                  first one found
5. Reconcile    — each difference gets fixed in the app (usually) or in
                  the prototype/spec (if that was the actual oversight),
                  then back to step 4 until nothing's left
6. Test         — E2E cases updated for what changed; skill asks "run
                  tests now?" — never auto-runs; evidence (an HTML test
                  report, not just a pass/fail tally) gets logged
```

A wave isn't done because Mentor said `change_applied: true` — it's done
after step 4 finds nothing left to reconcile and step 6's tests pass.

---

## The prototype-to-widgets reference

`skill/references/prototype-to-widgets.md` is a short conversion guide the
skill loads before writing a wave's Screen layout section or a Mentor
prompt. It exists because step 4 of the cycle above (Compare) keeps finding
the same handful of bug shapes, over and over, across unrelated projects —
not typos, but places where an HTML prototype's CSS says one thing and the
OutSystems UI default says another, and nothing in a screenshot signals the
mismatch:

- a layout's `Title` and `Header` placeholders sit in different regions of
  the top bar, not stacked — content meant as a subtitle *inside* the title
  block ends up next to it instead
- every non-Column container defaults to fill-parent; a prototype's
  `max-width` cap doesn't survive into the prompt unless it's stated as a
  number
- flex children don't shrink below their content width by default —
  dynamic text wraps early with no visual cue in the reference screenshot
- `MarginLeft: Adaptive` silently offsets sibling text widgets from each
  other
- five class names (`sidebar`, `header`, `content`, `main-content`,
  `footer`) collide with the platform's own theme rules
- a prototype's own invented CSS variables work but don't propagate the
  way overriding OutSystems UI's *canonical* variables does
- a "click a row, see a detail view" pattern is sometimes just the
  `MasterDetail` block, not something to hand-build

Each entry states the failure mode and what to say in the prompt to avoid
it — it's an accumulated-bugs list, not a full OS UI catalog. For anything
outside these recurring cases, it points to `outsystems-design-to-app`'s
deeper reference library. Read it once per wave, before the screenshot goes
into the prompt — that's the whole workflow.

---

## The recipes reference

`skill/references/recipes.md` is the companion to the lessons file above:
where `prototype-to-widgets.md` explains *why* a mechanical gap happens,
`recipes.md` gives the copy-paste prompt block that already encodes the
fix — for recurring UI patterns like a dropdown with an "all"/empty
option, a modal containing a form, a sticky footer, per-row list
controls, bulk-save actions, icon+label link wrapping, reserved theme
class names, `MasterDetail`, appearance resets, external fonts, dumping
every CSS rule that currently matches an element before writing a fix
prompt for it, and retiring an old stopgap in the same turn a real fix
replaces it. Check it before writing a Mentor prompt for any UI pattern
the wave is building — a recipe used verbatim (names adjusted) skips the
multi-turn trial-and-error a natural-language description of the same
pattern tends to produce.

---

## Updating the skill

When you improve the skill (fix a bug, add a lesson learned, refine the interview):

```bash
# 1. Edit the source
code skill/SKILL.md

# 2. Bump the version in the frontmatter (semver: patch / minor / major)
#    version: "0.1.0"  →  "0.1.1"

# 3. Sync to your local Claude skills folder
cp skill/SKILL.md ~/.claude/skills/outsystems-plan/SKILL.md
cp -r skill/references ~/.claude/skills/outsystems-plan/references

# 4. Commit
git add skill/SKILL.md skill/references
git commit -m "skill: <what changed and why>"

# 5. Tag if it's a stable release
git tag v0.1.1
git push && git push --tags
```

### Version meaning

- **patch** (0.1.x) — fix a wrong instruction, add a missing pitfall
- **minor** (0.x.0) — new interview question, new template section, new output file
- **major** (x.0.0) — the process changes in a way that makes old plans incompatible

---

## Repository structure

```
skill/
  SKILL.md              the AI skill — this is what gets installed
  references/
    prototype-to-widgets.md  HTML/CSS → OutSystems UI conversion guide,
                              built from real recurring translation bugs
                              (box model, class-name mismatches, platform
                              defaults) — read before writing a wave's
                              Screen layout section or a Mentor prompt
    recipes.md                copy-paste Mentor prompt blocks for
                              recurring UI patterns, each one already
                              encoding the fix for a gap documented in
                              prototype-to-widgets.md
templates/
  RUNBOOK.md            base for every project's execution guide
  spec-wave.md          template for each wave spec
  playwright.config.ts  correct testIdAttribute for OutSystems
  package.json
  .env.example
  tests/
    support/
      selectors.ts      locator patterns + verbatim message store
      fixtures.ts       role-based page fixtures
    files/README.md
    README.md
README.md               this file
```

---

## Versioning history

| Version | What changed |
|---|---|
| 0.13.0 | Lessons contributed from a separate multi-wave project, generalized and deduplicated against the existing reference set. `prototype-to-widgets.md` #28–#45: a "duplicate record" action echoing copied fields client-side without persisting them; a field that looks blank from a text/background contrast collision; a CSS fix to the platform's responsive shell breaking the other half of it at an untested width; sibling-record switching leaving one UI block on stale state; an edit toggle appending the form instead of replacing the view; `display: none` on a wrapper disabling a fixed-position component inside it; two breakpoint rules leaving an exact-pixel dead zone (find it by bisection); a placeholder string "fixed" by rewording instead of implementing (specify the DOM shape); Edit/Save/Cancel buttons present with no edit mode behind them; a list-item `data-test` landing on the wrapping container; a dropdown showing an option while its variable still holds `EmptyValue`; Mentor replacing, not combining, an existing `Visible`/`Enabled` condition; native `<select>` popups ignoring a dark theme; `color-scheme: dark`; resizing the side menu via `--side-menu-size`; icon weight classes rendering empty without their font; one unclosed CSS rule swallowing every later rule via CSS nesting; measuring at a real desktop width because OutSystems UI's breakpoint rules override below ~1024px. `backend-and-data-gotchas.md` #15–#19: `Identifier` vs `Long Integer` comparisons returning zero rows (compare as Text); read the raw FK data after the first comparison fix changes nothing; Advanced SQL dialect (Postgres for internal-only entities, ANSI-92 with any external one); break a stalled 2–3-round diagnosis loop with a prescriptive rewrite; check whether your own verification changed the data before calling it a regression. `architecture-recipes.md`: a cross-asset request/response is a Service Action out and the owning asset's own **Public** event back (no asset can trigger another's event; events and Service Actions default to private). `recipes.md`: 14 new recipes — platform-shell CSS fixes, edit-toggle replace-not-append, per-item `data-test` (and the `TableRecords` over-count), idempotent seed extension, style-vs-click gating per row, joined-entity dropdown labels, success messages that verify the write, a zero average rendered as "—", combined period keys decomposed for display, an empty filter parameter treated as a filter, role-aware redirects beyond login success, E2E state changes that read the current value first, Playwright `baseURL` trailing slash, `newContext()` inheriting `storageState`. `SKILL.md`: new "Prompt content rules" (self-contained prompts, name the applicable pitfalls, CHANGES self-consistency, bake in proven patterns, combine rather than replace conditions); guardrail 10 (explicit access level per screen — ODC defaults to login-required); static gate checks stale nav links on every wave that adds a screen; E2E rules on `testIdAttribute` placement, `baseURL`, `hasText` collisions, list-item `data-test` counts, the `TableRecords` platform limit, forced state changes and anonymous contexts. `templates/playwright.config.ts` now ships the HTML reporter `SKILL.md` already required, and normalizes `baseURL`. |
| 0.12.1 | `backend-and-data-gotchas.md` grows from 7 to 14 lessons, accumulated across several live-debugging sessions on the same project: (#8) a cascading fallback ("try A, else B, else C") modeled as one `OR`-combined aggregate filter doesn't behave like sequential tries, and a `MaxRecords=1` "pick any match" query with no `ORDER BY` is non-deterministic the moment more than one row can match; (#9) ODC Reactive Web has no native `Timer` widget — client-side polling needs plain JS, and anchoring its state to a container with a conditional `Visible` silently kills the loop when that container unmounts; (#10) a screen aggregate's `OnAfterFetch` can be unbound or bound to the wrong action — a `200` fetch response proves nothing about whether anything reacts to it; (#11) `BinaryData` attributes can corrupt on the ODC persistence round-trip for real-sized files while a tiny fixture never reproduces it — extract at upload time instead of re-reading the stored binary; (#12) an E2E fixture picked for minimum size can systematically mask that exact class of bug — use a real-sized file; (#13) a guard added to a shared Server Action can be broad enough to regress a sibling flow that shares the trigger condition but not the requirement (a presence-of-data check firing for every document `Tipo`, not just the one it was meant for); (#14) an entity without `UpdateBehavior = Full` can silently drop a field a Server Action clearly assigns, with 0 errors and a normal success toast — confirmed by comparing two sibling status fields meant to reach a terminal value together, where one entity's update landed and the other's didn't. Lesson #7 also gains a paragraph on the write-path/read-path variant of the same missing-guard pattern: a business-rule filter correct on the action that decides what to persist can still be missing from a sibling aggregate that decides what to display for the same record. `SKILL.md`: running tests after a wave is approval for that wave's own spec only, never the full suite by default — and a message that merely raises the topic ("e2e?") is not approval to run anything; confirm scope before broadening. |
| 0.12.0 | Adds a new reference file, `references/architecture-recipes.md`, one level up from `recipes.md`/`backend-and-data-gotchas.md`: structural asset-boundary decisions made at wave-scoping time, not UI fixes or Server Action gotchas. First recipe: **an agent must not be coupled to the project that calls it** — an AI/LLM capability's own logic (prompt, model call, response parsing) belongs in its own independent asset (this tenant's native `AIAgent` type, confirmed to exist as 21 already-published, app-independent assets via `context_agents`), never as server actions inside the calling WebApplication's own OML; the calling app gets exactly one thin, generic integration action per capability. `SKILL.md`'s wave-sizing section now points here before deriving waves for any capability that calls an AI model, so this gets caught at scoping time rather than after a spec is written. Prompted directly by the user reviewing this project's own deferred W20 ("IA — sugestões") wave and wanting the principle captured before subdividing it. |
| 0.11.0 | Adds a 7th step to the wave execution cycle, **Distill**: before closing a wave, evaluate whether anything hit during it is a new, generalizable lesson — and if so, don't just append it to `recipes.md`/`prototype-to-widgets.md`/`backend-and-data-gotchas.md`. Re-read the existing lessons/recipes the new finding is adjacent to first (a fresh discovery can invalidate or narrow an older one, not just sit next to it), propose the change in conversation, and wait for explicit user go-ahead before editing any reference file — never rewrite the skill's own references silently as a side effect of finishing a wave. Direct response to user feedback: "evite empilhar lições que sejam inconsistentes e incongruentes" — the 0.10.0 coherence pass fixed a case of this after the fact; this step makes the same review a standing part of every wave instead of a one-off cleanup. |
| 0.10.0 | Coherence pass, not just new lessons, after a multi-day live-bug marathon (5 root causes + 1 regression fixing a "drill-down shows only the score" bug) surfaced that `recipes.md` already documented the fix for the #1 root cause and the periodic-data-wipe practice — before writing anything new, the whole reference set was reviewed for what today's findings should update, not just append to. Changes: (1) split backend/data/Mentor-process lessons out of `prototype-to-widgets.md` (old #23, #24, #29, #30, #31) into a new `references/backend-and-data-gotchas.md`, restoring `prototype-to-widgets.md` to its intended HTML/CSS/DOM-only scope (renumbered #23–#27); (2) `backend-and-data-gotchas.md` adds 2 new lessons — a broad rewrite that regresses a previously-good, measured state is often faster to revert than to debug further; the same guard/fix must be replicated in every Server Action calling the same lower-level dependency, not just the first one found — plus extends the existing "0 errors, applied" lesson with a second-order finding: publish-then-verify is necessary but not sufficient when a fix touches a shared code path, since a fix can pass "0 errors," publish clean, AND survive a manual reproduction of the reported symptom, and still be regressive — only a full regression suite catches that; (3) `recipes.md`'s redundant-active/status-field recipe now explicitly branches "writing a new writer" vs. "debugging a wrong-version-in-use symptom," and states that when debugging, the real fix is almost always in the *reader*, not in whichever writer happens to be freshest in context; (4) `recipes.md` adds a new recipe for wiping and recreating all test data periodically as functionality evolves, not only once something is already broken; (5) `SKILL.md` adds an explicit callout that `recipes.md`/`prototype-to-widgets.md`/`backend-and-data-gotchas.md` apply to live-debugging an already-built app, not only to authoring a new wave's Mentor prompt — most of their content originated from debugging sessions in the first place. |
| 0.9.0 | Two new `prototype-to-widgets.md` entries (#31–#32) from a multi-day production debugging marathon: (1) a Mentor "0 errors, applied" claim proves nothing about the published app — three stacked, mundane causes (unpublished-session invisibility to context tools, a 60–90s Context Service indexing lag after a genuine publish, and one real OML-corruption bug that only surfaces as a `publish_status` error code) can each look exactly like "Mentor is broken"; the fix is always publish-then-verify against `app_revisions`, wait for indexing, and read the actual publish error — never Mentor's own summary text. Also documents a tenant's Mentor tool surface silently migrating mid-session from the legacy `mentor_start`/`publish_start` API to the session-based `mentor_start_session`/`mentor_publish` "IDE Service" API, and that a full `/mcp` reconnect (not just reauth) is required before the new tools appear. (2) `max-width` on a flex item does nothing without `width: 100%` or `flex-grow` pushing the box toward that bound — a flex item defaults to `flex: 0 1 auto`, sized to content. |
| 0.8.0 | Added `references/recipes.md` — copy-paste Mentor prompt blocks for recurring UI patterns (dropdown all/empty option, modal-with-form, sticky footer, per-row list controls, bulk-save, icon+label link wrapping, reserved theme class names, `MasterDetail`, appearance resets, external fonts, dumping matching CSS rules before a fix, retiring an old stopgap in the same turn a real fix lands). Twenty new `prototype-to-widgets.md` entries (#11–#30) from real waves, covering: OutSystems platform-generated widget ids that aren't stable across publishes; `List mapTo { }` with no explicit mappings zeroing every field, not just the omitted ones; two `AtStart` aggregates losing their implicit execution order when either's OML node is recreated; `RadioButtonGroup`'s `OnChange` not reliably reading the just-clicked value for any row but the first in a list, with the accessibility trade-offs of each fix direction; a dynamically-computed CSS width/height that never renders because the element's `display` computed to `inline`; a filter dropdown sourced from a growing historical table needing an explicit "actually referenced" scope, and the join-vs-semi-join distinction that comes with it; Mentor silently reverting an unrelated, already-verified prior fix while applying an unrelated one — re-verify every prior fix after every subsequent turn, not just once; a screen aggregate's `Distinct` property and the `Exists` function both being unavailable through Mentor's Model API (`GroupBy` and a server-action detour are the two paths that work); ad-hoc debug buttons for a recurring maintenance action (reseed, cleanup) becoming a permanent "Dev tools" area instead of an add-then-remove cycle. `SKILL.md` updated: re-check the plan itself (stale `RUNBOOK.md`/`spec-wN.md`) at the start of every wave, not just once; check every other screen that already lists/references an entity a wave adds a new field to, not just the screen the feature "lives on"; measure box-model facts (container width, spacing) on the live screen, not by eyeballing; dump every matching CSS rule before writing a fix prompt for an element a prior wave already patched, and retire the old stopgap in the same turn; check `recipes.md` before writing a Mentor prompt for a recognized UI pattern; interact with a per-row list control in two different rows before declaring it verified, not just one. |
| 0.7.0 | Two new `prototype-to-widgets.md` entries from a real wave: (1) a link can be empty — content placed *beside* the anchor instead of *inside* it looks fixed but is unclickable; (2) re-parenting elements (e.g. moving them inside a new link to fix #1) drops them out of the old parent's flex context, since `display: flex` only arranges direct children — the new wrapper needs its own flex rule restated. |
| 0.6.0 | Hard cap: never more than one screen per wave, no exceptions — a list+detail pair discovered together in the prototype is still two waves. Data seeds don't count against the cap but should be weighed for real size. |
| 0.5.0 | Test evidence is now required, not just a tally: `playwright.config.ts` ships with an HTML reporter by default, and the wave log must record its path (overwritten each run — that's expected, not a gap). |
| 0.4.0 | Added `references/prototype-to-widgets.md` — an HTML→OutSystems-widgets conversion guide distilled from real recurring bugs (layout placeholders that aren't stacked divs, fill-parent-by-default containers, flex `min-width` shrink, `Adaptive` margin misalignment, reserved theme class names, canonical vs. invented CSS variables, and when a pattern like list→detail is already a built-in block). |
| 0.3.0 | Screenshots alone under-specify box model. Added a mandatory "box model facts" requirement: every wave spec's Screen layout section, and every Mentor prompt, must state in words what a picture can't show — explicit max-width/width for any non-fill-parent container, which elements stack as blocks vs. share a row, and which flex children need `min-width: 0`. |
| 0.2.0 | Introduced the **prototype-first principle** and the **wave execution cycle**: every UI wave is prototyped in HTML and explicitly approved before Mentor is ever prompted; the prototype (not ASCII art) becomes the wave spec's Screen layout source; the static gate now includes "screen matches the approved prototype screenshot," not just a text re-read. Added a "living prototype" pattern — one cumulative HTML file evolved and republished wave over wave, not a throwaway mockup per wave. |
| 0.1.0 | Initial version — derived from one real build |
