---
name: outsystems-plan
version: "0.5.0"
description: >
  Guides you from a blank folder to a complete OutSystems build plan through
  a short interactive interview. Reads your spec and reference screens, proposes
  a wave breakdown where every wave ends with something clickable and visually
  verifiable, and generates RUNBOOK.md + one spec file per wave + Playwright
  test scaffolding. Every wave is prototyped in HTML and approved BEFORE Mentor
  ever touches it — the prototype, not ASCII art, is the screen's source of
  truth. Use when starting a new OutSystems project or planning a new feature
  set: "plan this project", "quebrar em ondas", "criar plano a partir do SDD",
  "start planning".
license: MIT
allowed-tools: AskUserQuestion Bash Read Write Edit Artifact
---

# OutSystems Plan — interactive planning from spec to waves

## What this produces

Running this skill in a project folder creates:

```
RUNBOOK.md              the single source of truth: waves, gates, execution order
spec-w1.md … spec-wN.md one file per wave
tests/
  playwright.config.ts
  package.json
  .env.example
  support/selectors.ts  all locators and verbatim messages in one place
  support/fixtures.ts   one authenticated Page per role
  w1.spec.ts … wN.spec.ts
  files/README.md       where test fixture files (PDFs, etc.) live
```

The skill produces the **plan**. Execution — firing Mentor, polling, publishing,
running the tests — is the RUNBOOK's job.

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
4. Execute the wave (RUNBOOK Step — fire Mentor with the prototype screenshot attached)
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

**A prototype screenshot transfers color, typography, and field grouping
faithfully. It systematically fails to transfer box model** — max-width
constraints, block-vs-inline stacking, and flex shrink behavior
(`min-width: 0`) are invisible or ambiguous in a static image, and Mentor
defaults every OutSystems UI container to fill-parent unless told otherwise
in words. Do not rely on "attach the screenshot" alone and expect fidelity;
before writing each wave's Mentor prompt, read the prototype's own CSS for
that screen and pull out these facts explicitly (see guardrail 9 below).
Skipping this step is what produces the "looks right, then a week later
someone compares it pixel-by-pixel and finds five divergences" loop — cheap
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

---

## The wave execution cycle

Executing a wave is not "fire Mentor, publish, done" — it is a fixed
six-step loop, and it applies whether the wave is brand new or a fix on top
of one already published. **Skip a step only when the user explicitly says
to; never skip a step silently.**

```
1. Prototype    — build or evolve the screen(s) in the living prototype (HTML)
2. Approve      — get the user's explicit sign-off on the prototype change
3. Execute      — update the wave spec from the approved prototype, then
                  fire Mentor with box-model facts in the prompt; publish
4. Compare      — open the published screen and the approved prototype
                  side by side; list every visual/behavioral difference —
                  don't stop at the first one found
5. Reconcile    — for each difference: fix the app (usually), or fix the
                  prototype/spec if the difference was the prototype's own
                  oversight (see the prototype-first principle) — then
                  re-publish and go back to step 4 until there's nothing left
6. Test         — update/add E2E test cases for what changed, then ask the
                  user whether to run them now (never auto-run — see the
                  RUNBOOK's per-wave procedure)
```

**After every step completes, state what just finished and name the next
step in the cycle before doing anything else** — even when the user's last
message already tells you to continue. This is not optional narration: the
whole point of a fixed cycle is that neither the model nor the person
reviewing it has to hold "what comes next" in their head. A short line is
enough: *"Prototype approved — updating spec-w5.md and firing Mentor next."*
If the user redirects mid-cycle (a different bug to chase, a question), pick
the cycle back up at the step you were on rather than silently dropping it.

**The user can jump straight to any step** ("just fix the app, skip the
prototype" / "don't bother re-running tests") — that's a valid shortcut, not
a violation of the cycle. What breaks the cycle is *not naming* the skipped
step, so a shortcut silently becomes the new unstated default for every wave
after it.

This cycle is why `RUNBOOK.md`'s per-wave procedure (Step 6 below) is
written as prototype → approve → spec → Mentor → publish → compare against
prototype → tests, not as a single "build the wave" instruction — and it is
why the static gate includes "screen matches the approved prototype
screenshot" as a checklist item, not just "matches the spec text."

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

If not provided, note that the wave specs will have minimal UI direction and
the zero-hex-literal gate cannot be enforced.

### Question 4 — The value path

> "What is the shortest sequence of actions a user needs to complete for the
> product to be useful? For example: create → process → review → finalize.
> Everything else (admin screens, reporting) can come later."

This answer sets the wave order. Value path waves come first, fully working.
Admin and reporting waves come last.

### Question 5 — Target environment

> "Is this a new app or an existing one? And: is the app open (no login) or
> does it require authentication? If it uses the ODC Web template, it ships
> with some screens and roles already — do you know what baseline it has?"

This determines:
- Whether wave 1 needs `app_create` or can use an existing app key
- Whether the zero-screen, zero-action baseline needs to be measured first
- Whether test user provisioning is needed

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

**Maximum per wave:** ~3–4 server actions plus one screen, or two screens with
minimal logic. Logic-heavy waves (scoring, multi-guard finalization) should be
one screen with fewer actions.

**Minimum per wave:** one screen in any state — even a layout-only shell with
no data is a valid wave if it can be verified visually.

### The shape that usually emerges

```
W1  Foundation     theme, shell, reference data seed, the first screen (layout only)
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

### What this wave proves
One sentence. What can a human do and verify after this wave is published?

### Scope
- Creates: [entity list, action list, screen list]
- Consumes (must not alter): [what earlier waves built]
- No data model changes: [yes/no]

### Screen layout
**Referência visual aprovada**: link do protótipo HTML (Artifact URL) +
qual aba/estado dele é esta tela. This is the primary reference — attach a
screenshot of it to the Mentor prompt (RUNBOOK Step). An ASCII sketch may
follow as a quick summary of field grouping, but it is never the sole
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
blocks, say so explicitly even if it looks obvious in the screenshot; for
any flex child that must shrink below its content's natural width, name the
container and require `min-width: 0`. These three facts do not survive a
"here's a screenshot, match it" prompt — see "The prototype-first
principle" above and `references/prototype-to-widgets.md` for the recurring
failure modes behind each of these three facts.

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

- Quote every user-facing message verbatim. "Formato inválido. Envie um PDF." not "a validation message."
- Mark every `Text` field that must be truly unbounded — Mentor silently creates them as `Text(50)` otherwise.
- The out-of-scope section must name what the previous wave owns (so Mentor cannot helpfully rebuild it) and what the next wave will own (so it does not build ahead).
- Write a `§10 — If this wave stalls` section naming where to split the wave if Mentor times out (~30 min without a terminal state).

---

## Step 4 — Write the test files

One `tests/wN.spec.ts` per wave, with test IDs matching the spec (`W2-01`, `W2-02`).

Key rules:

- `playwright.config.ts` must set `testIdAttribute: 'data-test'` — Playwright's default is `data-testid` which OutSystems never sets.
- `fullyParallel: false`, `workers: 1` — waves share one environment.
- `reporter` must include `['html', { open: 'never', outputFolder: 'playwright-report' }]` alongside `['list']` — `list` alone only prints to the terminal, and terminal output is not evidence once the turn scrolls away. The HTML report (with screenshots and traces on failure) is what makes "5 passed" a checkable claim instead of a summary someone has to trust. It's overwritten by the next run of the same project — if the user wants a specific run preserved across future runs, that's a separate ask (copy the folder, or init git and commit it), not something to assume.
- All locators and all verbatim messages live in `support/selectors.ts`. A UI rename is one edit.
- Prefer accessible role + visible text. Never target generated OutSystems DOM ids — they change on republish.
- For negative RBAC: assert controls are **absent**, not disabled.

**Known OutSystems selector pitfalls** (write tests to avoid these from the start):

- `LayoutSideMenu` sidebar entries have ARIA role `menuitem` inside `menubar`, not `link`.
- The platform `Upload` widget's label is not wired to its `<input>` — use `input[type="file"]` by position, not `getByLabel`.
- `Title` widget renders a `<span>`, not a heading — `getByRole('heading')` never matches it.
- `TableRecords` `data-test` attributes land on `<td>` cells, not `<tr>` — locate rows via `page.locator('tr').filter({ hasText })`.
- A data-driven dropdown defaults to its placeholder — always call `selectOption({ label })` before asserting the happy path.
- Status badges bound to the wrong column show the English `Label` instead of the PT-BR `LabelPtBr` — assert the exact localized string.

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

At the **start of each wave** (before firing Mentor), run:
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
- Turn <n>: <runId short>, <HH:MM>→<HH:MM> (<Xm>), retries=<N> → <applied|failed|split>
- [Deviation: <what happened> → <how resolved>]
- [Fix turn: <runId short>, <Xm>, retries=<N> → <what was fixed>]
- Publish: rev <N>
- Gate: PASS | FAIL (<reason>)
- Tests: <N>/<N> pass [(<IDs> deferred — <reason>)]
- Status: DONE | BLOCKED (<reason>)
```

Lines in `[brackets]` are optional — include only when something actually
happened. A clean wave is four lines. A messy wave names what was messy.

**What belongs in the log:**
- Every Mentor turn that reached terminal state (runId + timing + retries)
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
2. **Project facts** — tenant, app name, app key (resolved at session start, never hardcoded)
3. **Wave table** — name, scope summary, committed vs deferred, status
4. **Living prototype pointer** — the Artifact URL of the cumulative HTML
   prototype (see "The prototype-first principle"), plus a one-line rule:
   no wave's Mentor prompt fires without an approved prototype screen for
   it, and no prototype change ships without being written back into the
   wave's spec.
5. **Per-wave procedure** — prototype/evolve the wave's screen(s) in the
   living prototype → get user approval → update `spec-wN.md` Screen
   layout from the approved prototype → fire Mentor with a screenshot of
   the approved screen attached (in addition to the theme-continuity line)
   → poll (always drain-and-pause: poll immediately while the cursor is
   draining new events, then pause ~30-60s once drained and not yet
   terminal — never fixed-interval/500ms polling; see
   `outsystems-mentor-polling-behavior`) → static gate, including a visual
   diff against the prototype (not just the checklist) → publish → ask
   about tests
6. **Mentor prompt guardrails** — prepended to every Mentor prompt, every wave
7. **Static gate checklist** — entity count, action count, screen count, zero hex literals, no unauthorized roles, **screen matches the approved prototype screenshot** (layout, grouping, negrito/weight, dynamic vs static text — verify by opening the published screen and comparing, not by re-reading the spec)
8. **Failure playbook** — what to do when things go wrong
9. **Timing log** — one row per milestone, cumulative across waves
10. **Never list** — absolute prohibitions

### Mentor prompt guardrails

Every Mentor prompt, every wave, must be prepended with these guardrails
verbatim. Write them into the RUNBOOK under a `## Prompt guardrails` section
so they are never forgotten:

```
GUARDRAILS (apply to every screen and action in this wave):

1. No hex literals. Every color must be a theme variable.

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

5. Use verified OutSystems UI block names only — no bare HTML elements.

6. ODC terminology only: no "Service Studio", no "eSpace".

7. Add every `data-test` attribute listed in the wave spec, spelled exactly.

8. A screenshot of the approved prototype is attached to this prompt as the
   primary layout reference. Match it exactly — including whether elements
   stack on separate lines (block) or share one line (inline/flex-row).
   Don't infer structure from the wording of the spec text; read it off the
   image.

9. A screenshot alone under-specifies box model. It shows what a container's
   size happens to be at one viewport, not whether that size is a hard
   constraint or incidental — and it cannot show `min-width: 0` shrink
   behavior on a flex child at all, since that only manifests as a bug once
   text is long enough to wrap. Every wave's Mentor prompt must state, in
   words, alongside the screenshot: (a) any element that must NOT fill its
   parent's width — name it and give the exact max-width/width in px (every
   OutSystems UI container defaults to fill-parent; "don't stretch" is
   always opt-in, never assume it transfers from the picture), (b) which
   sibling elements must stack as separate blocks vs. share a row, and
   (c) any flex child that must shrink below its content width (name the
   container, require `min-width: 0` explicitly) — this is invisible in a
   screenshot and easy to skip. Extract these facts from the prototype's own
   CSS while writing the wave spec (Step 3's Screen layout section), not
   from eyeballing the rendered image a second time.
```

---

## Checklist before handing the plan over

- [ ] Every UI wave has an approved prototype screen, and its spec's Screen
      layout section was derived from that approved screen, not written first
- [ ] After publish, the live screen was compared against the prototype
      screenshot directly (open both side by side) — not just checked
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
