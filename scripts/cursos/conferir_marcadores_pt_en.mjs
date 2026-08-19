/**
 * Compara o CONJUNTO de marcadores de mídia entre o português e o inglês.
 *
 * ── O buraco que nem o casador nem o consertador enxergam ─────────────────────
 *
 * Já existem duas varreduras de mídia, e as duas passariam batido aqui:
 *
 *   `casar_marcadores_com_disco.mjs`      todo marcador aponta para arquivo que
 *                                         existe? — sim, os presentes apontam.
 *   `consertar_marcadores_traduzidos.mjs` algum marcador saiu deformado pela
 *                                         tradução? — não, os presentes estão
 *                                         perfeitos.
 *
 * O defeito é de CONJUNTO. Medido em `ia-para-estudar [en]`, 19/08/2026, na
 * tradução recém-gerada: o capítulo 11 tinha **seis** marcadores, o número
 * certo — mas o `dica` havia sumido e o `cenario` aparecia **duas vezes**, com
 * legendas diferentes. A mesma figura repetida no lugar de outra, e uma
 * legenda inteira perdida. Contar não pega; comparar id a id pega.
 *
 * O capítulo 28 perdeu dois marcadores sem substituto — esse a contagem pegaria.
 * Os dois vieram da mesma tradução, o que diz o essencial: **toda tradução de
 * curso com mídia precisa passar por aqui antes de ir para o ar.**
 *
 * Não conserta: reinserir marcador apagado exige a legenda EM INGLÊS, e inventar
 * legenda ou copiar a portuguesa são as duas saídas erradas — a primeira mente,
 * a segunda põe português na árvore /en. Aqui se mede; o conserto é decisão de
 * quem escreve.
 *
 *   node --env-file=.env.local scripts/cursos/conferir_marcadores_pt_en.mjs
 *   node --env-file=.env.local scripts/cursos/conferir_marcadores_pt_en.mjs <slug>
 */
import { MongoClient } from "mongodb";
import { OPCOES_DE_SCRIPT } from "../lib/mongo.mjs";

const alvos = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const ids = (t) => [...(t || "").matchAll(/<!--\s*media:(?:img|video)[^>]*?id="([^"]+)"/g)].map((m) => m[1]);

const client = new MongoClient(process.env.MONGODB_URI, OPCOES_DE_SCRIPT);
await client.connect();
const db = client.db("fayapointProdutos");

const filtro = alvos.length ? { slug: { $in: alvos } } : { type: "course" };
const produtos = await db.collection("products").find(filtro).project({ slug: 1, courseContent: 1 }).toArray();

let comProblema = 0;
for (const p of produtos) {
  const tr = await db.collection("conteudoTraduzido").findOne({ slug: p.slug, locale: "en" }, { projection: { courseContent: 1 } });
  const pt = ids(p.courseContent);
  if (!pt.length) continue;
  if (!tr?.courseContent) { console.log(`\n${p.slug}: pt tem ${pt.length} marcador(es) e não há tradução en`); comProblema++; continue; }
  const en = ids(tr.courseContent);

  const conjPt = new Set(pt), conjEn = new Set(en);
  const faltam = pt.filter((i) => !conjEn.has(i));
  const sobram = en.filter((i) => !conjPt.has(i));
  const contagem = {};
  for (const i of en) contagem[i] = (contagem[i] || 0) + 1;
  const duplicados = Object.entries(contagem).filter(([, n]) => n > 1);

  if (!faltam.length && !sobram.length && !duplicados.length) continue;
  comProblema++;
  console.log(`\n${p.slug} — pt ${pt.length} · en ${en.length} (${conjEn.size} únicos)`);
  if (faltam.length) console.log(`   ⛔ ${faltam.length} sem par no en: ${faltam.slice(0, 8).join(", ")}${faltam.length > 8 ? "…" : ""}`);
  if (duplicados.length) console.log(`   ⚠️ repetido no en: ${duplicados.map(([i, n]) => `${i}×${n}`).join(", ")}`);
  if (sobram.length) console.log(`   ⚠️ só no en: ${sobram.slice(0, 8).join(", ")}`);
}

console.log(`\n${produtos.length} curso(s) lidos · ${comProblema} com divergência entre pt e en.`);
await client.close();
