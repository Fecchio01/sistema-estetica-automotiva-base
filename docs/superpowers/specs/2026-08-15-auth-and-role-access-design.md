# Autenticação e acesso por função

## Objetivo

Adicionar ao sistema de teste autenticação real pelo Supabase, mantendo um único link e um painel compartilhado. A interface será adaptada conforme a função do usuário, e a mesma separação será aplicada no banco por RLS.

Esta primeira fase inclui:

- login interno para administradora, recepção e funcionário;
- cadastro de funcionários pela administradora;
- permissões diferentes dentro do mesmo painel;
- portal do cliente por link exclusivo da ordem;
- persistência básica dos dados no Supabase;
- testes de autenticação, autorização e isolamento entre empresas.

Ficam fora desta fase a integração real com WhatsApp, relatórios financeiros completos e a transformação em PWA.

## Perfis

### Administradora

Tem acesso completo à empresa, incluindo equipe, permissões, configurações, clientes, veículos, agenda e ordens.

### Recepção

Usa o mesmo painel visual e pode operar clientes, veículos, agenda, conversas, ordens, entradas e entregas. Não pode administrar usuários, permissões, configurações sensíveis ou dados financeiros.

### Funcionário

Usa o mesmo link, mas vê apenas as ordens atribuídas a ele. Pode atualizar etapas, adicionar fotos, registrar observações internas e marcar o veículo como pronto ou entregue conforme a regra da ordem.

### Cliente

Não entra no painel interno. Acessa uma ordem específica por um link seguro e visualiza veículo, placa, status, etapas, previsão, fotos e contato da empresa.

## Fluxo de autenticação

1. O usuário abre o link único do sistema.
2. Se não houver sessão válida, vê a tela de login.
3. O Supabase Auth autentica o e-mail e a senha.
4. A aplicação carrega o perfil associado ao `auth.users.id`.
5. A aplicação abre o painel compartilhado com módulos e ações compatíveis com a função.
6. O Supabase mantém a sessão no navegador para que a administradora não precise fazer login em toda abertura.
7. Logout, expiração ou usuário inativo retornam o usuário à tela de login.

A senha será armazenada somente pelo Supabase Auth. A tabela de perfil não armazenará senhas. Não será obrigatória a troca de senha no primeiro acesso.

## Cadastro de funcionários

A administradora cadastrará nome, e-mail, senha inicial, função e status pelo painel de usuários.

Como a criação de usuários exige privilégio administrativo, o navegador não receberá a chave `service_role`. Uma Edge Function protegida fará a operação:

1. validar a sessão do solicitante;
2. confirmar que o solicitante é administradora da empresa;
3. criar o usuário no Supabase Auth;
4. criar o perfil vinculado à empresa;
5. definir a função e o status;
6. retornar apenas o resultado necessário para a interface.

A administradora também poderá desativar o acesso e iniciar redefinição de senha sem apagar o histórico operacional do funcionário.

## Modelo de dados inicial

### `companies`

- `id`
- `name`
- `created_at`

### `profiles`

- `id`, referência a `auth.users`
- `company_id`
- `name`
- `email`
- `role`, com `administrator`, `reception` ou `employee`
- `active`
- `created_at`

### `clients`

- `id`
- `company_id`
- `name`
- `phone`
- `created_at`

### `vehicles`

- `id`
- `company_id`
- `client_id`
- `model`
- `plate`

### `work_orders`

- `id`
- `company_id`
- `client_id`
- `vehicle_id`
- `responsible_id`
- `service`
- `status`
- `current_stage`
- `received_at`
- `estimated_delivery_at`
- `delivered_at`

### `work_order_photos`

- `id`
- `work_order_id`
- `uploaded_by`
- `storage_path`
- `created_at`

Observações internas e histórico de etapas deverão ser adicionados junto à migração operacional, mantendo o vínculo com a ordem e o autor da alteração.

## Portal do cliente

Cada ordem terá um token de acesso exclusivo. O token será armazenado de forma segura e vinculado somente à ordem correspondente. O link não concederá acesso ao painel interno nem a outras ordens.

O portal exibirá apenas informações liberadas para o cliente. Observações internas, dados administrativos, permissões e informações financeiras ficarão fora do portal.

## Segurança e RLS

- Todas as tabelas operacionais terão `company_id`.
- RLS será habilitado em todas as tabelas expostas.
- Administradora e recepção só acessarão dados da própria empresa.
- Funcionários só poderão consultar ou alterar ordens atribuídas a eles, conforme a operação permitida.
- O portal do cliente usará um fluxo próprio de validação do token.
- Funções de autorização não dependerão de `user_metadata`, que é editável pelo usuário.
- A chave `service_role` ficará somente em ambiente seguro da Edge Function.
- Políticas de `UPDATE` incluirão `USING` e `WITH CHECK` quando necessário.

Esconder botões na interface não será considerado uma camada de segurança suficiente.

## Testes de aceitação

1. Administradora entra e vê o painel completo.
2. Recepção entra pelo mesmo link e vê o painel operacional sem gestão de equipe.
3. Funcionário entra e vê somente ordens atribuídas.
4. Usuário inativo não consegue acessar o sistema.
5. Administradora cadastra funcionário com senha inicial.
6. Funcionário criado consegue entrar com as credenciais fornecidas.
7. Cliente abre o link da ordem e vê somente a própria ordem.
8. Token inválido ou expirado não abre o portal.
9. Usuários de empresas diferentes não conseguem consultar dados uns dos outros.
10. Logout e expiração da sessão retornam à tela de login.
11. Dados criados ou alterados permanecem após recarregar a página.

## Ordem de implementação

1. Criar a base do Supabase Auth e as tabelas de empresa/perfil.
2. Configurar RLS e políticas de acesso.
3. Criar a tela de login e carregamento de sessão.
4. Adaptar o painel existente por função.
5. Criar o painel de usuários da administradora.
6. Criar a Edge Function para cadastro e gestão de funcionários.
7. Migrar clientes, veículos e ordens demonstrativas para o banco.
8. Criar o token e o portal do cliente.
9. Executar os testes de aceitação e os advisors de segurança.
