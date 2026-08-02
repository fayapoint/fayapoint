/**
 * Confere se TODA prévia do catálogo tem capítulos — ou seja, se ela responde
 * 200 em vez de 404. Roda contra o banco, sem subir servidor.
 *
 * Nasceu do defeito de 02/08: 15 das 20 prévias declaradas no sitemap
 * respondiam 404 porque o parser exigia `# Capítulo N:` e a maior parte do
 * catálogo não escreve isso. Um teste que roda em 20s evita a repetição.
 *
 *   npx tsx --env-file=.env.local scripts/cursos/conferir_previas.ts
 */
import { MongoClient } from "mongodb";
import { montarPrevia } from "@/lib/curso-previa";

async function main() {

const c = new MongoClient(process.env.MONGODB_URI!);
await c.connect();
const ps = await c
  .db("fayapointProdutos")
  .collection("products")
  .find({}, { projection: { slug: 1, name: 1, courseContent: 1, status: 1 } })
  .toArray();

let zero = 0;
let ok = 0;
for (const p of ps) {
  const doc = p as unknown as { courseContent?: string; slug: string };
  const t = doc.courseContent || "";
  const slug = doc.slug;
  if (!t) continue;
  const r = montarPrevia(t, slug, 1);
  const falhou = r.totalCapitulos === 0 || !r.amostra;
  if (falhou) zero++;
  else ok++;
  console.log(
    slug.padEnd(34),
    "caps:", String(r.totalCapitulos).padStart(3),
    "| mods:", String(r.modulos.length).padStart(2),
    "| html cap1:", String(r.amostra?.html.length || 0).padStart(6),
    falhou ? " <<< 404" : "",
  );
}
console.log(`\ncom prévia: ${ok} | responderiam 404: ${zero}`);
await c.close();
  process.exit(zero > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
