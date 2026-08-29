# DELTA — o que mudou em relação ao upstream

Fork de `rodginez/outsystems-plan` v0.7.0 (commit `aae2e14`).

O upstream dirige o Mentor pelo MCP: dispara turno, faz poll, lê o modelo de
volta com `context_entities` / `context_actions` / `context_screens` e publica.
Aqui nada disso existe. O assistente é o chat do ODC Studio e quem cola é gente.
A skill deixa de orquestrar e passa a emitir.

O que o upstream aprendeu sobre Mentor e OutSystems UI ficou intacto. Por isso é
fork e não reescrita.

---

## O que foi mantido sem tocar

- `skill/references/prototype-to-widgets.md` inteiro. É o ativo mais caro do
  repositório: sete modos de falha reais na tradução HTML para OutSystems UI.
- Teto rígido de **uma tela por onda**, 3 a 4 server actions, todas as entidades
  do value path criadas até W2.
- Princípio prototype-first e o protótipo cumulativo único, republicado na mesma
  URL.
- Ciclo de seis passos, incluindo o passo **Compare** (publicado versus protótipo
  lado a lado, listar todas as diferenças antes de corrigir qualquer uma). Esse
  passo é o que transforma o protótipo em contrato em vez de decoração.
- Guardrails 1 a 7 verbatim.
- Nomes de action proibidos (`Create<X>`, `Get<X>`, `Update<X>`, `Delete<X>` são
  bloqueados silenciosamente pelo CRUD implícito do ODC).
- `Text` sem tamanho declarado vira `Text(50)` sem aviso.
- Lista de pitfalls de seletor do OutSystems UI (`Title` é `<span>`, `data-test`
  de `TableRecords` cai no `<td>`, `LayoutSideMenu` usa role `menuitem`, label do
  `Upload` não está ligado ao input).
- Nunca rodar teste automaticamente; publicar é decisão humana.

## 1. Canal: Emit + Paste no lugar de Fire + Poll

Nova seção `## The channel: Mentor Studio, not MCP` no `SKILL.md`, e o passo 3 do
ciclo virou **Emit**: a skill escreve `prompts/wN.md` e mostra o bloco; o operador
cola, publica e volta dizendo o que aconteceu.

Sumiram do log e do RUNBOOK: `runId`, `retries`, `change_applied`, intervalo de
poll, `app_key`, `tenant`, `app_create`, `env_app`, `app_revisions`. Nenhuma
linha de log pode sugerir que existem.

O failure playbook foi reescrito inteiro. Os sintomas do upstream eram de
protocolo (`change_applied: false`, run travado em `applyModelApiCode`, 404 em
`publish_status`). Os daqui são observáveis: fez menos, fez mais, fez diferente,
quebrou onda anterior.

## 2. Gate estático virou manual, e isso está assumido

Sem `context_*` não há contagem programática. O gate passou a ser leitura da
module tree no ODC Studio pelo operador. É mais fraco e o texto diz que é mais
fraco: pega "criou três telas em vez de uma", não pega tipo de atributo errado.
A compensação é explícita, apoiar mais no Compare e nos testes, que são os únicos
checks que sobraram feitos por máquina.

## 3. Context pack por onda

O upstream remanda "wave spec + SDD + design-system" a cada turno porque prompt
de MCP é barato. No Studio, com humano colando, não cabe.

Todo prompt abre com um context pack: só os módulos, entidades, telas e actions
que essa onda toca, mais uma lista `DO NOT TOUCH` de nomes sem descrição
(descrição em artefato que não deve ser tocado é convite para o Mentor melhorar).
Gerado na hora a partir da tabela de ondas e das specs já concluídas. Nunca
versionado: arquivo derivado que é guardado é arquivo que envelhece calado.

Limites: 200 linhas por prompt, 8 itens em CHANGES. Passou disso, o Mentor começa
a perder item do meio da lista e ninguém percebe até o Compare.

## 4. Sem canal de imagem, então vai o HTML

O upstream anexa screenshot do protótipo e gasta o guardrail 9 descrevendo em
palavras o box model que a imagem não carrega. Aqui não existe imagem, e isso
acabou virando vantagem: o prompt embute o **HTML e CSS podados daquela tela**.
É texto, é o contrato literal, e carrega max-width, empilhamento e flex com
exatidão em vez de aproximação.

Regras de poda em `skill/references/mentor-studio-prompt.md`: uma tela só, sem
switcher, sem JS, só o CSS que ainda casa com algo, linhas repetidas viram uma
mais um comentário, e todo `data-test` preservado (é o que mais se perde na
poda). Alvo 120 linhas, teto 200.

Os fatos de box model continuam sendo escritos em prosa ao lado do markup. Três
linhas de redundância, e o Mentor obedece restrição escrita melhor do que infere
intenção a partir de CSS.

**A verificar antes do primeiro projeto:** se o Mentor Studio aceitar anexo de
imagem, mantenha o HTML podado assim mesmo e some o screenshot.

## 5. Orçamento de reconcile e campo `fidelidade`

O upstream faz 4 → 5 → 4 até não sobrar diferença, o que é certo quando
reconciliar custa uma chamada de MCP. Aqui cada rodada custa copiar, colar, rodar
e publicar com humano no meio.

Duas rodadas por onda. Depois disso, as diferenças que sobraram são registradas
como aceitas e a onda fecha. Exceção: onda com `fidelidade: demo`, tela que está
no roteiro da demo, que tem rodadas ilimitadas porque aquela tela é o produto.
O resto é cenário.

Perseguir pixel em tela fora do caminho da demo é onde o ROI de POC morre.

## 6. Campo `canal` e W0 de tema

O upstream assume Mentor para tudo. Mentor Studio é bom alterando módulo que já
existe e ruim criando estrutura do zero, então a primeira onda não é dele.

Toda onda declara `canal: appgen | mentor-studio | manual`, com tabela de
decisão no `SKILL.md`. Só onda `mentor-studio` gera `prompts/wN.md`.

W0 fixa: app criado e tema montado sobre o OutSystems UI, via AppGen ou na mão,
antes de qualquer onda de feature. Sem isso a paleta do protótipo não tem onde
aterrissar e toda onda seguinte rediscute cor, e diretriz de design que chega no
prompt como "usa o azul da marca" produz hex literal, que o gate rejeita.

De W1 em diante, diretriz de design nomeia o bloco nativo (`Card`, `Tabs`,
`ListItem`, `Columns2`). Prompt que diz "um container tipo card" recebe `<div>`.

## 7. Fase de PoC: Step 0 e classificação

O upstream vai da spec direto para a entrevista de 6 perguntas. Numa fábrica de
POC a spec vem do cliente e costuma estar incompleta de um jeito que só aparece
na W4, quando é cara.

Novo `Step 0`: escrever `SPEC-REVIEW.md` (ambiguidades com a premissa que será
assumida, contradições citadas, o que falta e não dá para pular, o que está fora
de escopo) e obter aceite.

E classificar o projeto como PoC ou aplicação final, explicitamente. A
classificação muda decisão real: quantidade de módulos, se stub e seed sintético
são feature ou dívida, se o modelo de dados sai das telas ou vem antes delas, e
qual checklist de entrega vale.

`templates/POC-HANDOVER.md` substitui o pre-production checklist do upstream para
projetos PoC, e diz na cara que, se a POC for promovida, nada dele transfere.

## 8. Value path virou roteiro de demo

Mesma pergunta do upstream, resposta pedida em outro formato: a sequência exata
de cliques que vai ser executada na frente do cliente, com o que aparece em cada
passo.

Escrita assim, ela faz três trabalhos: ordena as ondas, decide quais telas são
`fidelidade: demo`, e é o `tests/demo.spec.ts`. Fica verbatim no RUNBOOK.

## 9. Playwright: autenticação e a suíte que não pode quebrar

- `auth.setup.ts` novo: loga uma vez e salva `storageState`. Reautenticar por
  teste contra a tela de login do ODC é lento, instável, e é a primeira coisa que
  derruba a suíte.
- `playwright.config.ts` ganhou os projects `setup` e `e2e` com dependência, e
  **o reporter HTML**. O upstream exige o reporter HTML no `SKILL.md` desde a
  v0.5.0 mas o template ainda vinha com `reporter: 'list'`. Corrigido aqui.
- `demo.spec.ts` separado das specs por onda. É a única suíte que precisa estar
  verde antes de mostrar a POC. Spec de onda pode carregar diff aceito.
- `.env.example` ganhou `APP_USER` e `APP_PASSWORD`.

## 10. Guardrail 10, novo

O upstream tem 9 guardrails. O décimo só faz sentido com humano no loop:

> Se algo aqui for impossível, ou contradisser o que já está no módulo, pare e
> diga, em vez de improvisar um contorno.

Com MCP, um Mentor que para é um turno perdido. Aqui é uma pergunta que o
operador responde em um minuto, enquanto uma improvisação silenciosa só é
descoberta uma rodada inteira de compare e reconcile depois.

---

## Arquivos

| Arquivo | Situação |
|---|---|
| `skill/SKILL.md` | adaptado (nova seção de canal, Step 0, canal/fidelidade, guardrails 8-10, log sem MCP) |
| `skill/references/prototype-to-widgets.md` | intacto |
| `skill/references/mentor-studio-prompt.md` | novo |
| `templates/RUNBOOK.md` | reescrito |
| `templates/spec-wave.md` | adaptado (canal, fidelidade, DO NOT TOUCH, stall) |
| `templates/wave-prompt.md` | novo |
| `templates/SPEC-REVIEW.md` | novo |
| `templates/POC-HANDOVER.md` | novo |
| `templates/playwright.config.ts` | adaptado (reporter HTML, projects, storageState) |
| `templates/tests/auth.setup.ts` | novo |
| `templates/.env.example` | adaptado |
| `README.md` | do fork; o original virou `README-upstream.md` |

## Rebase no upstream

O `prototype-to-widgets.md` é o arquivo que mais vai receber melhoria lá em cima
e é o que aqui está intacto, então `git checkout upstream/main -- skill/references/prototype-to-widgets.md`
resolve a maior parte dos merges. O `SKILL.md` diverge de propósito.

```bash
git remote add upstream https://github.com/rodginez/outsystems-plan.git
git fetch upstream
```

## O que ainda não foi validado

1. Mentor Studio aceita imagem? Muda o item 4.
2. 200 linhas é o teto certo de prompt? Chute calibrado, não medido.
3. Duas rodadas de reconcile é o número certo? Idem.
4. HTML podado funciona melhor que prosa descrevendo layout? É a aposta central
   do fork e a primeira coisa a testar numa onda real.
