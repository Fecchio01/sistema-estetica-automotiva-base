# Design: Recepção com relatórios e operação completa

## Objetivo

Permitir que o perfil `reception` execute a rotina operacional completa: criar atendimentos, criar agendamentos e acessar/generar relatórios semanais, mensais e anuais. A Administração continua responsável por usuários, configurações e visão gerencial, mas não precisa ser acionada para lançar ou consultar a operação diária.

## Divisão de responsabilidades

- `administrator`: acesso completo, incluindo equipe, configurações, faturamento e relatórios.
- `reception`: clientes, veículos, atendimentos, agenda, conversas e relatórios operacionais/financeiros.
- `employee`: somente ordens atribuídas, etapas, fotos, observações e entrega.

O relatório será o mesmo módulo visual para Administração e Recepção. O perfil de Recepção não verá ações de gestão de usuários ou configurações administrativas.

## Arquitetura e fluxo

1. A matriz de seções permitirá `relatorios` para `reception`.
2. Os gatilhos de criação de atendimento e agendamento serão liberados para o perfil `reception`, respeitando as capacidades existentes (`manageOrders` e `manageAgenda`).
3. Os dados serão lidos do Supabase pela mesma camada de dados já usada pela Administração, com atualização em tempo real.
4. O relatório terá filtros de semana, mês e ano e exibirá faturamento, ordens do período, valores em aberto, ticket médio, status operacionais e distribuição por serviço.
5. Falhas de autorização, rede ou validação serão exibidas no próprio formulário sem apagar os dados digitados.

## Segurança

As políticas RLS existentes para `clients`, `vehicles` e `work_orders` já usam `private.is_admin_or_reception(company_id)`, portanto a Recepção poderá operar somente os registros da própria empresa. Nenhuma permissão de `manageUsers` ou `manageSettings` será adicionada ao perfil.

## Testes

- garantir que Recepção visualize `relatorios`;
- garantir que Funcionário continue sem acesso a `relatorios`;
- garantir que Recepção mantenha `manageOrders` e `manageAgenda`;
- testar renderização dos filtros e resumo do período;
- executar a suíte completa e verificar as políticas/tabelas no Supabase.
