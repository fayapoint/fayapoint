/**
 * Leitura 2.0 — escala (17/07/2026): insere marcadores de mídia inline em
 * TODOS os capítulos do chatgpt-zero por âncora ESTRUTURAL (seções ## são
 * idênticas em todos os caps — curso templado). Idempotente por capítulo
 * (pula quem já tem marcador, ex.: cap 1 do piloto).
 *
 * ⚠️ SÓ RODAR --apply DEPOIS do deploy que inclui os arquivos em
 * public/cursos/media/chatgpt-zero/inline/ (diretriz 17/07: deploy único
 * no fim do MASTERPLAN). react-markdown antigo mostraria texto cru.
 *
 * Uso:  node scripts/cursos/insert-course-inline-markers.cjs           (dry-run)
 *       node scripts/cursos/insert-course-inline-markers.cjs --apply   (grava com backup)
 */
const { MongoClient } = require('mongodb');

const APPLY = process.argv.includes('--apply');
const BACKUP_COLL = 'products_backup_leitura20_full_20260717';
const BASE = '/cursos/media/chatgpt-zero/inline';
const fs = require('fs');
const path = require('path');
const MEDIA_DIR = path.join(__dirname, '..', '..', 'public', 'cursos', 'media', 'chatgpt-zero', 'inline');

// Slots estruturais: onde inserir dentro de cada capítulo.
// find = fim de parágrafo IDÊNTICO em todos os caps (curso templado),
// ou seção estrutural quando o texto varia por capítulo.
const SLOTS = [
  { slot: 'sistema', type: 'img',
    anchor: 'mas ainda assim falhar no que realmente importa.',
    caption: 'Qualidade em IA é um sistema em camadas: contexto, restrições, referências e critérios. Uma camada fraca e a resposta inteira perde valor.' },
  { slot: 'intencao', type: 'img',
    anchor: 'Esse deslocamento de mentalidade é o que este capítulo treina.',
    caption: 'Separar intenção de execução: primeiro definir o que é uma boa resposta, só depois delegar à IA.' },
  { slot: 'fluxo', type: 'video',
    anchor: 'para transformar o aprendizado em sistema repetível.',
    caption: 'O ciclo de 5 passos: clarificar → preparar contexto → executar → revisar → empacotar.' },
  { slot: 'cenario', type: 'img', afterFirstParagraphOf: '## Cenários Aplicados',
    caption: 'De pedido vago a processo gerenciado: trabalho, formato, fontes, tom e validação explícitos.' },
  { slot: 'validacao', type: 'img', afterSection: '## Erros Comuns',
    caption: 'A IA é parceira de rascunho, não autoridade final — quem valida e assina é você.' },
  { slot: 'dica', type: 'video', afterBlockquote: '**Dica Pro:**',
    caption: 'Escreva o checklist de avaliação antes do prompt: o hábito que mais melhora a qualidade das respostas.' },
];

function buildMarker(cap, s) {
  const id = `cgz-cap${String(cap).padStart(2, '0')}-${s.slot}`;
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

function findInsertPos(capText, s) {
  if (s.anchor) {
    const first = capText.indexOf(s.anchor);
    if (first < 0) return -1;
    if (capText.indexOf(s.anchor, first + 1) >= 0) return -2; // ambígua
    const lineEnd = capText.indexOf('\n', first);
    return lineEnd < 0 ? capText.length : lineEnd;
  }
  if (s.afterFirstParagraphOf) {
    const h = capText.indexOf(s.afterFirstParagraphOf);
    if (h < 0) return -1;
    const bodyStart = capText.indexOf('\n', h) + 1;
    const paraEnd = capText.indexOf('\n\n', bodyStart);
    return paraEnd < 0 ? -1 : paraEnd;
  }
  if (s.afterSection) {
    const h = capText.indexOf(s.afterSection);
    if (h < 0) return -1;
    const nextH2 = capText.indexOf('\n## ', h + 4);
    const nextBq = capText.indexOf('\n> ', h + 4);
    // fim da seção = antes do próximo bloco estrutural (h2 ou blockquote)
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
  const p = await products.findOne({ slug: 'chatgpt-zero' }, { projection: { slug: 1, courseContent: 1 } });
  if (!p) throw new Error('chatgpt-zero não encontrado');
  const content = p.courseContent || '';

  // fatia por capítulo
  const bounds = [];
  for (let n = 1; n <= 30; n++) {
    const start = content.indexOf(`# Capítulo ${n}:`);
    if (start < 0) throw new Error(`Capítulo ${n} não encontrado`);
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

    // inserções de trás para frente para não invalidar posições
    const plan = [];
    for (const s of SLOTS) {
      const pos = findInsertPos(cap, s);
      if (pos < 0) { console.log(`cap ${n} ${s.slot}: âncora ${pos === -2 ? 'AMBÍGUA' : 'NÃO ACHADA'}`); failed++; continue; }
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

  console.log(`\n${APPLY ? 'APLICANDO' : 'DRY-RUN'} | inseridos: ${inserted} | caps já marcados: ${skippedHas} | sem mídia ainda: ${skippedMedia} | falhas de âncora: ${failed}`);
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
