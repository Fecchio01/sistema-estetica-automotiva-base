# Automações operacionais

## Integração comercial e prazos

Orçamentos e catálogo agora ficam no Supabase, separados por empresa. Salvar e editar uma proposta conserva seu identificador. Aprovar executa uma transação que cria uma única ordem, copia os serviços e desconto, escolhe o funcionário ativo com menos ordens abertas e vincula a ordem à proposta. Repetir a aprovação retorna a mesma ordem. Sem funcionário ativo, a ordem fica com quem aprovou. A aprovação registra pagamento pendente; carregar a tela não quita pagamentos nem recalcula preços históricos.

Cada estética define a duração dos próprios serviços no campo “Duração prevista (minutos)”, disponível no cadastro e na edição. Não foram impostos tempos aos serviços existentes. Quando todos os serviços selecionados têm duração, o sistema soma os tempos e calcula a previsão a partir da entrada ou do horário reservado. É uma estimativa de duração corrida: não agenda intervalos de almoço, expedientes ou capacidade de boxes. A previsão pode ser ajustada manualmente; esse ajuste é preservado na chegada e mostrado no portal do cliente. Mudanças posteriores no catálogo não alteram preços e durações já registrados na ordem/proposta.

Na agenda, “Registrar chegada” aproveita a própria ordem da reserva. No novo atendimento, uma reserva única do cliente e veículo para hoje aparece como opção para registrar a chegada sem duplicar o cadastro. Em caso de duas reservas compatíveis, a escolha continua na agenda. O check-in é idempotente e cancela o lembrete de chegada que ficou obsoleto.

Alertas operacionais consideram a última mudança de etapa e sinalizam previsão ultrapassada; reservas futuras não são marcadas como operação parada. Retirada aguardando usa o instante em que o veículo ficou pronto.

Validação adicional: testes transacionais de aprovação repetida, desconto, pagamento pendente, check-in repetido e preservação de prazo manual em `tests/commercial-workflow-regression.sql`. No navegador foram verificados criação/recarga/edição de orçamento e cadastro/recarga de serviço com duração. Os dois registros temporários foram arquivados após os testes. A função client-portal foi atualizada para devolver previsão, etapa e o veículo exato da ordem.

## Atendimento e agenda

Ao selecionar um cliente, o veículo único é preenchido automaticamente. Se houver vários, a escolha continua explícita. O responsável com menos ordens abertas é sugerido; escolhas manuais são preservadas.

O formulário soma os preços atuais do catálogo. “Repetir último serviço” recupera veículo e serviços do atendimento anterior válido quando todos ainda existem no catálogo. O rascunho é salvo neste navegador por empresa e usuário, expira em sete dias e conserva o identificador da tentativa para evitar duplicação após recarga. Limpar rascunho inicia uma nova tentativa. A agenda também usa o catálogo e grava o valor da reserva automaticamente.

## Avisos automáticos

Controle em Configurações → Automação de atendimento e WhatsApp, salvo no banco por empresa. Ativado para a empresa solicitante em 07/09/2026. Novos eventos geram:

- Reserva futura: lembrete 24 horas antes, ou imediatamente se faltar menos de 24 horas.
- Início do atendimento: aviso ao cliente.
- Pronto para retirada: aviso ao cliente.
- Entrega confirmada: check-in em 1 dia, cuidado em 7, avaliação em 15 e retorno em 30 dias. Usa o modelo ativo mais recentemente atualizado de cada tipo, quando existir.

A migração gera as filas no banco, inclusive quando a mudança vem do portal do funcionário. Não dispara mensagens retroativas de ordens antigas. Cancelamentos, remarcações e mudanças de status descartam avisos pendentes obsoletos. Reabrir uma ordem entregue descarta o pós-venda ainda pendente; uma segunda entrega da mesma ordem não recria acompanhamentos já existentes.

O servidor local processa as filas a cada minuto, com empresa delimitada. Com WhatsApp desconectado, aguarda reconexão. Antes de enviar, reserva e desativa o reenvio daquela mensagem. Em falha ambígua, pausa para conferência, pois o provedor pode ter entregue sem devolver confirmação. Uma falha no histórico depois de enviar não devolve a mensagem à fila. Avisos pausados podem ser conferidos e reativados em Configurações; acompanhamentos, em Pós-venda.

## Configuração necessária para os envios

Preencher `.env.local` com `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE` e `SUPABASE_SECRET_KEY` (chave de servidor). URL do projeto e empresa já foram preenchidas. Reiniciar `npm run dev`, conectar o WhatsApp em Conversas e verificar o estado em Configurações. O arquivo é ignorado pelo Git e bloqueado no servidor HTTP.

Os envios exigem o servidor ligado. Fechar a aba não interrompe o processo, mas desligar o computador ou encerrar o servidor interrompe os envios. Para operação contínua, hospedar este processo com as mesmas variáveis em um servidor permanente. Não foi contratado nem implantado um servidor permanente nesta alteração.

## Validação

231 testes automatizados passaram. Testes de fila simulam provedor conectado, desconectado, timeout, duas execuções e falha de histórico após envio. Teste transacional no Supabase verificou reserva, início, retirada, quatro acompanhamentos sem duplicação e cancelamento; todas as alterações de teste foram revertidas por rollback. A migração e a configuração da empresa foram persistidas.

No navegador: veículo único, soma do catálogo, rascunho após F5, painel de configuração e formulário em 390px. Nenhuma mensagem real enviada: a Evolution API e a chave de servidor ainda não estão configuradas.
