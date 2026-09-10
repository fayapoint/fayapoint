/**
 * Gera a lista de slugs de curso que o PROXY usa para devolver 404 de verdade.
 *
 * ## Por que isto existe (10/09/2026)
 *
 * `/pt-BR/curso/<qualquer-coisa>` respondia **HTTP 200** servindo a página de
 * 404 — soft 404, e num site cujo problema medido é indexação isso é orçamento
 * de rastreio gasto em URL fantasma que o Google aprende que existe.
 *
 * A causa: com `dynamicParams` ligado, o Next renderiza a resposta do
 * `notFound()` sob demanda, guarda no cache de prerender e passa a servi-la
 * como página válida (`x-nextjs-cache: HIT` + `x-nextjs-prerender: 1`).
 *
 * `dynamicParams = false` resolveu em `/ferramentas`, `/inventando`,
 * `/recursos/guias` e `/blog` — **medido em produção**. Em `/curso` não:
 * `https://fayai.com.br/pt-BR/curso/nao-existe` continuou em 200 depois do
 * deploy, com `Cache-Status: fwd=bypass` e `no-store` (ou seja, renderizado na
 * hora, não servido de cache velho). A diferença é que `/curso/[slug]` é a
 * única das cinco com **subrotas dinâmicas** — `/meu` declara
 * `dynamic = "force-dynamic"` — e com um filho assim o segmento pai continua
 * roteável dinamicamente.
 *
 * Então o corte tem de acontecer ANTES do Next. É o que o proxy faz, e por isso
 * ele precisa desta lista em tempo de edge, onde não há Mongo.
 *
 * ## A regra de segurança que não pode ser removida
 *
 * Se este script falhar, ele grava uma lista **vazia**, e o proxy trata lista
 * vazia como "não sei, deixa passar". Nunca o contrário. Uma lista incompleta
 * chegando ao proxy transformaria curso real em 404 — que é como se desindexa
 * uma página de venda, e é bem pior que o soft 404 que estamos consertando.
 *
 * ⚠️ Sem filtro de status: `draft` e aposentado entram. `getAllProducts` filtra
 * `status: 'active'` por dentro, e foi assim que `/curso/ganhar-dinheiro-com-ia`
 * (que está `draft`) virou 404 numa primeira tentativa hoje.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DESTINO = path.join(AQUI, "..", "src", "gerado", "slugs-curso.json");

async function colher() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("! MONGODB_URI ausente — gravando lista vazia (o proxy deixa passar).");
    return [];
  }

  const cliente = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  try {
    await cliente.connect();
    const docs = await cliente
      .db("fayapointProdutos")
      .collection("products")
      .find({ type: "course" }, { projection: { slug: 1, _id: 0 } })
      .toArray();
    return docs.map((d) => d.slug).filter((s) => typeof s === "string" && s.length > 0);
  } finally {
    await cliente.close().catch(() => {});
  }
}

let slugs = [];
try {
  slugs = await colher();
} catch (erro) {
  console.warn(`! não consegui ler os cursos (${erro.message}) — lista vazia, o proxy deixa passar.`);
  slugs = [];
}

await mkdir(path.dirname(DESTINO), { recursive: true });
await writeFile(DESTINO, JSON.stringify({ geradoEm: new Date().toISOString(), slugs }, null, 2));

console.log(
  slugs.length
    ? `slugs-curso.json: ${slugs.length} cursos (o proxy vai devolver 404 para slug fora desta lista).`
    : "slugs-curso.json: VAZIO — o proxy não vai barrar nada. Confira o MONGODB_URI.",
);
