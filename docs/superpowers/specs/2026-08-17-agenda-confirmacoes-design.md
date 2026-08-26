# Design: confirmações e agenda operacional

## Objetivo

Substituir as confirmações nativas do navegador por um diálogo visual próprio do Atelier OS e atualizar a apresentação da agenda para que ela pareça uma ferramenta operacional moderna, sem alterar a integração com o Supabase nem as permissões existentes.

## Escopo

- Criar um componente de confirmação reutilizável no shell principal.
- Aplicar o componente às ações destrutivas já existentes: apagar agendamento, cliente, funcionário, serviço e ordem.
- Manter cancelamento, confirmação por teclado e fechamento seguro.
- Redesenhar a agenda real com cabeçalho de semana, dias com hierarquia visual, cartões de reserva, estado vazio e indicação de carga do dia.
- Melhorar estados de hover, foco, carregamento e erro sem adicionar dependências.
- Preservar os dados, filtros, criação e exclusão já conectados ao Supabase.

## Comportamento

O modal de confirmação será aberto pelo código da aplicação, com título, mensagem contextual, botão secundário “Cancelar” e botão destrutivo “Apagar”. A ação só continuará quando o usuário confirmar. O foco ficará no modal e o fundo ficará inativo enquanto ele estiver aberto.

A agenda continuará mostrando a semana real e os registros retornados pelo banco. Cada dia exibirá sua quantidade de reservas; cada reserva será um cartão com horário, cliente, veículo, serviço, responsável e ação de exclusão. Dias sem reservas terão um estado visual leve, sem parecer uma linha de planilha. A responsividade atual será preservada.

## Arquitetura

- `src/confirm-dialog.js`: estado e API global mínima para abrir/fechar confirmações.
- `index.html`: markup único do modal e carregamento do módulo.
- `src/agenda-ui.js`: usa a confirmação própria em vez de `window.confirm` e mantém as operações atuais.
- módulos administrativos existentes: migração gradual das demais exclusões para a mesma API.
- `styles.css`: estilos do modal, estados de foco e nova composição visual da agenda.

## Testes e critérios de aceite

- O modal próprio aparece ao apagar qualquer entidade coberta e não aparece a caixa nativa do navegador.
- Cancelar não executa a exclusão; confirmar executa exatamente uma vez.
- A agenda exibe reservas reais e o estado vazio sem regressões.
- Criação, exclusão e atualização da agenda continuam funcionando com Supabase.
- `npm.cmd test`, verificações de sintaxe, `git diff --check` e uma validação local no navegador passam sem falhas.
- Os testes cobrem pelo menos 15 verificações end-to-end do fluxo visual e operacional.

## Fora de escopo

- Alterações no modelo de dados ou nas políticas RLS.
- Inclusão de bibliotecas de interface ou animação.
- Mudança na regra de quais perfis podem criar ou apagar registros.
