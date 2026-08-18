# Agenda e confirmações visuais Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Substituir confirmações nativas por um diálogo do Atelier OS e deixar a agenda real mais clara, dinâmica e operacional.

**Architecture:** Um módulo pequeno expõe cópia contextual e uma Promise de confirmação via modal único no `index.html`. A agenda mantém os dados e eventos existentes, recebendo apenas uma composição visual nova em `styles.css` e o uso do diálogo no fluxo de exclusão.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Node test runner, Supabase já existente.

## Global Constraints

- Não adicionar dependências.
- Não alterar tabelas, políticas RLS ou regras de permissão.
- Manter a agenda sincronizada com os dados reais já carregados do Supabase.
- Confirmar pelo modal próprio, cancelar sem mutação e impedir duplo envio.
- Executar pelo menos 15 verificações end-to-end antes de concluir.

### Task 1: Contrato do diálogo de confirmação

**Files:**
- Create: `src/confirm-dialog.js`
- Create: `tests/confirm-dialog.test.mjs`

- [ ] Escrever teste para cópia contextual de exclusão e estado padrão:

```js
test('monta confirmação contextual sem usar texto nativo do navegador', () => {
  assert.deepEqual(getConfirmationDetails('booking'), {
    title: 'Apagar agendamento?',
    message: 'A reserva será removida da agenda.',
    confirmLabel: 'Apagar agendamento',
  })
})
```

- [ ] Rodar `node --test tests/confirm-dialog.test.mjs` e confirmar falha por módulo ausente.
- [ ] Implementar `getConfirmationDetails(kind)` e `requestConfirmation(kind)` com Promise, backdrop, foco inicial no cancelamento e resolução booleana.
- [ ] Rodar o teste novamente e confirmar PASS.

### Task 2: Modal global e migração das exclusões

**Files:**
- Modify: `index.html`
- Modify: `src/agenda-ui.js`
- Modify: `src/client-live-ui.js`
- Modify: `src/team.js`
- Modify: `app.js`
- Modify: `styles.css`

- [ ] Adicionar o markup único `#confirm-dialog` ao shell, com título, mensagem, cancelar e confirmar.
- [ ] Substituir `window.confirm` e `window.alert` das exclusões por `requestConfirmation` e mensagens inline/toast de erro.
- [ ] Conectar teclas Escape e Enter sem permitir exclusão duplicada.
- [ ] Adicionar estados visuais de backdrop, modal, foco, botão destrutivo e animação curta por `opacity`/`transform`.
- [ ] Rodar testes existentes e verificar que os módulos continuam importando sem erro.

### Task 3: Redesign visual da agenda

**Files:**
- Modify: `src/agenda-ui.js`
- Modify: `styles.css`

- [ ] Adicionar classes semânticas para cabeçalho de dia, contador, reserva, meta de reserva e estado vazio.
- [ ] Transformar cada reserva em cartão com horário em destaque, cliente como foco, veículo/serviço em segundo nível e responsável em metadado.
- [ ] Adicionar indicador de carga do dia e estados hover/focus/active sem alterar os dados renderizados.
- [ ] Ajustar grade para desktop em sete colunas, tablet em duas e celular em uma, mantendo navegação real da semana.
- [ ] Melhorar o formulário de reserva com agrupamento visual, campos arejados e feedback de salvamento.

### Task 4: Verificação final

**Files:**
- Testes: `tests/*.test.mjs`

- [ ] Rodar `npm.cmd test` e confirmar todos os testes verdes.
- [ ] Rodar `node --check app.js`, `node --check src/agenda-ui.js`, `node --check src/confirm-dialog.js` e `git diff --check`.
- [ ] Abrir o servidor local e validar pelo menos 15 cenários: modal abrir, cancelar, confirmar, Escape, Enter, exclusão de agendamento, agenda vazia, semana com reserva, navegação, formulário, loading, erro, responsividade, foco e ausência de `window.confirm`.
- [ ] Confirmar que nenhuma operação de exclusão altera o Supabase sem confirmação e que a agenda continua atualizando após criar/apagar.
- [ ] Commitar a implementação em commits separados por componente.
