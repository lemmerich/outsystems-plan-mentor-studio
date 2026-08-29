# outsystems-plan — Mentor Studio fork

Fork of [rodginez/outsystems-plan](https://github.com/rodginez/outsystems-plan)
(v0.7.0) for a **PoC factory driven from Mentor Studio instead of the OutSystems
MCP**. Upstream's README is kept as `README-upstream.md`.

Upstream fires Mentor programmatically: it starts a turn, polls it, reads the
model back with `context_*` and publishes. This fork assumes none of that
exists. The assistant is the chat inside ODC Studio, and a human does the
pasting, so the skill's job changes from *orchestrating* to *emitting*: it
produces one paste-ready prompt per wave and then verifies what came back.

Everything upstream learned about Mentor and OutSystems UI is kept unchanged —
that is why this is a fork and not a rewrite.

**What changed and why: [`DELTA.md`](DELTA.md).**

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

## Status

Not yet run end to end. The intended first use is one real wave of an existing
project, pasted by hand, to find out which of these adaptations survive contact.
