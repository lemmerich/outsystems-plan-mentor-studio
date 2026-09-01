# Writing a Mentor Studio prompt

Read this before emitting any `prompts/wN.md`. It covers the four things that
differ from an MCP prompt: anatomy, the context pack, pruning the prototype
markup, and what to do when Mentor comes back wrong.

Upstream's guardrails still apply verbatim — this file is about the envelope
they sit in.

---

## 0. File format — a fence is a prompt, prose is a note

`prompts/wN.md` is not itself "the prompt" — it is a small document that may
contain **one or more** paste-ready prompts (one per artifact the wave
touches, see "Waves that touch more than one artifact" below) plus whatever
the operator needs to understand around them. Those two things must never
share a text block, or the operator ends up guessing where to stop copying.

**The rule: everything meant for Mentor Studio's clipboard lives inside one
fenced code block per artifact. Everything else — why this order, what to
verify after, why a design call was made — is prose outside the fence,
always opened with `> **Nota do operador (não copiar):**`.** A fence is
self-contained: it includes its own guardrails, context, objective, changes,
markup and expected result inline, in the order in Section 1 below, so the
operator never has to assemble a paste from a shared block up top plus a
per-module block further down. Immediately before each fence, one bold line
names which artifact's Mentor Studio session it goes into:

```markdown
## Módulo alvo: <ArtifactName>

> **Nota do operador (não copiar):** <why this module/order — optional>

**Cole o bloco abaixo inteiro na sessão do Mentor Studio de `<ArtifactName>`:**

​```
CONTEXT
...
DO NOT TOUCH
...
OBJECTIVE
...
CHANGES
...
PROTOTYPE MARKUP
...
LAYOUT FACTS
...
GUARDRAILS
...
EXPECTED
...
​```

> **Nota do operador (não copiar):** <what to check after pasting — optional>
```

A file with two artifacts has two such fenced blocks, each complete on its
own. Never split one artifact's prompt across two fences, and never let a
fence contain a sentence addressed to the operator rather than to Mentor.

## 1. Anatomy

A Mentor Studio prompt has eight blocks, always in this order, **all inside
the same fence** (see Section 0). The order is not cosmetic: Mentor weights
the top of the prompt more heavily, so scope and context come before the
work, and the work comes before the verification.

```
CONTEXT        what already exists, in this app, that this wave touches
DO NOT TOUCH   the explicit blast radius
OBJECTIVE      one sentence
CHANGES        numbered, atomic, verifiable
PROTOTYPE MARKUP  the pruned HTML **and its CSS rules** for this screen —
                  never HTML alone (see Section 3)
LAYOUT FACTS   box model in words (max-width, stacking, min-width:0)
GUARDRAILS     the ten-to-twelve standing rules, verbatim, every time
EXPECTED       what must be true when you are done
```

Two rules about size. **The whole thing stays under 200 lines**, markup
included; past that, Mentor starts dropping items from the middle of CHANGES
and the operator has no way to notice except by comparing afterwards. And
**CHANGES holds at most 8 numbered items** — combined with the one-screen cap
and the 3-4 action budget, this is what keeps a wave inside a single Mentor run.

## 2. The context pack

Mentor Studio has no memory between sessions, and the operator will not paste
the SDD every time. So each prompt opens with a context pack: the smallest set
of existing facts this wave needs, and nothing else.

Generate it at emit time from the RUNBOOK wave table plus the specs of waves
already marked DONE. Never keep it as a file — it is derived, and a stored
derived file goes stale silently.

```
CONTEXT
Application: <app name>
Modules: <names, and which one this wave changes>
Authentication: <public — Everyone, no login> | <requires login — roles: X, Y>
Theme: <theme name>; colors are variables — <list the 4-6 variable names by name>
Entities that exist: <name (relevant attributes only)>
Screens that exist: <name — one clause on what it does>
Server actions that exist: <name(inputs) -> output>
This wave changes: <module name> only
```

`Authentication` is not optional filler — take it verbatim from RUNBOOK
"Project facts" (Step 1, Question 5) in every wave that creates a screen.
ODC creates a new screen as login-required by default; a prompt that never
states the project's actual auth model gets that default silently, and
nothing in a published screen visually flags "this requires login" the way
a wrong color or a missing field does — it just fails the first time an
unauthenticated operator or Playwright test opens it. See guardrail 13.

What goes in: only artifacts this wave reads, calls, navigates to or extends.
What stays out: everything else, including artifacts from previous waves that
this wave does not touch — those belong in DO NOT TOUCH as names, not as
descriptions.

`DO NOT TOUCH` is a flat list of names. Do not explain them. A named artifact
with a description attached invites Mentor to "improve" it.

## 3. Pruning the prototype markup

**HTML without its CSS is not the layout contract — it's a guess wearing the
right tag names.** A `<div class="icon-sample">` tells Mentor nothing about
whether that div has a background, a border, padding, or none of those — it
has to invent an answer, and it usually invents "give it a card," because
that is the common default, not because the class name asked for it. Every
class the pruned HTML uses must have its CSS rule copied in alongside it,
every time — not just the "important" ones judged in advance, because you
cannot tell in advance which class was going to be the one Mentor guesses
wrong. (This is not a hypothetical: on one project's W0, the exact same
prompt — HTML only, no CSS — produced three separate rounds of drift on the
same screen: swatch card sizing, then shell chrome the CSS never mentioned,
then five more small mismatches — heading color, a heading underline the
markup gave no reason to expect, a boxed icon container, a missing pill dot,
and a status color the operator's own re-prompt got wrong the *first* time
specifically because that CSS rule was never in front of anyone to check
against. All from the same root cause, paid three times instead of once.)

The living prototype is one HTML file with every screen and a nav switcher. What
goes into the prompt is one screen, cut down. Prune in this order:

1. Take only the container for this screen's tab. Drop the switcher, the other
   tabs, the `<head>` boilerplate.
2. Drop all JavaScript. Behaviour is described in CHANGES, not inferred from a
   click handler. The one exception is a validation rule expressed only in JS —
   move it into CHANGES as a sentence before deleting it.
3. Keep only CSS rules that match elements still present. Keep the variable
   declarations for the variables those rules use.
4. Replace repeated rows with two: one real, one `<!-- ...repeats per record -->`.
   Mentor does not need ten table rows to infer a list, and ten rows crowd out
   a numbered change item. **This applies only to genuinely interchangeable
   rows** — records of the same shape where any one of them is a
   representative example (a table of consultas, a list of fichas). It does
   NOT apply to a small fixed set of reference items where every item's exact
   value is the point — a theme's color swatches, contrast pairs, or
   typography specimens are not "repeats," they are a finite enumerated list
   each entry of which the screen exists to display correctly. Pruning those
   to one example plus a comment deletes the only source Mentor has for the
   other entries' exact values, and it will compute or guess plausible ones
   instead — which is exactly how a font weight, a contrast ratio number, or
   a badge color quietly drifts from the approved prototype (seen twice on
   the same wave: typography specimens and contrast ratios both under-pruned
   this way). If in doubt whether a repeated block is "the same record shape"
   or "a small reference set," keep all of it — the line-count cost is a few
   rows, the failure cost is a Compare round.
5. Keep every `data-test` attribute exactly. They are the contract with the
   Playwright suite, and they are the single most common thing lost in pruning.
6. Walk every class name and inline style left in the pruned HTML and copy its
   CSS rule from the prototype's `<style>` block right below the markup, in a
   fenced block of its own. Include shell-level classes the screen's markup
   sits inside (sidebar, nav item, section heading), not only the screen's own
   new classes — a wave that themes existing chrome needs that chrome's real
   rules, not a prose description of what it should look like. **Shared
   utility classes are the easiest ones to skip, and the most expensive to
   miss** — `.card`, `.mono`, a bare `h1, h2, h3, h4` rule feel generic enough
   to assume Mentor already knows them, precisely because they are reused
   across many elements. They get the same treatment as everything else in
   this list, no exception: if the pruned markup writes `class="tema-section
   card"`, `.card`'s own rule is copied in even though it is "just" a shared
   card style — a class with no matching rule anywhere in the prompt is
   indistinguishable from a typo to Mentor, and it will invent per-element
   chrome to compensate (this happened: three sections quietly lost their
   shared card wrapper and gained ad hoc borders on each child instead,
   because `.card` was the one rule never carried over).

Target 120 lines, hard ceiling 200. A screen that will not fit is a wave that
should have been two waves.

Say what the markup is, so it does not get transcribed literally:

> The block below is the approved prototype for this screen. It is the layout
> contract, not code to paste. Reproduce it with OutSystems UI blocks.

## 3b. Waves that touch more than one artifact

Some waves need both a web-app change and an Agentic App change to land — a
screen that calls an agent is the usual shape (see main SKILL.md, "The
channel," consequence 5). One `prompts/wN.md` still covers the whole wave;
it just contains more than one fenced prompt, each under its own
`## Módulo alvo: <Name>` heading, per the file format in Section 0:

```markdown
## Módulo alvo: <AgenticAppName>
​```
CONTEXT ... DO NOT TOUCH ... OBJECTIVE ... CHANGES ... GUARDRAILS ... EXPECTED ...
​```

## Módulo alvo: <WebAppName>
​```
CONTEXT ... DO NOT TOUCH ... OBJECTIVE ... CHANGES ... PROTOTYPE MARKUP ...
LAYOUT FACTS ... GUARDRAILS ... EXPECTED ...
​```
```

Each fence is a complete, independent anatomy block (Section 1) — an Agentic
App fence simply has no PROTOTYPE MARKUP/LAYOUT FACTS (agents have no
screen), and skips those lines rather than leaving them empty. The operator
opens the named artifact's own Mentor Studio session and pastes only that
one fence into it — nothing above or below it. The 200-line ceiling applies
**per fence**, not to the whole file — a two-module wave prompt can run to
400 lines total across both fences and still be a one-paste-per-module wave.

Order the sections so the artifact with no dependency on the other comes
first — usually the Agentic App (a screen calling an agent needs the agent to
already exist; an agent does not need the screen to exist). State that
dependency as a one-line note at the top of the file so the operator does not
paste the web-app section first and hit a missing reference.

## 4. When Mentor comes back wrong

**Catch it before it runs, when you can.** Some Mentor Studio builds show a
written plan and wait for proceed/discard before touching the module. Read
that plan against CHANGES, GUARDRAILS and DO NOT TOUCH before green-lighting
it (see "Plan check" in the main SKILL.md wave execution cycle) — same
failure shapes as the table below, but free: no publish, no undo, no Compare
round. When you catch one this way, correct it in the current session with a
sentence or two — do not discard and re-paste. The table below is for when a
plan check wasn't offered, or missed something, and Mentor has already built it.

Four failure shapes, and the response to each. Diagnose before re-prompting: a
re-prompt that repeats the original wording produces the original result.

| Shape | What you see | Response |
|---|---|---|
| Did less | Some CHANGES items silently missing | Re-prompt with ONLY the missing items, numbered from 1, plus the context pack. Never re-send the whole wave — it will redo the parts that worked and often break them. |
| Did more | Extra screens, actions, roles, "helpful" placeholder screens | Name each extra artifact and ask for its removal explicitly. Then add its shape to DO NOT TOUCH in the next wave's prompt. Extras compound. |
| Did it differently | Structure works but does not match the prototype | This is Compare's job, not a re-prompt: list every difference first, then send one re-prompt covering all of them. One difference per re-prompt is how a wave eats an afternoon. |
| Broke a previous wave | A screen that worked no longer does | Stop. Do not continue to the next wave. Re-prompt naming the broken artifact and the behaviour it must return to. Then check whether that artifact was in DO NOT TOUCH; if it wasn't, that is the actual defect, and it is in your prompt, not in Mentor. |

**Two re-prompts, then re-plan.** If a wave needs a third, the wave is too big or
the spec is ambiguous. Split it at the spec's stall point rather than paying a
third human round trip.

**On the second styling re-prompt, stop sending diffs — send the whole
stylesheet.** A CSS correction phrased as a patch ("remove the border on X",
"add the dot to Y") is read as a local instruction, and Mentor rewrites the
surrounding rules to make the patch coherent — which silently changes
properties nobody asked about. Two or three such patches in a row and the
screen oscillates: each round fixes the named item and breaks a neighbour,
and the operator experiences it as the model "undoing good work." The fix is
to change the unit of correction, not to write a more careful patch. Send one
complete, authoritative block containing **every** rule for that screen at its
final intended value, and say plainly: *replace the existing rules with these;
these are the complete and final values; any property not listed here should
not exist.* A full stylesheet is idempotent — re-sending it converges — where
a sequence of diffs is path-dependent and does not. Note this costs no extra
round: it is the same paste, with more of the file in it.

The same trap explains most "it fixed A and broke B" reports. Before blaming
the model, check whether the last three corrections were diffs against a
moving target.

**Never trust the summary — read the published result back.** Mentor's own
recap of what it changed ("removed the class," "added the rule") describes
intent, not necessarily the outcome. Every gotcha in §4b below was
discovered by reading the actual published CSS/DOM after a change that was
reported as done and was not. Treat "I did X" the same way Compare treats a
spec: a claim to verify against the artifact, not a fact to log.

**After two failed attempts at one isolated, single-property fix, consider
handing it to the operator instead of a third round-trip.** Removing one
class from one widget, or forcing one property to `0`, is a few-second click
in ODC Studio. If two chat-mediated attempts at exactly that have not stuck
— including via a workaround mechanism, not just a reworded retry — a third
attempt is not obviously more likely to work, and the operator doing it by
hand costs less than another publish-and-verify cycle. This is not a failure
of the process; it is the process recognizing that the paste channel has a
floor, and small structural edits are sometimes below it.

**Every re-prompt cause gets one line in the wave log.** That log is the only
input to the retrospective, and the retrospective is the only thing that makes
the next project's prompts better. A re-prompt whose cause was "the prompt never
said the list had an empty state" is a missing line in this file, not bad luck.

## 4b. Known ODC publish-time gotchas

Two failure shapes that show up only after publish, not in a plan check,
because they are ODC platform defaults rather than something Mentor decides:

| Gotcha | What you see | Fix |
|---|---|---|
| Screen born login-required | A screen the spec calls public opens to a login wall; Playwright tests without `storageState` fail on it | Not a Mentor mistake — ODC's default. State `Authentication` in every screen-creating wave's CONTEXT (see §2) and restate access level in guardrail 13, every wave, not just W0. If already published wrong, one-line re-prompt in the same session: name the screen, say "Access: Everyone." |
| "Offline Behavior" warning on a Google Fonts `<link>` | ODC Portal flags the external stylesheet URL as "will not be cached for offline usage" on publish | Harmless for a PoC with no offline/PWA requirement — accept it, log it, do not spend a reconcile round on it. A real fix means uploading the font files as static Resources and referencing them locally, which needs the operator to add binary files in ODC Studio — outside what a Mentor Studio chat paste can do — so only chase this if the project explicitly needs offline support. |
| Resizing the side menu with `width: Npx !important` makes the menu vanish or cover the whole screen | The menu's own container (`.app-menu-content`) is `position: fixed` in OutSystems UI. A percentage width on it (`width: 100%`, present in the framework's own default CSS) resolves against the *viewport*, not its wrapping element — because `position: fixed` escapes normal containment. Overriding the wrapper's width alone leaves this untouched, so the inner fixed element can end up full-viewport-width, painting over the entire page. | Don't patch individual selectors piecemeal. Override the single CSS custom property the whole framework already keys off — `--side-menu-size` (check its current value and every rule that sets it, e.g. `:root` and any `.aside-visible`/`.aside-expandable` variants) — to the target px value, once, at `:root` or `.layout-side` scope. Every framework rule that positions or sizes the menu, and the content area's `margin-left`, already reads from this variable, so one override cascades correctly everywhere a hand-written per-selector fix has to be independently re-discovered. |
| Requesting a different icon weight (`ph-light`, `ph-bold`) makes icons vanish | The app's icon library ships one weight's font file at a time (typically Regular, class `ph`); only that weight has matching `font-family` and glyph `::before content` rules. A class like `ph-light ph-<name>` matches nothing — no font, no glyph — and renders empty, not a visibly "thinner" version of the icon. | Before asking for a weight variant, confirm that weight's font resource is actually loaded in the app (check for a stylesheet named `Phosphor-Light`/`-Bold`, not just the presence of the base `Phosphor` one). If it isn't, either add it first or accept the loaded weight — never assume a CSS class name alone changes which font file renders. |
| A bulk CSS paste applies partly: the first N rules land, everything after one particular rule silently stops working | That rule is missing its closing brace. Browsers now support CSS nesting, so an unclosed rule no longer raises a parse error that discards the remainder — instead **every subsequent rule is absorbed into it as a nested child** (`.pill::before { & .opt-btn {…} & .toggle-pill {…} }`), where it matches nothing. The rules are present in the file, look correct when read, and never apply. Presents exactly like "the model ignored the tail of my instructions" or "it undid work we had already fixed," which sends you chasing a behavioural cause for a syntax bug. | Verify after any bulk CSS paste rather than trusting the summary: check that the **last** rule in your block exists as a top-level rule, e.g. `[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules]}catch(e){return []}}).filter(r=>r.selectorText==='<last-selector>')`. If it is missing, or if some earlier rule's `cssText` contains `&` children you did not write, that earlier rule is the unclosed one — re-send from it onward. Prefer several short CSS pastes over one long one: the failure is silent and its blast radius is "everything below the mistake." |
| The same styling request fails repeatedly while every other edit in the same paste lands | Separate two operations that look identical in a prompt but are not: **editing an existing rule** and **adding a new rule**. Edits to a rule already in the stylesheet apply reliably; a brand-new sibling rule can be dropped with no error and no trace, and rephrasing the selector does not help because the selector was never the variable. Two failed attempts on the same target with different syntax is the signal — stop rewriting the selector. A widget-level fix (removing a CSS class from a widget's property panel) can fail to stick the same way, for the same reason — it is also "add/remove something," not "edit an existing value." | Change the mechanism, not the wording, and escalate through them in order: (1) fold the declaration into a rule that already exists and is being edited successfully; (2) apply it as widget-level styling on the specific named widget instead of via the stylesheet — often *more* faithful anyway, since spacing carried by an inline `style=` in the prototype should become a widget property, not a promoted CSS rule; (3) if the widget-property route also fails to stick, fall back to an ID-scoped `!important` override added to a stylesheet that IS being edited successfully (`#WidgetId.leftover-class { property: value !important; }`) — this is editing an existing file, not adding a new rule or a new widget setting, so it inherits the reliability of path (1). Two failed rounds on the same isolated fix is also the point to weigh handing it to the operator directly — see below. |
| Comparing against the prototype at the browser pane's default (often ~800px) width shows the wrong layout entirely — missing sidebar, wrong button size, wrong font-size | OutSystems UI ships responsive breakpoint rules (`.tablet .btn`, `.phone .btn`, mobile menu collapse) that fire below roughly 1024px and override the desktop rules you are trying to verify, with higher specificity. Reading computed styles at a narrow width produces real, reproducible numbers that are simply answering a different question. | Always resize to a real desktop width (1440px is a safe default) before comparing computed CSS or taking a screenshot against a desktop-designed prototype. A measurement that looks wrong at the pane's native width should be re-taken at desktop width before it is reported as a defect — it is a common enough false positive to check first, not last. |
| A CSS rule you asked for is simply not in the published stylesheet — no error, and the publish did happen | Two causes worth separating. (a) A single-line correction sent on its own is easier to lose than the same line inside a larger block. (b) The selector itself may be dropped: a functional pseudo-class like `:not(…)` has been observed silently discarded while plain `:last-child` in the same stylesheet applied fine. | Never accept "done" from the summary — read the published CSS back and confirm the rule exists (`[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules]}catch(e){return []}}).filter(r=>/<selector-fragment>/.test(r.selectorText\|\|''))`). If a rule with a functional pseudo-class goes missing, re-express it with a plain combinator — `.x + .x { margin-top: N }` instead of `.x:not(:last-child) { margin-bottom: N }` — before concluding the model ignored you. |
| Dark theme still shows a light-colored native scrollbar (and light form-control chrome) | The page never set the CSS `color-scheme` property, so the browser has no signal to render its own UI (scrollbar, checkboxes, date pickers) in dark style — it defaults to light regardless of how dark the page's own content is. | Set `color-scheme: dark` inside the dark-mode variable block (and `color-scheme: light` in the light default, or `light dark` to let the browser pick) on `:root`/`html`. This is a single declaration and fixes native chrome across the whole app — reaching for a hand-rolled `::-webkit-scrollbar` rule set (Chromium-only, needs separate track/thumb/hover rules per theme) is unnecessary for this. |
| An Advanced SQL node uses `ISNULL(a, b)` (or `TOP`, `GETDATE()`, other SQL Server-only syntax) and fails at runtime with something like `function isnull(integer, integer) does not exist` | ODC SQL nodes switch dialect based on what the query touches: **Postgres syntax** when the query references only internal entities (created in ODC Studio); **ANSI-92 syntax** when it references any external entity, or a mix of internal and external. A query written for internal entities in SQL-Server-flavored ANSI syntax compiles fine in the prompt/plan (Mentor doesn't dialect-check at design time) and only breaks when Postgres actually executes it. | Before asking Mentor to write or fix an Advanced SQL node, state which dialect applies based on the entities involved, and name the equivalents up front: `COALESCE` not `ISNULL`, `LIMIT`/`OFFSET` not `TOP`, `NOW()` not `GETDATE()`. If a query already fails this way, the error message names the exact missing function — swap it for the Postgres equivalent, don't rewrite the whole query. |
| A web app → Agentic App "request" is drafted as an event the web app publishes and the agent consumes | `ITriggerGlobalNode.Event` (ODC's node for firing a global event) only accepts a **local** event of the same asset — there is no way to trigger another module's event from outside it. An event owned by the Agentic App genuinely cannot be "published" from the web app's flow; Mentor will either refuse or quietly build something that doesn't do what the prompt asked. This is easy to miss because a request/response pub-sub pair *feels* symmetric, but only one direction of that symmetry is actually implementable. | The **request** side is a normal cross-module Service Action call, not an event — the web app calls a Service Action exposed by the Agentic App (input: whatever the agent needs), and that action must return immediately, before the agent's own processing finishes, so it doesn't become a blocking wait. Only the **completion** side is an event, and it must be triggered from inside the asset that owns it — the Agentic App defines and fires its own result event locally when its work finishes; the web app's only role there is a Global Event Handler subscribing to it. State the Service Action's name and contract explicitly in the agent's own prompt (input params, "returns immediately, does not wait for the LLM"), and in the caller's prompt state it calls that action directly — never "publishes an event to" the agent for the request leg. |

## 5. Anti-patterns

- Pasting the SDD. It is context the operator is paying for by the line, and
  Mentor will build things from it that this wave does not want.
- "Implement the reservation feature." Every prompt is a numbered list of
  atomic changes or it is a guess.
- Describing a component instead of naming it. `Card`, `Tabs`, `ListItem`,
  `Columns2` are the words. "A card-like container" produces a `<div>`.
- Asking for two screens because they are obviously related. The cap is one.
- Re-sending a whole wave after a partial success.
- Letting the operator improvise the paste. If the prompt needs a tweak, the
  tweak goes into `prompts/wN.md` first, then gets pasted. Otherwise what ran
  is not what is on disk and the retrospective is fiction.
