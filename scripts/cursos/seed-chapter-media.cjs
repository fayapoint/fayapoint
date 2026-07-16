/**
 * Liga as ilustrações geradas ao Content Forge (16/07/2026, v2).
 * Replica o agrupamento do reader (buildReaderSections: >30 caps → seções de
 * ~2, alvo clamp(round(n/4),15,24)) e seeda por SEÇÃO: heroImage = 1º capítulo
 * do grupo, demais capítulos do grupo viram gallery. Preserva video/audio.
 * ATENÇÃO: se o nº de capítulos do curso mudar, re-rodar este seed.
 * Uso: node scripts/cursos/seed-chapter-media.cjs [slug] [nCapsBrutos]
 */
const { MongoClient } = require('mongodb');

const SLUG = process.argv[2] || 'chatgpt-zero';
const N_RAW = parseInt(process.argv[3] || '31', 10);

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function sections(nRaw) {
  if (nRaw <= 30) return Array.from({ length: nRaw }, (_, i) => [i + 1]); // 1 cap por seção
  const target = clamp(Math.round(nRaw / 4), 15, 24);
  const base = Math.floor(nRaw / target);
  const rem = nRaw % target;
  const out = [];
  let cursor = 1;
  for (let g = 0; g < target; g++) {
    const size = base + (g < rem ? 1 : 0);
    out.push(Array.from({ length: size }, (_, i) => cursor + i));
    cursor += size;
  }
  return out;
}

const img = (cap) => ({
  source: 'url',
  url: `/cursos/media/${SLUG}/cap-${String(cap).padStart(2, '0')}.webp`,
  caption: '',
});

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const col = client.db('mission-control').collection('content-forge-chapters');

  const groups = sections(N_RAW);
  for (let s = 0; s < groups.length; s++) {
    const caps = groups[s];
    await col.updateOne(
      { courseSlug: SLUG, chapterSlug: `chapter-${s + 1}` },
      {
        $set: {
          'media.heroImage': img(caps[0]),
          'media.gallery': caps.slice(1).map(img),
          updatedAt: new Date(),
        },
        $setOnInsert: { courseSlug: SLUG, chapterSlug: `chapter-${s + 1}` },
      },
      { upsert: true }
    );
  }

  // limpa heroImages órfãos de seeds anteriores além do nº de seções
  const cleanup = await col.updateMany(
    { courseSlug: SLUG, chapterSlug: { $regex: /^chapter-\d+$/ } },
    [{
      $set: {
        media: {
          $cond: [
            { $gt: [{ $toInt: { $arrayElemAt: [{ $split: ['$chapterSlug', '-'] }, 1] } }, groups.length] },
            { $mergeObjects: ['$media', { heroImage: null, gallery: [] }] },
            '$media',
          ],
        },
      },
    }]
  );

  console.log(`OK: ${groups.length} seções seedadas em ${SLUG} (hero+gallery); cleanup matched ${cleanup.matchedCount}`);
  await client.close();
})().catch((e) => { console.error(e); process.exit(1); });
