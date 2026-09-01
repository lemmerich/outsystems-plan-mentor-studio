# outsystems-plan — Mentor Studio fork

Fork of [rodginez/outsystems-plan](https://github.com/rodginez/outsystems-plan)
(v0.7.0) adapted for **PoC delivery driven from Mentor Studio (ODC assistant) instead
of the OutSystems MCP**. The assistant is the chat inside ODC Studio, and humans do
the pasting — the skill moves from *orchestrating* to *emitting*.

Everything upstream learned about Mentor and OutSystems UI is kept unchanged —
that is why this is a fork and not a rewrite. See [`DELTA.md`](DELTA.md) for what
changed, why, and the file-by-file status.

## Versioning

This fork uses **semantic versioning with a fork suffix**: `<upstream-version>-ms.<fork-iteration>`.
Current: **v0.8.0-ms.5**, based on upstream v0.8.0 (commit `a1ef0f4`).

| Doc | Answers |
|---|---|
| [`CHANGELOG.md`](CHANGELOG.md) | What changed, release by release |
| [`DELTA.md`](DELTA.md) | Why this fork exists, and how it differs structurally from upstream |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to release, tag, and rebase on upstream |
| [`README-upstream.md`](README-upstream.md) | Upstream's README, frozen at the fork point (historical reference only) |

---

## What it produces

```
SPEC-REVIEW.md      ambiguities and assumptions, signed off before planning
RUNBOOK.md          wave order, gates, failure playbook, demo script
execution-log.md    one entry per wave: prompts, re-prompts, accepted diffs
spec-w0.md …        one spec per wave (canal + fidelidade on the header)
prompts/w1.md …     the paste-ready Mentor Studio prompt for each wave
prototipo-<x>.html  one living prototype, republished to the same URL
tests/
  playwright.config.ts   data-test, HTML reporter, storageState projects
  auth.setup.ts          logs in once
  demo.spec.ts           replays the demo script — the suite that must be green
  w1.spec.ts …           one per wave
```

## Install

```bash
git clone <this-repo> outsystems-plan-mentor-studio
cd outsystems-plan-mentor-studio
mkdir -p ~/.claude/skills/outsystems-plan-mentor-studio
cp skill/SKILL.md ~/.claude/skills/outsystems-plan-mentor-studio/SKILL.md
cp -r skill/references ~/.claude/skills/outsystems-plan-mentor-studio/references
```

Then, in an empty project folder: `/outsystems-plan-mentor-studio`.

## The loop

```
Spec  →  SPEC-REVIEW.md  →  demo script  →  prototype  →  waves
                                                            │
                    ┌───────────────────────────────────────┘
                    ▼
              prompts/wN.md  ──paste──▶  Mentor Studio  ──▶  publish
                    ▲                                          │
                    │                                          ▼
              re-prompt  ◀──  compare vs prototype  ◀──  static gate
                    │                                          │
                    └──────────  2 rounds max  ─────────▶  Playwright
                                (unbounded if fidelidade: demo)
```

Three things the operator types across a whole project: the spec, `W3 done`, and
occasionally `W3 done but it built two screens`.

## The recipes reference

`skill/references/recipes.md` is the companion to `prototype-to-widgets.md`:
where that file explains *why* a mechanical gap happens, `recipes.md` gives
the copy-paste Mentor Studio prompt block that already encodes the fix —
for recurring UI patterns like a dropdown with an "all"/empty option, a
modal containing a form, a sticky footer, per-row list controls, bulk-save
actions, icon+label link wrapping, reserved theme class names,
`MasterDetail`, appearance resets, external fonts, dumping every CSS rule
that currently matches an element before writing a fix prompt for it, and
retiring an old stopgap in the same turn a real fix replaces it. Check it
before writing a `prompts/wN.md` block for any UI pattern the wave is
building — a recipe used verbatim (names adjusted) skips the multi-turn
trial-and-error a natural-language description of the same pattern tends
to produce.

## Status

Not yet run end to end. The intended first use is one real wave of an existing
project, pasted by hand, to find out which of these adaptations survive contact.
