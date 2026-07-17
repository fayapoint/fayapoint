/**
 * Leitura 2.0 — piloto (17/07/2026): insere marcadores de mídia inline no
 * Capítulo 1 do chatgpt-zero. Marcadores são comentários HTML: invisíveis
 * para readers antigos, renderizados NO PONTO pelo reader novo.
 *
 * Uso:  node scripts/cursos/insert-cap1-inline-markers.cjs           (dry-run)
 *       node scripts/cursos/insert-cap1-inline-markers.cjs --apply   (grava com backup)
 */
const { MongoClient } = require('mongodb');

const APPLY = process.argv.includes('--apply');
const BACKUP_COLL = 'products_backup_leitura20_20260717';
const BASE = '/cursos/media/chatgpt-zero/inline';

// Cada inserção: âncora = fim de parágrafo ÚNICO dentro do capítulo 1.
const INSERTIONS = [
  {
    anchor: 'mas ainda assim falhar no que realmente importa.',
    marker: `<!--media:img id="cgz-cap01-sistema" src="${BASE}/cap01-sistema.webp" caption="Qualidade em IA é um sistema em camadas: contexto, restrições, referências e critérios. Uma camada fraca e a resposta inteira perde valor."-->`,
  },
  {
    anchor: 'Esse deslocamento de mentalidade é o que este capítulo treina.',
    marker: `<!--media:img id="cgz-cap01-intencao" src="${BASE}/cap01-intencao.webp" caption="Separar intenção de execução: primeiro definir o que é uma boa resposta, só depois delegar à IA."-->`,
  },
  {
    anchor: 'para transformar o aprendizado em sistema repetível.',
    marker: `<!--media:video id="cgz-cap01-fluxo" src="${BASE}/cap01-fluxo.webm" poster="${BASE}/cap01-fluxo.webp" caption="O ciclo de 5 passos: clarificar → preparar contexto → executar → revisar → empacotar."-->`,
  },
  {
    anchor: 'processo gerenciado, e não em conversa improvisada.',
    marker: `<!--media:img id="cgz-cap01-planos" src="${BASE}/cap01-planos.webp" caption="De ideia vaga a plano definido: trabalho, formato, fontes, tom e validação explícitos antes do prompt."-->`,
  },
  {
    anchor: 'especialmente em cenários como transformar ideias vagas em planos bem definidos.',
    marker: `<!--media:img id="cgz-cap01-validacao" src="${BASE}/cap01-validacao.webp" caption="A IA é parceira de rascunho, não autoridade final — quem valida e assina é você."-->`,
  },
  {
    anchor: 'da velocidade de iteração em fluxos ligados a fundamentos do uso prático do ChatGPT para iniciantes.',
    marker: `<!--media:video id="cgz-cap01-checklist" src="${BASE}/cap01-checklist.webm" poster="${BASE}/cap01-checklist.webp" caption="Escreva o checklist de avaliação antes do prompt: o hábito que mais melhora a qualidade das respostas."-->`,
  },
];

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('fayapointProdutos');
  const products = db.collection('products');
  const p = await products.findOne({ slug: 'chatgpt-zero' }, { projection: { slug: 1, courseContent: 1 } });
  if (!p) throw new Error('chatgpt-zero não encontrado');

  const content = p.courseContent || '';
  const capStart = content.indexOf('# Capítulo 1:');
  const capEnd = content.indexOf('# Capítulo 2:');
  if (capStart < 0 || capEnd < 0 || capEnd <= capStart) throw new Error('limites do capítulo 1 não encontrados');

  let cap = content.slice(capStart, capEnd);

  if (cap.includes('<!--media:')) {
    console.log('Capítulo 1 JÁ TEM marcadores — abortando para não duplicar.');
    await client.close();
    return;
  }

  for (const { anchor, marker } of INSERTIONS) {
    const first = cap.indexOf(anchor);
    const last = cap.lastIndexOf(anchor);
    if (first < 0) throw new Error(`âncora não encontrada: "${anchor.slice(0, 50)}..."`);
    if (first !== last) throw new Error(`âncora ambígua: "${anchor.slice(0, 50)}..."`);
    const lineEnd = cap.indexOf('\n', first);
    const at = lineEnd < 0 ? cap.length : lineEnd;
    cap = cap.slice(0, at) + '\n\n' + marker + '\n' + cap.slice(at);
    console.log('OK  +', marker.slice(0, 70) + '...');
  }

  const updated = content.slice(0, capStart) + cap + content.slice(capEnd);
  console.log(`\n${APPLY ? 'APLICANDO' : 'DRY-RUN'} | chars: ${content.length} -> ${updated.length} | marcadores: ${INSERTIONS.length}`);

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
