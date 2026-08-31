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

## 11. Dropdown's empty-selection placeholder has no Prompt property — and fixing it is a two-part change

A prototype's `<select>` with a first option reading "Todos"/"All" looks
like a one-line ask: "the empty state should say Todos, not a raw id." But
the OutSystems UI **Dropdown widget has no `Prompt` property** — unlike text
Input widgets, which do. Its only control over the "nothing selected" state
is `EmptyValue` (typically `NullIdentifier()`), and the widget renders that
state's own native empty `<option>` using the identifier's raw value as
text — for an Integer-backed static-entity identifier, that shows up as a
literal `"0"` in the UI. This isn't fixable through the Model API by writing
C# against `IDropdown` — there is no `SetEmptyText`/`Prompt`-equivalent
method to call, and having Mentor search for one by trial and error burns
many minutes finding nothing (confirmed independently by two separate
Mentor sessions on the same tenant).

The actual fix has **two parts, both required**:
1. Insert a synthetic record (`Id = NullIdentifier(), Label = "Todos"`) at
   the start of the aggregate's `List`, via a screen action wired to the
   aggregate's `OnAfterFetch`.
2. **Remove the `EmptyValue` property from the Dropdown widget itself.**
   Skipping this leaves the widget's own native empty option rendering
   *alongside* the synthetic record — producing a visible duplicate ("0"
   still shows as the first option, with "Todos" as a second, separately
   selected option) even though the synthetic record and its default
   selection are both correct in isolation. Only after `EmptyValue` is gone
   does the synthetic record become an ordinary list item with no
   competing native placeholder.

Setting the screen variable's initial value to `NullIdentifier()` alone
does **not** fix the duplicate — it only affects which option starts
selected, not whether the extra native option still renders.

**What to say in the prompt:** don't ask for "a Prompt/placeholder text of
X on the dropdown" — Dropdown widgets don't have one. Ask for the two-part
fix directly: insert a synthetic first record via `OnAfterFetch`, *and*
remove `EmptyValue` from the widget so it stops rendering its own empty
option.

## 12. A native widget's internal wrapper can absorb a flex rule aimed at its parent

`RadioButtonGroup` (and similar composite widgets) renders its options
inside its own unstyled internal wrapper `<div>` — a real DOM node between
the class you can target and the option elements themselves. A CSS rule
like `.my-radio-group { display: flex; flex-direction: row }` applies
correctly to `.my-radio-group`, but if that element has exactly **one**
direct child (the widget's internal wrapper), the flex rule has nothing to
distribute — the wrapper's own default `display: block` is what actually
governs the options, and they stack vertically regardless of the parent's
flex-direction. This looks identical to lesson #10's re-parenting bug from
the outside (options stacked instead of inline) but the cause is opposite:
here nothing moved, a widget's own internal structure was one level deeper
than the prompt assumed. Diagnose it by walking `element.children` from the
targeted class down to the actual option nodes and counting direct-child
levels before concluding a flex rule "isn't working" — don't just re-apply
the same rule harder. The fix is a child-combinator selector one level
deeper (`.my-radio-group > div { display: flex; ... }`) or restyling
whichever element actually parents the options directly.

## 13. A widget's own label association can be correct without visually wrapping the input

Confirming a `<label>` is "properly associated" by checking
`input.closest('label')` only catches the wrapping-label pattern — it
returns null for the equally valid `<label for="inputId">` sibling
pattern, which is what many OutSystems UI native widgets (like
`RadioButton`) actually emit. Seeing `closest('label')` return null is not
proof the association is broken; check `for`/`id` matching too before
concluding a fix is needed. The inverse mistake is worse: adding an extra
`ILabel` widget to "fix" this makes it render as a `<label>` that is a
*sibling* of the input (not a `for`-linked one and not a wrapping one),
which actually breaks the accessible name the native widget already had
correct — confirmed in practice by reverting to the widget's own plain
text content, which re-enabled the native `for`/`id` link. When a
composite widget already renders semantically correct HTML, don't add a
parallel label widget on top of it — verify what's already there first.

## 14. `appearance: none` on a native input needs an explicit numeric size, not `auto`

A theme-wide reset rule like `input, textarea, select, button { appearance: none }` strips a native `<input type="radio">`'s built-in visual **and** its intrinsic ~13px size at the same time — the two are bundled in the browser's own rendering, not separate concerns. Once that happens, adding `width: auto` (or leaving width/height unset) does **not** restore the native size — `auto` on a replaced element with no content resolves to `0`, so the radio becomes invisible and unclickable (confirmed: `getComputedStyle` reporting `width: 0px; height: 0px` while the element was still present in the DOM and `checked` still worked programmatically — no console error, nothing visibly broken except the input itself). Restoring a checkbox/radio's native look after a theme-wide `appearance: none` requires **both** `appearance: auto` (or `revert`) **and** an explicit pixel size (e.g. `width: 16px; height: 16px`) on the same rule — never just one or the other. When a fix touches a form control's `appearance`, always re-check computed `width`/`height` afterward, not just that a click still toggles `checked` — a zero-size input still responds to a programmatic `.click()`, so functional testing alone won't catch this class of bug.

## 15. A single screen variable for "the selected value" in a rendered list is a correctness bug, not just a style choice

When a screen renders N repeated cards from a list (an audit checklist, a
set of survey questions, any "one control per row" pattern) and each row
needs its own independent selection state, that state must live **per
row** — as a calculated attribute on the list's own aggregate/records, so
each row's `List.Current.<Attribute>` is naturally isolated — never as a
single screen-level variable that every row's widget reads from and
writes to. A single shared variable is not merely wasteful, it silently
makes every row mirror whichever row was interacted with last: selecting
"Partial" on item 1 sets the screen variable to "Partial", and every
other row's radio group — which all read that same variable to decide
what's checked — renders as if it too had "Partial" selected, even though
nothing was clicked there. This produced 9 falsely-checked rows out of 10
in practice, confirmed by clicking one radio and reading `checked` state
across every input in the DOM afterward.

This bug is invisible to a static look at either the prototype or a single
rendered screenshot — both show one row selected, which looks correct.
It only surfaces by interacting with **two different rows** and checking
that the first row's selection survives the second row's click. Any list
of controls prompt should say explicitly: *"each row's selection is
independent — bind the control to a per-row list attribute, not a
screen-level variable shared across rows,"* and the fidelity check for any
multi-row selectable-control screen must include this exact test: select
in row A, then select in row B, then verify row A's selection is
unchanged (not just that row B updated) — checking only the most recently
clicked row can pass while every other row is silently wrong underneath.

## 16. Re-read the wave's own spec file before writing the Mentor prompt — don't recall it from memory

A wave spec can explicitly put something in scope (e.g. "the stepper is
static debt from an earlier wave — in **this** wave, make it reflect the
real status") and that line can still get dropped from the Mentor prompt
simply because the prompt was composed from memory/summary of the spec
rather than a fresh re-read of the actual spec file immediately before
writing it. This is not a Mentor-fidelity gap at all — Mentor did exactly
what it was asked; the asking was incomplete. It surfaces exactly like a
missed requirement during comparison-against-prototype (a static element
where the spec called for a dynamic one), but the fix belongs in the
authoring process, not in a Mentor prompt correction: **immediately before
composing the Mentor prompt for a wave, re-open that wave's own
`spec-wN.md` and check every "Scope" bullet against the draft prompt
one-for-one** — don't rely on having read it earlier in the conversation.

## 17. A foreign key created early but only populated by a much-later wave should default to optional

When a wave near the start of a build (e.g. the wave that fixes the whole
data model) creates a `Mandatory` foreign key that points at an entity no
row of which will exist until a wave much later in the plan (e.g. an
`Auditoria.ProtocoloVersaoId` pointing at `ProtocoloVersao`, populated only
once a "Base de Conhecimento" wave many waves later runs), every attempt to
create the *first* entity from any wave in between fails with a foreign-key
violation — `NullIdentifier()` does not satisfy a `Mandatory` attribute, it
is not the same as SQL `NULL` from the constraint's point of view. This
blocks core functionality (in practice, it blocked creating *any*
`Auditoria` record at all) for the entire span between the two waves, and
the fix requires flipping `Mandatory` to `False` after the fact — a data
model change outside the wave that's supposed to be touching it, needing
explicit sign-off as an exception to "no data model changes" gates. When
planning the initial full data model (typically the first wave), any FK
that a later, not-yet-built wave is responsible for populating should be
modeled `Mandatory: False` from the start — the mandatory constraint can
be added back, if actually wanted, in the wave that starts writing to it,
once rows exist to reference.

## 18. `OnChange` on an input-type widget inside a list does not fix `.Current` the way `OnClick` on a Button/Link does

Following lesson #15's fix (per-row selection state via a calculated list attribute) is necessary but not sufficient once that state needs to be *persisted* by a server action triggered from the row's own `OnChange`. A `Button` or `Link` widget's click handler inside a list iteration reliably has `.List.Current` pointing at the row that was clicked — but a `RadioGroup` (and likely other input-type widgets: checkboxes, dropdowns) does not carry the same guarantee for its `OnChange` handler. If the screen action invoked by `OnChange` reads `SomeAggregate.List.Current.SomeField` internally, it resolves to whichever row `.Current` happens to be at that moment — in practice this meant only the *first* row's selection ever persisted correctly; every other row's click fired the save action, but with the wrong (or no) row's identifier, silently saving nothing or overwriting the first row. This was confirmed by testing three different rows with real clicks and a page reload between each: row 1 persisted, rows 2 and 3 did not, and no server error appeared — the calls either didn't fire or fired with bad parameters, not a visible failure. The fix: never read `.List.Current` *inside* the action's own logic for this pattern — instead, pass the row's identifier and value as **explicit parameters**, evaluated directly in the `OnChange` handler's own parameter expressions (e.g. `GetItems.List.Current.Id`, `GetItems.List.Current.SelectedValue`), which is the one place `.Current` is still guaranteed correct. Any wave wiring a list-row input widget to a server-persisting action should state this explicitly in the prompt, and the fidelity check must click at least two non-adjacent rows and reload before considering the wave done — clicking only the first row of a list will pass even when every other row is broken.

## 19. A server action called from inside a client-side `ForEach` is silently ignored

Asking Mentor to "save every row of a list at once" (a footer "Save draft" button that persists N items in one click) is a natural, common request — and the naive implementation Mentor may reach for is a client-side `ForEach` over the list, calling a server action once per row inside the loop. **OutSystems does not support calling a server action from inside a client-side `ForEach`** — the call is silently dropped, with no error, no exception, no log entry anywhere (confirmed: zero results searching server traces for the action name, zero entries in server error logs — the action is never invoked at all, not invoked-and-failing). The button appears to do nothing: no success toast, no data change, no visible sign anything is wrong. The correct pattern is the reverse: build the full list of values to persist **client-side** (e.g. via `ListAppend` accumulating each row's local values into a Local Variable of Record List), then call **one** server action, once, passing that whole list — and have the server action do its own iteration (its own `ForEach`, server-side) over the received list. Any prompt asking for a "save all rows at once" action should state this pattern explicitly: build the list on the client, iterate on the server, one round-trip — never describe it as "call the save action for each row" without specifying which side the loop runs on.

## 20. `overflow` on any ancestor breaks `position: sticky` on a descendant

A "sticky footer button, always visible while scrolling a long list" is a common prototype pattern (`position: sticky; bottom: 0`), and it silently fails to stick if **any** ancestor between the sticky element and the page's own scrolling container has `overflow` set to anything other than `visible` (`auto`, `hidden`, `scroll` all break it) — the sticky element then behaves as ordinary static/relative-flow content, rendering at its natural document position instead of pinning to the viewport edge. This is invisible from a screenshot of the intended final state and easy to miss in casual testing, since Playwright's `.click()` auto-scrolls to the element regardless of whether it's actually stuck — only checking the element's `getBoundingClientRect()` *while scrolled away from it* reveals the failure (a sticky element correctly stuck stays near the viewport edge; a broken one reports a Y position far down the page, matching its position in the document flow). When a wave's prompt asks for sticky positioning, name the containment requirement explicitly: *"the sticky element's containing chain up to the page's scroll container must have no `overflow` other than `visible`"* — and verify by checking the rendered `top`/`bottom` coordinate after scrolling past the element's natural position, not just that clicking it still works.

## 21. `@import url(...)` inside an OutSystems theme's CSS does not reliably load an external font

Asking Mentor to load a Google Font by adding `@import url("https://fonts.googleapis.com/...")` at the top of the theme's own stylesheet compiles cleanly, produces no error or warning, and correctly sets `font-family: "Inter", ...` in the computed style — but the font file itself may never actually be requested by the browser. Confirmed directly: `getComputedStyle(el).fontFamily` reported `"Inter"` first in the stack, while `document.fonts` (the browser's actual loaded-FontFace registry) contained no "Inter" entry at all, and no `<link>` to `fonts.googleapis.com` existed anywhere in the rendered page — the `@import` was silently dropped somewhere in OutSystems' CSS bundling pipeline, which does not appear to process external `@import` the way a browser loading a plain stylesheet would. The visual result is indistinguishable from "the font never changed," because the browser's silent fallback to the next name in the stack (`system-ui`, here) looks like nothing happened — no console error, no broken-font glyph, nothing. **`getComputedStyle` proves the CSS rule was written; it does not prove the font file was loaded.** The reliable fix is a real `<link rel="stylesheet" href="...">` tag elevated into the document's actual `<head>` — in OutSystems this is done via an `AdvancedHtml` widget with `Tag="link"` placed in the screen (OutSystems hoists `<link>`/`<meta>`/`<script>` tags from screen content into the real page `<head>`), added once per screen (or in a shared header/layout block) — not a CSS-level `@import`. After any external-font fix, verify with `[...document.fonts].some(f => f.family === "TargetFontName" && f.status === "loaded")`, not just a `getComputedStyle` name check.

## 22. Mentor edits OML blind — a leftover rule from an earlier wave's workaround can silently outrank a new, logically-correct CSS fix

Mentor has no screenshot loop and no way to see the rendered page — it edits OML/CSS by reasoning about the change in isolation, so it has no way to know that an *earlier* wave already left a broad workaround rule (often carrying `!important`, often a generic ancestor combinator like `.overlay > *`) alive in the same stylesheet, still matching the element a *later* wave is trying to restyle. Each new fix prompt is individually correct — Mentor reports 0 validation errors and a coherent, plausible-sounding summary of what it changed — but if a stronger/older rule already targets the same element, the new rule silently loses and a live DOM measurement (`getComputedStyle`) comes back unchanged. This happened twice on the *same* modal (the "Novo protocolo" card, first built as a fixed-position modal during the W12 fix saga — see `w12-modal-fix.md`): once where a `grid-column` fix was a no-op because the container was actually `flex` not `grid`, and once where a `width: 100%` fix was silently beaten by a leftover `.form-modal-overlay > * { width: auto !important }` rule from that same earlier W12 saga that nobody had removed once the "real" targeted fix (semantic classes) landed weeks later. Three Mentor turns and three publishes were spent on one layout bug that a five-minute rule dump against the live element (`document.styleSheets`, filtering for selectors that `.matches()` the target) would have caught on the first turn — because that dump immediately shows every competing rule's selector, specificity, and whether it carries `!important`, which is the one thing neither a screenshot nor "0 Mentor errors" can reveal. The general fix is procedural, not a CSS technique: before writing *any* CSS fix prompt for an element any prior wave already touched, dump every currently-matching rule against the live (not prototype) element first, and if a fix's measured result doesn't change, that is the signature of a stronger rule elsewhere winning — not evidence the new rule needs to be "stronger." See the `recipes.md` companion recipe ("fixing CSS on any element that has been patched before") for the runnable console snippet and the Mentor prompt template that feeds the dump's findings back in. A related, cheaper habit prevents the debt from accumulating in the first place: when a follow-up turn in the same wave lands the "real" fix over a known stopgap, the prompt for that turn should explicitly ask Mentor to remove the old stopgap in the same edit, not just add the new rule on top of it.

## 23. `List mapTo { }` with zero explicit mappings zeroes EVERY field, not just the ones the mapping "forgot"

Converting an aggregate's record list (which may carry join columns) into a pure entity record list for a server action's input parameter is commonly done with `List mapTo { }` — and it is easy to leave that mapping block completely empty when the intent was "just pass the records through unchanged," especially when a prior version of the flow used the aggregate's list directly and a later refactor introduced the `mapTo` only to satisfy a type mismatch. An empty `mapTo { }` is not a no-op passthrough: it produces new records where **every single field is set to its type's default** (empty text, zero, false) — not just the fields a hurried mapping omitted. This was discovered after a "create new ficha version" flow (`PublishFichaVersao`, wired from `DetalheFicha`'s save action) silently wrote every `ItemFicha` in every new version with `TipoResposta = ""`, `Eixo = ""`, `Orientacao = ""`, etc., even though `Titulo` and `Codigo` were visibly correct elsewhere in the same UI (they came from a different display path, not this mapped list) — masking the defect for weeks, because the fields that were visibly correct gave false confidence that the mapping worked. The downstream damage was severe and delayed: an unrelated screen's `RadioButtonGroup`, gated by a `Visible` expression comparing `TipoResposta = "Escala"`, rendered zero options for every item in every audit created after the flawed version was published — with 0 validation errors at every step, because nothing about an empty-string field is invalid. When a `mapTo` is used to pass an aggregate's list into an action expecting the plain entity type, list every field the target entity actually has, explicitly, even ones "the actual code path doesn't seem to touch" — an incomplete mapping is not caught by the compiler, by 0 validation errors, or by any screen that happens to display a different subset of fields than the ones actually broken.

**Verify after publish:** for any entity created via a non-trivial `mapTo`, read back a freshly created record's fields that the mapping was supposed to carry over (not just the ones the current screen displays) and compare against the source — an aggregate/DB read showing unexpected defaults (empty string, `0`, `false`) on a field that had a real value in the source is the signature of an incomplete `mapTo`, and it will not surface as an error anywhere near the mapping itself.

## 24. Two `AtStart` aggregates where one's filter reads the other's `.Current` have NO guaranteed execution order — and a working order can silently break when either aggregate's OML node is recreated

An aggregate `B` whose filter references `A.List.Current.<field>` (e.g., a detail screen's items aggregate filtering by the parent record's active-version id) appears to work reliably through many published revisions — `A` happens to execute before `B` because of how the two nodes were originally created and laid out in the flow, not because the platform guarantees it. This ordering is NOT a property the platform tracks or protects: it is incidental. The moment either aggregate's node is deleted and recreated — e.g. as a side effect of an unrelated fix elsewhere on the same screen, such as rewriting a `mapTo` block feeding a completely different action — the platform can lose track of the implicit dependency, and `B` may now fire before `A` has returned data. `B`'s filter then evaluates against `A`'s default/empty `.Current` (e.g. an identifier of `0`), returning zero rows — with 0 validation errors, because a filter against a default value is syntactically and semantically valid, just wrong at runtime. This was discovered as a regression introduced by an unrelated same-screen fix: a screen that had correctly shown 8 items through many prior revisions suddenly showed "0 itens" immediately after a `mapTo` rewrite on a different aggregate's downstream action, with the network call for the items aggregate still returning `200 OK` (not erroring — just silently empty). The fix is to never rely on implicit `AtStart`/`AtStart` ordering when one's filter depends on the other's `.Current`: set the dependent aggregate to `Fetch: OnDemand` and trigger its refresh explicitly from the source aggregate's own `OnAfterFetch` handler, so the sequence is enforced by wiring, not by incidental node order.

**Verify after any edit that touches an aggregate whose filter reads another aggregate's `.Current`** (even when the edit itself targets a different, seemingly unrelated node on the same screen): reload the screen fresh and confirm the dependent aggregate still returns its expected row count — a `200 OK` network response is not proof of correct data, and this class of regression produces no validation error anywhere.

## 25. A `RadioButtonGroup`'s `OnChange` cannot reliably read the just-clicked value for any row but the first, inside a list

A `RadioButtonGroup` (or individual `RadioButton`s sharing a group) bound via a two-way `Variable` to a per-row field (e.g. `List.Current.Resposta.RespostaFinal`) appears to work when tested on the first row of a list — click an option, it shows selected, save it, reload, it's still selected. Test the same interaction on the *second* row (or any row that starts with no prior saved value) and it silently fails: the `OnChange` fires, a save action is called with a real, correct, per-row identifier (confirmed via a live debug probe — `RespostaId` was never `0`, never shared across rows), yet the value passed to that save action is the *old* value of the two-way-bound field, not the option just clicked. For a row that already had a saved value, "old" happens to equal "new" whenever the user clicks the option that was already selected, which is exactly what re-testing the first row does — creating the illusion that the pattern works. This is not a `.Current` resolution bug in the SaveResposta-style action itself (verified: the action's own logic — `GetById` on the received identifier, assign, `Update` — was structurally correct and did commit successfully when called with the right value via a direct, independent debug check bypassing the screen entirely); it is that the widget's own `OnChange` event evaluates its parameter expressions before the two-way binding's write to the list row has completed, for any row beyond the first. There is no `NewValue`-style parameter on `RadioButtonGroup`'s `OnChange` to read the just-selected option directly, so there is no reliable expression to fall back to inside that event.

**Two fix directions exist — the correct one is a product decision, not a technical default:**

- **Do not** silently replace `RadioButton` with a plain `Button` styled to look like one, even though giving each option's `Button` an `OnClick` with the option's value as a **literal, hardcoded** parameter (not read from any variable) reliably works — measured directly, it does. This throws away native radio semantics: assistive-technology role, keyboard/arrow-key navigation, and platform-consistent behavior a real `<input type="radio">` gets for free. Ship this only if a user/stakeholder has explicitly signed off on the accessibility trade-off after seeing it — never as a first response to "the sequential-save pattern is broken," because it resolves the symptom while quietly downgrading usability in a way a validation pass and a DOM measurement both miss.
- **Do** keep the real `RadioButton`/`RadioButtonGroup` widget, drop the assumption that *every click must save immediately*, and move persistence to an explicit, already-existing batch action (a "Save draft" / "Finish" button that gathers every row's current local value into a list and calls one bulk save — the same one-round-trip-not-one-per-row pattern from the "save all rows at once" lesson elsewhere in this file). The radio's own `OnChange` then only needs to update local/two-way state for the visual "selected" indication (a pure read/display concern, which was never the broken half) — no server round-trip, no reliance on ever reading back the just-written value inside that same event.

A third option — a hidden native `<input>` element wired via `AdvancedHtml`/custom JavaScript listening for the browser's real `change` event and calling the save action with the DOM's own reported value — also works (browser-level events don't have this staleness problem) and preserves both native semantics and per-click saving, at the cost of maintaining hand-written JS outside the platform's normal widget model going forward. Offer it as an option when per-click saving is a hard product requirement; it is not the default because of that ongoing maintenance cost.

**When speccing** any per-row selection control from the start (not just when fixing this after the fact): if the wave's own acceptance test would need "select an option, reload, confirm it's still selected" to hold for every row of a multi-row list — not just the first — write the spec's persistence model as batch-save-on-an-explicit-action from day one. Assuming "click = immediate save" is trivial with a native list-bound `RadioButtonGroup` is exactly the assumption that costed a long, multi-turn investigation here before the real constraint surfaced.

**Verify:** click and reload at least the *second* row of a list-bound `RadioButtonGroup`, not just the first — a first-row-only test passes even when every other row is broken, since a row's prior saved value can coincidentally match a naive re-test's click.

## 26. A dynamically-computed CSS `width`/`height` that never renders — check `display` before the value

A proportional bar/fill element (e.g. a distribution chart's bar-fill segment, width bound to `count / total * 100%`) can have a perfectly correct computed value written into its inline `style` attribute — confirmed directly via `getComputedStyle(el).width` returning `"75%"`, matching the real data — and still render with zero visible width, on every revision, through multiple unrelated fix attempts. The cause is not the value; it's that `width`/`height` are simply **ignored by the CSS spec on any element whose `display` computes to `inline`** (a plain `<span>`, or a Container/Block widget that OutSystems happens to render as an inline element rather than a `<div>`) — no error, no warning, nothing in `0 validation errors` hints at it, and a screenshot of a bar that "looks static" is easy to mis-diagnose as a data/binding problem (as happened here: the first fix attempt correctly found and fixed a real, separate bug — a locale-dependent decimal separator producing invalid CSS like `width: 50,0%` — and still the bar stayed empty, because the `display: inline` issue was layered underneath it). **When a dynamically-bound width or height doesn't render visually, check `getComputedStyle(el).display` before forming any hypothesis about the bound value itself** — if it reports `inline`, the fix is adding `display: block` (or `inline-block`) to that element's CSS rule, not touching the width/height expression at all, which may already be correct.

## 27. Ad-hoc debug buttons for one-off maintenance actions (reseed, backfill) should become a permanent "Dev tools" area, not an add-then-remove cycle

Earlier lessons in this project's history (and this file) describe a pattern for verifying a fix live: add a temporary button wired to a debug/maintenance server action, click it once, verify, then ask Mentor to remove both the button and the action. That pattern is correct for a true one-off (a single data backfill that will never run again) but breaks down for anything that recurs — e.g. a ficha/seed-data reseed needed after every heavy run of a destructive test wave (see lesson higher in this project's `logs/` about `W16`'s permanent, no-rollback item inactivation degrading shared seed data across repeated E2E suite runs). Recreating the same maintenance action and button from scratch each time a fresh Mentor turn is needed wastes a full Mentor cycle purely on plumbing that already existed and was thrown away. The better default once a maintenance utility is used more than once: build a permanent "Dev"/"Utilities" section in the app's own navigation (a dedicated screen, a sidebar section separate from the real product navigation, one card per utility with a name/description/action button) instead of add-and-remove. This costs one extra Mentor turn the first time, but every utility added afterward is incremental (one new card) rather than a full screen+action+menu-link cycle, and the tooling survives between sessions instead of needing rediscovery. Keep this area visually and structurally distinct from product navigation (e.g. a separate menu section clearly labeled, not interleaved with real feature links) so it reads as internal tooling, not a shipped feature.

## 28. A filter dropdown sourced from a full historical table needs an explicit "actually used" scope, or it silently grows unusable

A filter dropdown meant to help a user narrow down records (e.g. "filter by which Ficha version was used") is naturally specced by listing "all X" from the source entity — and that's fine until the entity accumulates history no user cares about: draft versions never used in a real record, abandoned experiments, or (as here) dozens of versions created incidentally by a heavy E2E test suite. The dropdown then silently degrades from a useful filter into a wall of options nobody can scan, with no error, no validation warning, and no single moment where it "broke" — it just grew. The fix isn't a UI tweak (pagination, search-within-dropdown); it's a scoping decision that belongs in the query itself: **only list values from the source table that are actually *referenced* by the data being filtered** (here: a `FichaVersao` only appears in the dropdown if at least one `Auditoria.FichaVersaoId` points at it — via an "Only With"/semi-join filter, never a plain list-all). When speccing any filter dropdown sourced from a table that can accumulate over time (versions, drafts, historical records), state the "used-only" scope explicitly in the wave's Actions section up front — "list all X" is the wrong default the moment X is a growing table rather than a small fixed set of options.

**A related trap, discovered fixing this in practice:** scoping a dropdown to "only referenced values" by adding a join to the referencing table (e.g. `Inner Join` against `Auditoria`) produces one row **per matching reference**, not one row per distinct source value — a `FichaVersao` used by 11 different `Auditoria` records appeared 11 times in the dropdown. The join type matters: use OutSystems' "Only With" join (`JoinType.None` in the OML, semantically a semi-join/`EXISTS` check) rather than a regular Inner Join, or add an explicit `Distinct` — a semi-join filters rows without ever multiplying them, which a value-based existence check should always use over a row-multiplying join.

## 29. Mentor can silently revert an unrelated prior fix while applying the one you asked for — re-verify every change on every turn, not just the one you just requested

Asking Mentor to fix a narrow, unrelated issue (e.g. two "Unused Attribute" warnings on a list-insert element) can cause it to also undo a *different*, already-applied, already-verified fix from an earlier turn in the same session — with no explicit warning that it did so. The only trace was a contradiction buried in that turn's own prose summary (describing the aggregate as "a join aggregate with no GroupBy" when the immediately preceding turn had added a GroupBy specifically to fix a duplication bug) — easy to miss unless the summary is read adversarially. Live verification after that turn confirmed the regression: the GroupBy was gone, duplicates were back. This is a distinct failure mode from "0 validation errors doesn't prove the fix worked" (lesson network in this file) — here the fix genuinely *had* worked, verified live, and a *later, unrelated* turn silently threw it away as a side effect. **The fix is procedural: treat every Mentor turn as capable of touching more than what you asked it to touch, and re-verify the specific thing an earlier turn fixed after every subsequent turn on the same screen/aggregate/action — not just once, and not just the thing the current prompt targeted.** When asking Mentor to confirm a specific prior state is preserved, ask it to state explicitly, in its own words, whether that specific thing is still true (as opposed to just describing what it changed this turn) — this surfaces contradictions like the one above instead of letting them hide inside an otherwise-plausible summary.

## 30. A screen aggregate's `Distinct` property and the `Exists` function are both unavailable to Mentor's Model API — plan around them, don't request them

Two OutSystems aggregate capabilities that would naturally solve "filter to only rows that have at least one match in another table, without duplicating" are not usable when Mentor is editing via its Model API on a **screen** aggregate: the `Distinct` checkbox is not exposed on the aggregate interface the API exchanges with (Mentor reported this honestly rather than silently no-op'ing it), and the `Exists` function is rejected by the validator specifically inside screen aggregates (it does work inside **server action** aggregates — a real platform inconsistency, not a Mentor limitation). Both are worth knowing about *before* spending a turn asking for either, since Mentor will (correctly, safely) refuse and ask for direction rather than fake success — but that still costs a full poll cycle. When a screen dropdown/list needs "distinct rows after a join that could multiply them," the two paths that actually work through Mentor's tooling are: (a) `GroupBy` on the screen aggregate itself, grouping by every attribute the UI actually reads (calculated/derived attributes used only for display, like a concatenated label, must also be pulled inside the GroupBy context or dropped) — the one used successfully here; or (b) move the query into a **server action** where `Exists`/`Distinct` are both available, and have the screen consume that action's output instead of a local aggregate. Prefer (a) when the query is otherwise simple and screen-local; reach for (b) when the filter logic is complex enough that fighting the screen-aggregate's more restricted feature set costs more than writing a small server action.

## When this file isn't enough

This is a short list of *recurring* mechanical gaps from one project's
build history, not a full OS UI catalog. For anything not covered here —
picking the right screen-type pattern (dashboard, wizard, kanban…),
full widget/property reference, icon handling, chart/map widgets — go to
`outsystems-design-to-app`'s reference library directly:
`~/.claude/skills/outsystems-design-to-app/references/`. Its
`references/gotchas/INDEX.md` is the fastest way to check "has this exact
failure mode already been documented."
