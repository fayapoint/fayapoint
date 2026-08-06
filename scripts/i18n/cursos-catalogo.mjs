/**
 * Traduz a VITRINE dos cursos: nome, resumo, benefícios, módulos, FAQ, SEO.
 *
 * Não toca no corpo das aulas — isso é `cursos-conteudo.mjs`, que é outra ordem
 * de grandeza e roda separado.
 *
 * ── Onde a tradução é gravada ──────────────────────────────────────────────
 *
 * Num subdocumento `i18n.en` do PRÓPRIO produto, no banco `fayapointProdutos`:
 *
 *   { slug: "chatgpt-zero", name: "ChatGPT do Zero", ...,
 *     i18n: { en: { name: "ChatGPT from Scratch", copy: {...}, ... } } }
 *
 * Subdocumento, e não coleção paralela, por um motivo prático: toda leitura de
 * produto no site já traz o documento inteiro. Uma coleção separada obrigaria
 * um segundo `find` em cada uma das dezenas de rotas que leem produto, e a
 * primeira que esquecesse voltaria a servir português.
 *
 * ⚠️ NUNCA sobrescreve os campos originais. `name` continua sendo o português.
 * `paraIdioma()` em `src/lib/products.ts` é quem escolhe na hora de servir.
 *
 * ── O que fica de fora ─────────────────────────────────────────────────────
 *
 *   slug, productId, tool          identificadores
 *   pricing, metrics               números
 *   cta.*.url                      URL
 *   seo.keywords                   busca em português é feita em português;
 *                                  traduzir a palavra-chave muda o alvo
 *   testimonials[].name/company    nome de pessoa e de empresa
 *
 * Uso:
 *   node --env-file=.env.local scripts/i18n/cursos-catalogo.mjs [--so-um slug] [--secar]
 */

import { MongoClient } from "mongodb";
import { traduzirMapa, MODELOS, dinheiro } from "./traduzir.mjs";

const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error("Falta MONGODB_URI.");
  process.exit(1);
}

/** Campos de texto simples no topo do documento. */
const TOPO = ["name", "shortName", "categoryPrimary", "categorySecondary", "level"];

/** Campos de texto dentro de `copy`. */
const COPY_TEXTO = ["headline", "subheadline", "shortDescription", "fullDescription"];
const COPY_LISTA = ["benefits", "impactIndividuals", "impactEntrepreneurs", "impactCompanies"];

/** Achata o produto num mapa {caminho: texto} do que deve ser traduzido. */
function extrair(p) {
  const m = {};
  const por = (k, v) => { if (typeof v === "string" && v.trim()) m[k] = v; };

  for (const c of TOPO) por(c, p[c]);
  (p.targetAudience ?? []).forEach((v, i) => por(`targetAudience.${i}`, v));
  (p.tags ?? []).forEach((v, i) => por(`tags.${i}`, v));
  (p.features ?? []).forEach((v, i) => por(`features.${i}`, v));
  (p.guarantees ?? []).forEach((v, i) => por(`guarantees.${i}`, v));

  for (const c of COPY_TEXTO) por(`copy.${c}`, p.copy?.[c]);
  for (const c of COPY_LISTA) {
    (p.copy?.[c] ?? []).forEach((v, i) => por(`copy.${c}.${i}`, v));
  }

  (p.curriculum?.modules ?? []).forEach((mod, i) => {
    por(`curriculum.modules.${i}.title`, mod.title);
    por(`curriculum.modules.${i}.description`, mod.description);
    por(`curriculum.modules.${i}.duration`, mod.duration);
  });

  (p.bonuses ?? []).forEach((b, i) => {
    por(`bonuses.${i}.title`, b.title);
    por(`bonuses.${i}.description`, b.description);
  });

  // Nome e empresa do depoente ficam; papel e texto vão.
  (p.testimonials ?? []).forEach((t, i) => {
    por(`testimonials.${i}.role`, t.role);
    por(`testimonials.${i}.comment`, t.comment);
    por(`testimonials.${i}.impact`, t.impact);
  });

  (p.faqs ?? []).forEach((f, i) => {
    por(`faqs.${i}.question`, f.question);
    por(`faqs.${i}.answer`, f.answer);
  });

  por("cta.primary.text", p.cta?.primary?.text);
  por("cta.secondary.text", p.cta?.secondary?.text);
  por("cta.whatsapp.message", p.cta?.whatsapp?.message);

  por("seo.metaTitle", p.seo?.metaTitle);
  por("seo.metaDescription", p.seo?.metaDescription);

  por("metrics.duration", p.metrics?.duration);

  return m;
}

/** Remonta {caminho: texto} num objeto aninhado com arrays. */
function remontar(plano) {
  const raiz = {};
  for (const [caminho, valor] of Object.entries(plano)) {
    const partes = caminho.split(".");
    let no = raiz;
    for (let i = 0; i < partes.length - 1; i++) {
      const chave = partes[i];
      const proxima = partes[i + 1];
      const ehIndice = /^\d+$/.test(proxima);
      if (no[chave] === undefined) no[chave] = ehIndice ? [] : {};
      no = no[chave];
    }
    const ultima = partes[partes.length - 1];
    no[/^\d+$/.test(ultima) ? Number(ultima) : ultima] = valor;
  }
  return raiz;
}

async function main() {
  const argv = process.argv.slice(2);
  const soUm = argv.includes("--so-um") ? argv[argv.indexOf("--so-um") + 1] : null;
  const secar = argv.includes("--secar"); // dry run: mostra e não grava

  const cliente = new MongoClient(URI);
  await cliente.connect();
  const col = cliente.db("fayapointProdutos").collection("products");

  const filtro = { type: "course", ...(soUm ? { slug: soUm } : {}) };
  const produtos = await col.find(filtro).toArray();
  console.log(`${produtos.length} curso(s) no banco.\n`);

  let custoTotal = 0;
  let feitos = 0;

  for (const p of produtos) {
    if (p.i18n?.en?.name && !secar) {
      console.log(`· ${p.slug} (já traduzido, pulando)`);
      continue;
    }
    const mapa = extrair(p);
    const chaves = Object.keys(mapa).length;
    const chars = Object.values(mapa).join("").length;
    console.log(`→ ${p.slug} — ${chaves} campos, ${chars} caracteres`);

    if (secar) continue;

    // Vitrine: é a página de venda. Vale o modelo caro.
    let { saida, custo } = await traduzirMapa(mapa, { modelo: MODELOS.vitrine });
    custoTotal += custo;

    /**
     * O ECO: o modelo devolve o português intacto.
     *
     * Acontece quando ele conclui que o texto "já está em inglês" — e
     * "OpenClaw: IA Open Source na Prática" tem palavras inglesas suficientes
     * para enganá-lo. O resultado é pior que um erro: grava com sucesso, o
     * campo existe, e o curso aparece em português no meio do catálogo inglês
     * sem nada acusar.
     *
     * A checagem é por PROPORÇÃO e não por campo isolado: nome de produto que
     * fica igual é o certo ("ChatGPT Masterclass"), mas metade da ficha igual
     * não é tradução nenhuma.
     */
    const iguais = Object.keys(mapa).filter((k) => saida[k] === mapa[k]).length;
    if (iguais > Object.keys(mapa).length * 0.4) {
      console.warn(`   ↻ ${iguais}/${Object.keys(mapa).length} campos voltaram idênticos — repetindo`);
      const r = await traduzirMapa(mapa, { modelo: MODELOS.vitrine, limite: 6000 });
      custoTotal += r.custo;
      // Fica com o que traduziu de verdade em cada rodada.
      saida = Object.fromEntries(
        Object.keys(mapa).map((k) => [
          k,
          r.saida[k] && r.saida[k] !== mapa[k] ? r.saida[k] : saida[k],
        ]),
      );
    }

    feitos++;

    const en = remontar(saida);
    await col.updateOne(
      { _id: p._id },
      { $set: { "i18n.en": { ...en, traduzidoEm: new Date() } } },
    );
    console.log(`   gravado em i18n.en (${dinheiro(custo)})`);
  }

  await cliente.close();
  console.log(`\n${feitos} curso(s) traduzido(s). Custo: ${dinheiro(custoTotal)}`);
}

main().catch((e) => {
  console.error("\nFALHOU:", e.message);
  console.error("Cada curso é gravado ao terminar. Rode de novo para continuar.");
  process.exit(1);
});
