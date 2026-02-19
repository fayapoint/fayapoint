# Apresentação

Bem-vindo ao curso **Make (Integromat): Integração Total** — o guia completo para dominar a plataforma de automação visual mais intuitiva e poderosa do mercado.

O Make (anteriormente Integromat) permite criar automações sofisticadas com uma interface visual de arrastar e soltar, conectando mais de 1.500 aplicativos sem escrever código. Neste curso, você aprenderá a construir cenários complexos que transformam processos manuais em fluxos automatizados.

**O que você vai conquistar:**
- Dominar o Make do básico ao avançado
- Criar cenários de automação multi-etapas
- Integrar centenas de aplicativos sem programação
- Processar dados complexos com routers e iteradores
- Monetizar automações como serviço profissional

---

# ESTRUTURA DO CURSO: Make Integração Total

**Duração Total:** 30+ horas | **Aulas:** 180 lições em 6 módulos | **Certificado:** Sim

| Módulo | Título | Duração |
|--------|--------|---------|
| 1 | Fundamentos do Make | 5 horas |
| 2 | Módulos e Conexões | 6 horas |
| 3 | Dados e Transformações | 5 horas |
| 4 | Lógica Avançada | 5 horas |
| 5 | Automações Empresariais | 5 horas |
| 6 | Otimização e Escala | 4 horas |

> **Dica:** O Make oferece plano gratuito com 1.000 operações/mês — perfeito para aprender e testar.

---

# MÓDULO 1: FUNDAMENTOS DO Make — Primeiros Passos

**MÓDULO 1: FUNDAMENTOS DO MAKE**
**AULA 1: PRIMEIROS PASSOS E INTERFACE**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Navegar na interface do Make; 2. Criar seu primeiro cenário funcional.

---

**CONTEÚDO PARA O ALUNO**

**1. O que é o Make e Sua Evolução**

O Make nasceu como Integromat em 2012, na República Tcheca. Em 2022, foi rebatizado como Make, consolidando-se como uma das plataformas de automação mais populares do mundo. Diferente de concorrentes como Zapier, o Make oferece uma interface visual que mostra o fluxo completo de dados, facilitando a criação de automações complexas com branches, loops e processamento paralelo.

**2. Tour pela Interface**

A interface do Make é organizada em: Dashboard (visão geral de cenários e execuções), Scenario Editor (canvas visual para construir automações), Module Library (mais de 1.500 apps disponíveis), Data Stores (banco de dados interno), Webhooks (endpoints para receber dados), Teams & Organizations (gestão de equipe).

**3. Conceitos Fundamentais**

- **Cenário (Scenario):** Um workflow automatizado completo
- **Módulo (Module):** Um bloco que executa uma ação (similar a nodes no n8n)
- **Conexão (Connection):** Link entre módulos por onde dados fluem
- **Operação:** Cada ação executada por um módulo (base de cobrança)
- **Bundle:** Conjunto de dados que flui entre módulos

**4. Seu Primeiro Cenário**

Vamos criar: quando receber email com anexo → salvar anexo no Google Drive → notificar no Slack.

1. Adicione módulo Gmail "Watch Emails" (trigger)
2. Adicione módulo Google Drive "Upload a File"
3. Mapeie o anexo do email para o upload
4. Adicione módulo Slack "Create a Message"
5. Configure mensagem com nome do arquivo e link
6. Ative o cenário (toggle ON)

---

# MÓDULO 1: FUNDAMENTOS DO Make — Dados e Mapeamento

**MÓDULO 1: FUNDAMENTOS DO MAKE**
**AULA 2: DADOS, BUNDLES E MAPEAMENTO**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Entender o fluxo de dados entre módulos; 2. Dominar mapeamento de campos.

---

**CONTEÚDO PARA O ALUNO**

**1. Bundles: A Unidade de Dados**

No Make, dados fluem como **bundles** — pacotes de informações em formato JSON. Cada módulo recebe bundles de entrada, processa e gera bundles de saída. Um email recebido é um bundle; uma linha de planilha é um bundle.

**2. Mapeamento de Campos**

O sistema de mapeamento visual do Make é um dos seus pontos fortes. Ao configurar um módulo, você vê os campos disponíveis dos módulos anteriores como tags clicáveis. Arraste campos para mapear dados entre módulos sem código.

**3. Funções Built-in**

O Make oferece funções poderosas para transformar dados: funções de texto (upper, lower, replace, substring), funções numéricas (round, ceil, floor, max, min), funções de data (formatDate, addDays, parseDate), funções de array (map, get, add, remove, length).

**4. Variáveis e Expressões**

Use expressões para lógica dinâmica: `{{if(1.status = "active"; "Ativo"; "Inativo")}}` — operador ternário inline. Combine múltiplas funções: `{{upper(substring(1.name; 0; 1))}}{{substring(1.name; 1)}}` — capitaliza primeira letra.

---

# MÓDULO 2: MÓDULOS E CONEXÕES — Apps Essenciais

**MÓDULO 2: MÓDULOS E CONEXÕES**
**AULA 1: APLICATIVOS ESSENCIAIS**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Configurar os 20 apps mais usados; 2. Criar conexões e autenticações.

---

**CONTEÚDO PARA O ALUNO**

**1. Google Workspace**

- **Gmail:** Watch/Search/Send emails, gerenciar labels
- **Google Sheets:** Read/Write/Update rows, search, append
- **Google Drive:** Upload/Download, create folders, permissions
- **Google Calendar:** Create/Update events, watch changes
- **Google Docs:** Create/Edit documents, export PDF

**2. Microsoft 365**

- **Outlook:** Emails, calendário, contatos
- **OneDrive/SharePoint:** Documentos e compartilhamento
- **Teams:** Mensagens, canais, reuniões
- **Excel Online:** Planilhas na nuvem

**3. CRM e Vendas**

- **HubSpot:** Contacts, deals, companies, activities
- **Salesforce:** Full CRUD em todos os objetos
- **Pipedrive:** Pipeline management automatizado

**4. Comunicação**

- **Slack:** Messages, channels, reactions, files
- **WhatsApp Business:** Via API oficial ou Twilio
- **Telegram:** Bot API completa

**5. E-commerce e Pagamentos**

- **Shopify:** Orders, products, customers, fulfillment
- **Stripe:** Payments, subscriptions, invoices
- **WooCommerce:** Full integration via REST API

---

# MÓDULO 2: MÓDULOS E CONEXÕES — HTTP e Custom

**MÓDULO 2: MÓDULOS E CONEXÕES**
**AULA 2: HTTP, WEBHOOKS E MÓDULOS CUSTOMIZADOS**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Usar módulo HTTP para APIs customizadas; 2. Criar webhooks para receber dados.

---

**CONTEÚDO PARA O ALUNO**

**1. Módulo HTTP — Make a Request**

O módulo HTTP universal permite conectar com qualquer API: configure URL, método, headers, query params, body. Suporta autenticação Basic, Bearer, OAuth2, API Key. Parse automático de JSON responses.

**2. Webhooks — Recebendo Dados Externos**

Crie Custom Webhooks para receber dados de qualquer fonte. O Make gera uma URL única que aceita POST requests. Ideal para: receber dados de formulários, webhooks de pagamento (Stripe, PagSeguro), notificações de sistemas legados.

**3. JSON e Transformação**

Módulos JSON: Parse JSON (string → objeto), Create JSON (objeto → string), Transform JSON (reestruturar dados), Aggregate to JSON (múltiplos bundles → JSON array).

**4. Data Stores — Banco de Dados Interno**

O Make oferece Data Stores — bancos de dados internos para armazenar e consultar dados entre execuções. Operações: Add/Replace record, Get record, Search records, Delete record, Count records. Ideal para tracking de estados, deduplicação e cache.

**5. Criando Módulos Custom**

Para apps não suportados: use o Custom App SDK do Make para criar módulos reutilizáveis com interface visual, ou simplesmente use HTTP requests com templates documentados.

---

# MÓDULO 3: DADOS E TRANSFORMAÇÕES — Processamento

**MÓDULO 3: DADOS E TRANSFORMAÇÕES**
**AULA 1: PROCESSAMENTO AVANÇADO DE DADOS**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Manipular dados complexos; 2. Usar agregadores e iteradores.

---

**CONTEÚDO PARA O ALUNO**

**1. Iteradores — Processando Arrays**

Quando um bundle contém um array (lista), o Iterator expande cada item em um bundle individual. Exemplo: pedido com 5 itens → Iterator gera 5 bundles, um para cada item → processa individualmente → Aggregator consolida resultados.

**2. Agregadores — Consolidando Dados**

Agregadores fazem o oposto dos iteradores: combinam múltiplos bundles em um. Tipos: Array Aggregator (cria array), Text Aggregator (concatena texto), Numeric Aggregator (soma, média, max, min), Table Aggregator (cria tabela).

**3. Filters — Filtrando Dados**

Adicione filtros entre módulos para processar apenas bundles que atendem condições. Operadores: equal to, not equal to, contains, greater than, exists, matches pattern (regex). Combine condições com AND/OR.

**4. Router e Branches**

O Router divide o fluxo em múltiplos caminhos. Cada rota pode ter um filtro. Bundles que atendem o filtro seguem aquela rota. Rotas sem filtro processam todos os bundles. Use para lógica condicional complexa.

**5. Error Handling**

Diretivas de erro: Ignore (ignora erro, continua), Resume (usa valor default), Commit (confirma até o erro), Rollback (desfaz tudo), Break (para e reprocessa depois). Configure por módulo para controle granular.

---

# MÓDULO 3: DADOS E TRANSFORMAÇÕES — Funções Avançadas

**MÓDULO 3: DADOS E TRANSFORMAÇÕES**
**AULA 2: FUNÇÕES E FÓRMULAS AVANÇADAS**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Dominar funções de transformação; 2. Criar fórmulas complexas.

---

**CONTEÚDO PARA O ALUNO**

**1. Funções de Texto Avançadas**

- `replace(text; pattern; replacement)` — substituir com regex
- `split(text; separator)` — dividir texto em array
- `join(array; separator)` — unir array em texto
- `trim(text)` — remover espaços
- `md5(text)` / `sha256(text)` — hash para deduplicação

**2. Funções de Data e Hora**

- `formatDate(date; format)` — formatar datas (DD/MM/YYYY, etc.)
- `addDays(date; N)` — adicionar dias
- `dateDifference(date1; date2; unit)` — diferença entre datas
- `parseDate(text; format)` — converter texto em data

**3. Funções de Array**

- `map(array; key)` — extrair campo de cada item
- `get(array; index)` — pegar item por índice
- `sort(array; key; order)` — ordenar array
- `distinct(array; key)` — remover duplicatas
- `slice(array; start; end)` — fatiar array

**4. Expressões Condicionais**

- `if(condition; valueTrue; valueFalse)` — if/else inline
- `ifempty(value; default)` — valor default se vazio
- `switch(value; case1; result1; case2; result2; default)` — múltiplas condições
- `emptyarray` / `emptystring` — valores vazios para inicialização

---

# MÓDULO 4: LÓGICA AVANÇADA — Cenários Complexos

**MÓDULO 4: LÓGICA AVANÇADA**
**AULA 1: CENÁRIOS COMPLEXOS E PADRÕES**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Implementar padrões de design; 2. Criar cenários robustos.

---

**CONTEÚDO PARA O ALUNO**

**1. Padrão: Multi-Branch com Router**

Cenário de processamento de pedidos: Pedido recebido → Router:
- Rota 1 (valor > R$500): Aprovação manual → email para gerente
- Rota 2 (valor ≤ R$500): Aprovação automática → processar
- Rota 3 (todas): Registrar no log → atualizar dashboard

**2. Padrão: Lookup e Enriquecimento**

Dado bruto → buscar informações complementares → combinar → resultado enriquecido. Exemplo: lead com email → buscar no CRM (nome, empresa) → buscar no LinkedIn (cargo, senioridade) → calcular score → decisão.

**3. Padrão: Batch Processing**

Processar grandes volumes respeitando limites: usar Schedule trigger (a cada hora), buscar items pendentes do Data Store, processar em lotes de 100 com Sleep entre batches, marcar como processado.

**4. Padrão: Webhook → Queue → Process**

Para alta carga: Webhook recebe dados → salva no Data Store (fila) → cenário separado processa a fila periodicamente. Desacopla recebimento de processamento, evitando timeouts.

**5. Cenários Encadeados**

Um cenário pode triggerar outro via HTTP request ao webhook do segundo cenário. Permite: modularidade (cenários menores e reutilizáveis), retry independente, limites de operações separados.

---

# MÓDULO 4: LÓGICA AVANÇADA — Otimização

**MÓDULO 4: LÓGICA AVANÇADA**
**AULA 2: OTIMIZAÇÃO E PERFORMANCE**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Otimizar uso de operações; 2. Reduzir custos e melhorar velocidade.

---

**CONTEÚDO PARA O ALUNO**

**1. Economia de Operações**

Cada módulo executado = 1 operação (base de cobrança). Estratégias: use filtros antes de módulos caros, combine dados com Aggregator antes de salvar, use Data Stores para cache, evite iteradores desnecessários.

**2. Scheduling Inteligente**

Nem todo cenário precisa rodar em tempo real. Agrupe execuções: processamento de emails a cada 15 min (não a cada 1 min), relatórios diários às 6h da manhã, sincronizações a cada hora durante horário comercial.

**3. Tratamento de Rate Limits**

APIs têm limites. No Make: use Sleep entre operações, configure retry automático, distribua operações ao longo do tempo, use Data Store como buffer.

**4. Monitoramento**

Dashboard do Make mostra: operações usadas vs disponíveis, cenários com mais erros, tempo de execução por cenário, histórico de execuções. Configure notificações para erros críticos.

---

# MÓDULO 5: AUTOMAÇÕES EMPRESARIAIS — Marketing

**MÓDULO 5: AUTOMAÇÕES EMPRESARIAIS**
**AULA 1: MARKETING E VENDAS AUTOMATIZADOS**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Automatizar pipeline completo de marketing; 2. Integrar CRM com automações.

---

**CONTEÚDO PARA O ALUNO**

**1. Pipeline de Marketing Automatizado**

Visitante no site → preenche formulário (Typeform/Google Forms) → Make recebe via webhook → adiciona ao CRM (HubSpot) → envia welcome email (Mailchimp) → adiciona ao Google Sheet de tracking → notifica vendedor no Slack (se lead qualificado).

**2. Social Media Automation**

Calendário editorial no Google Sheets → Make lê posts agendados → formata para cada rede → publica via APIs (Instagram Graph, LinkedIn, Twitter/X) → monitora engajamento → relatório semanal.

**3. Retargeting Automatizado**

Lead não converteu em 7 dias → Make busca no CRM → segmenta por comportamento → cria audiência custom no Facebook/Google Ads → ativa campanha de retargeting → monitora conversão → desativa quando converter.

**4. Análise de Campanhas**

Diariamente: coletar dados de Google Ads, Meta Ads, Google Analytics → consolidar no Google Sheets → calcular CAC, ROAS, CPC → alertar se métricas fora do esperado → relatório executivo semanal.

---

# MÓDULO 5: AUTOMAÇÕES EMPRESARIAIS — Operações

**MÓDULO 5: AUTOMAÇÕES EMPRESARIAIS**
**AULA 2: OPERAÇÕES E PROCESSOS INTERNOS**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Automatizar processos internos; 2. Criar sistemas de gestão.

---

**CONTEÚDO PARA O ALUNO**

**1. Gestão de Propostas e Contratos**

Cliente aprova proposta → gerar contrato (Google Docs template) → enviar para assinatura (DocuSign) → quando assinado → salvar no Drive → atualizar CRM → emitir primeira fatura → notificar equipe de entrega.

**2. Gestão Financeira**

Pagamento confirmado (Stripe/PagSeguro) → atualizar status no CRM → emitir nota fiscal (API NFe) → registrar no controle financeiro (Sheets) → enviar nota por email → reconciliar com banco mensalmente.

**3. Gestão de Equipe**

Timesheet preenchido (Toggl/Clockify) → Make calcula horas por projeto → compara com orçado → alerta se exceder 80% do budget → relatório semanal por projeto → dashboard mensal de produtividade.

**4. Inteligência Artificial no Make**

Integre IA nos cenários: texto recebido → OpenAI analisa/classifica → Router decide ação → executa. Use para: classificação automática de tickets, geração de respostas, análise de sentimento, tradução automática.

---

# MÓDULO 6: ESCALA — Planos e Custos

**MÓDULO 6: OTIMIZAÇÃO E ESCALA**
**AULA 1: GESTÃO DE PLANOS E CUSTOS**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Otimizar custos no Make; 2. Escalar automações.

---

**CONTEÚDO PARA O ALUNO**

**1. Planos do Make**

| Plano | Operações/mês | Cenários | Preço |
|-------|--------------|----------|-------|
| Free | 1.000 | 2 | $0 |
| Core | 10.000 | Ilimitado | $9/mês |
| Pro | 10.000 | Ilimitado | $16/mês |
| Teams | 10.000 | Ilimitado | $29/mês |
| Enterprise | Custom | Ilimitado | Custom |

**2. Calculando Operações**

Cada módulo executado = 1 operação. Cenário com 5 módulos processando 100 itens = 500 operações. Filtros e routers não contam como operações. Data Store operations contam. Planeje seu uso para escolher o plano certo.

**3. Estratégias de Economia**

Consolidar módulos, usar filtros antes de operações caras, agrupar execuções por schedule, usar Data Stores para cache, evitar webhooks com alta frequência desnecessária.

---

# MÓDULO 6: ESCALA — Make como Serviço

**MÓDULO 6: OTIMIZAÇÃO E ESCALA**
**AULA 2: MAKE COMO SERVIÇO PROFISSIONAL**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Oferecer automação como serviço; 2. Precificar e entregar projetos.

---

**CONTEÚDO PARA O ALUNO**

**1. Automação como Serviço (AaaS)**

O mercado de automação está em boom. Profissionais de Make cobram R$150-500/hora para criar cenários. Projetos completos variam de R$2.000 a R$20.000+. O curso te prepara para atender esse mercado.

**2. Como Precificar**

- **Por hora:** R$150-500 (depende da complexidade e senioridade)
- **Por projeto:** Escopo fechado com entregáveis definidos
- **Retainer:** Mensalidade para manutenção e novos cenários
- **Revenue share:** Porcentagem da economia gerada pela automação

**3. Processo de Entrega**

1. Discovery: entender processos atuais do cliente
2. Mapping: documentar fluxos e identificar automações
3. Design: projetar cenários no Make
4. Build: implementar e testar
5. Deploy: ativar e monitorar
6. Handover: treinar equipe e documentar

**4. Portfolio de Serviços**

Tipos de projetos mais lucrativos: integrações CRM-Marketing, automação de e-commerce, gestão de leads, relatórios automatizados, chatbots com IA.

---

# TEMPLATE: Integração CRM-Email Marketing

**TEMPLATE — Sincronização CRM ↔ Email Marketing**

**Cenário:** HubSpot + Mailchimp bidirectional sync

1. **Trigger:** Watch HubSpot contacts (new/updated)
2. **Router:** Verificar se já existe no Mailchimp
3. **Rota A (novo):** Add subscriber ao Mailchimp
4. **Rota B (existente):** Update subscriber no Mailchimp
5. **Tags:** Aplicar tags baseado em lifecycle stage
6. **Reverse:** Watch Mailchimp → update HubSpot (cenário separado)

---

# TEMPLATE: E-commerce Order Processing

**TEMPLATE — Processamento Automático de Pedidos**

**Cenário:** Shopify → Make → Múltiplos destinos

1. **Trigger:** Watch Shopify orders (new)
2. **Filter:** Apenas pedidos pagos
3. **Router:**
   - Rota 1: Atualizar estoque (Google Sheets/ERP)
   - Rota 2: Notificar logística (Email/Slack)
   - Rota 3: Enviar confirmação ao cliente (Email personalizado)
   - Rota 4: Registrar no financeiro (planilha/contabilidade)
4. **Pós-envio:** Tracking → email com rastreamento → review request (7 dias)

---

# EXERCÍCIO: Automação de Onboarding

**EXERCÍCIO PRÁTICO — Onboarding de Clientes Automatizado**

**Duração:** 60 min | **Objetivo:** Sistema completo de onboarding

1. Formulário de boas-vindas (Typeform) → Make
2. Criar pasta no Google Drive com nome do cliente
3. Gerar documento de briefing (template Google Docs)
4. Criar projeto no Trello/Asana com checklist padrão
5. Enviar welcome email com acesso e próximos passos
6. Agendar reunião de kickoff (Google Calendar)
7. Notificar equipe no Slack com resumo do novo cliente

---

# PROJETO FINAL: Sistema de Automação Empresarial

**PROJETO FINAL — Automação Empresarial Completa**

**Duração:** 5-7 horas | **Nível:** Avançado

**Entregáveis:**

1. **Pipeline Comercial** — Lead → qualificação → proposta → contrato → onboarding
2. **Marketing Automation** — Conteúdo → publicação → métricas → relatórios
3. **Operações** — Pedidos → logística → financeiro → pós-venda
4. **Dashboard** — KPIs consolidados de todos os processos
5. **Documentação** — Fluxogramas, configurações, manutenção

| Critério | Peso |
|----------|------|
| Funcionalidade | 30% |
| Robustez (error handling) | 25% |
| Documentação | 20% |
| Inovação | 25% |

---

# Recursos Adicionais e Próximos Passos

Parabéns por completar **Make: Integração Total**!

**Próximos passos:**
1. Automatize 1 processo por semana
2. Combine Make com IA (OpenAI, Claude)
3. Ofereça automação como serviço
4. Explore n8n como complemento (self-hosted)

**Recursos:**
- [Make Academy](https://academy.make.com)
- [Make Community](https://community.make.com)
- [Templates oficiais](https://make.com/templates)
- Comunidade FayaPoint no Discord

**Suporte:** suporte@fayapoint.com | WhatsApp: +5521971908530
