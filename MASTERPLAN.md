# MASTERPLAN — O caminho completo até "o site bom"
**Criado em 16/07/2026 (noite), a pedido do Ricardo. Este documento SUPERSEDE o PLANO_RICARDO_2026-07-16.md e é a fonte única de verdade. Nada sai daqui sem estar PRONTO-DE-VERDADE (§1).**

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
| Quiz anti-óbvio (certificado) | Prompt novo + shuffle server-side | `[~]` | Refaça um quiz de certificado: as opções devem ter tamanhos parecidos e a certa não ser "a mais bonita" |
| Badges fora da foto | Prateleira na borda inferior | `[~]` | Olhar sidebar e Meu Perfil |
| Thumbs do Arcade contidas | max-w + 16:9 | `[~]` | Abrir Minigames em tela cheia |
| Calendário dos Desafios | max-w-sm | `[~]` | Abrir Desafios |
| Card "Sua Persona" + col 3 sticky | No dashboard | `[~]` | Ver dashboard desktop |
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
- [ ] 0.1 **Palpite em 30s** — DIAGNOSTICADO ao vivo 16/07: o clique navega para a home (fix do `<a>` funcionou), mas a expectativa certa é jogar DENTRO do Arcade como os outros 5. **Decisão do Ricardo: abrir in-place.** Tarefa: extrair o jogo da NovaLanding para componente reutilizável `<PalpiteGame/>`; para logado no portal, creditar XP direto (sem o claim via localStorage). Aceite: você clica no card e joga o Palpite sem sair do Arcade.
  - Nota de diagnóstico da sessão: o estado "congelado/esmaecido" que aparecia nos MEUS testes era a janela do Claude cobrindo o Chrome (occlusion correta do navegador) — não era bug do site para o usuário. Hardening anti-congelamento continua valendo como robustez (item 0.5).
- [ ] 0.5 **Hardening de animação**: quando `visibilityState==='hidden'` no mount ou rAF morto, renderizar conteúdo direto visível (sem entrance) — usuários que abrem a aba em segundo plano nunca veem tela em branco.
- [x] 0.2 Roteiro de validação executado pelo Ricardo em 16/07 (noite). Resultado:
  - ✅ XP honesto (3× F5, idêntico) · ✅ Thumbs Arcade · ✅ Calendário Desafios
  - ✅ Badges fora da foto, MAS: design das badges desatualizado E a prateleira não escala (imagine as dezenas de conquistas futuras sob a foto) → **0.6**
  - ✅ Card Sua Persona existe, MAS escondido → deve ficar ACIMA do "Ecossistema FayAI" → **0.7**
  - ✅ Botão Conta↔Perfil existe, MAS a seção Persona real deve ser VISUAL: thumbnails clicáveis como entrada principal, texto só como fallback → spec da FASE 3 atualizada
  - ⏳ Quiz anti-óbvio: Ricardo valida depois
  - ⏳ Gerador USS: incompleto por definição até a Fase 3 (persona rica)
- [ ] 0.6 **Badges 2.0**: mostrar no avatar só top-3 tiers + chip "+N"; redesign visual das medalhas (estão datadas); pensar escala p/ dezenas de conquistas. Aceite: avatar limpo mesmo com 25 conquistas.
- [ ] 0.7 **Card Sua Persona em destaque**: mover para ACIMA da seção "Ecossistema FayAI" no dashboard. Aceite: visível sem rolar.
- [ ] 0.4 Registrar resultados (este bloco) — FEITO 16/07.

### FASE 1 — Conteúdo fala do PRESENTE (1 sessão; primeira metade sem depender de você)
> Você apontou: os cursos citam exatamente os modelos velhos. O registry existe mas mantive os valores antigos por segurança. Agora é atualizar de verdade.
- [ ] 1.1 **Pesquisa (WebSearch) do estado da arte HOJE**: modelos atuais de cada lab (ex.: Kimi K3 lançado 16/07; família Claude 5/Fable; o que a OpenAI tem de atual), com fontes. Entregável: tabela proposta de valores novos por chave do registry.
- [ ] 1.2 **Você aprova a tabela** (5 min — nomes que o site vai passar a citar).
- [ ] 1.3 Atualizar `content_facts` → todos os cursos citam modelos atuais em ≤5 min. Aceite: abrir prompt-engineering e ver os nomes novos.
- [ ] 1.4 Varredura das menções NÃO tokenizadas (GPT-4o, Claude 3, `sonnet-4-...` em código): auditor decide caso a caso (histórico legítimo × desatualização) e propõe patch por aula com aprovação.
- [ ] 1.5 **Cobertura de labs ausentes**: onde o texto deveria citar players novos (Kimi/Moonshot etc.) e não cita — vira patch proposto pelo pipeline do auditor.
- Dependência: 1.4/1.5 precisam do **auditor hermes consertado p/ cursos grandes** (chip já criado; chunking por módulo + pular quem falha 2×).

### FASE 2 — LEITURA 2.0 (a maior e mais importante; 2-3 sessões; piloto aprovado antes de escalar)
> Spec do Ricardo (16/07): imagens **no trecho a que se referem**, em pontos importantes/difíceis onde ajudam a compreensão; **4-5 imagens + no mínimo 2 vídeos por capítulo**; capítulos **menores**; design bonito e palatável; e o conteúdo refletindo a persona (Expert).
- [ ] 2.1 **Arquitetura de mídia inline** (substitui o header-only): marcadores no markdown (`<!--media:img id="..." prompt="..."-->` / `<!--media:video ...-->`) que o reader renderiza NO PONTO, com componente bonito (moldura, legenda, largura, motion sutil; vídeos mudos ≤400KB com poster, respeitando ≤1 vídeo VISÍVEL por dobra).
- [ ] 2.2 **Passe editorial por capítulo (LLM)**: identificar os 4-5 pontos de difícil compreensão + 2 pontos "cinemáticos" → inserir marcadores com prompt de imagem/vídeo espelhando O TRECHO (não o tema genérico). As 31 artes do piloto viram acervo reaproveitável onde couberem.
- [ ] 2.3 **Capítulos menores**: re-chunking do conteúdo (seções de leitura de ~5-7 min; hoje "Partes" de 12+ min); revisar `buildReaderSections`.
- [ ] 2.4 **Design da página de leitura**: hierarquia, callouts (dica/erro comum/exemplo), respiros, tipografia — 3 passes de iteração no browser COM você.
- [ ] 2.5 **PILOTO**: 1 capítulo do chatgpt-zero completo nesse padrão → sua aprovação → escalar para o curso → depois demais cursos (batch ComfyUI + LTX por curso).
- Aceite da fase: você lê um capítulo e diz "é isso".

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
