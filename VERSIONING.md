# Versioning strategy for outsystems-plan-mentor-studio

This fork evolves separately from upstream while remaining rebassable. This document
defines how to version, tag, and eventually merge back or track upstream changes.

---

## Version format

```
<upstream-base>-ms.<iteration>
```

- **Upstream base**: the version this fork was created from (e.g. `0.7.0`)
- **ms**: Mentor Studio (the fork identifier)
- **iteration**: counter starting at 1, increments with each release of this fork

**Examples:**
- `0.7.0-ms.1` — first release of this fork, based on upstream v0.7.0
- `0.7.0-ms.2` — second release, still evolving on the same upstream version
- `0.8.0-ms.1` — if/when we rebase on upstream v0.8.0, this becomes the new base

---

## When to increment

**Increment `-ms.<iteration>` when:**
- Releasing a set of features, fixes, or docs for use by another team
- Tagging a stable point to reference in demos, PoCs, or production projects
- SKILL.md version field changes (e.g. `0.7.0-ms.1` in the skill frontmatter)

**Do NOT increment for:**
- Internal work-in-progress commits
- Documentation-only fixes
- Experimental branches

---

## How to tag and release

### 1. Update version everywhere

Before releasing, bump the version in:
- `skill/SKILL.md` — frontmatter `version:` field
- `CHANGELOG.md` — new entry at the top
- Commit message should mention the new version

Example:

```bash
# Edit files
$EDITOR skill/SKILL.md CHANGELOG.md README.md

# Stage and commit
git add skill/SKILL.md CHANGELOG.md README.md
git commit -m "chore: release 0.7.0-ms.2

- [feature/bugfix summary]
- [feature/bugfix summary]
- See CHANGELOG.md for full list"

# Tag the commit
git tag -a v0.7.0-ms.2 -m "Release 0.7.0-ms.2: [short summary]"
git push origin mentor-studio --tags
```

### 2. Document in CHANGELOG.md

Every version gets an entry. See format below.

---

## Handling upstream updates

### Scenario 1: Upstream releases a patch (e.g., v0.7.1)

Decide: does it affect Mentor Studio?

- **No** → Ignore it. Your fork stays on `0.7.0-ms.*`
- **Yes** → Rebase, then tag as `0.7.1-ms.1`

**Rebase steps:**

```bash
git remote update upstream
git rebase upstream/main

# Resolve conflicts if any. Most conflicts will be in SKILL.md, RUNBOOK.md, spec-wave.md
# These diverge on purpose, so keep your version and note the delta.

git push -f origin mentor-studio
git tag -a v0.7.1-ms.1 -m "Rebase on upstream v0.7.1"
git push origin v0.7.1-ms.1
```

**Update DELTA.md** if upstream changed files that are also in DELTA (usually
`prototype-to-widgets.md` — that is always taken from upstream verbatim).

### Scenario 2: Upstream releases a minor version (e.g., v0.8.0)

Same process as Scenario 1, but:
- More likely to have conflicts (new features added upstream)
- Update DELTA.md more carefully — there may be new sections in SKILL.md
- Consider whether to cherry-pick upstream features or stay on 0.7

### Scenario 3: You want to upstream a fix or feature

If your fork solves something upstream should have:

1. Extract the commit(s) to a patch file:
   ```bash
   git format-patch upstream/main..HEAD -- <filename>
   ```

2. PR it against upstream: https://github.com/rodginez/outsystems-plan

3. After merge, rebase this fork on upstream to pull it in (Scenario 1)

---

## Commit message conventions

Use conventional commits to keep history readable:

```
chore:    version bumps, tag releases, housekeeping
docs:     documentation, CHANGELOG, DELTA updates
feat:     new features or capabilities
fix:      bug fixes
refactor: structure changes without behavior change
test:     test additions or fixes
fork:     fork-specific adaptations (initial DELTA items)
```

Examples:

```
feat: add context pack auto-generation for prompts/wN.md
fix: preserve data-test attributes in HTML pruning
docs: clarify the channel section in SKILL.md
chore: release 0.7.0-ms.2
fork: adapt guardrail 9 for non-MCP channel
```

---

## CHANGELOG format

Keep it at the top of `CHANGELOG.md`. Example:

```markdown
## [0.7.0-ms.2] — 2026-03-15

### Added
- Automatic context pack generation from wave table
- Support for fidelidade field in spec-wave template

### Fixed
- Data-test attributes now preserved in HTML pruning
- Prompt line-count validation

### Changed
- Increased max prompt length to 200 lines (was 150)

---

## [0.7.0-ms.1] — 2026-02-20

### Added
- Initial Mentor Studio fork
- Emit-based workflow (no MCP)
- Static gate, manual reconcile budget
- HTML + CSS in prompts instead of screenshots
- PoC handover checklist
- Playwright auth setup and demo.spec.ts

### Changed
- RUNBOOK structure, SKILL.md sections 1-7
- Failure playbook (observable symptoms instead of protocol)
```

---

## Tracking issues and decisions

**Use git commits, not wiki pages, as source of truth.**

If a feature or fix warrants explanation:

1. Add a subsection to DELTA.md under "What still needs validation"
2. or create an issue on this fork (if using GitHub issues)
3. Reference it in the commit message:
   ```
   feat: implement reconcile budget

   Two rounds per wave for non-demo screens, unlimited for demo.
   See DELTA.md § 5 for rationale.
   ```

---

## When this fork becomes a template

If this fork becomes a starting point for other Mentor Studio projects:

1. Rename the branch strategy (no longer `mentor-studio`, maybe `template-ms.1`)
2. Document it in this file
3. Each downstream project gets its own fork, own versioning, own CHANGELOG

---

## Summary: the golden rules

1. **Version in semver+fork format**: `0.7.0-ms.2` not `2.1` or `v0.7.0-mentor-studio`
2. **Tag every release**: `git tag v0.7.0-ms.2` so teams can pin versions
3. **Keep CHANGELOG.md at the top of the file** — it is the user-facing change summary
4. **Keep DELTA.md updated** when upstream changes
5. **Commits are the source of truth**, not wiki pages or external docs
6. **Rebase on upstream carefully** and document the merge decision
