# outsystems-plan

An AI skill for planning OutSystems projects built with ODC Mentor.
Guides you from a blank folder to a complete build plan through a short
interactive interview.

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

Follow `RUNBOOK.md`. Each wave follows the same cycle:

```
1. Fire Mentor with the wave spec
2. Static gate: verify entity/action/screen counts, zero hex literals
3. Publish (you decide when)
4. Skill asks: "Run E2E tests now?"
5. Log the wave in execution-log.md
6. Move to the next wave
```

Tests are always separate from implementation — you decide when to run them.

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

# 4. Commit
git add skill/SKILL.md
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
| 0.1.0 | Initial version — derived from one real build |
