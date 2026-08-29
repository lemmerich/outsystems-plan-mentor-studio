# PoC handover — [Project name]

For projects classified **PoC**. Upstream's pre-production checklist assumes the
build is becoming a product; a PoC's stubs and synthetic data are deliverables,
not debt. What matters instead is that nobody mistakes one for the other.

## Before the demo

- [ ] `tests/demo.spec.ts` green on the environment being demoed
- [ ] Every `fidelidade: demo` screen compared against the prototype with zero
      outstanding differences
- [ ] Seed data reads like the customer's world: real-sounding names, plausible
      dates, realistic volume on the screens the demo opens
- [ ] Every stub returns something plausible, and fails visibly if the demo goes
      off-script rather than returning silence
- [ ] Login for the demo user works from a clean browser profile
- [ ] Accepted diffs from `secundária` screens reviewed once — is any of them on
      screen during the demo after all?

## Handing the PoC to someone else

- [ ] `README.md` names the app, the environment, the demo user and the demo script
- [ ] `execution-log.md` complete — including accepted diffs
- [ ] The living prototype URL still resolves and matches the built app
- [ ] Every stub and every synthetic seed is listed below, by name

| What | Where | Real implementation would need |
|---|---|---|
| [stub / seed] | [module, action] | [one line] |

## If the PoC gets promoted

None of the above transfers. Re-plan against upstream's pre-production
checklist: the module split a PoC deliberately skipped, the entity model derived
from screens rather than modeled, and every row in the table above. Say this out
loud when the promotion is proposed — a PoC that quietly becomes production is
the most expensive outcome this whole process exists to avoid.
