# RUNBOOK — [Project Name]

**Spec:** [SDD file path]  ·  **Spec review:** SPEC-REVIEW.md (signed off [date])
**Classification:** PoC | Final application
**Target:** OutSystems Developer Cloud (ODC)
**Build method:** Mentor Studio, one wave at a time, prompts pasted by hand

| | |
|---|---|
| App name | [app name] |
| Modules | [names] |
| Theme | [theme name] — variables: [list] |
| Prototype | [Artifact URL of the living prototype] |
| Environment URL | [dev stage URL] |

---

## Demo script

The click sequence this PoC exists to support. Verbatim, in order. It sets the
wave order, decides which screens are `fidelidade: demo`, and is what
`tests/demo.spec.ts` replays.

```
1. [screen] → [action] → [what appears]
2. [...]
```

---

## Current wave

**→ W___ — ___**  *(update this line before starting a wave)*

Resumption pointer. When picking up an interrupted session:
1. Read this line.
2. Read the last entry in `execution-log.md`.
3. Open the prototype URL and the dev environment side by side before doing
   anything else — the app's real state is the only state that counts.

---

## Wave plan

| Wave | Name | Canal | Fidelidade | Proves | Status |
|---|---|---|---|---|---|
| W0 | App + theme | appgen | — | Shell renders with the project theme | — |
| W1 | Foundation | mentor-studio | demo | Seed data exists, first screen renders | — |
| W2 | … | mentor-studio | … | … | — |
| — | — | — | — | **committed scope ends here** | — |
| W… | Admin | mentor-studio | secundária | CRUD for reference data | DEFERRED |

---

## Per-wave procedure

**0. Point at the wave**

Update `## Current wave` above. Record the start time:

```bash
date "+%H:%M:%S"
```

**1. Prototype and approve**

Evolve the living prototype with this wave's screen. Publish it to the same
Artifact URL. Get explicit approval before anything else happens. No wave prompt
is emitted for a screen that has not been approved.

**2. Emit the prompt**

Update `spec-wN.md`'s Screen layout section from the approved prototype, then
write `prompts/wN.md` from `templates/wave-prompt.md` and show it in a fenced
block. Rules in `references/mentor-studio-prompt.md`. Before showing it, check:

- [ ] Under 200 lines total
- [ ] At most 8 numbered CHANGES
- [ ] CONTEXT lists only what this wave touches
- [ ] DO NOT TOUCH names every artifact from earlier waves that must survive
- [ ] Every `data-test` from the spec is present in the markup
- [ ] Theme variables named, zero hex literals in the markup

**3. Paste, run, publish** *(operator)*

Paste into Mentor Studio. Let it finish. Publish. Then say what happened: "W3
done", or "W3 done but it created two screens", or paste Mentor's answer if it
refused or did something unexpected.

Publishing is a human decision, every time.

**4. Static gate (manual)**

There is no `context_*` call in this channel. The operator reads the module tree
in ODC Studio and confirms:

- [ ] Entity count matches the wave's expected total
- [ ] Action count matches
- [ ] Screen count matches — no placeholder screens for future waves
- [ ] No role created that the spec did not authorize
- [ ] No hex literal in any screen or block

This gate is softer than a programmatic one. It catches "created three screens
instead of one"; it will not catch a subtly wrong attribute type. That is what
steps 5 and 6 are for.

**5. Compare and reconcile**

Open the published screen and the approved prototype side by side. List **every**
difference before fixing any of them. Then one re-prompt covering all of them.

**Budget: two reconcile rounds.** After the second, record what remains in the
log as accepted and move on. A wave with `fidelidade: demo` is the exception and
gets as many rounds as it needs.

**6. Record and test**

```bash
date "+%H:%M:%S"
```

Append the wave entry to `execution-log.md`, then ask:

> "W<N> is published. Run the E2E tests now?"

Never auto-run. If yes: `npx playwright test tests/wN.spec.ts`, then the full
suite. A red test means the wave is not done.

---

## Gate: what "done" means for a wave

1. Static gate passed (manual read-back)
2. Published
3. Compare finished — differences either reconciled or explicitly accepted
4. E2E tests green, or explicitly deferred by the operator
5. The operator has clicked the feature in the running app

**"Mentor said it did it" is not evidence.** In this channel there is no
`change_applied` flag to over-trust, which removes one failure mode and adds
another: the only report you get is prose written by the thing being audited.
Click the feature.

---

## Failure playbook

| Symptom | Action |
|---|---|
| Mentor did only part of CHANGES | Re-prompt with only the missing items, renumbered from 1, plus the context pack. Never re-send the whole wave. |
| Mentor created extra artifacts | Name each one and ask for removal. Add its shape to DO NOT TOUCH in the next prompt. Extras compound across waves. |
| Mentor broke an earlier wave | Stop. Do not continue. Re-prompt naming the artifact and the behaviour it must return to. Then check whether it was in DO NOT TOUCH — if not, the defect is in your prompt. |
| Mentor refuses or contradicts itself | Paste its answer back into the planning session. Usually the spec is wrong, not Mentor. |
| Third re-prompt on the same wave | Stop re-prompting. Split the wave at its stall point and emit two prompts. |
| Screen looks right, breaks when clicked | This is what the plan exists to catch. Reproduce, then re-prompt against the same wave. Do not advance. |
| Playwright can't find an element | Check `data-test` landed. Then check the selector pitfalls in SKILL.md — `Title` is a `<span>`, `TableRecords` ids land on `<td>`. The test is usually wrong before the app is. |
| Prompt over 200 lines | The wave is too big. Split it before pasting, not after. |

---

## Execution log

All execution detail lives in `execution-log.md`. One entry per wave:

```
## W<N> — <name>  |  <started> → <finished>
- Prompt: prompts/w<N>.md (<N> lines), canal <x> — pasted once
- [Re-prompt <n>: <what was missing or wrong in the prompt>]
- [Deviation: <what Mentor did instead> → <how resolved>]
- Compare: <N> differences — <N> reconciled, <N> accepted (fidelidade <x>)
- Gate: PASS
- Tests: <N>/<N> pass
- Status: DONE
```

Bracketed lines only when something happened. Every re-prompt reason is one
line — that list is the entire input to the retrospective.

---

## Never

- Auto-publish. Publishing is a human decision every time.
- Paste a prompt that differs from what is in `prompts/wN.md`. Edit the file first.
- Report a wave complete on Mentor's own account of what it did. Click it.
- Advance on a failed gate or red tests.
- Loosen a test to make a wave pass. Fix the app, or amend spec and test together.
- Re-send a full wave prompt after a partial success.
- Create placeholder screens for a future wave's links.
- Put a hex literal in a screen or block.
- Let a reconcile loop run past two rounds on a `secundária` screen.
- Describe a component instead of naming the OutSystems UI block.

---

## PoC handover checklist

For a project classified **PoC**. See `templates/POC-HANDOVER.md`. Do not run
upstream's pre-production checklist against a PoC — synthetic data and stubs are
deliverables here, not debt.

---

## Retrospective (fill after the last committed wave)

Answer from the log, not from memory:

1. Which waves needed a re-prompt, and what was missing from the prompt?
2. Which differences did Compare find that the static gate could not?
3. Which of those became accepted diffs, and did anyone notice in the demo?
4. What did Mentor get wrong more than once? Each repeat goes into
   `skill/references/prototype-to-widgets.md` or the guardrails — once is
   anecdote, twice is a rule.
5. What did this RUNBOOK say that turned out to be wrong?

Then produce the next project's plan in a new folder. Carry forward what held.
