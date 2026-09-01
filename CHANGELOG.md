# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project uses semantic versioning with a fork suffix:
`<upstream-base>-ms.<iteration>`. See [`VERSIONING.md`](VERSIONING.md) for details.

---

## [0.8.0-ms.3] — 2026-09-01

### Fixed
- `references/mentor-studio-prompt.md` §2 (The context pack): added an
  explicit rule against writing a wave number as a stand-in for a fact
  inside the copy-paste fence — "already published in W1" or "same
  pattern as W0" means nothing to Mentor, which has no memory of past
  waves, no wave table, no concept of a wave at all. Caught live: a W2
  prompt referenced "W0"/"W1" throughout instead of restating the actual
  facts (an action already exists, uses a specific Forge component; an
  upload pattern already exists, described in full) as facts about the
  current app state. The section 3 "prompt must be self-contained AND
  small" principle already existed but had no concrete before/after
  example calling out this exact anti-pattern — added one.

---

## [0.8.0-ms.2] — 2026-08-31

### Added
- Six more `prototype-to-widgets.md` entries (#35–#40) from the rest of
  the W1 wave, all generalized beyond this project: an edit-toggle
  appending the form instead of replacing the view (duplicating every
  shared field); hiding a wrapping container with `display: none` can
  silently disable a `position: fixed` component nested inside it (an
  off-canvas drawer inside the sidebar wrapper) even though the app's
  own state still thinks it's open; two independently-correct responsive
  breakpoint rules can leave an exact-pixel dead zone where neither
  applies, diagnosed fastest by bisection rather than round-number
  guesses; a fix prompt aimed at a placeholder string's wording can get
  "fixed" by rewording the placeholder instead of implementing the real
  dynamic rendering behind it — break the loop by specifying the required
  DOM shape (child element count) instead of describing the text as
  wrong; Editar/Salvar/Cancelar buttons rendering on a row proves nothing
  about whether an edit-mode template was ever built for it — verify by
  counting actual form-control elements, not by trusting button presence;
  a `data-test` meant for each item of a repeated list can land on the
  list's own wrapping container instead, resolving to 1 match instead of
  N with every item's text concatenated together.
- Two new `recipes.md` entries matching #35 and #40 above, each with a
  prompt block and a post-publish DOM-count verification snippet.
- `SKILL.md`: extended the substring-matching E2E pitfall to cover
  `.filter({ hasText })` collisions (not just `getByRole`'s `name`) —
  "Ativa" matching inside "Inativa" is the same trap as the existing
  radio-label example; added a bullet on verifying a list `data-test`
  resolves to N items, not 1.

---

## [0.8.0-ms.1] — 2026-08-31

### Added
- Rebased skill reference content onto upstream `rodginez/outsystems-plan`
  v0.8.0 (commit `a1ef0f4`): pulled forward `skill/references/recipes.md`
  (new file, 14 copy-paste Mentor prompt blocks for recurring UI patterns —
  dropdown all/empty option, modal-with-form, sticky footer, per-row list
  controls, bulk-save, icon+label link wrapping, reserved theme class
  names, `MasterDetail`, appearance resets, external fonts, dumping
  matching CSS rules before a fix, retiring an old stopgap in the same
  turn a real fix lands) and twenty new `prototype-to-widgets.md` entries
  (#11–#30) from real upstream waves.
- `SKILL.md`: re-check the plan itself (stale `RUNBOOK.md`/`spec-wN.md`)
  at the start of every wave, not just once; Compare step now also checks
  every other screen that already lists/references an entity a wave adds
  a new field to, and re-measures box-model facts on the live screen
  rather than eyeballing; Reconcile step now dumps every matching CSS rule
  before writing a fix prompt for an element a prior wave already
  patched, and retires the old stopgap in the same turn; points to
  `recipes.md` before writing a Mentor prompt for a recognized UI
  pattern; static gate now requires interacting with a per-row list
  control in two different rows before declaring it verified. Three new
  E2E lessons: `getByRole` substring-matching collisions need
  `exact: true`; a navigation-triggering helper must wait for the
  navigation to land before returning; synthetic DOM events from browser
  automation can update local state without firing the app's own
  `OnChange` binding — confirm any such finding with a real click before
  reporting it as a bug.

- Four new `prototype-to-widgets.md` entries (#31–#34) from this fork's
  own W1 wave (Onni AI PoC): a "duplicate this record" action (Versionar)
  can echo copied fields in the client without ever persisting them
  server-side — verify by navigating away and back, not by reading
  `.value` right after the action fires; a form field can look blank
  because its text color nearly matches its own background, not because
  the value failed to save — compare computed `color` against computed
  `background-color` before chasing a data bug; a CSS fix scoped to one
  piece of the platform shell's responsive sidebar/header system can
  silently break the *other* piece (the off-canvas drawer stuck full-
  viewport at desktop, or the hamburger toggle's header staying `display:
  none` at every width) — always re-verify at both a desktop and a
  tablet/mobile width; switching between sibling records in a
  client-rendered detail panel can leave one specific UI block (often a
  header form) stuck showing the previously-selected sibling's state even
  after other blocks on the same screen update correctly.
- New `recipes.md` entry: "any CSS fix touching the platform shell's
  sidebar/header/nav containers" — a prompt block requiring two-viewport
  verification plus a console snippet that catches the drawer/header
  regression directly, paired with the new `SKILL.md` Reconcile-step
  requirement to run it for any fix touching those containers.

### Notes
- Adaptations specific to this fork (Mentor Studio manual-paste workflow,
  `Módulo alvo:` multi-artifact sections, the async-agent-call guardrail,
  Portuguese wave-log conventions) are unchanged by this sync — only
  upstream's general OutSystems/Mentor lessons were pulled forward, and
  only where they didn't conflict with this fork's own adaptations.

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
