/**
 * Traduz o dossiê de `/casos` — 32 trabalhos e 6 atos — para inglês.
 *
 * Saída: `src/dados/casos.en.json`, no formato
 *   { trabalhos: { <slug>: { campo: texto } }, atos: { <n>: { campo: texto } } }
 * lido por `casosDoIdioma()` em `src/dados/casos-idioma.ts`.
 *
 * ## Por que isto existe
 *
 * Item 12 do laudo de 26/08/2026: `/en/casos` tinha **36 trechos em
 * português** — a página inteira, na prática. O cromo do site é traduzido pelo
 * next-intl; o dossiê nunca foi, porque ele não vem de `messages/`, e sim de um
 * arquivo GERADO a partir de `autoresearch/cases/`.
 *
 * ## O que NÃO é traduzido, e por quê
 *
 *   videos[].titulo   São os títulos REAIS dos 360 vídeos do canal, em
 *                     português. Traduzi-los inventaria vídeos que não existem
 *                     com aquele nome — é registro de acervo, não texto de
 *                     tela.
 *   org               "MultiRio", "Rede Globo", "Jockey Club" são nomes de
 *                     instituição.
 *   cidade            Topônimo.
 *   periodo           "1992 — 1995".
 *   slug, arte, cor   Identificadores, caminhos e cores.
 *   ferramentas       "Avid", "After Effects", "Betacam" — nomes de produto.
 *   hardware          Idem.
 *
 * Ou seja: traduz-se o que Ricardo escreveu SOBRE o trabalho, não o que o
 * trabalho registrou.
 *
 * Uso:
 *   node --env-file=.env.local scripts/i18n/casos.mjs [--so-um <slug>]
 */

import { pathToFileURL } from "url";
import { traduzirMapa, MODELOS, gravar, ler, dinheiro } from "./traduzir.mjs";

const DESTINO = "src/dados/casos.en.json";

/** Campos de texto simples do trabalho. */
const CAMPOS_TRABALHO = ["titulo", "papel", "rotulo", "linha", "resumo", "contexto", "prova"];
/** Campos que são listas de frases. */
const LISTAS_TRABALHO = ["feitos"];
/** Campos de texto simples do ato. */
const CAMPOS_ATO = ["titulo", "linha"];

async function main() {
  const argv = process.argv.slice(2);
  const soUm = argv.includes("--so-um") ? argv[argv.indexOf("--so-um") + 1] : null;

  const mod = await import(pathToFileURL("src/dados/casos.ts").href);
  const { TRABALHOS, ATOS } = mod;

  const pronto = ler(DESTINO, { trabalhos: {}, atos: {} });
  pronto.trabalhos ??= {};
  pronto.atos ??= {};

  let custoTotal = 0;
  let feitos = 0;

  for (const t of TRABALHOS) {
    if (soUm && t.slug !== soUm) continue;
    if (pronto.trabalhos[t.slug]) {
      console.log(`· ${t.slug} (já traduzido, pulando)`);
      continue;
    }
    process.stdout.write(`→ ${t.slug} `);

    // Um mapa achatado por trabalho: o modelo vê a estação inteira de uma vez e
    // mantém o mesmo vocabulário entre o gancho, o resumo e o contexto.
    const mapa = {};
    for (const c of CAMPOS_TRABALHO) if (typeof t[c] === "string" && t[c]) mapa[c] = t[c];
    for (const c of LISTAS_TRABALHO) {
      if (Array.isArray(t[c])) t[c].forEach((v, i) => { mapa[`${c}.${i}`] = v; });
    }
    (t.fotos ?? []).forEach((f, i) => {
      if (f.legenda) mapa[`fotos.${i}.legenda`] = f.legenda;
    });

    const { saida, custo } = await traduzirMapa(mapa, { modelo: MODELOS.vitrine });
    custoTotal += custo;
    feitos++;

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

    pronto.trabalhos[t.slug] = ficha;
    gravar(DESTINO, pronto);
    console.log(`ok (${dinheiro(custo)})`);
  }

  if (!soUm) {
    const faltam = ATOS.filter((a) => !pronto.atos[String(a.ato)]);
    if (faltam.length) {
      process.stdout.write(`→ atos (${faltam.length}) `);
      const mapa = {};
      for (const a of faltam) {
        for (const c of CAMPOS_ATO) if (a[c]) mapa[`${a.ato}.${c}`] = a[c];
      }
      const { saida, custo } = await traduzirMapa(mapa, { modelo: MODELOS.vitrine });
      custoTotal += custo;
      for (const [k, v] of Object.entries(saida)) {
        const [n, campo] = k.split(".");
        pronto.atos[n] ??= {};
        pronto.atos[n][campo] = v;
      }
      gravar(DESTINO, pronto);
      console.log(`ok (${dinheiro(custo)})`);
    } else {
      console.log("· atos (já traduzidos, pulando)");
    }
  }

  console.log(`\n${feitos} trabalho(s) traduzido(s). Custo: ${dinheiro(custoTotal)}`);
  console.log(`Arquivo: ${DESTINO}`);
}

main().catch((e) => {
  console.error("\nFALHOU:", e.message);
  console.error("O que já foi traduzido está gravado. Rode de novo para continuar.");
  process.exit(1);
});
