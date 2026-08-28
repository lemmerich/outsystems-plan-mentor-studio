# outsystems-plan

An AI skill for planning OutSystems projects built with ODC Mentor.
Guides you from a blank folder to a complete build plan through a short
interactive interview — and, since v0.2.0, through executing each wave
via a fixed **prototype-first cycle**: every screen is built and approved
as an HTML prototype *before* Mentor ever touches it, and the published
result is compared against that prototype (not just re-read against the
spec) before a wave is considered done.

---

## What it produces

Running `/outsystems-plan` in any project folder creates:

```
RUNBOOK.md          execution guide — wave order, gates, failure playbook
execution-log.md    one entry per wave: turns, deviations, test results
spec-w1.md          wave 1 spec (what to build + E2E test cases)
spec-w2.md          wave 2 spec
…
tests/
  playwright.config.ts
  package.json
  .env.example
  support/selectors.ts   all locators and PT-BR messages in one place
  support/fixtures.ts    one Page per role
  w1.spec.ts
  w2.spec.ts
  …
  files/README.md
```

---

## Installation (once)

```bash
git clone <this-repo> outsystems-plan
cd outsystems-plan
mkdir -p ~/.claude/skills/outsystems-plan
cp skill/SKILL.md ~/.claude/skills/outsystems-plan/SKILL.md
cp -r skill/references ~/.claude/skills/outsystems-plan/references
```

To confirm it installed, open any Claude Code session and type `/outsystems-plan`.
You should see the skill offered.

---

## Starting a new project

```bash
mkdir my-project
cd my-project
claude
```

Inside Claude Code:

```
/outsystems-plan
```

The skill asks 6 questions in order:

1. **Specification** — paste text, give a file path, or attach the document
2. **Additional reference materials** — design system, data model, API contracts, glossary (or skip)
3. **Reference screens** — screenshots or Figma exports showing the visual style (or skip)
4. **Value path** — the shortest sequence a user needs to complete for the product to be useful
5. **Target environment** — new or existing app, open or authenticated
6. **Wave breakdown review** — the skill proposes waves; you confirm or adjust

After confirmation, all files are generated in the current folder.

---

## Executing the plan

Follow `RUNBOOK.md`. Each wave follows the same fixed six-step cycle —
skip a step only if you explicitly say so; the skill will otherwise name
the next step before doing anything else:

```
1. Prototype    — build/evolve the screen(s) in the living HTML prototype
2. Approve      — you sign off on the prototype change explicitly
3. Execute      — spec updated from the approved prototype; Mentor fires
                  with box-model facts in the prompt (not just a picture);
                  publish
4. Compare      — the published screen is opened next to the approved
                  prototype and every difference is listed — not just the
                  first one found
5. Reconcile    — each difference gets fixed in the app (usually) or in
                  the prototype/spec (if that was the actual oversight),
                  then back to step 4 until nothing's left
6. Test         — E2E cases updated for what changed; skill asks "run
                  tests now?" — never auto-runs; evidence (an HTML test
                  report, not just a pass/fail tally) gets logged
```

A wave isn't done because Mentor said `change_applied: true` — it's done
after step 4 finds nothing left to reconcile and step 6's tests pass.

---

## Updating the skill

When you improve the skill (fix a bug, add a lesson learned, refine the interview):

```bash
# 1. Edit the source
code skill/SKILL.md

# 2. Bump the version in the frontmatter (semver: patch / minor / major)
#    version: "0.1.0"  →  "0.1.1"

# 3. Sync to your local Claude skills folder
cp skill/SKILL.md ~/.claude/skills/outsystems-plan/SKILL.md
cp -r skill/references ~/.claude/skills/outsystems-plan/references

# 4. Commit
git add skill/SKILL.md skill/references
git commit -m "skill: <what changed and why>"

# 5. Tag if it's a stable release
git tag v0.1.1
git push && git push --tags
```

### Version meaning

- **patch** (0.1.x) — fix a wrong instruction, add a missing pitfall
- **minor** (0.x.0) — new interview question, new template section, new output file
- **major** (x.0.0) — the process changes in a way that makes old plans incompatible

---

## Repository structure

```
skill/
  SKILL.md              the AI skill — this is what gets installed
  references/
    prototype-to-widgets.md  HTML/CSS → OutSystems UI conversion guide,
                              built from real recurring translation bugs
                              (box model, class-name mismatches, platform
                              defaults) — read before writing a wave's
                              Screen layout section or a Mentor prompt
templates/
  RUNBOOK.md            base for every project's execution guide
  spec-wave.md          template for each wave spec
  playwright.config.ts  correct testIdAttribute for OutSystems
  package.json
  .env.example
  tests/
    support/
      selectors.ts      locator patterns + verbatim message store
      fixtures.ts       role-based page fixtures
    files/README.md
    README.md
README.md               this file
```

---

## Versioning history

| Version | What changed |
|---|---|
| 0.5.0 | Test evidence is now required, not just a tally: `playwright.config.ts` ships with an HTML reporter by default, and the wave log must record its path (overwritten each run — that's expected, not a gap). |
| 0.4.0 | Added `references/prototype-to-widgets.md` — an HTML→OutSystems-widgets conversion guide distilled from real recurring bugs (layout placeholders that aren't stacked divs, fill-parent-by-default containers, flex `min-width` shrink, `Adaptive` margin misalignment, reserved theme class names, canonical vs. invented CSS variables, and when a pattern like list→detail is already a built-in block). |
| 0.3.0 | Screenshots alone under-specify box model. Added a mandatory "box model facts" requirement: every wave spec's Screen layout section, and every Mentor prompt, must state in words what a picture can't show — explicit max-width/width for any non-fill-parent container, which elements stack as blocks vs. share a row, and which flex children need `min-width: 0`. |
| 0.2.0 | Introduced the **prototype-first principle** and the **wave execution cycle**: every UI wave is prototyped in HTML and explicitly approved before Mentor is ever prompted; the prototype (not ASCII art) becomes the wave spec's Screen layout source; the static gate now includes "screen matches the approved prototype screenshot," not just a text re-read. Added a "living prototype" pattern — one cumulative HTML file evolved and republished wave over wave, not a throwaway mockup per wave. |
| 0.1.0 | Initial version — derived from one real build |
