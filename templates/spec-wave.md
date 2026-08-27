# W<N> — [Wave name]

**Wave N of M** · [committed / deferred]

---

## What this wave proves

> One sentence. What can a human click and verify after this wave is published?
> Example: "A user can open the consultation list and see seeded records with
> correct status badges."

---

## Scope

**Creates:**
- Entities: [list or "none"]
- Static entities: [list or "none"]
- Server actions: [list]
- Screens: [list]

**Consumes (must not alter):**
- [list of artifacts from earlier waves]

**Data model changes:** none ← or describe exactly what changes

> ⚠️ If a `Text` field must hold more than 50 characters, say so explicitly:
> "ExtractedText — unbounded Text". Mentor silently creates `Text(50)` otherwise.

---

## E2E test cases

These are the definition of this wave's scope. Written first, read first.

| ID | Scenario | How to verify |
|---|---|---|
| W<N>-01 | Happy path: [describe] | [what appears on screen / in data] |
| W<N>-02 | Guard: [describe] | [exact error message] |
| W<N>-03 | Visual: [describe] | [what layout or color to assert] |

Exact messages (used verbatim in test assertions):
- `"[PT-BR message text]"` — shown when [condition]

> Mark any test that cannot be verified on screen with `via db_query`.
> These check things that look correct visually when they are wrong:
> calculated values, duplicate-prevention guards, character offsets.

---

## Screens

### [ScreenName] — PT-BR title: "[Título]"

**Access:** [Auditor / Administrator / Manager / public]

**Layout:**

```
[ASCII sketch or prose description of the screen layout.
For forms: show which fields share a row.
Never one field per line unless the field genuinely needs full width.]
```

**Blocks used:** [list by verified name from design-system.md]

**Behavior:**
- [describe interactions, not implementation]
- [describe empty state]
- [describe loading state if applicable]

**`data-test` attributes:**

| Attribute | Element |
|---|---|
| `[attr-name]` | [what it marks] |

---

## Server actions

### `[ActionName]`

> Note: do not name this `Create<Entity>` — ODC's implicit CRUD action blocks it silently.

**Inputs:**
- `[ParameterName]` — `[Type]` — [mandatory/optional] — [constraint]

**Outputs:**
- `[ParameterName]` — `[Type]`

**Logic:**
1. [step]
2. [step]

**Error cases:**
- `"[Exact PT-BR error message]"` — when [condition]

---

## UI direction

- Every color is a theme variable — a hex literal in any screen or block is a defect
- Form layout: [describe the column grouping — e.g., "2-column grid: code + date on row 1, name + reference on row 2"]
- Status badges: read text from `LabelPtBr`, not `Label`
- [Any wave-specific UI notes]

---

## Out of scope

This wave does not build:
- [what the previous wave owns — name it explicitly]
- [what the next wave will own — name it explicitly]
- [anything else that could tempt a "helpful" addition]

---

## Notes for Mentor

- [Any ODC-specific trap to call out for this wave]
- [Which invariant from the SDD this wave must respect]

**If this wave stalls** (no terminal state after ~30 min):
Fire [first part] first, verify [specific artifact or count], then fire [second part].
