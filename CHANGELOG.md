# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project uses semantic versioning with a fork suffix:
`<upstream-base>-ms.<iteration>`. See [`VERSIONING.md`](VERSIONING.md) for details.

---

## [0.7.0-ms.2] — 2026-08-30

### Added
- **Multi-artifact projects**: a project can now provision more than one ODC
  artifact — the web app plus one or more Agentic Apps (Agent Workbench agents).
  New **Step 0 — Provisioning**: create every artifact empty, with final names
  fixed up front, before any wave starts. Recorded in RUNBOOK.md as its own
  section (never a wave — it produces nothing clickable, so it gets no wave
  number and no row in the wave table).
- **`Módulo alvo:` sections**: a single wave can now span more than one ODC
  artifact (e.g. a screen that calls an agent) without breaking the
  one-testable-outcome-per-wave rule. `prompts/wN.md` gets one fenced prompt
  per artifact touched, each under its own `## Módulo alvo: <ArtifactName>`
  heading, pasted into that artifact's own Mentor Studio session.
- **Guardrail 11 (async agent calls)**: any communication with an Agent
  Workbench agent MUST go through the ODC event mechanism (publish/subscribe)
  — never a synchronous call blocking the UI on the agent's response.
- **Guardrail 12 (module routing)**: paste each `Módulo alvo:` section into
  that artifact's own session — never mix web-app and Agentic App content.
- **W0 gets a real Mentor Studio prompt, not just AppGen**: alongside the base
  theme/shell, W0 now always builds a permanent **"Tema & Identidade Visual"**
  screen — color swatches labeled by token name, contrast pairs, a typography
  specimen, the icon set, and every component state — so the theme wave has
  something clickable to gate on instead of a human's word that "it looks
  right." The living prototype gets the same screen, built first.
- **File format for `prompts/wN.md`** (new Section 0 in
  `references/mentor-studio-prompt.md`): every prompt to paste is a single
  self-contained fenced code block — guardrails, context, objective, changes,
  markup and expected result all inline, in the established anatomy order.
  Everything else (rationale, dependency order, post-paste checks) is prose
  *outside* the fence, always marked `> **Nota do operador (não copiar):**`.
  This replaces the earlier pattern of a shared guardrails block the operator
  had to mentally merge with a per-module block further down.

### Changed
- `SKILL.md`: "Choosing the channel per wave" table now includes provisioning
  and Agentic App configuration as explicit channel rows.
- `SKILL.md`: RUNBOOK's "Project facts" now documents the provisioned-artifacts
  table instead of a plain "app name, module names" line.
- Checklist before handing the plan over: two new items enforcing the fenced
  self-contained prompt format and the Step-0-is-not-a-wave rule.

### See also
- [`DELTA.md`](DELTA.md) — detailed breakdown of the 0.7.0-ms.1 fork-point changes

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
