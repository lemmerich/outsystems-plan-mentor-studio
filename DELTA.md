# DELTA — What changed from upstream

Fork of `rodginez/outsystems-plan` v0.7.0 (commit `aae2e14`).

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

## 5. Reconcile budget and `fidelidade` field

Upstream reconciles 4 → 5 → 4 until no diffs remain, which is right when
reconciliation costs an MCP call. Here each round costs copy-paste-run-publish
with a human in the middle.

Two rounds per wave. After that, remaining diffs are recorded as accepted and
the wave closes. Exception: waves with `fidelidade: demo`, screens in the demo
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
`fidelidade: demo`, and IS the `tests/demo.spec.ts`. It stays verbatim in RUNBOOK.

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
| `skill/SKILL.md` | adapted (new channel section, Step 0, channel/fidelidade, guardrails 8-10, log without MCP) |
| `skill/references/prototype-to-widgets.md` | unchanged |
| `skill/references/mentor-studio-prompt.md` | new |
| `templates/RUNBOOK.md` | rewritten |
| `templates/spec-wave.md` | adapted (channel, fidelidade, DO NOT TOUCH, stall) |
| `templates/wave-prompt.md` | new |
| `templates/SPEC-REVIEW.md` | new |
| `templates/POC-HANDOVER.md` | new |
| `templates/playwright.config.ts` | adapted (HTML reporter, projects, storageState) |
| `templates/tests/auth.setup.ts` | new |
| `templates/.env.example` | adapted |
| `README.md` | from fork; original became `README-upstream.md` |

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
