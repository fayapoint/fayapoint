# Apresentação

Seja bem-vindo ao curso **n8n: Automação Avançada para Empresas** — o guia definitivo para dominar a plataforma de automação mais poderosa e flexível do mercado.

O n8n é uma ferramenta open source de automação de workflows que permite conectar centenas de aplicações, criar fluxos complexos e automatizar processos inteiros sem depender de plataformas proprietárias caras. Neste curso, você aprenderá desde os fundamentos até técnicas avançadas de automação empresarial.

**O que você vai conquistar:**
- Dominar o n8n do básico ao avançado
- Criar automações complexas multi-etapas
- Integrar dezenas de ferramentas e APIs
- Automatizar processos empresariais completos
- Construir soluções de automação como serviço

**Pré-requisitos:** Conhecimento básico de lógica e vontade de aprender. Programação é um diferencial mas não obrigatório.

---

# ESTRUTURA DO CURSO: n8n Automação Avançada

**Duração Total:** 35+ horas | **Aulas:** 200 lições em 6 módulos | **Certificado:** Sim

| Módulo | Título | Duração |
|--------|--------|---------|
| 1 | Fundamentos do n8n | 5 horas |
| 2 | Nodes e Integrações | 7 horas |
| 3 | Lógica e Fluxos Avançados | 6 horas |
| 4 | APIs e Webhooks | 6 horas |
| 5 | Automação Empresarial | 6 horas |
| 6 | Deploy e Produção | 5 horas |

> O n8n é self-hosted e gratuito — você terá controle total sobre seus dados e automações.

---

# MÓDULO 1: FUNDAMENTOS DO n8n — Instalação e Configuração

**MÓDULO 1: FUNDAMENTOS DO n8n**
**AULA 1: INSTALAÇÃO E CONFIGURAÇÃO**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Instalar n8n em diferentes ambientes; 2. Configurar o ambiente de trabalho.

---

**CONTEÚDO PARA O ALUNO**

**1. O que é o n8n e Por Que Escolhê-lo**

O n8n (pronuncia-se "nodemation") é uma plataforma de automação de workflows open source criada por Jan Oberhauser em 2019. Diferente de ferramentas proprietárias como Zapier ou Make, o n8n oferece controle total: você pode hospedá-lo em seu próprio servidor, customizar nodes, acessar o código fonte e não tem limites artificiais de execuções.

Vantagens competitivas do n8n: código aberto e auditável, self-hosted (seus dados ficam com você), sem limites de execuções no plano self-hosted, nodes customizáveis com JavaScript, comunidade ativa com 400+ integrações nativas, interface visual intuitiva de arrastar e soltar.

**2. Métodos de Instalação**

**Via npm (desenvolvimento):**
```bash
npm install n8n -g
n8n start
```

**Via Docker (recomendado para produção):**
```bash
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
```

**Via Docker Compose (completo):**
```yaml
version: "3"
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=sua_senha
```

**n8n Cloud:** Para quem prefere solução gerenciada — planos a partir de $20/mês com hosting, SSL e backups automáticos.

**3. Tour pela Interface**

A interface do n8n é dividida em: Canvas principal (onde você constrói workflows arrastando nodes), Painel lateral (configuração de nodes), Barra de ferramentas (executar, salvar, compartilhar), Menu de nodes (busca e categorias), Histórico de execuções (logs e debugging).

**4. Seu Primeiro Workflow**

Vamos criar um workflow simples: quando receber um webhook, enviar notificação por email.

1. Adicione node "Webhook" (trigger)
2. Adicione node "Send Email" (action)
3. Conecte os dois nodes
4. Configure credenciais de email
5. Teste clicando "Execute Workflow"

---

# MÓDULO 1: FUNDAMENTOS DO n8n — Conceitos Essenciais

**MÓDULO 1: FUNDAMENTOS DO n8n**
**AULA 2: CONCEITOS ESSENCIAIS**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Entender nodes, conexões e dados; 2. Dominar o fluxo de informações.

---

**CONTEÚDO PARA O ALUNO**

**1. Nodes: Os Blocos de Construção**

Tudo no n8n gira em torno de **nodes** — blocos que executam ações específicas. Existem tipos fundamentais:

- **Trigger Nodes:** Iniciam o workflow (Webhook, Schedule, Email, etc.)
- **Action Nodes:** Executam operações (HTTP Request, Gmail, Slack, etc.)
- **Flow Nodes:** Controlam lógica (IF, Switch, Merge, Loop, etc.)
- **Transform Nodes:** Manipulam dados (Set, Function, Spreadsheet, etc.)

**2. Dados e JSON**

Os dados fluem entre nodes no formato JSON. Cada item processado é um objeto JSON:

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "score": 85
}
```

Entender JSON é fundamental para manipular dados no n8n. Você pode acessar campos com expressões: `{{ $json.name }}` retorna "João Silva".

**3. Expressões e Variáveis**

O n8n usa expressões para acessar e transformar dados dinamicamente:

- `{{ $json.campo }}` — Acessa campo do item atual
- `{{ $node["NomeNode"].json.campo }}` — Acessa dados de outro node
- `{{ $now }}` — Data/hora atual
- `{{ $workflow.id }}` — ID do workflow
- `{{ $execution.id }}` — ID da execução atual

**4. Credenciais e Segurança**

Credenciais são armazenadas de forma segura e criptografada. Para cada serviço que você integra, crie uma credencial com as chaves de API necessárias. As credenciais são reutilizáveis entre workflows e nunca expostas nos logs.

---

# MÓDULO 2: NODES E INTEGRAÇÕES — Principais Nodes

**MÓDULO 2: NODES E INTEGRAÇÕES**
**AULA 1: OS NODES MAIS PODEROSOS**

**Carga Horária:** 4 horas
**Indicadores Trabalhados:** 1. Dominar os 20 nodes mais usados; 2. Configurar integrações complexas.

---

**CONTEÚDO PARA O ALUNO**

**1. HTTP Request — O Node Universal**

O HTTP Request é o node mais versátil: permite conectar com QUALQUER API que aceite requisições HTTP.

Configurações essenciais: método (GET, POST, PUT, DELETE), URL, headers, body (JSON, form-data), autenticação (Bearer, Basic, OAuth2), tratamento de respostas e erros. Com este único node, você pode integrar serviços que não têm nodes nativos no n8n.

**2. Nodes de Comunicação**

- **Gmail/Outlook:** Enviar, ler, organizar emails
- **Slack:** Mensagens, canais, reações, threads
- **Telegram:** Bot messages, grupos, inline queries
- **WhatsApp Business:** Mensagens via API oficial
- **Discord:** Webhooks, mensagens em canais

**3. Nodes de Dados**

- **Google Sheets:** CRUD completo em planilhas
- **Airtable:** Database visual com automação
- **MongoDB:** Queries, inserts, updates em NoSQL
- **PostgreSQL/MySQL:** SQL completo em bancos relacionais
- **Redis:** Cache e pub/sub

**4. Nodes de Produtividade**

- **Notion:** Páginas, databases, blocos
- **Trello:** Cards, boards, listas
- **Asana:** Tasks, projects, workspaces
- **Google Calendar:** Eventos, convites, lembretes
- **Todoist:** Tarefas e projetos

**5. Nodes de Marketing**

- **Mailchimp:** Listas, campanhas, automações
- **HubSpot:** CRM, deals, contacts
- **ActiveCampaign:** Automação de email marketing
- **Google Ads:** Relatórios e gestão de campanhas

---

# MÓDULO 2: NODES E INTEGRAÇÕES — Nodes de Transformação

**MÓDULO 2: NODES E INTEGRAÇÕES**
**AULA 2: TRANSFORMAÇÃO E MANIPULAÇÃO DE DADOS**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Transformar dados entre formatos; 2. Manipular arrays e objetos complexos.

---

**CONTEÚDO PARA O ALUNO**

**1. Set Node — Definir e Modificar Dados**

O Set node permite criar, modificar e remover campos dos dados. Uso comum: preparar dados antes de enviar para outro serviço, renomear campos, adicionar campos calculados, remover dados sensíveis.

**2. Function Node — JavaScript Personalizado**

Quando os nodes nativos não são suficientes, o Function node permite escrever JavaScript customizado:

```javascript
// Processar cada item
for (const item of items) {
  item.json.fullName = `${item.json.firstName} ${item.json.lastName}`;
  item.json.processedAt = new Date().toISOString();
}
return items;
```

**3. Code Node — Python e JavaScript**

O Code node é a evolução do Function node, suportando Python além de JavaScript, com melhor editor e autocomplete.

**4. Spreadsheet Node**

Converte dados entre JSON, CSV e Excel. Ideal para: gerar relatórios, processar uploads de planilhas, exportar dados para análise. Suporta operações como filtro, ordenação e agregação.

**5. Merge Node — Combinar Dados**

Combina dados de múltiplas fontes: Append (juntar listas), Merge by Key (join SQL-like), Keep Key Matches (intersection), Remove Key Matches (difference). Essencial para workflows com múltiplos branches.

**6. Split In Batches — Processamento em Lotes**

Processa grandes volumes de dados em lotes menores para evitar rate limits de APIs. Configure tamanho do lote e delay entre batches.

---

# MÓDULO 3: LÓGICA E FLUXOS — Condicionais e Loops

**MÓDULO 3: LÓGICA E FLUXOS AVANÇADOS**
**AULA 1: CONDICIONAIS, LOOPS E BRANCHES**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Criar fluxos condicionais complexos; 2. Implementar loops e iterações.

---

**CONTEÚDO PARA O ALUNO**

**1. IF Node — Decisões no Workflow**

O IF node divide o fluxo em dois caminhos baseado em condições: True e False. Condições disponíveis: igual a, diferente de, contém, maior que, menor que, regex match, existe, não existe.

Exemplo: Se o score do lead > 80, enviar para equipe de vendas. Se não, adicionar à sequência de nurturing.

**2. Switch Node — Múltiplos Caminhos**

Quando precisa de mais de 2 caminhos, use Switch. Define regras para cada saída:
- Saída 1: tipo = "urgente" → Slack imediato
- Saída 2: tipo = "normal" → Email
- Saída 3: tipo = "baixa" → Planilha para revisão semanal
- Fallback: Log para análise

**3. Loop Over Items**

Processa items individualmente, permitindo ações diferentes para cada um. Útil quando cada item precisa de processamento independente com possibilidade de retry individual.

**4. Error Handling**

Configure tratamento de erros robusto: Error Trigger (node dedicado para erros), Continue on Fail (não para o workflow), Retry on Fail (tenta novamente com backoff), Error Workflow (workflow separado para erros).

**5. Sub-Workflows**

Quebre workflows complexos em sub-workflows reutilizáveis. O node "Execute Workflow" permite chamar outro workflow, passando dados e recebendo resultados. Benefícios: modularidade, reutilização, manutenção simplificada.

---

# MÓDULO 3: LÓGICA E FLUXOS — Workflows Complexos

**MÓDULO 3: LÓGICA E FLUXOS AVANÇADOS**
**AULA 2: PADRÕES DE WORKFLOWS COMPLEXOS**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Implementar padrões de design para workflows; 2. Criar sistemas resilientes.

---

**CONTEÚDO PARA O ALUNO**

**1. Padrão: Fan-Out / Fan-In**

Divide processamento em branches paralelas e depois consolida. Exemplo: receber pedido → verificar estoque (branch 1) + calcular frete (branch 2) + validar pagamento (branch 3) → Merge → confirmar pedido.

**2. Padrão: Retry com Dead Letter Queue**

Quando uma operação falha após retries, envia para uma "fila morta" para análise posterior:
1. Tenta operação (max 3 retries)
2. Se falhar → salva em Google Sheet "Erros"
3. Notifica admin no Slack
4. Workflow separado processa erros diariamente

**3. Padrão: Scheduler com Debounce**

Previne execuções duplicadas quando múltiplos triggers disparam simultaneamente. Usa Redis ou banco de dados para tracking de execuções recentes.

**4. Padrão: Pipeline de Dados**

Processa dados em etapas sequenciais: Extração → Validação → Transformação → Enriquecimento → Carga. Cada etapa é um sub-workflow com error handling independente.

**5. Padrão: Event-Driven**

Workflows que reagem a eventos externos: webhooks de pagamento, mudanças em banco de dados, mensagens em filas. Use triggers apropriados e garanta idempotência (processar o mesmo evento duas vezes não causa efeitos colaterais).

---

# MÓDULO 4: APIs E WEBHOOKS — Criando APIs

**MÓDULO 4: APIs E WEBHOOKS**
**AULA 1: CRIANDO APIs COM n8n**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Criar APIs REST com Webhooks; 2. Implementar autenticação e validação.

---

**CONTEÚDO PARA O ALUNO**

**1. Webhook como API Endpoint**

O node Webhook do n8n cria endpoints HTTP que podem receber dados externos. Cada webhook gera uma URL única que aceita requisições GET, POST, PUT, DELETE.

**2. Construindo uma API REST Completa**

Crie múltiplos workflows, um para cada endpoint:
- GET /api/clientes → Lista clientes do banco
- POST /api/clientes → Cria novo cliente
- PUT /api/clientes/:id → Atualiza cliente
- DELETE /api/clientes/:id → Remove cliente

Cada workflow valida dados, executa operação no banco, e retorna resposta formatada.

**3. Autenticação e Segurança**

- **Header Authentication:** Valide API keys no header
- **Basic Auth:** Username e password
- **IP Whitelist:** Aceite apenas IPs autorizados
- **Rate Limiting:** Limite requisições por período
- **Input Validation:** Valide todos os dados recebidos

**4. Respondendo com Dados**

Use o node "Respond to Webhook" para retornar dados customizados: status code, headers, body JSON. Sempre retorne respostas consistentes com mensagens de erro claras.

**5. Documentação da API**

Documente seus endpoints: URL, método, headers necessários, body schema, exemplos de request/response, códigos de erro.

---

# MÓDULO 4: APIs E WEBHOOKS — Integrações Avançadas

**MÓDULO 4: APIs E WEBHOOKS**
**AULA 2: INTEGRAÇÕES COM APIS EXTERNAS**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Integrar APIs de terceiros; 2. Tratar autenticação OAuth2.

---

**CONTEÚDO PARA O ALUNO**

**1. OAuth2 no n8n**

Muitas APIs modernas usam OAuth2. O n8n suporta nativamente: Authorization Code, Client Credentials, Implicit. Configure: client ID, client secret, authorize URL, token URL, scopes.

**2. Paginação de APIs**

APIs retornam dados paginados. Implemente loops de paginação: faça request → verifique se há próxima página → repita até acabar. Use o Loop node com HTTP Request para automatizar.

**3. Rate Limiting Inteligente**

Respeite limites de APIs: use Wait node entre requests, Split In Batches para processar em lotes, monitore headers de rate limit (X-RateLimit-Remaining).

**4. Transformação de Dados Entre APIs**

Frequentemente os dados de uma API não estão no formato que outra espera. Use Function/Set nodes para mapear campos, converter tipos, formatar datas, e normalizar estruturas.

**5. Webhooks Recebidos**

Configure webhooks de serviços externos: Stripe (pagamentos), GitHub (commits, PRs), Shopify (pedidos), Google Forms (respostas). Cada serviço tem seu formato — normalize os dados no n8n antes de processar.

---

# MÓDULO 5: AUTOMAÇÃO EMPRESARIAL — CRM e Vendas

**MÓDULO 5: AUTOMAÇÃO EMPRESARIAL**
**AULA 1: CRM, VENDAS E MARKETING AUTOMATIZADO**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Automatizar pipeline de vendas; 2. Criar automações de marketing.

---

**CONTEÚDO PARA O ALUNO**

**1. Pipeline de Vendas Automatizado**

Automatize todo o ciclo de vendas: novo lead chega (formulário/ads) → enriquecimento de dados → scoring → distribuição para vendedor → follow-up automático → tracking de atividades → relatórios.

**2. Lead Scoring com n8n**

Crie sistema de pontuação automática: +10 por visita ao site, +20 por download de material, +30 por abertura de email, +50 por preenchimento de formulário. Quando score > 80: notificar vendedor no Slack + criar deal no CRM.

**3. Email Marketing Automatizado**

Integre com Mailchimp/ActiveCampaign: novo subscriber → welcome sequence → segmentação por comportamento → campanhas personalizadas → tracking de métricas.

**4. Social Media Automation**

Publique conteúdo automaticamente: Google Sheets (calendário editorial) → n8n (schedule + formatação) → Buffer/Hootsuite ou APIs diretas → relatório de performance semanal.

**5. Relatórios Automáticos**

Todo fim de semana: colete dados de vendas, marketing, suporte → consolide em dashboard → gere PDF com KPIs → envie por email para gestão.

---

# MÓDULO 5: AUTOMAÇÃO EMPRESARIAL — Operações e Suporte

**MÓDULO 5: AUTOMAÇÃO EMPRESARIAL**
**AULA 2: OPERAÇÕES, SUPORTE E PROCESSOS**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Automatizar operações internas; 2. Criar sistemas de suporte eficientes.

---

**CONTEÚDO PARA O ALUNO**

**1. Automação de Suporte ao Cliente**

Ticket recebido → classificação automática (IA/keywords) → roteamento por expertise → SLA tracking → escalation automática → pesquisa de satisfação pós-resolução.

**2. Onboarding Automatizado**

Novo funcionário cadastrado → criar contas (Google, Slack, Notion) → enviar welcome kit por email → agendar reuniões de onboarding → atribuir treinamentos → follow-up de 30/60/90 dias.

**3. Gestão de Documentos**

Contrato assinado (DocuSign/SignNow) → salvar no Google Drive → atualizar planilha de contratos → notificar financeiro → agendar lembrete de renovação.

**4. Monitoramento e Alertas**

Monitore serviços: ping a cada 5 minutos → se down → alerta Slack/Telegram → abrir ticket → escalar se não resolver em 30min → relatório de uptime mensal.

**5. Integração com IA**

Combine n8n com IA: texto recebido → análise de sentimento com OpenAI → classificação automática → resposta sugerida → aprovação humana → envio. Perfeito para suporte, moderação de conteúdo e análise de feedback.

---

# MÓDULO 6: DEPLOY E PRODUÇÃO — Infraestrutura

**MÓDULO 6: DEPLOY E PRODUÇÃO**
**AULA 1: INFRAESTRUTURA E DEPLOY**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Fazer deploy profissional do n8n; 2. Configurar para alta disponibilidade.

---

**CONTEÚDO PARA O ALUNO**

**1. Deploy com Docker Compose**

Configuração completa para produção: n8n + PostgreSQL + Redis + Nginx + SSL (Let's Encrypt). Docker Compose orquestra todos os serviços com volumes persistentes, restart automático e logging centralizado.

**2. Deploy em Cloud**

Opções populares: DigitalOcean ($12/mês), AWS EC2/ECS, Google Cloud Run, Railway, Render. Para cada plataforma: configuração, estimativa de custos, prós e contras.

**3. Banco de Dados em Produção**

SQLite é ok para desenvolvimento; para produção use PostgreSQL. Configuração: conexão, migrations, backups automáticos, monitoramento de performance.

**4. SSL e Domínio**

Configure SSL com Nginx reverse proxy e Let's Encrypt: domínio apontando para servidor, Nginx como proxy para n8n na porta 5678, certificado SSL automático e renovação.

**5. Variáveis de Ambiente**

Configurações essenciais de produção: N8N_ENCRYPTION_KEY, N8N_HOST, N8N_PORT, N8N_PROTOCOL, DB_TYPE, DB_POSTGRESDB_HOST, WEBHOOK_URL, GENERIC_TIMEZONE.

---

# MÓDULO 6: DEPLOY E PRODUÇÃO — Monitoramento

**MÓDULO 6: DEPLOY E PRODUÇÃO**
**AULA 2: MONITORAMENTO, BACKUP E ESCALABILIDADE**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Monitorar workflows em produção; 2. Implementar estratégias de backup.

---

**CONTEÚDO PARA O ALUNO**

**1. Monitoramento de Execuções**

Painel de execuções do n8n: filtros por status (sucesso/erro/running), tempo de execução, uso de memória. Configure alertas para: falhas em workflows críticos, tempo de execução acima do esperado, erros recorrentes.

**2. Logging Centralizado**

Configure logging para ferramentas externas: envie logs do n8n para serviços como Datadog, Grafana/Loki, ou simplesmente para arquivos com rotação. Níveis: error, warn, info, debug.

**3. Estratégia de Backup**

- **Workflows:** Export JSON regular (automático via API do n8n)
- **Credenciais:** Backup criptografado do banco
- **Banco de dados:** pg_dump diário com retenção de 30 dias
- **Volumes Docker:** Snapshot periódico

**4. Escalabilidade**

Para alto volume: modo Queue com Redis (múltiplos workers processam em paralelo), escalamento horizontal com Docker Swarm ou Kubernetes, separação de workers por tipo de workflow.

**5. Segurança em Produção**

Checklist: autenticação ativa, HTTPS obrigatório, firewall configurado, credenciais criptografadas, updates regulares, audit log habilitado, acesso restrito por IP.

---

# TEMPLATE: Automação de Lead Nurturing

**TEMPLATE — Automação Completa de Lead Nurturing**

**Workflow:** Novo lead → Enriquecimento → Scoring → Segmentação → Nurturing Personalizado

**Nodes necessários:**
1. Webhook (recebe lead de formulário/ads)
2. HTTP Request (enriquecimento via API Clearbit/FullContact)
3. Function (calcular lead score)
4. Switch (segmentar por score: quente/morno/frio)
5. Gmail/Mailchimp (enviar sequência apropriada)
6. Google Sheets (registrar para relatórios)
7. Slack (notificar vendedores para leads quentes)

**Regras de scoring:** Cargo C-level (+30), empresa >50 funcionários (+20), setor target (+15), interagiu com conteúdo (+10 por interação).

---

# TEMPLATE: Relatório Automático Semanal

**TEMPLATE — Relatório Semanal Automatizado**

**Trigger:** Schedule node — toda sexta-feira às 17h

**Fluxo:**
1. Coletar dados de vendas (CRM API)
2. Coletar métricas de marketing (Google Analytics API)
3. Coletar tickets de suporte (Zendesk API)
4. Merge todos os dados
5. Function: calcular KPIs (receita, CAC, churn, NPS)
6. Gerar HTML do relatório com template
7. Enviar por email para gestão
8. Salvar backup no Google Drive

---

# EXERCÍCIO: Chatbot com IA no Telegram

**EXERCÍCIO PRÁTICO — Chatbot Inteligente no Telegram**

**Duração:** 90 min | **Objetivo:** Bot que responde perguntas usando OpenAI

1. Crie bot no Telegram via @BotFather
2. Configure Webhook Trigger para mensagens do Telegram
3. Extraia texto da mensagem recebida
4. Envie para OpenAI API com contexto personalizado
5. Retorne resposta ao usuário via Telegram Send Message
6. Salve histórico de conversas no Google Sheets
7. Adicione rate limiting (máx 10 msgs/min por usuário)

---

# EXERCÍCIO: Sistema de Monitoramento

**EXERCÍCIO PRÁTICO — Monitor de Uptime com Alertas**

**Duração:** 60 min | **Objetivo:** Monitorar sites e alertar sobre downtime

1. Schedule Trigger: a cada 5 minutos
2. HTTP Request: GET para cada URL monitorada
3. IF: status code != 200
4. Se down: Slack + Email + registrar no Google Sheets
5. Se up novamente: notificar recuperação
6. Relatório diário de uptime por site

---

# PROJETO FINAL: Sistema de Automação Empresarial

**PROJETO FINAL — Sistema Completo de Automação**

**Duração:** 6-8 horas | **Nível:** Avançado

**Entregáveis:**

1. **Pipeline de Vendas** — Lead capture → scoring → CRM → follow-up automatizado
2. **Marketing Automation** — Calendário editorial → publicação → métricas
3. **Suporte Automatizado** — Ticket routing → SLA → escalation → satisfação
4. **Relatórios** — Dashboard semanal automático com KPIs
5. **Documentação** — Diagramas de fluxo, credenciais, manutenção

| Critério | Peso |
|----------|------|
| Funcionalidade completa | 30% |
| Error handling e resiliência | 25% |
| Documentação | 20% |
| Criatividade e eficiência | 25% |

---

# Recursos Adicionais e Próximos Passos

Parabéns por completar o curso **n8n: Automação Avançada**!

**Próximos passos:**
1. **Automatize 1 processo por semana** na sua empresa
2. **Contribua com a comunidade** — crie e compartilhe workflows
3. **Explore integrações com IA** — combine n8n com OpenAI, Claude, Gemini
4. **Ofereça automação como serviço** — consultoria para empresas

**Recursos:**
- [Documentação oficial n8n](https://docs.n8n.io)
- [n8n Community](https://community.n8n.io)
- [Templates oficiais](https://n8n.io/workflows)
- Comunidade FayaPoint no Discord

**Suporte:** suporte@fayapoint.com | WhatsApp: +5521971908530
