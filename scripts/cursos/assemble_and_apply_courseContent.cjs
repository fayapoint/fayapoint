/**
 * Monta o courseContent final (30 capítulos, texto reescrito 18/07) e grava
 * em fayapointProdutos.products.courseContent, com backup automático.
 * Uso: node assemble_and_apply_courseContent.cjs <slug> [--apply]
 */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const SLUG = process.argv[2];
const APPLY = process.argv.includes('--apply');
if (!SLUG) { console.error('Uso: node assemble_and_apply_courseContent.cjs <slug> [--apply]'); process.exit(1); }

const DRAFTS = path.join(__dirname, 'content_drafts');

const SOURCES = {
  'chatgpt-zero': ['chatgpt-zero_cap1.json', 'chatgpt-zero_caps_2-15.json', 'chatgpt-zero_cap6.json', 'chatgpt-zero_caps_16-30.json'],
  'primeiras-automacoes': ['primeiras-automacoes_caps_1-15.json', 'primeiras-automacoes_caps_16-30.json'],
  'aprenda-a-usar-inteligencia-artificial-no-seu-dia-a-dia': ['ia-dia-a-dia_caps_1-15.json', 'ia-dia-a-dia_caps_16-30.json'],
  'rag-knowledge': ['rag-knowledge_caps_1-15.json', 'rag-knowledge_caps_16-30.json'],
};

const files = SOURCES[SLUG];
if (!files) { console.error('slug desconhecido:', SLUG); process.exit(1); }

let chapters = [];
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(DRAFTS, f), 'utf-8'));
  chapters = chapters.concat(data);
}
chapters.sort((a, b) => a.n - b.n);

const nums = chapters.map((c) => c.n);
const expected = Array.from({ length: 30 }, (_, i) => i + 1);
const missing = expected.filter((n) => !nums.includes(n));
const dupes = nums.filter((n, i) => nums.indexOf(n) !== i);
if (missing.length) { console.error('FALTAM capítulos:', missing); process.exit(1); }
if (dupes.length) { console.error('DUPLICADOS:', dupes); process.exit(1); }

const courseContent = chapters.map((c) => c.content.trim()).join('\n\n');
console.log(`${SLUG}: ${chapters.length} capítulos montados, ${courseContent.length} chars`);

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('fayapointProdutos');
  const products = db.collection('products');
  const p = await products.findOne({ slug: SLUG }, { projection: { _id: 1, courseContent: 1 } });
  if (!p) throw new Error(`${SLUG} não encontrado`);

  if (APPLY) {
    const backupColl = `products_backup_rewrite18_${SLUG.replace(/-/g, '_')}_20260718`;
    await db.collection(backupColl).updateOne(
      { slug: SLUG },
      { $set: { slug: SLUG, courseContent: p.courseContent, backedUpAt: new Date() } },
      { upsert: true }
    );
    await products.updateOne({ _id: p._id }, { $set: { courseContent, contentUpdatedAt: new Date() } });
    console.log(`GRAVADO (backup do texto anterior em ${backupColl})`);
  } else {
    console.log('DRY-RUN — nada gravado. Rode com --apply para gravar.');
  }
  await client.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
