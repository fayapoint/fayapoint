# PLANO MESTRE — Diretrizes do Ricardo, 16/07/2026

> Consolidação integral do que o Ricardo pediu em 16/07 (3 mensagens), com status real
> de cada item e o plano de execução. Nada aqui pode ser perdido entre sessões.
> Complementa PENDENCIAS_2026-07-15.md (que segue válido para infra/comercial).

## 0. NORTE ESTRATÉGICO (palavras dele)

**"Ao virar assinante do maior tier, o Expert, ele terá a opção de ter todo o conteúdo
feito a partir de suas informações. Os cursos, as imagens dos cursos, os exemplos, e
as imagens. Devemos entender essa como nossa prioridade e diferencial."**

Tudo abaixo existe para rodar perfeito e liberar foco 100% neste motor.
O blueprint técnico do motor JÁ EXISTE: `autoresearch/Uss/docs/engine/` (persona JSON
→ geração modular → feedback loop). Primeiro elo ligado em 16/07: `/api/social/generate`
agora lê o socialPersona (prova E2E: post citando os interesses coletados do usuário).

**Dinheiro é prioridade máxima — sempre 100% legal e honesto** (ele rejeitou
explicitamente as práticas nefárias do vídeo que assistiu). Situação financeira grave:
priorizar destraves de venda em toda sessão.

## 1. JÁ ENTREGUE EM 16/07 (deploys f80b57a → 1375438)

| # | Pedido | Status |
|---|--------|--------|
| 1 | Badges em cima da foto de perfil | ✅ Prateleira de medalhas na borda inferior (sidebar + Meu Perfil) |
| 2 | Thumbs gigantes no Arcade | ✅ max-w-screen-xl + artes 16:9 |
| 3 | "Colagem estática" nos jogos → vídeo real, ≥4 variantes | ✅ 24 loops LTX (4/jogo), rotação acompanha a still; colagens deletadas |
| 4 | Quizzes óbvios (certificado) | ✅ Prompt anti-obviedade + shuffle server-side. ⚠️ Quizzes DE LEITURA ainda pendentes (§2.3) |
| 5 | Palpite em 30s não abre | ✅ `<a>` nativo para a landing |
| 6 | Calendário gigante nos Desafios | ✅ contido em max-w-sm |
| 7 | Dashboard desktop com sobra | ✅ col 3 sticky + card "Sua Persona" (semente do motor) |
| 8 | Minha Conta ↔ Meu Perfil | ✅ links cruzados + deep-link `/portal?tab=` |
| 9 | Meu Perfil desatualizado | ✅ parcial: hero com arte da casa, conquistas em pt-BR, cards sóbrios. Refresh COMPLETO com persona: §2.1 |
| 10 | Ranking feio | ✅ parcial: header com arte. Redesign completo: §2.6 |
| 11 | USS "falta muito das funções originais" | ✅ diagnóstico completo via Uss/docs + persona injection no gerador. Gaps: §2.2 |
| 12 | Cursos desatualizados (Opus 4.5/GPT 5.4) | ✅ medido: 147 menções em 10 de 21 cursos. Correção automática: §2.3 |
| — | Bônus descoberto | ✅ FIX honestidade: +15 XP em todo load + streak preso em 1 (dashboard route) |
| — | GSC (ele liberou acesso) | ✅ checado: 28 impressões, 0 cliques, posição 17,3 (dados até 14/07) |

**Para conferir visualmente** (Chrome ABERTO na tela — minimizado congela as animações
do portal e as abas não trocam): Arcade → entrar em cada jogo (vídeos novos), Meu
Perfil (badges/hero), Desafios (calendário), dashboard (card Sua Persona), 404 de
qualquer URL errada, capas novas no /noticias.

## 2. FILA DE EXECUÇÃO (ordem proposta)

### Sessão A — Fundação do motor Expert (persona)
1. **Meu Perfil → seção "Sua Persona" completa**: mostrar o que o site já aprendeu
   (socialPersona: interesses, nível, temas...) em visual §12 + **formulário onde o
   usuário insere suas informações** (quem é, negócio, objetivos, tom) gravando no
   socialPersona (peso `custom`). É o combustível do motor.
2. **USS feedback loop**: agendar `/api/social/sync` pós-publicação; engajamento real
   refina persona/prompts (Uss/docs §8.2.6).
3. **Trends em tempo real** no prompt de geração (RSS/Google Trends → `trending_topics`).

### Sessão B — Studio AI mega revitalização (spec dele, verbatim)
- Free users: modelos de imagem GRATUITOS do OpenRouter, rate limit baixo (1–2/dia).
- Pagos: cota diária por tier; modelos bons e de baixo custo (OpenRouter, geradores da
  Meta); **character consistency e edit usando o omni model do Google**.
- Cada modelo com **thumbnail de exemplo da diferença** + breve explicação de uso.
- Ligar o `mediaPrompt` que o gerador USS já devolve → botão "Criar imagem" no Composer.

### Sessão C — Cursos: leitura + atualização automática
1. **Interface de leitura padronizada** entre cursos (hoje varia muito; há aulas com
   "7 páginas" de texto puro): pequenas imagens ilustrando o que se lê (receita fusão
   §12, batch ComfyUI) + animações conduzindo o conteúdo.
2. **Atualização automática de conteúdo** (loop autoresearch): pipeline auditor hermes
   → patch por aula → fila de aprovação → update em products.courseContent. Alvo
   imediato: as 147 menções a modelos antigos. NUNCA regex cego. (Chip do auditor p/
   cursos grandes já existe — chatgpt-masterclass trava o cron diário.)
3. **Quizzes de leitura anti-óbvio** (mesmo tratamento já aplicado aos de certificado).

### Sessão D — Polimento com iteração visual (Chrome aberto)
1. **Certificados**: cards menores (fim dos "super mega certificados"), seção "onde
   aplicar seu certificado", preview/thumb do certificado, mais animações.
2. **Ranking**: redesign completo.
3. **Assistente IA**: repensada e upgrade.

### Contínuo (toda sessão)
- Vigias §3.9 do PENDENCIAS; GSC; qualquer destrave de venda.
- Estratégia geral de frescor: **≥4 variantes** para toda superfície repetida.

## 3. DESTRAVES QUE SÓ O RICARDO FAZ (~30 min, liberam receita)
1. PIX real R$1–5 em produção (compra → webhook → matrícula).
2. Conectar Facebook+Instagram (Portal → Perfil Social → Contas).
3. Resgatar o cupom **TikTok Ads R$32.800** (ler condições — gasto casado provável).
   Criativos ficam comigo (reel V4 + pipeline LTX).
4. Turnstile real na Netlify.
5. Testar o Vidente + pescaria (alimenta a persona dele de verdade).

## 4. REFERÊNCIAS
- Visão USS/motor: `../Uss/docs/engine/Final Report_*.md` (prompts prontos §10!)
- Gaps USS detalhados: memória `project_uss_engine.md`
- Handoff geral anterior: `PENDENCIAS_2026-07-15.md`
- Identidade visual/receitas: `IDENTIDADE_VISUAL.md` (§12 fusão)
