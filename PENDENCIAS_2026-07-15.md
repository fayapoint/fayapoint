# PENDÊNCIAS — O que falta fazer (atualizado 15/07/2026)

Documento-instrumento pós-maratona de 14-15/07. Tudo que estava no plano mestre
(P0–P7 + F1–F6) e foi entregue está resumido no fim; aqui em cima está **apenas
o que resta**, em ordem de prioridade. Estado vivo da reforma na memória:
`progress_uss_hermes.md` e `progress_p0_precos.md`.

---

## 🔴 1. Ações que só o RICARDO pode fazer (destravam validação)

| # | Ação | Onde | Por quê |
|---|------|------|---------|
| 1.1 | Conectar **Facebook + Instagram** (OAuth) | Portal → Perfil Social → Contas | Destrava o publicador USS inteiro — depois disso, escrever e publicar o 1º post real leva 10 segundos (aba Publicar) |
| 1.2 | Testar **O Vidente** e a pescaria logado | Portal → Perfil Social → Persona; fim de qualquer minigame | Confirmar a experiência e o toast de +10 XP; conferir no USS → Inteligência se os sinais chegaram |
| 1.3 | Conferir os **2 e-mails de amostra** na sua caixa | Gmail (ricardofaya@) | Boas-vindas + aviso de novo aluno — aprovar visual/tom antes do primeiro cadastro orgânico |
| 1.4 | **P4.2 — PIX real** de R$1–5 em produção (pulado a pedido em 14/07) | Checkout fayai.com.br, com você na transação | Única coisa entre nós e "apto a receber com confiança": compra → webhook → matrícula liberada, documentado |
| 1.5 | **Turnstile**: criar chave real no painel Cloudflare | Cloudflare → Turnstile → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` na Netlify | Produção usa chave de TESTE — anti-bot do cadastro está de mentira |

## 🟠 2. P4 restante — comercial

- **2.1 Cartão de crédito E2E** em produção (depois do PIX 1.4).
- **2.2 `products_prices` (88 docs)** vs `products.pricing` — fonte dupla de preço de SERVIÇOS; revisar/deduplicar.
- **2.3 Âncoras de desconto honestas**: originalPrice 497–897 gera "-91%" permanente na vitrine — conflita com o princípio anti-escassez-mentirosa. Recomendação: originalPrice = último preço REAL praticado (ex.: Perplexity "de 297 por 79"). Decisão de negócio sua; aplicação é 1 script.

## 🟠 3. F5 — Páginas únicas de projetos (1–2 sessões cheias)

Cada uma das 7 páginas de `/projetos` com direção de arte PRÓPRIA (hoje compartilham template):
USS dashboard vivo ciano · WorldForge fantasia editorial rosa · Visão de Jogo esporte cinético lima ·
Condutor arcade retrô laranja · Livros biblioteca noturna violeta · Cursos ateliê dourado ·
IA Hoje jornal do futuro. Método §11 (blueprint no topo do arquivo, 3 passes no browser),
screenshots reais do WorldForge vivo (worldtch.netlify.app). O estilo fusão vetor+foto
aprovado (9.5/10) é o padrão — pipeline de geração pronto em `scripts/arcade/generate_abundance.py`.

## 🟡 4. F6 — QA + dados

- **4.1 Crawl interno completo**: zero becos/404 (usar /qa ou gstack browse).
- **4.2 Funil PostHog da trilha**: nó → aula → minigame → cadastro (nunca instrumentado).
- **4.3 Evento de logout involuntário**: provar em produção que o bug D1 morreu.
- **4.4 Mobile QA** de tudo desta maratona (Vidente, Publicar, conta, blog hero em 390×844).

## 🟡 5. Qualidade de cursos — o loop Hermes×MC está vivo, falta fechar o ciclo

- **5.1 Acompanhar as auditorias diárias** (cron 11h BRT, 1 curso/dia, rotação — 21 cursos em ~3 semanas). Relatórios em `mission-control.courseaudits` (nota, problemas, correções propostas). Primeira rodada automática: 15/07.
- **5.2 Superfície no MC**: hoje os relatórios só existem no Mongo — criar painel no dashboard v3 (lista + nota + drill-down).
- **5.3 Pipeline de CORREÇÃO**: o auditor propõe texto pronto; falta o passo que aplica (hermes gera patch → fila de aprovação → update no Mongo). É o "efetivamente melhorar" que você pediu — hoje temos o diagnóstico.
- **5.4 Auditoria de relevância de MERCADO por curso** (sua pergunta: "quem usa só Midjourney hoje?"): decidir manter/reposicionar/fundir por ferramenta. Banana Dev já caiu; Midjourney/Leonardo/Make merecem o mesmo exame.
- **5.5 Trocar o auditor por modelo melhor quando fizer sentido** (hoje: nemotron-3-super-120b:free no proxy kirmes; regras anti-ruído no prompt seguram falsos positivos de cutoff).

## 🟡 6. USS — próximo nível (publicador está no ar)

- **6.1 Twitter/X e Pinterest**: rotas OAuth existem, `available: false` no painel — ativar exige app keys nas plataformas.
- **6.2 LinkedIn, TikTok, WhatsApp**: do zero.
- **6.3 Publicação com mídia gerada**: botão "criar imagem com IA" no Composer usando o Studio (hoje aceita URL manual).
- **6.4 Sync de métricas** pós-publicação nos posts publicados (rota sync existe; agendar).
- **6.5 Confirmar que o generate usa os sinais novos**: o prompt de geração deve incorporar `audienceInsights`/`primaryInterests` que o Vidente e a pescaria alimentam.

## 🟢 7. Visual — sobras do lote ABUNDÂNCIA (assets prontos, sem superfície)

- **7.1** `artForTag` em `src/lib/ai-news.ts` ainda sorteia a pool antiga — apontar editorias para as 13 capas novas em `/blog/covers/`.
- **7.2** Artes **Batalha (5) e Caça (10)** em `/portal/arcade/batalha|caca/` — usar como cenários/estados dos 2 jogos.
- **7.3** Artes **fx/ (10 celebrações)** — nivel-up, conquista, streak-7, vazio-inspirador, erro-fofo etc. para toasts/empty-states/404.
- **7.4** Artes **conta/** restantes (seguranca, notificacoes, privacidade) nas abas correspondentes de Minha Conta.
- **7.5** `boas-vindas-loop.webm` (pronto, 224KB) — sugestão: PortalTour do primeiro acesso ou página de registro.
- **7.6** Registrar o batch no `IDENTIDADE_VISUAL.md` §12 (exemplos + receita do prompt de fusão).

## 🟢 8. Follow-up/e-mail — funcionando, refinar

- **8.1** Monitorar deliverability da Resend nos primeiros envios reais (domínio verificado 14/07; antes disso TUDO falhava silencioso).
- **8.2** D+2/D+7 rodam via cron 9h BRT — conferir `followup_*.log` na VPS após os primeiros disparos.
- **8.3** Registrar consentimento LGPD explícito no cadastro (campo marketing no formulário; opt-out já existe).

## 🔵 9. Radar P7 (visão — por apetite, nada perdido)

USS multi-tenant como produto (ultimatesocialsuite.shop vazio) · WorldForge comercial
(SSO FayAI + "cada assinante seu estúdio") · Audiobook IASF com Qwen3-TTS (conteúdo
SAGRADO — só narrar) · Reel IASF V2 · Reel template V4 vendável · Visão de Jogo
(SAM 3 + Roboflow) · Condutor de Games · Som em Bando · Unificar MC v1→v3 (agentes
logam no v1) · Media pipeline com proveniência (prompt de cada imagem no Mongo — o
abundance-manifest.json já é o embrião) · Character consistency TCH (Qwen Edit 2511
+ Multiple-Angles → LoRA por personagem) · ACE-Step música (instalado, nunca testado).

## 👁️ 10. Vigias permanentes

- **Search Console**: primeiras impressões previstas ~15-16/07 — REPORTAR ao Ricardo.
- **Banda Netlify** (0,15GB desde 09/07; 100 imagens novas no ar — observar).
- **Proxy kirmes**: modelo trocado 14/07 (`gpt-oss-120b:free` morreu → `nvidia/nemotron-3-super-120b-a12b:free` no `override.conf` — é o drop-in que manda, não o unit). Se hermes voltar "(empty)": listar `:free` em openrouter.ai/api/v1/models e trocar lá.
- **news.log diário** (IA HOJE) e **course_audit_*.log** (auditor) na VPS.
- **Crons VPS ativos**: news 10h UTC · followups 12h UTC · auditoria 14h UTC · USS publish-due */5min.

---

## ✅ Entregue na maratona 14–15/07 (para contexto)

P0 XP logado idempotente · Reprecificação R$29–199 (21 cursos, 4 arquivados, Banana
Dev morto detectado) · Asaas produção E2E (boleto/assinaturas) · P1 Minigames 2.0
COMPLETO (5 jogos + rotação + vocabulário + 100 artes + vídeos) · P2 Desafios ·
P3 Certificados · P5 COMPLETO (boas-vindas + aviso admin + D+2/D+7 + **Resend
verificado** — DKIM/SPF/MX na zona Netlify) · P6 temas de leitura (já existia,
verificado) · USS publicador real (FB/IG + agendador + cron) · Hermes×MC auditor
de cursos (prova: Gemini 4/10) · 1.895 aulas limpas de meta-texto vazado (backup
`courses_backup_boilerplate_20260714`) · Blog IA Hoje (rename + guias vivos +
hero-vídeo) · O Vidente + persona-signals + PersonaFisher (coleta de dados → USS) ·
Dashboard com artes §12 · Minha Conta unificada · Vitrine blindada contra crash
do curso-do-mês · usuário teste-claimxp apagado.

**Ordem sugerida de sessões:** (1) Ricardo: itens 1.1–1.5 [30 min dele] →
(2) F5 páginas únicas [1–2 sessões] → (3) 5.2+5.3 painel MC + pipeline de correção
de cursos [1 sessão] → (4) F6 QA + funil [1 sessão] → (5) sobras visuais §7 +
USS §6 [1 sessão] → radar por apetite.
