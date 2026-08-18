/**
 * APOSENTAR OS CURSOS REPETIDOS — 16/08/2026.
 *
 * Ricardo: *"drope os cursos que são repetidos e estão na lista fora."*
 *
 * O catálogo tinha, para quatro temas, DOIS cursos: um no padrão do
 * `chatgpt-zero` (30–31 capítulos, 8 seções, mídia) e outro em texto corrido
 * (13–16 capítulos, 0/8 seções). Ver `PADRAO_CHATGPT_ZERO_2026-08-16.md`.
 *
 * ## ⚠️ Por que `aposentado: true` e NÃO `status: 'inactive'`
 *
 * `getProductBySlug` filtra `status: 'active'`, e `/curso/<slug>/page.tsx` faz
 * `notFound()` sem produto. Desativar o `chatgpt-masterclass` levaria junto o
 * livro que o Ricardo pagou (25 créditos, 16 capítulos escritos): o botão "Ler
 * no curso" cairia num 404. É a lição de 13/08 — `enrolledCourses.isActive`
 * escondeu esse MESMO livro. Desligar a vitrine não pode desligar a porta de
 * quem já entrou.
 *
 * `aposentado: true` tira das listas (`SEM_APOSENTADOS` em `lib/products.ts`) e
 * deixa a página resolvendo. É reversível com um `$unset`.
 *
 * ## Rodar
 *
 *     node --env-file=.env.local scripts/aposentar-cursos-repetidos.mjs          # simulação
 *     node --env-file=.env.local scripts/aposentar-cursos-repetidos.mjs --valendo
 *     node --env-file=.env.local scripts/aposentar-cursos-repetidos.mjs --desfazer
 */

import { MongoClient } from "mongodb";
// O teto do pool. Sem ele o driver assume maxPoolSize:100, e o cluster
// grátis inteiro tem 500 — divididas com os outros projetos.
// Ver `scripts/lib/mongo.cjs`.
import { OPCOES_DE_SCRIPT } from "./lib/mongo.mjs";
import { invalidarCache } from "./lib/invalidar-cache.mjs";

/** repetido → o curso no padrão que fica no lugar dele. */
const APOSENTAR = {
  "n8n-automacao-avancada": "automacao-n8n",
  "midjourney-arte-profissional": "midjourney-masterclass",
  "perplexity-pesquisa-inteligente": "perplexity-pesquisa-inteligente-e-conhecimento-instantaneo",
  "chatgpt-masterclass": "chatgpt-zero",
};

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI ausente — rode com `node --env-file=.env.local`.");
  process.exit(1);
}

const valendo = process.argv.includes("--valendo");
const desfazer = process.argv.includes("--desfazer");

const client = new MongoClient(uri, OPCOES_DE_SCRIPT);
await client.connect();
const col = client.db("fayapointProdutos").collection("products");

console.log(desfazer ? "DESFAZENDO a aposentadoria\n" : valendo ? "APLICANDO\n" : "SIMULAÇÃO (use --valendo para aplicar)\n");

for (const [repetido, sucessor] of Object.entries(APOSENTAR)) {
  const doc = await col.findOne({ slug: repetido }, { projection: { slug: 1, name: 1, status: 1, aposentado: 1 } });
  if (!doc) {
    console.log(`⚠️  ${repetido} — não existe no banco, pulando`);
    continue;
  }
  const suc = await col.findOne({ slug: sucessor }, { projection: { slug: 1 } });
  if (!suc) {
    // ⚠️ Sem sucessor não se aposenta nada: sobraria um tema sem nenhum curso
    // no catálogo, que é pior do que ter dois.
    console.log(`⛔ ${repetido} — sucessor "${sucessor}" NÃO existe. Não vou aposentar.`);
    continue;
  }

  const acao = desfazer
    ? { $unset: { aposentado: "", sucessor: "" } }
    : { $set: { aposentado: true, sucessor, aposentadoEm: new Date() } };

  console.log(
    `${desfazer ? "↩" : "→"} ${repetido.padEnd(34)} ${desfazer ? "volta ao catálogo" : `→ ${sucessor}`}` +
      `   (status continua "${doc.status}")`,
  );

  if (valendo || desfazer) {
    const r = await col.updateOne({ slug: repetido }, acao);
    console.log(`   ${r.modifiedCount ? "gravado" : "nada mudou"}`);
  }
}

// O catálogo é cacheado (`products:*`, 10 min): sem invalidar, a lista
// continua servindo os aposentados. O aviso que ficava aqui — "chame
// invalidateProductCache() ou espere o TTL" — virou a chamada de verdade.
if (valendo || desfazer) {
  await invalidarCache();
}

await client.close();
