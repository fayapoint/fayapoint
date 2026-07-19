# MASTERPLAN — O caminho completo até "o site bom"
**Criado em 16/07/2026 (noite), a pedido do Ricardo. Este documento SUPERSEDE o PLANO_RICARDO_2026-07-16.md e é a fonte única de verdade. Nada sai daqui sem estar PRONTO-DE-VERDADE (§1).**

---

## ⏩ SESSÃO 18/07 — COMEÇAR POR AQUI (deploy 17/07 confirmado no ar; auditoria do catálogo em andamento)

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
- **Em paralelo, "mais um inteiro" a pedido do Ricardo (ele foi dormir, pediu calma/sem pressa):** `rag-knowledge` (R$149, mesmo template, sem conflito de merge na auditoria) — 2 agentes escrevendo os 30 capítulos com rigor técnico extra (RAG de verdade: embeddings, chunking, reranking, RAGAS). Depois: mesmo pipeline validado (aplicar texto → prompts de mídia ancorados → GPU → instalar → commit → deploy → marcadores).
- **⚠️ AO RETOMAR:** conferir se os 6 agentes terminaram (podem ter caído por spend-limit como já aconteceu 1x — se a pasta `course_media/<slug>/inline/` tiver poucos arquivos e nenhum manifest, relançar seguindo o mesmo padrão de prompt usado nesta sessão, arquivo por arquivo em `scripts/cursos/content_drafts/*_prompts_*.json` tem os prompts já escritos, não precisa reescrever). Depois: revisar amostra de imagens/vídeos de cada lote → instalar mídia em `public/cursos/media/<slug>/inline/` (adaptar `install_course_inline_media.sh` por slug) → commit+push+deploy → **SÓ DEPOIS** `node scripts/cursos/insert-course-inline-markers.cjs <slug> --apply` nos 3 cursos (script já genérico e 100% estrutural, ver acima) → thumbs/beta Expert/cron pendentes do handoff 17/07 continuam na fila.

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
