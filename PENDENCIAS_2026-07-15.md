# HANDOFF COMPLETO + PENDÊNCIAS — 15/07/2026

**Para quem é este documento:** o próximo modelo (Opus 4.8) que vai continuar este
trabalho SEM acesso às conversas anteriores. Tudo que você precisa está aqui ou nos
arquivos apontados. Leia as seções 0–2 antes de tocar em qualquer coisa.

**Cópia idêntica em:** `autoresearch/PENDENCIAS_2026-07-15.md` (raiz do workspace)
e `autoresearch/fayapoint-ai/PENDENCIAS_2026-07-15.md` (repo, versionado).

---

# 0. A PROMESSA (critério de toda decisão)

**"Ajudar o usuário a ENTENDER IA. Aprenda IA fazendo, não assistindo."**

Derivados não-negociáveis:
- **Gamificação honesta**: nunca XP fake, contadores falsos, escassez mentirosa.
- **Regra do espelho** (IDENTIDADE_VISUAL.md §9): a imagem ENCENA o que o texto diz.
- **Estilo visual aprovado (9.5/10 pelo Ricardo)**: mascote robô vetorial fofo FUNDIDO
  em fotorealismo cinematográfico ("breathtaking"), navy #0c0e1d, ouro #f5c04e só para
  marca/recompensa/CTA. Receita §5.2 abaixo.
- O esforço do usuário NUNCA é descartado (foi o bug P0, já morto).
- Aceite global: pessoa que nunca usou IA entra, entende em 30s, joga, aprende uma
  palavra, se cadastra, é recebida por nome, sabe sempre o próximo passo.

---

# 1. MAPA DO MUNDO (onde tudo está)

## 1.1 Diretórios locais (Windows 11, usuário `ricar`)

| O quê | Caminho |
|---|---|
| Workspace raiz | `C:\Users\ricar\WORKSMAIN\autoresearch\` |
| **Site (repo git)** | `C:\Users\ricar\WORKSMAIN\autoresearch\fayapoint-ai\` |
| ComfyUI | `C:\WORKS\ComfyUI` (porta **8000**, NÃO 8001) |
| Saída do lote de artes | `C:\WORKS\ComfyUI\output\abundance\` (100 PNGs + video/) |
| Memória persistente Claude | `~/.claude/projects/C--Users-ricar-WORKSMAIN-autoresearch/memory/` (MEMORY.md = índice) |
| Skills | `~/.claude/skills/` (comfy-local, comfy-fayai, gstack etc.) |

## 1.2 Repo / Deploy

- GitHub `fayapoint/fayapoint` → Netlify site **"fayai"** (id `900ad8da-5955-40ec-98ab-d9500fe9fe69`) → https://fayai.com.br
- Push em `main` = deploy automático (~3 min). Netlify CLI está autenticada
  (token em `%APPDATA%\netlify\Config\config.json` — a CLI `netlify api createDnsRecord`
  dá 422; use a REST API com curl + esse token, funciona).
- DNS de fayai.com.br é zona Netlify id `695316c0329c8e58c06fbf15` (gerenciável por API).
- Último deploy desta maratona: `4843a0b` (ready). Commits da maratona:
  `cef055d` P0 · `02cb126` fix vitrine · `7a7f6b7`/`c39195d`/`650bb59` Asaas ·
  `dbeca48` P1 · `3426edd` P2 · `bb994ba` P3 · `b49aea8`/`3701f38`/`dc22532` visuais arcade ·
  `14caa62`(≈) USS publicador · `2af816d` P5 · `65ffefd` 100 artes · `771faef` persona/blog ·
  `b4d5007` vídeos+followup.

## 1.3 MongoDB Atlas (conexão: `MONGODB_URI` em `fayapoint-ai/.env.local`)

Cluster único `aicornercluster`. DBs e coleções que importam:

| DB | Coleções-chave | Observação |
|---|---|---|
| `fayapoint` | `users` (progress.xp, gamification.gateExamples, socialPersona, followups), `courses` (modules.lessons = metadados/estrutura), `courseprogresses` (**courseId = SLUG**, não ObjectId), `ainews` (Blog IA Hoje; guias evergreen slug `guia-*`), `monthly_offers` (override curso grátis do mês: doc 2026-07 → chatgpt-zero), `socialaccounts`, `socialposts`, `certificates`, `courses_backup_boilerplate_20260714` (backup da limpeza) | O PLAYER lê conteúdo de `fayapointProdutos.products.courseContent`, NÃO das lessons! |
| `fayapointProdutos` | `products` (`pricing.price` = preço real da vitrine; `status: active/draft`; `courseContent` = texto que o aluno vê), `products_prices` (88 docs, serviços — fonte dupla, revisar) | 21 cursos ativos; 4 em draft (banana-dev, mastering-ai, perplexity-13ch, midjourney-masterclass) |
| `mission-control` | `agenttasks` (fila do executor VPS), `courseaudits` (relatórios do auditor hermes) | |

**Preços atuais (escada aprovada 14/07):** R$29 chatgpt-zero/ia-dia-a-dia/primeiras-automacoes ·
R$49 ia-sem-filtro/prompt-engineering · R$79 gemini/claude/leonardo/make/midjourney-arte/
perplexity/allowlisting/openclaw/autoresearch · R$99 claude-cowork/automacao-n8n ·
R$149 chatgpt-masterclass/rag/agentes/ia-producao · R$199 n8n-automacao-avancada.
Diretriz do Ricardo: **precificar para VENDER, teto 199, entrada 29, sempre comparar mercado.**

## 1.4 VPS (Hostinger KVM4, Ubuntu 24.04) — `ssh root@76.13.234.38`

| Serviço | Detalhe |
|---|---|
| `kirmes-proxy` :7860 | Proxy OpenAI-compat. **FREE_MODEL vive no drop-in `/etc/systemd/system/kirmes-proxy.service.d/override.conf`** (o override VENCE o unit!). Atual: `nvidia/nemotron-3-super-120b-a12b:free`. Se hermes devolver "(empty)": o modelo :free morreu → listar vivos em `https://openrouter.ai/api/v1/models` (filtrar `:free`), trocar no override, `systemctl daemon-reload && systemctl restart kirmes-proxy`. |
| Container `kirmes` (docker) | **hermes** em `/opt/hermes/.venv/bin/hermes`. Uso: `docker exec kirmes /opt/hermes/.venv/bin/hermes -z "TAREFA"`. **NUNCA use `--yolo` (quebra, retorna vazio)**. Saída SÓ via `/opt/data/...` (no host = `/root/.hermes/...`). |
| `vps-task-executor` | `/root/openclaw/task-executor/vps-task-executor.ts` (bun). Polla `mission-control.agenttasks` a cada 30s. Allowlist `VPS_ACTIONS`: news.run/log, tch.run/log, **course.audit.run/log**, crons.status, services.status, proxy.health, cron.*.on/off. Editar allowlist → `systemctl restart vps-task-executor`. O `.env` dele tem o MONGODB_URI (aponta p/ mission-control, mas o client acessa os outros DBs do mesmo cluster). Driver mongodb para scripts node do host: `require('/root/openclaw/task-executor/node_modules/mongodb')`. |
| Crons (UTC; BRT = UTC-3) | `0 10` news diárias · `0 12` **e-mails D+2/D+7** (`fayai_followup_daily.sh`) · `0 14` **auditoria de curso** (`course_quality_audit.sh`, rotação = menos auditado) · `*/5` **USS publish-due** (`uss_publish_due.sh`) · seg 8h relatório semanal · 13h TCH worldbuilding |
| Segredo dos crons→site | `AINEWS_SECRET` em `/root/kirmes/.env.fayai`; endpoints aceitam header `x-social-secret` (fallback do `SOCIAL_CRON_SECRET`) e `x-ainews-secret` no publish de notícias |
| Logs | `/root/kirmes/logs/` (news_, tch_, course_audit_, followup_, uss_publish_ por data) |

## 1.5 E-mail (Resend) — DESTRAVADO em 14/07

- **fayai.com.br está VERIFICADO** na Resend (antes, TODOS os e-mails transacionais
  falhavam silenciosamente com 403 domain-not-verified). DKIM/SPF/MX criados na zona
  DNS Netlify. Domain id Resend: `03f41cef-32c6-4855-8ba3-9de95e55011b`.
- Plano free = 1 domínio (o slot era do ultimatesocialsuite.shop failed, foi deletado).
- `RESEND_API_KEY` em `.env.local` E na Netlify. From: `noreply@fayai.com.br`. Admin: ricardofaya@gmail.com.
- Código: `src/lib/email-service.ts` (pedidos), `src/lib/welcome-email.ts` (boas-vindas
  + aviso admin, disparado nos 4 pontos de criação de conta), `src/app/api/emails/followup-due/route.ts` (D+2/D+7).

## 1.6 Asaas (pagamentos) — configurado em produção pela sessão paralela de 14/07

Chave de produção na Netlify; webhook `https://fayai.com.br/api/payments/webhook` com
token obrigatório; TODOS os valores resolvidos no servidor (nunca confiar no preço do
cliente); confirmação idempotente. Boleto/assinaturas TESTADOS E2E. **PIX real nunca
validado** (item 3.1 abaixo — precisa do Ricardo). Movimentação histórica: PIX de
R$5,75 da Nancy foi preservado (não estornar — conta estava negativa; tratar à parte).

---

# 2. COMO TRABALHAR (receitas comprovadas — não redescubra)

## 2.1 Dev & verificação

```bash
# shell: Git Bash; node via fnm SEMPRE:
eval "$(fnm env --shell bash)"
# typecheck (obrigatório antes de commit):
cd fayapoint-ai && npx tsc --noEmit
# dev server: preview_start "fayapoint-dev" (definido em .claude/launch.json, porta 3000)
```
- **Teste SEMPRE no Chrome real do Ricardo** (claude-in-chrome MCP; sessão dele está
  logada em localhost:3000 e fayai.com.br, plano expert). **Ctrl+Shift+R obrigatório**
  — chunks do dev cacheiam agressivo (custou 30min uma vez). Se a extensão estiver
  desconectada, o Chrome dele está fechado; o preview pane serve para páginas públicas.
- Curl contra fayai.com.br precisa de headers de browser (`-A "Mozilla/5.0..."
  -H "Accept-Language: pt-BR"`) — anti-bot (geoblock BR + proxy.ts).
- Scripts node que usam Mongo: rode DE DENTRO de fayapoint-ai (resolução do driver);
  `MONGODB_URI=$(grep -m1 '^MONGODB_URI=' .env.local | cut -d= -f2-) node script.cjs`.
- **Mongoose strict mode**: campo novo em `$set` de coleção `users` etc. exige declarar
  no schema `src/models/*.ts` (interface E schema) ou é descartado em silêncio.
- Commits: mensagem em pt-BR, `Co-Authored-By: Claude <modelo>` no fim. Push = deploy.

## 2.2 Mudanças de PREÇO/dados valem IMEDIATAMENTE em produção

O site (dev E prod) usa o MESMO Atlas. Alterou `products.pricing` ou arquivou produto →
produção mudou na hora, ANTES de qualquer deploy de código. Já causou crash (curso do
mês arquivado × código antigo). Cheque impactos de UI antes de mexer no banco.

## 2.3 Geração de imagens (o estilo aprovado)

Pipeline: **Qwen 2512 fp8 + Lightning 4-steps** (~14s/img, RTX 5060 Ti). Parâmetros
exatos e workflow em `scripts/arcade/generate_abundance.py` (funcionou para as 100).
**Receita do prompt de fusão** (sufixo em toda imagem):

> `[cena específica que ENCENA o conteúdo — regra do espelho]` + `", an adorable glossy
> flat-vector robot mascot with big cute eyes naturally interacting inside a breathtaking
> cinematic photorealistic scene, seamless style fusion, dramatic film lighting, shallow
> depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading,
> professional photography, high detail, no text, no letters, no logos, no watermark"`

Cores por contexto: cyan glow (trabalho), violet (estudos), rose (criar), lime (dia-a-dia),
gold (recompensa). Pós-processo: `ffmpeg -i in.png -vf scale=768:-1 -quality 80 out.webp`
(≤40KB). Batch: submeter tudo → poll (padrão no script). Prompts/seeds das 100 imagens:
`scripts/arcade/abundance-manifest.json`.

## 2.4 Vídeo (LTX 2.3 I2V)

Workflow two-pass comprovado em `scripts/arcade/generate_abundance_videos.py` (~6min/vídeo).
Regras Liga B (IDENTIDADE_VISUAL §10): **máx 1 vídeo por página**, WebM mudo ≤400KB
(`ffmpeg -an -vf "scale=960:-2" -c:v libvpx-vp9 -b:v 0 -crf 44`), sempre `poster` +
fallback `motion-reduce:hidden`/`motion-reduce:block` (exemplos vivos em
`src/app/[locale]/noticias/page.tsx` e `src/components/portal/PersonaOracle.tsx`).

## 2.5 Auditor de cursos (hermes na VPS)

```
bash /root/kirmes/course_quality_audit.sh [slug]   # sem slug = rotação
```
Fluxo: `course_audit_prepare.js` exporta o curso do Atlas para
`/root/.hermes/course-audit/<slug>/` (meta.json + outline.md + lessons/*.md) →
hermes lê em `/opt/data/course-audit/<slug>/` e escreve `YYYY-MM-DD_report.md` →
`course_audit_publish.js` grava em `mission-control.courseaudits` + activity log no MC.
O prompt tem REGRAS ANTI-RUÍDO (modelo com cutoff antigo NÃO pode marcar modelo
desconhecido como erro; 10 problemas DISTINTOS com dedupe). Prova: gemini-ia-google
nota 4/10, relatório 11.5KB.

---

# 3. PENDÊNCIAS (em ordem de prioridade, com implementação)

## 🔴 3.0 Ações que SÓ O RICARDO pode fazer (~30 min, destravam validação)

1. **Conectar Facebook+Instagram**: Portal → Perfil Social → Contas → botão Facebook.
   Destrava o publicador USS inteiro (aba Publicar já funciona; IG exige imagem).
2. **Testar o Vidente** (Perfil Social → Persona) e a pescaria (fim de qualquer minigame).
3. **Conferir os 2 e-mails de amostra** no Gmail (boas-vindas + "novo aluno") — aprovar tom.
4. **PIX real R$1–5** em produção (pulado a pedido dele em 14/07): compra → webhook →
   matrícula liberada; documentar. Item mais antigo do PLANO_TRACAO.
5. **Turnstile**: criar chave real no painel Cloudflare → env `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   na Netlify (produção usa CHAVE DE TESTE — anti-bot do cadastro é decorativo).

## 🟠 3.1 P4 comercial restante

- **Cartão E2E** em produção (após o PIX).
- **`products_prices` (88 docs)**: fonte dupla de preços de SERVIÇOS vs `products.pricing` —
  auditar e unificar (o checkout de serviços lê `products_prices` no servidor).
- **Âncoras honestas**: originalPrice 497–897 → badges "-84%/-91%" permanentes ferem o
  princípio anti-escassez-mentirosa. Proposta já discutida: originalPrice = último preço
  REAL praticado (Perplexity "de 297 por 79", cursos 197 → "de 197 por 79"). Precisa de
  UM OK do Ricardo; aplicação é um updateOne por slug (padrão na seção 2.2 do
  `progress_p0_precos.md` da memória).

## 🟠 3.2 F5 — Páginas únicas de projetos (1–2 sessões cheias)

Hoje as 7 páginas de `/projetos/*` compartilham template. Cada uma deve ter direção de
arte PRÓPRIA (demonstração viva do alcance do estúdio):

| Página | Direção aprovada |
|---|---|
| USS | dashboard vivo, ciano |
| WorldForge | fantasia editorial, rosa (screenshots REAIS de worldtch.netlify.app via browse) |
| Visão de Jogo | esporte cinético, lima |
| Condutor de Games | arcade retrô, laranja |
| Livros & Audiobooks | biblioteca noturna, violeta |
| Cursos FayAI | ateliê dourado |
| IA Hoje | jornal do futuro |

Método IDENTIDADE_VISUAL §11: blueprint em comentário no topo do arquivo → gerar artes
com a receita §2.3 → 3 passes de iteração NO BROWSER. Arquivos:
`src/data/landing/project-details.ts` + páginas em `src/app/[locale]/projetos/`.

## 🟡 3.3 F6 — QA + instrumentação

- Crawl interno completo: zero becos/404 (skill /qa ou gstack browse).
- **Funil PostHog da trilha**: eventos nó→aula→minigame→cadastro (PostHog já está no
  site, funil nunca instrumentado).
- Evento de logout involuntário (provar que o bug D1 segue morto em produção).
- Mobile QA (390×844) das superfícies novas: Vidente, aba Publicar, Minha Conta, blog hero.

## 🟡 3.4 Qualidade de cursos — fechar o ciclo (o pedido "melhorar efetivamente")

O DIAGNÓSTICO roda sozinho (cron 14h UTC, 1 curso/dia, ~3 semanas para os 21). Falta:

1. **Superfície no MC**: painel no mc-faya-dashboard-v3 listando `courseaudits`
   (nota, data, drill-down no report markdown). Hoje só via mongosh.
2. **Pipeline de CORREÇÃO** (o passo que falta do "efetivamente melhorar"):
   hermes gera patch por aula (o relatório JÁ traz "correção proposta" pronta) →
   fila de aprovação (coleção `courseFixes` status pending/approved) → botão no MC →
   update em `fayapointProdutos.products.courseContent` (ATENÇÃO: é lá que o aluno lê,
   seção 1.3). Guardar diff/backup antes de aplicar, como na limpeza de boilerplate.
3. **Auditoria de relevância de MERCADO por curso** (pergunta do Ricardo: "quem usa
   exclusivamente Midjourney hoje?"): manter/reposicionar/fundir por ferramenta.
   Banana Dev (plataforma morta) já caiu; examinar Midjourney, Leonardo, Make.
4. Modelo do auditor é o :free do proxy — trocar por melhor quando valer o custo.

**Contexto importante**: 1.895 aulas em 12 cursos tinham meta-texto do gerador vazado
("A base editorial..." / "canon deste projeto... GPT-5.4 e Claude Opus 4.6") em
`fayapoint.courses.modules.lessons.content`. LIMPO em 14/07 com backup em
`courses_backup_boilerplate_20260714`. O `courseContent` (visível ao aluno) estava limpo.

## 🟡 3.5 USS — próximo nível (o publicador está NO AR)

O que existe: OAuth FB/IG e Google/YouTube; `src/lib/social-publisher.ts` (Graph v21,
FB feed/photos + IG media→media_publish com page tokens); `POST /api/social/posts/[id]/publish`;
`POST /api/social/publish-due` (cron 5min); aba Publicar (SocialComposer: conta, gerar
com IA, hashtags, mídia, agendar, histórico). Persona alimentada pelo Vidente/pescaria.

Falta:
1. **Twitter/X e Pinterest**: rotas OAuth existem (`src/app/api/social/connect/*`),
   `available: false` no painel — precisam de app keys nas plataformas (Ricardo cria os apps).
2. LinkedIn, TikTok, WhatsApp: do zero.
3. **"Criar imagem com IA" no Composer** (hoje só URL manual) — ligar no Studio.
4. **Sync de métricas** dos posts publicados (rota `/api/social/sync` existe; agendar pós-publicação).
5. **Verificar que `/api/social/generate` usa os sinais novos**: o prompt de geração
   deve incorporar `socialPersona.audienceInsights` e `primaryInterests` (é onde o
   Vidente/pescaria escrevem via `/api/user/persona-signals`). Se não usa, é 1 edit no
   system prompt da rota.

## 🟢 3.6 Sobras visuais (assets PRONTOS sem superfície — vitórias baratas)

| Asset (já em public/) | Onde ligar |
|---|---|
| `blog/covers/*.webp` (13 editorias) | `artForTag()` em `src/lib/ai-news.ts` ainda sorteia a pool antiga — mapear tag→capa nova |
| `portal/arcade/batalha/*.webp` (5) e `caca/*.webp` (5) | cenários/estados dos jogos BatalhaPrompts e CacaPrompt |
| `fx/*.webp` (10 celebrações: nivel-up, conquista, streak-7, vazio-inspirador, erro-fofo, xp-chuva…) | toasts, empty-states, 404, level-up |
| `portal/conta/{seguranca,notificacoes,privacidade}.webp` | abas correspondentes de Minha Conta (o hero já usa perfil-hero) |
| `portal/dash/boas-vindas-loop.webm` (224KB, pronto) | PortalTour do 1º acesso OU página de registro (lembrar: máx 1 vídeo/página) |
| `portal/dash/jornada.webp` | widget "Sua Jornada" do dashboard |
| Registrar §12 no `IDENTIDADE_VISUAL.md` | receita da fusão (§2.3 deste doc) + exemplos |

## 🟢 3.7 E-mail/growth — monitorar e completar

- Conferir `followup_*.log` na VPS após os primeiros disparos automáticos (cron 12h UTC)
  e o painel da Resend (deliverability/bounces — domínio é novo no Resend).
- Consentimento LGPD explícito no formulário de cadastro (opt-out já existe em
  Preferências; rotas de privacidade/exclusão de dados existem).
- Notificação de novo aluno também via Telegram/MC (hoje é e-mail ao admin).

## 🔵 3.8 Radar P7 (visão de produto — nada se perde)

USS multi-tenant como produto (ultimatesocialsuite.shop vazio; usspartners = simulador
equity) · WorldForge comercial (SSO conta FayAI, "cada assinante seu estúdio"; código em
`C:\Users\ricar\WORKSMAIN\Claude New TCH\web`) · Audiobook IASF com Qwen3-TTS (conteúdo
**SAGRADO — nunca alterar, só narrar**; node ComfyUI-QwenTTS instalado) · Reel IASF V2
(V1 tem defeitos; imagens+narração prontas) · Reel template V4 vendável (9/10) ·
Visão de Jogo (SAM 3 + Roboflow; segredo de 2014 da Copa/Fox que Ricardo ainda vai
contar) · Condutor de Games ("é raro se sentir ajudado pelo jogo") · Som em Bando
(sync de música por microfone) · Unificar MC v1→v3 (agentes logam no v1!) · Media
pipeline com proveniência (abundance-manifest.json é o embrião; levar prompts pro Mongo)
· Character consistency TCH (Qwen Edit 2511 + Multiple-Angles LoRA → LoRA por
personagem; ver PESQUISA_COMFYUI.md) · ACE-Step 1.5 música (instalado, NUNCA testado).

## 👁️ 3.9 Vigias permanentes (checar toda sessão)

- **Search Console**: primeiras impressões previstas 15-16/07 — REPORTAR ao Ricardo.
- **Banda Netlify** (0,15GB desde 09/07; +100 imagens e 3 vídeos no ar agora).
- **Proxy kirmes**: se hermes/news/TCH devolver vazio → modelo :free morreu (receita §1.4).
- Logs diários VPS: news, course_audit, followup, uss_publish.
- **Primeira auditoria automática de curso**: 15/07 11h BRT — conferir courseaudits.

---

# 4. ARMADILHAS CONHECIDAS (custaram tempo real — não repita)

1. `docker exec kirmes hermes --yolo` → retorna VAZIO. Nunca usar `--yolo`.
2. FREE_MODEL: o **drop-in override.conf** vence o unit do systemd — editar lá.
3. Chunks do dev server cacheiam: **Ctrl+Shift+R** antes de concluir que algo quebrou.
4. Mudança no Atlas = produção na hora (dev e prod compartilham o banco) — §2.2.
5. Mongoose strict: campo novo sem declarar no schema é descartado em silêncio.
6. `courseprogresses.courseId` é SLUG (string), não ObjectId.
7. Player lê `products.courseContent`; `courses.modules.lessons` é estrutura/metadados.
8. API `/api/social/accounts` responde `{accounts:[...]}` — o painel já quebrou uma vez
   por tratar como array.
9. NUNCA converter escapes `\uXXXX` com regex ingênuo em shell — surrogates de emoji
   quebram. Receita segura: `JSON.parse('"'+match+'"')` sobre runs consecutivos
   (script pronto era `scratchpad/fix-unicode.js`).
10. Netlify CLI `api createDnsRecord` → 422; usar REST com o token do config.json.
11. Resend free = 1 domínio só. fayai.com.br OCUPA o slot (não criar outro).
12. curl para fayai.com.br sem User-Agent de browser → 403 (geoblock/anti-bot).
13. `/blog` redireciona para `/noticias` — nunca linkar `/blog` como destino de conteúdo.
14. Preview pane do Claude congela às vezes — verificação visual confiável é no Chrome
    real (quando conectado) ou por DOM/`get_page_text`.
15. `next dev` roda com turbopack; `middleware` = `src/proxy.ts` (Next 16 renomeou);
    route handlers: `params` é `Promise<{...}>` e precisa de `await`.

---

# 5. O QUE FOI ENTREGUE (14–15/07, registro para não refazer)

**P0** XP do logado idempotente (gate/claim-xp incremental + GET estado + home do aluno).
**Reprecificação** R$29–199, 21 ativos, 4 arquivados (Banana Dev = plataforma MORTA
desde 3/2024, detectado na auditoria). **Vitrine blindada** (curso do mês só produto
ativo + página defensiva; override monthly_offers 2026-07 = chatgpt-zero GRÁTIS).
**Asaas produção** E2E (boleto/assinatura/webhook idempotente; preços 100% servidor).
**P1 completo** (5 minigames, rotação sem repetição, vocabulário/glossário, 25 rodadas
Qual Prompt, 30 cartas VoM com arte exclusiva, hero §12). **P2 desafios** (traduzidos,
3 passos, CTAs reais). **P3 certificados** (arte por ferramenta, nome em HTML, página
pública, LinkedIn, PDF). **P5 COMPLETO** (Resend verificado + boas-vindas + aviso admin
nos 4 caminhos de criação + D+2/D+7 com cron). **P6 temas** (4 esquemas no player —
já existia, verificado). **USS publicador** (lib Graph v21 + publish + publish-due +
cron 5min + aba Publicar + fix crash contas Pro + 182 escapes corrigidos).
**Hermes×MC auditor** (prepare→hermes→publish→MC; ações no executor; cron diário;
prova Gemini 4/10; modelo do proxy trocado ressuscitando TCH/news). **1.895 aulas
limpas** de boilerplate vazado (backup no Atlas). **100 artes + 3 vídeos** fusão
vetor+foto (manifest com prompts/seeds). **Coleta de dados do usuário**: persona-signals
(merge aditivo no socialPersona do USS, +10 XP honesto) + PersonaFisher (1 pergunta/jogo)
+ **O VIDENTE** (akinator da persona com artes e vídeo próprios). **Blog IA Hoje**
(rename total + 3 guias mortos viraram artigos evergreen `guia-*` + hero-vídeo).
**Dashboard** com arte contextual em 6 widgets (fim da galeria aleatória). **Minha
Conta unificada** (/configuracoes → redirect; deep-link ?tab=; sidebar 1 item; hero).
**Limpezas**: teste-claimxp apagado, contas técnicas de QA zeradas.

---

# 6. ORDEM SUGERIDA DE SESSÕES (para o Opus 4.8)

1. **Sessão de destrave com o Ricardo** (§3.0): FB/IG + Vidente + e-mails + PIX + Turnstile.
   Enquanto ele testa, fazer as vitórias baratas §3.6 (sobras visuais).
2. **F5 páginas únicas** (§3.2) — 1–2 sessões; pipeline §2.3 pronto.
3. **Painel MC + pipeline de correção de cursos** (§3.4.1–2) — 1 sessão; é o que
   transforma o auditor em melhoria real.
4. **F6 QA + funil PostHog** (§3.3) — 1 sessão.
5. **USS nível 2** (§3.5) + relevância de mercado dos cursos (§3.4.3).
6. Radar §3.8 por apetite do Ricardo.

*Boa sorte. O sistema está redondo: GPU local gera no estilo aprovado, a VPS audita e
publica sozinha, o e-mail funciona, e cada jogada do usuário agora ensina o site a
conhecê-lo. Continue medindo pelo critério da promessa (§0).*
