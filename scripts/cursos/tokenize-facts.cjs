/**
 * Tokeniza fatos voláteis no courseContent (16/07/2026).
 * SEGURO por construção: troca o texto exato pelo token cujo valor no registry
 * é o MESMO texto — renderização idêntica hoje, atualizável para sempre.
 * Só menções a "modelo atual"; históricos (GPT-4o, Claude 3) ficam literais
 * para o auditor decidir com contexto.
 *
 * Uso:  node scripts/cursos/tokenize-facts.cjs           (dry-run)
 *       node scripts/cursos/tokenize-facts.cjs --apply    (grava com backup)
 */
const { MongoClient } = require('mongodb');

const APPLY = process.argv.includes('--apply');
const BACKUP_COLL = 'products_backup_tokens_20260716';

// ordem importa: strings mais longas primeiro
const RULES = [
  { find: /GPT-5\.4/g, token: '{{fact:openai-flagship}}', key: 'openai-flagship', value: 'GPT-5.4', label: 'Modelo topo de linha da OpenAI' },
  { find: /GPT-5(?![.\d])/g, token: '{{fact:openai-family}}', key: 'openai-family', value: 'GPT-5', label: 'Família de modelos atual da OpenAI' },
  { find: /Opus 4\.6/g, token: '{{fact:claude-flagship}}', key: 'claude-flagship', value: 'Opus 4.6', label: 'Modelo topo de linha da Anthropic (usar sem o prefixo Claude)' },
  // Só a variante de prosa mais recente; "Sonnet 4"/"4.5"/ids "sonnet-4" em código ficam p/ o auditor
  { find: /Sonnet 4\.6/g, token: '{{fact:claude-sonnet}}', key: 'claude-sonnet', value: 'Sonnet 4.6', label: 'Modelo intermediário da Anthropic (usar sem o prefixo Claude)' },
];

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('fayapointProdutos');
  const products = db.collection('products');
  const prods = await products.find({ status: 'active' }, { projection: { slug: 1, courseContent: 1 } }).toArray();

  let totalRepl = 0;
  const perCourse = [];
  for (const p of prods) {
    const original = p.courseContent || '';
    let updated = original;
    const counts = {};
    for (const r of RULES) {
      const m = updated.match(r.find);
      if (m && m.length) {
        counts[r.key] = m.length;
        updated = updated.replace(r.find, r.token);
      }
    }
    const n = Object.values(counts).reduce((a, b) => a + b, 0);
    if (!n) continue;
    totalRepl += n;
    perCourse.push({ slug: p.slug, n, counts });

    if (APPLY) {
      await db.collection(BACKUP_COLL).updateOne(
        { slug: p.slug },
        { $set: { slug: p.slug, courseContent: original, backedUpAt: new Date() } },
        { upsert: true }
      );
      await products.updateOne({ _id: p._id }, { $set: { courseContent: updated } });
    }
  }

  if (APPLY) {
    const facts = db.collection('content_facts');
    for (const r of RULES) {
      await facts.updateOne(
        { key: r.key },
        { $set: { key: r.key, value: r.value, label: r.label, updatedAt: new Date(), updatedBy: 'tokenize-facts 16/07' } },
        { upsert: true }
      );
    }
  }

  console.log(APPLY ? 'APLICADO' : 'DRY-RUN', '| cursos afetados:', perCourse.length, '| substituições:', totalRepl);
  perCourse.forEach((c) => console.log(' ', c.slug, JSON.stringify(c.counts)));
  await client.close();
})().catch((e) => { console.error(e); process.exit(1); });
