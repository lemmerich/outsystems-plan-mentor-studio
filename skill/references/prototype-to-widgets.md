---
name: outsystems-prototype-to-widgets
description: >
  HTML/CSS-to-OutSystems-UI conversion guide. Read this BEFORE writing a wave
  spec's Screen layout section or a Mentor prompt, whenever a prototype has
  a layout detail that is not just "field grouping" (custom title/subtitle
  arrangement, a bounded-width card, sidebar decoration, a list→detail
  pattern). Companion to `outsystems-design-to-app`'s deeper reference
  library (`references/outsystems-ui/*`, `references/gotchas/*`) — this file
  is the short version scoped to what breaks most often when translating an
  HTML prototype built in this skill's workflow, not a full OS UI catalog.
---

# Prototype → OutSystems widgets: conversion guide

Every entry below was a real bug hit while building a project through this
skill's prototype-first workflow — a screenshot was attached to the Mentor
prompt, the result looked *close*, and a specific mechanical gap explained
the miss. The pattern across all of them: **a screenshot transfers color,
type, and rough grouping faithfully; it does not transfer the CSS/DOM
mechanics that produced that pixel result.** Say the mechanics in words.

## 1. Layout placeholders are not a div tree — they're separate regions

An HTML prototype puts a title and subtitle in one `<div>`, stacked by
normal block flow. A `LayoutSideMenu` (the OutSystems UI block almost every
authenticated screen uses) has a **`Title` placeholder and a `Header`
placeholder that are different regions of the top bar**, sitting side by
side by construction — see [`outsystems-design-to-app`'s
`layouts.md`](../../outsystems-design-to-app/references/outsystems-ui/layouts.md#layoutsidemenu).
If Mentor puts the subtitle content in `Header` instead of composing it
*inside* the `Title` placeholder's own content, they will render in
adjacent regions, not stacked — this produces exactly the "title and
subtitle end up on the same line, subtitle slightly offset" bug.

**What to say in the prompt:** name which OutSystems UI placeholder each
piece of text goes in, not just "title" and "subtitle" as prototype
concepts. If both must stack inside the visual title area, say so
explicitly: *"both the title and the record-count text belong inside the
`Title` placeholder's content, stacked as block elements — do not put the
count in the `Header` placeholder, that's a separate top-bar region."*

## 2. Every non-Column container defaults to fill-parent

A prototype's `.form-card { max-width: 640px }` is a hard cap. OutSystems
UI `Container`/`Form` widgets default to filling their parent's width —
"don't stretch" never transfers from a screenshot, since a screenshot can't
distinguish "this box is 640px because it's capped" from "this box happens
to be 640px at the viewport I captured it at." State the number in the
prompt whenever a prototype container is narrower than its content area.

Related trap: **`Columns2`–`Columns6` and other Adaptive blocks silently
drop `Width`/`Style`/`Margin` set on the block instance itself**
(`IMobileBlockInstanceWidget` doesn't expose those properties — see
[`patterns/adaptive.md`](../../outsystems-design-to-app/references/outsystems-ui/patterns/adaptive.md)).
To constrain or style a multi-column layout, wrap it in a `Container` and
put the width/style there, never on the Column block itself.

## 3. `MarginLeft = Adaptive` is not "no margin"

OutSystems UI's default `Adaptive` margin value inserts an automatic left
margin on any non-fill-parent widget, specifically so paragraphs of running
text don't butt against a screen's edge. Two sibling widgets (a title
`Expression` and a subtitle `Expression` below it) can each independently
pick up this margin and end up misaligned relative to each other even
though neither looks wrong in isolation. If a prototype shows two elements
sharing an exact left edge, say so explicitly and expect to zero
`MarginLeft` on both — don't assume `Adaptive` means zero.

## 4. Flex children don't shrink below their content size by default

CSS flexbox's `min-width: auto` default (not `0`) means a flex child
refuses to shrink below its content's natural width — text wraps
prematurely even with visible free space in the row. This is **invisible in
a screenshot** unless the exact text length happens to trigger it at
capture time. Any time a wave has dynamic text (a counter, a name, a status
label) sitting inside a flex row next to a fixed-width sibling (like an
action button), call out explicitly: *"the text container must have
`min-width: 0` so it can shrink; it must not force the row wider than
available space."*

## 5. CSS token declared ≠ CSS token applied (declaring in the theme is step 1 of 2)

Adding a variable or class rule to the theme stylesheet does nothing to a
widget instance unless that instance's `Style`/`ExtendedClass` property
also references the class. This is the single most common two-step miss —
already a standing guardrail (see `SKILL.md` guardrail 2), repeating it
here because it's the same *family* of bug as the rest of this file: the
prompt described an outcome, not the two concrete steps needed to reach it.

## 6. Prefer canonical OutSystems UI variables over invented ones

OutSystems UI (Reactive Web) widgets read a fixed set of CSS variables —
`--color-background-body`, `--color-primary`, `--color-neutral-0`…`-10`,
`--header-color`, `--side-menu-size`, etc. — see [`styles-and-utilities.md`
§ CSS custom properties](../../outsystems-design-to-app/references/outsystems-ui/styles-and-utilities.md#css-custom-properties-root--overridable-in-the-theme).
Overriding these at `:root` re-themes the entire app for free, including
widgets you never touched. Inventing new variable names (or a custom class
per prototype element, like this project's `.cell-id`/`.page-title`) works
but means every new element needs its own explicit class + explicit
application (see #5) — the canonical variables don't have that problem.
When a prototype's design token maps cleanly onto a canonical OS UI
variable, say so in the prompt and let Mentor override the variable instead
of inventing a class.

## 7. Five reserved class names collide with the platform theme silently

Never let a prototype's CSS class names reach the Mentor prompt verbatim if
they are (or contain) `main-content`, `sidebar`, `header`, `content`, or
`footer` — OutSystems UI's own LayoutBlank theme defines rules for these
names (a `.sidebar` rule pins to the *right* edge, for instance) and both
rules apply at once. Prefix app-specific classes instead (`.app-sidebar`,
not `.sidebar`) — see [`gotchas/theme-collisions.md`](../../outsystems-design-to-app/references/gotchas/theme-collisions.md)
for the full list and why each collides.

## 8. A prototype's "click a row, see a detail view" might already be a block

Before speccing custom navigation state (a `SelectedId` variable, a screen
redirect) for a list→detail pattern, check whether OutSystems UI's
`MasterDetail` block already gives you the exact behavior for free —
side-by-side list/detail on desktop, drill-down on phone, built-in phone
back button. See [`patterns/adaptive.md` § MasterDetail`](../../outsystems-design-to-app/references/outsystems-ui/patterns/adaptive.md#masterdetail).
Hand-rolling this from a `Container` + client-side variable duplicates a
block that already exists and already handles the responsive case.

## 9. A fixed "link doesn't work" bug can mean the link is empty, not just badly targeted

Entry #8's row-click problem (padding outside the link) has a more basic
sibling bug: sometimes the interactive element has **no content inside it
at all**. Asking Mentor to "wrap a nav item's icon and label in a link" can
produce a real `<a href="...">` sitting *next to* the icon+label instead of
*around* them — the anchor's `textContent` is empty, so nothing the user
can see or click is actually inside it. This renders as a normal-looking
nav item and even resolves in accessibility-tree tooling as "a link with
this href," which makes it easy to sign off as fixed from a screenshot or
a cursory find-by-role check. The only way to catch it is to read the
actual DOM: `element.textContent.trim()` on the anchor, not just its
presence. When a prompt asks for "X wrapped in a link," say explicitly that
X must be **inside** the anchor tag as its child content, not merely
adjacent to it, and verify by checking the anchor's own text/content after
publish — not by clicking near it and seeing something react.

## 10. Moving children into a new wrapper drops them out of the old flex context

`display: flex` on a container only arranges its own **direct** children —
it does not cascade to grandchildren. So the moment you fix #9 by moving an
icon and a label from being direct children of `.nav-item` into being
children of a new `<a>` wrapped around them, the old `.nav-item { display:
flex; gap: ... }` rule stops applying to them (they're no longer direct
children of `.nav-item` — the `<a>` is), and they silently stack as
ordinary block content instead of sitting side by side. This is exactly
the kind of regression that a fix for one bug (#9) introduces while fixing
it: the new wrapper element needs its **own** `display: flex; align-items:
center; gap: ...` rule, mirroring whatever layout rule the old direct-child
relationship relied on. Whenever a prompt asks Mentor to re-parent
elements — wrap existing content in a new link, button, or container — ask
explicitly whether the old parent's flex/grid rules need to be **restated
on the new immediate parent**, and check every element that changed
nesting, not just the one the bug report named (a shared theme class like
`.nav-item > a` typically means the fix applies to every screen that uses
it, not just the one screen where the regression was noticed first).

## When this file isn't enough

This is a short list of *recurring* mechanical gaps from one project's
build history, not a full OS UI catalog. For anything not covered here —
picking the right screen-type pattern (dashboard, wizard, kanban…),
full widget/property reference, icon handling, chart/map widgets — go to
`outsystems-design-to-app`'s reference library directly:
`~/.claude/skills/outsystems-design-to-app/references/`. Its
`references/gotchas/INDEX.md` is the fastest way to check "has this exact
failure mode already been documented."
