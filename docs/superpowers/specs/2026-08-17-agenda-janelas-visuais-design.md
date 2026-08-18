# Design: janelas visuais da agenda

## Objetivo

Fazer a agenda parecer uma operação com várias vagas ao longo do dia, em vez de um único cartão livre por data, sem inventar a capacidade real da empresa antes de ela ser configurada.

## Decisão

Cada dia exibirá cinco janelas de referência: 08:00, 10:00, 13:30, 15:30 e 17:00. Elas serão apresentadas como disponibilidade visual genérica. Reservas reais continuarão vindo do Supabase e ocuparão a agenda normalmente; a grade não bloqueará nem criará reservas automaticamente a partir dessas referências.

O texto de sincronização será “Sincronizada em tempo real”. Durante o carregamento, a interface manterá a estrutura da agenda e usará um estado visual discreto, sem expor “Atualizando dados...”.

## Testes

- A função de referência retorna cinco horários estáveis.
- A agenda vazia mostra as cinco janelas em cada um dos sete dias.
- Uma reserva real aparece junto das janelas restantes do dia.
- A indicação de sincronização não contém “Atualizando dados”.
- A suíte completa e pelo menos 15 verificações locais passam sem falhas.
