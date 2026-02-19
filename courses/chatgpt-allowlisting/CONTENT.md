# Apresentação

Bem-vindo ao curso **ChatGPT Allowlisting: Acesso Empresarial e Compliance** — o guia completo para implementar ChatGPT de forma segura e regulamentada em ambientes corporativos.

Com a adoção massiva de IA nas empresas, surge o desafio de equilibrar produtividade com segurança, compliance e governança. O processo de "allowlisting" (lista de permissão) do ChatGPT envolve aprovar, configurar e monitorar o uso de IA generativa em ambiente corporativo, garantindo conformidade com políticas internas e regulamentações como LGPD e GDPR.

**O que você vai conquistar:**
- Implementar ChatGPT em ambientes corporativos com segurança
- Criar políticas de uso de IA para empresas
- Configurar ChatGPT Enterprise e Team
- Garantir compliance com LGPD, GDPR e políticas internas
- Monitorar e auditar uso de IA na organização

---

# ESTRUTURA DO CURSO: ChatGPT Allowlisting

**Duração Total:** 20+ horas | **Aulas:** 120 lições em 6 módulos | **Certificado:** Sim

| Módulo | Título | Duração |
|--------|--------|---------|
| 1 | Fundamentos de IA Corporativa | 3 horas |
| 2 | Segurança e Privacidade | 4 horas |
| 3 | Políticas e Governança | 4 horas |
| 4 | Implementação Técnica | 3 horas |
| 5 | Treinamento e Adoção | 3 horas |
| 6 | Monitoramento e Compliance | 3 horas |

---

# MÓDULO 1: FUNDAMENTOS — IA no Ambiente Corporativo

**MÓDULO 1: FUNDAMENTOS DE IA CORPORATIVA**
**AULA 1: O CENÁRIO DE IA NAS EMPRESAS**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Entender o panorama de adoção de IA; 2. Identificar riscos e oportunidades.

---

**CONTEÚDO PARA O ALUNO**

**1. O Estado da Adoção de IA em 2024-2025**

Pesquisas indicam que 75% dos profissionais já usam alguma forma de IA generativa no trabalho — mas apenas 25% das empresas têm políticas formais. Este gap representa o maior risco corporativo atual: Shadow AI (uso não autorizado de ferramentas de IA pelos funcionários sem conhecimento ou aprovação da empresa).

**2. Riscos do Shadow AI**

- **Vazamento de dados:** Funcionários colando dados confidenciais em ChatGPT público
- **Compliance:** Uso não documentado pode violar regulamentações setoriais
- **Propriedade intelectual:** Código proprietário inserido em ferramentas externas
- **Qualidade:** Outputs de IA sem revisão podem conter erros ou alucinações
- **Responsabilidade:** Sem política, quem é responsável por erros da IA?

**3. A Oportunidade do Allowlisting**

Em vez de proibir (ineficaz — funcionários usam mesmo assim), o allowlisting permite uso controlado: ferramentas aprovadas, políticas claras, treinamento, monitoramento. Resultado: produtividade aumenta com riscos gerenciados.

**4. Business Case para IA Corporativa**

ROI típico: profissionais economizam 5-15 horas/semana com IA. Para equipe de 50 pessoas a R$50/hora: economia potencial de R$650.000-1.950.000/ano. Custo do ChatGPT Team: ~R$90.000/ano. ROI: 7-21x.

---

# MÓDULO 1: FUNDAMENTOS — Planos Corporativos

**MÓDULO 1: FUNDAMENTOS DE IA CORPORATIVA**
**AULA 2: PLANOS EMPRESARIAIS DA OPENAI**

**Carga Horária:** 1 hora
**Indicadores Trabalhados:** 1. Diferenciar planos corporativos; 2. Escolher o plano adequado.

---

**CONTEÚDO PARA O ALUNO**

**1. ChatGPT Team**

Para pequenas e médias equipes: workspace compartilhado, GPTs da equipe, dados não usados para treino, admin console básico, SSO opcional. $25-30/user/mês.

**2. ChatGPT Enterprise**

Para grandes organizações: tudo do Team + SSO obrigatório, SCIM provisioning, analytics avançados, API credits incluídos, SLA, compliance (SOC 2), unlimited GPT-4, admin dashboard completo.

**3. ChatGPT Edu**

Para instituições educacionais: recursos Enterprise com pricing educacional, controles para estudantes e professores, analytics acadêmicos.

**4. Tabela Comparativa**

| Recurso | Team | Enterprise | Edu |
|---------|------|------------|-----|
| GPT-4 | ✅ | ✅ Ilimitado | ✅ |
| SSO | Opcional | ✅ | ✅ |
| SCIM | ❌ | ✅ | ✅ |
| Analytics | Básico | Avançado | Acadêmico |
| Data training | ❌ Excluído | ❌ Excluído | ❌ Excluído |
| SLA | ❌ | ✅ | ✅ |

---

# MÓDULO 2: SEGURANÇA — Proteção de Dados

**MÓDULO 2: SEGURANÇA E PRIVACIDADE**
**AULA 1: PROTEÇÃO DE DADOS COM IA**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Implementar proteção de dados; 2. Configurar DLP para IA.

---

**CONTEÚDO PARA O ALUNO**

**1. Classificação de Dados para IA**

Defina quais dados podem ser usados com IA:
- **Verde (permitido):** Dados públicos, conteúdo marketing, informações genéricas
- **Amarelo (com cuidado):** Dados internos não-sensíveis, processos documentados
- **Vermelho (proibido):** Dados pessoais (PII), financeiros, saúde, segredos comerciais, código proprietário crítico

**2. Data Loss Prevention (DLP)**

Implemente controles técnicos: filtros de conteúdo que detectam PII antes de enviar, bloqueio de copy-paste de sistemas internos para ChatGPT, monitoramento de prompts para palavras-chave sensíveis, logs de auditoria.

**3. Garantias da OpenAI**

Nos planos Team/Enterprise: dados NÃO são usados para treinar modelos, criptografia em trânsito (TLS 1.2+) e em repouso (AES-256), certificação SOC 2 Type II, retenção configurável, data residency options.

**4. LGPD e IA Generativa**

Pontos de atenção: base legal para processamento (legítimo interesse, consentimento), direitos dos titulares (acesso, eliminação), relatório de impacto (DPIA), DPO deve ser consultado, registro de operações de processamento.

---

# MÓDULO 2: SEGURANÇA — Infraestrutura

**MÓDULO 2: SEGURANÇA E PRIVACIDADE**
**AULA 2: INFRAESTRUTURA E CONTROLES TÉCNICOS**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Configurar controles técnicos; 2. Implementar monitoramento.

---

**CONTEÚDO PARA O ALUNO**

**1. Network Controls**

Configuração de rede: allowlist de domínios OpenAI no firewall, bloqueio de alternativas não-aprovadas (Claude, Gemini free, etc.), proxy com inspeção SSL para monitoramento, VPN para acesso mobile.

**2. Identity & Access Management**

SSO: integre com seu IdP (Azure AD, Okta, Google Workspace). SCIM: provisionamento automático de contas (criar/desativar com onboarding/offboarding). MFA obrigatório para todos os usuários.

**3. Audit Logging**

O que registrar: quem acessou (user ID), quando (timestamp), qual modelo usou, volume de uso (tokens), GPTs acessados. Integre logs com SIEM corporativo.

**4. Controles de Admin**

ChatGPT Enterprise admin: gerenciar usuários e grupos, configurar políticas de retenção, aprovar/bloquear GPTs, definir custom instructions padrão para a empresa, monitorar usage analytics.

---

# MÓDULO 3: GOVERNANÇA — Políticas de Uso

**MÓDULO 3: POLÍTICAS E GOVERNANÇA**
**AULA 1: CRIANDO POLÍTICAS DE USO DE IA**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Redigir política de uso de IA; 2. Definir diretrizes por departamento.

---

**CONTEÚDO PARA O ALUNO**

**1. Estrutura da Política de Uso de IA**

Uma política eficaz inclui: escopo (quem, o quê, quando), ferramentas aprovadas (allowlist), dados permitidos/proibidos, casos de uso por departamento, processo de revisão de outputs, responsabilidades, consequências de violação, revisão periódica.

**2. Template de Política**

Seções recomendadas:
1. Objetivo e escopo
2. Definições (IA generativa, prompt, output, etc.)
3. Ferramentas aprovadas e configuração
4. Dados: classificação e regras de uso
5. Casos de uso aprovados por departamento
6. Revisão obrigatória de outputs
7. Propriedade intelectual e autoria
8. Responsabilidades (usuário, gestor, TI, DPO)
9. Monitoramento e auditoria
10. Treinamento obrigatório
11. Violações e consequências
12. Revisão e atualização da política

**3. Políticas por Departamento**

- **Marketing:** Pode usar para copy, ideação, calendário editorial. Proibido: dados de clientes.
- **Jurídico:** Pode usar para pesquisa, drafts, análise. Proibido: dados de processos, nomes de clientes.
- **RH:** Pode usar para JDs, comunicações, processos. Proibido: dados de funcionários, avaliações.
- **TI:** Pode usar para código, documentação, troubleshooting. Proibido: código de produção crítico sem review.

**4. Comitê de IA**

Crie comitê multidisciplinar: representantes de TI, Jurídico, Compliance, RH, e áreas de negócio. Responsabilidades: aprovar ferramentas, revisar políticas, avaliar riscos, aprovar novos casos de uso.

---

# MÓDULO 3: GOVERNANÇA — Compliance e Ética

**MÓDULO 3: POLÍTICAS E GOVERNANÇA**
**AULA 2: COMPLIANCE REGULATÓRIO E ÉTICA**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Garantir compliance regulatório; 2. Implementar framework ético.

---

**CONTEÚDO PARA O ALUNO**

**1. LGPD e IA**

Requisitos: DPIA (Data Protection Impact Assessment) para uso de IA, base legal definida para cada tipo de processamento, transparência (informar quando IA é usada em decisões), direito de explicação (como a IA chegou na resposta), registro de tratamento no inventário de dados.

**2. GDPR (para operações na Europa)**

Requisitos adicionais: Privacy by Design, transferência internacional de dados (cláusulas contratuais padrão), direito ao esquecimento, Data Processing Agreement (DPA) com OpenAI.

**3. Regulamentações Setoriais**

- **Financeiro:** BACEN, CVM — regras sobre uso de IA em decisões financeiras
- **Saúde:** ANVISA, CFM — IA não substitui decisão médica
- **Educação:** MEC — uso ético em avaliações e conteúdo
- **Jurídico:** OAB — responsabilidade sobre outputs de IA

**4. Framework Ético**

Princípios: transparência (declarar uso de IA), accountability (responsável humano por outputs), fairness (evitar vieses em decisões), privacidade (minimizar dados), segurança (proteger contra misuse), beneficência (uso para benefício real).

---

# MÓDULO 4: IMPLEMENTAÇÃO — Rollout

**MÓDULO 4: IMPLEMENTAÇÃO TÉCNICA**
**AULA 1: PLANO DE IMPLEMENTAÇÃO E ROLLOUT**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Planejar rollout corporativo; 2. Configurar ambiente técnico.

---

**CONTEÚDO PARA O ALUNO**

**1. Fases do Rollout**

**Fase 1 — Piloto (4 semanas):** 10-20 early adopters, monitoramento intensivo, feedback semanal, ajustes de política.

**Fase 2 — Expansão (4-8 semanas):** Departamentos selecionados, treinamento em grupo, suporte dedicado, métricas de adoção.

**Fase 3 — Geral (4-8 semanas):** Toda a empresa, self-service com documentação, champions por departamento, suporte tier 1-2.

**2. Checklist de Implementação**

- [ ] Contrato com OpenAI (Team/Enterprise)
- [ ] Configuração SSO/SCIM
- [ ] Política de uso aprovada
- [ ] DLP configurado
- [ ] Treinamento desenvolvido
- [ ] Champions identificados
- [ ] Métricas definidas
- [ ] Suporte estruturado
- [ ] Comunicação interna preparada

**3. Configuração do Workspace**

ChatGPT Team/Enterprise: criar workspace, configurar SSO, definir grupos de usuários, uploar logo e branding, definir custom instructions da empresa, criar GPTs departamentais.

**4. GPTs Corporativos**

Crie GPTs customizados para a empresa: "Assistente de RH" (políticas, benefícios, processos), "Consultor Jurídico Interno" (guidelines, templates, compliance), "Analista de Dados" (dashboards, relatórios, KPIs).

---

# MÓDULO 4: IMPLEMENTAÇÃO — Integrações

**MÓDULO 4: IMPLEMENTAÇÃO TÉCNICA**
**AULA 2: INTEGRAÇÕES E API**

**Carga Horária:** 1 hora
**Indicadores Trabalhados:** 1. Integrar ChatGPT com ferramentas corporativas; 2. Configurar API de forma segura.

---

**CONTEÚDO PARA O ALUNO**

**1. Integrações Nativas**

ChatGPT Enterprise integra com: Microsoft 365 (Copilot competitor), Google Workspace, Slack (app oficial), Salesforce, ServiceNow.

**2. API Corporativa**

Para integrações customizadas: API keys gerenciadas centralmente, usage limits por departamento, monitoring de custos, logging centralizado. Segurança: IP allowlisting, VPC peering (Enterprise), encryption.

**3. Chatbots Internos**

Construa chatbots com knowledge base corporativa: upload de documentos internos em GPT, configure para responder APENAS com base no knowledge fornecido, integre com Slack/Teams para acesso fácil.

**4. Automação com IA**

Integre ChatGPT em workflows existentes via n8n/Make: classificação automática de tickets, geração de relatórios, análise de feedback de clientes, tradução de documentos.

---

# MÓDULO 5: TREINAMENTO — Capacitação

**MÓDULO 5: TREINAMENTO E ADOÇÃO**
**AULA 1: PROGRAMA DE TREINAMENTO**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Criar programa de treinamento; 2. Maximizar adoção.

---

**CONTEÚDO PARA O ALUNO**

**1. Estrutura do Treinamento**

**Nível 1 — Básico (2 horas):** O que é IA generativa, política de uso, do's e don'ts, prompts básicos, segurança de dados. Obrigatório para todos.

**Nível 2 — Intermediário (4 horas):** Prompt engineering, casos de uso por departamento, GPTs corporativos, boas práticas. Para power users.

**Nível 3 — Avançado (8 horas):** API, integrações, automações, criação de GPTs. Para champions e TI.

**2. Metodologia de Treinamento**

- Workshop presencial/online (2h) com exercícios práticos
- Materiais de referência (guia rápido, FAQs, exemplos)
- Office hours semanais para dúvidas
- Canal no Slack/Teams para suporte peer-to-peer
- Newsletter mensal com tips e novidades

**3. Champions de IA**

Identifique 1-2 champions por departamento: early adopters entusiasmados, recebem treinamento avançado, suportam colegas, coletam feedback, reportam ao comitê de IA.

**4. Medindo Adoção**

KPIs: % de funcionários com conta ativa, uso médio semanal (sessões, prompts), satisfação (NPS), horas economizadas (self-report), qualidade de outputs (sampling review).

---

# MÓDULO 5: TREINAMENTO — Change Management

**MÓDULO 5: TREINAMENTO E ADOÇÃO**
**AULA 2: GESTÃO DE MUDANÇA E RESISTÊNCIA**

**Carga Horária:** 1 hora
**Indicadores Trabalhados:** 1. Gerenciar resistência; 2. Sustentar adoção.

---

**CONTEÚDO PARA O ALUNO**

**1. Resistências Comuns**

- "IA vai substituir meu emprego" → Reframe: IA amplifica sua capacidade
- "Não confio nos resultados" → Treinar verificação e pensamento crítico
- "É muito complicado" → UX simples + suporte disponível
- "Violamos compliance" → Política clara + ferramentas aprovadas

**2. Comunicação Executiva**

C-level sponsorship é crucial: CEO/CTO endossa publicamente, comunica benefícios estratégicos, participa do lançamento, compartilha resultados do piloto.

**3. Quick Wins**

Demonstre valor rápido: cases do piloto (horas economizadas, qualidade melhorada), templates prontos para uso imediato, GPTs corporativos que resolvem dores reais.

**4. Sustentabilidade**

Mantenha momentum: atualizações regulares, novos GPTs e use cases, reconhecimento de power users, métricas de impacto compartilhadas, evolução contínua da política.

---

# MÓDULO 6: MONITORAMENTO — Analytics

**MÓDULO 6: MONITORAMENTO E COMPLIANCE**
**AULA 1: ANALYTICS E MÉTRICAS DE USO**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Monitorar uso de IA; 2. Gerar relatórios de compliance.

---

**CONTEÚDO PARA O ALUNO**

**1. Dashboard de Uso**

Métricas essenciais: usuários ativos (diário/semanal/mensal), prompts por departamento, GPTs mais populares, custos por equipe, tendências de adoção.

**2. Compliance Monitoring**

Verificações periódicas: amostragem de prompts para compliance, verificação de dados sensíveis em logs, review de GPTs criados por funcionários, audit de acessos e permissões.

**3. Relatórios para Gestão**

Mensal: resumo de uso, ROI estimado, incidents, recomendações. Trimestral: review da política, benchmark com mercado, planejamento de evolução. Anual: avaliação completa, orçamento, roadmap.

**4. Incident Management**

Processo para incidentes: detecção (automática ou reporte) → classificação (severidade) → contenção (bloquear se necessário) → investigação → correção → post-mortem → atualização de política.

---

# MÓDULO 6: MONITORAMENTO — Evolução

**MÓDULO 6: MONITORAMENTO E COMPLIANCE**
**AULA 2: EVOLUÇÃO E FUTURO DA IA CORPORATIVA**

**Carga Horária:** 1 hora
**Indicadores Trabalhados:** 1. Planejar evolução contínua; 2. Preparar para regulamentações futuras.

---

**CONTEÚDO PARA O ALUNO**

**1. Roadmap de Evolução**

Fase 1: ChatGPT básico para todos. Fase 2: GPTs customizados por departamento. Fase 3: API integrada em processos. Fase 4: Agentes autônomos com supervisão humana. Fase 5: IA embedded em todos os produtos e serviços.

**2. Regulamentações Futuras**

EU AI Act (em vigor), Brasil — PL de IA em discussão, regulamentações setoriais cada vez mais específicas. Prepare-se: mantenha framework flexível, monitore legislação, participe de consultas públicas.

**3. Multi-Modal e Agentes**

O futuro: IA que processa texto, imagem, áudio e vídeo integrado. Agentes que executam tarefas complexas autonomamente. Prepare políticas para: uso de câmera/microfone com IA, ações autônomas, responsabilidade por agentes.

**4. Construindo Cultura de IA**

O objetivo final não é apenas allowlisting — é criar uma cultura onde IA é usada de forma natural, segura e produtiva por toda a organização. Isso requer liderança, educação contínua e evolução constante.

---

# TEMPLATE: Política de Uso de IA

**TEMPLATE — Política de Uso de IA Generativa**

```
POLÍTICA DE USO DE INTELIGÊNCIA ARTIFICIAL GENERATIVA
[Nome da Empresa] | Versão [X] | [Data]

1. OBJETIVO: Regular o uso de IA generativa na empresa
2. ESCOPO: Todos os funcionários, terceiros, estagiários
3. FERRAMENTAS APROVADAS: ChatGPT [plano], [lista]
4. DADOS PERMITIDOS: [classificação verde/amarelo/vermelho]
5. CASOS DE USO APROVADOS: [por departamento]
6. REVISÃO DE OUTPUTS: [obrigatório para decisões]
7. PROPRIEDADE INTELECTUAL: [empresa detém outputs]
8. RESPONSABILIDADES: [matriz RACI]
9. MONITORAMENTO: [o que, como, frequência]
10. TREINAMENTO: [obrigatório, níveis]
11. VIOLAÇÕES: [processo disciplinar]
12. REVISÃO: [trimestral pelo comitê de IA]
```

---

# EXERCÍCIO: Avaliação de Risco

**EXERCÍCIO PRÁTICO — Risk Assessment de IA**

**Duração:** 60 min | **Objetivo:** Avaliar riscos de IA para sua organização

1. Liste todos os casos de uso de IA atuais (autorizados e shadow)
2. Para cada: classifique risco (dados, compliance, qualidade, reputação)
3. Mapeie controles existentes vs necessários
4. Priorize: alto risco + sem controle = ação imediata
5. Crie plano de mitigação para top 5 riscos
6. Defina KPIs de monitoramento

---

# PROJETO FINAL: Plano de Implementação

**PROJETO FINAL — Plano de Implementação de IA Corporativa**

**Duração:** 6-8 horas | **Nível:** Avançado

**Entregáveis:**
1. **Política de uso** completa e revisada
2. **Plano de rollout** em 3 fases com cronograma
3. **Business case** com ROI projetado
4. **Programa de treinamento** com materiais
5. **Framework de monitoramento** com KPIs e relatórios

---

# Recursos Adicionais e Próximos Passos

Parabéns por completar **ChatGPT Allowlisting**!

**Próximos passos:**
1. Apresente business case para sua liderança
2. Forme comitê de IA multidisciplinar
3. Inicie piloto com early adopters
4. Implemente política e treinamento

**Recursos:**
- [OpenAI Enterprise](https://openai.com/enterprise)
- [OpenAI Security Portal](https://trust.openai.com)
- [LGPD — Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- Comunidade FayaPoint no Discord

**Suporte:** suporte@fayapoint.com | WhatsApp: +5521971908530
