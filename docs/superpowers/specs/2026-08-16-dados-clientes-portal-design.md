# Dados reais de clientes, indicadores e portal

## Objetivo

Fazer do Supabase a fonte única de verdade para clientes, veículos, ordens, agenda, faturamento e portal do cliente, removendo dados demonstrativos da operação.

## Clientes e veículos

- O cadastro grava em `clients` e `vehicles` dentro da empresa do perfil autenticado.
- A lista mostra apenas registros ativos, com data de criação real e quantidade de ordens relacionadas.
- O atendimento e a reserva carregam clientes e veículos ativos diretamente do Supabase.
- “Apagar cliente” arquiva o cliente (`active = false`) e seus veículos ativos; ordens e histórico permanecem preservados.
- Clientes arquivados não aparecem em novas ordens, agenda ou contadores ativos.

## Visão geral e faturamento

- Remover “Aguardando aprovação” da visão geral e das telas operacionais.
- Exibir atendimentos, prontos para retirada, ordens do mês e faturamento.
- O faturamento usa `total_amount` das ordens reais, agrupado em feitos, em andamento e prontos para retirada.
- Nenhum texto de cliente, quantidade, data ou serviço será inventado quando não houver registro.

## Portal do cliente

- Ao criar uma ordem, gerar um token aleatório de uso único lógico, armazenando somente seu hash em `client_order_tokens`.
- O link público terá o formato `/portal/<token>`.
- Uma Edge Function pública validará o token, expiracão e revogação, retornando somente nome, veículo, serviço, status, horários e fotos públicas.
- O portal não retornará notas internas, IDs, valores administrativos ou dados de outros clientes.
- O botão de copiar link usará o link gerado pela ordem, nunca um endereço fixo.

## Segurança e verificação

- O acesso autenticado à operação continuará protegido por RLS e por `company_id`.
- O acesso público usará apenas o hash do token e uma função SQL/Edge Function restrita.
- Testar cadastro, listagem, arquivamento, exclusão das opções em formulários, indicadores sem dados genéricos e abertura do portal com token válido/inválido.
