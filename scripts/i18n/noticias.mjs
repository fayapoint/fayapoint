/**
 * Traduz as matérias do Blog IA Hoje (coleção `ainews`).
 *
 * Grava em `i18n.en` dentro da própria matéria: são poucos KB por documento e
 * toda leitura já traz o doc inteiro. (Diferente do corpo dos CURSOS, que tem
 * 250 KB por curso e por isso vive numa coleção à parte.)
 *
 * ⚠️ `tag` fica em português: é a chave do pool de capas (`artForTag` em
 * `src/lib/ai-news.ts`) e do filtro por editoria do hub. Traduzi-la trocaria a
 * capa de toda matéria e quebraria o filtro.
 *
 * ⚠️ `source` também fica: é o nome do veículo ("TechCrunch", "Folha").
 *
 * Uso:
 *   node --env-file=.env.local scripts/i18n/noticias.mjs [--limite 500] [--secar]
 */

import { MongoClient } from "mongodb";
import { traduzirMapa, MODELOS, dinheiro } from "./traduzir.mjs";

const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error("Falta MONGODB_URI.");
  process.exit(1);
}

async function main() {
  const argv = process.argv.slice(2);
  const secar = argv.includes("--secar");
  const limite = argv.includes("--limite") ? Number(argv[argv.indexOf("--limite") + 1]) : 500;
  const paralelo = argv.includes("--paralelo") ? Number(argv[argv.indexOf("--paralelo") + 1]) : 4;

  const cliente = new MongoClient(URI);
  await cliente.connect();

  // ⚠️ As notícias moram em `fayapoint`, NÃO no banco padrão da URI e nem em
  // `fayapointProdutos`. `db()` sem argumento devolveu uma coleção vazia e o
  // script anunciou "0 matérias" com toda a cara de sucesso — são 40.
  const col = cliente.db("fayapoint").collection("ainews");

  const materias = await col
    .find({ "i18n.en.title": { $exists: false } })
    .sort({ publishedAt: -1 })
    .limit(limite)
    .toArray();

  const total = await col.countDocuments({});
  console.log(`${materias.length} matéria(s) sem tradução, de ${total} no total.\n`);

  if (secar) {
    const chars = materias.reduce(
      (a, m) => a + (m.title ?? "").length + (m.summary ?? "").length + (m.body ?? []).join("").length,
      0,
    );
    console.log(`${(chars / 1024).toFixed(0)} KB de texto.`);
    await cliente.close();
    return;
  }

  // Um mapa só para TODAS as matérias: elas são curtas, e o motor agrupa por
  // tamanho. Assim o tradutor vê várias manchetes do mesmo dia de uma vez e
  // mantém o vocabulário coerente entre elas.
  const mapa = {};
  for (const m of materias) {
    const id = String(m._id);
    if (m.title) mapa[`${id}|title`] = m.title;
    if (m.summary) mapa[`${id}|summary`] = m.summary;
    (m.body ?? []).forEach((p, i) => {
      if (p) mapa[`${id}|body|${i}`] = String(p);
    });
  }

  if (!Object.keys(mapa).length) {
    console.log("Nada a traduzir.");
    await cliente.close();
    return;
  }

  const { saida, custo } = await traduzirMapa(mapa, { modelo: MODELOS.vitrine, paralelo });

  let gravadas = 0;
  for (const m of materias) {
    const id = String(m._id);
    const en = {};
    if (saida[`${id}|title`]) en.title = saida[`${id}|title`];
    if (saida[`${id}|summary`]) en.summary = saida[`${id}|summary`];

    const corpo = (m.body ?? []).map((p, i) => saida[`${id}|body|${i}`] ?? String(p));
    // Só grava o corpo se TODOS os parágrafos vieram. Meio traduzido é pior que
    // não traduzido: a matéria alternaria idioma parágrafo a parágrafo.
    const corpoInteiro = (m.body ?? []).every((_, i) => saida[`${id}|body|${i}`]);
    if (corpo.length && corpoInteiro) en.body = corpo;

    if (!en.title) continue;

    await col.updateOne({ _id: m._id }, { $set: { "i18n.en": { ...en, traduzidoEm: new Date() } } });
    gravadas++;
  }

  await cliente.close();
  console.log(`\n${gravadas} matéria(s) traduzida(s). Custo: ${dinheiro(custo)}`);
}

main().catch((e) => {
  console.error("\nFALHOU:", e.message);
  process.exit(1);
});
