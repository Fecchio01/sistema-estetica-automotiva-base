# Orçamentos para recepção e administradora

## Objetivo

Adicionar um módulo de orçamentos ao sistema base, permitindo que a recepção e a administradora preparem propostas antes de criar um atendimento. O módulo deve aproveitar os cadastros reais de clientes, veículos e serviços e respeitar o isolamento por empresa no Supabase.

## Acesso

- Administradora: pode criar, editar, enviar, aprovar, recusar e excluir orçamentos.
- Recepção: pode criar, editar, enviar, aprovar, recusar e excluir orçamentos.
- Funcionário: não vê a aba e não pode acessar os dados do módulo.
- Cliente: não acessa diretamente nesta primeira versão; o envio por link público fica para uma etapa posterior.

## Fluxo principal

1. A pessoa abre “Orçamentos” e escolhe “Novo orçamento”.
2. Seleciona um cliente cadastrado e um veículo vinculado a esse cliente.
3. Adiciona um ou vários serviços do catálogo, sem duplicar o mesmo serviço na mesma proposta.
4. Informa desconto opcional; o sistema calcula subtotal e total.
5. Salva como “Rascunho” ou marca como “Enviado”.
6. Pode editar, excluir, aprovar ou recusar a proposta.
7. Ao aprovar, o sistema cria uma única ordem de atendimento com todos os serviços do orçamento e marca o orçamento como aprovado.
8. A conversão deve ser idempotente: cliques repetidos ou reenvio não podem gerar ordens duplicadas.

## Modelo de dados

Criar tabelas no schema `public`:

- `quotes`: empresa, cliente, veículo, status, subtotal, desconto, total, observações, timestamps e usuário criador.
- `quote_items`: orçamento, serviço, descrição, quantidade, preço unitário e total do item.

Regras:

- Toda linha deve possuir `company_id`.
- `quote_items` deve referenciar `quotes` e ser removida junto com o orçamento.
- Status permitido: `draft`, `sent`, `approved`, `rejected`.
- Valores monetários devem usar `numeric(12,2)` e nunca depender de valores exibidos no cliente.
- Uma ordem criada a partir de orçamento deve guardar a referência ao orçamento para impedir nova conversão.
- RLS deve restringir leitura e escrita à empresa do perfil autenticado e às funções autorizadas.

## Interface

- A aba será adicionada ao menu principal entre “Atendimentos” e “Agenda”.
- A listagem exibirá cliente, veículo, quantidade de serviços, total, status e última atualização.
- Filtros rápidos por status e busca por cliente ou placa.
- Formulário em etapas curtas, com resumo financeiro visível.
- A conversão aprovada mostrará confirmação e atualizará a lista e os indicadores sem exigir F5.
- Mensagens de erro devem explicar a causa e nunca deixar o botão preso em “Salvando”.

## Integração com o sistema

- Clientes, veículos e serviços virão do Supabase, sem dados genéricos.
- A ordem criada usará o cliente, veículo, responsável e itens reais selecionados.
- O status inicial da ordem será `received`, não `in-progress`, pois a aprovação do orçamento não significa início do serviço.
- O faturamento só considerará o valor quando a regra já existente do sistema registrar a ordem como serviço efetivado/pago; a aprovação isolada não deve inflar o faturamento.

## Testes e entrega

- Testes unitários para cálculo, validação, status e idempotência.
- Testes de integração para RLS, criação, edição, exclusão e conversão.
- Testes end-to-end cobrindo acesso da administradora, recepção e bloqueio do funcionário.
- Executar a suíte existente e os 15 cenários end-to-end solicitados pelo usuário.
- Criar uma migration versionada, atualizar o código e registrar tudo em commits separados quando fizer sentido.
