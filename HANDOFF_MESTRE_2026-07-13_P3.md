# HANDOFF MESTRE — Parte 3/3: Plano Integrado Priorizado (P0–P7)

*13/07/2026 · Tudo que foi falado (planos atuais + conversas passadas via memória) + o que percebi que falta. Ordem = impacto na promessa ("ajudar a entender IA") × urgência. Cada P tem implementação concreta.*

---

## P0 — RESPEITAR O JOGADOR LOGADO (o XP nunca mais é jogado fora) 🔴 primeira coisa da próxima sessão

**Meta**: quem se logou é recebido como aluno, nunca como anônimo.
1. **Pill de XP real**: em `NovaLanding`, se `isLoggedIn`, a pill mostra `user.progress.xp` (com nível), não o contador local do gate.
2. **Crédito imediato**: adaptar `POST /api/gate/claim-xp` (ou criar `/api/gate/earn`) para modo incremental: `{exampleId, acertou}` → +50/+75 no `progress.xp` do user autenticado, idempotente por `(userId, exampleId)` (coleção `gateclaims` ou array `progress.gateExamples`). No jogo logado: toast dourado "+75 XP creditados na sua conta ✨" + pill anima.
3. **Home do aluno**: logado, acima do minigame: faixa "Continuar minha trilha (X de 8)" + os exemplos JÁ jogados marcados (sem re-farm de XP — jogável de novo como treino, rotulado). Anônimo: fluxo atual intocado (gate → resgate no cadastro).
4. **Aceite**: logar → home mostra XP real → jogar credita na hora → portal reflete sem F5. Zero caminho que descarte progresso.

## P1 — MINIGAMES 2.0 (de "ok" para inesquecível)

1. **Banco de conteúdo ≥10 rodadas/jogo com rotação**: extrair dados para `src/data/games/{verdade-mito,qual-prompt,monte-prompt}.ts`; Verdade ou Mito → 30+ cartas (sorteia 10 sem repetir na sessão — `localStorage fayai_seen_{game}`); Qual Prompt → 15+ rodadas (temos 16 artes já geradas + gerar mais); Monte o Prompt → 6+ opções por ingrediente + "surpreenda-me".
2. **Ilustração por carta (regra do espelho §9)**: cada carta de Verdade ou Mito ganha cena própria (ex.: "IA alucina" → robô fofo com balão de pensamento surreal). Batch ComfyUI ~40 artes (~3min GPU).
3. **Ensinar vocabulário/conceitos**: cada rodada termina com chip "📖 palavra nova: *alucinação*" (tooltip ilustrado); glossário vivo em `/recursos/glossario` linkado. Conceitos: prompt, token, contexto, multimodal, alucinação, fine-tuning, agente, RAG...
4. **Mix vetor+foto (§12 nova)**: cartas selecionadas com contraste vetor/fotorreal no mesmo quadro (composição por camadas; ver Parte 1 §3) — demonstração viva do nosso domínio generativo.
5. **Vídeo leve**: 1 loop LTX no hero do Arcade (≤400KB WebM, lazy, 1 só) + microanimações de vitória (confete já existe na landing — extrair componente comum `FxConfetti`).
6. **Terminar os CONSTRUINDO**: Batalha de Prompts (votar no melhor de 2 prompts + porquê) e Caça ao Prompt (arrastar peças para lacunas — Framer Motion Reorder). Backlog completo: `MINIGAMES_BACKLOG.md` (12 mecânicas, incl. Detector de IA, Alucinação ou Fato, Arena semanal com XP real).

## P2 — DESAFIOS RENASCIDOS (explicar, dar a mão, celebrar)

1. Cada desafio = card ilustrado (arte própria) + **"como fazer em 3 passos"** + botão que LEVA à ação (study_30min → abre curso em andamento; generate_image → abre Studio com prompt sugerido).
2. Traduzir descrições (hoje "Study for 30 minutes"), conclusão com celebração animada (confete + selo), calendário de atividade com arte (chamas nos dias ativos — arte da trilha `sequencia-3-dias` como referência).
3. Streak freeze explicado com ilustração; missão semanal com barra viva.

## P3 — CERTIFICADOS QUE DÃO ORGULHO

1. **Arte por curso** (ComfyUI, moldura da identidade + cor da ferramenta) com nome do aluno tipografado por cima (HTML/canvas → não texto em imagem gerada).
2. **Página pública de verificação linda** (`/verificar-certificado/[code]`) — é um outdoor: hero com a arte, nome, curso, data, botão "Compartilhar no LinkedIn" → growth orgânico.
3. Painel Certificados: estado vazio inspirador ("seu primeiro certificado está a 1 curso de distância" + CTA trilha).

## P4 — COMERCIAL APTO A RECEBER 🔴 (dinheiro na mesa)

1. Corrigir no Mongo `fayapointProdutos.products`: "Primeiras Automações" e "Midjourney Masterclass" (price 0 → definir; se isca grátis, UI "GRÁTIS" explícita); avaliar deletar "Mastering AI with ChatGPT" (órfão em inglês, price 0); **de-duplicar Perplexity** (2 produtos, preços conflitantes 297 vs 147).
2. **Validar paywall E2E em produção**: compra PIX real de R$1-5 via Asaas (item antigo do PLANO_TRACAO, NUNCA feito) + cartão; conferir webhook `api/payments/webhook` liberando matrícula; documentar o fluxo.
3. Turnstile: criar chave real no Cloudflare → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` na Netlify.
4. Revisar `products_prices` (88 docs) vs products (fonte dupla de preço?).

## P5 — FOLLOW-UP: ninguém se cadastra e fica no vácuo

1. **E-mail de boas-vindas** imediato (nome + trilha + 1 minigame + "responda este email com sua dúvida de IA" — canal humano). Infra: começar com Gmail API da conta FayAI (gws-cli/agendador na VPS) ou Resend (avaliar; volume baixo).
2. **Sequência**: D+2 "seu próximo passo na trilha" (dinâmico pelo progresso) · D+7 inativo "sentimos sua falta + carta nova do Verdade ou Mito". Opt-out obrigatório em todos.
3. **Notificação a Ricardo por cadastro novo** (cron VPS → Telegram/MC): nunca mais descobrir usuário por acaso.
4. Registrar consentimento/marketing no User (LGPD) — já existe exclusao-de-dados/privacidade.

## P6 — CONTINUIDADE das fases abertas

- **F5 Projetos únicos**: 1 direção de arte POR projeto (USS dashboard vivo ciano · WorldForge fantasia editorial rosa · Visão de Jogo esporte cinético lima · Condutor arcade retrô laranja · Livros biblioteca noturna violeta · Cursos ateliê dourado · IA Hoje jornal do futuro), blueprint §11 no topo do arquivo, **screenshots reais** (WorldForge vivo em worldtch.netlify.app — capturar via browse), 3 passes de iteração no browser cada.
- **F6 QA + dados**: crawl interno completo (0 becos/404), funil PostHog da trilha (nó→aula→minigame), evento de logout involuntário (provar que o D1 morreu), mobile QA (MobileBottomNav em todo shell).
- **Temas de leitura (abr/2026, nunca feito)**: 4 esquemas no player de curso (dark atual, light, sépia/quente, alto-contraste) — dor real de usuário (dor de cabeça no mobile).

## P7 — RADAR COMPLETO (tudo falado fora dos planos ativos — nada se perde)

**Produto/receita**: resgate USS como módulo real do portal (models SocialPost/SocialAccount + OAuth Meta/Google PRONTOS; ultimatesocialsuite.shop vazio; usspartners = simulador equity) · WorldForge comercial (SSO conta FayAI + multi-tenant "cada assinante seu estúdio"; MC multi-tenant como produto) · monetização livros/audiobooks (piloto Qwen3-TTS narrar IA Sem Filtro — conteúdo SAGRADO, só narrar) · reel IASF V2 (V1 tem defeitos; imagens+narração prontas) · reel template V4 vendável.
**Projetos visionários**: Visão de Jogo (SAM 3 + Roboflow sports; segredo de 2014 da Copa/Fox que Ricardo ainda vai contar) · Condutor de Games (copiloto que ajuda o jogador; tese "é raro se sentir ajudado pelo jogo"; ex. FIFA UT) · Som em Bando (sync de música por microfone entre celulares; karaokê com separação de voz).
**Infra/técnica**: unificar MC v1→v3 (agentes logam no v1) · media pipeline com PROVENIÊNCIA (prompt de cada imagem salvo no Mongo + reverse-engineering de prompt; convenção de nomes; Cloudinary total) · MC "nerve center" (controlar/pausar agentes, logs streaming, cada subagente visível) · character consistency TCH (Qwen Edit 2511 + Multiple-Angles → dataset → LoRA por personagem; AI-Toolkit) · ACE-Step 3 trilhas para reels (20min, nunca testado) · limpeza teste-claimxp · estudo ultraprofundo ComfyUI contínuo ("não usamos nem metade").
**Vigias permanentes**: Search Console (primeiras impressões ~15-16/07 — REPORTAR!) · banda Netlify · news.log diário · proxy Kirmes (se cair: modelo :free morreu).

---

## Ordem sugerida de sessões
1. **P0 + P4.1** (XP logado + preços R$0) — meio dia, impacto máximo.
2. **P1** Minigames 2.0 (banco+artes+vocabulário+2 jogos novos) — 1 sessão cheia.
3. **P2 + P3** (Desafios + Certificados) — 1 sessão.
4. **P4.2-4 + P5** (paywall E2E + follow-up) — 1 sessão (com Ricardo para o PIX real).
5. **F5** (7 páginas únicas) — 1-2 sessões.
6. **F6 + P6 temas** — 1 sessão. Depois: radar P7 por apetite.

**Critério de aceite global**: uma pessoa que nunca usou IA entra, entende o que é possível em 30 segundos, joga, aprende uma palavra nova, se cadastra, é recebida por nome, seu esforço NUNCA é descartado, e sabe sempre qual é o próximo passo. Isso é cumprir a promessa.
