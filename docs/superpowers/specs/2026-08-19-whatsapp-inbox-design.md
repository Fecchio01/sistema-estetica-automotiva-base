# Central de conversas do WhatsApp — Atelier OS

## Objetivo

Adicionar ao Atelier OS uma central de atendimento manual conectada à Evolution API. A equipe poderá visualizar conversas, mensagens e mídias, além de responder pelo WhatsApp dentro do sistema. Não haverá respostas automáticas nesta fase.

## Decisão de arquitetura

O WhatsApp continuará conectado à Evolution API por uma instância própria da empresa. A Evolution enviará eventos para um webhook público do Supabase. O webhook normaliza e grava os dados no banco da empresa; o painel consulta esses dados e usa Supabase Realtime para atualizar novas mensagens sem recarregar a página.

O WhatsApp Web original não será incorporado por iframe. O Atelier OS terá uma interface própria de inbox, evitando dependência de uma tela externa bloqueada pelo navegador.

## Dados e isolamento

Serão adicionadas tabelas públicas protegidas por RLS:

- `whatsapp_conversations`: uma conversa por empresa e identificador remoto do contato, com nome, telefone, última mensagem, não lidas e data da última atividade.
- `whatsapp_messages`: mensagens ligadas à conversa, direção, tipo, texto, status, identificador remoto e timestamps.
- `whatsapp_media`: metadados e caminho de mídias recebidas ou enviadas, sem guardar a chave da Evolution no cliente.

Todas as tabelas terão `company_id`, índices para empresa/conversa/data e políticas que permitam leitura e operação apenas à administradora ou recepção da mesma empresa. Funcionários não receberão acesso à inbox nesta etapa. A chave da Evolution ficará somente no ambiente do servidor ou Edge Function.

## Fluxo de recebimento

1. A instância Evolution recebe uma mensagem do WhatsApp.
2. O webhook verifica a instância configurada e identifica a empresa.
3. O evento `MESSAGES_UPSERT` cria ou atualiza a conversa e insere a mensagem de forma idempotente pelo identificador remoto.
4. Eventos de atualização alteram status e contadores.
5. Se houver mídia, a função baixa ou referencia o arquivo com segurança e salva somente o caminho/metadados no banco.
6. O Realtime atualiza a lista e o painel aberto.

## Fluxo de envio manual

1. A administradora ou recepção escreve a resposta no painel.
2. O servidor valida a sessão, empresa e conversa.
3. O servidor chama a rota de envio da Evolution usando a chave privada.
4. A mensagem enviada é registrada como `outgoing` e reconciliada com o evento de confirmação.

O painel não executará automações, respostas por palavras-chave ou envio sem ação explícita do usuário.

## Interface

- Entrada em “Conversas” no painel da administradora e recepção.
- Coluna esquerda com busca, filtros, avatar/nome, prévia e contador de não lidas.
- Coluna central com cabeçalho do contato, histórico, horário, status e mídias.
- Composer com texto, anexo de imagem/documento e botão de envio.
- Ação para vincular a conversa a um cliente cadastrado.
- Tela de configurações para conectar/reconectar instância por QR Code e mostrar o estado da conexão.
- Estados claros para desconectado, sincronizando, erro e sem conversas.

## Segurança e falhas

- Nunca expor `EVOLUTION_API_KEY` no navegador, logs ou respostas da API.
- Validar assinatura/cabeçalho do webhook quando configurado na Evolution.
- Rejeitar eventos de instância desconhecida.
- Deduplicar mensagens e aceitar reentrega de webhook.
- Limitar tamanho e tipos de anexos.
- Não exibir mídias sem verificar a empresa da conversa.
- Se a Evolution estiver indisponível, manter a mensagem como pendente/erro e informar no painel.

## Verificação

Serão adicionados testes unitários e de integração para: normalização de eventos, idempotência, texto e mídia, envio manual, atualização em tempo real, estados de erro, RLS entre empresas e permissões por função. A validação final incluirá 15 cenários end-to-end sem falhas, conforme a rotina combinada do projeto.

## Fora desta etapa

- Respostas automáticas, chatbot ou IA.
- Integração oficial WhatsApp Cloud API da Meta.
- Incorporar a interface original do WhatsApp Web.
- Gestão de múltiplas instâncias pela mesma tela sem vínculo explícito à empresa.
