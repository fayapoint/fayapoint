/**
 * Auditoria dos cursos — SÓ LEITURA, não escreve nada no banco.
 *
 * Companheiro de HANDOFF_BIBLIOTECA_2026-08-03.md (§3.5 e §6). Responde três
 * perguntas de uma vez:
 *
 *   1. Que modelo desatualizado cada curso ainda cita, e quantas vezes.
 *   2. Qual canon editorial está gravado no produto, e de quando.
 *   3. Que cursos existem no banco e NÃO existem na lista estática de
 *      `src/data/courses/` — os que o portão de matrícula rejeita com 404.
 *
 * Rode de dentro do repo do site, que é onde o `mongodb` está instalado:
 *
 *   cd fayapoint-ai
 *   node --env-file=.env.local ../HANDOFF_BIBLIOTECA_2026-08-03_auditoria.mjs
 *
 * Ao atualizar o canon, atualize também a lista MODELOS_ANTIGOS abaixo — ela é
 * o que separa "citação histórica proposital" de "menção que envelheceu".
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { MongoClient } from "mongodb";

/** O que hoje conta como desatualizado. Revise junto com o canon. */
const MODELOS_ANTIGOS = [
  "GPT-4o", "GPT-4 Turbo", "GPT-4.1", "GPT-4.5", "GPT-4 ",
  "GPT-5 ", "GPT-5.1", "GPT-5.2", "GPT-5.3", "GPT-5.4",
  "Claude 3", "Claude 3.5", "Claude 3.7",
  "Claude Opus 4", "Claude Opus 4.1", "Claude Opus 4.5", "Claude Opus 4.6", "Claude Opus 4.7",
  "Claude Sonnet 4", "Claude Sonnet 4.5",
  "Gemini 1.5", "Gemini 2.0", "Gemini 2.5", "Gemini 3.0",
  "DALL-E 3", "o1-preview", "o3-mini", "Llama 2", "Llama 3",
];

/**
 * O que sobrou de propósito depois da varredura de 03/08/2026.
 *
 * Sem esta lista, a próxima sessão abre a auditoria, vê 18 menções e reabre um
 * trabalho que já foi decidido. Cada linha diz quantas menções ficaram e por
 * quê — se o número subir, é menção nova e o relatório volta a apontar.
 */
const DELIBERADOS = {
  "chatgpt-masterclass": {
    n: 1,
    porque: "linha do tempo: '**GPT-4 (2023):** multimodal…' — trocar isso reescreveria a história",
  },
  "n8n-automacao-avancada": {
    n: 1,
    porque: "fato datado: 'em março de 2023, quando a OpenAI lançou a API do GPT-4'",
  },
  "openclaw-ia-open-source": {
    n: 1,
    porque: "GPT-3.5 e GPT-4 usados como régua de comparação por faixa de RAM — a comparação continua válida",
  },
  "gemini-ia-google": {
    n: 16,
    porque:
      "o mapa da família 2.5 vem com preço colado ($1.25/M, $0.15/M). Trocar só o nome " +
      "grudaria preço velho em modelo novo — trocaria desatualização visível por " +
      "mentira invisível. O capítulo se datou ('Em março de 2026, o Google opera…'). " +
      "Precisa de passagem do laço com pesquisa da linha atual, não de find/replace",
  },
};

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function slugsEstaticos() {
  const dir = path.join(process.cwd(), "src", "data", "courses");
  const arquivos = (await readdir(dir)).filter((f) => f.endsWith(".ts"));
  const achados = new Set();
  for (const f of arquivos) {
    const texto = await readFile(path.join(dir, f), "utf8");
    for (const m of texto.matchAll(/^\s*slug:\s*"([^"]+)"/gm)) achados.add(m[1]);
  }
  return achados;
}

async function main() {
  const estaticos = await slugsEstaticos();

  const cliente = new MongoClient(process.env.MONGODB_URI);
  await cliente.connect();
  const produtos = await cliente
    .db("fayapointProdutos")
    .collection("products")
    .find({}, { projection: { slug: 1, name: 1, thumbnail: 1, courseContent: 1, editorialVerification: 1 } })
    .toArray();
  await cliente.close();

  produtos.sort((a, b) => String(a.slug).localeCompare(String(b.slug)));

  console.log(`\n═══ ${produtos.length} cursos no banco · ${estaticos.size} na lista estática ═══\n`);
  console.log("slug".padEnd(52), "capa-v2", "canon".padEnd(30), "revisto", "modelos antigos");
  console.log("─".repeat(140));

  const agregado = {};
  const foraDaLista = [];

  for (const p of produtos) {
    const capaV2 = typeof p.thumbnail === "string" && p.thumbnail.includes("capa-v2");
    const canon = p.editorialVerification?.canonModels?.join(" / ") || "— (sem canon)";
    const revisto = p.editorialVerification?.verifiedAt || "—";
    if (!estaticos.has(p.slug)) foraDaLista.push(p.slug);

    const texto = String(p.courseContent || "");
    const achados = {};
    for (const m of MODELOS_ANTIGOS) {
      const n = (texto.match(new RegExp(escapar(m), "gi")) || []).length;
      if (n) {
        achados[m.trim()] = n;
        agregado[m.trim()] = (agregado[m.trim()] || 0) + n;
      }
    }
    const total = Object.values(achados).reduce((a, b) => a + b, 0);
    const ok = DELIBERADOS[p.slug];
    const marca = !total ? "—" : ok && total <= ok.n ? `${total} (deliberado)` : `${total} ${JSON.stringify(achados)}`;

    console.log(
      String(p.slug).padEnd(52),
      capaV2 ? "  sim  " : "  NÃO  ",
      canon.padEnd(30),
      String(revisto).slice(0, 10),
      marca
    );
  }

  console.log("\n═══ AGREGADO ═══");
  const ordenado = Object.entries(agregado).sort((a, b) => b[1] - a[1]);
  for (const [k, v] of ordenado) console.log(`  ${String(v).padStart(4)}  ${k}`);
  console.log(`  ${ordenado.reduce((s, [, v]) => s + v, 0)} menções no total`);

  console.log("\n═══ DELIBERADOS — não são pendência ═══");
  for (const [slug, d] of Object.entries(DELIBERADOS)) {
    console.log(`  ${slug} (${d.n})\n    ${d.porque}`);
  }

  console.log("\n═══ NO BANCO, FORA DA LISTA ESTÁTICA ═══");
  console.log("(§3.1 do handoff: estes recebem 404 do POST /api/courses/enroll)");
  for (const s of foraDaLista) console.log(`  ${s}`);
  if (!foraDaLista.length) console.log("  nenhum — a lista estática cobre o banco");
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
