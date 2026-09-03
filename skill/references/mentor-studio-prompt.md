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

**Never write a wave number as a stand-in for a fact, inside the fence.**
"already published in W1" or "same pattern as W0" means nothing to Mentor —
it has no memory of W0 or W1, no wave table, no concept of a wave at all. It
only knows what's actually in the app right now and what this prompt tells
it. Every fact a later wave depends on must be restated as a fact about the
*current state of the app*, not as a pointer to an earlier session:

- Wrong: "ExtrairTextoDocumento already exists (created in W1) — reuse it."
- Right: "An action ExtrairTextoDocumento(Arquivo Binary) → Texto already
  exists in this app — synchronous PDF text extraction using the OmniDoc2MD
  Forge component. Reuse it, do not recreate it."
- Wrong: "Same upload pattern as W1's ficha screen."
- Right: state the pattern itself, in full, as if Mentor has never seen it:
  attach only selects a file (chip + "Trocar arquivo", no server call), a
  separate "Carregar documento" button fires the actual call, loading
  feedback lives on that button (spinner + disabled), never on the widget.

This costs a few more lines per prompt than a wave-number shorthand would,
and is worth it every time — the shorthand doesn't compress anything from
Mentor's side, it just produces a prompt that reads correctly to the human
operator while silently telling Mentor nothing. Wave numbers belong only in
the operator's own note above/below the fence (`> **Nota do operador (não
copiar):**`), never inside it — that note is for a human with project
memory, the fence is not.

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
| A cross-module event is created exactly as specified (name, params, fired correctly) but the subscribing module's Mentor session reports it doesn't exist / can't be found | ODC events default to **Private** (module-internal) visibility when created. A private event is invisible outside its own module — including to a Global Event Handler in a different asset trying to subscribe to it — with no error at creation time; the gap only surfaces later, in the *other* module's session, as "this event doesn't exist," which reads like the event was never built at all even though it was. Same failure shape for a Service Action meant to be called cross-module: it must be exposed/public too, not just present. | Any time a prompt creates an event (or Service Action) specifically so a *different* module can consume it, state the visibility requirement explicitly in that artifact's own CHANGES line — "create local event X, set to **Public**" — don't rely on "expose an event" alone to imply it. If the gap is only caught after the fact (as here), the fix is a one-line re-prompt in the owning module's own session: name the event, say "set visibility to Public," republish — then re-check the consuming module's session, since it may still be looking at stale/unpublished dependency metadata until that owning module is actually published, not just saved. |
| A filter/query comparing an entity's own Id attribute (type `Identifier`) against a value converted to `Long Integer` compiles without warning but the query returns zero rows at runtime | ODC reports this as "Unexpected Data Type" in the model, but Mentor can still generate and publish it — the failure only shows up as the query silently finding nothing, which then cascades into whatever depends on that record (an update that "succeeds" but changes 0 rows, a null-reference a few nodes later). Converting an Id `Identifier` to `Long Integer` (or vice versa) is the wrong move even though both are numeric under the hood — they are distinct types to ODC's type checker in a way that specifically breaks entity filters. | Compare entity Ids as `Text` on both sides instead of crossing into `Long Integer`/`Identifier` casts: `IdentifierToText(Entity.Id) = SomeTextParam`. This is especially relevant right after a value has round-tripped through a Text parameter (e.g. an Id serialized into an event or a DevTools input) — the natural instinct is to convert it back to a typed Id or Long Integer to "match" the entity's own Id type, but the safer, reliably-working comparison keeps both sides as Text. |
| An action reports success ("Simulação concluída", "Salvo com sucesso") but the record it was supposed to change is unchanged when checked independently (fresh query, page reload) | A "success" message shown unconditionally after a database operation — without querying the record back afterward to confirm the value actually changed — silently degrades into exactly the same failure mode as no error handling at all, except now it actively lies. This is a natural blind spot because from the flow's own perspective the write node "ran without throwing," which reads as success even when the write's WHERE clause (see the Identifier/Long Integer gotcha above, a common cause) matched zero rows. | Don't accept a static success message as evidence a write worked — after any create/update meant to be user-visible, re-query the affected record and branch: show the intended success message only if the expected field(s) actually hold the new value, otherwise show a specific error. Ask for this explicitly in the prompt ("verify the update took effect before showing success") when the action's own correctness is in question, not just when something visibly errored. |
| A dropdown appears to have an option selected (visually highlighted, correct label showing) but the screen variable bound to it is still the widget's `EmptyValue`/default when an action reads it | ODC dropdowns distinguish "an option is visually current" from "the user actively fired the selection interaction" — a user who clicks the dropdown open and then clicks away without click-selecting a specific `<option>` row can leave the bound variable at its configured `EmptyValue` (e.g. `NullIdentifier()`) even though something is showing in the closed control. Downstream code that trusts the variable directly then operates on an empty/default Id, which — combined with the Identifier/Text gotcha above — often shows up as "record not found for Id=0" rather than an obviously dropdown-shaped bug. | When a dropdown feeds an action that only makes sense with a real selection (not the empty/first state), add an explicit fallback for the case where the bound variable still equals `EmptyValue` when the action fires — e.g. default to the first item of the list it was populated from — rather than assuming a rendered option implies an active selection. Worth naming as a known risk in any prompt building a "pick one from a short list, then act on it" DevTools/debug widget, since these are exactly the low-stakes contexts most likely to skip a real select-and-confirm interaction pattern. |
| A filter/join comparison is already correctly Text-based (see the Identifier gotcha above) and the query still returns zero/wrong rows after a fix attempt that changed nothing observable | The comparison expression was never the bug — the foreign key column it reads is null or points at a row that no longer exists (an orphaned FK from an earlier wave's seed action, a record created before that FK was populated). A null/orphaned FK produces the exact same symptom as a broken comparison — join finds nothing, no error — so it's easy to spend several rounds rewriting the expression when the expression was already right. One project spent 4 reconcile rounds cycling `LongIntegerToText`/`IdentifierToText`/casts before checking the data and finding the FK columns were simply null in the seed. | After the **first** comparison-expression fix produces no observable change, stop varying the expression and check the raw data instead: open the entity in the ODC Portal Data view (or ask Mentor to report the actual FK column values for a specific record) before writing a second expression variant. If the FK is null/orphaned, the fix belongs in whatever action creates/seeds that record, not in the aggregate reading it. |
| Native `<select>` options render with light/white background and hard-to-read text in an otherwise dark-themed app, even though the closed field is themed correctly | Most browsers render a plain `<select>`'s open options popup with browser/OS-native colors, ignoring the page's own dark-theme CSS — only the closed control can be reliably restyled. If the option text color was written assuming a dark background (a light gray meant to sit on a dark card), the result is light-gray-on-white: technically styled, practically illegible. | Set an explicit **dark** text color on `<option>` elements wherever the app uses a plain select on a dark theme — don't assume the closed field's styling carries into the popup. Two things are effectively uncontrollable across browsers and not worth a further reconcile round once confirmed: the popup's own background color, and the highlight color of the currently-selected row — these are genuine platform ceilings, not an unfixed prompt. |
| A prompt asks Mentor to add a new visibility/enabled condition to a UI element that already has one (e.g. "hide these buttons when `X`," on buttons that were already hidden when `IsReadOnly`) — the new condition works exactly as asked, but the *old* one is gone, and the element is now interactive in a state that used to correctly lock it down | Mentor implements "add condition X" by writing X as the element's new (sole) visibility/enabled expression, not by ANDing X onto whatever expression was already there — it satisfies the literal ask without checking what the property already contained. This is invisible in the fix's own target state (a read-only record was never part of that prompt's test scenario) and only surfaces in a *different* state the prompt never mentioned, so it reads as unrelated until someone re-checks that other state specifically. One project's fix that branched a checklist item's answer buttons on `Peso = 0` (to swap the option set for one special item) silently un-did the same buttons' existing "hidden when the record is Finalizada" rule for every item — caught only because the wave's own test suite (not manual verification) re-ran the read-only case from an earlier wave. | When a prompt adds a new condition to an element that already has one, state explicitly what the two must do together — "combine with the existing read-only rule; keep it hidden when read-only regardless of X, and split only on X when not read-only" — and name the existing condition instead of trusting Mentor to preserve it unasked. After any such fix, don't just verify the new condition's own target case: re-run the state that was already correct before the fix (here, opening a Finalizada record) to confirm it is still correct, ideally via the existing automated test for that state rather than a fresh manual click-through, which is exactly what caught this one. |

## 5. Anti-patterns

- Pasting the SDD. It is context the operator is paying for by the line, and
  Mentor will build things from it that this wave does not want.
- "Implement the reservation feature." Every prompt is a numbered list of
  atomic changes or it is a guess.
- Describing a component instead of naming it. `Card`, `Tabs`, `ListItem`,
  `Columns2` are the words. "A card-like container" produces a `<div>`.
- Asking for two screens because they are obviously related. The cap is one.
- Re-sending a whole wave after a partial success.
- **Referencing test files, spec test-case IDs, or "run the suite" inside a
  Mentor prompt** (e.g. "this fixes the W7-02 test case" or "rodando
  tests/w5.spec.ts, os 3 casos passam"). Mentor Studio has no access to the
  `tests/` folder and no notion of which case is which — this text is pure
  noise to whoever pastes the prompt. State the expected behavior manually,
  in terms of what to click and what should appear on screen, the same way
  you would if no automated test existed yet.
- Letting the operator improvise the paste. If the prompt needs a tweak, the
  tweak goes into `prompts/wN.md` first, then gets pasted. Otherwise what ran
  is not what is on disk and the retrospective is fiction.

## 6. Bake in proven patterns from the first prompt, not as a later fix

A pattern already proven to work earlier in the *same* project (or documented
as a standing gotcha in this file) belongs in the **original** prompt for any
new wave that creates the same kind of element — never left for the operator
to notice its absence and ask for as a separate reconcile round. The clearest
example: any button wired to a server action should get a loading state
(a spinner rendered inside the button, `disabled` while the call is in
flight, reverting on completion) — state this in CHANGES the first time such
a button is specified, the same way "no hex literals" is restated every wave
rather than assumed once. Re-stating an established pattern costs one line;
the operator finding its absence and asking for it costs a full round.

## 7. Before diagnosing a "regression," check whether your own testing caused it

A live OutSystems app has no transaction rollback between verification
clicks. Reopening a finalized record for correction during one wave's gate
check, then never re-finalizing it, makes a *later*, unrelated wave's
dashboard or list look wrong for a data reason that has nothing to do with
that later wave's code — and a diagnostic round chasing it as a code bug will
correctly report "the logic looks fine" every time, because it is. Before
writing a diagnostic prompt asking Mentor to explain data that looks missing
or wrong, re-trace what your own session did to that specific record first —
it is free and often faster than a round-trip through Mentor.
