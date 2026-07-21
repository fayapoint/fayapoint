# MASTERPLAN — O caminho completo até "o site bom"
**Criado em 16/07/2026 (noite), a pedido do Ricardo. Este documento SUPERSEDE o PLANO_RICARDO_2026-07-16.md e é a fonte única de verdade. Nada sai daqui sem estar PRONTO-DE-VERDADE (§1).**

---

## 🔴 LEIA ANTES DE ABRIR QUALQUER SESSÃO — §8 (política de modelo e esforço)
**Cartão de bolso em §8.6.** Escolher o modelo certo ANTES de começar é a diferença entre queimar 20% da cota semanal numa terça e chegar no domingo com folga. Resumo: **Fable decide · Opus constrói · Sonnet mantém · Haiku faz o trivial · sessão nova a cada mudança de assunto.**

---

## ⏩ SESSÃO 20/07 (noite) — COMEÇAR POR AQUI

**Contexto:** Ricardo trouxe 6 frentes: (1) custo do Hermes ($6 num dia após a troca pro Kimi K3), (2) usar a API da assinatura ChatGPT dele, (3) prioridade continua estabilidade do site antes de conteúdo de curso, (4) anúncio do chatgpt-zero na home (R$29 vs. grátis do mês, sem menção) + decisão: cobrar valor simbólico ~R$5, (5) tráfego + delegar Instagram da fayai pra agentes, (6) bug: imagem no Studio cobrada no OpenRouter mas com erro.

**✅ FEITO 20/07:**

1. **Custo do Hermes ESTANCADO** — causa: a troca de 19/07 pôs Kimi K3 (**$3/M in, $15/M out** — preço de modelo topo!) em TUDO que passa pelo kirmes-proxy, inclusive os crons agênticos pesados (TCH worldbuilding 13h, auditoria de cursos 14h — 41 chamadas desde 19/07, quase todas dos crons). Solução deployada e testada na VPS: **proxy com 2 rotas** — `kirmes-proxy` (padrão) agora usa Gemini 3 Flash Preview ($0.50/$3, 5-6x mais barato) com fallback Gemini 2.5 Flash; `kirmes-premium` usa Kimi K3 (fallback na cadeia barata) e SÓ o blog diário (`fayai_news.py`) pede essa rota. Ambas as rotas verificadas com chamadas reais. Estimativa: o mesmo workload de ontem cai de ~$6 pra ~$1/dia. Scripts versionados em `scripts/vps/` (model_proxy.py, fayai_news.py, kirmes-proxy.service com chave redigida). ⚠️ Kimi K3 "pensa" antes de responder — chamadas de teste precisam de max_tokens ≥ 200 ou o content vem vazio.

2. **API da assinatura ChatGPT FUNCIONANDO (custo zero)** — o `~/.codex/auth.json` local estava em `auth_mode: chatgpt` (OAuth da assinatura, de quando Ricardo usava com o OpenClaw). Instalei o Codex CLI (0.144.6) local E na VPS (auth.json copiado — fluxo headless oficial), `codex exec` testado nos dois: responde usando a assinatura, sem tocar em API paga. **Ainda não apontei nenhum cron pra ele** — proposta: migrar a auditoria diária de cursos (o maior consumidor de tokens) de hermes/OpenRouter pra `codex exec`, mas só depois de rodar 1 auditoria comparativa (qualidade do relatório hermes vs codex). ⚠️ Local e VPS compartilham o mesmo refresh token — se um dia a auth quebrar nos dois ao mesmo tempo, refazer `codex login` local e re-copiar o auth.json.

3. **Bug do Studio (cobrado + erro) RESOLVIDO** — causa raiz: **Netlify não tinha NENHUMA env CLOUDINARY_*** — a geração completava no OpenRouter (cobrança real), aí o upload pro Cloudinary explodia → "Erro interno do servidor". Nunca UMA geração de IA tinha sido gravada em produção (imagecreations só tem uploads/mockups até março). Consertado em 2 camadas: (a) as 5 vars CLOUDINARY_* configuradas no Netlify (contexto production), (b) hardening no route: se o upload falhar de novo, o usuário RECEBE a imagem crua (base64) com aviso, em vez de perder a geração paga. Reproduzido antes do fix com a conta QA free (HTTP 500 em prod); pós-deploy verificado — ver bloco de verificação abaixo. Nota: modelo default (Nano Banana) funciona sem `modalities`; teste local direto no OpenRouter gerou imagem ok ($0.039).

4. **Preço honesto do chatgpt-zero** — confirmado o mecanismo: existe **override ativo do Mission Control** (`fayapoint.monthly_offers`, 2026-07) com `freeCourseSlug: chatgpt-zero` — por isso ele é grátis pra qualquer conta, enquanto a home anuncia R$29 (de R$97, -62%). Implementado (código deployado + Atlas): override de julho passou a `freeCourseSlug: null` (agora aceito pelo código como "mês sem curso 100% grátis") **com chatgpt-zero adicionado ao pool beginner** (assinantes explorador+ continuam acessando pelo plano); preço avulso R$5 com `pricing.note` explicando o valor simbólico, exibida no card da home. **Números REAIS do Asaas** (consultados na API da conta): PIX R$1,99 fixo **e os primeiros 100 PIX/mês estão ISENTOS**; boleto R$1,99; cartão 2,99%+R$0,49. Ou seja: o repasse real é ~R$2 (não R$5) — o R$5 se justifica como **valor mínimo de cobrança do Asaas** + custo operacional, e a copy foi escrita assim ("valor simbólico que cobre o processamento"), sem prometer "repasse exato". ⚠️ DECISÃO PENDENTE do Ricardo: validar a copy e o valor (dá pra cobrar R$5 e ser honesto, mas não dá pra cobrar menos que R$5 no Asaas). **Fix adicional (commit ae11db5):** o fallback algorítmico (`computeAlgorithmicOfferSet`) elegia um curso grátis por conta própria enquanto o cache do override aquecia — a página de vendas ainda mostrava "Liberar grátis / R$0" depois do Atlas mudado. Agora o algoritmo NUNCA elege curso 100% grátis (regra de negócio permanente) e a página de vendas mostra "Preço simbólico" + a nota no sidebar (e suprime o ridículo "12x de R$0,42").

5. **Tráfego + Instagram delegado a agentes** — plano registrado como FASE 9 abaixo (não iniciado hoje; bloqueado primeiro em P.1: conectar FB/IG).

**Verificação pós-deploy (commit 05691b4):** ver critérios de aceite no fim do bloco — Studio gerando imagem em prod com conta QA, home mostrando R$5+nota, `/api/courses/monthly-offers` sem freeCourse, página de vendas do chatgpt-zero com CTA de compra (não "Liberar grátis").

## ⏩ SESSÃO 20/07 (parte 2, noite) — 4 vídeos destilados + Hermes no browser + estratégia de modelos

Ricardo trouxe 4 vídeos pra extrair o que serve. Transcripts completos salvos e analisados (yt-dlp, ~108K chars). O que foi FEITO e o que foi REGISTRADO:

**✅ FEITO nesta parte:**

1. **Hermes Dashboard no browser (pedido nº1 do Ricardo)** — o Hermes Agent já traz um dashboard web com aba de CHAT embutida (`hermes dashboard --tui`); estava simplesmente desligado. Criado serviço systemd `hermes-dashboard.service` na VPS: bind APENAS no IP Tailscale (`100.111.28.77:9119`) — inacessível da internet pública, acessível de qualquer aparelho do seu tailnet; sobrevive a reboot (espera o container kirmes subir). **Verificado fim-a-fim do PC do Ricardo: HTTP 200.** → **Acesse: `http://100.111.28.77:9119`** (adicionar aos favoritos). Critério de aceite: abrir no Chrome, ver o dashboard, conversar na aba Chat.

2. **Descoberta importante sobre auth Codex×Hermes**: o código do Hermes mantém sessão OAuth do ChatGPT SEPARADA do Codex CLI de propósito ("prevents refresh token rotation conflicts — one app's refresh invalidates the other's session"). Portanto: (a) NÃO copiar `~/.codex/auth.json` pro auth store do Hermes; (b) o nosso setup local+VPS compartilhando o mesmo auth.json do Codex tem risco teórico do mesmo conflito — se a auth quebrar nos dois, refazer `codex login` local e recopiar.

**✅ CONCLUÍDO 21/07 (madrugada) — Hermes rodando na assinatura ChatGPT:** Ricardo fez o OAuth; Hermes atualizado v0.11.0→v0.19.0 (dashboard ganhou tela de login — user `ricardo`, senha em `/root/hermes_dashboard_senha.txt` na VPS). Depois do OAuth ainda havia um bug: o bloco `model:` custom-endpoint do config.yaml contaminava todos os providers (qualquer chamada saía pro OpenRouter com Bearer VAZIO → "HTTP 401 Missing Authentication header"; flag `--provider` do -z não corrige). Consertado: config.yaml agora declara `provider: openai-codex / model: gpt-5.6-sol` como default (chat Telegram+dashboard = assinatura, custo zero — verificado: "Sou o GPT-5.6-sol"), crons pinados explicitamente no proxy barato via `docker exec -e OPENROUTER_BASE_URL=http://127.0.0.1:7860/v1 -e OPENROUTER_API_KEY=kirmes-local ... -m kirmes-proxy --provider openrouter` (verificado no journal do proxy), e `fallback_providers` aponta pro proxy (se a assinatura der 429, degrada pro Gemini Flash em vez de morrer). Backups: config.yaml.bak_20260720_model, *.sh.bak_20260721, container antigo kirmes_old_0110.

**⏳ PASSO DO RICARDO (histórico — já feito em 21/07):** plugar sua assinatura ChatGPT como cérebro do Hermes (nível 3 do vídeo, "super important"): abrir o dashboard acima → seção de providers/API keys → OpenAI Codex → login; OU na VPS: `docker exec -it kirmes /opt/hermes/.venv/bin/hermes auth add openai-codex --type oauth --no-browser` (imprime URL+código; aprovar no browser). Depois `hermes model` pra tornar GPT-5.x-codex o default do chat. Com isso o CHAT do Hermes (Telegram+dashboard) fica de graça na assinatura; os crons continuam no proxy barato (não mudam sozinhos — envs explícitos).

**📼 Destilado dos 4 vídeos (o que serve pra nós):**
- **Vídeo 1 (Hermes, 5 upgrades):** ✅ browser access (feito acima) · ✅ ChatGPT sub como cérebro (passo seu acima) · Firecrawl p/ pesquisa (60x mais rápido, extrai só texto+brand identity: logo/cores/fontes — tem free tier, candidato p/ Fase 9 research) · morning brief auto-melhorável (Hermes+Gmail/Calendar via Zapier MCP, permissões só-leitura, nunca enviar) · completion contracts (/goal com verify+constraints+boundaries — adotar como PADRÃO nos prompts de cron: pedir PROVA de conclusão; alinha com nossa regra do PRONTO).
- **Vídeo 2 (7 níveis):** estamos ~nível 4-5 (integrações+orquestração). Lições a adotar: modelo-por-tarefa em TODA skill/agent ("não usar astrofísico pra montar Lego") → virou a tabela §8 abaixo · SOUL.md do Hermes na VPS está genérico — enriquecer com o contexto fayai (negócio, métricas, missão) p/ respostas personalizadas · nível 6 = tarefas agendadas assíncronas (já fazemos via cron) · nível 7 = "um OS pra toda IA": nossa versão é o mission-control + memória compartilhada (não perseguir dashboard de terceiros).
- **Vídeo 3 (Higgsfield MCP + Fable 5, site cinematográfico):** técnica-chave REPLICÁVEL COM COMFYUI (sem esperar os 5 dias do Higgsfield): imagem-mestre cinematográfica → animar em clipes curtos → **extrair frames → canvas controlado pelo scroll** (GSAP ScrollTrigger + Lenis) → encadear clipes usando o ÚLTIMO frame de um como imagem-semente do próximo (continuidade perfeita). Pasta de fotos de referência (frente+perfil) p/ consistência de personagem. SEMPRE equilibrar com peso/SEO/mobile (o próprio autor avisa). → virou FASE 10 abaixo.
- **Vídeo 4 (Claude Design):** claude.ai/design incluso na assinatura Claude · **criar DESIGN SYSTEM primeiro** (upload logo/site → extrai voz, cores, tipografia, botões) e gerar TUDO com ele selecionado — senão sai genérico · templates: UI mockup, slides, docs, animação, 3D, HTML email · animações de motion graphics a partir de prompt+transcript com timestamps, export MP4 (ótimo p/ Reels/vídeos de curso!) · fluxo Design (iterar rápido, edição inline) → Claude Code (produção). **Ação barata de alto valor: Ricardo criar o design system "FayAI" no claude.ai/design usando IDENTIDADE_VISUAL.md + logo + site como insumos — vira fábrica de artes IG/slides/certificados on-brand pra Fase 9.**

## 🔎 AUDITORIA SEO NO SEARCH CONSOLE — 21/07 (a resposta para "por que ninguém entra")

Ricardo pediu para entrar no GSC e melhorar o tráfego. O diagnóstico achou uma cadeia de bugs que, juntos, tornavam o site **estruturalmente invisível** — não era falta de divulgação, era o site dizendo ao Google para não indexá-lo.

**Números encontrados (propriedade `sc-domain:fayai.com.br`):**
- Dados existem só de **11/07 a 19/07** (propriedade nova) — 9 dias.
- **1 clique, 59 impressões, posição média 11,6.**
- As 6 consultas são **todas variações da marca** ("fayai", "fayz ai", "fazer ai", "ai fay", "fay ai") + 1 de conteúdo ("seo local com inteligência artificial", 1 impressão). Zero descoberta por tema.
- A **home concentra 51 das 59 impressões**; só 12 páginas do site já apareceram alguma vez.
- Relatório de Páginas indisponível ("dados em processamento", lado do Google).

**Causa raiz nº1 — CANONICAL APONTANDO PARA A HOME (o mais grave).** `src/app/[locale]/layout.tsx` declara `alternates.canonical = ${SITE_URL}/${locale}`. No App Router, **toda página filha herda esse valor se não definir o próprio**. As páginas de curso definem o seu (por isso estão corretas); **as matérias do IA Hoje não definiam** — então cada artigo declarava `<link rel="canonical" href="https://fayai.com.br/pt-BR"/>`, isto é, "sou uma duplicata da home, indexe ela no meu lugar". Prova na Inspeção de URL: *"O URL não está no Google / O Google não reconhece o URL"*. Explica a home concentrar as impressões e nenhum artigo jamais ranquear. **CORRIGIDO** (commit 4dd8ffb): canonical próprio + OpenGraph `article` + twitter card nas matérias e no hub.

**Causa raiz nº2 — SITEMAP CEGO.** `src/app/sitemap.ts` tinha 3 defeitos simultâneos: (a) lia a lista **estática** `@/data/courses` em vez do banco — anunciava curso arquivado (`banana-dev-deploy-ia`) e **omitia 3 ativos, incluindo 2 dos 4 carro-chefe reformados** (`aprenda-a-usar-ia-no-dia-a-dia`, `rag-knowledge`); (b) **nunca incluiu nenhuma matéria** (19 publicadas, todas fora); (c) era função **síncrona** = congelada no build, então matéria nova só entraria no próximo deploy. **CORRIGIDO** (56e272c + 4dd8ffb): async, lê do banco, inclui as matérias em `/noticias/<slug>`, `revalidate = 3600`.

**Causa raiz nº3 — DESCOBERTA INTERNA QUEBRADA.** `/blog` responde **307 → `/noticias`** (e era `/blog` que estava no sitemap). O hub real `/noticias` está OK e linka 21 matérias no HTML servidor. Mas a Inspeção confirmou "Nenhum sitemap de referência" + "Nenhuma página de referência" para os artigos: os dois caminhos de descoberta estavam cortados ao mesmo tempo. **CORRIGIDO**: sitemap aponta para `/noticias` e para cada `/noticias/<slug>`.

**Bônus — visibilidade em agentes de IA (diretriz sua de 19/07).** `public/robots.txt` bloqueava **todos** os bots de IA. Reescrito em duas camadas: **liberados** os motores de resposta que citam e mandam usuário (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Google-Extended`); **seguem bloqueados** os de treino/scraping em massa (`GPTBot`, `CCBot`, `anthropic-ai`, `Claude-Web`, `cohere-ai`, `Diffbot`, `YouBot`). Reversível em 1 arquivo se você discordar.

### Otimização de títulos para busca — 21/07 (segunda parte, a pedido do Ricardo)

**Bug encontrado antes de otimizar:** `generateMetadata` da página de curso lia a MESMA lista estática defasada do sitemap — então **3 cursos serviam o título genérico `"Curso - FayAi AI Academy"`**: `rag-knowledge`, `ia-producao` e `aprenda-a-usar-ia-no-dia-a-dia` (dois deles carro-chefe reformados). O título é o maior sinal de relevância on-page e eles simplesmente não tinham um. **Corrigido** (fd8e0cc): agora lê `getProductBySlug` e usa `seo.metaTitle`/`seo.metaDescription` do banco — **títulos viraram dado editável no Atlas, sem deploy** — com fallback em cascata (banco → nome → lista estática → genérico).

**Pesquisa de termos:** usei o autocomplete do Google (pt-BR/br) — dado real de busca, não chute. Padrões que dominam no Brasil: **"grátis/gratuito/de graça"** aparece em quase todo tema; **"o que é"** (intenção informacional); **"curso"**; **"na prática"**; **"para iniciantes"**; **"com certificado"**; **"com n8n"** e **"para whatsapp"** como modificadores fortes em automação/agentes.

**19 títulos reescritos e gravados no banco** (backup em `products_seo_backup_20260721`). Regras: termo de busca **no começo**, ≤60 caracteres (senão o Google trunca), sufixo curto `| FayAI` — o antigo `- FayAi AI Academy` comia 20 dos 60 caracteres com uma marca que ninguém procura. Exemplos:
- `rag-knowledge`: genérico → **"O que é RAG em IA: curso prático de Knowledge Base | FayAI"** (busca real: "rag ia", "rag ia significado")
- `aprenda-a-usar-ia-no-dia-a-dia`: genérico → **"Inteligência Artificial no Dia a Dia: curso prático | FayAI"** (busca: "exemplos de inteligência artificial no dia a dia")
- `crie-agentes-de-ia-autonomos`: "Do Conceito à Produção" → **"Agentes de IA: o que são e como criar do zero | FayAI"** (busca: "agentes de ia o que são")
- `chatgpt-allowlisting`: → **"Como Aparecer nas Respostas do ChatGPT (AEO) | FayAI"**
- Home: "FayAi - Aprenda IA do Zero ao Avançado" → **"Cursos de Inteligência Artificial do Zero | FayAI"** (a marca sai da frente: as 6 consultas do GSC eram variações ERRADAS do nome)
- `/cursos`: → **"Cursos de Inteligência Artificial com Certificado | FayAI"**

**Correção de honestidade:** a descrição de `/cursos` prometia **"mais de 50 cursos"** — o catálogo tem **20 ativos**. Número inflado em página de venda queima confiança e não ajuda ranking nenhum. Corrigido para 20.

**`ia-sem-filtro-por-claude` ficou de fora de propósito** — conteúdo sagrado, não toquei nem no título.

**Aviso estratégico honesto:** título otimizado não cria autoridade. Com domínio novo, brigar por "curso de inteligência artificial" (SENAC/USP na 1ª página) é perder tempo; por isso mirei **cauda longa informacional** ("o que é RAG", "agentes de ia o que são", "exemplos de IA no dia a dia") — ganhável com uma página boa. O próximo passo real é **conteúdo que responda essas perguntas**, não mais ajuste de tag.

**Pendência de posicionamento:** `ia-producao` tem título novo, mas o termo "IA em produção" **não tem busca** (o autocomplete devolve produção de música/vídeo). O curso precisa de decisão sua sobre reposicionamento — é o candidato mais fraco do catálogo em demanda.

**Pendências registradas (não feitas):**
- [ ] Rota legada `/blog/[slug]` (client component, dados estáticos `@/data/blog-posts`) responde 200 servindo a listagem genérica para slugs de notícia — duplicata fraca. Ideal: 301 para `/noticias/<slug>`. Não mexi para não quebrar os posts legados.
- [ ] `Crawl-delay: 1` no robots para Googlebot é inócuo (Google ignora), mas pode sair.
- [ ] Sem dados de Core Web Vitals ainda (tráfego insuficiente).
- [ ] **O gargalo real depois disto é conteúdo com demanda de busca**: hoje nada no site responde a uma pergunta que brasileiros digitam. Os 4 cursos reformados + o blog diário são a matéria-prima; falta mirar termos ("como usar chatgpt", "curso de ia gratis", "o que é rag") em títulos/H1. Isso conecta com a Fase 9.4.

### FASE 9 — TRÁFEGO + INSTAGRAM AUTÔNOMO (planejada 20/07, executar após P.1)
A infra já existe quase toda (USS publicador + cron publish-due + OAuth FB/IG pronto + persona + manchetes IA Hoje no prompt). O que falta é ligar as pontas:
- [ ] 9.0 **BLOQUEADOR (Ricardo, ~10 min):** conectar FB/IG da fayai no USS (Perfil Social → Conectar) — o OAuth está pronto desde 14/07.
- [ ] 9.1 Cron diário de conteúdo IG: agente (kirmes/hermes via rota barata, ou codex exec com a assinatura) gera 1-2 posts/dia com o motor USS (persona fayai + manchetes das últimas 48h), agenda via USS; `uss_publish_due` (já roda a cada 5 min) publica sozinho.
- [ ] 9.2 Qualidade visual: imagem de cada post via Studio/ComfyUI (mediaPrompt do gerador → Composer já faz isso manualmente; automatizar a chamada).
- [ ] 9.3 Loop de melhoria: `sync-due` (7.1) já refina a persona pelo engajamento real — revisar semanalmente os top posts e ajustar temas.
- [ ] 9.4 Tráfego orgânico de busca: blog IA Hoje já publica diário; adicionar interlinks curso↔post e sitemap ping (baixo esforço, alto SEO).
- Critério de aceite: 7 dias seguidos de posts no IG da fayai sem intervenção manual, com engajamento medido no sync-due.
- [ ] 9.5 (novo, do vídeo 1) Adotar "completion contracts" nos prompts dos crons: todo job agêntico pede PROVA verificável de conclusão (arquivo gravado, URL 200, contagem exata) + constraints/boundaries explícitos.
- [ ] 9.6 (novo, do vídeo 4) Ricardo cria o design system "FayAI" no claude.ai/design (insumos: IDENTIDADE_VISUAL.md, logo, fayai.com.br) → artes de IG/slides on-brand com 1 prompt; opcional: avaliar Firecrawl free tier pra research de conteúdo.

### FASE 10 — HOME CINEMATOGRÁFICA (scroll-vídeo estilo Higgsfield, via ComfyUI) — planejada 20/07, PILOTO primeiro
Receita provada no vídeo 3, replicável 100% local (RTX 5060 Ti + Qwen image + LTX I2V, receitas que já dominamos da Leitura 2.0):
- [ ] 10.1 PILOTO: UMA seção hero para a home — imagem-mestre cinematográfica do universo fayai (Qwen 2512) → 1 clipe LTX de ~4-6s → script Python extrai frames → canvas com scroll-scrub (GSAP ScrollTrigger + Lenis), fallback estático p/ mobile/reduced-motion. Aprovação do Ricardo ANTES de escalar (§1).
- [ ] 10.2 Se aprovado: narrativa de 3-4 cenas encadeadas (último frame de cada clipe = semente do próximo) contando a jornada do aluno (caos → domínio da IA), respeitando peso (WebP/WebM comprimidos, lazy, LCP) — a home já perdeu banda Netlify antes, não repetir.
- [ ] 10.3 Quando o Higgsfield voltar (5 dias): comparar qualidade dos clipes (Higgsfield MCP direto no Claude) vs LTX local pros planos de câmera que o LTX não segura.
- Regra: NÃO tocar na home em produção antes do piloto aprovado; efeitos nunca podem quebrar SEO/mobile (aviso do próprio autor do vídeo).

## §8. ESTRATÉGIA DE MODELOS E ESFORÇO — como não queimar a cota (v2, 21/07 — PRIORIDADE 0 do Ricardo)

> **Contexto:** terça-feira, 20% da cota semanal já consumida. Esta seção existe para que isso não se repita. Leia §8.0 antes da tabela — o maior desperdício **não** é o nível de esforço, é rodar o modelo mais caro em trabalho que não precisa dele, com contexto gigante, em sessões longas.

### §8.0 — O que realmente consome cota (em ordem de impacto)

Quatro fatores se multiplicam. Mexer no primeiro vale mais que otimizar os outros três:

1. **Tier do modelo** — o fator dominante. Preço de API por milhão de tokens (proxy honesto do peso relativo na cota; a contabilidade exata da assinatura não é pública, mas a *proporção* entre modelos é o modelo mental certo):

   | Modelo | Entrada | Saída | Relativo a Sonnet |
   |---|---|---|---|
   | **Fable 5** (eu, por padrão) | $10 | $50 | **~3,3x** |
   | **Opus 4.8** | $5 | $25 | ~1,7x |
   | **Sonnet 5** | $3 | $15 (intro $2/$10 até 31/08) | 1x |
   | **Haiku 4.5** | $1 | $5 | ~0,3x |

   Ou seja: **a mesma tarefa em Sonnet 5 custa ~1/3 do que custa em Fable 5.** Você já fez a jogada certa nesta sessão ao trocar para Opus 4.8 — mantenha esse reflexo.

2. **Tamanho do contexto × número de turnos.** Cada turno reenvia a conversa inteira. Numa sessão longa com o MASTERPLAN (que já é enorme) relido várias vezes, o custo de *entrada* cresce quadraticamente. **Sessão longa em Fable 5 é o pior cenário possível** — foi o que aconteceu ontem.

3. **Nível de esforço (`effort`)** — controla profundidade de raciocínio e quantos tokens de saída são gastos. Real, mas menor que os dois de cima.

4. **Número de chamadas de ferramenta.** Esforço baixo consolida chamadas; esforço alto explora mais.

### §8.1 — Níveis de esforço: o que são e quando usar

Cinco níveis: `low` · `medium` · `high` (padrão) · `xhigh` · `max`. Esforço mais baixo = menos preâmbulo, menos chamadas de ferramenta, respostas mais diretas.

**A armadilha que quero desfazer:** "sempre usar o máximo para ter qualidade" está errado em duas direções.

- **Para baixo:** em **Fable 5**, `low` e `medium` continuam excelentes — a documentação oficial é explícita: frequentemente **superam o desempenho de modelos anteriores rodando em `xhigh` ou `max`**. Trabalho rotineiro meu não precisa de esforço alto.
- **Para cima:** em trabalho agêntico (várias ferramentas, várias etapas), **esforço alto no começo costuma REDUZIR o custo total**, porque resolve em menos turnos. Baixar tudo para `low` pode sair mais caro por multiplicar idas e vindas.

Recomendações por modelo (da referência oficial):

| Nível | Quando usar | Observação importante |
|---|---|---|
| `max` | Só quando acertar importa mais que o custo | Pode "pensar demais" e dar retorno decrescente. Reserve para o raro. |
| `xhigh` | Codificação e trabalho agêntico difícil | É o padrão do Claude Code. **Em Opus 4.8, NÃO use por reflexo** — 4.8 tem teto de inteligência mais alto; comece em `high`. |
| `high` | **Padrão.** Trabalho sensível a inteligência | O melhor equilíbrio qualidade/tokens na maioria dos casos. |
| `medium` | Economia consciente | Em Fable 5 entrega muito bem; em Sonnet 5 equivale ao Sonnet 4.6 em `high`. |
| `low` | Tarefas curtas e escopadas, subagentes, coisas não sensíveis a inteligência | Risco de raciocínio raso em problema complexo — se acontecer, **suba o esforço em vez de tentar contornar por prompt**. |

**Sinal prático:** se uma tarefa terminou **correta mas demorada demais**, o certo é *baixar* o esforço. Se terminou **rápida mas rasa**, *subir*. Não julgue pelo tempo isolado.

### §8.2 — Matriz: modelo + esforço por tipo de trabalho

Princípio (vídeo 2): "não usar astrofísico pra montar Lego". Sem gastar a mais: a assinatura Claude cobre Fable/Opus/Sonnet/Haiku; a assinatura ChatGPT cobre o Codex e o chat do Hermes; OpenRouter só no que sobrar; a GPU local faz mídia.

| Trabalho | Modelo | Esforço | Por quê |
|---|---|---|---|
| **Decisão de rumo**: arquitetura, incidente em produção, "por que ninguém entra no site", escolher entre caminhos caros, revisar se o plano está certo | **Fable 5** | `high` | Erro aqui custa semanas. É a única categoria que justifica o tier mais caro. **Sessão curta e focada** — entra, decide, sai. |
| **Implementação pesada já especificada**: feature grande planejada, refactor, lote de correções, auditoria técnica de sistema | **Opus 4.8** | `high` (subir p/ `xhigh` só se ficar raso) | ~90% do resultado em código puro por ~metade do custo de Fable. **É o cavalo de batalha.** |
| **Rotina**: scripts, QA, aplicar conteúdo aprovado, correções pequenas, verificações, deploy, mexer em config | **Sonnet 5** | `medium`–`high` | 1/3 do custo. Mais que suficiente. **Deveria ser a maioria das sessões.** |
| **Subagentes de busca/exploração** (varrer repo, achar arquivo, listar) | Sonnet 5 ou Haiku 4.5 | `low` | Esforço baixo é explicitamente recomendado p/ subagente. |
| **Glue trivial**: formatar, listar, converter | Haiku 4.5 | `low` | ~0,3x Sonnet. |
| Chat do Hermes (Telegram + dashboard) | **GPT-5.6 pela SUA assinatura ChatGPT** | — | **Custo zero.** Já configurado e verificado 21/07. |
| Crons da VPS (auditoria, TCH) | Gemini 3 Flash via kirmes-proxy | — | $0,50/$3 por M. Já pinado. |
| Blog diário IA Hoje | Kimi K3 (rota `kirmes-premium`) | — | Sua decisão; único consumidor da rota cara. |
| Mídia (imagens/vídeo de curso, home cinematográfica) | ComfyUI local | — | GPU própria, custo zero. |
| Volume/triagem/scoring mecânico offline | **LM Studio local** | — | Ver §8.4 — com ressalvas sérias de velocidade. |

**Regra de bolso:** **Fable decide · Opus constrói · Sonnet mantém · Haiku faz o trivial · as assinaturas absorvem o que puderem · OpenRouter só paga o que nenhuma assinatura cobre · a GPU local faz mídia.**

### §8.3 — Higiene de sessão (o maior ganho que está na SUA mão)

Isto vale mais que qualquer ajuste de esforço:

1. **Uma sessão = um assunto.** Quando o assunto muda (do SEO para o Hermes, do Hermes para a home), **abra sessão nova**. Continuar na mesma arrasta todo o histórico caro a cada turno.
2. **Escolha o modelo ANTES de começar**, pela primeira linha da tabela que descreve a tarefa. Trocar no meio não desfaz o que já foi gasto.
3. **Não use Fable 5 para sessões longas de execução.** Se a sessão vai ter dezenas de turnos e muitas ferramentas, é Opus ou Sonnet. Fable é para decidir, não para executar por horas.
4. **Peça o plano em Fable, execute em Opus/Sonnet.** Padrão que economiza muito: uma sessão curta em Fable produz o plano escrito no MASTERPLAN; uma sessão em Sonnet executa aquele plano.
5. **Trabalho não-interativo vai para cron/assinatura ChatGPT/local**, nunca para uma sessão minha aberta.

### §8.4 — LM Studio: o que ele resolve e o que NÃO resolve (medido em 21/07)

**Medi, não estimei.** Hardware: RTX 5060 Ti, 16 GB VRAM. Servidor acessível via Tailscale em `http://100.84.253.67:1234`, com 16 modelos disponíveis.

**Resultado da medição:** `gpt-oss-20b` respondeu uma classificação em **12,7s (6,2 tokens/s)**; `qwen3.5-9b` gastou 21s e devolveu **conteúdo vazio** (modelo de raciocínio consumindo tudo no "pensamento" — mesmo defeito que vimos no Kimi K3). No momento do teste a GPU estava **livre** (ComfyUI desligado, 2% de utilização), então **6-7 tok/s é a velocidade real desta máquina**, não disputa de recurso.

**O que isso significa na prática:**
- Uma resposta de 1.000 tokens leva **~2,5 minutos**. Uma API de nuvem faz o mesmo em segundos.
- Reescrever um curso de 30 capítulos localmente levaria **dias de máquina ligada**.
- **Conclusão honesta: LM Studio não substitui Claude/ChatGPT para nada interativo nem para geração de conteúdo longo.**

**Restrição de VRAM (importante):** com 16 GB totais e ~12,8 GB já ocupados com um modelo carregado + desktop do Windows, os modelos de 16 GB+ do seu catálogo (Qwen3.6 27B, Gemma 4 26B, GLM 4.7 Flash) **transbordam para a RAM e ficam ainda mais lentos**. A faixa utilizável é a de 6-13 GB. E o mais importante: **ComfyUI e LM Studio disputam a mesma GPU** — enquanto um gera vídeo de curso, o outro não roda modelo grande. É um ou outro, não os dois.

**Onde LM Studio VALE a pena (custo zero, latência irrelevante):**
- **Triagem/classificação em lote, offline**: passar 100 títulos e marcar "tem termo de busca? sim/não". Saída de 5-20 tokens é rápida mesmo a 7 tok/s.
- **Scoring mecânico contra checklist explícito** (não julgamento editorial).
- **Embeddings — MEDIDO E VALIDADO 21/07, é o melhor uso imediato.** `nomic-embed-text-v1.5` levou **768 ms por texto** (os 20 cursos do catálogo sairiam em ~15s, custo zero). E o teste **já achou um problema real**: os títulos que escrevi hoje para `n8n-automacao-avancada` ("Curso de n8n: automação com IA na prática") e `primeiras-automacoes` ("Automação com IA na Prática: curso para iniciantes") têm **similaridade 0,810 — os dois disputam o mesmo termo de busca**, canibalização que eu mesmo introduzi. ⚠️ **PENDENTE:** diferenciar um dos dois (sugestão: `primeiras-automacoes` mirar "automatizar tarefas repetitivas sem programar", deixando "automação com IA na prática" só para o n8n). Isso prova o caso de uso: rodar embeddings sobre todos os títulos + descrições e listar os pares acima de ~0,80 é uma varredura de canibalização de custo zero que dá para repetir sempre que o catálogo mudar.
- **Rascunho descartável** que um modelo bom depois reescreve.

**Onde NÃO vale:** qualquer coisa que o cliente vê, decisão de arquitetura, conteúdo de curso, copy de venda, código de produção.

⚠️ **Armadilha histórica que não pode repetir:** o LM Studio já ficou **inacessível por dias sem ninguém perceber** — foi a causa raiz do "IA HOJE" parado de 17 a 19/07. Qualquer coisa que dependa dele **precisa de health-check e fallback automático**, como o proxy tem hoje. Nunca colocá-lo no caminho crítico sem rede de segurança.

### §8.5 — Autoresearch no Mission Control: resposta honesta

**Está configurado?** Não. Existe o *padrão* de autoresearch documentado (`reference_autoresearch_pattern`) e existem skills (`homepage-autoresearch`, `story-autoresearch`), mas **não há loop de autoresearch rodando dentro do Mission Control** hoje, e o LM Studio não está ligado a nada — o proxy da VPS foi migrado para Gemini/Kimi justamente porque ele caiu.

**Seria bom?** Em partes — e vale ser específico, porque autoresearch é por natureza **caríssimo em tokens** (o loop gera muitas variantes e avalia cada uma). Rodá-lo em Fable 5 seria a maneira mais rápida de zerar a cota semanal.

- ✅ **Faz sentido**: o loop rodar em modelo **barato ou local**, com o Claude entrando **só no veredito final**. Ex.: LM Studio gera 20 variantes de título → um script mecânico filtra → Sonnet 5 escolhe as 3 melhores → você aprova.
- ✅ **Faz muito sentido agora**: usar embeddings locais (nomic) para achar canibalização de conteúdo no catálogo e no blog — custo zero, é exatamente o tipo de trabalho mecânico que a máquina faz bem.
- ❌ **Não faz sentido**: autoresearch de conteúdo editorial rodando em modelo local a 7 tok/s — o loop levaria dias e a qualidade dos modelos de 9-27B não chega perto do necessário para conteúdo que o cliente lê.
- ⚠️ **Pré-requisito que falta**: autoresearch só funciona com **métrica real de sucesso**. Hoje o site tem ~1 clique/semana no Search Console — **não há sinal estatístico para otimizar contra**. Montar o loop antes de ter tráfego é otimizar ruído.

**Recomendação:** **não montar autoresearch agora.** A ordem correta é (1) o SEO que consertamos começar a trazer impressões, (2) Fase 9 trazer tráfego de Instagram, (3) **aí sim** existir dado para um loop otimizar. Enquanto isso, o uso local de melhor retorno é embeddings para higiene de catálogo — barato, útil e não depende de tráfego.

### §8.6 — Cartão de bolso (o resumo de 20 segundos)

> **Vai decidir rumo?** Fable 5, `high`, sessão curta.
> **Vai construir algo grande já planejado?** Opus 4.8, `high`.
> **Vai fazer o resto (a maioria)?** Sonnet 5, `medium`.
> **É repetitivo, offline ou não-interativo?** Cron, assinatura ChatGPT, ou local.
> **Mudou de assunto?** Sessão nova.

---

## ⏩ SESSÃO 19/07 (tarde) — histórico

**Contexto:** os 4 cursos ficaram prontos pra vender (bloco 18/07 abaixo). Ricardo disse "vou revisar o conteúdo dos cursos ao longo da semana, continue o resto do masterplan e cuide do site" — sessão de hoje é toda em cima disso, sem mexer mais em conteúdo de curso.

**✅ FEITO 19/07:**

1. **4 contas de teste, uma por tier** (free/explorador/profissional/expert) — criadas pelo fluxo REAL de cadastro (`/api/auth/register`, não fixture direto no banco), depois upgradadas via Atlas (subscription+credits, espelhando `TIER_CONFIGS`, já que não há pagamento real pra simular). Credenciais salvas em memória (`reference_test_accounts`).

2. **Auditor hermes (P.2) consertado — dois bugs de verdade, não o que o MASTERPLAN antigo supunha:**
   - **Bug raiz:** `course_audit_prepare.js` exportava `fayapoint.courses.modules[].lessons[].content` — **dado morto** pra maioria do catálogo (confirmado nesta sessão: o reader só usa `fayapointProdutos.products.courseContent`). O auditor vinha avaliando conteúdo que nenhum aluno nunca leu. Prova: chatgpt-masterclass tinha 790KB de "250 aulas" fantasma vs. 65KB reais em 16 seções — isso também era a causa do "trava em cursos grandes" (12x mais texto que o necessário), não falta de chunking como se pensava.
   - **Bug secundário, achado ao testar:** hermes (`-z` one-shot) às vezes IMPRIME o relatório completo no stdout mas não grava o arquivo esperado — falha intermitente, reproduzida em make-integracao-total E chatgpt-masterclass antes do fix. Corrigido com fallback no shell script: captura o stdout, extrai a partir de `# Auditoria:` e grava no lugar esperado se o arquivo não existir.
   - **Verificado 3x**: chatgpt-masterclass (o curso que travava) completou em 5-8min (não trava mais), publicou no MC com `lessons: 16` (contagem real) e nota 5 — conferido direto em `mission-control.courseaudits`.
   - Scripts corrigidos versionados em `scripts/vps/` (cópia do que está deployado em `/root/kirmes/` na VPS 76.13.234.38; backups do original ficaram em `.bak_*` lá).
   - **Desbloqueia 1.4/1.5** — agora dá pra confiar no relatório do auditor pra propor patches de conteúdo desatualizado.

3. **0.5 Hardening de animação — feito de verdade** (não só descrito): hook `useTabHiddenAtMount` compartilhado, aplicado em `ArcadeVisual.tsx`/`TrailMap.tsx` (que não tinham NENHUM guard contra aba oculta no mount) + refatorado o guard já existente do reader pra usar o mesmo hook.

4. **Funil PostHog instrumentado** (`trail_node_click`, `lesson_view`, `minigame_start`/`complete`) — com uma ressalva importante: o PalpiteGame já foi da landing pro Arcade (login), então "minigame" hoje é pós-cadastro, não pré. Isso preparou o terreno pro item 5.

5. **Os 5 minigames agora funcionam SEM CADASTRO** (pedido explícito do Ricardo, resposta ao achado do item 4): nova página pública `/arcade` (`src/components/landing/PublicArcade.tsx`) reaproveita os 5 componentes de jogo TAL COMO SÃO no portal (nenhum tem dependência de auth/API — só o Palpite tem, e esse já tinha um fluxo pronto de localStorage→claim-on-signup em `NovaLanding.tsx`/`ClaimLandingXp.tsx` que eu só descobri existir, não precisei construir). Link novo no rodapé da home (`NovaLanding.tsx`). CTA de cadastro no fim da página, com tracking PostHog. **Fecha o funil nó→aula→minigame→cadastro que estava só documentado, nunca instrumentado.**

**⚠️ ARMADILHA NOVA 19/07 (grave, gastou tempo):** Turbopack dev pode manter uma INSTÂNCIA DE MÓDULO em memória mesmo depois de `preview_stop`+`preview_start` — o `.js` servido pelo browser CONTINHA o código novo (confirmado via fetch do chunk), mas o componente React montado continuava executando a versão antiga (array com 4 itens em vez de 5), e nem abrir aba nova resolvia. Só resolveu matando o processo `node .../next/dist/server/lib/start-server.js` DIRETO por PID (não só via `preview_stop`, que não mata processos órfãos) e confirmando com `npx next build` + `npx next start` numa porta separada — **build de produção é a fonte da verdade, sempre verificar por ali quando o dev server parecer ignorar uma mudança, não insistir em reload/restart do preview.**

**✅ Deployado** (commit `fbbeb19`, confirmado no ar) — `/arcade` público, funil PostHog, hardening de animação.

**✅ FEITO 19/07 (final da sessão) — 2 fusões de catálogo, pedido direto do Ricardo:**
- **Cluster ChatGPT investigado** (chatgpt-zero + chatgpt-masterclass + prompt-engineering) — Ricardo pediu avaliação honesta de sobreposição antes de decidir fundir. Achado: overlap real mas ESTREITO — chatgpt-masterclass §3 ("7 Componentes RCTFTRE") ensina essencialmente a mesma lição que chatgpt-zero cap.6 (framework de 4 elementos), só isso (~2 de 16 seções). O resto do masterclass (Code Interpreter, DALL-E, GPTs/API, ética, casos de negócio) e todo o prompt-engineering (CoT, ToT, meta-prompting, por-modelo) são genuinamente novos. **Não é caso de fusão** como n8n/Perplexity — é um trim leve (cross-referenciar em vez de re-ensinar), baixa prioridade, não fiz ainda.
- **Allowlisting**: Ricardo confirmou que continua relevante mas precisa ser repensado — sair do foco só em SEO/search engines e cobrir visibilidade para AGENTES de IA. Anotado, não iniciado.
- **n8n fundido**: `automacao-n8n` (templado, mad-libs confirmado na prosa, R$99, **0 matrículas reais**) arquivado — `n8n-automacao-avancada` (editorial real, comparativo vs Make/Zapier, R$199, 2 matrículas) é agora o único curso de n8n ativo.
- **Perplexity fundido**: `perplexity-pesquisa-inteligente-e-conhecimento-instantaneo` (templado, R$79, **0 matrículas**) arquivado — `perplexity-pesquisa-inteligente` (editorial real, estava ARQUIVADO por engano, R$37, 2 matrículas) foi **revivido** como o único curso de Perplexity ativo.
- Ambas as fusões: **0 clientes reais afetados** (conferido `users.enrolledCourses` + `courseprogresses` + `orders` antes de mexer). Backup em `fayapoint.courses_backup_merge_20260719` e `fayapointProdutos.products_backup_merge_20260719`. Mudança de status é instantânea (Atlas = produção na hora, sem deploy) — já confirmado sumindo/aparecendo em `/api/products?type=course`.
- **Nota pendente**: `perplexity-pesquisa-inteligente` revivido manteve o preço antigo (R$37) — pode valer reprecificar já que virou o curso canônico (padrão dos outros ficou R$79-199). Não mexi, é decisão de preço, não de conteúdo.

---

## ⏩ SESSÃO 18/07 — (histórico, resolvido — os 4 cursos abaixo estão prontos e no ar)

**Deploy do handoff 17/07: CONFIRMADO no ar** — verificado por HTTP em 18/07 (`curl -sI https://fayai.com.br/cursos/media/chatgpt-zero/inline/cap05-fluxo.webm` → 200). Não repetir os passos 1-2 do deploy antigo. Passos 3-5 daquele handoff (thumbs de persona, beta Expert, cron VPS) continuam pendentes — ver lista funde abaixo em P.1/P.2.

**🎬 REPLICAÇÃO chatgpt-zero → outros cursos — status 18/07:**
Só **2 cursos publicados** têm a estrutura idêntica ao chatgpt-zero (30 caps, 6 módulos × 5 aulas, mesmo boilerplate — âncoras conferidas verbatim): `primeiras-automacoes` e `aprenda-a-usar-inteligencia-artificial-no-seu-dia-a-dia`. Rodando os dois agora (scripts `generate_course_inline_media_<slug>.py`, temas próprios, BASE_SEED 8000/8500, ~5h de GPU combinado). **Terceiro curso do mesmo template, `mastering-ai-with-chatgpt`, está ARCHIVED e é duplicata em inglês do chatgpt-zero — candidato a retirada definitiva, não a investimento (ver auditoria abaixo).**
Depois de gerado: `install_course_inline_media.sh` + `insert-course-inline-markers.cjs` (cópias por curso, mesma lógica, âncoras já confirmadas idênticas) — dry-run primeiro, `--apply` só depois do commit+push+deploy dos arquivos de mídia (mesma armadilha do cap.1: nunca marcador no Atlas antes do reader ter o arquivo estático no ar).

**🔍 AUDITORIA DO CATÁLOGO (pedida por Ricardo 18/07, ver §6 abaixo para detalhe completo):** as matrículas vistas anteriormente (487, 412...) eram dado de teste, não reais. Catálogo tem 25 cursos em duas "eras" de geração de conteúdo — editorial manual (H1s distintos, comparativos "X vs Y vs Z") e templado (30 "capítulos" boilerplate, tipo chatgpt-zero) — e pelo menos 3 pares de cursos publicados cobrindo o MESMO tema simultaneamente (n8n, Perplexity, e o cluster de agentes de IA). Nenhum trabalho de ilustração/GPU deve entrar nesses cursos até Ricardo decidir merge/retire. Detalhe completo e recomendação em §6.

**⚠️ ARMADILHAS DESCOBERTAS 17-18/07 (ler antes de mexer no reader/ícones/scripts):**
1. react-markdown v10 renderiza comentários HTML como TEXTO escapado (premissa "invisível" era falsa; doc corrigido no ARQUITETURA_CONTEUDO_DINAMICO).
2. Literal `<!--`/`-->` em fonte TSX mata a rota no Turbopack (404 silencioso, compila `_not-found`); montar via `new RegExp("<"+"!--...")`.
3. Ícone lucide com nome-alias (ex.: TriangleAlert) passa no tsc mas 404a a rota com optimizePackageImports — conferir `node_modules/lucide-react/dist/esm/icons/<kebab>.js` antes de importar.
4. Turbopack dev serve chunk VELHO do cache do browser (nomes sem hash) — verificar com `fetch(chunkSrc, {cache:"reload"})`; prod não afeta.
5. OpenRouter: Flux/SD/Recraft NÃO existem mais em chat-completions (só google/gemini-*-image e openai/gpt-*-image); `openrouter/free` também não é modelo válido.
6. **NOVO 18/07:** rodar um script Python de geração via `run_in_background` que TAMBÉM usa `&` dentro de um subshell bash é redundante e cria processos órfãos não rastreados — o wrapper externo reporta "completed" imediatamente (porque o `&` interno devolve o shell na hora) mas o processo real continua solto, fora do tracking. Rodar o comando python DIRETO com `run_in_background: true` (sem `&`/subshell), sem chaining `;` de múltiplos scripts no mesmo comando.
6b. **NOVO 18/07 (2ª ocorrência):** `until ! tasklist /FI "PID eq $PID" | grep -qi python.exe; do sleep N; done` deu falso-negativo DUAS vezes na mesma sessão — `tasklist` via Git-Bash às vezes reporta "processo não encontrado" com o processo ainda vivo (concorrência/latência do WMI, não confirmado a causa exata). Isso disparou um `git commit && git push` prematuro com o `resume_missing_media.py` ainda rodando (script legítimo, não morreu — só o wait-loop errou). Consequência: primeiro deploy dos vídeos de caps16-30 saiu PARCIAL, precisou de uma segunda passada de instalação+commit depois que o script realmente terminou. Lição: para esperar um processo Python terminar de verdade, checar 2x seguidas com um intervalo (não confiar numa checagem única de `tasklist`), ou preferir `Wait-Process -Id $PID` via PowerShell (bloqueia de verdade até o processo sair, sem essa flakiness).
7. **NOVO 18/07:** `fayapointProdutos.products.courseContent` é a ÚNICA fonte que o reader realmente renderiza (`/api/courses/[slug]/content/route.ts`) — o campo `fayapoint.courses.modules[].lessons[].content` (que tem conteúdo por-aula "Capítulo N") é **dado morto** para cursos fora da família chatgpt-zero: o reader faz split só por `# ` (H1) via `countCourseContentChapters`, então cursos com curriculum de 150-250 "aulas" vendidas mas só 15-20 H1 reais no `courseContent` mostram MUITO menos conteúdo do que o curriculum promete. Sempre checar `courseContent` diretamente, nunca assumir que o curriculum bate com o conteúdo real.

**🛑 PARADO 18/07 — mídia repetitiva, Ricardo mandou parar o fluxo:** ao revisar as imagens/vídeos gerados hoje, Ricardo constatou que dentro do mesmo módulo (5 capítulos) tudo fica quase idêntico — pouca diversidade, "5-6 vídeos iguais, mudando quase nada". Causa raiz: o script `generate_course_inline_media_*.py` usa `SLOT_ACTIONS[slot][tipo % 5]` — só 5 variantes de texto por slot — e `VIDEO_MOTION` é 100% fixo (idêntico nos 30 capítulos); nenhum dos dois lê o conteúdo real do capítulo. **Pior: o mesmo problema existe no TEXTO da própria courseContent, incluindo do chatgpt-zero já no ar** — comparei cap.1 vs cap.6 do chatgpt-zero e a prosa é ~90% idêntica palavra por palavra (só 3-4 frases-substantivo trocadas: tópico do módulo, 2 cenários, 1 entregável), e as LEGENDAS das mídias inline são literalmente idênticas entre capítulos ("Qualidade em IA é um sistema em camadas..." aparece igual no cap01 e no cap06). Ricardo só validou o cap.1 (feito à mão) — os caps 2-30 nunca passaram por revisão de diversidade.
- **Regra nova, permanente:** manter design/quantidade/posicionamento da mídia (6 imagens + 2 vídeos por capítulo, mesmos slots estruturais) — mas o PROMPT de cada imagem/vídeo nunca pode se repetir entre capítulos. Cada prompt deve ser ancorado nas frases ESPECÍFICAS daquele capítulo (tópico do módulo + os 2 cenários únicos + o entregável único, todos extraíveis da prosa "vamos conectar X a entregáveis como Y e a cenários como Z") com objetos/composição concretos que mudam a cada capítulo — o motivo visual (ex.: "empilhar camadas") pode se repetir como linguagem de design, mas o CONTEÚDO da cena (que objetos, que camada está fraca, que cenário está representado) tem que ser sempre novo.
- Conteúdo v1 (genérico) dos 2 cursos-gêmeos ARQUIVADO em `course_media/<slug>_v1_generic_backup_20260718/` — preservado, não apagado, não usar.
- **Decisão do Ricardo 18/07: regenerar os 3 cursos com a MESMA prioridade** (chatgpt-zero incluído, mesmo já em produção) — e escopo expandido: não é só ancorar prompts de imagem nas frases únicas do texto mad-libs, é **reescrever a PROSA em si** para ser genuinamente única e "atualmente relevante" por capítulo. Corrige a causa raiz, não o sintoma visual.
- **Piloto entregue 18/07:** `PILOTO_REESCRITA_CAP1_CAP6_CHATGPT_ZERO.md` (raiz do repo) — reescrita completa dos caps 1 e 6 do chatgpt-zero, mesma estrutura de 9 seções, tamanho comparável, conteúdo substantivo e sem repetição entre si. Usa tokens `{{fact:...}}` para referências a modelos atuais. Aguardando veredito do Ricardo antes de escalar para os 90 capítulos (3 cursos × 30 caps).
- **Implicação técnica — FEITO 18/07:** `insert-course-inline-markers.cjs` reescrito — agora genérico por slug (`node insert-course-inline-markers.cjs <slug> [--apply]`, funciona nos 3 cursos) e 100% âncora ESTRUTURAL (por seção/parágrafo), nenhuma frase literal — robusto a qualquer reescrita futura de prosa.
- **Ricardo aprovou o piloto ("gostei e aprovei") + a mudança de âncora ("concordo com sua sugestão").**
- **TEXTO 100% PRONTO (18/07, verificado por amostragem):** os 3 cursos têm os 30 capítulos completos e revisados, zero repetição mad-libs. Arquivos em `scripts/cursos/content_drafts/`: `chatgpt-zero_caps_2-15.json` + `chatgpt-zero_caps_16-30.json` (+ cap1/cap6 do piloto, já no `PILOTO_REESCRITA_CAP1_CAP6_CHATGPT_ZERO.md`), `primeiras-automacoes_caps_1-15.json` + `primeiras-automacoes_caps_16-30.json`, `ia-dia-a-dia_caps_1-15.json` + `ia-dia-a-dia_caps_16-30.json`.
- **MÍDIA GPU RODANDO EM BACKGROUND (18/07, iniciado ~14h, sessão perto do limite de uso):** 6 agentes concorrentes escrevendo prompts únicos por capítulo (ancorados no texto real de cada capítulo, mesmo motivo composicional por slot mas objetos concretos sempre diferentes) e rodando a geração no ComfyUI até o fim, sem supervisão. Mídia antiga (genérica) de TODOS os 3 cursos arquivada em `course_media/<slug>_v1_generic_backup_20260718/` (preservada). Mídia aprovada do piloto (cap01/cap06 chatgpt-zero) restaurada manualmente no diretório de trabalho antes de soltar os agentes — não foi regerada.
- **✅ FEITO 18/07 (tarde):** texto dos 3 cursos aplicado em produção (com backup automático por curso), imagens 100% instaladas nos 3 cursos, deploy confirmado no ar (`cap02-sistema.webp` 200 em todos os 3). Marcadores aplicados via `insert-course-inline-markers.cjs` — **corrigido bug importante**: a checagem de "capítulo já marcado" era por CAPÍTULO inteiro (`cap.includes('<!--media:')`), o que impediria backfill incremental de slots que faltam (ex.: vídeo ainda não gerado) assim que QUALQUER marcador daquele capítulo já existisse. Trocado para checagem por SLOT individual (`cap.includes('id="${id}"')`) — agora rodar o script de novo só insere o que ainda falta, sem re-processar o resto. `resume_missing_media.py` (rodando desde ~14h) está completando os 89 vídeos que faltavam (caps 16-30, os 3 cursos) reaproveitando os prompts já escritos pelos agentes — ritmo ~130s/vídeo.
- **✅ FEITO 19/07 (madrugada):** os 89 vídeos que faltavam terminaram de gerar (confirmado 2x — check manual + `Wait-Process` bloqueante). chatgpt-zero já tinha ido no commit anterior (deploy prematuro por falso-negativo do `tasklist`, ver armadilha 6b); primeiras-automacoes + IA-dia-a-dia completados e deployados no commit `cf28871`. Os 3 cursos estão com os 240 arquivos de mídia (chatgpt-zero 243, sobra de nomes legados do cap01) 100% instalados em produção.
- **✅ CONFIRMADO 19/07 (madrugada) — os 3 cursos 100% completos em produção:** verificado direto na API ao vivo (`/api/courses/<slug>/content`) — 30 capítulos, 120 marcadores `media:img` + 60 `media:video` cada curso (30×4 e 30×2, exato), cap.20 de primeiras-automacoes conferido renderizando com marcador presente. Markers backfill rodou 2x (uma vez pela cadeia antiga que finalmente destravou, outra vez por mim como conferência) — ambos bateram em `sem mídia ainda: 0`. Nada mais pendente nesses 3 cursos.
- **✅ CONFIRMADO 19/07 (manhã) — rag-knowledge também 100% completo em produção**, o "mais um inteiro" pedido pelo Ricardo. Verificado na API ao vivo: 30 capítulos, 120 `media:img` + 60 `media:video` (exato). Uma interrupção overnight (ComfyUI reiniciou sozinho, PIDs mudaram) deixou 50 vídeos pendentes pela manhã — resolvido com `resume_rag_knowledge_videos.py` (achei e corrigi um bug de schema no meio do caminho: o arquivo de prompts dos caps 1-15 guarda `chapters` como ARRAY indexado por posição, não por número de capítulo — `data.chapters[str(cap)]` falha, precisa de `data.chapters.find(c => c.n === cap)`; caps 16-30 usam um schema diferente, `data[str(cap)][slot]` direto). **4 cursos completos agora**: chatgpt-zero, primeiras-automacoes, aprenda-a-usar-ia-no-dia-a-dia, rag-knowledge — todos com texto único por capítulo, mídia ancorada no conteúdo real, deploy confirmado, marcadores 100%.
- **⚠️ AO RETOMAR:** conferir se os 6 agentes terminaram (podem ter caído por spend-limit como já aconteceu 1x — se a pasta `course_media/<slug>/inline/` tiver poucos arquivos e nenhum manifest, relançar seguindo o mesmo padrão de prompt usado nesta sessão, arquivo por arquivo em `scripts/cursos/content_drafts/*_prompts_*.json` tem os prompts já escritos, não precisa reescrever). Depois: revisar amostra de imagens/vídeos de cada lote → instalar mídia em `public/cursos/media/<slug>/inline/` (adaptar `install_course_inline_media.sh` por slug) → commit+push+deploy → **SÓ DEPOIS** `node scripts/cursos/insert-course-inline-markers.cjs <slug> --apply` nos 3 cursos (script já genérico e 100% estrutural, ver acima) → thumbs/beta Expert/cron pendentes do handoff 17/07 continuam na fila.

**🗓️ 19/07 (tarde) — Ricardo assume revisão de conteúdo dos 4 cursos ao longo da semana; eu sigo com o resto do masterplan + saúde do site.**
- [✅] **0.5 Hardening de animação — FEITO de verdade.** Hook compartilhado `src/hooks/useTabHiddenAtMount.ts` (checa `document.visibilityState` uma vez, via lazy initializer do `useState` — necessário p/ afetar a prop `initial` do framer-motion, que só é lida no mount; `useEffect` chegaria tarde demais). Aplicado em `ArcadeVisual.tsx` e `TrailMap.tsx` (ambos usavam `initial={{opacity:0,...}}` sem nenhum guard — risco real de ficar preso invisível se a aba abrir em segundo plano). `CourseReaderPage.tsx`'s `useRevealOnVisible` refatorado pra usar o mesmo hook (era uma checagem inline duplicada). `tsc --noEmit` e `eslint` limpos (0 erros) nos 4 arquivos. **Limitação da verificação:** ArcadeVisual e TrailMap ficam atrás de login — não consegui testar visualmente sem credencial seguindo as regras de segurança (não faço login no lugar de ninguém). Verificado via tipo/lint + revisão manual do diff; vale um teste seu com Chrome visível quando puder.
- [~] **P.3 Funil PostHog — instrumentado, mas com uma ressalva importante.** PostHog já estava integrado (posthog-js, autocapture ligado) mas só tinha 3 eventos custom no código inteiro (`$pageview` auto, `user_signed_up`, `signup_google_clicked`) — o funil "nó→aula→minigame→cadastro" nunca foi de fato instrumentado, só documentado. Adicionei: `trail_node_click` (TrailMap, clique num nó do "Seu caminho para dominar IA"), `lesson_view` (CourseReaderPage, toda vez que o capítulo ativo muda), `minigame_start`/`minigame_complete` (PalpiteGame, com categoria/acerto/modo-treino).
  - ⚠️ **Achado que muda a leitura do funil**: o PalpiteGame tem um comentário no próprio código dizendo que é "o mesmo jogo da landing, jogável DENTRO do portal" — ou seja, ele já morou na landing (visitante anônimo) e foi movido pra dentro do Arcade (atrás de login) no item 0.1. Isso significa que hoje o "minigame" acontece DEPOIS do cadastro, não antes — o funil como documentado ("nó→aula→minigame→cadastro" terminando em cadastro) não bate mais com a arquitetura atual. Os eventos que instrumentei são de qualquer forma dados úteis (engajamento pós-cadastro: quantos alunos exploram a trilha, leem aulas, jogam minigames), mas não formam o funil de CONVERSÃO pré-cadastro que o documento original descrevia. **Preciso da sua leitura**: quer reviver uma versão leve do minigame na landing (pré-cadastro) pra fechar o funil como concebido, ou redefinir o funil como engajamento pós-cadastro (o que já está instrumentado agora)?
- [ ] **P.2 Auditor hermes — investigado, não é algo que eu resolvo daqui.** É infraestrutura só de VPS (`/root/kirmes/course_quality_audit.sh` + `course_audit_prepare.js` + binário `hermes` em `/opt/hermes/.venv/bin/`), nada disso está espelhado neste repo local — confirmei via busca exaustiva. A única pista sobre o que trava em "cursos grandes" é uma frase solta ("trava o cron diário") sem log ou stack trace. Pra consertar de verdade eu precisaria acessar a VPS via SSH e trabalhar direto nos scripts de lá (ou você trazer os scripts pro repo primeiro). Não tentei nada às cegas dado que é infra de produção. Fica registrado como bloqueado até você decidir a via de acesso.
- [~] **7.5 Analytics do USS — mapeado, backend já existe.** `Uss/docs/ANALYTICS_SYSTEM.md` é doc antigo/aspiracional (nomes não batem 1:1 com o código atual), mas o back-end real já está pronto: `SocialAccount`/`SocialPost`/`SocialAnalytics` (models) + `/api/social/analytics` (GET, agrega por plataforma, funcional, não é stub) + `/api/social/sync-due` (cron). O que falta é só a CAMADA VISUAL pro usuário — hoje só existe uma versão admin-only em `src/app/[locale]/admin/social/page.tsx`. "UI de analytics dedicada" (item 7.5) provavelmente quer dizer portar/adaptar essa view pro portal do usuário (aba "Perfil Social"), não construir back-end do zero. Ainda não construí a UI — próximo item se a fila permitir.

**Segunda-feira com o Ricardo:** roteiro de validação dos itens [~] (cada fase abaixo tem o critério de aceite) · vereditos: piloto cap.1 + Fases 2-7 · veredito da auditoria do catálogo (§6) · veredito do motor de prompts únicos (acima) · depois Fase 8 (motor Expert completo, só após 2+3 validados) · pendentes de código: 7.4 (credenciais dele), 7.5 (analytics UI), 1.4/1.5 (auditor hermes), 1.6 (guia blog, não prioritário), 0.5 hardening (escopo maior que o previsto — ver nota abaixo).

**O que o Ricardo já validou (✅ dele, de verdade):**
- 0.1 Palpite em 30s DENTRO do Arcade — aprovado com elogio à decisão ("usuário completionist não se sente jogado de volta à tela inicial").
- XP honesto (F5 3×) · Thumbs Arcade · Calendário Desafios · Vídeos LTX dos minigames.
- Tabela de modelos da Fase 1 (com correção dele: Gemini 3.5 Pro) → registry aplicado e VERIFICADO em prod (Opus 4.8/Sonnet 5/GPT-5.6 no ar).
- **17/07: Badges top-3+"+N" (0.6) · Banner "Sua Persona" acima do Ecossistema (0.7, deploy c03d087) · Quiz anti-óbvio — os três aprovados.**

**Aguardando validação do Ricardo `[~]`:** nomes novos visíveis nas aulas (1.3) — abrir qualquer curso e ver Opus 4.8/Sonnet 5/GPT-5.6 citados, zero modelos velhos.

**Decisões do Ricardo registradas em 17/07 (item 1.6):**
- Formato: **guia evergreen no blog** (série `guia-*`, com `{{fact:}}` desde o nascimento).
- Lista: Unsloth Studio · LLM Arena · OpenRouter · Ollama/LM Studio · ComfyUI · NotebookLM.
- Expansão pedida por ele: pesquisar **repos de muito sucesso no GitHub**, explicar **agentes** (o que são, como essas ferramentas os afetam), **Higgsfield** e outros que fizerem sentido. **NÃO é prioridade** — entra bem especificado aqui, mas a prioridade é seguir o MASTERPLAN e ter o site perfeito. Fazer quando a fila permitir.

**Ordem imediata:**
1. **FASE 2 — Leitura 2.0**: item 2.1 (mídia inline) + 2.5 (piloto de 1 capítulo do chatgpt-zero para aprovação DELE antes de escalar). Specs completas na Fase 2 abaixo.
2. Paralelo P.2: auditor hermes p/ cursos grandes (chip pendente no painel) — destrava 1.4/1.5.
3. Continuam nas mãos do Ricardo: PIX real · FB/IG · cupom TikTok · Turnstile · Vidente (P.1) · veredito 1.3.

**Regras de ouro (não esquecer):** §1 regra do PRONTO (só Ricardo promove a ✅; reportar "mudou no código, teste assim") · piloto antes de escalar · memória `feedback-regra-do-pronto` · Chrome dele minimizado congela animações (testar com janela visível) · mudanças no Atlas = produção NA HORA.

---

## §1. PROCESSO — a regra do PRONTO (o que mudou depois de 16/07)

O problema: itens foram reportados como "verificados" com checagens técnicas (DOM, typecheck, API 200) que **não equivalem a um usuário real usando**. Com o Chrome minimizado, animações congelam e abas do portal nem trocam — parte das validações reais era impossível e mesmo assim virou "✅". Isso não pode se repetir.

**Novas regras, válidas para toda sessão:**
1. Um item só recebe ✅ quando **o Ricardo confirmar** que funciona (ou quando testado de ponta a ponta em produção com browser visível, dizendo explicitamente COMO foi testado).
2. Todo item deste plano tem um **critério de aceite** = o teste que o Ricardo faz em 30 segundos. Sem critério claro, o item não está bem definido.
3. Status possíveis: `[ ]` a fazer · `[~]` código no ar, AGUARDANDO validação do Ricardo · `[✅]` validado pelo Ricardo · `[✗]` reprovado (volta com nota do que falhou).
4. Relatórios de sessão separam sempre: "mudou no código" ≠ "funciona para o usuário".
5. Trabalho grande (Leitura 2.0, Studio) começa por um **piloto pequeno aprovado pelo Ricardo** antes de escalar.

---

## §2. AUDITORIA HONESTA — o que foi dado como pronto × estado real

| Item | O que existe no código (deploys de 16/07) | Status | Como testamos juntos |
|------|------------------------------------------|--------|---------------------|
| Palpite em 30s abre | Card virou `<a href="/">` nativo; landing renderiza o jogo p/ logados; sem redirect achado; sem service worker | `[✗]` **Ricardo reprovou** — diagnóstico pendente | Fase 0: você clica com DevTools aberto e vemos juntos o que acontece (nada? navega? volta?) |
| Vídeos LTX nos minigames | 24 loops no ar | `[✅]` **Ricardo aprovou** ("funcionando ok!") | — |
| Fix XP infinito / streak | Comparação corrigida; XP estável em reloads (testado em prod via DOM) | `[~]` | Recarregue o portal 3× e veja se o XP não sobe; streak deve crescer amanhã |
| Quiz anti-óbvio (certificado) | Prompt novo + shuffle server-side | `[✅]` **Ricardo aprovou 17/07** | — |
| Badges fora da foto | Prateleira → Badges 2.0 (top-3 + "+N") | `[✅]` **Ricardo aprovou 17/07** (via 0.6) | — |
| Thumbs do Arcade contidas | max-w + 16:9 | `[~]` | Abrir Minigames em tela cheia |
| Calendário dos Desafios | max-w-sm | `[~]` | Abrir Desafios |
| Card "Sua Persona" + col 3 sticky | Acima do Ecossistema FayAI | `[✅]` **Ricardo aprovou 17/07** (via 0.7) | — |
| Deep-link `?tab=` + links cruzados Conta↔Perfil | Implementado | `[~]` | Minha Conta → botão "Meu Perfil" |
| Fatos voláteis (registry) | `{{fact:}}` resolvido na entrega; 95 menções tokenizadas | `[~]` PORÉM **valores continuam os antigos** — ver Fase 1 | Depois da Fase 1: abrir claude-ia-segura e ver modelos ATUAIS citados |
| Ilustrações chatgpt-zero | 31 artes no header/galeria por seção | `[✗]` **Reprovado como solução** — viraram "3 imagens no topo + parede de texto". Vira insumo da Leitura 2.0 (Fase 2) | — |
| Persona no gerador USS | socialPersona injetado no prompt (provado por E2E) | `[~]` | Perfil Social → Publicar → Gerar: o texto deve falar dos SEUS interesses |
| **Studio AI** | **NADA feito** (sempre esteve na fila) | `[ ]` | — |
| **Certificados redesign** | Só arte no card de stats; o certificado gigante segue igual | `[ ]` | — |
| **Persona no Meu Perfil (formulário)** | **NADA feito** (só o card no dashboard) | `[ ]` | — |
| **Ranking redesign / Assistente IA** | Só arte no header do Ranking | `[ ]` | — |
| Conteúdo customizado para o Ricardo (Expert/beta) | **NADA feito** | `[ ]` | — |

---

## §3. A FILA ÚNICA — fases em ordem, uma a uma, juntos

### FASE 0 — Sessão de verificação conjunta + consertos na hora (1 sessão, COM o Ricardo)
> Objetivo: zerar a tabela do §2 — cada `[~]` vira `[✅]` ou `[✗]`+fix imediato.
- [✅] 0.1 **Palpite em 30s** — VALIDADO PELO RICARDO 17/07: PalpiteGame extraído, joga dentro do Arcade, XP direto na conta (idempotente, modo treino). Nota dele: melhor assim, o completionist quer tela dedicada, não ser jogado à home. (deploy c03d087)
  - Nota de diagnóstico da sessão: o estado "congelado/esmaecido" que aparecia nos MEUS testes era a janela do Claude cobrindo o Chrome (occlusion correta do navegador) — não era bug do site para o usuário. Hardening anti-congelamento continua valendo como robustez (item 0.5).
- [ ] 0.5 **Hardening de animação**: quando `visibilityState==='hidden'` no mount ou rAF morto, renderizar conteúdo direto visível (sem entrance) — usuários que abrem a aba em segundo plano nunca veem tela em branco.
- [x] 0.2 Roteiro de validação executado pelo Ricardo em 16/07 (noite). Resultado:
  - ✅ XP honesto (3× F5, idêntico) · ✅ Thumbs Arcade · ✅ Calendário Desafios
  - ✅ Badges fora da foto, MAS: design das badges desatualizado E a prateleira não escala (imagine as dezenas de conquistas futuras sob a foto) → **0.6**
  - ✅ Card Sua Persona existe, MAS escondido → deve ficar ACIMA do "Ecossistema FayAI" → **0.7**
  - ✅ Botão Conta↔Perfil existe, MAS a seção Persona real deve ser VISUAL: thumbnails clicáveis como entrada principal, texto só como fallback → spec da FASE 3 atualizada
  - ⏳ Quiz anti-óbvio: Ricardo valida depois
  - ⏳ Gerador USS: incompleto por definição até a Fase 3 (persona rica)
- [✅] 0.6 **Badges 2.0** — VALIDADO PELO RICARDO 17/07: avatar mostra só top-3 tiers + chip "+N".
- [✅] 0.7 **Card Sua Persona em destaque** — VALIDADO PELO RICARDO 17/07: acima do "Ecossistema FayAI", visível sem rolar (deploy c03d087).
- [ ] 0.4 Registrar resultados (este bloco) — FEITO 16/07.

### FASE 1 — Conteúdo fala do PRESENTE (1 sessão; primeira metade sem depender de você)
> Você apontou: os cursos citam exatamente os modelos velhos. O registry existe mas mantive os valores antigos por segurança. Agora é atualizar de verdade.
- [x] 1.1 Pesquisa feita (16-17/07): GPT-5.6 Sol · Opus 4.8/Fable 5 · Sonnet 5 · Kimi K3 (16/07) · Gemini 3.5 Flash/Pro · GPT Image 2 · Nano Banana Pro · Midjourney v8 · Kling v3 · Veo 3.1 · Runway Gen-4.5.
- [x] 1.2 **Tabela APROVADA pelo Ricardo** (17/07), com correção dele: Gemini 3.5 Pro (não 3.1) + pedido de incluir geradores de imagem/vídeo.
- [x] 1.3 Registry atualizado (14 chaves) e **VERIFICADO em produção**: claude-ia-segura cita Opus 4.8 (19×) e Sonnet 5 (9×), zero menções antigas. Primeira atualização real do motor. `[~]` p/ validação visual do Ricardo em qualquer curso.
- [ ] 1.4 Varredura das menções NÃO tokenizadas (GPT-4o, Claude 3, `sonnet-4-...` em código): auditor decide caso a caso (histórico legítimo × desatualização) e propõe patch por aula com aprovação.
- [ ] 1.5 **Cobertura de labs ausentes**: onde o texto deveria citar players novos (Kimi/Moonshot etc.) e não cita — vira patch proposto pelo pipeline do auditor.
- [ ] 1.6 **Guia evergreen no blog: ferramentas dos profissionais** (DECIDIDO pelo Ricardo 17/07 — formato: série `guia-*` no blog IA Hoje, `{{fact:}}` desde o nascimento). Ferramentas que profissionais usam e o usuário comum desconhece mas se beneficiaria muito:
  - Lista aprovada: **Unsloth Studio · LLM Arena (lmarena) · OpenRouter · Ollama/LM Studio · ComfyUI · NotebookLM**.
  - Expansão pedida por ele (17/07): pesquisar **repos de muito sucesso no GitHub** (curar os que agregam valor real ao usuário comum); explicar **agentes de IA** — o que são e como essas ferramentas os afetam/potencializam; incluir **Higgsfield** e outros que a curadoria julgar convenientes.
  - **Prioridade: BAIXA por ordem explícita dele** — "isso deve entrar no masterplan bem explicado para fazermos, mas não é nossa prioridade; seguir o masterplan e ter o site perfeito é a prioridade". Fazer quando a fila das fases permitir.
  - Aceite: ele lê o primeiro guia publicado no blog e aprova tom + utilidade.
- Dependência: 1.4/1.5 precisam do **auditor hermes consertado p/ cursos grandes** (chip já criado; chunking por módulo + pular quem falha 2×).

### FASE 2 — LEITURA 2.0 (a maior e mais importante; 2-3 sessões; piloto aprovado antes de escalar)
> Spec do Ricardo (16/07): imagens **no trecho a que se referem**, em pontos importantes/difíceis onde ajudam a compreensão; **4-5 imagens + no mínimo 2 vídeos por capítulo**; capítulos **menores**; design bonito e palatável; e o conteúdo refletindo a persona (Expert).
- [~] 2.1 **Arquitetura de mídia inline** — IMPLEMENTADA 17/07 (madrugada): marcadores `media:img`/`media:video` (comentários HTML com id/src/poster/caption) que o reader renderiza NO PONTO via `InlineMediaFigure`/`InlineMediaVideo` (moldura, legenda, reveal suave com hardening anti-aba-oculta; vídeo mudo, loop, `preload="none"`, poster, play/pause por visibilidade). Verificado no dev local por DOM: 6 figuras no ponto certo, zero marcador cru. Aguarda deploy + validação do Ricardo.
- [~] 2.2 **Passe editorial por capítulo**: feito À MÃO para o cap.1 do piloto (6 pontos: sistema-em-camadas, intenção×execução, fluxo 5 passos VÍDEO, ideias→planos, validação, checklist VÍDEO — prompts espelhando O TRECHO). Automatizar via LLM ao escalar. As 31 artes header viram acervo onde couberem.
- [~] 2.3 **Capítulos menores** — FEITO 17/07 (local): `buildReaderSections` agora divide por TEMPO (seções ≤9 min; capítulo longo quebra nos `##` em blocos de ~5-7 min; funde sobras <2 min). chatgpt-zero: 15 "Partes" de 12+ min → **31 seções de ~6 min** (verificado no DOM local). Sem deploy (diretriz 17/07).
- [~] 2.4 **Design da página de leitura** — FEITO 17/07 (local): sistema de seções com ícone+cor consistente nas 8 seções recorrentes (Visão Geral/Conceitos/Fluxo/Cenários/Erros/Exercício/Checklist/Resumo) + callouts novos por prefixo de blockquote ("Erro comum:"/"Atenção:" rosa · "Exemplo:"/"Na prática:" ciano · Dica/Dica Pro âmbar). Passes de iteração visual COM você ficam para a validação final.
- [~] 2.5 **PILOTO cap.1 chatgpt-zero**: mídia GERADA E INSTALADA (4 webp ≤47KB + 2 webm ≤181KB em `public/cursos/media/chatgpt-zero/inline/`; receitas Qwen 2512 + LTX 2.3 I2V comprovadas). Marcadores prontos (`insert-cap1-inline-markers.cjs`) — aplicar no Atlas SÓ DEPOIS do deploy do reader (ver armadilha abaixo). Critério de aceite: abrir cap.1 e ver 4 imagens + 2 vídeos no ponto do texto.
- Aceite da fase: você lê um capítulo e diz "é isso".
- ⚠️ **ARMADILHAS DESCOBERTAS 17/07** (não repetir):
  1. **Comentários HTML NÃO são invisíveis no react-markdown v10** — viram TEXTO ESCAPADO na tela (a premissa do ARQUITETURA_CONTEUDO_DINAMICO estava errada). Marcadores no Atlas só APÓS o reader novo estar em produção. Houve exposição de ~1h de marcadores crus no cap.1 na madrugada de 17/07 (restaurado do backup `products_backup_leitura20_20260717`). Vale também para os slots `exemplo` da Camada 2 (Fase 3)!
  2. **Literal `<!--`/`-->` em fonte TSX mata a rota no Turbopack** — 404 silencioso, sem erro de build. Montar via `new RegExp("<"+"!--...")`.
  3. **Turbopack dev usa nomes de chunk SEM hash** — o browser cacheia chunk velho mesmo após restart do server; verificação local exige refresh do cache HTTP dos chunks (`fetch(src, {cache:"reload"})` + reload). Em produção não afeta (chunks com hash).
  4. Prompt de imagem com "seal/badge/placa" gera TEXTO embaralhado na arte — usar conceitos sem texto (carimbo de cera em branco etc.).

### FASE 3 — PERSONA COMPLETA + conteúdo customizado para VOCÊ (beta tester Expert) (1-2 sessões)
- [~] 3.1 **Meu Perfil → seção "Sua Persona"** — FEITO 17/07 (local): `PersonaSection.tsx` no topo do Meu Perfil com tiles visuais clicáveis para as 5 dimensões (setor 8 · tom 6 · objetivos 7 · tipos de conteúdo 6 · momento com IA 3), texto só como fallback ("Outro? Digite e Enter"), barra de completionPercent, bloco "o que o site já aprendeu" (temas/hashtags/estilo/público do socialPersona). E2E local: selecionar → salvar → 100% persistido (XP na 1ª vez via API existente). Thumbnails §12: prompts prontos em `generate_persona_thumbs.py` (roda pós-batch; tiles caem em gradiente+emoji até lá).
- [~] 3.2 **Slots de exemplo** — script pronto (`insert-cap1-exemplo-slots.cjs`): 2 slots nos parágrafos de Cenários Aplicados do cap.1. ⚠️ Aplicar no Atlas SÓ no deploy final (reader antigo mostraria comentário cru). Reader novo já engole qualquer comentário (guard).
- [~] 3.3 **Gerador de exemplos por persona (motor Expert v1)** — FEITO 17/07 (local): `POST /api/user/course-examples/generate` (Expert/admin; LLM tier budget reescreve o exemplo padrão para o contexto do aluno; grava em `userCourseExamples`) + content API injeta os exemplos no miolo dos slots para Expert. Beta na SUA conta: rodar após deploy final + slots aplicados.
- Aceite: você lê o piloto e os exemplos são sobre você/seus projetos.

### FASE 4 — STUDIO AI revitalização (1 sessão cheia)
> 🚨 DESCOBERTA 17/07: o Studio em produção estava QUEBRADO em 4 dos modelos (Flux/SD/Recraft saíram do OpenRouter — "invalid model ID", incluindo o default flux-1-schnell). Catálogo reconstruído com 7 modelos REAIS, todos verificados com geração de verdade.
- [~] 4.1 Free — FEITO 17/07 (local): 2 modelos grátis (Nano Banana/gemini-2.5-flash-image + Gemini 3.1 Lite) com cota de 2 gerações/DIA (antes: 1 imagem PARA SEMPRE).
- [~] 4.2 Pagos — FEITO 17/07 (local): cota diária por tier (free 2 · explorador 15 · profissional 40 · expert 120) + catálogo único `src/lib/studio-models.ts` compartilhado API↔UI com gating por plano (Gemini 3.1 Flash · Gemini 3 Pro · Nano Banana Pro · GPT Image Mini · GPT Image 2).
- [~] 4.3 Edição/consistência — FEITO 17/07 (local): botão "Usar imagem de referência" (upload → dataURL) roteia para o omni google/gemini-3-pro-image-preview com conteúdo multimodal; mantém personagem/estilo.
- [~] 4.4 UI — FEITO 17/07 (local): Select → grid de cards com THUMBNAIL REAL por modelo (mesmo prompt de referência gerado em cada um — `public/portal/studio/*.webp`, 15-37KB) + explicação de uso + badge de plano + chip de cota "N/M hoje".
- [~] 4.5 Composer — FEITO 17/07 (local): `mediaPrompt` do gerador USS agora aparece no Composer com botão "Criar imagem" → gera no Studio e anexa a URL ao post (IG exige imagem).
- Aceite: você gera imagem no free e no expert e vê a diferença clara de oferta.

### FASE 5 — CERTIFICADOS redesign (½-1 sessão)
- [~] 5.1 FEITO 17/07 (local): fim do "super mega certificado" — grid 2 colunas de cards compactos (thumb da arte + hover "Ver certificado"); clique expande para largura total com a arte completa, verificação e ações; botão Fechar.
- [~] 5.2 FEITO 17/07 (local): seção "Onde usar seu certificado" (LinkedIn/Currículo/Verificação pública) + botão "Adicionar ao perfil" com deep-link oficial do LinkedIn (entra direto em Licenças e certificados com certId e URL de verificação).
- [~] 5.3 FEITO 17/07 (local): entrada em stagger, hover lift, expansão com layout animation e scale-in da arte.
- Aceite: a aba Certificados fica bonita na sua tela sem rolar um metro.

### FASE 6 — RANKING + ASSISTENTE IA (1 sessão, com Chrome visível p/ iterar)
- [~] 6.1 FEITO 17/07 (local): avatares com FOTO real (campo image era ignorado — iniciais só como fallback), linha "Você #N" fixada no fim da lista quando você está fora do top exibido, badges de plano normalizados (PRO/EXPERT/EXPLORADOR). Pódio/arte da casa mantidos. Passe visual fino COM você na validação final.
- [~] 6.2 FEITO 17/07 (local): Assistente virou **Tutor FayAI** — system prompt com persona do aluno (setor/objetivos/nível) + cursos matriculados + próximos passos concretos na plataforma; agora tem MEMÓRIA da conversa (histórico das últimas 8 trocas); trocado o modelo quebrado 'openrouter/free' pelo provider unificado com fallback (free→budget por plano).

### FASE 7 — USS nível 2 (1-2 sessões)
- [~] 7.1 FEITO 17/07 (local): `POST /api/social/sync-due` (cron VPS, header x-social-secret, mesmo padrão do publish-due) — sincroniza métricas das contas ativas de TODOS os usuários (lote 25, lastSync>20h) E refina a persona pelo engajamento real: hashtags dos 10 posts com melhor engagementRate (30d) viram `socialPersona.topHashtags` ponderadas. Falta no deploy: adicionar o cron na VPS (1×/hora, curl -X POST -H "x-social-secret: $SOCIAL_CRON_SECRET" https://fayai.com.br/api/social/sync-due).
- [~] 7.2 FEITO 17/07 (local): manchetes de IA das últimas 48h (hub IA Hoje, coleção ainews) entram no prompt do gerador — post nasce ancorado no assunto do dia (generatePosts e analyzeTrends).
- [~] 7.3 FEITO 17/07 (local): nova action modular `generateMediaPrompt` (prompt de imagem para post JÁ escrito) somando às existentes generatePosts/generateHashtags/analyzeTrends; Composer agora captura o mediaPrompt e cria a imagem com 1 clique (4.5).
- [ ] 7.4 Plataformas: Twitter/Pinterest (apps SEUS — bloqueado nas suas credenciais, P.1) → LinkedIn/TikTok.
- [ ] 7.5 Analytics do USS (ANALYTICS_SYSTEM.md) — próxima sessão (UI de analytics dedicada).

### FASE 8 — MOTOR EXPERT COMPLETO (o diferencial; depois de 2+3 provados)
- [ ] 8.1 Curso inteiro gerado/adaptado pela persona (texto+exemplos+imagens do contexto do aluno).
- [ ] 8.2 Superfície de venda: deixar claro no site que Expert = conteúdo feito para VOCÊ.
- [ ] 8.3 Piloto com a sua conta → depois abrir.

### PARALELO CONTÍNUO (não bloqueia fases)
- [ ] P.1 **Seus 30 min**: PIX real · conectar FB/IG · resgatar cupom TikTok (ler condições) · Turnstile · testar Vidente.
- [ ] P.2 Auditor hermes: chunking p/ cursos grandes (chip pronto) — desbloqueia 1.4/1.5.
- [ ] P.3 QA + funil PostHog (F6 antigo) — instrumentar nó→aula→minigame→cadastro.
- [ ] P.4 Vigias de toda sessão: GSC, logs VPS, banda Netlify, courseaudits.

---

## §4. ESPECIFICAÇÕES DE REFERÊNCIA
- Identidade visual e receitas de geração: `IDENTIDADE_VISUAL.md` (§12 fusão; Liga B §10).
- Arquitetura de conteúdo (fatos/slots/mídia): `ARQUITETURA_CONTEUDO_DINAMICO.md` (a Camada 3 muda na Fase 2: header → inline).
- Visão USS/motor: `../Uss/docs/engine/` (prompts prontos §10) + memória `project_uss_engine`.
- Infra/comercial herdado: `PENDENCIAS_2026-07-15.md` (continua válido no que não conflita).

## §5. COMO TRABALHAREMOS
Uma fase por vez, na ordem. Dentro da fase, itens um a um: eu implemento → marco `[~]` → **você testa pelo critério de aceite** → `[✅]` ou `[✗]` com nota. Este arquivo é atualizado A CADA sessão (status + datas). Se algo novo surgir, entra AQUI primeiro, nunca só na conversa.

---

## §6. AUDITORIA DO CATÁLOGO — 18/07 (pedida por Ricardo, resultado preliminar)

**Gatilho:** ao planejar replicar o tratamento do chatgpt-zero (Leitura 2.0) para outros cursos, descobri que os "487/412 matrículas" vistos em `fayapoint.courses.enrollments` são dado de teste — Ricardo confirmou que não são reais. Isso invalidou o critério de priorização por popularidade, e ele pediu uma auditoria de conteúdo do catálogo inteiro antes de investir mais GPU em qualquer curso fora dos 2 gêmeos do chatgpt-zero.

**Método:** para os 25 cursos em `fayapoint.courses`, comparei `courseContent` (`fayapointProdutos.products` — a fonte real que o reader renderiza) por curso: contagem de H1 reais, detecção de frases de 15+ palavras repetidas dentro do mesmo curso, e similaridade Jaccard (shingles de 12 palavras) entre pares de cursos.

### Achado 1 — duas eras de geração de conteúdo coexistem no catálogo
- **Templada (boilerplate 30-"capítulos"):** chatgpt-zero, primeiras-automacoes, aprenda-a-usar-ia-no-dia-a-dia, rag-knowledge, ia-producao, automacao-n8n, midjourney-masterclass (archived), mastering-ai-with-chatgpt (archived), perplexity-pesquisa-inteligente-e-conhecimento-instantaneo. Todos têm 900-1000+ trechos de 15+ palavras repetidos dentro do próprio curso — é o esqueleto fixo do gerador (frase conectora igual, palavra-tema trocada), não é um bug por si só: é exatamente o material que a Leitura 2.0 (mídia inline + capítulos menores) transformou em algo ótimo no chatgpt-zero. O problema é quando esse esqueleto NÃO recebeu o mesmo tratamento.
- **Editorial (H1s únicos, comparativos "X vs Y vs Z", conteúdo específico por seção):** chatgpt-masterclass, chatgpt-allowlisting, claude-ia-segura, claude-cowork-colaboracao, gemini-ia-google, leonardo-ai-criacao-visual, make-integracao-total, midjourney-arte-profissional, n8n-automacao-avancada, banana-dev-deploy-ia (archived), openclaw-ia-open-source, perplexity-pesquisa-inteligente (archived), prompt-engineering, crie-agentes-de-ia-autonomos, ia-sem-filtro-por-claude (sagrado), autoresearch-singularity. Zero duplicação interna detectada — qualidade editorial real, mas SEM o tratamento Leitura 2.0 (mídia inline) porque o `courseContent` deles não usa "# Capítulo N:" — usa 13-20 H1 livres, cada um um artigo próprio. Confirma o que já era esperado: âncoras estruturais tipo `insert-course-inline-markers.cjs` não são reaproveitáveis aqui, precisam de âncora manual por seção (como foi o piloto do cap.1 do chatgpt-zero, antes de escalar).

### Achado 2 — pares de cursos publicados cobrindo o MESMO tema ao mesmo tempo
| Tema | Curso A | Curso B | Situação |
|---|---|---|---|
| Perplexity | `perplexity-pesquisa-inteligente` (archived, editorial, R$37, 13 H1) | `perplexity-pesquisa-inteligente-e-conhecimento-instantaneo` (published, templado, R$79, 30 caps) | Mesmo título quase idêntico. O archived tem conteúdo editorial de verdade; o published é o boilerplate genérico. |
| n8n | `automacao-n8n` (published, templado, R$99, "40 aulas") | `n8n-automacao-avancada` (published, editorial com "vs Make vs Zapier", R$199, "180 aulas") | **Os DOIS estão live agora**, mesma ferramenta, preços e profundidade diferentes. |
| Midjourney | `midjourney-arte-profissional` (published, editorial, R$79) | `midjourney-masterclass` (archived, templado) | Já resolvido — o fraco está arquivado. Padrão a repetir nos outros pares. |
| ChatGPT | `chatgpt-zero` (published, templado+Leitura2.0, R$29, vitrine) | `chatgpt-masterclass` (published, editorial "avançado", R$149) · `chatgpt-allowlisting` (published, ângulo enterprise/SEO, bem diferente) · `mastering-ai-with-chatgpt` (archived, templado em inglês) | zero + masterclass parecem complementares (funil iniciante→avançado, não duplicata); allowlisting é claramente distinto; mastering-ai-with-chatgpt é o candidato mais claro a retirada definitiva (duplicata em inglês do zero, já arquivado). |
| Agentes de IA / produção | `openclaw-ia-open-source` (published, editorial, ferramenta específica) · `crie-agentes-de-ia-autonomos` (published, editorial, "como construir": ReAct, Function Calling, Claude/OpenAI Agent SDK) · `ia-producao` (published, templado, genérico) · `banana-dev-deploy-ia` (archived, editorial, deploy/MLOps) | 4 cursos com fronteiras confusas entre "o que é um agente", "como construir um agente" e "como colocar IA em produção". **Este é o cluster que Ricardo pediu para reformular.** |

### Achado 3 — pedido específico do Ricardo: reformular openclaw-ia-open-source
Instrução literal: *"o openclaw open course deve ser reformulado para incluir e contemplar tudo que se trata desse assunto, qual a função de cada um: openclaw, hermes, e o que mais existir que funcione como eles."*

**Confirmado por Ricardo (18/07): "Hermes" = Hermes Agent, da Nous Research (hermes-ai.net).** Pesquisado via Browser pane — é um PEER direto do OpenClaw, não um modelo base: agente autônomo open-source (MIT, 101K+ stars no GitHub), model-agnostic (Claude/GPT/Gemini/Qwen/DeepSeek via API), com ciclo de aprendizado autoaprimorável (memória curada pelo próprio agente, FTS5 + Honcho para modelagem de usuário entre sessões), gateway único para 15+ plataformas de mensagem (Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Mattermost, email, SMS, DingTalk, Feishu, WeCom, BlueBubbles, Home Assistant), sistema de skills compatível com agentskills.io (o agente cria e reutiliza as próprias skills), integração MCP, automações via cron, e roda em local/Docker/SSH/Daytona/Singularity/Modal com hibernação serverless. Instala com `curl | bash` + `hermes setup`.
- **Nota:** existe uma ferramenta interna do ecossistema FayAI também chamada informalmente "Hermes" (o "Hermes×MC auditor" mencionado em sessões de 14-15/07, memória `progress_uss_hermes`) — é uma coincidência de nome, NÃO é o Hermes Agent da Nous Research. Não confundir os dois ao escrever o curso.
- Próximo passo de conteúdo: escrever uma seção "OpenClaw vs Hermes Agent — comparativo sem filtro" seguindo o padrão editorial que o curso já usa (mesmo estilo do H1 existente "OpenClaw vs Claude Cowork vs ChatGPT"), cobrindo também outros agentes self-hosted relevantes do mesmo nicho (candidatos a pesquisar: OpenHands/OpenDevin, AutoGPT, CrewAI, LangGraph agents — validar quais ainda são relevantes em 2026 antes de incluir).
- Pendente de decisão dele também: se esse curso deve absorver o conteúdo de `crie-agentes-de-ia-autonomos` e `ia-producao` (merge) ou só ganhar mais seções mantendo os outros dois separados.

### Recomendação preliminar (aguardando veredito do Ricardo)
- [ ] **Retirar definitivamente** `mastering-ai-with-chatgpt` (archived, duplicata em inglês do chatgpt-zero, sem motivo para reviver).
- [ ] **Decidir merge Perplexity**: manter o editorial (`perplexity-pesquisa-inteligente`, hoje archived) como base e aposentar o templado published, OU aplicar Leitura 2.0 no editorial e então aposentar o templado — evita ter 2 cursos de Perplexity ativos.
- [ ] **Decidir merge/reposicionamento n8n**: os dois estão published simultaneamente — definir se `automacao-n8n` vira "iniciante" com diferenciação real de `n8n-automacao-avancada`, ou se é aposentado/mesclado.
- [ ] **Reformular `openclaw-ia-open-source`** (aguardando esclarecimento sobre "Hermes" + decisão sobre merge com `crie-agentes-de-ia-autonomos`/`ia-producao`).
- [ ] Cursos ChatGPT-based (`chatgpt-masterclass`, `chatgpt-allowlisting`) **ficam por último na fila** de qualquer novo investimento (Leitura 2.0, GPU, etc.) — instrução explícita do Ricardo, chatgpt-zero já cobre bem esse terreno.
- [ ] Sem decisão pendente: `rag-knowledge`, `ia-sem-filtro-por-claude` (sagrado, não mexer), `autoresearch-singularity`, `prompt-engineering`, `claude-ia-segura`, `claude-cowork-colaboracao`, `gemini-ia-google`, `leonardo-ai-criacao-visual`, `make-integracao-total`, `midjourney-arte-profissional` — não apareceram em nenhum par de duplicata, tratamento normal na fila.

**Script da auditoria:** `scripts/cursos/audit_courses.cjs` (rodar de novo se o catálogo mudar; salva raw em `audit_courses_raw.json` no scratchpad da sessão — não commitado).
