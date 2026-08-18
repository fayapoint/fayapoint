/**
 * Leitura 2.0 — v2 (18/07/2026): insere marcadores de mídia inline por ÂNCORA
 * ESTRUTURAL (por seção/parágrafo, nunca por frase literal — a prosa agora é
 * reescrita por capítulo e frases literais não se repetem mais entre caps).
 * Idempotente por capítulo (pula quem já tem marcador).
 *
 * ⚠️ SÓ RODAR --apply DEPOIS do deploy que inclui os arquivos de mídia em
 * public/cursos/media/<slug>/inline/. react-markdown mostraria texto cru.
 *
 * Uso:  node scripts/cursos/insert-course-inline-markers.cjs <slug>            (dry-run)
 *       node scripts/cursos/insert-course-inline-markers.cjs <slug> --apply    (grava com backup)
 */
const { MongoClient } = require('mongodb');
// O teto do pool. Sem ele o driver assume maxPoolSize:100, e o cluster
// grátis inteiro tem 500 — divididas com os outros projetos.
// Ver `scripts/lib/mongo.cjs`.
const { OPCOES_DE_SCRIPT } = require("../lib/mongo.cjs");
const { invalidarCache } = require("../lib/invalidar-cache.cjs");
const fs = require('fs');
const path = require('path');

const SLUG = process.argv[2];
const APPLY = process.argv.includes('--apply');
if (!SLUG) {
  console.error('Uso: node insert-course-inline-markers.cjs <slug> [--apply]');
  process.exit(1);
}

const BACKUP_COLL = `products_backup_leitura20_${SLUG.replace(/-/g, '_')}_20260816`;
const BASE = `/cursos/media/${SLUG}/inline`;
const MEDIA_DIR = path.join(__dirname, '..', '..', 'public', 'cursos', 'media', SLUG, 'inline');

// Slots estruturais — todos ancorados por SEÇÃO/PARÁGRAFO, nenhum por frase
// literal (a prosa é única por capítulo desde 18/07, então uma frase fixa
// não existiria em todos os caps).
//
// ⚠️ 16/08/2026: o gabarito existe em DUAS línguas. `mastering-ai-with-chatgpt`
// é o `chatgpt-zero` traduzido e usa "## Key Concepts" / "**Pro Tip:**". Com só
// as âncoras em português ele marcava 0 slots e o script saía dizendo "âncora
// NÃO ACHADA" 6× por capítulo, o que se lê como curso quebrado.
const SLOTS_PT = [
  { slot: 'sistema', type: 'img', afterNthParagraphOf: ['## Conceitos-Chave', 1],
    caption: 'Qualidade em IA é um sistema em camadas: contexto, restrições, referências e critérios. Uma camada fraca e a resposta inteira perde valor.' },
  { slot: 'intencao', type: 'img', afterNthParagraphOf: ['## Conceitos-Chave', 2],
    caption: 'Separar intenção de execução: primeiro definir o que é uma boa resposta, só depois delegar à IA.' },
  { slot: 'fluxo', type: 'video', afterSection: '## Fluxo de Execução',
    caption: 'O ciclo de passos: clarificar → preparar contexto → executar → revisar → empacotar.' },
  { slot: 'cenario', type: 'img', afterNthParagraphOf: ['## Cenários Aplicados', 1],
    caption: 'De pedido vago a processo gerenciado: trabalho, formato, fontes, tom e validação explícitos.' },
  { slot: 'validacao', type: 'img', afterSection: '## Erros Comuns',
    caption: 'A IA é parceira de rascunho, não autoridade final — quem valida e assina é você.' },
  { slot: 'dica', type: 'video', afterBlockquote: '**Dica Pro:**',
    caption: 'Escreva o checklist de avaliação antes do prompt: o hábito que mais melhora a qualidade das respostas.' },
];

const SLOTS_EN = [
  { slot: 'sistema', type: 'img', afterNthParagraphOf: ['## Key Concepts', 1],
    caption: 'Quality in AI is a layered system: context, constraints, references and criteria. One weak layer and the whole answer loses value.' },
  { slot: 'intencao', type: 'img', afterNthParagraphOf: ['## Key Concepts', 2],
    caption: 'Separate intent from execution: first define what a good answer looks like, only then delegate to the AI.' },
  { slot: 'fluxo', type: 'video', afterSection: '## Execution Workflow',
    caption: 'The step cycle: clarify → prepare context → execute → review → package.' },
  { slot: 'cenario', type: 'img', afterNthParagraphOf: ['## Applied Scenarios', 1],
    caption: 'From vague request to managed process: work, format, sources, tone and validation made explicit.' },
  { slot: 'validacao', type: 'img', afterSection: '## Common Mistakes',
    caption: 'AI is a drafting partner, not the final authority — you are the one who validates and signs off.' },
  { slot: 'dica', type: 'video', afterBlockquote: '**Pro Tip:**',
    caption: 'Write the evaluation checklist before the prompt: the habit that most improves answer quality.' },
];

function buildMarker(cap, s) {
  const id = `${SLUG.slice(0, 6)}-cap${String(cap).padStart(2, '0')}-${s.slot}`;
  const file = `cap${String(cap).padStart(2, '0')}-${s.slot}`;
  if (s.type === 'video') {
    return `<!--media:video id="${id}" src="${BASE}/${file}.webm" poster="${BASE}/${file}.webp" caption="${s.caption}"-->`;
  }
  return `<!--media:img id="${id}" src="${BASE}/${file}.webp" caption="${s.caption}"-->`;
}

function mediaFilesExist(cap, s) {
  const file = `cap${String(cap).padStart(2, '0')}-${s.slot}`;
  if (s.type === 'video') {
    return fs.existsSync(path.join(MEDIA_DIR, `${file}.webm`)) && fs.existsSync(path.join(MEDIA_DIR, `${file}.webp`));
  }
  return fs.existsSync(path.join(MEDIA_DIR, `${file}.webp`));
}

function insertAt(cap, pos, marker) {
  return cap.slice(0, pos) + '\n\n' + marker + '\n' + cap.slice(pos);
}

// Encontra o fim do N-ésimo parágrafo dentro da seção `heading`.
function findAfterNthParagraph(capText, heading, n) {
  const h = capText.indexOf(heading);
  if (h < 0) return -1;
  let cursor = capText.indexOf('\n', h) + 1;
  for (let i = 0; i < n; i++) {
    // pula linhas em branco até o início do próximo parágrafo
    while (capText[cursor] === '\n') cursor++;
    const paraEnd = capText.indexOf('\n\n', cursor);
    if (paraEnd < 0) return i === n - 1 ? capText.length : -1;
    if (i === n - 1) return paraEnd;
    cursor = paraEnd + 2;
  }
  return -1;
}

function findInsertPos(capText, s) {
  if (s.afterNthParagraphOf) {
    const [heading, n] = s.afterNthParagraphOf;
    return findAfterNthParagraph(capText, heading, n);
  }
  if (s.afterSection) {
    const h = capText.indexOf(s.afterSection);
    if (h < 0) return -1;
    const nextH2 = capText.indexOf('\n## ', h + 4);
    const nextBq = capText.indexOf('\n> ', h + 4);
    const candidates = [nextH2, nextBq].filter((x) => x >= 0);
    return candidates.length ? Math.min(...candidates) : -1;
  }
  if (s.afterBlockquote) {
    const b = capText.indexOf(s.afterBlockquote);
    if (b < 0) return -1;
    const lineEnd = capText.indexOf('\n', b);
    return lineEnd < 0 ? capText.length : lineEnd;
  }
  return -1;
}

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI, OPCOES_DE_SCRIPT);
  await client.connect();
  const db = client.db('fayapointProdutos');
  const products = db.collection('products');
  const p = await products.findOne({ slug: SLUG }, { projection: { slug: 1, courseContent: 1 } });
  if (!p) throw new Error(`${SLUG} não encontrado`);
  const content = p.courseContent || '';

  // A língua decide as âncoras de seção. Detectada pelo conteúdo, não pelo slug:
  // o slug não diz o idioma (`mastering-ai-with-chatgpt` e `chatgpt-zero` são o
  // mesmo curso em línguas diferentes).
  const isEN = content.includes('## Key Concepts') && !content.includes('## Conceitos-Chave');
  const SLOTS = isEN ? SLOTS_EN : SLOTS_PT;

  // ⚠️ 16/08/2026: o capítulo NÃO é sempre "# Capítulo N:". Os 11 cursos que
  // passaram pelo `padronizar-curso.ts` trazem as 8 seções do gabarito mas
  // mantiveram o H1 temático próprio ("# Anatomia do Prompt Perfeito"), e a
  // versão inglesa usa "# Chapter N:". A contagem fixa em 30 também estava
  // errada: os cursos vão de 13 a 31 capítulos, e com o teto em 30 o capítulo
  // 31 era engolido pelo slice do capítulo 30.
  //
  // ⚠️ E nem todo H1 é capítulo. A maioria dos cursos abre com um H1 de
  // APRESENTAÇÃO ("# Automação com n8n", 719 chars, nenhuma seção) antes do
  // primeiro capítulo. Numerar por H1 cru desloca tudo em 1 e gruda o marcador
  // `cap01-*` no texto do capítulo 2 — o tipo de estrago que ninguém percebe
  // até o aluno ver a imagem errada.
  //
  // Capítulo é o H1 cujo bloco carrega a seção de conceitos do gabarito.
  const marcaDeCapitulo = isEN ? '## Key Concepts' : '## Conceitos-Chave';
  const h1s = [];
  const h1Re = /^# .+$/gm;
  let m;
  while ((m = h1Re.exec(content)) !== null) h1s.push(m.index);
  if (h1s.length === 0) throw new Error(`Nenhum H1 encontrado em ${SLUG}`);

  const bounds = [];
  let pulados = 0;
  for (let k = 0; k < h1s.length; k++) {
    const start = h1s[k];
    const end = k + 1 < h1s.length ? h1s[k + 1] : content.length;
    if (!content.slice(start, end).includes(marcaDeCapitulo)) { pulados++; continue; }
    bounds.push({ n: bounds.length + 1, start, end });
  }
  if (bounds.length === 0) throw new Error(`Nenhum capítulo com "${marcaDeCapitulo}" em ${SLUG}`);
  console.log(
    `${SLUG}: ${bounds.length} capítulos · âncoras em ${isEN ? 'inglês' : 'português'}` +
    (pulados ? ` · ${pulados} H1 fora da numeração (abertura//fecho)` : '')
  );

  let updated = '';
  let cursor = 0;
  let inserted = 0, skippedHas = 0, skippedMedia = 0, failed = 0;

  for (let i = 0; i < bounds.length; i++) {
    const { n, start, end } = bounds[i];
    updated += content.slice(cursor, start);
    let cap = content.slice(start, end);
    cursor = end;

    const plan = [];
    for (const s of SLOTS) {
      const id = `${SLUG.slice(0, 6)}-cap${String(n).padStart(2, '0')}-${s.slot}`;
      if (cap.includes(`id="${id}"`)) { skippedHas++; continue; } // ja marcado, backfill incremental
      const pos = findInsertPos(cap, s);
      if (pos < 0) { console.log(`cap ${n} ${s.slot}: âncora NÃO ACHADA`); failed++; continue; }
      if (!mediaFilesExist(n, s)) { skippedMedia++; continue; }
      plan.push({ pos, marker: buildMarker(n, s) });
    }
    plan.sort((a, b) => b.pos - a.pos);
    for (const { pos, marker } of plan) {
      cap = insertAt(cap, pos, marker);
      inserted++;
    }
    updated += cap;
  }
  updated += content.slice(cursor);

  console.log(`\n${SLUG} | ${APPLY ? 'APLICANDO' : 'DRY-RUN'} | inseridos: ${inserted} | caps já marcados: ${skippedHas} | sem mídia ainda: ${skippedMedia} | falhas de âncora: ${failed}`);
  console.log(`chars: ${content.length} -> ${updated.length}`);

  if (APPLY && inserted > 0) {
    await db.collection(BACKUP_COLL).updateOne(
      { slug: p.slug },
      { $set: { slug: p.slug, courseContent: content, backedUpAt: new Date() } },
      { upsert: true }
    );
    await products.updateOne({ _id: p._id }, { $set: { courseContent: updated } });
    console.log('GRAVADO (backup em', BACKUP_COLL + ')');
    // Sem isto o texto novo só aparece quando o TTL vencer: 10 min no
    // catálogo, 1h nos capítulos já picados do livro e do Ateliê.
    await invalidarCache(p.slug);
  }
  await client.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
