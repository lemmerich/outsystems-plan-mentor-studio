---
name: outsystems-recipes
description: >
  Copy-paste-ready prompt recipes for every recurring OutSystems UI
  pattern this skill's projects have hit a multi-turn fix on — dropdowns
  with an "all"/empty option, a modal containing a form, sticky footers,
  per-row list controls (selection + persistence + bulk save), reserved
  theme class names, MasterDetail, icon+label link wrapping, appearance
  resets, external fonts, and more. Read this BEFORE writing a Mentor
  prompt whenever the wave's scope matches one of these patterns — each
  recipe already encodes the two-part fix that a natural-language
  description of the same pattern tends to drop, so the prompt doesn't
  rediscover it turn by turn. Companion to `prototype-to-widgets.md`
  (which explains *why* each gap happens) — this file is *what to say* to
  avoid it happening at all.
---

# OutSystems recipes: prompt text that avoids known failure modes

Each recipe below is a **prompt template**, not a lesson. Copy the
relevant block into the Mentor prompt (adjusting names/screens) instead
of describing the pattern in your own words — the wording here already
carries the two-part fixes and box-model facts that a natural-language
description tends to drop.

## Recipe: dropdown with an "all"/empty-selection option

**When to use:** any filter or picker where one option means "no filter" /
"show everything", written as a first option like "Todos", "All",
"Any" — not a real record.

**The trap this avoids:** the OutSystems Dropdown widget has no `Prompt`
property. Asking for "an empty-state option that says X" without the two
concrete steps below produces a literal `"0"` (or whatever the identifier
type's raw value is) as the first option instead of the label text — and
Mentor cannot fix this by writing C# against `IDropdown`, because there
is no method for it. See `prototype-to-widgets.md` #11 for the full story.

**Prompt block:**

```
Dropdown "<Label>" (fonte: <Entity>) — precisa de uma opção "<Todos/All
label>" representando "sem filtro". O widget Dropdown do OutSystems não
tem propriedade Prompt — implemente em duas partes, ambas obrigatórias:
1. Insira um registro sintético (Id = NullIdentifier(), Label =
   "<Todos/All label>") no início da lista do aggregate, via uma ação
   wired ao OnAfterFetch do aggregate.
2. Remova a propriedade EmptyValue do widget Dropdown. Sem isso, o
   registro sintético e a opção nativa vazia aparecem AMBOS, duplicados
   (um "0" ao lado de "<Todos/All label>").
Quando nada estiver selecionado, o valor da variável de filtro deve ser
NullIdentifier() e o aggregate correspondente não deve filtrar por essa
coluna.
```

**Verify after publish:** read `[...select.options].map(o => o.text)` in
the browser — must show exactly the labels you specified, no `"0"`.

---

## Recipe: modal containing a form (multi-field, not just a confirm dialog)

**When to use:** converting an in-page form block into a modal, or
building a new multi-field form (more than 2-3 inputs) that should open
as an overlay rather than inline.

**The trap this avoids:** this exact pattern took **four** fix turns in
this project (see Mentor Fidelity Report FIND-29) before landing — each
attempt broke a different way (children individually styled as separate
cards; `all: revert` reverting to a still-broken intermediate state
instead of the true default; a stale `height`/`top` inline style from the
widget's old in-flow position beating the theme CSS). The prompt below
front-loads the fix for all three failure points at once, and specifically
calls out the widget property that generates the silent inline style —
the actual root cause, not a symptom.

**Prompt block:**

```
"<Form name>" deve abrir como MODAL (overlay + card centralizado), não
como bloco embutido na página. Estrutura exigida — construa exatamente
assim, não incrementalmente:

1. UM wrapper overlay (`position: fixed; inset: 0; background: rgba(...);
   display: flex; align-items: center; justify-content: center; z-index:
   1000`) — este é o fundo escuro, nada mais.
2. Dentro dele, UM ÚNICO card wrapper (`width: <Npx> fixo; max-width:
   92vw; max-height: 85vh; overflow-y: auto; background: white;
   border-radius: 12px; box-shadow: ...; padding: ...; display: flex;
   flex-direction: column; gap: ...`) contendo TODOS os campos e os
   botões de ação dentro dele — nunca estilize os campos individualmente
   como se cada um fosse seu próprio card.
3. Antes de aplicar: verifique se o widget que vira este card (Container/
   FormCard) tem uma propriedade `Width` configurada como "(fill
   parent)"/preenchida — se tiver, LIMPE essa propriedade. Ela é a causa
   raiz mais provável de o runtime do OutSystems injetar um style inline
   com `top`/`height` fixos (refletindo a posição antiga do elemento
   quando ele vivia no fluxo normal da página), que silenciosamente vence
   qualquer CSS de classe sem `!important`.
4. Como reforço (não substitui o passo 3): declare `top`, `left`,
   `transform`, `height` e `max-height` do card com `!important`.
5. Visível/oculto controlado pela mesma variável booleana que o widget já
   usa hoje (não recriar o mecanismo de show/hide) — só a ancoragem
   visual muda de "embutido" pra "modal".
```

**Verify after publish (all three, not just a screenshot):**
1. `getComputedStyle(cardEl).height` must equal `cardEl.scrollHeight`
   (no clipped content) — a screenshot alone can look fine while content
   is silently cut off above/below the visible card.
2. Every direct child of the card wrapper has `position: static` —
   `[...cardEl.children].every(c => getComputedStyle(c).position ===
   'static')`.
3. `getBoundingClientRect(cardEl).width` matches the fixed width you
   specified, not a fill-parent value.

---

## Recipe: title + subtitle/count stacked in a screen header

**When to use:** any screen title that has a second line under it (a
record count, a subtitle, a status line) inside the top bar area.

**The trap this avoids:** `LayoutSideMenu`'s top bar has a `Title`
placeholder and a `Header` placeholder as two separate side-by-side
regions, not one stacked block. Asking for "title and subtitle" without
naming the placeholder puts the second line in `Header`, which renders
next to the title, not under it.

**Prompt block:**

```
O título "<X>" e a linha "<Y>" abaixo dele (ex.: contagem de registros)
ficam AMBOS dentro do placeholder Title do LayoutSideMenu, empilhados como
blocos — nunca colocar a segunda linha no placeholder Header, que é uma
região separada do topo e renderiza ao lado, não abaixo.
```

---

## Recipe: a container that must not stretch to fill its parent

**When to use:** any card, form, or panel whose prototype CSS sets a
`max-width` narrower than the screen's content area.

**The trap this avoids:** OutSystems `Container`/`Form` widgets default to
filling their parent's width. A screenshot cannot distinguish "this box is
640px because it's capped" from "this box happens to be 640px at this
viewport" — the number has to be stated. `Columns2`-`Columns6` blocks
additionally drop `Width`/`Style` set on the block instance itself; wrap
in a `Container` and put the constraint there instead.

**Prompt block:**

```
O container "<X>" tem max-width: <N>px fixo — NÃO deve esticar até a
largura total da área de conteúdo, que é maior. <Se for um bloco
Columns2-6: aplicar a largura/max-width num Container que envolve o
bloco, não no próprio bloco de colunas — Columns2-6 descarta Width/Style
definidos na própria instância.>
```

**Verify after publish:** `getBoundingClientRect(el).width` must equal
the stated px, not the content area's full width.

---

## Recipe: two sibling elements that must share an exact left edge (including button bars)

**When to use:** a title and a subtitle/count stacked directly below each
other, any two elements the prototype shows perfectly left-aligned, OR —
just as commonly — **any row of 2+ Button/Link widgets inside a flex
container that already declares a `gap`** (a form's "Cancel"/"Save"
footer, a modal's action bar, any `.form-actions`-style container).

**The trap this avoids:** OutSystems UI's default `MarginLeft: Adaptive`
inserts an automatic left margin on any widget that is not the first
child of its container — independent of whatever `gap` the parent flex
container already declares. This is NOT "one CSS rule losing to another"
(a rule-dump on the container looks perfectly correct, `gap: 10px` and
all) — it's **two independent, individually-correct spacing sources
stacking**: the container's `gap` AND the widget's own adaptive
`margin-left`, both applying at once. A container with `gap: 10px` whose
second button also carries `margin-left: 24px` (the widget default)
measures 34px in reality, not 10px. This was hit twice in this project on
the same button bar (`.form-actions`, "Cancelar"/"Salvar"): first
"fixed" by adding `gap: 10px` to the container alone (which looked
complete — screenshots at normal viewing distance don't distinguish
10px from 34px in a short row), then rediscovered weeks later on a
*different* screen reusing the same class, because the first fix never
touched the widget-level margin at all.

**Prompt block — prefer the THEME-level fix over per-widget zeroing:**

```
"<A>" e "<B>" compartilham exatamente a mesma margem esquerda — zere
MarginLeft explicitamente nos dois (não confiar no valor default
Adaptive, que insere margem automática).

Para uma barra de botões dentro de um container flex com `gap` já
declarado (ex.: `.form-actions`, `.modal-actions`): NÃO zerar o
MarginLeft botão por botão nem tela por tela — declarar uma regra a
nível de TEMA que cobre a classe do container inteiro, de uma vez, para
toda tela atual e futura que a reutilizar:

.form-actions > * {
  margin-left: 0 !important;
}

Fazer isso na definição do tema, nunca em CSS de tela — repetir o fix
por tela é exatamente o que permite ele "voltar" na próxima wave que usa
a mesma classe.
```

**Verify after publish:** measure the actual pixel gap, not just confirm
the container's CSS rule exists — `secondBtn.getBoundingClientRect().left
- firstBtn.getBoundingClientRect().right` must equal the declared `gap`
value exactly, and `getComputedStyle(secondBtn).margin` must be `0px`. A
rule-dump on the *container* alone is not sufficient here — the
container's rules can be 100% correct while a *widget's own* margin adds
on top; you have to inspect the buttons themselves.

---

## Recipe: dynamic text next to a fixed-width sibling in the same row

**When to use:** a counter, name, or status label sitting in a flex row
next to a button or icon of fixed width.

**The trap this avoids:** CSS flexbox's default `min-width: auto` refuses
to let a flex child shrink below its content's natural width — text wraps
prematurely even with visible free space. Invisible in a screenshot unless
the exact text length triggers it at capture time.

**Prompt block:**

```
O texto "<X>" fica num container com min-width: 0 explícito dentro da
linha flex — precisa poder encolher abaixo da largura natural do
conteúdo; não deve forçar a linha a ficar mais larga que o espaço
disponível.
```

---

## Recipe: a design token/CSS class the prompt names but doesn't apply

**When to use:** any time the prompt says "use color/variable X" or "give
this element class Y."

**The trap this avoids:** declaring a variable or class rule in the theme
stylesheet does nothing to a widget instance unless that instance's
`Style`/`ExtendedClass` property also references it. This is a two-step
change described as if it were one.

**Prompt block:**

```
Declare a variável/classe <X> no tema E aplique-a explicitamente na
propriedade Style/ExtendedClass do(s) widget(s) <lista> — declarar no
tema sozinho não muda a aparência de nenhuma instância.
```

Prefer overriding a canonical OutSystems UI variable
(`--color-primary`, `--color-neutral-0`…`-10`, `--header-color`,
`--side-menu-size`, etc. — see `outsystems-design-to-app`'s
`styles-and-utilities.md`) over inventing a new one when the prototype's
token maps cleanly onto one — it re-themes every widget that reads it for
free, with no per-element apply step.

---

## Recipe: any custom class named sidebar/header/content/footer/main-content

**When to use:** whenever a prototype's own CSS class names would be
copied verbatim into the Mentor prompt or theme.

**The trap this avoids:** OutSystems UI's own LayoutBlank theme defines
rules for these five exact names, and both rules apply at once (e.g. a
`.sidebar` rule pins to the *right* edge).

**Prompt block:**

```
Usar classes prefixadas com o namespace do app (ex.: .app-sidebar,
.app-header) — nunca .sidebar/.header/.content/.footer/.main-content sem
prefixo, essas colidem com regras já existentes no tema LayoutBlank da
OutSystems UI.
```

---

## Recipe: a "click a row, see detail" list→detail screen

**When to use:** before speccing custom navigation state (a `SelectedId`
variable, a screen redirect) for any list-to-detail pattern.

**The trap this avoids:** OutSystems UI's `MasterDetail` block already
gives side-by-side list/detail on desktop, drill-down on phone, and a
built-in phone back button — hand-rolling it duplicates a block that
already handles the responsive case.

**Prompt block:**

```
Antes de implementar navegação custom para "<lista> → <detalhe>",
verifique se o bloco MasterDetail do OutSystems UI já cobre esse
comportamento (list/detail lado a lado no desktop, drill-down no celular,
botão voltar nativo) antes de construir do zero.
```

---

## Recipe: wrapping an icon+label in a link/button (nav item, row action)

**When to use:** any "make this clickable" request where an icon and a
label need to become one interactive target.

**The trap this avoids:** two separate, compounding bugs seen in this
project: (1) the anchor/button gets created *next to* the icon+label
instead of *around* them, so it has no accessible content and nothing
inside it is actually clickable, even though it renders normally; (2) once
that's fixed by moving them inside the new wrapper, the *old* parent's
`display:flex` rule no longer applies to them (flex only governs direct
children) and they silently stack vertically instead of sitting inline.

**Prompt block:**

```
"<Ícone> + <label>" deve ficar DENTRO da tag <a>/<button> como conteúdo
filho direto — não meramente ao lado dela. Depois de mover os dois pra
dentro do novo wrapper, reaplique display:flex; align-items:center; gap
no PRÓPRIO wrapper (a regra flex do pai antigo não passa a valer para o
novo elemento automaticamente).
```

**Verify after publish:** `anchorEl.textContent.trim()` must be non-empty
(proves content is inside, not adjacent) — a find-by-role check alone
passes even when the content is a sibling.

---

## Recipe: a RadioButtonGroup (or similar composite) that must lay out horizontally

**When to use:** any prototype where radio/checkbox options sit in a row,
not stacked.

**The trap this avoids:** `RadioButtonGroup` renders its options inside
its own internal unstyled wrapper `<div>` — one extra DOM level between
the class you can target and the actual option elements. A `display:flex`
rule on the group's own class has nothing to distribute if the group has
exactly one direct child (that wrapper).

**Prompt block:**

```
Para exibir as opções de "<RadioGroup>" lado a lado: aplicar
display:flex num seletor filho direto UM NÍVEL ABAIXO da classe do
próprio grupo (ex.: .my-radio-group > div), não na classe do grupo
diretamente — o RadioButtonGroup do OutSystems tem um wrapper interno
próprio entre a classe visível e as opções.
```

---

## Recipe: appearance reset on native form controls (radio/checkbox)

**When to use:** any theme-wide `appearance: none` reset touching
`input[type=radio]`/`checkbox`.

**The trap this avoids:** `appearance: none` strips both the visual AND
the ~13px intrinsic size at once. Restoring only the visual (without an
explicit numeric size) resolves to `width:0; height:0` — present in the
DOM, functionally clickable via `.click()`, but invisible.

**Prompt block:**

```
Ao restaurar a aparência nativa de um radio/checkbox depois de um reset
appearance:none no tema: aplicar appearance:auto (ou revert) E um
width/height numérico explícito (ex.: 16px) na MESMA regra — nunca só
um dos dois.
```

**Verify after publish:** `getComputedStyle(el).width`/`height` must be
non-zero — a successful `.click()` toggling `checked` does not prove the
control is visible.

---

## Recipe: per-row selectable control in a repeated list (radio group, checkbox, dropdown per row)

**When to use:** any checklist/survey/audit screen rendering N rows, each
with its own independent selection control.

**The trap this avoids:** the single most severe defect class hit in this
project. A shared screen-level variable feeding every row's control makes
every row silently mirror whichever row was clicked last — invisible in
any screenshot or single-row test, since one selected row looks correct
in isolation.

**Prompt block:**

```
Cada linha de "<lista>" tem seleção independente — vincular o controle
a um atributo calculado POR LINHA no próprio aggregate/records da lista
(List.Current.<Atributo>), nunca a uma variável de tela única
compartilhada entre todas as linhas.
```

**Verify after publish (mandatory two-row test):** click row A, then row
B, then confirm row A's selection is unchanged — not just that row B
updated. A single-row click test passes even when every other row is
broken underneath.

---

## Recipe: a list-row input widget (RadioGroup/checkbox/dropdown) whose OnChange must persist that row's value

**When to use:** any per-row control (see previous recipe) whose
`OnChange` calls a server action to save that row's new value.

**The trap this avoids:** unlike a `Button`/`Link`'s `OnClick`, a list
input widget's `OnChange` handler does not reliably have `.List.Current`
pointing at the row that fired it once the invoked action's own logic
runs — reading `.Current` *inside* the action persists only the first
row correctly, silently no-ops or overwrites on every other row, with no
visible error.

**Prompt block:**

```
O OnChange de "<controle>" chama a ação de persistência passando o
identificador e o novo valor da linha como PARÂMETROS EXPLÍCITOS,
avaliados diretamente nas expressões de parâmetro do próprio OnChange
(ex.: GetItems.List.Current.Id, GetItems.List.Current.Valor) — a ação
invocada NÃO deve ler .List.Current internamente, pois não é garantido
apontar pra linha certa nesse ponto.
```

**Verify after publish:** click and reload at least two non-adjacent rows
— clicking only row 1 of a list passes even when every other row is
broken.

**Update from a later project (important amendment):** the "explicit
parameters" advice above is necessary but was found to be **insufficient**
specifically for a `RadioButtonGroup`/`RadioButton` bound via a two-way
`Variable` to a per-row field. The identifier parameter (`List.Current.Id`)
does resolve correctly per row — but the *new value* parameter, when it's
an expression reading that same two-way-bound field, evaluates to the
value from *before* the click for every row except the first: the
binding's write to the list row has not finished by the time `OnChange`'s
parameters are evaluated for later rows. Row 1 passing this recipe's
two-row verification is possible without it actually working, if row 1
already had a prior saved value equal to whatever you click during the
test. See `prototype-to-widgets.md` lesson #25 for the full mechanism and
the two accepted fixes (batch-save-on-explicit-action, preferred; or a
native-DOM-event JS bridge) — do **not** default to replacing the native
`RadioButton` with a styled `Button` to route around this, that trades
away accessibility/keyboard semantics and needs explicit product sign-off,
not a unilateral technical call. This specific staleness trap is confirmed
for `RadioButtonGroup` two-way bindings; it has not been confirmed (or
ruled out) for a plain checkbox or dropdown's own two-way binding — verify
the same way (second-row test) before assuming either is safe.

---

## Recipe: "save all rows at once" / bulk action over a list

**When to use:** any footer button that persists N items from a list in
one click (a "save draft" pattern).

**The trap this avoids:** OutSystems silently drops a server action
called from inside a client-side `ForEach` — no error, no log entry, the
button just does nothing. The natural-sounding phrasing "call the save
action for each row" is exactly the request that produces this.

**Prompt block:**

```
"<Botão>" salva todos os itens de uma vez: monte a lista completa de
valores CLIENT-SIDE (ex.: ListAppend, acumulando cada linha numa Local
Variable de Record List), depois chame UMA ÚNICA server action passando
essa lista inteira — a nova server action itera SERVER-SIDE (seu próprio
ForEach) sobre a lista recebida. Nunca implementar como uma chamada de
server action por linha dentro de um ForEach client-side — essas chamadas
são descartadas silenciosamente pelo OutSystems.
```

**Verify after publish:** check `app_traces`/server logs show exactly one
call to the new action, with N items in its payload — not N calls, not
zero calls with a toast that still appears.

---

## Recipe: a sticky element (footer bar, header) inside a scrollable area

**When to use:** any `position: sticky` element in the prototype (a
"always visible while scrolling" footer or section header).

**The trap this avoids:** `position: sticky` silently fails — falling
back to normal document-flow position — if **any** ancestor between the
sticky element and the page's scroll container has `overflow` other than
`visible` (`auto`, `hidden`, `scroll` all break it). A screenshot of the
intended final state can't reveal this; even a click test passes since
Playwright auto-scrolls to elements regardless of whether they're stuck.

**Prompt block:**

```
"<Elemento>" fica sticky (position: sticky; bottom/top: 0) ao rolar
"<lista/container>". A cadeia de containers entre o elemento sticky e o
container de scroll da página não pode ter overflow diferente de visible
em NENHUM nível — se algum container intermediário precisa de overflow
por outro motivo, mova o elemento sticky pra fora dele (ex.: como filho
direto do shell da página, position:fixed em vez de sticky).
```

**Verify after publish:** scroll past the element's natural document
position and check `getBoundingClientRect().top`/`bottom` — a correctly
stuck element stays near the viewport edge; a broken one reports a
position matching where it'd sit in normal flow.

---

## Recipe: loading an external Google Font in the app theme

**When to use:** any prototype using a non-system font family.

**The trap this avoids:** `@import url(...)` inside the theme's own CSS
compiles cleanly and makes `getComputedStyle` report the correct font name
— but the platform's CSS bundler drops the `@import` silently, so the
font file is never requested and the browser falls back invisibly to the
next name in the stack. `getComputedStyle` proves the *rule*, not that
the *file* loaded.

**Prompt block:**

```
Para carregar a fonte "<Nome>" do Google Fonts: NÃO usar @import no CSS
do tema (é descartado silenciosamente pelo bundler do OutSystems). Usar
um widget AdvancedHtml com Tag="link" (rel="stylesheet",
href="https://fonts.googleapis.com/...") colocado no conteúdo da tela (ou
num bloco de layout compartilhado) — o OutSystems eleva tags
link/meta/script do conteúdo da tela pro <head> real do documento.
```

**Verify after publish:** `[...document.fonts].some(f => f.family ===
"<Nome>" && f.status === "loaded")` — a `getComputedStyle` font-family
check alone is not sufficient, it only proves the CSS rule was written.

---

## Recipe: server action that receives a list — guard against empty list

**When to use:** any server action that receives a `List` input and creates
records for each item (bulk save, publish version, etc.).

**The trap this avoids:** Playwright's `locator.fill()` dispatches DOM
`input`/`change` events but does NOT mutate OutSystems' internal reactive
list state (e.g., `GetAggregate.List.Current.Entity.Attribute`). If the
client action passes `GetAggregate.List` directly to the server action, and
the `fill()` triggered an aggregate refresh before `SalvarEdicao` ran,
the list is mid-fetch (empty) when the server action is called. The server
action creates 0 records, the toast still appears, and all subsequent flows
that depend on those records silently break (e.g., `OpenAuditoria` finds 0
ItemFicha → creates 0 Respostas → item cards never appear in the audit screen).
This was discovered in W15: `PublishFichaVersao` accepted an empty
`ItensFicha` list from Playwright tests, creating FichaVersao records with
0 ItemFicha, breaking W5/W7/W8/W9/W10/W11 thereafter.

**The two-part fix (both are mandatory):**

**Part A — Server-side guard (prevents corruption):**
```
No início de "<ServerAction>", adicionar guarda obrigatória:
- Se ListLength(<ListInput>) = 0 → atribuir ErrorMessage =
  "A lista de itens não pode estar vazia." e terminar (End node)
  SEM criar nenhum registro. A guarda deve ser o PRIMEIRO nó de lógica,
  antes de qualquer CreateOrUpdate.
```

**Part B — E2E test pattern (prevents false-pass):**
```
Após qualquer locator.fill() em inputs dentro de uma lista reativa do
OutSystems, aguardar a tabela ter o número esperado de linhas ANTES de
clicar o botão de salvar — garante que o aggregate terminou de refreshar:
  await expect(page.locator('tbody tr')).toHaveCount(N, { timeout: 10000 });
  await saveButton.click();
Sem essa espera, Playwright clica Salvar enquanto o aggregate está
a meio do refresh (lista vazia), e o server action cria 0 registros.
```

**Verify after publish:**
- Call the server action explicitly with an empty list via `exec_in_app` or
  a browser DevTools console call — it must return `ErrorMessage` non-empty
  and create 0 records.
- In the E2E test: after `fill()` + `toHaveCount(N)` + save, verify the
  server log shows exactly N items in the payload (not 0).

---

## Recipe: restoring seed data after test pollution (FichaVersao)

**When to use:** whenever E2E tests created corrupt records (e.g., versions
with 0 items) that break other tests, and you need to restore the app to a
known-good state without reseeding the entire DB.

**The trap this avoids:** a "reset" server action that only deactivates bad
versions but doesn't activate a good one leaves the entity with no active
version — same breakage. And a reset that finds "the earliest version" might
pick a bad one if the seed version was also overwritten.

**Prompt block:**
```
Criar server action "<ResetEntityToSeed>" (sem inputs; Output: ErrorMessage
Text) com a seguinte lógica:
1. Buscar todos os registros de "<VersaoEntity>" relacionados a "<SeedId>"
   (ex.: FichaId = 1), ordenados por NumeroVersao ASC.
2. Encontrar o PRIMEIRO (menor NumeroVersao) que tenha pelo menos 1 registro
   filho associado (aggregate com JOIN ou Count > 0).
3. Marcar esse registro como Ativa = True; fazer CreateOrUpdate.
4. Para TODOS os outros registros da mesma entidade pai, marcar Ativa = False
   e fazer CreateOrUpdate em cada um.
5. Se nenhum registro tiver filhos, OutputErrorMessage =
   "Nenhuma versão válida encontrada." sem alterar nada.
A action deve ser exposta via Expose REST (ou mantida como server action
pública) para que possa ser chamada via exec_in_app nos testes.
```

**Verify:** after calling the reset action, `GetVersaoAtiva` for SeedId must
return exactly 1 record with `Ativa = True` and `Count(filhos) > 0`.

---

## Recipe: entity with two redundant "active/status" fields — keep every writer in sync

**When to use:** any entity that represents versioning/activation state with
BOTH a Boolean flag (e.g., `Ativa`) AND a static-entity `Status` reference
(e.g., `StatusFichaVersao`: Rascunho/Inativa/Ativa) — common when a later
wave adds a boolean shortcut alongside a status field an earlier wave
already established, or vice-versa.

**The trap this avoids:** a NEW server action (built in a later wave) reads
the spec literally and sets only the field the spec's prose emphasizes
(e.g., "Ativa = True"), while an EXISTING server action from an earlier
wave (e.g., `OpenAuditoria`) filters by the OTHER field (`Status =
Entities.StatusFichaVersao.Ativa`). Both actions publish cleanly with 0
validation errors — there is no compile-time link between the two fields,
so nothing catches the mismatch. The new action's own screen/tests can
pass completely (they only read the boolean), while every OTHER flow that
depends on the entity's active record silently breaks — with a real error
message it own screen never surfaces on. This was discovered in W15:
`PublishFichaVersao` set `Ativa = True` but left `Status` null/stale;
`OpenAuditoria` (built in an earlier wave) filtered by `Status`, so every
version created by the edit flow was invisible to it — blocking every
downstream wave that opens an auditoria (W7 through W18) with no failure
visible in W15's own tests.

**Prompt block (BEFORE writing an action that activates/deactivates a
versioned entity):**
```
Antes de implementar "<ServerAction>", verificar TODOS os campos que
"<Entidade>" usa para indicar estado ativo/versão corrente — não assumir
que existe um único campo. Se houver mais de um (ex.: um Boolean E um
Status de entidade estática), a ação deve escrever AMBOS sempre que
ativar ou desativar um registro, no mesmo Assign, nunca só um. Além
disso, localizar toda outra server action existente no módulo que já lê
esse estado (grep por "Ativa" e por "Status" nas actions do módulo) e
confirmar qual campo ela usa — replicar exatamente esse campo, não o que
a spec da wave atual menciona primeiro.
```

**Verify after publish:** don't just test the NEW screen/flow in
isolation. Run (or manually exercise) every OLDER flow that reads the
same entity's active record — e.g., after publishing a "create new
version" feature, actually open a downstream flow that consumes the
active version, not just re-check the new screen's own happy path. A
green result on the new wave's own tests is not evidence the entity's
consumers still work.

---

## Recipe: E2E tests must never hardcode an identifier from mutable seed data

**When to use:** any wave whose spec explicitly allows an action to
permanently edit or inactivate rows of a "seed" entity that other,
earlier waves' tests already assert against (weights, titles, active
flags, item counts).

**The trap this avoids:** a test written against pristine seed data
hardcodes an identifier — e.g. `itemRow(page, 'registro_completo')` — or
an absolute count — e.g. `toHaveCount(10)`. The very next wave adds a
one-way "inactivate" or "edit" action (by design, with no rollback/
reactivation in scope) and its OWN tests exercise that action on
whatever "first row" happens to be visible. Run the full suite enough
times and the specific hardcoded identifier used by an EARLIER wave's
test eventually gets consumed/renamed/hidden by a LATER wave's test —
breaking a spec that hasn't changed in weeks, with no code regression
at all. This happened across W15/W16: `w15.spec.ts` and `w5.spec.ts`
hardcoded `'registro_completo'` and `toHaveCount(10)`; several full-
suite reruns of W16 (which inactivates "the first visible item" each
run) eventually inactivated that exact item, breaking both specs with
zero product-code changes.

**Prompt block (for the TEST file, not the Mentor prompt):**
```
Nunca hardcodar um código/identificador específico de uma entidade seed
que outra wave pode editar ou inativar permanentemente. No início do
teste, ler dinamicamente o alvo (ex.: `page.locator('tbody tr').first()
.locator('td').nth(N)`) em vez de assumir que um código conhecido
('registro_completo', etc.) ainda existe ou ainda está na mesma posição.
Da mesma forma, nunca assumir uma contagem absoluta de linhas
(`toHaveCount(10)`) se alguma wave no plano pode reduzir essa contagem
permanentemente — comparar contra uma contagem capturada NO INÍCIO do
próprio teste, não um literal.
```

**Verify:** run the full suite (not just the new wave's specs) at least
twice in a row without any app changes in between — a suite that only
passes once and fails on rerun is hiding exactly this trap.

---

## Recipe: OutSystems entity attribute name may differ from its UI label

**When to use:** reconstructing or seeding entity records directly via a
server action call (e.g., through a test harness / `exec_in_app`),
without going through the built screen.

**The trap this avoids:** a table column labeled "Peso" in the UI does
not guarantee the underlying entity attribute is named `Peso` — it may
be `PesoMaximo`, `PesoValor`, etc., set as the widget's `Label` property
independently of the bound attribute name. Passing a JSON key that
matches the UI label but not the real attribute name is silently
accepted by a JSON→Record mapping (unknown keys are ignored) — the
record is created successfully with that field left at its default
(often `0`/null), with no error anywhere. This was hit while manually
reconstructing depleted `ItemFicha` test data: passing `"Peso": 2`
created records with `PesoMaximo` silently left at 0, because the real
attribute is `PesoMaximo` — the UI column is just labeled "Peso".

**Prompt block / procedure:**
```
Antes de montar um payload JSON pra uma server action que cria/edita
registros de "<Entidade>" fora da tela normal (via harness/exec_in_app),
confirmar os nomes REAIS dos atributos via context_entities — nunca
assumir que o texto do cabeçalho de coluna na UI é o nome do atributo.
Depois de criar os registros, ler de volta pelo menos um campo cujo
nome era incerto e confirmar visualmente na tela que o valor batyeu —
não confiar apenas no `status: "ok"` da chamada.
```

**Verify:** after any harness-driven record creation, reload the actual
screen and visually/DOM-check every field that was populated from a
guessed attribute name — a `0`/empty value where a specific number was
expected is the signature of this trap, and the call itself reports
success either way.

---

## Procedure: fixing CSS on any element that has been patched before — dump every matching rule FIRST

**When to use:** ALWAYS, before writing any CSS fix prompt for a
container/element that a previous wave already touched (any overlay,
modal, card, or component named in a prior `w*-*fix.md` log or the
Mentor Fidelity Report). Also use it any time a CSS fix is applied and
the live measurement afterward shows NO CHANGE — that is the signature
of a stronger rule elsewhere still winning, not of "the fix needs to be
stronger."

**The trap this avoids — why "0 Mentor errors" and "the rule is in the
CSS" are not proof of anything:** Mentor edits OML blind — it has no
screenshot loop, no way to see the rendered page, and no way to know
that an earlier wave left a workaround rule (often with `!important`)
still alive in the same stylesheet. Each individual fix prompt is
logically correct in isolation, but if a stronger, older rule already
targets the same element, the new rule silently loses and the DOM
measurement comes back unchanged — with the Mentor turn itself still
reporting `0 errors`, "change applied", and a plausible-sounding
summary. This is not rare: it happened twice in the same modal in one
session (Aug 2026) — a `grid-column` rule that was a no-op because the
container was `flex` not `grid`, and then a `width: 100%` rule that
was silently beaten by a **leftover `.form-modal-overlay > * { width:
auto !important }` rule from an entirely earlier wave's fix** (the W12
modal saga) that nobody had removed once the "real" fix (semantic
classes) landed. Three Mentor turns and three publishes were spent on
one layout bug that a five-minute rule dump would have caught on turn
one.

**The procedure (run this BEFORE writing the fix prompt, and AGAIN if
a fix's measured result doesn't match what was requested):**

```javascript
// Run in the browser console / via javascript_exec against the LIVE element,
// not the prototype. Replace the id with the actual target.
const el = document.getElementById('<TargetElementId>');
let matches = [];
for (const sheet of document.styleSheets) {
  let rules;
  try { rules = sheet.cssRules; } catch (e) { continue; } // cross-origin sheets throw
  for (const rule of rules) {
    if (rule.selectorText && el.matches(rule.selectorText)) {
      matches.push({ selector: rule.selectorText, cssText: rule.style.cssText, important: rule.style.cssText.includes('!important') });
    }
  }
}
console.table(matches);
```

Read every matched rule's selector, source order, and whether it uses
`!important` — not just the one rule you intend to add or change.
Specifically look for:
- Any rule targeting a generic ancestor combinator (`.overlay > *`,
  `.card > * > *`) rather than a semantic class — these are almost
  always leftover workarounds from an earlier fix, not intentional
  design.
- Any `!important` declaration on the property you're about to set —
  a plain (non-`!important`) new rule can NEVER beat it regardless of
  selector specificity or source order.
- Duplicate/near-duplicate selectors for the same property (a sign of
  a fix stacked on top of an older, un-removed fix).

**Prompt block (include the dump's findings directly in the Mentor
prompt, don't just describe the symptom):**
```
Antes de aplicar qualquer CSS, foram identificadas TODAS as regras que
já casam com "<seletor/elemento alvo>" (via dump de document.styleSheets
— colar a lista aqui). A regra "<seletor legado>" usa !important e
sempre vencerá uma regra nova sem !important, independente de
especificidade ou ordem. Fix necessário: (a) remover a(s) regra(s)
legada(s) listada(s) acima se estiverem obsoletas (não mais referenciadas
por nenhuma classe semântica atual), ou (b) se ainda forem necessárias,
adicionar !important explicitamente na regra nova. Não adicionar uma
terceira regra empilhada sobre as duas existentes.
```

**Verify after publish:** re-run the same dump — the count of rules
matching the target element for the property in question should DROP
(dead rules removed), not grow, and `getComputedStyle` must show the
intended value with no remaining `!important` rule of higher priority
in the list.

---

## Procedure: retire the workaround when the real fix lands, same wave

**When to use:** any time a CSS/OML fix is a stopgap (an `all: revert`,
a broad `> *` selector, an inline `!important` override) applied under
time pressure to get a specific case working — and a follow-up turn (in
the same wave or session) then implements the "real", targeted fix
(semantic classes, scoped selectors).

**The trap this avoids:** the stopgap is never explicitly asked to be
removed, because the visible symptom (the broken layout) is gone once
the real fix works — nobody notices the stopgap is still loaded, since
it doesn't cause any CURRENT visual problem. It becomes truly invisible
tech debt: `0` validation errors forever, no visual regression until
some LATER, unrelated wave touches CSS on the same component again —
at which point the old stopgap silently outranks the new fix (see the
procedure above) and burns a full multi-turn investigation to
rediscover a decision that was already made and then abandoned weeks
earlier.

**Prompt block (append to the Mentor prompt of the turn that implements
the "real" fix, whenever a known stopgap already exists on the same
element):**
```
Esta correção substitui um workaround temporário anterior ("<descrever
a regra/técnica antiga>", aplicado na wave <X>). Remover EXPLICITAMENTE
o workaround antigo como parte deste mesmo turno — não deixar as duas
versões coexistindo no CSS. Se o workaround antigo tiver múltiplos
blocos/seletores relacionados, remover todos, não só o que causa o
conflito mais óbvio.
```

**Verify:** the rule-dump procedure above, run once right after this
publish — it should show a NET DECREASE in rules matching the element,
not just an addition.

---

## Recipe: passing an aggregate's list into an action that expects the plain entity list

**When to use:** any `List mapTo <Entity>` conversion — typically wiring an
aggregate's record list (which may carry extra join columns) into a server
action parameter typed as a plain entity list (e.g. saving/cloning a list of
child records).

**The trap this avoids:** an empty `mapTo { }` is not a passthrough — it sets
**every field** of the new records to its type's default (empty text, `0`,
`false`), not just the fields the mapping happened to omit. This produced
silently corrupted data for weeks in this project: a "clone items into a new
version" flow wrote every text field of `ItemFicha` as `""` except the couple
of fields a different part of the UI happened to also display (which gave
false confidence the mapping worked) — with 0 validation errors, because
nothing about an empty string is invalid. The real damage (a `RadioButtonGroup`
rendering zero options everywhere) surfaced on a completely different screen,
much later.

**Prompt block:**

```
No `mapTo` que converte "<lista de origem>" para o tipo de entidade
"<Entidade>", listar EXPLICITAMENTE todos os campos de "<Entidade>" no
mapeamento — inclusive os que a lógica atual "não parece tocar". Um `mapTo`
com mapeamento vazio ou parcial não gera erro de validação nenhum; ele
simplesmente grava valor padrão (texto vazio/0/false) em todo campo não
mapeado, silenciosamente.
```

**Verify after publish:** read back a freshly created/cloned record's fields
that the mapping was supposed to carry over — not just the fields the
current screen happens to display — and compare against the source record.
An unexpected default value on a field that had real data in the source is
the signature of an incomplete `mapTo`.

---

## Recipe: an aggregate's filter reads another aggregate's `.Current` — both are `AtStart`

**When to use:** any aggregate `B` whose filter references
`A.List.Current.<field>`, where both `A` and `B` are set to fetch `AtStart`
(the common default for "load this screen's data on open").

**The trap this avoids:** the platform does NOT guarantee execution order
between two `AtStart` aggregates just because one's filter depends on the
other's `.Current` — an order that "just works" across many revisions is
incidental, not protected. If either aggregate's OML node is later deleted
and recreated (even as a side effect of an unrelated fix elsewhere on the
same screen), the platform can lose track of the implicit dependency, and
`B` may start firing before `A` has returned data — evaluating its filter
against `A`'s default `.Current` (e.g. id `0`) and silently returning zero
rows. The network call still reports `200 OK`; there is no error anywhere.

**Prompt block:**

```
"<AggregateB>" filtra por "<AggregateA>.List.Current.<campo>" — não confiar
em ordem de execução implícita entre dois aggregates AtStart. Configurar
"<AggregateB>" como Fetch: OnDemand e disparar seu refresh explicitamente a
partir do OnAfterFetch de "<AggregateA>" — a sequência deve ser garantida
por wiring explícito, não pela ordem incidental dos nós no flow.
```

**Verify after any edit touching either aggregate** (even an edit that seems
to target a different, unrelated node on the same screen): reload the
screen fresh and confirm the dependent aggregate still returns its expected
row count — a `200 OK` response is not proof of correct data.

---

## Recipe: never use a raw OutSystems-generated widget id as an E2E selector

**When to use:** any E2E locator that needs to target a specific element
that doesn't have a stable `data-test` attribute, role, or label.

**The trap this avoids:** an id like `#FilenameDisplay` or `#ChipNameP`
(auto-generated by the OutSystems compiler for a widget) is not stable
across publishes — it changed mid-project (`#FilenameDisplay` →
`#ChipNameP`) after publishes that never touched the screen the widget
lives on (a shared theme/master-page/component edit elsewhere was enough
to regenerate it). A test written against the id passes for a while, then
fails with "element not found" on an unrelated, correctly-working publish
— the page snapshot shows the expected text rendering fine, just under a
different id, making the failure look like a product regression when it
is purely a test-selector fragility.

**Prompt block / procedure:**

```
Nunca usar um id gerado pela plataforma (ex.: #FilenameDisplay,
#ChipNameP) como seletor de teste E2E — não é estável entre publishes,
mesmo os que não tocam a tela em questão. Preferir, nesta ordem: (1) um
atributo `data-test` explícito no widget (adicionar um se não existir —
custo mínimo, sem efeito visual); (2) uma classe CSS aplicada
deliberadamente no código-fonte (não gerada automaticamente); (3) role +
texto acessível. Só usar um id literal como último recurso, e documentar
no comentário do seletor que ele é uma aposta frágil sujeita a quebrar.
```

**Verify:** if a previously-passing test starts failing with "element not
found" right after an unrelated publish, and the failure's own page
snapshot shows the expected content rendering correctly, suspect a
regenerated id before suspecting a product regression — inspect the live
DOM for the element's *current* id/class rather than trusting the
selector was ever guaranteed to stay put.

---

## Recipe: any CSS fix touching the platform shell's sidebar/header/nav containers

**When to use:** before publishing any fix that edits `.aside-navigation`,
`.header`, `.app-menu-content`, `.main`, or any other container that is
part of the OutSystems UI default responsive shell (not just before a fix
that explicitly targets "the sidebar" — a padding/spacing fix on the
sidebar container qualifies too).

**The trap this avoids:** the platform shell ships a working responsive
pattern (fixed sidebar at desktop widths, off-canvas drawer + hamburger
toggle at narrower widths) implemented across several coupled containers.
A CSS change scoped to one of them, verified only at the width it was
written for, can silently break the *other* piece of the same system —
the off-canvas drawer rendering full-viewport at every width including
desktop, or the hamburger toggle's hosting `<header>` staying `display:
none` at every width — with zero validation errors and no visible sign at
the original test width. See `prototype-to-widgets.md` #33.

**Prompt block (append to any prompt editing these containers):**

```
Depois de aplicar esse fix, teste em DUAS larguras antes de publicar como
concluído: desktop (>= 1280px) e tablet/mobile (~768px ou menos).
Confirme explicitamente que:
1. Em desktop: a sidebar renderiza normalmente, expandida e fixa; o menu
   off-canvas (drawer) e seu botão de hambúrguer permanecem ocultos.
2. Em tablet/mobile: a sidebar fixa desaparece; o botão de hambúrguer
   aparece e é clicável; clicar nele abre o drawer com todos os itens de
   menu; fechar o drawer restaura a tela normal.
Não declare o fix concluído até confirmar os dois casos.
```

**Post-publish verification (browser console, run at both widths):**

```js
// desktop: expect display:flex-or-block on the sidebar, drawer NOT covering the viewport
const drawer = document.querySelector('.app-menu-content');
const header = document.querySelector('header.header, .header');
JSON.stringify({
  drawerRect: drawer && drawer.getBoundingClientRect(),
  drawerDisplay: drawer && getComputedStyle(drawer).display,
  headerDisplay: header && getComputedStyle(header).display,
  innerWidth: window.innerWidth
});
```
A drawer `rect` covering the full viewport at a desktop width, or a
`headerDisplay` of `"none"` at a narrow width, is the fix regressing the
shell's other half — not evidence the original fix needs to be stronger.

---

## Recipe: an edit-toggle (Editar/Salvar/Cancelar) that must REPLACE the view, not append the form beside it

**When to use:** any time a card/row has both a read-only view and an edit
form triggered by the same "Editar" action.

**The trap this avoids:** the edit action inserts the form as additional
content instead of swapping it in — every field shown in both states
(a header value, a badge) renders twice/three-times at once, and the
underlying view stays fully visible and interactive while the form is
open. See `prototype-to-widgets.md` #35.

**Prompt block:**

```
Ao clicar em "Editar" neste card/linha, o conteúdo de visualização
(cabeçalho, badges, textos estáticos) deve ser INTEIRAMENTE SUBSTITUÍDO
pelo formulário de edição — não deve haver nenhum elemento de
visualização ainda visível ao mesmo tempo que o formulário. Ao Salvar
ou Cancelar, o formulário é substituído de volta pela visualização
atualizada (ou original, no caso de Cancelar).
```

**Post-publish verification (browser console, right after clicking "Editar"):**

```js
const card = document.querySelector('[data-test="..."]'); // the card/row
JSON.stringify({
  formFieldCount: card.querySelectorAll('input, select, textarea').length,
  hasLeftoverViewText: !!card.querySelector('.item-code, .badge, .pill') // adjust selectors to the view-mode classes
});
```
If `hasLeftoverViewText` is true while form fields are also present, the
handler is appending, not replacing.

---

## Recipe: verifying a `data-test` on a repeated list actually landed on each item, not the wrapping list

**When to use:** any time a `data-test` is added to identify individual
items in a rendered list/table (rows, cards, tiles) — always, not just
when something seems wrong.

**The trap this avoids:** the attribute ends up on the list's own
container element instead of each repeated item inside it. A query for
it still finds "an element" (so a shallow check passes), but resolves to
exactly 1 match regardless of how many items are rendered, with every
item's text concatenated together — which can itself accidentally
satisfy a loose text filter and hide the bug further. See
`prototype-to-widgets.md` #40.

**Prompt block:**

```
O atributo data-test="<nome>" deve estar em CADA item individual da
lista/tabela (um por linha/card), não no container que os envolve.
Depois de aplicar, confirme que o número de elementos com esse
data-test é igual ao número de itens renderizados, não 1.
```

**Post-publish verification (browser console):**

```js
const items = document.querySelectorAll('[data-test="<nome>"]');
JSON.stringify({ count: items.length, firstItemText: items[0] && items[0].textContent });
```
`count` should equal the expected number of rows/cards. If it's 1 and
`firstItemText` looks like every item's text run together, the
attribute is one DOM level too high.

**The same trap can also go the other way:** some OutSystems table
widgets (Table Records) refuse a `data-test` on the `<tr>` itself and
land it on one or more `<td>` cells inside each row instead — a real
platform limit, not a wording problem with the prompt. Counting the
attribute directly then OVER-reports (a multiple of the row count, one
per matching cell, not one per row) instead of collapsing to 1. A
Playwright locator built as `page.getByTestId(name)` and treated as "one
per row" silently miscounts in both directions depending on which trap
applies — the fix for the over-count case is to never count the testid
directly for row-level assertions: filter the actual `<tr>` elements
that CONTAIN it instead — `page.locator('tr').filter({ has:
page.getByTestId(name) })` — which resolves to real rows regardless of
which DOM level the platform actually attached the attribute to.

---

## Recipe: idempotent seed action that must insert one specific missing record among several already-existing ones

**When to use:** any "load demo data" seed action that gets extended in a
later wave to add one more record to a set it already seeded earlier
(e.g. an extra status value, an extra example row).

**The trap this avoids:** an idempotency guard written as "if the FIRST
record already exists, do nothing" (checking only one representative row,
then inserting the whole batch) works correctly the first time the action
ever runs, but permanently blocks any LATER addition to that same batch —
once the first record exists, the guard's early-return skips the entire
action body, including a new insert added afterward for a record that
doesn't exist yet. Re-running the seed after the extension looks
successful (no error, "idempotent" claim still technically true for the
original 5 records) but silently never reaches the 6th.

**Prompt block:**

```
"<SeedAction>" precisa continuar idempotente ao adicionar o registro
"<NovoRegistro>" a um lote que já existia. NÃO usar um guard de nível
lote ("se o primeiro registro já existe, termina tudo") — isso bloqueia
qualquer registro adicionado depois que os originais já foram semeados.
Cada registro do lote (incluindo os que já existiam antes desta wave)
deve ser checado e inserido INDIVIDUALMENTE por sua chave natural (ex.:
Identificador) — sem nenhum "return antecipado" de nível tabela que pule
os que ainda não foram checados.
```

**Verify after publish:** run the seed action a second time on a database
where the original records already exist — the new record must appear.
A seed that only "worked" the very first time it ever ran, before any
records existed, hasn't proven this — always test the extension case.

---

## Recipe: a per-row visual style condition is correct but the row's click/navigation isn't gated by the same condition

**When to use:** any list where only some rows should be interactive
(clickable, navigable) based on a status/condition — not just styled
differently.

**The trap this avoids:** the CSS class or style expression that decides
whether a row *looks* clickable (cursor, hover, background) can be
perfectly correct — conditioned on the right field, verified by reading
the expression back — while the actual click handler or row-click/
navigation binding is wired unconditionally to every row, independent of
that same expression. These are two separate bindings in the widget tree
(a style/class property and an on-click/navigate action), and fixing one
does not touch the other — a prompt asking only "make ineligible rows not
look clickable" can get exactly that: correct styling, identical
click-through behavior on every row.

**Prompt block:**

```
Em "<Lista>", a classe/estilo que indica linha clicável já está
condicionada corretamente a "<condição>" — mas isso é uma propriedade
visual separada do comportamento de clique/navegação em si. Localize
ONDE o clique/navegação da linha está de fato ligado (evento da linha
inteira, ou de cada célula individualmente) e envolva-o na MESMA
condição "<condição>" — não assuma que corrigir o estilo também corrige
o comportamento; são dois bindings diferentes no widget.
```

**Verify after publish:** don't just inspect the CSS class name applied
to each row — actually click a row that should NOT be interactive and
confirm no navigation/action fires (URL unchanged, no new panel opens).
A row correctly missing the "clickable" class can still have a working
click handler underneath it; only clicking proves the negative case.

**The same separation cuts the other way too:** a prompt asking a card
or bar to "become clickable, with a hover/cursor affordance" can come
back with ONLY the affordance done — `cursor: pointer` and a hover
outline applied correctly to every target element, confirmed by reading
computed CSS — while the actual click handler or navigation binding is
completely absent underneath every single one of them, not just
ungated. The visual half of "clickable" is the trivial, easily-verified
part; the navigation logic is the entire point of the request and can be
silently skipped while the prompt's guardrail about "add a hover
affordance" reads as satisfied. Verify by clicking (not just inspecting
`cursor` in computed styles) every element that's supposed to navigate,
not only the ones that shouldn't.

---

## Recipe: a dropdown/select populated from a joined entity shows a generic placeholder label instead of the related record's name

**When to use:** any dropdown, select, or list whose display label needs
a field from an entity OTHER than the one the query's primary source is
— e.g. a version picker showing the parent record's name, a foreign-key
picker showing the referenced entity's title.

**The trap this avoids:** a query/aggregate built against the entity
that actually needs to be selected (a version, a foreign key row) can
compile and run without ever joining the RELATED entity that holds the
human-readable name — the dropdown then falls back to showing the
record's own literal Id, a hardcoded static string, or a generic
placeholder like "Item #N" instead of the name a user would recognize.
This happened three separate times in one project (a Ficha picker, a
Protocolo picker, and a DevTools debug picker), each time because the
query fetched the versioned/child entity alone without joining back to
its parent for the label.

**Prompt block:**

```
O dropdown "<X>" precisa mostrar "<CampoDeExibição>" (da entidade
"<EntidadePai>"), não apenas o Id ou um rótulo genérico do registro que
a query já busca ("<EntidadeFilha>"). Junte "<EntidadeFilha>" com
"<EntidadePai>" na query/aggregate que popula esse dropdown e monte o
rótulo a partir do campo real (ex.: EntidadePai.Nome + " · v" +
EntidadeFilha.NumeroVersao), não a partir de um valor fixo ou do Id.
```

**Verify after publish:** read `[...select.options].map(o => o.text)` in
the browser — every label must be a real, distinguishable name, never a
literal "0", the entity's own type name repeated for every option, or a
generic "Item #N" placeholder that doesn't vary meaningfully by record.

---

## Recipe: a "success" message shown without confirming the write actually happened

**When to use:** any action (especially a DevTools/debug simulation
button, but also any regular save/update flow) that shows a static
success message after calling a create/update node.

**The trap this avoids:** a flow that calls an update/create node and
then unconditionally shows "Salvo com sucesso"/"Concluído" regardless of
whether that node found/changed anything degrades into the exact same
failure mode as no error handling at all — except it now actively lies,
which is worse for debugging than silence, because it stops anyone from
suspecting the write failed. This compounds badly with any bug that
makes a lookup/filter match zero rows (see the Identifier/Text gotcha in
`mentor-studio-prompt.md` §4b) — the update silently changes 0 records,
and the success message papers over it completely.

**Prompt block:**

```
Depois de "<AçãoDeEscrita>", não mostrar a mensagem de sucesso
incondicionalmente. Busque o registro afetado de novo e confirme que o
campo esperado ("<Campo>") realmente mudou para o valor pretendido antes
de exibir "<mensagem de sucesso>" — se não mudou, mostre um erro
específico em vez disso ("Registro não encontrado ou não alterado"),
nunca a mensagem de sucesso.
```

**Verify after publish:** trigger the action, then independently re-fetch
the affected record (a fresh page load, a direct API/network response
check) — the field must actually hold the new value. A success message
alone is not evidence; this recipe exists specifically because it was
observed lying twice in the same wave, once for each of two separate
bugs it was masking.

---

## Recipe: a computed average that legitimately equals zero renders as absent ("—")

**When to use:** any indicator that shows a placeholder ("—", "N/A",
empty) when there's "no data," computed from an average, sum, or other
aggregate over a filtered set of records.

**The trap this avoids:** the display condition decides "no data" by
checking whether the COMPUTED RESULT is truthy/positive (`If(Media > 0,
Media, "—")`) instead of whether there were any CONTRIBUTING RECORDS at
all (`If(Count > 0, Media, "—")`). A result that legitimately averages to
exactly `0` — e.g. every matching record happens to have a zero-day gap
between two dates, a 0% rate, a balance of 0 — is then indistinguishable
from "nothing matched the filter," and gets hidden behind the same
placeholder as genuine absence of data. The two states have opposite
meanings (a rate of 0% is a real, reportable fact; "no data yet" is a
different fact) and collapsing them produces a value that reads as
missing when it is actually the most interesting possible number.

**Prompt block:**

```
A condição de exibição de "<Indicador>" deve decidir "—" com base em
SE EXISTE PELO MENOS 1 registro contribuindo para o cálculo (a mesma
contagem que "<IndicadorRelacionadoQueJáContaCorretamente>" já usa),
nunca com base em se o RESULTADO da média/soma em si é maior que zero.
Um resultado igual a 0 é um valor real e deve ser exibido normalmente
quando há registros — "—" é só para quando não há nenhum registro.
```

**Verify after publish:** find or construct a case where every matching
record's value happens to be exactly 0 — confirm the indicator shows the
real "0" (formatted normally), not "—". Separately confirm the actual
zero-record case still shows "—".

---

## Recipe: a combined sort/group key decomposed back via arithmetic for display is fragile

**When to use:** any report/chart that groups records by a compound
period (year+month, year+week) using a single combined value for
grouping uniqueness (e.g. `Year(Date)*100 + Month(Date)` → `202511`).

**The trap this avoids:** grouping by a single combined integer is a
reasonable way to guarantee one bucket per period, but then trying to
recover the separate year and month back out of that combined value via
arithmetic (`combined - (combined/100)*100` for the month, `combined/100`
for the year) at DISPLAY time is a second, independent place the same
information has to round-trip correctly through integer division,
truncation, and type conversions — and it can silently fail (every row
falling through to the same "else" branch of a month-name lookup, for
example) while the grouping itself remains completely correct. This is
easy to misdiagnose as a query/grouping bug, because the counts per
group are right — only the LABEL is wrong — and the decomposition
expression can look correct on paper while producing a wrong result at
runtime, resisting several rounds of diagnosis because "the code is
right" isn't the same as "the code produces the right output."

**Prompt block:**

```
Para "<GráficoOuRelatório>", pare de derivar mês/ano de volta a partir
do valor combinado usado para agrupar. Calcule e carregue Ano e Mês
como 2 valores inteiros SEPARADOS desde a origem (Year(Data), Month(Data)),
nunca combinados num único inteiro e depois desmembrados por subtração/
divisão/multiplicação. Use esses 2 valores separados para montar o
texto do rótulo (ex.: nome do mês + "/" + ano) e, se for necessário um
valor único para garantir 1 grupo por período, mantenha-o só como chave
de agrupamento — nunca como fonte do texto exibido.
```

**Verify after publish:** with at least 2 different periods in the
seeded data, confirm the report shows 2 distinct, correctly-labeled
rows — not the same label repeated with different counts (a strong
signal the decomposition is producing a constant fallback value for
every row, not that rows are being duplicated).

---

## Recipe: an empty/absent filter parameter is treated as "match empty value" instead of "no filter"

**When to use:** any screen/aggregate whose filter condition is built as
`(Param = "" or Field = Param)` (or the URL-parameter equivalent) to mean
"no filter when Param is empty, otherwise filter by it."

**The trap this avoids:** one specific caller of that filter — often a
"show everything, no filter" entry point built alongside several other
callers that DO pass a real value — can end up passing an empty string
explicitly as the parameter instead of omitting it, or the "no filter"
branch of the OR condition can be written slightly differently from how
every other working filter on the same aggregate handles it. The
working cases (a real Status value, a real Classificação value) mask the
bug completely, because they never touch the "is this empty" branch at
all — only the specific "no filter" case reaches it, and it fails
silently: 0 rows, no error, dropdowns still showing the correct "Todos"/
"Todas" default.

**Prompt block:**

```
Confirme que o caminho "sem filtro" de "<Filtro>" realmente cai na
condição "(Param = "" or Field = Param)" e resulta em TODOS os
registros — não em zero. Teste explicitamente esse caso (não só os
casos com um valor real selecionado), comparando com abrir a tela sem
nenhum parâmetro de URL: os dois precisam mostrar exatamente a mesma
lista completa.
```

**Verify after publish:** open the screen via its "no filter" entry
point (a link/card meant to show everything) and via its bare URL with
no parameters at all — both must show the identical, complete list. If
the "no filter" entry point shows an empty list while the bare URL shows
everything, the empty-parameter case is being treated as an active
filter for an empty value.

---

## Recipe: fixing the login-success redirect for a role-gated Home screen doesn't fix every OTHER path back to it

**When to use:** any app where different roles land on different
screens after login, and one screen (often the one that used to be
public, or the first screen ever built) is still the module's own Home
screen.

**The trap this avoids:** when an app becomes role-gated, the screen
that used to be the shared entry point for everyone typically stays
configured as the module's Home screen (served whenever the bare app
URL is opened with no specific path). A fix aimed at "redirect each role
to the right screen after login" can correctly patch the login SUCCESS
action's own navigation — Auditor → Consultas, Administrador → Ficha —
and verifiably work for that one path, while every OTHER way of reaching
the bare module root (reloading the page, opening a saved bookmark,
typing the base URL, a link that points at the module root instead of a
specific screen) still hits the Home screen directly, which still isn't
role-aware. A role without access to that Home screen gets a working
login followed immediately by a lockout on the very next reload —
looking like the login itself is broken, when the actual defect is one
level up, in what the bare module root does for an already-authenticated
user.

**Prompt block:**

```
O redirecionamento por papel foi corrigido só na AÇÃO DE SUCESSO do
login — mas isso não cobre visitar a raiz do app já autenticado (recarregar
a página, abrir um favorito, digitar a URL base), que ainda cai direto na
Home do módulo, sem redirecionamento nenhum. Torne a própria Home do
módulo consciente do papel — reusando o MESMO mapeamento de papel→tela já
usado no sucesso do login, não uma segunda lógica separada — ou substitua
a Home por uma tela leve cujo único trabalho é redirecionar por papel
antes que a Home antiga (ou qualquer uma delas) rode sua própria checagem
de acesso.
```

**Verify after publish:** with an already-valid session (don't log in
again), navigate to the bare module root directly — not a specific
screen path. Every role must land on a screen it can actually open, not
just right after logging in, but on every later visit to that same bare
URL during the same session.

---

## Recipe: an E2E test forcing a state change must read the CURRENT value first, never alternate between 2 fixed options

**When to use:** any test that needs to click a different option than
whatever is currently selected, on a control whose state is shared
across test runs (no reset action exists, or the same seeded record is
reused by other waves' tests).

**The trap this avoids:** a test written as "click option A if option B
looks selected, else click option B" (alternating between exactly 2
hardcoded indices) works the first time, but the target's real current
state depends on every earlier test run that ever touched the same
shared record — including runs from other waves, or the same wave run
twice without a reset. When the current state happens to already be
whichever option the test was about to click, the click is a genuine
no-op (correct app behavior: clicking an already-selected value doesn't
re-trigger a write) and the test's own assumption that "this click
causes the state to change" is silently false — producing a confusing
failure that looks like the feature stopped tracking the change, when
the test's own fixture assumption was just wrong for this run.

**Prompt block (for the TEST file, not the Mentor prompt):**

```
Antes de clicar para forçar uma mudança, leia qual opção está
SELECIONADA AGORA (ex.: via classe CSS "selected-*" que o app já usa
para marcar a atual) e escolha sempre uma opção DIFERENTE dela — nunca
alternar entre 2 índices fixos, que podem coincidir com o estado já
salvo de uma execução anterior. Uma forma robusta: escolher o próximo
índice em sequência a partir do atual (`(atual + 1) % totalDeOpções`),
garantindo uma mudança real seja qual for o estado de partida.
```

**Verify:** run the test twice in a row without any reset between runs
— it must pass both times, proving the selection logic doesn't depend
on a specific starting state.

---

## Recipe: Playwright `baseURL` without a trailing slash breaks relative `page.goto()` sub-paths

**When to use:** any Playwright config whose `baseURL` points at an app
mounted under a sub-path (e.g. `https://host/ModuleName`, not just
`https://host`).

**The trap this avoids:** relative URL resolution treats a `baseURL`
without a trailing slash as a "file," not a "directory" — `page.goto('Login')`
against `baseURL: 'https://host/ModuleName'` resolves to
`https://host/Login`, silently dropping `/ModuleName` entirely, while
`page.goto('')` (empty string) still works fine because it resolves to
the `baseURL` verbatim with nothing appended. This makes the bug
inconsistent and confusing: some navigation patterns in the same suite
work, others land on a completely different, usually 404 or wrong-app,
page — and the symptom (a blank page, or a timeout waiting for an
element that was never going to be there) looks like an app bug or a
timing issue, not a URL-resolution one.

**Prompt block (for the test config, not the Mentor prompt):**

```
Normalizar baseURL para sempre terminar com "/" antes de usar em
`use.baseURL`, independente de como a variável de ambiente que o define
foi escrita:
  const rawBaseURL = process.env.MY_BASE_URL || 'http://localhost:8080';
  const baseURL = rawBaseURL.endsWith('/') ? rawBaseURL : rawBaseURL + '/';
Isso garante que qualquer `page.goto('AlgumCaminho')` relativo resolve
corretamente contra o sub-path do app, não contra a raiz do domínio.
```

**Verify:** with the fix in place, `page.goto('AnyScreenName')` should
print (via `page.url()` after navigation) a URL that still contains the
app's sub-path — not just the bare domain.

---

## Recipe: `browser.newContext()` inside a Playwright project with `storageState` configured inherits it by default

**When to use:** any test that needs a genuinely anonymous/unauthenticated
browser context, written inside a Playwright project whose `use.storageState`
points at a saved authenticated session.

**The trap this avoids:** `browser.newContext()` called with no arguments
does not produce a blank context — it inherits the project's own `use`
options, including `storageState`, because those options are the
project-level defaults for any context the `browser` fixture creates,
not just the default `page` fixture's own context. A test meant to prove
"this screen requires login" or "this behavior differs with no session"
can pass a fully authenticated context to itself and never notice,
because the resulting page renders successfully — just under the wrong
identity, contradicting the test's own name and assertions in a way that
isn't obvious from the passing/failing status alone.

**Prompt block (for the test file, not the Mentor prompt):**

```
Sempre que um teste precisar de uma sessão genuinamente anônima dentro
de um projeto que já define storageState, passar
`browser.newContext({ storageState: undefined })` explicitamente — nunca
assumir que `browser.newContext()` sem argumentos produz uma sessão em
branco quando o projeto já tem storageState configurado.
```

**Verify:** inside such a context, read something that only an
authenticated session would show (e.g. the logged-in user's name in a
sidebar widget) — it must be genuinely absent, not just untested.

---

## When this file isn't enough

These are the two patterns this project actually hit more than once.
For any other recurring pattern that costs a multi-turn fix, add a new
recipe here — a prompt block plus its post-publish verification snippet —
rather than only writing up what went wrong in `prototype-to-widgets.md`.
The lesson explains the trap; the recipe is what stops it from
reoccurring.
