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

## The prototype-to-widgets reference

`skill/references/prototype-to-widgets.md` is a short conversion guide the
skill loads before writing a wave's Screen layout section or a Mentor
prompt. It exists because step 4 of the cycle above (Compare) keeps finding
the same handful of bug shapes, over and over, across unrelated projects —
not typos, but places where an HTML prototype's CSS says one thing and the
OutSystems UI default says another, and nothing in a screenshot signals the
mismatch:

- a layout's `Title` and `Header` placeholders sit in different regions of
  the top bar, not stacked — content meant as a subtitle *inside* the title
  block ends up next to it instead
- every non-Column container defaults to fill-parent; a prototype's
  `max-width` cap doesn't survive into the prompt unless it's stated as a
  number
- flex children don't shrink below their content width by default —
  dynamic text wraps early with no visual cue in the reference screenshot
- `MarginLeft: Adaptive` silently offsets sibling text widgets from each
  other
- five class names (`sidebar`, `header`, `content`, `main-content`,
  `footer`) collide with the platform's own theme rules
- a prototype's own invented CSS variables work but don't propagate the
  way overriding OutSystems UI's *canonical* variables does
- a "click a row, see a detail view" pattern is sometimes just the
  `MasterDetail` block, not something to hand-build

Each entry states the failure mode and what to say in the prompt to avoid
it — it's an accumulated-bugs list, not a full OS UI catalog. For anything
outside these recurring cases, it points to `outsystems-design-to-app`'s
deeper reference library. Read it once per wave, before the screenshot goes
into the prompt — that's the whole workflow.

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
| 0.7.0 | Two new `prototype-to-widgets.md` entries from a real wave: (1) a link can be empty — content placed *beside* the anchor instead of *inside* it looks fixed but is unclickable; (2) re-parenting elements (e.g. moving them inside a new link to fix #1) drops them out of the old parent's flex context, since `display: flex` only arranges direct children — the new wrapper needs its own flex rule restated. |
| 0.6.0 | Hard cap: never more than one screen per wave, no exceptions — a list+detail pair discovered together in the prototype is still two waves. Data seeds don't count against the cap but should be weighed for real size. |
| 0.5.0 | Test evidence is now required, not just a tally: `playwright.config.ts` ships with an HTML reporter by default, and the wave log must record its path (overwritten each run — that's expected, not a gap). |
| 0.4.0 | Added `references/prototype-to-widgets.md` — an HTML→OutSystems-widgets conversion guide distilled from real recurring bugs (layout placeholders that aren't stacked divs, fill-parent-by-default containers, flex `min-width` shrink, `Adaptive` margin misalignment, reserved theme class names, canonical vs. invented CSS variables, and when a pattern like list→detail is already a built-in block). |
| 0.3.0 | Screenshots alone under-specify box model. Added a mandatory "box model facts" requirement: every wave spec's Screen layout section, and every Mentor prompt, must state in words what a picture can't show — explicit max-width/width for any non-fill-parent container, which elements stack as blocks vs. share a row, and which flex children need `min-width: 0`. |
| 0.2.0 | Introduced the **prototype-first principle** and the **wave execution cycle**: every UI wave is prototyped in HTML and explicitly approved before Mentor is ever prompted; the prototype (not ASCII art) becomes the wave spec's Screen layout source; the static gate now includes "screen matches the approved prototype screenshot," not just a text re-read. Added a "living prototype" pattern — one cumulative HTML file evolved and republished wave over wave, not a throwaway mockup per wave. |
| 0.1.0 | Initial version — derived from one real build |
