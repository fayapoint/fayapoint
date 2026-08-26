/**
 * O preço passa a seguir a PRONTIDÃO do curso — não o tamanho inventado.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Decidido pelo Ricardo em 26/08/2026, e a frase dele é o critério inteiro:
 *
 *   *"os mais novos devem ser os que mais geram valor; os que ainda não estão
 *   prontos estarem mais caros é uma forma de afastar quem possa comprar no
 *   momento algo que está de baixa qualidade."*
 *
 * ## O que a escada anterior fazia de errado
 *
 * `precos-e-metricas-honestas.mjs` cobrava por `metrics.lessons` — e aquele
 * campo estava inflado justamente nos cursos MENORES (180 "aulas" para 16
 * capítulos). A escada saiu invertida: os seis cursos de R$ 79 eram os seis com
 * menos conteúdo do catálogo, e os maiores custavam R$ 29. Exatamente o que o
 * Ricardo descreve: o material menos pronto era o mais caro.
 *
 * ## As duas gerações, medidas — não estimadas
 *
 * O catálogo se separa sozinho em dois grupos, sem zona cinzenta:
 *
 *   geração nova ...... 30–31 capítulos · 30 exercícios · 240 marcadores de
 *                       mídia em nove delas · reescrita entre jul e ago/2026
 *   geração anterior .. 13–20 capítulos · ZERO marcadores de mídia ·
 *                       o currículo que prometia 150 aulas para 15 capítulos
 *
 * Não existe curso com mídia entre 1 e 239 marcadores: ou tem 240, ou tem 0. É
 * por isso que o corte de mídia pode ser um número redondo sem ser arbitrário.
 *
 * ## A escada
 *
 *   ≥ 30 capítulos E com mídia .......... R$ 79   (o mais novo e mais completo)
 *   ≥ 30 capítulos, mídia por gerar ..... R$ 49
 *   < 30 capítulos (geração anterior) ... R$ 29   (barato até ficar pronto)
 *   `chatgpt-zero` ...................... R$  5   (preço simbólico declarado)
 *
 * O teto continua R$ 79 de propósito: o avulso é vitalício e precisa ficar
 * abaixo de um mês do plano Profissional (R$ 97), senão a conta não fecha dos
 * dois lados. Ver `src/lib/course-tiers.ts`.
 *
 * ⚠️ **Preço não ganha desconto.** Sem `originalPrice`, sem `discount`, sem
 * riscado — a regra do item 4 do laudo continua valendo. Quando um curso da
 * geração anterior for reescrito, ele SOBE de faixa sozinho na próxima
 * passagem: o preço acompanha o trabalho, e não uma promoção.
 *
 * Uso:
 *   node scripts/precos-por-prontidao.mjs            (simula, não grava)
 *   node scripts/precos-por-prontidao.mjs --gravar   (grava, com backup)
 *
 * Depois de gravar: `node scripts/sincronizar-cursos-estaticos.mjs --gravar`
 * (a home lê o arquivo estático) e `node scripts/invalidar-cache.mjs`.
 */
import { MongoClient } from 'mongodb';
import fs from 'fs';

const GRAVAR = process.argv.includes('--gravar');

/** Preço simbólico declarado — a porta de entrada do catálogo. */
const SIMBOLICO = { slug: 'chatgpt-zero', preco: 5 };

const CAPITULOS_COMPLETO = 30;
/** Medido: os cursos com mídia têm 240 marcadores; os sem, zero. */
const MIDIA_MINIMA = 100;

const PRECOS = { completoComMidia: 79, completo: 49, anterior: 29 };

const semMarcadores = (t) => (t || '').replace(new RegExp('<' + '!--[\\s\\S]*?--' + '>', 'g'), '');

const faixaDe = (caps, midia) => {
  if (caps >= CAPITULOS_COMPLETO && midia >= MIDIA_MINIMA) return ['completo com mídia', PRECOS.completoComMidia];
  if (caps >= CAPITULOS_COMPLETO) return ['completo, mídia por gerar', PRECOS.completo];
  return ['geração anterior', PRECOS.anterior];
};

const uri = fs.readFileSync('.env.local', 'utf8').match(/MONGODB_URI=(.+)/)[1].trim();
const cliente = new MongoClient(uri);
await cliente.connect();
const db = cliente.db('fayapointProdutos');
const col = db.collection('products');

const filtro = { type: 'course', status: 'active', aposentado: { $ne: true } };
const cursos = await col
  .find(filtro)
  .project({ slug: 1, courseContent: 1, contentChapters: 1, pricing: 1, metrics: 1 })
  .toArray();

console.log(`cursos no catálogo: ${cursos.length}\n`);

if (GRAVAR) {
  const nome = `products_backup_precoprontidao_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const existentes = await db.listCollections({ name: nome }).toArray();
  if (!existentes.length) {
    await col.aggregate([{ $match: filtro }, { $out: nome }]).toArray();
    console.log(`backup: ${nome}\n`);
  } else {
    console.log(`backup já existia: ${nome}\n`);
  }
}

const linhas = [];
let mudados = 0;
let receitaAntes = 0;
let receitaDepois = 0;

for (const p of cursos) {
  const cc = p.courseContent || '';
  const caps = p.contentChapters ?? 0;
  const midia = [...cc.matchAll(/\.(mp4|webm|webp|png|jpg)\b/gi)].length;
  const [faixa, precoDaFaixa] = faixaDe(caps, midia);
  const preco = p.slug === SIMBOLICO.slug ? SIMBOLICO.preco : precoDaFaixa;
  const antes = p.pricing?.price ?? 0;

  receitaAntes += antes;
  receitaDepois += preco;

  const precisaLimpar = p.pricing?.originalPrice !== undefined || p.pricing?.discount !== undefined;
  const mudou = antes !== preco || precisaLimpar;
  if (mudou) mudados += 1;

  linhas.push({
    slug: p.slug,
    caps,
    chars: semMarcadores(cc).length,
    midia,
    faixa: p.slug === SIMBOLICO.slug ? 'simbólico (declarado)' : faixa,
    antes,
    preco,
    mudou,
  });

  if (GRAVAR && mudou) {
    await col.updateOne(
      { _id: p._id },
      {
        $set: { 'pricing.price': preco, precoDefinidoEm: new Date() },
        // Preço é o preço: nada de preço cheio para riscar.
        $unset: { 'pricing.originalPrice': '', 'pricing.discount': '' },
      }
    );
  }
}

linhas.sort((a, b) => b.preco - a.preco || b.chars - a.chars);
console.log('caps  chars  mídia   antes → depois   faixa                        curso');
console.log('─'.repeat(104));
for (const l of linhas) {
  console.log(
    String(l.caps).padStart(4),
    String(Math.round(l.chars / 1000) + 'k').padStart(6),
    String(l.midia).padStart(6),
    `  R$${String(l.antes).padStart(3)} → R$${String(l.preco).padStart(3)}`,
    l.mudou ? '≠' : ' ',
    ' ',
    l.faixa.padEnd(27),
    l.slug
  );
}
console.log('─'.repeat(104));

const conta = (n) => linhas.filter((l) => l.preco === n).length;
console.log(`\nR$ 79: ${conta(79)} curso(s)   R$ 49: ${conta(49)}   R$ 29: ${conta(29)}   R$ 5: ${conta(5)}`);
console.log(`soma dos preços de tabela: R$ ${receitaAntes} → R$ ${receitaDepois}`);
console.log(`cursos alterados: ${mudados}/${cursos.length}`);
console.log(GRAVAR ? '\nGRAVADO.' : '\n(simulação — use --gravar para gravar)');

await cliente.close();
