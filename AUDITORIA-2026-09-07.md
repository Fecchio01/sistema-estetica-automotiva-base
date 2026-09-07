# Revisão de estabilidade — 7 de setembro de 2026

## Correções aplicadas

- Removido o ciclo MutationObserver → consulta de equipe → redesenho → MutationObserver. Mudanças no DOM agora usam a equipe em cache; respostas idênticas não redesenham a aplicação.
- Atendimentos volta a atualizar sua lista quando os dados mudam, preservando busca, filtro e os indicadores sob o mouse.
- Busca e status funcionam juntos; ordens recebidas não entram no filtro de prontos.
- Abertura de ordem e novo atendimento usam click convencional, sem abrir durante pointerdown.
- Detalhe mostra cliente, veículo e responsável reais. Atualizações preservam a seleção por ID, não pela posição da ordem na lista.
- Previsões, marcos e fotos locais são preservados por ID durante atualizações da sessão. Isso não acrescenta persistência no banco.
- Portal do cliente reconhece ready_for_pickup. Perfil de funcionário ausente não seleciona ordens sem responsável.
- Servidor local bloqueia arquivos privados (.env, .git, código do servidor e diretórios internos), escuta apenas em loopback e respeita --port.

## Evidências

- 224 testes passaram, incluindo regressão com 50 mutações sem consultas extras de equipe e validação de caminhos privados.
- Navegação de leitura pelos módulos administrativos, sem cadastrar, excluir ou enviar mensagens reais.
- Ordem aberta e fechada três vezes consecutivas com um clique; abertura de ordem e novo atendimento repetida após reiniciar o servidor e recarregar a página.
- Indicador sob o mouse permaneceu no DOM, com posição estável; animação chegou a -3px e permaneceu estável nas amostras seguintes.
- Nenhum erro JavaScript nos logs consultados após os testes de interação.
- HTTP: página e app.js retornam 200; .env.local, .git/config e dev-server.mjs retornam 404.

## Limites e próximos pontos de revisão

Esta revisão não certifica todos os fluxos em produção. WhatsApp/Evolution não estava configurado, portanto entrega de mensagens não foi validada. Não foram executadas operações destrutivas nem fluxos completos de pagamento, envio de fotos ou acesso por token de cliente. A validação visual foi desktop; não houve validação em aparelho móvel nesta rodada.

Pontos identificados para uma revisão seguinte: tratamento de falha e concorrência na carga de dados; escape de conteúdo interpolado no portal; seleção do veículo da ordem na função client-portal (atualmente busca o primeiro veículo do cliente); persistência de todos os campos auxiliares. Nenhuma função Supabase foi alterada ou implantada nesta rodada.
