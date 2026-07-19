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
const fs = require('fs');
const path = require('path');

const SLUG = process.argv[2];
const APPLY = process.argv.includes('--apply');
if (!SLUG) {
  console.error('Uso: node insert-course-inline-markers.cjs <slug> [--apply]');
  process.exit(1);
}

const BACKUP_COLL = `products_backup_leitura20_${SLUG.replace(/-/g, '_')}_20260718`;
const BASE = `/cursos/media/${SLUG}/inline`;
const MEDIA_DIR = path.join(__dirname, '..', '..', 'public', 'cursos', 'media', SLUG, 'inline');

// Slots estruturais — todos ancorados por SEÇÃO/PARÁGRAFO, nenhum por frase
// literal (a prosa é única por capítulo desde 18/07, então uma frase fixa
// não existiria em todos os caps).
const SLOTS = [
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
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('fayapointProdutos');
  const products = db.collection('products');
  const p = await products.findOne({ slug: SLUG }, { projection: { slug: 1, courseContent: 1 } });
  if (!p) throw new Error(`${SLUG} não encontrado`);
  const content = p.courseContent || '';

  const bounds = [];
  for (let n = 1; n <= 30; n++) {
    const start = content.indexOf(`# Capítulo ${n}:`);
    if (start < 0) throw new Error(`Capítulo ${n} não encontrado em ${SLUG}`);
    bounds.push({ n, start });
  }
  bounds.push({ n: 31, start: content.length });

  let updated = '';
  let cursor = 0;
  let inserted = 0, skippedHas = 0, skippedMedia = 0, failed = 0;

  for (let i = 0; i < 30; i++) {
    const { n, start } = bounds[i];
    const end = bounds[i + 1].start;
    updated += content.slice(cursor, start);
    let cap = content.slice(start, end);
    cursor = end;

    if (cap.includes('<!--media:')) {
      skippedHas++;
      updated += cap;
      continue;
    }

    const plan = [];
    for (const s of SLOTS) {
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
  }
  await client.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
