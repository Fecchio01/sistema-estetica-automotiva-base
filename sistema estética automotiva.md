# Sistema de gestão para estética automotiva

Documento de continuidade do projeto. Use este arquivo como briefing para outra IA ou para retomar o desenvolvimento em outra conta.

> **Importante:** este documento acompanha o código-fonte local do sistema. O sistema não deve ser recriado a partir deste texto. A próxima IA deve abrir os arquivos locais indicados abaixo e continuar neles.

## 0. Repositório local do sistema

Pasta raiz do projeto:

```text
C:\Users\Alexandre\Documents\Codex\2026-08-03\pre
```

Repositório Git local da base:

```text
C:\Users\Alexandre\Documents\Codex\2026-08-03\pre\sistema-estetica-automotiva-base
```

Essa pasta é a base versionada da demonstração. Para iniciar um novo cliente, clone o
repositório para uma nova pasta e mantenha a base original intacta:

```powershell
git clone "C:\Users\Alexandre\Documents\Codex\2026-08-03\pre\sistema-estetica-automotiva-base" "C:\Users\Alexandre\Documents\Codex\2026-08-03\clientes\nome-da-empresa"
```

Depois do clone, personalize somente a identidade visual, dados da empresa, catálogo,
preferências operacionais, usuários/permissões e mensagens/configurações do WhatsApp.
As melhorias gerais do produto devem continuar sendo feitas nesta base e depois
replicadas para os clientes quando fizer sentido.

Arquivos que compõem o sistema atual:

- [index.html](C:/Users/Alexandre/Documents/Codex/2026-08-03/pre/index.html) — estrutura da aplicação, dashboard, telas, modais e portais.
- [app.js](C:/Users/Alexandre/Documents/Codex/2026-08-03/pre/app.js) — dados de demonstração, navegação, regras de negócio e interações.
- [styles.css](C:/Users/Alexandre/Documents/Codex/2026-08-03/pre/styles.css) — layout, responsividade e design visual.
- [sistema estética automotiva.md](C:/Users/Alexandre/Documents/Codex/2026-08-03/pre/sistema%20est%C3%A9tica%20automotiva.md) — documentação de continuidade.

Estrutura local:

```text
pre/
├── index.html
├── app.js
├── styles.css
└── sistema estética automotiva.md
```

Como abrir a versão atual no computador:

```text
file:///C:/Users/Alexandre/Documents/Codex/2026-08-03/pre/index.html
```

Regra para a próxima IA:

1. Ler este documento.
2. Abrir e analisar `index.html`, `app.js` e `styles.css` na pasta local.
3. Preservar o código e as funcionalidades existentes.
4. Alterar os arquivos atuais, sem criar uma segunda versão paralela.
5. Verificar `app.js` depois das alterações.
6. Manter este documento atualizado quando uma nova funcionalidade importante for criada.

Prompt pronto para entregar junto com este arquivo:

```text
Este arquivo documenta um sistema local já existente. Não crie um projeto novo.
Leia primeiro `sistema estética automotiva.md` e depois abra os arquivos `index.html`, `app.js` e `styles.css` na mesma pasta. Continue usando o mesmo código-fonte. Antes de editar, explique quais arquivos serão alterados. Preserve as regras de negócio, os perfis de acesso e a separação entre serviços e etapas.
```

## 1. Objetivo do produto

Criar um sistema de gestão para empresas de estética automotiva. O sistema deve organizar a operação desde a chegada do veículo até a retirada, mantendo administradora, recepção, equipe de execução e cliente conectados.

O diferencial principal é o acompanhamento visual e operacional do veículo:

- A recepção cadastra cliente, veículo, serviço e responsável.
- A equipe atualiza etapas e adiciona fotos diretamente do local de execução.
- A administradora acompanha a operação, equipe, clientes e indicadores.
- O cliente recebe um link/portal para acompanhar o andamento, previsão, fotos e contato com a empresa.

## 2. Decisão de produto

O melhor formato definido foi:

- Administradora: sistema interno completo, normalmente em computador.
- Recepção: acesso interno a clientes, agenda, ordens, conversas e entregas.
- Funcionário da execução: versão operacional restrita, preferencialmente mobile/PWA, somente com ordens atribuídas, etapas, fotos, observações e entrega.
- Cliente: portal externo sem acesso ao sistema interno.

Não é necessário começar com APK. A primeira versão mobile pode ser uma aplicação web responsiva/PWA. Ela pode ser instalada em Android e iPhone. Depois, se fizer sentido, o mesmo produto pode ser empacotado com Capacitor ou publicado nas lojas.

O funcionário não deve visualizar financeiro, configurações, equipe completa ou dados administrativos.

## 2.1. Modelo comercial inicial

O modelo definido para os primeiros clientes é:

- Implantação: R$ 2.500.
- Mensalidade: R$ 297.
- A implantação inclui personalização visual, preferências da empresa, configuração inicial e treinamento básico.
- A mensalidade inclui hospedagem futura, suporte básico e manutenções do produto conforme o plano comercial.
- Integrações com WhatsApp, custos de API e serviços externos devem ser avaliados separadamente.

O repositório atual é uma base demonstrativa reutilizável. Para cada cliente novo, deve-se clonar esta base e personalizar somente:

- Nome, logo, cores e identidade visual.
- Dados da empresa.
- Catálogo de serviços e preços.
- Preferências da operação.
- Usuários e permissões.
- Textos, contatos e configurações de WhatsApp.

As funcionalidades centrais não devem ser reescritas para cada cliente. Quando uma melhoria for geral, ela deve ser feita na base e depois incorporada aos clientes conforme a estratégia de atualização.

## 3. Perfis e permissões

### Administradora

- Dashboard completo.
- Atendimentos e ordens.
- Clientes e veículos.
- Agenda.
- Catálogo de serviços e preços.
- Equipe e permissões.
- Conversas.
- Relatórios.
- Configurações.
- Criar, editar, apagar e acompanhar qualquer ordem.

### Recepção

- Cadastrar clientes.
- Reutilizar clientes e veículos já cadastrados.
- Criar atendimentos.
- Escolher responsável pela ordem.
- Consultar ficha do cliente.
- Marcar agenda.
- Registrar chegada e entrega.
- Acompanhar conversas do WhatsApp.
- Consultar o andamento de todas as ordens necessárias à operação.

### Funcionário da execução

- Ver apenas ordens atribuídas a ele.
- Abrir a ficha operacional da ordem.
- Avançar etapa.
- Voltar etapa.
- Adicionar fotos do veículo.
- Registrar observação interna.
- Consultar serviço, cliente, veículo, placa, responsável e previsão.
- Marcar veículo como pronto.
- Registrar entrega.
- Cancelar uma entrega registrada.

A observação interna é destinada à equipe da operação. Ela serve para registrar riscos, detalhes do veículo, pendências ou informações para o próximo funcionário. Não aparece no portal do cliente.

### Cliente

- Acessar o portal pelo link recebido.
- Ver veículo e placa.
- Ver status e etapa atual.
- Ver horário real de recebimento.
- Ver previsão de entrega.
- Ver fotos do atendimento.
- Ver horário de retirada depois que a entrega for registrada.
- Falar com a empresa pelo WhatsApp.

## 4. Etapas da ordem

As etapas representam o fluxo do veículo, não os serviços contratados.

1. Entrada registrada
2. Avaliação inicial
3. Execução do serviço
4. Inspeção e acabamento
5. Finalização / pronto para retirada

Exemplo: “Detalhamento interno” é um serviço. Ele não deve ser exibido como uma etapa. A etapa deve continuar sendo “Execução do serviço”, “Inspeção e acabamento” etc.

## 5. Status da ordem

Os status são independentes do nome do serviço:

- Recebido: veículo entrou, mas ainda não está em execução.
- Em andamento: alguma etapa operacional está sendo executada.
- Aguardando aprovação: a empresa precisa de retorno do cliente.
- Pronto para retirada: serviço concluído e cliente deve ser avisado.
- Entregue: veículo foi retirado.

Uma ordem recém-criada começa como “Recebido”, e não como “Em andamento”.

## 6. Horários

O horário de entrada deve usar o relógio real do dispositivo no momento em que o atendimento é criado.

O horário de retirada deve usar o relógio real do dispositivo no momento em que a entrega é registrada.

Esses dados devem ficar gravados no banco posteriormente, por exemplo:

```text
received_at: data e hora da entrada
evaluated_at: data e hora da avaliação inicial
delivered_at: data e hora da retirada
```

O protótipo atual usa `new Date()` no navegador, mas ainda não possui banco de dados.

## 7. Clientes e recorrência

Ao criar atendimento para um cliente já cadastrado:

- Não criar um segundo cadastro do mesmo cliente.
- Reutilizar nome, veículo e placa quando selecionado.
- Incrementar a quantidade de serviços registrados.
- Atualizar último serviço e status atual.
- Atualizar a ficha do cliente.

Ao criar cliente novo:

- Criar cadastro com histórico inicial zerado.
- Ao primeiro atendimento, incrementar para um serviço.

A comparação deve ser feita com nome normalizado ou, preferencialmente, com um ID de cliente no banco. Em produção, não depender apenas do nome: usar telefone/WhatsApp ou ID único.

## 8. Fotos

O funcionário deve conseguir selecionar uma ou várias fotos pelo celular.

Fluxo esperado:

1. Funcionário abre a ordem.
2. Clica em “Adicionar foto”.
3. Seleciona imagens do dispositivo.
4. As fotos aparecem imediatamente na ordem.
5. As fotos aparecem também no portal do cliente.
6. No sistema real, as imagens devem ser enviadas para armazenamento persistente, como Supabase Storage, S3 ou Cloudflare R2.

No protótipo atual, as fotos usam URLs temporárias do navegador e são perdidas ao recarregar a página. Isso deve ser substituído por upload para storage quando o backend for criado.

## 9. Conversas e WhatsApp

A recepção e a administradora devem ter acesso à central de conversas dentro do sistema.

A tela deve mostrar:

- Cliente.
- Veículo e placa.
- Última mensagem.
- Horário da mensagem.
- Status da ordem.
- Responsável pelo atendimento.
- Botão para abrir a ordem relacionada.

Integração real:

- Usar WhatsApp Business Platform / WhatsApp Cloud API da Meta.
- Criar backend para guardar tokens e credenciais.
- Criar webhook para receber mensagens.
- Associar conversa ao cliente e à ordem.
- Enviar mensagens pelo backend, nunca expondo token no navegador.
- Registrar histórico de mensagens.
- Criar templates aprovados quando necessário.

O protótipo atual possui apenas a interface e um aviso de que a API ainda precisa ser configurada. O botão não envia mensagem real.

## 10. Dashboard

O dashboard deve ser uma central de operação, não apenas uma tela decorativa.

Elementos já definidos:

- Em execução.
- Aguardando aprovação.
- Prontos para retirada.
- Total de ordens do período.
- Pendências de hoje.
- Ordens em acompanhamento.
- Atalhos para novo atendimento, novo cliente, agenda e painel da equipe.
- Links enviados e visualizados.

Os números devem ser calculados a partir das ordens reais. Não usar valores fictícios como faturamento ou quantidade de ordens que não existem.

Qualquer alteração deve atualizar dashboard e atendimentos:

- Criar ordem.
- Alterar etapa.
- Voltar etapa.
- Registrar entrega.
- Cancelar entrega.
- Apagar ordem.

## 11. Estrutura atual do protótipo

Pasta do projeto:

```text
C:\Users\Alexandre\Documents\Codex\2026-08-03\pre
```

Arquivos principais:

- `index.html`: estrutura das telas, modais e portais.
- `app.js`: dados demonstrativos, navegação, eventos e regras de negócio simuladas.
- `styles.css`: layout e design visual.

O protótipo é estático e funciona sem backend. Os dados ficam em arrays em memória e são perdidos ao recarregar.

## 12. Dados demonstrativos atuais

Ordens iniciais:

- Rafael Nogueira — Honda Civic Touring — Detalhamento interno — Recebido.
- Camila Bittencourt — Toyota Corolla XEi — Polimento técnico — Aguardando aprovação.
- João Vitor Mendes — Jeep Compass Limited — Higienização completa — Pronto para retirada.
- Marina Albuquerque — BMW 320i M Sport — Proteção cerâmica — Em andamento.

Equipe demonstrativa:

- Lucas Sampaio — Funcionário / execução.
- Fernanda Cardoso — Atendente / recepção.
- Marina Costa — Administradora.

## 13. Funcionalidades já implementadas no protótipo

- Dashboard com contagens baseadas nas ordens atuais.
- Atualização dos números ao mudar etapa.
- Lista de atendimentos com status, etapa, responsável e previsão.
- Clientes e veículos.
- Ficha individual do cliente.
- Cadastro de cliente.
- Cadastro de atendimento.
- Seleção de cliente já cadastrado.
- Atribuição de responsável.
- Cadastro de serviços e preços.
- Agenda demonstrativa.
- Painel expandido do funcionário.
- Portal expandido do cliente.
- Avançar etapa.
- Voltar etapa.
- Registrar entrega.
- Cancelar entrega.
- Apagar ordem no painel administrativo.
- Registro de entrada usando horário do dispositivo.
- Registro de retirada usando horário do dispositivo.
- Fotos do funcionário refletidas no portal do cliente durante a sessão.
- Observação interna para a equipe.
- Conversas com layout preparado para integração com WhatsApp.
- Relatórios demonstrativos baseados nas contagens reais.
- Configurações e perfis de acesso demonstrativos.

## 14. Limitações atuais

- Não há banco de dados.
- Não há login real.
- Não há autenticação por perfil.
- Não há API do WhatsApp conectada.
- Fotos não são persistentes após recarregar.
- Dados de agenda ainda são demonstrativos.
- A conexão em tempo real entre dispositivos ainda não existe.
- O horário do navegador é usado apenas como demonstração.
- A central de conversas ainda não envia nem recebe mensagens reais.
- O protótipo está em HTML, CSS e JavaScript puro.

## 15. Próxima arquitetura recomendada

Para transformar em produto real:

### Frontend

- Manter painel administrativo e recepção em web desktop.
- Criar layout mobile para funcionários.
- Transformar a versão mobile em PWA inicialmente.
- Usar autenticação e rotas protegidas por perfil.

### Backend

- Supabase é uma opção prática para Auth, PostgreSQL, Storage e Realtime.
- Alternativas: Firebase, backend Node.js próprio ou Cloudflare com banco/storage.

### Tabelas principais

```text
companies
users
team_members
clients
vehicles
services_catalog
work_orders
work_order_services
work_order_stage_history
work_order_photos
work_order_notes
appointments
conversations
messages
```

### Realtime

Eventos que devem atualizar todas as telas:

- `work_order_created`
- `work_order_updated`
- `work_order_stage_changed`
- `work_order_photo_added`
- `work_order_delivered`
- `work_order_delivery_cancelled`
- `message_received`

## 16. Ordem recomendada de desenvolvimento

1. Corrigir e padronizar a codificação dos textos, pois o protótipo possui alguns trechos com caracteres acentuados corrompidos.
2. Separar componentes/telas do JavaScript monolítico atual.
3. Criar banco e autenticação.
4. Criar empresas e usuários com permissões.
5. Migrar clientes, veículos e ordens para o banco.
6. Implementar histórico de etapas.
7. Implementar upload persistente de fotos.
8. Implementar Realtime.
9. Implementar agenda real.
10. Integrar WhatsApp Cloud API e webhook.
11. Criar PWA mobile do funcionário.
12. Fazer testes de permissões e de fluxo completo.
13. Publicar e configurar domínio, backups e logs.

## 17. Fluxo principal esperado

```text
Recepção cadastra cliente/veículo
        ↓
Cria ordem e escolhe serviço/responsável
        ↓
Sistema registra horário real de entrada
        ↓
Funcionário vê ordem atribuída no mobile
        ↓
Funcionário atualiza etapa e adiciona fotos
        ↓
Cliente acompanha pelo portal
        ↓
Recepção/funcionário registra veículo pronto
        ↓
Cliente é avisado pelo WhatsApp
        ↓
Entrega é registrada com horário real
        ↓
Histórico do cliente é atualizado
```

## 18. Como continuar com outra IA

Primeiro, peça para a IA ler este arquivo e depois analisar:

```text
C:\Users\Alexandre\Documents\Codex\2026-08-03\pre\sistema estética automotiva.md
```

Em seguida, peça para ela verificar `index.html`, `app.js` e `styles.css` antes de alterar qualquer coisa.

Instrução recomendada para retomada:

> Leia o arquivo sistema estética automotiva.md e analise os três arquivos do protótipo. Preserve as regras de negócio, os perfis de acesso e a separação entre serviços e etapas. Antes de implementar, explique quais partes já existem e quais serão alteradas. Não recrie o projeto do zero.
