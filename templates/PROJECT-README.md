# [Project Name] — orientation

Generated once when this project's plan was created. If you have never
touched this project before, read this file before anything else.

## What this is

A [PoC | final application] built on OutSystems Developer Cloud (ODC),
planned and executed with the `outsystems-plan-mentor-studio` skill:
prompts are pasted by hand into Mentor Studio (the chat assistant inside
ODC Studio), not driven through the OutSystems MCP.

## Where to start

1. Open **`RUNBOOK.md`** — it is the single source of truth: the wave plan,
   the demo script, the current-wave pointer, the failure playbook, and the
   "Never" list. Everything else in this project exists to support it.
2. Read `## Current wave` at the top of `RUNBOOK.md` to see where execution
   left off, then the last entry in `execution-log.md`.
3. Open the living prototype (Artifact URL in `RUNBOOK.md`'s facts table)
   and the dev environment side by side before touching anything — the
   running app is the only state that counts, not this project's own notes.

## Folder map

| Path | What it's for | Touch it when |
|---|---|---|
| `RUNBOOK.md` | wave order, gates, playbook | reading the plan, updating `## Current wave` |
| `specs/spec-wN.md` | one file per wave: scope, screens, test cases | planning or re-planning a wave, before writing its prompt |
| `prompts/wN.md` | the prompt actually pasted into Mentor Studio for wave N | emitting a wave, never hand-edited after pasting without updating the file first |
| `prompts/wN-fixM.md` | reconcile fixes for wave N, in order | fixing a difference found in Compare — always a new file, never appended to `wN.md` |
| `prompts/extra-P.md` | ad-hoc prompts not tied to any wave | a one-off debugging or maintenance session |
| `execution-log.md` | one entry per wave: what was pasted, re-prompts, accepted diffs | after every wave publishes, before running tests |
| `tests/wN.spec.ts` | Playwright E2E tests, one file per wave | after a wave's spec test cases are written, or when a gap in coverage is found |
| `tests/demo.spec.ts` | replays the demo script end to end | must stay green — a red result here blocks the demo, not just a wave |
| SPEC-REVIEW.md | ambiguities and assumptions signed off before planning | before planning starts, or if a stale assumption surfaces mid-build |

## What NOT to do

- Do not paste a prompt into Mentor Studio that differs from what is saved
  in `prompts/`. Edit the file first, then paste — otherwise what ran and
  what is on disk are two different things.
- Do not report a wave complete on Mentor's own account of what it did.
  Click the feature in the running app.
- Do not append a reconcile fix as a new section inside `wN.md`. Every fix
  is its own `wN-fixM.md` file.
- Do not loosen a test to make a wave pass. Fix the app, or change the spec
  and the test together, deliberately.
- Do not build ahead into a future wave's scope, even if it looks easy from
  where you are. The spec's "Out of scope" section exists to stop exactly this.
- Do not auto-publish. Publishing in ODC Studio is a human decision, every time.

## Where to go for the "why"

`RUNBOOK.md`'s "Retrospective" section (filled in after the last committed
wave) records what needed a re-prompt and why, and which lessons were
promoted into the skill's own reference files. If something about this
project's plan looks unusual, that section — or `execution-log.md` — is
more likely to explain it than guessing.
