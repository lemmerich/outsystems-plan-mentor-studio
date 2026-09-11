<!-- prompts/wN-fixM.md (or prompts/extra-P-fixM.md) — paste this whole file
     into Mentor Studio. If it needs editing, edit it HERE and then paste, so
     what ran and what is on disk stay the same thing.

     This file itself is NOT the ```prompt``` fence — everything below
     "Target module" down to the closing operator note is what goes on disk.
     Only the fenced block is what gets pasted into Mentor Studio's chat. -->

## Target module: <ArtifactName>

> **Operator note (do not copy):** <why this fix, which prior round it follows — optional, for the human only>

**Paste the entire block below into the Mentor Studio session for `<ArtifactName>`:**

```prompt
CONTEXT
[Current, observed state only — restate whatever Mentor needs to act, as if
this is the only message it has ever seen. Never name a prior prompt file
("after wN-fix2 was applied"), a spec file ("see spec-wN.md"), or a fact
whose only source is a session Mentor Studio itself has no memory of.]

CURRENT BEHAVIOR
[What happens now, observed on the live app — exact steps to reproduce,
exact error text or wrong value, which screen/action.]

EXPECTED BEHAVIOR
[What should happen instead. One or two sentences.]

FIX
[The specific, scoped change to make. Reference artifacts by their current
real names only — never by which wave or fix created them.]

DO NOT TOUCH
[Artifact name]
[Artifact name]
Authentication and roles
```

**EXPECTED**
- [Observable outcome, phrased so it can be clicked and checked]
- Everything under DO NOT TOUCH still works.

---

Rules for this file (do not copy into the paste):

1. **Single fence, no nesting.** The prompt body above is one ` ```prompt `
   block. If the fix itself needs to show code, CSS, or a query, describe it
   in prose or use inline single backticks — never a nested triple-backtick
   fence — or it closes the outer fence early and Mentor receives a truncated
   prompt.
2. **Self-contained.** No "as fixed in wN-fix4", no "(see spec-wN.md)", no
   assuming Mentor remembers an earlier round. State the current facts
   directly every time — see SKILL.md's Reconcile step for the full rule.
3. **Naming.** This file is `prompts/wN-fixM.md` for a fix tied to wave `N`
   (M increments across every fix sent for that wave, `fix` is the only
   suffix), or `prompts/extra-P-fixM.md` for a fix on an ad-hoc thread not
   tied to any wave. Never a bare descriptive filename with no number.
