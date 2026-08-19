/**
 * Aposenta um curso: sai das listas, continua abrindo para quem já tem.
 *
 * ── Por que `aposentado` e não `status: inactive` ─────────────────────────────
 *
 * `getProductBySlug` filtra `status: 'active'`, e `/curso/<slug>` faz
 * `notFound()` sem produto. Desligar pelo status manda para 404 **o aluno que
 * pagou** — foi o que aconteceu em 13/08 com o `isActive` da matrícula, e o
 * livro comprado sumiu. Também joga fora a URL já indexada.
 *
 * `aposentado: true` separa vender de ler: some do catálogo, da busca, dos
 * destaques e dos relacionados (`SEM_APOSENTADOS`), e a página continua
 * resolvendo. Ver `src/lib/products.ts`.
 *
 *   node --env-file=.env.local scripts/cursos/aposentar_curso.mjs <slug> --porque "..."
 *   node --env-file=.env.local scripts/cursos/aposentar_curso.mjs <slug> --porque "..." --gravar
 *   node --env-file=.env.local scripts/cursos/aposentar_curso.mjs <slug> --desfazer --gravar
 */
import { MongoClient } from "mongodb";
import { OPCOES_DE_SCRIPT } from "../lib/mongo.mjs";
import { invalidarCache } from "../lib/invalidar-cache.mjs";

const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? null : process.argv[i + 1]; };
const GRAVAR = process.argv.includes("--gravar");
const DESFAZER = process.argv.includes("--desfazer");
const PORQUE = arg("porque");
const slugs = process.argv.slice(2).filter((a) => !a.startsWith("--") && a !== PORQUE);

if (!slugs.length) throw new Error("uso: aposentar_curso.mjs <slug>… --porque \"...\"");
// Aposentadoria sem motivo escrito é a que ninguém consegue reverter depois,
// porque ninguém lembra se foi conteúdo velho, ferramenta morta ou duplicata.
if (!DESFAZER && !PORQUE) throw new Error("faltou --porque \"motivo\" — o motivo fica gravado no produto");

const client = new MongoClient(process.env.MONGODB_URI, OPCOES_DE_SCRIPT);
await client.connect();
const db = client.db("fayapointProdutos");
const col = db.collection("products");

for (const slug of slugs) {
  const d = await col.findOne({ slug }, { projection: { slug: 1, name: 1, status: 1, aposentado: 1, "pricing.price": 1, "metrics.students": 1 } });
  if (!d) { console.log(`⛔ ${slug}: não existe`); continue; }
  console.log(`\n${slug} · ${d.status} · R$${d.pricing?.price} · alunos=${d.metrics?.students ?? 0} · aposentado=${d.aposentado ?? false}`);
  console.log(`   ${DESFAZER ? "volta para as listas" : "sai das listas, a página continua abrindo"}`);
  if (!GRAVAR) continue;
  await db.collection("products_backup_aposentar_20260819").insertOne({ ...d, arquivadoEm: new Date() });
  await col.updateOne(
    { slug },
    DESFAZER
      ? { $unset: { aposentado: "", aposentadoPorque: "", aposentadoEm: "" }, $set: { updatedAt: new Date() } }
      : { $set: { aposentado: true, aposentadoPorque: PORQUE, aposentadoEm: new Date(), updatedAt: new Date() } },
  );
  await invalidarCache(slug);
  console.log("   ✓ gravado");
}
console.log(GRAVAR ? "" : "\nEnsaio. Nada gravado — use --gravar.");
await client.close();
