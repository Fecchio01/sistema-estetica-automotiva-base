# Agenda real e reservas persistidas

## Objetivo

Dar à administradora e à recepção uma visão mais ampla da agenda e transformar “Reservar horário” em uma ação real, sincronizada com o Supabase.

## Experiência

- A agenda exibirá sete dias por vez, com a semana atual como ponto de partida.
- “Semana anterior” e “Próxima semana” permitirão consultar períodos anteriores e futuros sem depender da passagem do tempo.
- A janela exibida sempre usará datas reais e o horário local da empresa (`America/Sao_Paulo`).
- Quando não houver ordens agendadas no período, cada dia aparecerá livre, sem dados fictícios.
- O botão “Reservar horário” abrirá um formulário com cliente, veículo, serviço, responsável, data e horário.

## Dados e permissões

- A reserva será gravada em `work_orders` com `status = 'scheduled'` e `scheduled_at` em ISO 8601.
- Clientes e veículos existentes serão carregados do Supabase; o formulário não criará registros genéricos.
- O responsável será selecionado entre perfis ativos da mesma empresa.
- Administrador(a) e recepção poderão criar reservas; funcionários não terão acesso à criação global de ordens.
- A agenda consultará as ordens da empresa e respeitará as políticas RLS existentes.

## Atualização e erros

- Após salvar, a agenda será recarregada sem F5.
- Mudanças de semana atualizarão a consulta e manterão o período selecionado.
- Campos obrigatórios e datas passadas serão rejeitados no formulário.
- Erros do Supabase aparecerão em mensagem compreensível, sem expor detalhes internos.

## Verificação

- Testes unitários para cálculo de semana, limites de data e montagem do payload.
- Teste local do fluxo de abrir formulário, validar e salvar uma reserva.
- Consulta de verificação no Supabase para confirmar `status`, `scheduled_at`, `company_id` e `responsible_id`.
