/**
 * Traduz as 56 fichas de `src/data/tools-complete.ts` para inglês.
 *
 * Saída: `src/data/tools-complete.en.json` — um mapa
 * `{ slug: { campo: textoEmIngles } }` lido por `fichaDoIdioma()`.
 *
 * JSON e não `.ts` de propósito: são ~2.200 strings geradas por máquina, e
 * arquivo gerado não deve parecer código escrito à mão. O `.ts` em português
 * continua sendo a fonte e não é tocado.
 *
 * Campos deliberadamente FORA da tradução:
 *   slug, docUrl, vendor      identificadores e URLs
 *   integrations              nomes de produto ("Notion", "Slack")
 *   rating, price             números
 *   relatedCourses[].slug     é a URL do curso
 *   prompts[].content         ⚠️ ver abaixo
 *
 * ⚠️ `prompts[].content` é o texto que o aluno COLA no ChatGPT. Ele É
 * traduzido — quem lê o site em inglês vai colar em inglês —, mas os
 * marcadores `[assim]` são o que a pessoa substitui, e o modelo é instruído a
 * mantê-los. Por isso os prompts vão no lote de VITRINE, não no de volume.
 *
 * Uso:
 *   node --env-file=.env.local scripts/i18n/ferramentas.mjs [--so-um chatgpt]
 */

import { pathToFileURL } from "url";
import { traduzirMapa, MODELOS, gravar, ler, dinheiro } from "./traduzir.mjs";

const DESTINO = "src/data/tools-complete.en.json";

/** Campos de texto simples. */
const CAMPOS_TEXTO = ["title", "category", "description", "detailedDescription"];

/** Campos que são listas de frases. */
const CAMPOS_LISTA = [
  "impactForIndividuals",
  "impactForEntrepreneurs",
  "impactForCompanies",
  "features",
  "gettingStarted",
  "useCases",
  "bestPractices",
  "pitfalls",
];

/**
 * `title` é o nome do produto ("ChatGPT", "Midjourney") em quase toda ficha e
 * NÃO deve ser traduzido — mas em algumas é uma frase. A instrução do motor já
 * cobre "nome de produto fica"; manter o campo no lote permite corrigir as
 * poucas que são frase, sem arriscar as que são nome.
 */
async function main() {
  const argv = process.argv.slice(2);
  const soUm = argv.includes("--so-um") ? argv[argv.indexOf("--so-um") + 1] : null;

  const mod = await import(pathToFileURL("src/data/tools-complete.ts").href);
  const dados = mod.toolsData;
  const slugs = Object.keys(dados).filter((s) => !soUm || s === soUm);

  const pronto = ler(DESTINO);
  let custoTotal = 0;
  let feitos = 0;

  for (const slug of slugs) {
    if (pronto[slug]) {
      console.log(`· ${slug} (já traduzido, pulando)`);
      continue;
    }
    const f = dados[slug];
    process.stdout.write(`→ ${slug} `);

    // Um mapa achatado por ficha: o modelo vê a ferramenta inteira de uma vez e
    // mantém o mesmo vocabulário entre o resumo, os impactos e os casos de uso.
    const mapa = {};
    for (const c of CAMPOS_TEXTO) if (typeof f[c] === "string") mapa[c] = f[c];
    for (const c of CAMPOS_LISTA) {
      if (Array.isArray(f[c])) f[c].forEach((v, i) => { mapa[`${c}.${i}`] = v; });
    }
    (f.prompts ?? []).forEach((p, i) => {
      mapa[`prompts.${i}.title`] = p.title;
      mapa[`prompts.${i}.content`] = p.content;
    });
    (f.relatedCourses ?? []).forEach((c, i) => {
      mapa[`relatedCourses.${i}.title`] = c.title;
      mapa[`relatedCourses.${i}.level`] = c.level;
    });

    const { saida, custo } = await traduzirMapa(mapa, { modelo: MODELOS.vitrine });
    custoTotal += custo;
    feitos++;

    // Remonta a forma original a partir dos caminhos achatados.
    const ficha = {};
    for (const [k, v] of Object.entries(saida)) {
      const partes = k.split(".");
      if (partes.length === 1) { ficha[k] = v; continue; }
      const [campo, idx, sub] = partes;
      ficha[campo] ??= [];
      if (sub) {
        ficha[campo][Number(idx)] ??= {};
        ficha[campo][Number(idx)][sub] = v;
      } else {
        ficha[campo][Number(idx)] = v;
      }
    }

    pronto[slug] = ficha;
    gravar(DESTINO, pronto);           // grava a cada ficha: queda não perde o feito
    console.log(`ok (${dinheiro(custo)})`);
  }

  console.log(`\n${feitos} ficha(s) traduzida(s). Custo: ${dinheiro(custoTotal)}`);
  console.log(`Arquivo: ${DESTINO}`);
}

main().catch((e) => {
  console.error("\nFALHOU:", e.message);
  console.error("O que já foi traduzido está gravado. Rode de novo para continuar.");
  process.exit(1);
});
