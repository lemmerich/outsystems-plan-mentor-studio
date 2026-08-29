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

- **Upstream v0.7.0** is the base (commit `aae2e14`)
- **v0.7.0-ms.1** is the first iteration of this fork (initial Mentor Studio adaptation)
- **v0.7.0-ms.2**, etc. are follow-up evolutions without upstreaming
- When upstream ships v0.8.0, rebase/merge decisions start [here](VERSIONING.md)

See [`VERSIONING.md`](VERSIONING.md) for the full strategy: how to evolve this fork,
when to rebase on upstream, and how to document it all.

**Change log:** [`CHANGELOG.md`](CHANGELOG.md)

**Original upstream:** [`README-upstream.md`](README-upstream.md)

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
