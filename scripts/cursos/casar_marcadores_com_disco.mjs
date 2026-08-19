/**
 * Confere que TODO marcador de mídia aponta para um arquivo que existe — e
 * conserta o que dá para consertar sem inventar nada.
 *
 * ── O buraco que isto fecha ───────────────────────────────────────────────────
 *
 * O marcador e o arquivo são escritos por caminhos diferentes: o marcador vem
 * do texto do capítulo, o arquivo vem do gerador de imagem. Quando os dois
 * discordam, **ninguém reclama**:
 *
 *   - `<img>` quebrada mostra o `alt` — que aqui é a legenda, então a página
 *     parece só "sem figura", e não "com defeito";
 *   - `<video controls preload="none" poster=…>` com `src` em 404 mostra o
 *     pôster e um botão de play que **não faz nada quando o aluno clica**.
 *
 * O segundo caso é o que motivou este script: `automacao-n8n` e
 * `midjourney-masterclass` têm os 180 quadros no disco e **zero** `.webm`, mas
 * 60 marcadores de vídeo cada. Ligar os dois cursos assim entregaria 120
 * players mudos a quem pagou.
 *
 * ── O que ele faz ─────────────────────────────────────────────────────────────
 *
 *   vídeo sem `.webm` no disco, mas com pôster  →  vira `img` do pôster,
 *                                                  guardando o caminho do vídeo
 *                                                  em `data-video` para a volta
 *   `img` com `data-video` cujo `.webm` apareceu →  volta a ser vídeo
 *   marcador cujo arquivo não existe de jeito
 *   nenhum                                       →  **reportado, nunca apagado**
 *
 * A última linha é a regra: apagar marcador some com a legenda junto, e a
 * legenda é um parágrafo que ensina e é indexável. Buraco visível é melhor que
 * texto perdido em silêncio.
 *
 * Mexe no português (`courseContent`) e na tradução (`conteudoTraduzido`), que
 * é onde os defeitos de mídia se escondem melhor.
 *
 *   node scripts/cursos/casar_marcadores_com_disco.mjs                 # confere todos
 *   node scripts/cursos/casar_marcadores_com_disco.mjs <slug>
 *   node scripts/cursos/casar_marcadores_com_disco.mjs <slug> --aplicar
 */
import { MongoClient } from "mongodb";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OPCOES_DE_SCRIPT } from "../lib/mongo.mjs";
import { invalidarCache } from "../lib/invalidar-cache.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PUBLICO = path.resolve(AQUI, "../../public");
const DB = "fayapointProdutos";
const CARIMBO = new Date().toISOString().slice(0, 10).replace(/-/g, "");

const APLICAR = process.argv.includes("--aplicar");
const alvos = process.argv.slice(2).filter((a) => !a.startsWith("--"));

/** `/cursos/media/x/inline/y.webp` → o arquivo em `public/`, se existir. */
const existeNoDisco = (src) => {
  if (!src || !src.startsWith("/")) return false;
  const p = path.resolve(PUBLICO, "." + src.split("?")[0]);
  return p.startsWith(PUBLICO + path.sep) && existsSync(p);
};

const RX = /<!--\s*media:(img|video)\s+((?:(?!-->|<!--)[\s\S])*?)-->/g;
const attr = (b, n) => (b.match(new RegExp(`${n}="([^"]*)"`)) || [, ""])[1];

/** Devolve { texto, paraImagem, paraVideo, orfaos }. */
function casar(texto) {
  const orfaos = [];
  let paraImagem = 0, paraVideo = 0;
  const novo = texto.replace(RX, (inteiro, tipo, corpo) => {
    const src = attr(corpo, "src");
    const poster = attr(corpo, "poster");
    const guardado = attr(corpo, "data-video");

    if (tipo === "video") {
      if (existeNoDisco(src)) return inteiro;
      if (poster && existeNoDisco(poster)) {
        paraImagem++;
        const semPoster = corpo.replace(/\s*poster="[^"]*"/, "").replace(/src="[^"]*"/, `src="${poster}"`).trim();
        return `<!--media:img ${semPoster} data-video="${src}"-->`;
      }
      orfaos.push(`vídeo sem arquivo e sem pôster: ${src}`);
      return inteiro;
    }

    // img que guardou um vídeo: se o vídeo voltou ao disco, volta a ser vídeo.
    if (guardado && existeNoDisco(guardado)) {
      paraVideo++;
      const semGuardado = corpo.replace(/\s*data-video="[^"]*"/, "").replace(/src="[^"]*"/, `src="${guardado}" poster="${src}"`).trim();
      return `<!--media:video ${semGuardado}-->`;
    }
    if (!existeNoDisco(src)) orfaos.push(`imagem sem arquivo: ${src}`);
    return inteiro;
  });
  return { texto: novo, paraImagem, paraVideo, orfaos };
}

const client = new MongoClient(process.env.MONGODB_URI, OPCOES_DE_SCRIPT);
await client.connect();
const db = client.db(DB);
const produtos = db.collection("products");
const traduzidos = db.collection("conteudoTraduzido");

const filtro = alvos.length ? { slug: { $in: alvos } } : { type: "course" };
const docs = await produtos.find(filtro).project({ slug: 1, courseContent: 1 }).toArray();

let mexidos = 0, totalOrfaos = 0;
for (const d of docs) {
  const linhas = [];
  const mudancas = {};

  const pt = casar(d.courseContent || "");
  if (pt.paraImagem || pt.paraVideo) mudancas.courseContent = pt.texto;
  if (pt.paraImagem || pt.paraVideo || pt.orfaos.length)
    linhas.push(`   pt: ${pt.paraImagem} vídeo→img · ${pt.paraVideo} img→vídeo · ${pt.orfaos.length} órfão(s)`);

  const tr = await traduzidos.findOne({ slug: d.slug, locale: "en" }, { projection: { courseContent: 1 } });
  let en = null;
  if (tr?.courseContent) {
    en = casar(tr.courseContent);
    if (en.paraImagem || en.paraVideo || en.orfaos.length)
      linhas.push(`   en: ${en.paraImagem} vídeo→img · ${en.paraVideo} img→vídeo · ${en.orfaos.length} órfão(s)`);
  }

  const orfaos = [...pt.orfaos, ...(en?.orfaos || [])];
  totalOrfaos += orfaos.length;
  if (!linhas.length) continue;

  console.log(`\n${d.slug}`);
  for (const l of linhas) console.log(l);
  for (const o of [...new Set(orfaos)].slice(0, 5)) console.log(`      ⚠️ ${o}`);
  if (orfaos.length > 5) console.log(`      … e mais ${orfaos.length - 5}`);

  if (!APLICAR) continue;
  const precisaPt = !!mudancas.courseContent;
  const precisaEn = en && (en.paraImagem || en.paraVideo);
  if (!precisaPt && !precisaEn) continue;

  if (precisaPt) {
    await db.collection(`products_backup_midia_${CARIMBO}`).insertOne({ slug: d.slug, courseContent: d.courseContent, em: new Date() });
    await produtos.updateOne({ slug: d.slug }, { $set: { courseContent: mudancas.courseContent, contentUpdatedAt: new Date() } });
  }
  if (precisaEn) {
    await db.collection(`conteudoTraduzido_backup_midia_${CARIMBO}`).insertOne({ slug: d.slug, locale: "en", courseContent: tr.courseContent, em: new Date() });
    await traduzidos.updateOne({ slug: d.slug, locale: "en" }, { $set: { courseContent: en.texto } });
  }
  await invalidarCache(d.slug);
  mexidos++;
  console.log(`   ✓ gravado`);
}

console.log(`\n${docs.length} curso(s) lidos · ${mexidos} gravado(s) · ${totalOrfaos} marcador(es) órfão(s)`);
if (!APLICAR) console.log("Ensaio. Nada gravado — use --aplicar.");
await client.close();
