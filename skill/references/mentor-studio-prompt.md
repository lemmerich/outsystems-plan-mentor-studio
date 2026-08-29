# Writing a Mentor Studio prompt

Read this before emitting any `prompts/wN.md`. It covers the four things that
differ from an MCP prompt: anatomy, the context pack, pruning the prototype
markup, and what to do when Mentor comes back wrong.

Upstream's guardrails still apply verbatim — this file is about the envelope
they sit in.

---

## 1. Anatomy

A Mentor Studio prompt has eight blocks, always in this order. The order is not
cosmetic: Mentor weights the top of the prompt more heavily, so scope and
context come before the work, and the work comes before the verification.

```
CONTEXT        what already exists, in this app, that this wave touches
DO NOT TOUCH   the explicit blast radius
OBJECTIVE      one sentence
CHANGES        numbered, atomic, verifiable
PROTOTYPE MARKUP  the pruned HTML+CSS for this screen
LAYOUT FACTS   box model in words (max-width, stacking, min-width:0)
GUARDRAILS     the ten standing rules, verbatim, every time
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
Theme: <theme name>; colors are variables — <list the 4-6 variable names by name>
Entities that exist: <name (relevant attributes only)>
Screens that exist: <name — one clause on what it does>
Server actions that exist: <name(inputs) -> output>
This wave changes: <module name> only
```

What goes in: only artifacts this wave reads, calls, navigates to or extends.
What stays out: everything else, including artifacts from previous waves that
this wave does not touch — those belong in DO NOT TOUCH as names, not as
descriptions.

`DO NOT TOUCH` is a flat list of names. Do not explain them. A named artifact
with a description attached invites Mentor to "improve" it.

## 3. Pruning the prototype markup

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
   a numbered change item.
5. Keep every `data-test` attribute exactly. They are the contract with the
   Playwright suite, and they are the single most common thing lost in pruning.

Target 120 lines, hard ceiling 200. A screen that will not fit is a wave that
should have been two waves.

Say what the markup is, so it does not get transcribed literally:

> The block below is the approved prototype for this screen. It is the layout
> contract, not code to paste. Reproduce it with OutSystems UI blocks.

## 4. When Mentor comes back wrong

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

**Every re-prompt cause gets one line in the wave log.** That log is the only
input to the retrospective, and the retrospective is the only thing that makes
the next project's prompts better. A re-prompt whose cause was "the prompt never
said the list had an empty state" is a missing line in this file, not bad luck.

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
