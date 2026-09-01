# OutSystems UI — canonical design tokens and pattern inventory

Source: [OutSystems UI CheatSheet](https://outsystemsui.outsystems.com/OutSystemsUIWebsite/CheatSheet)
(fetched 2026-08-31). Read this before making ANY theme decision in W0, and
before naming a UI pattern in a wave spec's Screen layout section.

**Why this file exists:** OutSystems UI is not a blank canvas — it already ships
a complete token system (color, spacing, radius, shadow, typography) and ~90
named UI patterns. Theming a project by inventing parallel variable names
(`--accent`, `--danger`, `--neutral-soft`...) instead of overriding the
platform's real tokens (`--color-primary`, `--color-error`,
`--color-neutral-N`...) produces a theme that *looks* right in a static
prototype but does not propagate through OutSystems UI's own components,
because those components read the real tokens, not invented ones. **Always
theme by overriding the tokens below, never by inventing new ones**, unless
this file has no equivalent for what the project needs (rare — note it
explicitly when it happens, don't silently invent).

---

## 1. Color tokens

Every color is exposed three ways — a CSS custom property (for inline styles /
custom CSS), a `.background-<name>` class, and a `.text-<name>` class. Theming
a project means redeclaring the custom properties below with the brand's
values; the utility classes and every OutSystems UI widget that already
consumes them update automatically.

### Brand / semantic roles (theme these first)

| Role | Variable | Platform default |
|---|---|---|
| Primary | `--color-primary` | `#1068eb` |
| Primary (hover) | `--color-primary-hover` | `#295fd6` |
| Primary (selected bg tint) | `--color-primary-selected` | `rgba(20,110,245,.12)` |
| Primary (lightest bg) | `--color-primary-lightest` | `linear-gradient(rgba(255,255,255,.9), rgba(255,255,255,.9))` over primary |
| Secondary | `--color-secondary` | `#303d60` |
| Info | `--color-info` / `--color-info-light` | `#017aad` / `#e5f5fc` |
| Success | `--color-success` / `--color-success-light` | `#29823b` / `#eaf3eb` |
| Warning | `--color-warning` / `--color-warning-light` | `#e9a100` / `#fdf6e5` |
| Error | `--color-error` / `--color-error-light` | `#dc2020` / `#fceaea` |

**Naming note:** the platform's negative-state role is called **`error`**, not
`danger`. Use `--color-error` / `.background-error` / `.text-error` — a wave
spec or prompt that says "danger" is inventing a name the framework does not
have; Mentor will not know what to bind it to.

### Full hue ramp (10 shades each: darkest → lightest, plus the base)

Available if the brand needs an accent outside primary/secondary/semantic —
e.g. a category tag color, a chart series. Each hue has: `darkest`, `darker`,
`dark`, base (no suffix), `light`, `lighter`, `lightest`.

Hues available: `red`, `orange`, `yellow`, `lime`, `green`, `teal`, `cyan`,
`blue`, `indigo`, `violet`, `grape`, `pink`.

Pattern: `--color-<hue>-<shade>`, `.background-<hue>-<shade>`, `.text-<hue>-<shade>`.
Example: `--color-teal`, `--color-teal-darker`, `.background-teal-light`.

**Before reaching for a raw hex value anywhere in a prompt, check whether one
of these 12 hues × 7 shades already matches.** It very often does — ONNI's
brand teal, for instance, sits almost exactly on `teal`/`teal-dark`.

### Neutral ramp (grayscale — surfaces, borders, text)

11 steps, `--color-neutral-0` (white, `#ffffff`) through `--color-neutral-10`
(near-black). This ramp is what backs surfaces, borders and text roles that a
custom theme would otherwise invent as `--surface`/`--border`/`--text`:

| Step | Typical role in a themed app |
|---|---|
| `neutral-0` | white / card surface |
| `neutral-1`–`neutral-2` | page background, subtle fills, hover states |
| `neutral-3`–`neutral-4` | borders, dividers |
| `neutral-5`–`neutral-6` | disabled text, placeholder text |
| `neutral-7`–`neutral-8` | secondary/muted body text |
| `neutral-9`–`neutral-10` | primary body text, headings |

**Dark mode note:** this ramp is defined once, light-oriented, by the
platform. A project adding a dark theme redefines the neutral (and semantic)
custom properties under its own dark scope exactly as this skill already does
for invented variables (see `artifact-design` skill's theme-token pattern) —
the only change is redefining the platform's real names instead of
project-invented ones, so every native OutSystems UI widget follows the
theme switch too, not just the screens this project's prompts touched.

### Global app-shell tokens

These are not colors but are declared alongside them and shape the shell a
W0 wave builds:

```
--header-color: #ffffff;              /* header/topbar background */
--color-background-body: #f3f6f8;     /* page background, distinct from card surfaces */
--color-background-login: #ffffff;    /* login screen background, if the app has one */
--header-size: 56px;                  /* topbar height */
--header-size-content: 48px;
--side-menu-size: 300px;              /* sidebar width — override this, don't hardcode a new one */
--bottom-bar-size: 56px;              /* mobile bottom nav height */
--footer-height: 0px;
```

If a wave's prototype calls for a sidebar narrower than 300px (a common
choice for a dense internal tool), that is a legitimate override — state it
explicitly as "`--side-menu-size` overridden to `<N>`px" in the wave spec,
not as an invented sidebar-width magic number with no named hook.

Also available: `--os-safe-area-top/right/bottom/left` (mapped to
`env(safe-area-inset-*)`) for iOS notch support — relevant only for
mobile-targeted apps.

Focus ring tokens: `--color-focus-outer` (default `#FFD337`) and
`--color-focus-inner` (default `var(--color-neutral-10)`) — override these
together if the brand accent makes the default yellow focus ring clash.

---

## 2. Spacing scale

Uniform + directional (top/right/bottom/left, x/y) padding and margin
utilities, all backed by the same 8-step scale. **Use these tokens for every
gap/padding/margin decision in a wave spec — never invent a pixel value.**

| Step | Value | Class suffix | Variable |
|---|---|---|---|
| none | 0 | `-none` | `--space-none` |
| xs | 4px | `-xs` | `--space-xs` |
| s | 8px | `-s` | `--space-s` |
| base | 16px | `-base` | `--space-base` |
| m | 24px | `-m` | `--space-m` |
| l | 32px | `-l` | `--space-l` |
| xl | 40px | `-xl` | `--space-xl` |
| xxl | 48px | `-xxl` | `--space-xxl` |

Classes: `.padding-<step>`, `.margin-<step>`, plus directional
(`.padding-top-<step>`, `.margin-left-<step>`, ...) and axis
(`.padding-x-<step>`, `.margin-y-<step>`). Also `.gap-<step>`,
`.row-gap-<step>`, `.column-gap-<step>` for flex/grid layouts.

## 3. Border radius and border size

| Radius | Value | Class | Variable |
|---|---|---|---|
| None | 0 | `.border-radius-none` | `--border-radius-none` |
| Soft | 4px | `.border-radius-soft` | `--border-radius-soft` |
| Rounded | 100px | `.border-radius-rounded` | `--border-radius-rounded` |
| Circle | 100% | `.border-radius-circle` | `--border-radius-circle` |

Directional variants exist too (`.border-radius-top-right-soft`, etc.).

| Border size | Value | Class | Variable |
|---|---|---|---|
| None | 0 | `.border-size-none` | `--border-size-none` |
| S | 1px | `.border-size-s` | `--border-size-s` |
| M | 2px | `.border-size-m` | `--border-size-m` |
| L | 3px | `.border-size-l` | `--border-size-l` |

## 4. Shadows

| Level | Class | Variable |
|---|---|---|
| None | `.shadow-none` | `--shadow-none` |
| XS | `.shadow-xs` | `--shadow-xs` |
| S | `.shadow-s` | `--shadow-s` |
| M | `.shadow-m` | `--shadow-m` |
| L | `.shadow-l` | `--shadow-l` |
| XL | `.shadow-xl` | `--shadow-xl` |

A card/dropdown/modal's elevation is one of these six — never a hand-rolled
`box-shadow` value.

## 5. Typography scale

Font size is responsive out of the box (desktop / tablet / phone each have
their own px value at a fixed 1.25 or 1.5 line-height) — this is a real
advantage over a hand-rolled type scale, which typically is not responsive
per breakpoint:

| Role | Desktop | Tablet | Phone | Line height | Class | Variable |
|---|---|---|---|---|---|---|
| Display | 36px | 34px | 32px | 1.25 | `.font-size-display` | `--font-size-display` |
| Heading 1 | 32px | 30px | 28px | 1.25 | `.heading1` | `--font-size-h1` |
| Heading 2 | 28px | 26px | 24px | 1.25 | `.heading2` | `--font-size-h2` |
| Heading 3 | 26px | 24px | 22px | 1.25 | `.heading3` | `--font-size-h3` |
| Heading 4 | 22px | 21px | 20px | 1.25 | `.heading4` | `--font-size-h4` |
| Heading 5 | 20px | 19px | 18px | 1.25 | `.heading5` | `--font-size-h5` |
| Heading 6 | 18px | 17px | 16px | 1.25 | `.heading6` | `--font-size-h6` |
| Body | 16px (all breakpoints) | | | 1.5 | `.font-size-base` | `--font-size-base` |
| Body Small | 14px | | | 1.5 | `.font-size-s` | `--font-size-s` |
| Body Extra Small | 12px | | | 1.5 | `.font-size-xs` | `--font-size-xs` |
| Label | 11px | | | 1.5 | `.font-size-label` | `--font-size-label` |

Font weight utilities (not tokens, just classes): `.font-light` (300),
`.font-regular` (400), `.font-semibold` (600), `.font-bold` (700).
Text transform: `.text-lowercase`, `.text-uppercase`, `.text-capitalize`.
Truncation: `.text-ellipsis`.

**A custom display/heading typeface (e.g. this project's Sora) is a
legitimate brand choice layered on top of this scale — swap the font-family,
keep the size/line-height scale**, so headings stay responsive per breakpoint
without the project having to re-derive that behavior by hand.

## 6. UI pattern inventory (name these, don't describe them)

The single most common guardrail violation is describing a widget instead of
naming it ("a card-like container" → Mentor builds a `<div>`). Below is the
full CheatSheet inventory, grouped as the platform groups it. When writing a
wave spec's Screen layout section, find the row that matches what the
prototype shows and use that exact name in the prompt.

**Adaptive (layout):** Columns2, Columns3, Columns4, Columns5, Columns6,
ColumnsMediumLeft, ColumnsMediumRight, ColumnsSmallLeft, ColumnsSmallRight,
DisplayOnDevice, Gallery, MasterDetail.

**Content:** Accordion, Alert, BlankSlate, Card, CardBackground, CardItem,
CardSectioned, ChatMessage, FlipContent, FloatingContent, ListItemContent,
Section, SectionGroup, Tag, Tooltip, UserAvatar.

**Interaction:** ActionSheet, Animate, AnimatedLabel, Carousel, DatePicker,
DropdownSearch, DropdownTags, FloatingActions, InputWithIcon, LightboxImage,
Notification, RangeSlider, RangeSliderInterval, ScrollableArea, Search,
Sidebar, StackedCards, Video.

**Navigation:** BottomBarItem, Breadcrumbs, OverflowMenu, Pagination,
SectionIndex, Submenu, Tabs, TimelineItem, Wizard.

**Numbers:** Badge, Counter, IconBadge, ProgressBar, ProgressCircle, Rating.

**Utilities:** AlignCenter, ButtonLoading, CenterContent, InlineSVG,
MarginContainer, MouseEvents, Separator, SwipeEvents, TouchEvents.

**Advanced:** DropdownServerSide.

**Widgets (form/basic):** Button, ButtonGroup, Checkbox, Dropdown,
FeedbackMessage, Form, Input, Link, List, Popover, Popup, RadioGroup, Switch,
Table, TextArea, Upload.

**Mapping tip specific to this project's recurring shapes:** a list screen
that opens a detail view on row click is `List`/`Table` + navigation, not a
custom pattern — do not invent one. A version-history sidebar (Ficha,
Protocolo, Resultado in this project) is `Sidebar` or `SectionIndex` +
`ListItemContent` rows, not a bespoke `<div>` grid. An "item card with 3
subsections and a divider" (the Resultado screen's per-item card) is `Card`
+ `Section`/`SectionGroup` for the internal dividers, not a generic
container. Confirm the exact block choice with the operator at W0 if the
project's ODC version's block library differs from this inventory.

## 7. Buttons

| Variant | Class |
|---|---|
| Secondary (default) | `.btn` |
| Primary | `.btn .btn-primary` |
| Cancel | `.btn .btn-cancel` |
| Success | `.btn .btn-success` |
| Error | `.btn .btn-error` |

Sizes: `.btn-small`, default (no suffix), `.btn-large`.
Shapes: `.border-radius-none`, `.border-radius-soft` (default), `.border-radius-rounded`.
Custom color: `.btn .background-<color>` / `.btn .text-<color>` (secondary-style) using any token from Section 1.

## 8. Utility classes (layout/behavior — reach for these before custom CSS)

Positioning: `.absolute-*` (top/right/bottom/left/center-*), `.sticky`,
`.fixed`, `.position-relative`, `.position-absolute`.
Sizing: `.full-width`, `.half-width` (+ `-vw` variants), `.full-height`,
`.half-height`, `.auto-height`, `.full-height-minus-header`.
Text: `.text-align-left/center/right`, `.white-space-nowrap`, `.break-word`,
`.wcag-hide-text`.
Display: `.display-block/none/inline/inline-block/inline-flex/grid/contents`,
`.hidden`, `.hide-on-service-studio`.
Flex: `.display-flex`, `.align-items-*`, `.align-self-*`,
`.align-content-*`, `.justify-content-*`, `.flex1/2/3`,
`.flex-direction-*`, `.flex-wrap`, `.gap-*`.
Images: `.img-cover`, `.img-rounded`, `.img-circle`, `.thumbnail`.
Responsive: `.tablet-full-width`, `.phone-full-width`.

---

## How to use this in the skill's steps

- **Question 3 (reference screens / look and feel), Step 1:** after
  extracting a color palette from whatever the user provided, map every
  extracted color onto the closest token above (a semantic role, a hue
  shade, or a neutral step) instead of carrying it forward as a raw hex
  value. Only keep a raw hex if truly nothing in Section 1 is close — note
  that explicitly as a deliberate exception.
- **W0 (theme wave):** the theme table in the wave spec lists *which
  platform token each brand color overrides* (`--color-primary` = ONNI
  teal, `--color-error` replaces the default red, etc.) — not a
  from-scratch variable list. The Tema & Identidade Visual screen (see
  SKILL.md's W0 section) swatches these same token names, not invented
  ones, so it doubles as documentation of the actual overrides.
- **Every wave spec's Screen layout section:** name the Section 6 pattern
  a prototype element maps to. If nothing matches, say so explicitly —
  that is a signal the prototype invented a pattern Mentor cannot build
  natively, and is worth reconsidering before it reaches a prompt.
- **Spacing/radius/shadow in LAYOUT FACTS:** state them as scale steps
  ("gap: `--space-base` between fields", "card elevation: `--shadow-s`"),
  not raw px/box-shadow values — Mentor maps a named step onto a real
  utility class or variable far more reliably than it infers one from a
  px number.
