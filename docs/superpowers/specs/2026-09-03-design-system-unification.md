# Unificação visual dos módulos

## Objetivo

Aplicar a linguagem visual aprovada na Visão geral a todos os módulos do Atelier OS, reduzindo a aparência de planilha e preservando cada fluxo, regra de negócio, permissão e integração existente.

## Princípios

- Uma única família de verde claro para superfícies de informação, com o verde fechado já adotado reservado para áreas operacionais de maior prioridade.
- Bordas suaves, raio consistente e sombras discretas, tingidas de verde e usadas apenas para separar planos relevantes.
- Indicadores visuais e gráficos apenas quando calculados a partir de dados existentes. Nenhuma métrica, volume ou status será inventado.
- Estados de serviço continuam diferenciados pelos respectivos selos, marcadores e textos; o fundo dos cards não muda por estado.
- Sem novas animações contínuas. Os hovers existentes devem permanecer estáveis, sem flicker, alteração de cor ou deslocamento lateral inesperado.

## Sistema de superfícies

### Painéis principais

Todos os painéis de módulo usam fundo branco, borda verde-acinzentada clara, raio de 18px a 24px e sombra de baixa opacidade. Cabeçalhos de painéis ganham espaçamento consistente e uma separação sutil quando houver ferramenta, busca ou ação ao lado.

### Indicadores

Os blocos de resumo de Atendimentos, Clientes, Orçamentos, Pós-venda, Relatórios e Faturamento usam o mesmo verde claro já aprovado nos indicadores da Visão geral. Valores continuam em carvão e os textos auxiliares em cinza esverdeado. Faturamento não ganha cor exclusiva.

### Listas, tabelas e registros

Listas preservam os dados e ações atuais, mas adotam:

- Cabeçalhos com fundo verde muito claro e bordas superiores arredondadas.
- Linhas com espaçamento vertical maior, divisórias suaves e raio quando forem itens independentes.
- Busca, filtros e ações alinhados no mesmo bloco de ferramenta, sem mudança de comportamento.

## Aplicação por módulo

### Atendimentos

Resumo superior verde claro, filtros em uma barra coesa e lista de ordens como painel de acompanhamento. Os selos de etapa e responsáveis continuam com contraste próprio.

### Orçamentos

Métricas, propostas recentes e a composição de proposta mantêm o fluxo comercial atual. Cards de proposta ganham hierarquia por espaçamento e cabeçalho, não por cores concorrentes.

### Agenda

Cabeçalho semanal, controles e grade de dias passam a compor uma superfície única. Eventos, horários livres e reservas mantêm seus significados atuais, com contraste suficiente para uso operacional.

### Clientes e veículos

Resumo e diretório usam o padrão de indicadores e lista. O histórico continua acessível pelo cliente, com a tabela recebendo cabeçalho e linhas mais respiradas.

### Serviços e preços

Catálogo e formulários usam cards de serviço uniformes, com preço como dado de apoio e ações preservadas.

### Equipe e configurações

Perfis, permissões, ajustes e interruptores passam a usar painéis com cabeçalhos, grupos de configuração e separadores consistentes. Nenhum papel, acesso ou configuração será alterado.

### Conversas e pós-venda

Mantêm a estrutura funcional atual. A central de conversas preserva o estado de integração opcional do WhatsApp; não haverá configuração nem ativação de Evolution API. Pós-venda mantém fila, modelos, automações e histórico, apenas alinhados ao sistema de superfícies.

### Relatórios e faturamento

Indicadores e resultados usam o mesmo padrão verde claro. Gráficos existentes recebem a paleta do produto; caso não exista dado suficiente, a interface apresentará estado vazio em vez de simulação.

## Implementação técnica

- Consolidar as regras visuais em `styles.css`, com seletores específicos por módulo para não mudar o comportamento de componentes compartilhados de maneira acidental.
- Preservar `app.js` e arquivos de `src/` exceto se for necessário acrescentar uma classe semântica para uma composição que não possa ser alcançada pelo DOM existente.
- Não incluir dependências de terceiros, bibliotecas de gráficos ou fontes novas.
- Validar os módulos no navegador local e executar a suíte oficial de 15 E2E após a implementação.

## Critérios de aceite

- Todos os módulos do menu lateral apresentam a mesma família visual de fundo, superfícies, bordas e indicadores.
- Nenhuma função existente deixa de estar disponível ou muda de permissões.
- Não há cores concorrentes por tipo de card; estados permanecem identificados por selos e marcadores.
- Sem regressão de flash de tela ou de animações instáveis.
- Os 15 fluxos E2E oficiais passam ao fim da alteração.
