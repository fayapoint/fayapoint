# HANDOFF MESTRE — Parte 2/3: O que temos e FUNCIONA (stack, infra, pipelines, skills)

*13/07/2026 · Tudo aqui foi usado e comprovado. Caminhos exatos para não redescobrir nada.*

---

## 1. Tech stack do site (fayapoint-ai)

| Camada | Tecnologia | Notas comprovadas |
|---|---|---|
| Framework | **Next.js 16** (App Router, turbopack) | middleware = `src/proxy.ts` (Next 16 renomeou); route handlers: `params` é `Promise<{...}>` e precisa de await |
| UI | React 19 · Tailwind 4 (CSS-first, `@theme inline`, SEM tailwind.config) · shadcn/ui · framer-motion · lucide-react | tokens do dashboard escopados em `[data-dashboard-shell]`; LucideIcon para props de ícone |
| i18n | next-intl (`pt-BR`, `en`) | locale via cookie NEXT_LOCale + geo headers; SEMPRE testar rotas com prefixo |
| Auth | JWT próprio (`{id,email,role}`, roles student/instructor/admin) em cookies httpOnly `token`+`fayai_token` (7d, lax) + espelho localStorage `fayai_token`/`fayai_user` | **`POST /api/auth/refresh`** re-emite cookies de Bearer válido (auto-cura, 13/07); Google OAuth só seta cookies |
| DB | MongoDB Atlas — dbs: **fayapoint** (users, courses, courseprogresses, storeproducts...), **fayapointProdutos** (products com `pricing.price`, products_prices), USS: `Ultimate_social_suite_DB`, worldforge, mission-control | conexão via `MONGODB_URI` em `.env.local` |
| Pagamentos | Asaas (PIX/cartão, `asaasCustomerId`, subscriptions) + MercadoPago preference | ⚠️ E2E nunca validado em produção |
| Anti-abuso | proxy.ts: rate-limit (Redis/Upstash via `lib/rate-limit`), bot-detection, honeypots; edge function `geoblock.ts` (BR-only, 403 na edge, crawlers verificados por IP oficial) | curl sem headers de browser → 403 (usar UA+Accept-Language ao testar API) |
| Analytics | PostHog + GTM + Ahrefs | funil da trilha ainda não instrumentado (F6) |
| Mídia | Cloudinary (plugin netlify, fetch `dfd7iigzq`) + `/public` local WebP | migração total p/ Cloudinary = roadmap antigo |
| Deploy | GitHub `fayapoint/fayapoint` → Netlify "fayai" (auto, ~3min) | Netlify CLI autenticada; DNS por API; banda: 0,15GB desde 09/07 (buraco 78GB fechado) |

**Rotas-chave**: grupo `(site)` com `SiteChrome` no layout (Header/Footer 1x; bare: `/portal`, `/receipt`); `/projetos` e `/noticias` fora do grupo com `ExperienceNav` (auth-aware + breadcrumb); 404 = `not-found.tsx` + catch-all `[...rest]`; portal = SPA por abas (`activeTab`) com `DashboardSidebar`/`MobileBottomNav`.

## 2. Infra externa (mapa)

| Coisa | Onde / como |
|---|---|
| VPS | `ssh root@76.13.234.38` (Hostinger KVM4, Ubuntu 24.04) — kirmes-proxy :7860 (OpenAI-compat, FREE_MODEL=openai/gpt-oss-120b:free; se quebrar: listar `:free` em openrouter.ai/api/v1/models), openclaw-bridge :3100, vps-task-executor (polla `agenttasks` no Mongo mission-control 30s, allowlist local) |
| Crons VPS (BRT) | 7h notícias (`/root/kirmes/fayai_news_daily.sh` → 3 matérias pt-BR, logs `/root/kirmes/logs/fayai_news_YYYYMMDD.log`) · 10h TCH worldbuilding (`tch_worldbuilding_loop.sh` v2 consertado 13/07: binário `/opt/hermes/.venv/bin/hermes`, `-z` one-shot, `--yolo` QUEBRA, saída via `/opt/data` → rsync) · seg 8h relatório semanal |
| Mission Control | repo `mission-control/` → mc-faya-dashboard-v3.netlify.app (⚠️ agentes logam no v1 — unificar); painel VPS com 11 ações allowlisted + heartbeats |
| ComfyUI local | `C:\WORKS\ComfyUI` **porta 8000** (v0.27.1, RTX 5060 Ti 16GB); ligar: `Start-Process .venv\Scripts\python.exe main.py --port 8000` |
| WorldForge | código `C:\Users\ricar\WORKSMAIN\Claude New TCH\web` → worldtch.netlify.app (Mongo `worldforge`) |
| Segredos | `.env.local` (JWT_SECRET, MONGODB_URI, Asaas...); AINEWS_SECRET (Netlify + VPS); GEOBLOCK_BYPASS_SECRET |

## 3. Pipelines ComfyUI comprovados (parâmetros exatos na skill comfy-local)

| Uso | Pipeline | Tempo | Prova |
|---|---|---|---|
| Vetor mágico (cenas, nós, cards) | **Z-Image Turbo** bf16, 8 steps, cfg 1, res_multistep/simple, CLIP qwen_3_4b (lumina2), VAE ae | ~4s | 8 cenas-espelho + 8 nós trilha + 6 artes arcade (13/07) |
| Fotorrealismo BR | **Qwen 2512 fp8 + Lightning 4-steps LoRA**, cfg 1.0, euler/simple, CLIP qwen_2.5_vl_7b, VAE qwen_image | ~14s | 70 fotos /projetos (12/07) |
| Edição/fusão | Qwen Image Edit 2511 (nós TextEncodeQwenImageEdit) | ~15-20s | instalado + Multiple-Angles LoRA (character consistency TCH) |
| Vídeo I2V | LTX 2.3 22B fp8 + distilled LoRA 0.5, two-pass upscale, ping-pong p/ >2.5s | 5-8min | reels V4/V7 (comfy-fayai) |
| Música | ACE-Step 1.5 (letra pt-BR!) | — | instalado, nunca usado — testar |
| TTS | Qwen3-TTS (voice design pt-BR) | — | piloto audiobook IASF pendente (node 1038lab/ComfyUI-QwenTTS) |

**Fluxo de produção padrão**: batch .py (submeter tudo → poll; 2 seeds/arte) → folha de contato ffmpeg xstack → curadoria visual → `ffmpeg -vf scale=768:-1 -quality 80 out.webp` (≤40KB) → `public/...` → manifest/commit. Scripts vivos: `scripts/generate_landing_scenes.py` (adaptar p/ qualquer batch). Regra: prompts NUNCA geram texto legível (UI = "abstract rounded bars, no letters"); mão humana quebra o mundo vetor (regerar).

## 4. Skills & ferramentas (como trabalhar)

- **comfy-local** — geração local (fonte de verdade de nós/modelos; seção FayAI no fim). **comfy-fayai** — reels/vídeo (V7, ASS subs, SFX).
- **Dev server**: `preview_start fayapoint-dev` (3000); ⚠️ pane do preview CONGELA → verificar via **claude-in-chrome** (Chrome real do Ricardo, sessão logada) com **Ctrl+Shift+R obrigatório** (chunks cacheiam).
- **Verificação**: typecheck `npx tsc --noEmit` (via `eval "$(fnm env --shell bash)"`); testar SEMPRE no Chrome real antes de push; curl de API precisa de headers de browser (anti-bot).
- **gstack/browse/qa** — QA headless com screenshots; **design-review/plan-*** — revisões; **course-creator** — cursos completos direto no Mongo.
- **Memória persistente**: `~/.claude/projects/C--Users-ricar-WORKSMAIN-autoresearch/memory/` (MEMORY.md = índice; progress_ux_reforma.md = estado da reforma).
- **Netlify CLI** autenticada; **mongosh/node** direto no Atlas via .env.local.

## 5. Identidade visual (fonte: `IDENTIDADE_VISUAL.md` v1.1)

Dois mundos (§4): vetor mágico (Z-Image) + foto cinematográfica BR (Qwen). Navy `#0c0e1d` palco; ouro `#f5c04e` = marca/recompensa/CTA SOMENTE; cores de categoria = navegação (ciano trabalho, violeta estudos, rosa criar, lima dia-a-dia); Bebas Neue caixa alta display; liquid glass (§5) com regras de robustez (conteúdo NUNCA depende de animação; prefers-reduced-motion desliga tudo). **§9 regra do espelho** (imagem encena o texto — receitas de prompt), **§10 animação por camadas** (Liga A Framer Motion ≤40KB/camada; Liga B vídeo-loop ≤400KB 1/página), **§11 método** (blueprint antes de código, 1 direção de arte por página de projeto, 3 passes de iteração NO BROWSER, dados>gosto). §8 nunca: texto em imagem, contadores falsos, marrom dominante. *Pendente: §12 mix vetor+foto (P1 desta reforma — ver Parte 1 §3).*

## 6. O que foi SHIPPED e verificado (registro)

**13/07 (esta sessão épica)**: `10b654c` auth auto-cura (logout fantasma morto) · `248dc1f` pertencimento pós-login · `fd3e959` nav global F2 (60 arquivos) · `a025e35` 8 cenas-espelho minigame · `597e365` trilha 8 nós F3 · `0056df9` tour + chip Cubo fora · `d3bff10` Monte o Prompt · `b875ff1` Arcade da IA (aba + 2 jogos novos + banner + backlog). VPS: loop TCH consertado (1ª expansão da história: `2026-07-13_davi-mother.md`).
**12/07**: SEO destravado (robots/sitemap/geoblock IP-verificado, GSC verificado, Googlebot passou), home nova minigame, /projetos + 7 páginas (70 fotos), hub notícias, temas portal, IDENTIDADE_VISUAL v1.0, ~245 imagens.
**Confirmações de funcionamento autônomo**: IA HOJE 2 ciclos 100% autônomos (12-13/07); 1º usuário orgânico (Epaminomas, 11/07); banda 0,15GB no período.
**Docs vivos no repo**: `PLANO_UX_NAVEGACAO.md` (diagnóstico+6 fases), `MINIGAMES_BACKLOG.md` (12 mecânicas), `IDENTIDADE_VISUAL.md`, `PESQUISA_COMFYUI.md` (workspace), `HANDOFF_SESSAO_2026-07-13.md` (sessão 12-13).

*→ Parte 3: o plano integrado priorizado (P0–P7) com implementação detalhada.*
