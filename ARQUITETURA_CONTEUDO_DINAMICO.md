# Arquitetura de Conteúdo Dinâmico — 16/07/2026

> Como o conteúdo dos cursos fica **atualizável pelo motor de autoresearch** e
> **personalizável pelo motor Expert** sem reescrever markdown à mão.
> Três camadas independentes, todas resolvidas na ENTREGA (o markdown no Atlas
> é a fonte; o aluno sempre vê a versão resolvida).

## Camada 1 — Fatos voláteis (`{{fact:chave}}`) ✅ NO AR

**Problema:** modelos de LLM, versões e preços mudam; 21 cursos citando "GPT-5.4"
ficam velhos de uma vez.

**Solução:** registry central `fayapointProdutos.content_facts`
(`{key, value, label, updatedAt}`). O conteúdo referencia `{{fact:openai-flagship}}`;
`src/lib/content-facts.ts` resolve na entrega (content API + quiz API, cache 5min).

**Chaves seed (16/07):**
| key | value hoje | uso no texto |
|-----|-----------|--------------|
| `openai-flagship` | GPT-5.4 | modelo topo OpenAI |
| `openai-family` | GPT-5 | família atual OpenAI |
| `claude-flagship` | Opus 4.6 | escrever "Claude {{fact:claude-flagship}}" |
| `claude-sonnet` | Sonnet 4.6 | idem |

**Como o motor atualiza:** `db.content_facts.updateOne({key},{$set:{value,updatedAt}})`
→ todos os cursos atuais em ≤5min. NUNCA editar o markdown para trocar modelo.

**Como tokenizar mais conteúdo:** `scripts/cursos/tokenize-facts.cjs` (dry-run →
`--apply` com backup automático em `products_backup_tokens_<data>`). Regra de ouro:
o value inicial = texto substituído (renderização idêntica, risco zero).
Menções HISTÓRICAS ("o antigo GPT-4o era...") e IDs em código (`sonnet-4-...`)
ficam literais — só o auditor com contexto decide (IDs de API podem virar
`{{fact:claude-sonnet-id}}` caso a caso).

## Camada 2 — Slots de exemplo customizado (Expert) 📐 CONVENÇÃO DEFINIDA

**Problema:** exemplos genéricos ("imagine uma padaria") deveriam falar do negócio
DO aluno Expert.

**Convenção no markdown** (comentários HTML — invisíveis no ReactMarkdown):

```markdown
<!--exemplo id="cgz-cap07-contexto" tema="prompt com contexto de negócio"-->
Imagine uma padaria que quer responder clientes no WhatsApp...
(exemplo padrão, sempre presente e completo)
<!--/exemplo-->
```

**Fluxo Expert (a implementar com o motor):** geração por
persona grava em `fayapoint.userCourseExamples`
`{userId, courseSlug, exampleId, content, generatedAt}`; a content API, para
Expert com exemplo gerado, substitui o miolo do slot. Fallback = exemplo padrão
(free/pro nunca percebem o slot). O `tema` do marcador é o prompt-semente do gerador.

**Regras:** todo slot tem exemplo padrão completo; ids únicos por curso
(`<slug-curto>-capNN-<tema>`); slots marcados progressivamente pelo auditor/sessões.

## Camada 3 — Mídia por capítulo (Content Forge) ✅ PILOTO NO AR

**Já existia** a infraestrutura: `mission-control.content-forge-chapters`
(`courseSlug` + `chapterSlug: "chapter-N"` → `media.{heroImage,video,audio,gallery}`),
servida por `/api/courses/[slug]/media` e renderizada pelo `ChapterMediaHeader`
do reader. `chapter-N` → capítulo de índice N-1 (N=1 é a intro).

**O que fizemos:** gerar as imagens no ComfyUI (fusão §12, regra do espelho:
cenário = TEMA do módulo, ação do mascote = TIPO da aula) e apontar o heroImage
para `/cursos/media/<slug>/cap-NN.webp` (≤40KB).

**Pipeline por curso** (~8min GPU + 1min):
1. `scripts/cursos/generate_course_media.py` (adaptar THEMES/TYPES ao curso)
2. `bash scripts/cursos/install_course_media.sh <slug>` (PNG→WebP→public/)
3. `MONGODB_URI=... node scripts/cursos/seed-chapter-media.cjs <slug> <nCaps>`
4. commit public/ + deploy

Vídeo por capítulo: mesmo caminho (`media.video`, source "url"), respeitando
Liga B (≤400KB mudo, máx 1 vídeo por página — hero do capítulo OU vídeo, nunca 2).

## Divisão de responsabilidade

- **Autoresearch/auditor** mantém a Camada 1 (valores) e propõe novos tokens/slots.
- **Motor Expert** preenche a Camada 2 por usuário.
- **ComfyUI local** produz a Camada 3 em lote.
- O markdown-fonte só muda para: corrigir erro real, marcar slot novo, tokenizar fato novo.
