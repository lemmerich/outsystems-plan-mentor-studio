# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project uses semantic versioning with a fork suffix:
`<upstream-base>-ms.<iteration>`. See [`VERSIONING.md`](VERSIONING.md) for details.

---

## [0.7.0-ms.1] — 2026-02-20

### Added
- **Mentor Studio channel (Emit + Paste)**: Skill now emits `prompts/wN.md` for humans
  to paste into ODC Studio's assistant, instead of firing turns via MCP
- **Static gate + manual reconcile**: Gate is now a manual read of the module tree;
  two reconcile rounds per wave (unbounded for `fidelidade: demo` screens)
- **HTML + CSS in prompts**: Pruned markup and styling of each screen goes verbatim
  into prompts, replacing screenshot + prose descriptions
- **Context pack per wave**: Prompts contain only modules, entities, screens and
  actions that matter for this wave (auto-generated, never versioned)
- **PoC-specific workflow**: New Step 0 (SPEC-REVIEW.md), classification as PoC or
  final app, fidelidade budgeting, and PoC-specific handover checklist
- **Wave `canal` field**: `appgen`, `mentor-studio`, or `manual` — only mentor-studio
  waves generate prompts
- **Wave `fidelidade` field**: `demo` (on the demo script, unlimited reconcile) or
  `secundária` (two rounds, then accept and log diffs)
- **Guardrails 8-10**: Added three new guardrails specific to the Mentor Studio channel
- **Playwright improvements**: New `auth.setup.ts` for persistent login, HTML reporter,
  split `demo.spec.ts` from wave specs, `.env.example` with APP_USER/APP_PASSWORD
- **Templates**: All new/adapted templates for RUNBOOK, spec-wave, wave-prompt,
  SPEC-REVIEW, and POC-HANDOVER

### Changed
- **SKILL.md**: Complete rewrite of sections on channel, execute step, failure playbook,
  and wave structure; guardrails reformatted for clarity
- **Failure playbook**: Changed from protocol-level symptoms (MCP-specific) to observable
  symptoms (did less, did more, did different, broke previous wave)
- **Prompt limits**: 200 lines per prompt, 8 items max in CHANGES (ensures Mentor
  does not drop items from the middle unnoticed)
- **Logging**: Removed all MCP-specific fields (runId, retries, change_applied, poll
  interval, app_key, tenant, etc.) from logs and RUNBOOK
- **Upstream rebasing**: `git checkout upstream/main -- skill/references/prototype-to-widgets.md`
  resolves most merges (that file is kept verbatim)

### Kept unchanged
- All of `skill/references/prototype-to-widgets.md` (seven real HTML-to-OutSystems-UI
  failure modes — upstream's most valuable asset)
- Prototype-first principle and single cumulative prototype
- Six-step cycle including Compare (published vs. prototype side by side)
- Guardrails 1–7
- One screen per wave, 3–4 server actions per wave
- All value-path entities created by W2

### See also
- [`DELTA.md`](DELTA.md) — detailed breakdown of each change and its rationale
- [`README-upstream.md`](README-upstream.md) — upstream's original README
