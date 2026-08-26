/**
 * Refaz o preço dos cursos e apaga a prova social inventada.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Levantado no laudo de 26/08/2026:
 *
 *  - 20 dos 22 cursos exibiam desconto permanente de 60% ou mais, o extremo em
 *    −91% (R$ 897 riscado, R$ 79 cobrado). Preço de referência que nunca foi
 *    praticado é publicidade enganosa (CDC art. 37 §1º) — e um selo de −91%
 *    fixo não convence mais ninguém.
 *
 *  - Três cursos carregavam alunos, nota e avaliações inventados
 *    (9.800/4,8/1.910 no curso que a vitrine chamava de "MAIS VENDIDO"),
 *    enquanto os outros 19 exibiam "0 alunos" na página de venda.
 *
 * A tabela nova cobra pelo TAMANHO do curso, que é o que o aluno recebe, e o
 * preço passa a ser o preço: sem `originalPrice`, sem `discount`, sem riscado.
 *
 * Referência de coerência com a assinatura: Explorador R$ 57/mês, Profissional
 * R$ 97/mês, Expert R$ 167/mês. O avulso é vitalício, então tem de ficar abaixo
 * de um mês de assinatura para a conta fechar dos dois lados.
 *
 * ⚠️⚠️ NÃO RODE COM `--gravar` SEM LER ISTO (26/08/2026, no mesmo dia)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A faixa abaixo lê `metrics.lessons`, e **o campo estava inflado** — em 18 dos
 * 22 cursos, e justamente nos MENORES. `openclaw` dizia 180 aulas e tem 16
 * capítulos; `make-integracao`, 150 para 15. A escada saiu invertida:
 *
 *   perplexity ......... 305k caracteres, 31 capítulos ... R$ 29
 *   make-integracao .... 145k caracteres, 15 capítulos ... R$ 79
 *
 * `aulas-e-tempo-honestos.mjs` já corrigiu o campo (soma do catálogo: 1.525 →
 * 517). Com os números certos, nenhum curso passa de 31 capítulos: a faixa de
 * R$ 79 fica VAZIA e todo o catálogo desaba para R$ 29 — o que não é decisão
 * deste script.
 *
 * Antes de rodar de novo, a escada precisa de uma unidade nova. A candidata
 * medida é o tamanho do texto (caracteres), que é o que o aluno recebe; a
 * tabela está no handoff de 26/08. Rodar como está hoje é dar 63% de desconto
 * em seis cursos sem querer.
 *
 * Uso:
 *   node scripts/precos-e-metricas-honestas.mjs           (simula, não grava)
 *   node scripts/precos-e-metricas-honestas.mjs --gravar  (grava, com backup)
 */
import { MongoClient } from 'mongodb';
import fs from 'fs';

const GRAVAR = process.argv.includes('--gravar');

/** Preço por número de aulas. O ChatGPT do Zero é a exceção declarada. */
const PRECO_SIMBOLICO = { slug: 'chatgpt-zero', preco: 5 };
const FAIXAS = [
  { ate: 30, preco: 29, nome: 'curto' },
  { ate: 99, preco: 49, nome: 'médio' },
  { ate: Infinity, preco: 79, nome: 'longo' },
];

const precoDe = (slug, aulas) => {
  if (slug === PRECO_SIMBOLICO.slug) return PRECO_SIMBOLICO.preco;
  return FAIXAS.find((f) => aulas <= f.ate).preco;
};

const uri = fs.readFileSync('.env.local', 'utf8').match(/MONGODB_URI=(.+)/)[1].trim();
const cliente = new MongoClient(uri);
await cliente.connect();
const col = cliente.db('fayapointProdutos').collection('products');

const filtro = { type: 'course', status: 'active', aposentado: { $ne: true } };
const cursos = await col.find(filtro).project({
  slug: 1, pricing: 1, metrics: 1, honestMetrics: 1,
}).toArray();

console.log(`cursos no catálogo: ${cursos.length}\n`);

if (GRAVAR) {
  const nome = `products_backup_precohonesto_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const existentes = await cliente.db('fayapointProdutos').listCollections({ name: nome }).toArray();
  if (!existentes.length) {
    await col.aggregate([{ $match: filtro }, { $out: nome }]).toArray();
    console.log(`backup gravado em ${nome}\n`);
  } else {
    console.log(`backup ${nome} já existe — seguindo\n`);
  }
}

const p = (s, n) => String(s ?? '-').padEnd(n).slice(0, n);
console.log(p('SLUG', 44), p('AULAS', 6), p('DE', 6), p('PARA', 6), p('RISCADO', 9), p('MÉTRICAS', 10));

let mudouPreco = 0, limpouRiscado = 0, limpouMetricas = 0;

for (const c of cursos) {
  const aulas = c.metrics?.lessons ?? 0;
  const novo = precoDe(c.slug, aulas);
  const antigo = c.pricing?.price;
  const tinhaRiscado = c.pricing?.originalPrice != null || c.pricing?.discount != null;
  const m = c.metrics || {};
  const metricasFalsas = (m.students ?? 0) > 0 || (m.rating ?? 0) > 0 || (m.reviewCount ?? 0) > 0;

  const set = {
    'pricing.price': novo,
    honestMetrics: true,
    'metrics.students': 0,
    'metrics.rating': 0,
    'metrics.reviewCount': 0,
  };
  const unset = { 'pricing.originalPrice': '', 'pricing.discount': '' };

  if (novo !== antigo) mudouPreco++;
  if (tinhaRiscado) limpouRiscado++;
  if (metricasFalsas) limpouMetricas++;

  console.log(
    p(c.slug, 44), p(aulas, 6), p('R$' + antigo, 6), p('R$' + novo, 6),
    p(tinhaRiscado ? 'sai R$' + c.pricing.originalPrice : '—', 9),
    p(metricasFalsas ? `zera ${m.students}` : 'ok', 10),
  );

  if (GRAVAR) await col.updateOne({ _id: c._id }, { $set: set, $unset: unset });
}

console.log(`\npreços alterados: ${mudouPreco} · riscados removidos: ${limpouRiscado} · métricas zeradas: ${limpouMetricas}`);
console.log(GRAVAR ? '\nGRAVADO.' : '\nSIMULAÇÃO — rode com --gravar para aplicar.');
await cliente.close();
