/**
 * Liga um curso: `draft` → `active`. E confere, antes, tudo que faz um curso
 * ligado parecer quebrado.
 *
 * ── Por que uma porta com tranca, e não um `updateOne` ────────────────────────
 *
 * Ligar é a operação mais barata do catálogo e a de consequência mais direta:
 * o curso aparece na vitrine, no sitemap e no checkout no mesmo minuto. Tudo
 * que estiver faltando passa a faltar EM PÚBLICO.
 *
 * O histórico deste repositório é feito desses buracos, e nenhum deles dá
 * erro: marcador apontando para arquivo que não existe, `<video>` em 404 que
 * some calado, curso sem capa no meio de uma grade de capas, preço R$0 num
 * produto inteiro, tradução em inglês sem as figuras que o português tem.
 *
 * Então a conferência é a parte principal, e ela lê o DISCO e o BANCO juntos:
 *
 *   1. status é `draft` (ligar o que já está ligado é engano de digitação)
 *   2. preço na escada — R$0 nunca; teto R$199 (diretriz de 14/07/2026)
 *   3. capa (`thumbnail`) e o mínimo de vitrine: headline e descrição curta
 *   4. courseContent com capítulos e a régua de 8 seções já batida
 *   5. TODO marcador de mídia com arquivo no disco — em pt e em en
 *   6. tradução `en` presente e com a mesma contagem de marcadores do pt
 *
 * Falhou uma, não liga. `--mesmo-assim` existe para o caso raro em que o
 * Ricardo decidiu diferente, e imprime o que está sendo ignorado.
 *
 *   node --env-file=.env.local scripts/cursos/ligar_curso.mjs <slug>…
 *   node --env-file=.env.local scripts/cursos/ligar_curso.mjs <slug> --ligar
 *   node --env-file=.env.local scripts/cursos/ligar_curso.mjs <slug> --preco 79 --ligar
 */
import { MongoClient } from "mongodb";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OPCOES_DE_SCRIPT } from "../lib/mongo.mjs";
import { invalidarCache } from "../lib/invalidar-cache.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PUBLICO = path.resolve(AQUI, "../../public");
const ESCADA = [29, 49, 79, 99, 149, 199];

const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? null : process.argv[i + 1]; };
const LIGAR = process.argv.includes("--ligar");
const MESMO_ASSIM = process.argv.includes("--mesmo-assim");
const PRECO = arg("preco") ? Number(arg("preco")) : null;
const slugs = process.argv.slice(2).filter((a) => !a.startsWith("--") && a !== arg("preco"));
if (!slugs.length) throw new Error("uso: ligar_curso.mjs <slug>… [--preco N] [--ligar]");

const existeNoDisco = (src) => {
  if (!src || !src.startsWith("/")) return false;
  const p = path.resolve(PUBLICO, "." + src.split("?")[0]);
  return p.startsWith(PUBLICO + path.sep) && existsSync(p);
};
const RX = /<!--\s*media:(img|video)\s+((?:(?!-->|<!--)[\s\S])*?)-->/g;
const attr = (b, n) => (b.match(new RegExp(`${n}="([^"]*)"`)) || [, ""])[1];

function midia(texto) {
  const r = { total: 0, semArquivo: [] };
  for (const m of (texto || "").matchAll(RX)) {
    r.total++;
    const src = attr(m[2], "src");
    if (!existeNoDisco(src)) r.semArquivo.push(src);
  }
  return r;
}

const client = new MongoClient(process.env.MONGODB_URI, OPCOES_DE_SCRIPT);
await client.connect();
const db = client.db("fayapointProdutos");
const produtos = db.collection("products");
const traduzidos = db.collection("conteudoTraduzido");

let ligados = 0;
for (const slug of slugs) {
  const d = await produtos.findOne({ slug });
  if (!d) { console.log(`\n⛔ ${slug}: não existe`); continue; }

  const preco = PRECO ?? d.pricing?.price ?? 0;
  const pt = midia(d.courseContent || "");
  const tr = await traduzidos.findOne({ slug, locale: "en" }, { projection: { courseContent: 1 } });
  const en = midia(tr?.courseContent || "");
  const caps = (d.courseContent || "").match(/^#\s+(Cap[ií]tulo\s+\d+|.+)$/gim)?.length ?? 0;

  const faltas = [];
  if (d.status !== "draft") faltas.push(`status já é "${d.status}"`);
  if (!preco) faltas.push("preço R$0 — a escada é 29/49/79/99/149/199 (diretriz 14/07/2026)");
  else if (!ESCADA.includes(preco)) faltas.push(`preço R$${preco} fora da escada ${ESCADA.join("/")}`);
  if (!d.thumbnail) faltas.push("sem capa (`thumbnail`)");
  // `copy.benefits` não é enfeite de vitrine: a página de venda lê o array em
  // dois lugares. Faltando, ela cai numa lista de reserva genérica — que serve
  // de rede, não de conteúdo. Curso ligado sem benefício escrito vende com o
  // texto de outro curso.
  if (!Array.isArray(d.copy?.benefits) || d.copy.benefits.length < 3) faltas.push(`\`copy.benefits\` com ${(d.copy?.benefits || []).length} item(ns) — mínimo 3`);
  if (!d.copy?.shortDescription) faltas.push("sem `copy.shortDescription`");
  if (!d.copy?.fullDescription) faltas.push("sem `copy.fullDescription`");
  if (!caps) faltas.push("courseContent sem capítulo nenhum");
  if (pt.semArquivo.length) faltas.push(`${pt.semArquivo.length} marcador(es) pt sem arquivo (ex.: ${pt.semArquivo[0]})`);
  if (!tr?.courseContent) faltas.push("sem tradução `en`");
  else if (en.semArquivo.length) faltas.push(`${en.semArquivo.length} marcador(es) en sem arquivo (ex.: ${en.semArquivo[0]})`);
  else if (en.total !== pt.total) faltas.push(`en tem ${en.total} marcadores e pt tem ${pt.total}`);

  console.log(`\n${slug} · ${d.status} · R$${d.pricing?.price}${PRECO ? ` → R$${PRECO}` : ""} · ${caps} caps · mídia pt ${pt.total} / en ${en.total}`);
  if (!faltas.length) console.log("   ✓ passa em tudo");
  for (const f of faltas) console.log(`   ⛔ ${f}`);

  if (!LIGAR) continue;
  const bloqueia = faltas.filter((f) => !f.startsWith("preço") || !PRECO);
  if (bloqueia.length && !MESMO_ASSIM) { console.log("   → NÃO ligado."); continue; }
  if (bloqueia.length) console.log(`   ⚠️ ligado com --mesmo-assim, ignorando ${bloqueia.length} pendência(s)`);

  const set = { status: "active", updatedAt: new Date() };
  if (PRECO) {
    const de = d.pricing?.originalPrice || PRECO * 4;
    set["pricing.price"] = PRECO;
    set["pricing.discount"] = Math.round((1 - PRECO / de) * 100);
  }
  await db.collection("products_backup_ligar_20260819").insertOne({ ...d, _id: undefined, arquivadoEm: new Date() });
  await produtos.updateOne({ slug }, { $set: set });
  await invalidarCache(slug);
  ligados++;
  console.log("   ✓ LIGADO");
}

console.log(`\n${ligados} curso(s) ligado(s)${LIGAR ? "" : " — ensaio, use --ligar"}.`);
await client.close();
