const { MongoClient } = require('mongodb');

function h1Headings(content) {
  return [...content.matchAll(/^# ([^#\n].*)$/gm)].map(m => m[1].trim());
}

function shingles(text, n = 12) {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const set = new Set();
  for (let i = 0; i + n <= words.length; i += 4) { // stride 4 for speed
    set.add(words.slice(i, i + n).join(' ').toLowerCase());
  }
  return set;
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  for (const s of small) if (big.has(s)) inter++;
  return inter / (a.size + b.size - inter);
}

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const dbC = client.db('fayapoint');
  const dbP = client.db('fayapointProdutos');

  const courses = await dbC.collection('courses').find({}, {
    projection: { slug: 1, title: 1, category: 1, status: 1, modules: 1, price: 1, description: 1 }
  }).toArray();

  const records = [];
  for (const c of courses) {
    const p = await dbP.collection('products').findOne({ slug: c.slug }, { projection: { courseContent: 1 } });
    const content = p?.courseContent || '';
    const headings = h1Headings(content);
    const totalLessons = (c.modules || []).reduce((a, m) => a + (m.lessons || []).length, 0);
    records.push({
      slug: c.slug,
      title: c.title,
      category: c.category,
      status: c.status,
      price: c.price,
      description: c.description,
      totalLessonsClaimed: totalLessons,
      numModules: (c.modules || []).length,
      contentLen: content.length,
      h1Count: headings.length,
      headings,
      content,
    });
  }

  // Within-course duplication: repeated long shingles inside same courseContent
  console.log('\n===== DUPLICAÇÃO INTERNA (mesma frase repetida dentro do mesmo curso) =====');
  for (const r of records) {
    if (!r.content) continue;
    const words = r.content.replace(/\s+/g, ' ').trim().split(' ');
    const seen = new Map();
    let dupCount = 0;
    const n = 15;
    for (let i = 0; i + n <= words.length; i += 8) {
      const key = words.slice(i, i + n).join(' ').toLowerCase();
      seen.set(key, (seen.get(key) || 0) + 1);
    }
    for (const [k, v] of seen) if (v > 1) dupCount++;
    if (dupCount > 0) {
      console.log(`${r.slug.padEnd(35)} | frases repetidas (15+ palavras): ${dupCount} | H1: ${r.h1Count} | lessons vendidas: ${r.totalLessonsClaimed}`);
    }
  }

  // Cross-course similarity (all pairs, published only, skip sacred content reproduction—just similarity score)
  console.log('\n===== SIMILARIDADE ENTRE CURSOS (possível merge/duplicata) =====');
  const shingleCache = records.map(r => ({ slug: r.slug, sh: shingles(r.content) }));
  const pairs = [];
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const sim = jaccard(shingleCache[i].sh, shingleCache[j].sh);
      if (sim > 0.03) {
        pairs.push({ a: records[i].slug, b: records[j].slug, sim });
      }
    }
  }
  pairs.sort((a, b) => b.sim - a.sim);
  for (const p of pairs.slice(0, 30)) {
    console.log(`${p.a.padEnd(35)} <-> ${p.b.padEnd(35)} | jaccard: ${(p.sim * 100).toFixed(1)}%`);
  }

  console.log('\n===== INVENTÁRIO COMPLETO =====');
  for (const r of records) {
    console.log(`\n[${r.status}] ${r.slug} — "${r.title}"`);
    console.log(`  categoria: ${r.category} | preço: ${JSON.stringify(r.price)} | módulos: ${r.numModules} | aulas vendidas: ${r.totalLessonsClaimed}`);
    console.log(`  courseContent: ${r.contentLen} chars | H1 reais: ${r.h1Count}`);
    console.log(`  H1s: ${r.headings.slice(0, 6).join(' // ')}${r.headings.length > 6 ? ' // ...' : ''}`);
  }

  require('fs').writeFileSync(
    require('path').join(__dirname, 'audit_courses_raw.json'),
    JSON.stringify(records.map(r => ({ ...r, content: undefined })), null, 1)
  );

  await client.close();
})().catch(e => { console.error(e); process.exit(1); });
