/**
 * Fase 3.2 (17/07/2026): marca os primeiros slots de exemplo no capítulo 1
 * do chatgpt-zero (curso piloto da Leitura 2.0). Os dois parágrafos de
 * "Cenários Aplicados" viram slots — o conteúdo atual É o exemplo padrão.
 *
 * ⚠️ SÓ RODAR --apply DEPOIS do deploy do reader com o guard de comentários
 * (diretriz 17/07: deploy único no fim do MASTERPLAN).
 *
 * Uso:  node scripts/cursos/insert-cap1-exemplo-slots.cjs           (dry-run)
 *       node scripts/cursos/insert-cap1-exemplo-slots.cjs --apply
 */
const { MongoClient } = require('mongodb');

const APPLY = process.argv.includes('--apply');
const BACKUP_COLL = 'products_backup_slots_20260717';

const OPEN_1 = '<!--exemplo id="cgz-cap01-cenario-fluxo" tema="aplicar o fluxo de trabalho gerenciado com IA em um cenário do negócio do aluno"-->';
const OPEN_2 = '<!--exemplo id="cgz-cap01-cenario-estudo" tema="usar IA para comprimir tempo de preparação em um tema que o aluno precisa dominar"-->';
const CLOSE = '<!--/exemplo-->';

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('fayapointProdutos');
  const products = db.collection('products');
  const p = await products.findOne({ slug: 'chatgpt-zero' }, { projection: { slug: 1, courseContent: 1 } });
  const content = p.courseContent || '';

  const capStart = content.indexOf('# Capítulo 1:');
  const capEnd = content.indexOf('# Capítulo 2:');
  let cap = content.slice(capStart, capEnd);

  if (cap.includes('exemplo id=')) {
    console.log('Capítulo 1 já tem slots — abortando.');
    await client.close();
    return;
  }

  const h = cap.indexOf('## Cenários Aplicados');
  if (h < 0) throw new Error('seção Cenários não encontrada');
  const p1Start = cap.indexOf('\n', h) + 1;
  const p1End = cap.indexOf('\n\n', p1Start);
  // pula marcadores de mídia entre os parágrafos (inseridos pela Leitura 2.0)
  let p2Start = p1End + 2;
  while (cap.slice(p2Start).trimStart().startsWith('<!--')) {
    const next = cap.indexOf('\n\n', p2Start);
    if (next < 0) throw new Error('fim inesperado após marcador');
    p2Start = next + 2;
  }
  const p2End = cap.indexOf('\n\n', p2Start);
  if (p1End < 0 || p2End < 0) throw new Error('parágrafos de Cenários não encontrados');

  const p1 = cap.slice(p1Start, p1End);
  const p2 = cap.slice(p2Start, p2End);
  // sanity: os parágrafos esperados
  if (!p1.includes('transformar ideias vagas')) throw new Error('¶1 inesperado: ' + p1.slice(0, 60));
  if (!p2.includes('estudar temas novos')) throw new Error('¶2 inesperado: ' + p2.slice(0, 60));

  const wrapped =
    OPEN_1 + '\n' + p1 + '\n' + CLOSE + '\n\n' +
    OPEN_2 + '\n' + p2 + '\n' + CLOSE;

  cap = cap.slice(0, p1Start) + wrapped + cap.slice(p2End);
  const updated = content.slice(0, capStart) + cap + content.slice(capEnd);

  console.log(`${APPLY ? 'APLICANDO' : 'DRY-RUN'} | slots: 2 | chars: ${content.length} -> ${updated.length}`);

  if (APPLY) {
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
