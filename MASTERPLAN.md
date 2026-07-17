# MASTERPLAN — O caminho completo até "o site bom"
**Criado em 16/07/2026 (noite), a pedido do Ricardo. Este documento SUPERSEDE o PLANO_RICARDO_2026-07-16.md e é a fonte única de verdade. Nada sai daqui sem estar PRONTO-DE-VERDADE (§1).**

---

## ⏩ HANDOFF PARA OPUS 4.8 — COMEÇAR POR AQUI (17/07 noite; Ricardo volta segunda)

**Contexto:** maratona 17/07 com Fable codificou as Fases 2-7 LOCALMENTE e o Ricardo autorizou o deploy final ("quando terminar, pode fazer o deploy"). Toda a mídia do chatgpt-zero está gerada e instalada (240 arquivos em `public/cursos/media/chatgpt-zero/inline/`, 0 faltas). O deploy pode já ter sido disparado no fim da sessão de 17/07 — VERIFICAR antes de repetir (git log: procurar commit "leitura2 escala completa"; prod: `curl -sI https://fayai.com.br/cursos/media/chatgpt-zero/inline/cap05-fluxo.webm` → 200 = deployado).

**🔴 PASSOS RESTANTES DO DEPLOY (nesta ordem, com MONGODB_URI do .env.local):**
1. Se ainda não pushado: `git add -A && git commit && git push` (build já validado: 398 páginas, exit 0). Netlify deploya main automaticamente (~10 min).
2. **SÓ DEPOIS do deploy no ar** (arquivos acima respondendo 200): `node scripts/cursos/insert-course-inline-markers.cjs --apply` (~174 marcadores nos caps 2-30; idempotente; backup automático) e `node scripts/cursos/insert-cap1-exemplo-slots.cjs --apply` (2 slots Expert no cap.1). ⚠️ NUNCA aplicar marcador no Atlas antes do reader novo estar no ar — react-markdown v10 mostra comentário como TEXTO CRU (aconteceu 17/07, ~1h de exposição).
3. Thumbs da persona: se `public/portal/persona/opts/` estiver vazio, rodar `python scripts/cursos/generate_persona_thumbs.py` (ComfyUI porta 8000) e converter: `cd /c/WORKS/ComfyUI/output/persona_opts && for f in *.png; do ffmpeg -y -i "$f" -vf scale=480:-1 -quality 80 "<repo>/public/portal/persona/opts/${f%_*_.png}.webp"; done` (nomes: `<dim>-<key>.webp`, ex.: industry-tech.webp) + commit+push.
4. Beta Expert (conta do Ricardo): logado como ele (ou admin), `POST /api/user/course-examples/generate` body `{"courseSlug":"chatgpt-zero"}` — os 2 slots do cap.1 passam a falar do contexto DELE.
5. Cron na VPS (76.13.234.38): 1×/hora `curl -X POST -H "x-social-secret: $SOCIAL_CRON_SECRET" https://fayai.com.br/api/social/sync-due` (secret no .env do site; fallback AINEWS_SECRET).

**🎬 MATERIAL DO FIM DE SEMANA — mídia inline para os DEMAIS cursos (ComfyUI):**
O gerador `scripts/cursos/generate_course_inline_media.py` é o template. Para cada curso novo:
1. Adaptar `THEMES` (6 cenários, 1 por módulo do curso — cenário REAL + cor: seguir IDENTIDADE_VISUAL.md §12) e conferir se o curso segue o template de 5 tipos de aula (Fundamentos/Configuração/Aplicação/Erros/Projeto — os `SLOT_ACTIONS` já cobrem esses 5 tipos e NÃO precisam mudar).
2. Trocar `SLUG`, `CAPS` e `BASE_SEED` (usar faixa nova, ex.: 8000+, para variar).
3. Rodar (imagens ~15s cada; vídeos LTX ~2min cada; 1 curso de 30 caps ≈ 2h30 de GPU). Receita comprovada: Qwen 2512+Lightning 1152×640 4 steps; LTX 2.3 I2V two-pass 97 frames.
4. Adaptar `install_course_inline_media.sh` (trocar slug) e `insert-course-inline-markers.cjs` (trocar slug; ⚠️ CONFERIR âncoras com dry-run — cursos que não sigam o template de seções idênticas precisam de âncoras próprias).
5. Prompt-base das imagens (FUSION, obrigatório no fim de todo prompt): `an adorable glossy flat-vector robot mascot with big cute eyes naturally interacting inside a breathtaking cinematic photorealistic scene, seamless style fusion, dramatic film lighting, shallow depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading, professional photography, high detail, no text, no letters, no logos, no watermark`. ⚠️ Nunca pedir "seal/badge/placa" (gera texto embaralhado); conceitos sem texto (carimbo de cera em branco etc.).

**⚠️ ARMADILHAS DESCOBERTAS 17/07 (ler antes de mexer no reader/ícones):**
1. react-markdown v10 renderiza comentários HTML como TEXTO escapado (premissa "invisível" era falsa; doc corrigido no ARQUITETURA_CONTEUDO_DINAMICO).
2. Literal `<!--`/`-->` em fonte TSX mata a rota no Turbopack (404 silencioso, compila `_not-found`); montar via `new RegExp("<"+"!--...")`.
3. Ícone lucide com nome-alias (ex.: TriangleAlert) passa no tsc mas 404a a rota com optimizePackageImports — conferir `node_modules/lucide-react/dist/esm/icons/<kebab>.js` antes de importar.
4. Turbopack dev serve chunk VELHO do cache do browser (nomes sem hash) — verificar com `fetch(chunkSrc, {cache:"reload"})`; prod não afeta.
5. OpenRouter: Flux/SD/Recraft NÃO existem mais em chat-completions (só google/gemini-*-image e openai/gpt-*-image); `openrouter/free` também não é modelo válido.
6. Memórias com o resto: `progress-leitura20`, `feedback-local-ate-masterplan`, `reference-armadilhas-sessao16`.

**Segunda-feira com o Ricardo:** roteiro de validação dos itens [~] (cada fase abaixo tem o critério de aceite) · vereditos: piloto cap.1 + Fases 2-7 · depois Fase 8 (motor Expert completo, só após 2+3 validados) · pendentes de código: 7.4 (credenciais dele), 7.5 (analytics UI), 1.4/1.5 (auditor hermes), 1.6 (guia blog, não prioritário), 0.5 hardening.

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
