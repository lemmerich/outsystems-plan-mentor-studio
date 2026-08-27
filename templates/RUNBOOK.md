# RUNBOOK — [Project Name]

**Spec:** [SDD file path]
**Design reference:** [design-system.md or "none"]
**Target:** OutSystems Developer Cloud (ODC)
**Build method:** ODC Mentor, one wave at a time

> Resolve tenant and app at the start of every session with `auth_status` and
> `app_list`. Never carry a key from a previous session without re-resolving.

| | |
|---|---|
| Tenant | _resolve with `auth_status`_ |
| App name | [app name] |
| App key | _resolve with `app_list`_ |
| Baseline | _measure before the first Mentor turn_ |

---

## Wave plan

| Wave | Name | Proves | Scope | Status |
|---|---|---|---|---|
| W1 | Foundation | Shell renders, seed data exists | entities, theme, 1 screen | — |
| W2 | … | … | … | — |
| — | — | **committed scope ends here** | — | — |
| W… | Admin screens | CRUD for reference data | +2 screens | DEFERRED |
| W… | Reporting | Dashboard and drilldown | +2 screens | DEFERRED |

---

## Per-wave procedure

For each wave, in order:

**0. Record wave start**

```bash
date "+%H:%M:%S"
```

Store this as the wave's `started` time. Never estimate it later.

**1. Fire Mentor**

For the first wave (new app):
```
app_create(name: "[app name]")  →  app_key
mentor_start(app_key, prompt: <wave spec + SDD + design-system>)
```

For subsequent waves (resume session):
```
mentor_start(
  mentor_session_id:    <from previous wave>,
  mentor_session_token: <from previous wave's terminal result>,
  fresh_context: true,
  prompt: <wave spec + SDD + design-system>
)
```

Always prepend these guardrails to the prompt:
- No hex literals — every color is a theme variable
- Use verified OutSystems UI block names only — no bare HTML
- ODC terminology only (no "Service Studio", no "eSpace")
- Section "Out of scope" is absolute
- Never call `eSpace.AddDependency`
- Add every `data-test` attribute listed in the spec, spelled exactly

**2. Poll**

Honor `pollAfterMs`. Do not poll in a tight loop.
Stop on `succeeded`, `failed`, or `cancelled`.
A run still active past ~30 minutes is stuck — cancel and split at the wave's designated split point.

**Never delegate the fire-and-poll loop to a subagent.** Subagents have no real clock and will fabricate durations. Fire and poll in the orchestrating session.

**3. Static gate**

Before publishing, verify with `context_entities` / `context_actions` / `context_screens`:
- Entity count matches the wave's expected total
- Action count matches
- Screen count matches
- Zero hex literals in any screen or block
- No role created that the wave spec did not authorize

Check row `timestamp` — rows older than the Mentor turn are stale and prove nothing.

**4. Publish**

Publishing is a human decision. Prepare the call, report it, wait for confirmation.

After publish, verify with `env_app` that the new revision is live.

**5. Record wave end and ask about tests**

```bash
date "+%H:%M:%S"
```

Store this as the wave's `finished` time. Then ask:

Report: "Wave N is published. Do you want to run the E2E tests now?"

If yes: `npx playwright test tests/wN.spec.ts`
Run the full suite (all previous waves too): `npx playwright test`
A red test means the wave is not done. Do not proceed to the next wave.

If no: record the decision in the timing log and proceed.

---

## Gate: what "done" means for a wave

A wave is done when:
1. Static gate passed
2. Published (new revision confirmed)
3. E2E tests green (or explicitly deferred by user decision)
4. User has clicked the feature in the running app

**`change_applied: true` is necessary but not sufficient.** Read the model back.
A rename can report success with a fresh revision and still have the old name deployed. Check the timestamp on returned rows.

---

## Failure playbook

| Symptom | Action |
|---|---|
| `change_applied: false` on a `succeeded` run | Re-fire once with `fresh_context: true`. If it repeats, escalate to a stronger model. |
| `change_applied: true` but `context_*` shows the old state | Check the row timestamp. If newer than the turn, it silently did not land — re-fire and ask Mentor to verify per item. |
| Run stuck past ~30 min in `applyModelApiCode` | Cancel. Split the wave at the designated split point in its spec. Fire the halves separately. |
| `publish_status` 404 | The record expired. Check `app_revisions` — do NOT re-publish to find out. |
| Count is off by one | Something extra was created. Find it with `context_*` and remove it. Extra artifacts compound across waves. |
| A named block does not exist | The spec is wrong, not Mentor. Verify the real name with `context_search`, fix the spec, re-fire. |
| Feature built but broken when clicked | This is what the whole plan exists to catch. Diagnose with `app_logs` / `db_query`, then fire a fix turn against the same wave. Do not proceed to the next wave. |
| `run_already_in_flight` | Wait or cancel. Never fire a parallel run. |

**Escalate to a stronger model when:** a wave fails twice; a gate result is ambiguous; a fix requires amending a spec; an invariant rule is in question.

---

## Execution log

All execution details live in `execution-log.md` (created alongside this file).

After each wave: append one entry. Format:

```
## W<N> — <name>  |  <started> → <finished>
- Turn <n>: <runId short>, <HH:MM>→<HH:MM> (<Xm>), retries=<N> → applied
- [Deviation: <what> → <how resolved>]
- [Fix turn: <runId short>, <Xm>, retries=<N> → <what was fixed>]
- Publish: rev <N>
- Gate: PASS
- Tests: <N>/<N> pass
- Status: DONE
```

Include deviation/fix lines only when something actually happened.
Every timestamp from `date "+%H:%M:%S"` — never estimated.
Write the entry once per wave, when the wave closes.

---

## Never

- Auto-publish. Publishing is a human decision every time.
- Report a wave complete on `change_applied` or a clean publish alone. Read the model back. Click the feature.
- Blame Context Service lag without checking the row timestamp first.
- Fire the next wave on a failed gate or red tests.
- Loosen a test to make a wave pass — fix the app or amend the spec and the test together.
- Poll in a tight loop. Honor `pollAfterMs`.
- Call `eSpace.AddDependency` — known broken. Surface needed references for manual wiring.
- Create placeholder screens for a future wave's links.
- Put a hex literal in a screen or block.
- Re-publish on a 404 `publish_status` — check `app_revisions` first.
- Delegate fire-and-poll to a subagent. Subagents fabricate durations.
- Trust a zero-artifact count on a seconds-old app — the Context Service indexes asynchronously.

---

## Pre-production checklist

Work through this before any promotion beyond Development:

- [ ] `DemoModeEnabled` (if used) defaults to `False` — stubs must fail loudly, not return synthetic data
- [ ] Every row where `IsSyntheticData = True` has been reviewed and removed or marked
- [ ] All external boundaries (AI, document extraction) have real implementations, not stubs
- [ ] No screen is anonymous/public if the app requires authentication
- [ ] Theme contrast ratios verified (secondary text on surface background ≥ 4.5:1)
- [ ] No `data-test` attributes left that exist only for testing
- [ ] `.env`, credentials, and test auth files are git-ignored

---

## Retrospective (fill after last committed wave)

Answer from the timing log, not from memory:

1. Which waves needed more than one turn, and why? (spec too large, too vague, or wrong?)
2. Which gate caught a real defect that looked correct on screen?
3. Which Playwright tests were flaky, and what made them flaky?
4. What did Mentor get wrong repeatedly? (Add each to the wave prompt guardrails.)
5. What did this RUNBOOK say that turned out to be wrong? (Fix it before the next project.)

Then: produce the next version of the plan in a new folder. Carry forward what held. Drop what did not.
