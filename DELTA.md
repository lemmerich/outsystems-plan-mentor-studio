# DELTA — What changed from upstream

Fork of `rodginez/outsystems-plan`, rebased on v0.12.1 (commit `9a7cc1c`) as of 2026-09-10.
Previously rebased on v0.8.0 (commit `a1ef0f4`) as of 2026-08-31.

Upstream drives Mentor through the MCP: fires a turn, polls, reads the model
back with `context_entities` / `context_actions` / `context_screens` and publishes.
None of that exists here. The assistant is the Mentor Studio chat in ODC Studio
and humans do the pasting. The skill moves from orchestrating to emitting.

Everything upstream learned about Mentor and OutSystems UI remains unchanged.
That is why this is a fork and not a rewrite.

---

## What was kept unchanged

- `skill/references/prototype-to-widgets.md` in full. It is the repository's most
  valuable asset: seven real failure modes in the HTML-to-OutSystems-UI translation.
- Hard cap of **one screen per wave**, 3 to 4 server actions, all value-path
  entities created by W2.
- Prototype-first principle and single cumulative prototype, republished to the
  same URL.
- Six-step cycle, including the **Compare** step (published vs. prototype side
  by side, list all diffs before fixing any). This step is what transforms the
  prototype from decoration into contract.
- Guardrails 1–7 verbatim.
- Forbidden action names (`Create<X>`, `Get<X>`, `Update<X>`, `Delete<X>` are
  silently blocked by ODC's implicit CRUD).
- `Text` without declared size becomes `Text(50)` without warning.
- List of OutSystems UI selector pitfalls (`Title` is `<span>`, `data-test` on
  `TableRecords` lands in `<td>`, `LayoutSideMenu` uses role `menuitem`, `Upload`
  label is not wired to the input).
- Never run tests automatically; publishing is a human decision.

## 1. Channel: Emit + Paste instead of Fire + Poll

New section `## The channel: Mentor Studio, not MCP` in `SKILL.md`, and step 3
of the cycle became **Emit**: the skill writes `prompts/wN.md` and shows it in a
fenced block; the operator pastes, publishes and comes back saying what happened.

Removed from logs and RUNBOOK: `runId`, `retries`, `change_applied`, poll
interval, `app_key`, `tenant`, `app_create`, `env_app`, `app_revisions`. No log
line may suggest these exist.

The failure playbook was rewritten entirely. Upstream symptoms were protocol-level
(`change_applied: false`, run stuck in `applyModelApiCode`, 404 on
`publish_status`). Here they are observable: did less, did more, did different,
broke previous wave.

## 2. Static gate became manual, and that is accepted

Without `context_*` there is no programmatic count. The gate became a short
read-back the operator performs on the module tree in ODC Studio. It is weaker
and the text says it is weaker: catches "created three screens instead of one",
does not catch wrong attribute type. The compensation is explicit: lean harder
on Compare and on tests, which are the only checks left that a machine performs.

## 3. Context pack per wave

Upstream re-sends "wave spec + SDD + design-system" on every turn because an MCP
prompt is cheap. In Studio, with a human pasting, that does not fit.

Every prompt opens with a context pack: only the modules, entities, screens and
actions that this wave touches, plus a `DO NOT TOUCH` list of names without
description (description in an artifact that must not be touched is an invitation
for Mentor to improve it). Generated at emit time from the wave table and
completed specs. Never versioned: a derived file that gets stored is a file that
goes stale silently.

Limits: 200 lines per prompt, 8 items in CHANGES. Past that, Mentor starts
dropping items from the middle of the list and nobody notices until Compare.

## 4. No image channel — so send the HTML, not a description of it

Upstream attaches a prototype screenshot and spends guardrail 9 describing in
words the box-model facts the picture cannot carry. Here there is no image at
all, which turned out to be an advantage: embed the **pruned HTML and CSS of that
screen**. It is text, it is the literal contract, and it carries max-width,
stacking and flex exactly instead of approximately.

Pruning rules in `skill/references/mentor-studio-prompt.md`: one screen only, no
nav switcher, no JS, only CSS that still matches something, repeated lines become
one line plus a comment, every `data-test` preserved (it is what most gets lost
in pruning). Target 120 lines, cap 200.

Box-model facts continue to be written in prose alongside the markup. Three lines
of redundancy, and Mentor obeys written constraints better than it infers
intention from CSS.

**Verify before the first project:** if Mentor Studio build in use accepts image
attachments, keep the pruned HTML anyway (it is strictly more precise) and add
the screenshot on top.

## 5. Reconcile budget and `fidelity` field

Upstream reconciles 4 → 5 → 4 until no diffs remain, which is right when
reconciliation costs an MCP call. Here each round costs copy-paste-run-publish
with a human in the middle.

Two rounds per wave. After that, remaining diffs are recorded as accepted and
the wave closes. Exception: waves with `fidelity: demo`, screens in the demo
script, get unlimited rounds because that screen IS the product. The rest is
scenery.

Chasing pixels on a screen outside the demo path is where POC ROI dies.

## 6. `channel` field and W0 theming

Upstream assumes Mentor for everything. Mentor Studio is good at changing an
existing module and bad at creating structure from scratch, so the first wave
is not its job.

Every wave declares `channel: appgen | mentor-studio | manual`, with decision
table in `SKILL.md`. Only `mentor-studio` waves generate `prompts/wN.md`.

W0 is fixed: app created and theme set up on OutSystems UI, via AppGen or by
hand, before any feature wave. Without it, the prototype's palette has nowhere
to land and every following wave re-debates color, and a design guideline that
arrives in the prompt as "use the brand blue" produces literal hex, which the
gate rejects.

From W1 onward, design guidelines name the native block (`Card`, `Tabs`,
`ListItem`, `Columns2`). A prompt that says "a card-like container" gets `<div>`.

## 7. PoC phase: Step 0 and classification

Upstream goes from spec straight to the six-question interview. In a PoC factory,
the spec comes from the client and is usually incomplete in a way that only
shows up in W4, when it is expensive.

New `Step 0`: write `SPEC-REVIEW.md` (ambiguities with the assumption to be made,
contradictions noted, what is missing and cannot be skipped, what is out of
scope) and get sign-off.

And classify the project as PoC or production application, explicitly. The
classification changes real decisions: number of modules, whether stub and
synthetic seed are features or debt, whether the data model comes from screens
or precedes them, and which handover checklist applies.

`templates/POC-HANDOVER.md` replaces upstream's pre-production checklist for PoC
projects, and plainly states: if the PoC is promoted, none of this transfers.

## 8. Value path became demo script

Same question as upstream, answer in a different format: the exact sequence of
clicks that will be performed in front of the client, with what appears at each
step.

Written that way, it does three jobs: orders the waves, decides which screens are
`fidelity: demo`, and IS the `tests/demo.spec.ts`. It stays verbatim in RUNBOOK.

## 9. Playwright: authentication and the suite that cannot break

- `auth.setup.ts` new: logs in once and saves `storageState`. Re-authenticating
  per test against ODC's login screen is slow, flaky, and the first thing that
  breaks the suite.
- `playwright.config.ts` gained `setup` and `e2e` projects with dependency, and
  **the HTML reporter**. Upstream has required the HTML reporter in `SKILL.md`
  since v0.5.0 but the template still came with `reporter: 'list'`. Fixed here.
- `demo.spec.ts` separate from wave specs. It is the only suite that must be
  green before showing the POC. Wave spec can carry accepted diff.
- `.env.example` gained `APP_USER` and `APP_PASSWORD`.

## 10. Guardrail 10, new

Upstream has 9 guardrails. The tenth only makes sense with a human in the loop:

> If anything here is impossible or contradicts what is already in the module,
> stop and say so, instead of improvising a workaround.

With MCP, a Mentor that stops is a lost turn. Here it is a question the operator
answers in one minute, whereas silent improvisation is only discovered a full
round of compare and reconcile later.

---

## Files

| File | Status |
|---|---|
| `skill/SKILL.md` | adapted (new channel section, Step 0, channel/fidelity, guardrails 8-10, log without MCP) |
| `skill/references/prototype-to-widgets.md` | unchanged |
| `skill/references/mentor-studio-prompt.md` | new |
| `templates/RUNBOOK.md` | rewritten |
| `templates/spec-wave.md` | adapted (channel, fidelity, DO NOT TOUCH, stall) |
| `templates/wave-prompt.md` | new |
| `templates/SPEC-REVIEW.md` | new |
| `templates/POC-HANDOVER.md` | new |
| `templates/playwright.config.ts` | adapted (HTML reporter, projects, storageState) |
| `templates/tests/auth.setup.ts` | new |
| `templates/.env.example` | adapted |
| `README.md` | from fork; original became `README-upstream.md` |
| `skill/references/backend-and-data-gotchas.md` | new (v0.12.1 rebase) — adapted, MCP verification-tool mentions removed |
| `skill/references/architecture-recipes.md` | new (v0.12.1 rebase) — adapted, harness/`app_revisions` mentions swapped for manual equivalents |

## Rebase on upstream

`prototype-to-widgets.md` gets the most improvements upstream and is what we
keep unchanged here, so `git checkout upstream/main -- skill/references/prototype-to-widgets.md`
resolves most merges. `SKILL.md` diverges on purpose.

For the full rebase process (when to do it, how to tag the result, how to
decide what to keep), see [`CONTRIBUTING.md`](CONTRIBUTING.md).

## What still needs validation

1. Does Mentor Studio accept image attachments? Changes item 4.
2. Is 200 lines the right cap for prompts? Calibrated guess, not measured.
3. Is two reconcile rounds the right number? Same.
4. Does pruned HTML work better than prose describing layout? It is the central
   bet of this fork and the first thing to test on a real wave.

## 11. Rebase to upstream v0.12.1 (2026-09-10)

Upstream moved a1ef0f4 (v0.8.0) → v0.9.0 → v0.10.0 → v0.11.0 → v0.12.0 →
9a7cc1c (v0.12.1), four minor releases this fork had not picked up. All of
it turned out to be channel-agnostic (OutSystems platform lessons, process
discipline) — nothing in the diff touched MCP mechanics directly, except
one paragraph and a handful of verification-tool references that had to be
rewritten for a channel with no `context_*`/harness tools at all.

**Pulled in as-is (merged with this fork's own local additions, not a
straight overwrite):**
- `SKILL.md`: new "Communication style" section (terse-by-default reports);
  the "check `recipes.md`/`prototype-to-widgets.md`/`backend-and-data-gotchas.md`
  before any live bug investigation, not just wave planning" rule; a new
  **Distill** step 7 in the wave cycle (propose new lessons/recipes at wave
  close, wait for operator go-ahead before editing reference files — the
  cycle is now seven steps, not six); a check against
  `references/architecture-recipes.md` before scoping any wave that calls
  an AI/LLM model; and a test-run-scope rule (running tests is approval for
  that wave only, never the whole suite, without an explicit broadening).
- `skill/references/prototype-to-widgets.md`: merged upstream's items 23-27
  (RadioButtonGroup dedup fix, renumbered; inline-display width bug;
  permanent Dev-tools area instead of add/remove debug buttons; filter
  dropdown "actually used" scoping; new `max-width` needs `width`/`flex-grow`
  lesson) with this fork's own local items 31-40 (renumbered 28-37, since
  this project had already accumulated 10 lessons of its own beyond a1ef0f4
  that upstream never had). Upstream's old items 23/24/29/30 (mapTo,
  aggregate-ordering, Mentor reverting a fix, Distinct/Exists) moved out —
  see below.
- New file `skill/references/backend-and-data-gotchas.md`: Server
  Action/entity/aggregate lessons upstream split out of
  `prototype-to-widgets.md` starting at v0.10.0. Adopted with one
  adaptation: item 5 ("a Mentor '0 errors' claim proves nothing") had its
  entire discussion of `context_actions`/`context_search` indexing lag and
  the legacy-vs-IDE-Service MCP tool migration removed — none of that
  exists in Mentor Studio — and reframed around what the operator actually
  has: publish, hard-reload, read the real platform error, run the suite.
  The rest (mapTo zeroing, aggregate execution order, Mentor reverting an
  earlier fix, Distinct/Exists unavailable via the Model API, cascading
  fallback bugs, ODC's lack of a Timer widget, `OnAfterFetch` binding gaps,
  BinaryData corruption on real-sized files, fixture-size masking, and
  narrow-fix regressions) is pure ODC platform behavior and applies
  unchanged.
- New file `skill/references/architecture-recipes.md`: the "an agent must
  not be coupled to the calling project" and "test a new agent isolated
  before integrating" principles. Adopted with references to `app_revisions`
  and "the test harness" swapped for their manual equivalents (ODC Studio's
  own module history, and a temporary debug screen/button per
  `prototype-to-widgets.md` #25) — the principle itself is unchanged.
- `skill/references/recipes.md`: merged upstream's 4 new recipes ("two
  mutually-exclusive show/hide states must be siblings," "wipe and
  recreate all test data periodically," "row locator on `hasText` breaks
  once a field becomes an input," "resolving a cascading-fallback
  candidate") into this fork's own recipes.md, which already carried 14
  local recipes beyond a1ef0f4. Two pre-existing recipes (predating this
  rebase, carried over from the original a1ef0f4 sync without adaptation
  until now) referenced `exec_in_app`/`context_entities` for verifying
  entity attribute names — rewritten to read the entity's Data tab in ODC
  Studio directly and verify via a temporary debug action instead.

---

## 12. Prompt-file hygiene, project genericization, English by default (2026-09-11)

Real project use (multi-wave PoC, dozens of fix rounds) surfaced three
practical problems this fork's conventions didn't cover, plus a
confidentiality gap in the skill's own content.

- **Prompt-file naming, tightened.** `prompts/` had drifted into
  inconsistent suffixes (`diag`, `debug`, ad-hoc names) once a project
  accumulated enough reconcile rounds. `fix` is now the only suffix
  `wN-fixM.md` ever takes (a read-only diagnostic round still consumes the
  next `M`, it does not get its own counter), and a new `extra-P.md` /
  `extra-P-fixM.md` convention covers prompts not tied to any wave. Goal:
  the highest number in a thread is always the latest file, with no
  contents-reading required to find it.
- **Self-contained prompts, made explicit.** SKILL.md's Reconcile step now
  states directly that Mentor Studio has no memory across sessions and
  never reads `prompts/`/`specs/` itself — a prompt referencing a prior fix
  by filename ("after wN-fix4 was already fixed") or a spec by name ("see
  spec-w3.md") is a dangling reference on Mentor's end, not useful context.
  New `templates/fix-prompt.md` mirrors `wave-prompt.md`'s structure
  (`Target module:` header, single ` ```prompt ``` ` fence, no nested
  fences) for fix/extra prompts, which previously had no template at all.
- **`specs/` folder.** `spec-wN.md` now lives under `specs/`, mirroring
  `prompts/`, instead of at the project root.
- **Skill content genericized.** The skill is shared across client
  projects; its own instructional content (SKILL.md, `skill/references/*`)
  must never carry a specific client's project name, entity/attribute
  names, or business terminology. Swept every skill file and template for
  client-specific identifiers and framing (e.g. "in the X project we
  learned" → "in one project we learned"); client-specific content now
  belongs only under a project's own folder, never in `skill/`.
- **English as the skill's default language.** Fixed remaining
  Portuguese in the skill's own instructional text (field names, example
  strings, prose). Added a new onboarding question — "what language
  should generated prompts, UI text, and error messages be in?" — so each
  project states its own target language explicitly instead of the skill
  defaulting silently; English remains the default when the operator has
  no preference. The PT-BR prompt-example bodies inside
  `references/recipes.md` and `references/mentor-studio-prompt.md` were
  left as-is in this pass; see §13 below for their translation.
- **Per-project README.** New `templates/PROJECT-README.md`, generated
  once per project (Step 7): what RUNBOOK.md is for, the folder map
  (`specs/`, `prompts/`, `tests/`), and what not to do — written for
  someone who has never touched this skill before.

## 13. Full English translation of the recipe catalog (2026-09-11)

§12 fixed the skill's instructional prose but deliberately left the
PT-BR "prompt block" example text inside `recipes.md` (~45 recipes) and
two remaining spots in `mentor-studio-prompt.md`, flagging it as a
separate, larger pass. Reason for doing it now: the skill is public and
its audience is not limited to Portuguese speakers, so example prompt
text left in Portuguese is exactly as much of a leak as an
instructional sentence would be — there is no tier of skill content
that gets a pass on this.

Translated every PT-BR prompt block in `recipes.md` to English,
preserving structure (numbered steps, `<placeholder>` conventions,
verify-after-publish snippets) and OutSystems-specific terms. Also
genericized a handful of client-specific field/status names that had
survived inside these blocks despite §12's sweep (`Ativa`/`Inativa` →
`IsActive`, `Todos`/`Todas` → `All`, `Administrador` → `Administrator`,
`Rascunho` → `Draft`), and fixed two leftover MCP-channel tool
references (`exec_in_app`, a `javascript_exec` code comment) that had
survived the v0.12.1 rebase — both replaced with their manual ODC
Studio equivalent (a temporary debug screen/button, or a plain browser
console call).

**Not applicable, left out on purpose:** nothing else. The only genuinely
MCP-only content upstream added in this range was the tool-migration
paragraph in backend-and-data-gotchas.md #5, handled above.

**Renumbering note:** any earlier project log (`logs/*.md`,
`execution-log.md`) that cites a `prototype-to-widgets.md` lesson number
above 22 was written against the pre-rebase numbering and may now point at
a different lesson. Old #23/#24/#29/#30 moved to
`backend-and-data-gotchas.md` #1/#2/#3/#4; old #25-28 are now #23-26; old
#31-40 (this project's own) are now #28-37. Update any such citation you
still rely on before trusting it.
