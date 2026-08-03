/**
 * Tira o `canonModels` gravado nos produtos — §3.5 passo 2 do handoff.
 *
 * ── O que estava acontecendo ───────────────────────────────────────────────
 *
 * Em 03/08/2026 as seis faixas que exibiam o canon editorial foram removidas,
 * e mesmo assim `curl https://fayai.com.br/pt-BR/cursos | grep "Claude Opus 4.6"`
 * devolvia 41 ocorrências. Não é tela: é o payload. O documento do produto
 * carrega `editorialVerification.canonModels`, `getProductBySlug` o serializa
 * para o cliente, e o RSC despeja tudo no HTML. Ninguém *renderiza*, mas o
 * Google *lê* — e o que ele lia era "GPT-5.4 / Claude Opus 4.6" de 19/03.
 *
 * Era o defeito que o Ricardo apontou ("mais uma vez estarmos citando modelos
 * desatualizados") sobrevivendo à própria correção, uma camada abaixo.
 *
 * ── Por que só o canonModels ───────────────────────────────────────────────
 *
 * `normalizeEditorialVerification` completa o que falta com o padrão do código.
 * Tirando `canonModels`, o payload passa a levar o canon atual de
 * `editorial-verification.ts` — uma fonte só, que é o que o passo 2 pede.
 *
 * `verifiedAt` FICA. O padrão do código é 27/04, posterior aos 19/03 gravados:
 * apagar o campo adiantaria a data e afirmaria uma revisão editorial que não
 * aconteceu. Trocar uma citação velha por uma data falsa não é conserto.
 *
 *   node --env-file=.env.local scripts/limpar-canon-dos-produtos.mjs           # ensaio
 *   node --env-file=.env.local scripts/limpar-canon-dos-produtos.mjs --gravar
 */

import { MongoClient } from "mongodb";

const gravar = process.argv.includes("--gravar");

const cliente = new MongoClient(process.env.MONGODB_URI);
await cliente.connect();
const col = cliente.db("fayapointProdutos").collection("products");

const comCanon = await col
  .find(
    { "editorialVerification.canonModels": { $exists: true } },
    { projection: { slug: 1, "editorialVerification.canonModels": 1, "editorialVerification.verifiedAt": 1 } }
  )
  .toArray();

console.log(`${comCanon.length} produtos com canon gravado.\n`);
for (const p of comCanon) {
  console.log(
    `  ${String(p.slug).padEnd(56)} ${(p.editorialVerification?.canonModels || []).join(" / ")}` +
      `  (${p.editorialVerification?.verifiedAt || "sem data"})`
  );
}

if (gravar) {
  const r = await col.updateMany(
    { "editorialVerification.canonModels": { $exists: true } },
    { $unset: { "editorialVerification.canonModels": "" } }
  );
  console.log(`\n✓ canonModels removido de ${r.modifiedCount} produtos. verifiedAt intocado.`);
} else {
  console.log("\nEnsaio. Rode com --gravar para remover o canonModels (o verifiedAt fica).");
}

await cliente.close();
