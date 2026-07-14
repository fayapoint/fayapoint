# HANDOFF MESTRE — Parte 1/3: Missão, Avaliação Real e Bugs Críticos

*13/07/2026 · Documento-instrumento para Ricardo + Claude. Parte 1: onde estamos DE VERDADE. Parte 2: o que temos e funciona (stack, infra, skills, pipelines). Parte 3: o plano integrado priorizado de tudo que foi falado + o que percebi que falta.*

---

## 0. A promessa (critério de tudo)

> **"Ajudar o usuário a ENTENDER IA."** Aprenda IA fazendo, não assistindo.

Toda decisão passa por este filtro: *isso ajuda uma pessoa comum a entender e usar IA na vida dela?* O Ricardo é apaixonado por IA e quer que mais gente tenha acesso — o site é o veículo. Derivados não-negociáveis: gamificação honesta (nunca XP fake, contadores falsos, escassez mentirosa), imagem que ENCENA o que o texto diz (regra do espelho), navegação que nunca abandona, e **respeitar o esforço do usuário** (ver Bug Crítico #1).

---

## 1. AVALIAÇÃO REAL — página a página (notas honestas, 13/07/2026)

### Home pública (`/pt-BR`, NovaLanding) — 8/10
✅ Minigame de palpite com XP, confete, cenas-espelho por exemplo (shipped 13/07), IA HOJE, header reconhece logado ("Oi, {nome}! Meu Portal").
❌ **Logado ainda vê a MESMA experiência do anônimo** (pill "0 XP" local, jogo não credita na conta — Bug #1). Não existe "home do aluno".

### Dashboard do portal — 8/10
✅ Trilha de 8 nós ilustrados com progresso real, tour de boas-vindas, ArcadeBanner, sidebar sem vazamentos, sessão resiliente.
❌ Falta: XP da home integrado; "Sua Jornada" (cursos) é lista seca; widgets de baixo (Studio promo, ranking) sem arte contextual.

### Arcade / Minigames — 6.5/10
✅ Aba dedicada, hero animado, 6 cards com arte própria, 3 jogos jogáveis.
❌ **Repetição**: Verdade ou Mito tem 10 cartas fixas, Qual Prompt 5 rodadas fixas, Monte o Prompt 3 opções por slot — "jogar de novo" repete o mesmo conteúdo. Meta: **≥10 rodadas rotativas por jogo, sem repetir na mesma sessão**. Falta ilustração POR CARTA (hoje só Qual Prompt tem imagem), microanimações de vitória, vídeo. Faltam Batalha de Prompts e Caça ao Prompt (CONSTRUINDO). Os jogos ainda não **introduzem vocabulário/conceitos** (prompt, token, alucinação, multimodal) com ilustração dedicada — essa é a alma pedida.

### Desafios — 3/10 ⚠️
❌ **"Não explica, não dá a mão, 0 imagens/animações"** (avaliação do Ricardo, correta). "Study for 30 minutes" em inglês, sem arte, sem COMO fazer, sem CTA para a ação, calendário morto. O streak freeze por XP é bom mas está enterrado. Precisa renascer inteiro (P2 na Parte 3).

### Certificados — 3/10 ⚠️
❌ Painel genérico. Nada aproveita "algo incrível que temos": temos GPU + identidade + nome do aluno + verificação por código — o certificado deveria ser uma OBRA (arte personalizada por curso, página pública linda de verificação para compartilhar no LinkedIn = growth orgânico). Existe `verificar-certificado/[code]` e um PDF antigo (`Certificado_FayAi_chatgpt-masterclass.pdf`) como referência.

### Conquistas / Ranking / Recompensas — 5/10
Funcionais, sem arte própria nem celebração. Ranking com dados reais (bom). Recompensas PRO sem preview do que se ganha.

### Cursos (catálogo + player) — 7/10
25 cursos reais no Mongo, player funciona, progresso persiste. ❌ 2 duplicados (Perplexity 297 vs 147), 3 com preço R$0 indevido (ver Bug #4), player sem os 4 temas de leitura (dor real: filho do Ricardo teve dor de cabeça lendo dark no celular — plano antigo de abr/2026 nunca feito).

### Projetos / Notícias — 8/10
✅ Nav completa + breadcrumbs (13/07), conteúdo forte, IA HOJE 100% autônomo.
❌ F5 pendente: páginas de projeto compartilham o mesmo template — cada uma deve ter direção de arte ÚNICA (demonstrar alcance do estúdio).

### Preços / Checkout / Paywall — 4/10 ⚠️
❌ **Nunca houve compra E2E validada em produção** (PIX Asaas — pendência antiga do PLANO_TRACAO). Turnstile em produção usa CHAVE DE TESTE (falta `NEXT_PUBLIC_TURNSTILE_SITE_KEY` real na Netlify). Preços R$0 vazando. **Não estamos aptos a receber com confiança** até validar (P4 na Parte 3).

### Login/Registro/Sessão — 9/10
✅ Auth resiliente com auto-cura (`/api/auth/refresh`), Google OAuth, logout fantasma morto (13/07).
❌ **Zero follow-up**: quem se cadastra não recebe NENHUM contato depois (P5 na Parte 3).

---

## 2. BUGS CRÍTICOS (encontrados/confirmados em 13/07)

### #1 — O XP do usuário logado é JOGADO FORA (o pior de todos)
**Sintoma (relato do Ricardo)**: entra no site logado → header diz "Oi, Ricardo" mas a pill mostra **0 XP** (é o XP local do gate, não o da conta de 18k+). Joga um exemplo → ganha 50/75 XP local → se navegar para o portal em vez de "resgatar", **o XP evapora** (o fluxo `/api/gate/claim-xp` foi desenhado para CADASTRO novo — `ClaimLandingXp` roda no portal lendo o gate do localStorage uma vez; para quem já tem conta e volta, nada credita de forma clara/imediata).
**Por que é grave**: pune exatamente quem fez tudo certo (se cadastrou, voltou). "Fazer o usuário se sentir tratado como nada" mata retenção.
**Correção (P0, Parte 3 §1)**: home logada = experiência própria: pill mostra **XP REAL da conta**; cada exemplo jogado credita NA HORA via API (toast "+75 XP na sua conta ✨"); modo anônimo continua como está (gate → resgate no cadastro).
**Arquivos**: `src/components/landing/NovaLanding.tsx` (já tem `useUser`), `src/app/api/gate/claim-xp/route.ts` (adaptar p/ crédito incremental idempotente por `exampleId`), `ClaimLandingXp.tsx`.

### #2 — Desafios sem alma (ver avaliação acima) — renascer em P2.

### #3 — Certificados sem magia — P3.

### #4 — Comercial quebrado silenciosamente
Consulta real no Mongo (13/07, `fayapointProdutos.products`, campo `pricing.price`):
- **"Primeiras Automações"** — price **0** (originalPrice 147) ⚠️
- **"Midjourney Masterclass"** — price **0** (originalPrice 197) ⚠️
- **"Mastering AI with ChatGPT"** — price **0**, sem originalPrice, título em inglês (produto órfão? avaliar deletar) ⚠️
- **"Perplexity: Pesquisa Inteligente..."** — DUPLICADO (297/897 e 147/397) ⚠️
Se R$0 for intencional (isca), a UI deve dizer "GRÁTIS" com orgulho; se não, corrigir preço. + PIX nunca validado + Turnstile de teste (ver Paywall acima).

### #5 — Zero follow-up pós-cadastro
Nenhum e-mail de boas-vindas, nenhuma sequência, nenhuma notificação a Ricardo por novo usuário (o Epaminomas de 11/07 só foi visto por acaso no MC). P5.

### #6 — Menores anotados
- Usuário de teste `teste-claimxp@fayai.com.br` ainda no banco (apagar).
- Skill comfy-local dizia porta 8001 (corrigida p/ 8000, conferir sempre).
- `aiChats`/`imagesGenerated` alimentam a trilha — verificar se TODOS os caminhos de geração incrementam.
- Dev: chunks JS cacheiam agressivo — **sempre Ctrl+Shift+R** antes de concluir que algo não funcionou (custou 30min em 13/07).

---

## 3. Nova diretriz visual pedida em 13/07 (registrar em IDENTIDADE_VISUAL §12 ao executar)

**Mix vetor + fotorrealista NO MESMO QUADRO**: dentro das ilustrações dos minigames/aulas, misturar o vetor mágico com elementos FOTORREALISTAS (ex.: robô vetorial segurando uma foto real de bolo; moldura vetorial revelando cena fotográfica) — o contraste exemplifica nosso domínio das ferramentas generativas.
**Como produzir**: (a) gerar foto (Qwen 2512+Lightning, ~14s) e cena vetor (Z-Image, ~4s) separadas e compor por camadas no site (Liga A §10 — preferido, leve e animável); (b) Qwen Image Edit 2511 para fundir num único frame quando a composição pedir. Sempre WebP ≤40KB por camada.

*→ Parte 2: stack, infra, pipelines e tudo que comprovadamente funciona.*
