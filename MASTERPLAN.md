# MASTERPLAN — O caminho completo até "o site bom"
**Criado em 16/07/2026 (noite), a pedido do Ricardo. Este documento SUPERSEDE o PLANO_RICARDO_2026-07-16.md e é a fonte única de verdade. Nada sai daqui sem estar PRONTO-DE-VERDADE (§1).**

---

## ⏩ PRÓXIMA SESSÃO COMEÇA AQUI (atualizado 17/07 — vereditos colhidos, Fase 2 em andamento)

**Estado:** Fase 0 FECHADA (0.6/0.7 validados) · Fase 1 núcleo validado, resta 1.3 visual + 1.4/1.5 (dependem do auditor) + 1.6 especificado · **FASE 2 (Leitura 2.0) EM ANDAMENTO** — piloto do chatgpt-zero.

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
- [ ] 2.3 **Capítulos menores**: re-chunking do conteúdo (seções de leitura de ~5-7 min; hoje "Partes" de 12+ min); revisar `buildReaderSections`.
- [ ] 2.4 **Design da página de leitura**: hierarquia, callouts (dica/erro comum/exemplo), respiros, tipografia — 3 passes de iteração no browser COM você.
- [~] 2.5 **PILOTO cap.1 chatgpt-zero**: mídia GERADA E INSTALADA (4 webp ≤47KB + 2 webm ≤181KB em `public/cursos/media/chatgpt-zero/inline/`; receitas Qwen 2512 + LTX 2.3 I2V comprovadas). Marcadores prontos (`insert-cap1-inline-markers.cjs`) — aplicar no Atlas SÓ DEPOIS do deploy do reader (ver armadilha abaixo). Critério de aceite: abrir cap.1 e ver 4 imagens + 2 vídeos no ponto do texto.
- Aceite da fase: você lê um capítulo e diz "é isso".
- ⚠️ **ARMADILHAS DESCOBERTAS 17/07** (não repetir):
  1. **Comentários HTML NÃO são invisíveis no react-markdown v10** — viram TEXTO ESCAPADO na tela (a premissa do ARQUITETURA_CONTEUDO_DINAMICO estava errada). Marcadores no Atlas só APÓS o reader novo estar em produção. Houve exposição de ~1h de marcadores crus no cap.1 na madrugada de 17/07 (restaurado do backup `products_backup_leitura20_20260717`). Vale também para os slots `exemplo` da Camada 2 (Fase 3)!
  2. **Literal `<!--`/`-->` em fonte TSX mata a rota no Turbopack** — 404 silencioso, sem erro de build. Montar via `new RegExp("<"+"!--...")`.
  3. **Turbopack dev usa nomes de chunk SEM hash** — o browser cacheia chunk velho mesmo após restart do server; verificação local exige refresh do cache HTTP dos chunks (`fetch(src, {cache:"reload"})` + reload). Em produção não afeta (chunks com hash).
  4. Prompt de imagem com "seal/badge/placa" gera TEXTO embaralhado na arte — usar conceitos sem texto (carimbo de cera em branco etc.).

### FASE 3 — PERSONA COMPLETA + conteúdo customizado para VOCÊ (beta tester Expert) (1-2 sessões)
- [ ] 3.1 **Meu Perfil → seção "Sua Persona"** (spec refinada pelo Ricardo 16/07): interface VISUAL com **thumbnails clicáveis** para cada dimensão (setor, tom, objetivos, tipos de conteúdo, público...) — geradas no estilo §12; campos de texto existem apenas como fallback quando as opções visuais não cobrem o caso. Mostra também o que o site já aprendeu (socialPersona) e o completionPercent. Grava no peso `custom`.
- [ ] 3.2 **Slots de exemplo** (convenção já definida no ARQUITETURA_CONTEUDO_DINAMICO.md): marcar os primeiros slots no curso piloto da Fase 2.
- [ ] 3.3 **Gerador de exemplos por persona** (motor Expert v1): para usuário Expert, gerar e servir os exemplos customizados nos slots. **Beta: a SUA conta** — você abre o capítulo piloto e os exemplos falam do SEU contexto.
- Aceite: você lê o piloto e os exemplos são sobre você/seus projetos.

### FASE 4 — STUDIO AI revitalização (1 sessão cheia)
- [ ] 4.1 Free: modelos de imagem gratuitos (OpenRouter) com limite 1-2/dia.
- [ ] 4.2 Pagos: cota diária por tier; modelos bons/baratos (OpenRouter/Meta).
- [ ] 4.3 Character consistency + edit via omni model da Google.
- [ ] 4.4 UI: thumbnail de exemplo POR MODELO mostrando a diferença + explicação breve de uso.
- [ ] 4.5 Ligar o `mediaPrompt` do gerador USS → botão "Criar imagem" no Composer.
- Aceite: você gera imagem no free e no expert e vê a diferença clara de oferta.

### FASE 5 — CERTIFICADOS redesign (½-1 sessão)
- [ ] 5.1 Fim do "super mega certificado": card compacto/preview em thumb, expande sob demanda.
- [ ] 5.2 Seção "Onde usar seu certificado" (LinkedIn, currículo, verificação pública) com CTAs.
- [ ] 5.3 Animações (entrada, hover, emissão).
- Aceite: a aba Certificados fica bonita na sua tela sem rolar um metro.

### FASE 6 — RANKING + ASSISTENTE IA (1 sessão, com Chrome visível p/ iterar)
- [ ] 6.1 Ranking: redesign completo (pódio, lista, você em destaque, arte da casa).
- [ ] 6.2 Assistente IA: repensar proposta (tutor por curso? contexto da persona?) + upgrade de UI.

### FASE 7 — USS nível 2 (1-2 sessões)
- [ ] 7.1 Feedback loop: sync de métricas pós-publicação agendado + engajamento refinando persona/prompts.
- [ ] 7.2 Trends em tempo real no prompt do gerador.
- [ ] 7.3 Pipeline modular (conteúdo/hashtags/imagem separados — prompts prontos nos Uss/docs §10).
- [ ] 7.4 Plataformas: Twitter/Pinterest (apps seus) → LinkedIn/TikTok.
- [ ] 7.5 Analytics do USS (ANALYTICS_SYSTEM.md).

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
