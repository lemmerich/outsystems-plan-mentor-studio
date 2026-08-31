<!-- prompts/w<N>.md — paste this whole file into Mentor Studio.
     Generated from spec-w<N>.md. If it needs editing, edit it HERE and then
     paste, so what ran and what is on disk stay the same thing. -->

CONTEXT
Application: [app name]
Modules: [names] — this wave changes [module] only
Authentication: [public — Everyone, no login] | [requires login — roles: X, Y]
Theme: [theme name]. All colors are theme variables: [--var-1], [--var-2], [--var-3]
Entities that exist: [Entity (attr, attr)], [Entity (attr)]
Screens that exist: [Screen — what it shows]
Server actions that exist: [ActionName(In) -> Out]

DO NOT TOUCH
[Artifact name]
[Artifact name]
[Artifact name]
Authentication and roles

OBJECTIVE
[One sentence. What a user can do when this is finished.]

CHANGES
1. [Atomic, verifiable change]
2. [...]
3. [...]
[Max 8. If you need a 9th, this is two waves.]

PROTOTYPE MARKUP
The block below is the approved prototype for this screen. It is the layout
contract, not code to paste — reproduce it with OutSystems UI blocks.

```html
[pruned markup + CSS for this one screen — see references/mentor-studio-prompt.md]
```

LAYOUT FACTS
- [Element] must not fill its parent: max-width [N]px.
- [Element A] and [Element B] stack as separate blocks / share one row.
- [Flex child] must shrink below its content width: min-width: 0 on [container].
- Fields on the same row: [field, field] / [field, field]. Never one per line.

GUARDRAILS (apply to every screen and action in this wave)

1. No hex literals. Every color must be a theme variable.

2. A declared CSS token is not an applied one. After declaring variables in the
   theme stylesheet, also set `background-color`, `color` and `border-color` on
   `.form-control`, `.dropdown-display`, `input`, `select`, `textarea` and the
   Upload widget control, with enough specificity to override browser defaults.
   Without this, inputs render white even when the variable is correct.

3. Forms use a multi-column grid — never one field per line. Use `Columns2`,
   `Columns3`, `ColumnsSmallLeft`, `ColumnsSmallRight`.

4. Action flows must read top-to-bottom without zooming. Do not place two nodes
   at the same vertical coordinate. Overlapping nodes are a defect.

5. Use verified OutSystems UI block names only — no bare HTML elements.

6. ODC terminology only: no "Service Studio", no "eSpace".

7. Add every `data-test` attribute from the markup above, spelled exactly.

8. The PROTOTYPE MARKUP block is the primary layout reference. Match it,
   including whether elements stack as blocks or share one row. Do not invent
   structure the markup does not have.

9. Honour LAYOUT FACTS literally. Every OutSystems UI container fills its parent
   by default, so any width cap is opt-in.

10. Scope is absolute. Do not create, rename or delete anything under DO NOT
    TOUCH, and do not build ahead into the next wave. If something here is
    impossible or contradicts what is already in the module, stop and say so
    instead of improvising — a human is reading your answer and can re-plan.

11. Any screen this wave creates gets the access level from Authentication
    above (`Everyone` or the stated role) explicitly — a new screen is
    login-required by default, so a public-app project must say so every
    time or the default silently wins.

EXPECTED
- [Observable outcome, phrased so it can be clicked and checked]
- [...]
- The module compiles and everything listed under DO NOT TOUCH still works.
