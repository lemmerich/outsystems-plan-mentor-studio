---
name: outsystems-plan
description: >
  Guides you from a blank folder to a complete OutSystems build plan through
  a short interactive interview. Reads your spec and reference screens, proposes
  a wave breakdown where every wave ends with something clickable and visually
  verifiable, and generates RUNBOOK.md + one spec file per wave + Playwright
  test scaffolding. Use when starting a new OutSystems project or planning a
  new feature set: "plan this project", "quebrar em ondas", "criar plano a
  partir do SDD", "start planning".
license: MIT
allowed-tools: AskUserQuestion Bash Read Write Edit
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
[Describe the screen layout in plain terms or ASCII. Reference design tokens
by name. Explicitly say how form fields are grouped — e.g., "date and code
on the same row, never one field per line".]

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

---

## Step 5 — Create execution-log.md

Create `execution-log.md` in the project folder alongside RUNBOOK.md.
Seed it with the project header and an empty entry for W1:

```markdown
# Execution log — [Project name]

Started: <!-- fill with `date "+%Y-%m-%dT%H-%M-%S"` at first session -->

---
```

After each wave completes (gate passed, published, tests decided), append one
entry in this exact format — nothing more:

```markdown
## W<N> — <name>
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

1. **Project facts** — tenant, app name, app key (resolved at session start, never hardcoded)
2. **Wave table** — name, scope summary, committed vs deferred, status
3. **Per-wave procedure** — fire Mentor → poll → static gate → publish → ask about tests
4. **Static gate checklist** — entity count, action count, screen count, zero hex literals, no unauthorized roles
5. **Failure playbook** — what to do when things go wrong (see template)
6. **Timing log** — one row per milestone, cumulative across waves
7. **Never list** — absolute prohibitions

---

## Checklist before handing the plan over

- [ ] Every wave ends with something clickable — no entity-only waves
- [ ] Every wave spec has a "What this wave proves" sentence
- [ ] Running totals are consistent across all specs and RUNBOOK
- [ ] All verbatim messages in specs appear in `support/selectors.ts`
- [ ] Each spec names what its neighbouring waves own
- [ ] Each spec has a split point for if it stalls
- [ ] Test IDs in specs match the `.spec.ts` files exactly
- [ ] RUNBOOK has the failure playbook and never list
