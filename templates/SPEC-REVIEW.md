# Spec review — [Project name]

**Source spec:** [file / date / who sent it]
**Classification:** PoC | Final application
**Reviewed:** [date]  ·  **Signed off by:** [name]

Read before planning. The point is to surface what the spec does not say, while
it still costs one line to fix. Everything here that is not answered becomes a
stated assumption, and stated assumptions are what the demo conversation gets
measured against.

---

## 1. Ambiguities

Each row: the question, and the reading that will be built if nobody answers.

| # | Question | Assumption if unanswered |
|---|---|---|
| A-01 | [what is unclear] | [what will be built] |
| A-02 | | |

## 2. Contradictions

Where the spec disagrees with itself. Quote both sides.

| # | Where | Says | Also says | Resolution |
|---|---|---|---|---|
| C-01 | §x / §y | "[quote]" | "[quote]" | [which one wins] |

## 3. Missing but required

Not in the spec, cannot be skipped. The usual suspects:

- [ ] Auth model — open, or roles? Which roles, and what can each one not see?
- [ ] Entity states — the full list, and which transitions are legal
- [ ] Empty states — what each list shows with no data
- [ ] Error and validation messages, verbatim, in the product's language
- [ ] What happens on the unhappy path of the main action
- [ ] Volume — is any screen expected to show hundreds of rows in the demo?
- [ ] External systems — real, stubbed, or out of scope for the PoC?

## 4. Out of scope

Deliberately not built. Write it here so it cannot drift back in mid-demo.

- [thing] — [why: not needed for the demo narrative / no data / next phase]

## 5. Demo narrative

One paragraph: the story this PoC tells in front of the customer. If this cannot
be written in one paragraph, the scope is still wrong.

> [narrative]

The click sequence that tells it goes in the RUNBOOK as the demo script.
