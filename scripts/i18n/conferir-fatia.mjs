/**
 * A prova de que o recorte por rota não fez a tela inglesa voltar a português.
 *
 * ## Por que existe
 *
 * `fatiar-por-rota.mjs` dá a cada rota só o pedaço do dicionário que ela
 * alcança. Se o recorte perder uma entrada, o sintoma NÃO é um erro:
 * `traduzir()` devolve o original e a frase aparece em português numa página
 * inglesa. Ninguém percebe até um leitor reclamar.
 *
 * Na primeira tentativa isso aconteceu de verdade: o extrator não desfazia o
 * escape `\r\n` que o codemod grava dentro dos literais, e **17 frases**
 * regrediram em `/en/ferramentaria`, `/en/api-docs`, `/en/projetos` e
 * `/en/radar`. Foi este script que pegou.
 *
 * ## Como funciona
 *
 * Para CADA página `/en` construída, descobre qual provedor a atende, toma as
 * chaves que ficaram fora daquela fatia — as únicas que podem ter regredido
 * naquela página — e procura cada uma no texto visível do HTML. Se achar,
 * confere contra uma referência: se lá a frase aparece em inglês e aqui em
 * português, é regressão.
 *
 * ⚠️ A conferência é POR ROTA de propósito. Com uma fatia só, bastava comparar
 * contra uma lista; agora `/en/portal` e `/en/sobre` recebem dicionários
 * diferentes, e uma chave que falta em `/portal` pode estar sobrando em
 * `/cursos`. Comparar contra a união esconderia exatamente o erro procurado.
 *
 * ## Uso
 *
 *     npm run build                        # precisa do .next/server/app/en
 *     node scripts/i18n/conferir-fatia.mjs [url-de-referencia]
 *
 * A referência padrão é a produção. Depois de publicar, aponte para um
 * permalink de deploy ANTERIOR (`https://<id>--fayai.netlify.app`), senão a
 * referência já estará com o recorte e a comparação não prova nada.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";

import { RAIZ, dicionario, fatias, mapaDeRotas } from "./fatiar-por-rota.mjs";

const PROD = process.argv[2] || "https://fayai.com.br";
const DIR = path.join(RAIZ, ".next/server/app/en");

if (!existsSync(DIR)) {
  console.error(`⛔ ${path.relative(RAIZ, DIR)} não existe. Rode \`npm run build\` antes.`);
  process.exit(1);
}

const mapa = mapaDeRotas();

/**
 * A rota que gerou este HTML. `en/curso/agentes-de-ia.html` → `/curso/:slug`.
 *
 * Casa segmento a segmento, com o literal ganhando do dinâmico — senão
 * `/cursos/por-setor` cairia em `/cursos/:slug`, que é outra fatia.
 */
function rotaDe(caminho) {
  const partes = caminho.split("/");
  let melhor = null;
  let pontos = -1;
  for (const url of mapa.keys()) {
    const alvo = url === "/" ? [] : url.slice(1).split("/");
    if (alvo.length !== partes.length) continue;
    let p = 0;
    let bate = true;
    for (let i = 0; i < alvo.length; i++) {
      if (alvo[i] === partes[i]) p += 2;
      else if (alvo[i].startsWith(":")) p += 1;
      else {
        bate = false;
        break;
      }
    }
    if (bate && p > pontos) {
      pontos = p;
      melhor = url;
    }
  }
  return melhor;
}

function visivel(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/\s+/g, " ");
}

const paginas = [];
(function andar(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) andar(p);
    else if (e.name.endsWith(".html")) paginas.push(p);
  }
})(DIR);

console.log(`páginas /en estáticas construídas: ${paginas.length}`);

/** chaves fora de cada fatia, com tamanho que dá para procurar no texto */
const foraDe = new Map();
for (const [id, fatia] of fatias) {
  foraDe.set(
    id,
    Object.keys(dicionario).filter((k) => !(k in fatia) && k.length >= 25),
  );
}

let achados = 0;
let semRota = 0;
const porFatia = new Map();

for (const arquivo of paginas) {
  const caminho = path.relative(DIR, arquivo).replace(/\\/g, "/").replace(/\.html$/, "");
  const url = rotaDe(caminho);
  if (!url) {
    semRota++;
    continue;
  }
  const id = mapa.get(url);
  porFatia.set(id, (porFatia.get(id) ?? 0) + 1);

  const html = visivel(readFileSync(arquivo, "utf8"));
  const vazando = foraDe.get(id).filter((k) => html.includes(k));
  if (!vazando.length) continue;

  const resp = await fetch(`${PROD}/en/${caminho}`, {
    headers: { "user-agent": "Mozilla/5.0" },
  }).catch(() => null);
  const prod = resp && resp.ok ? visivel(await resp.text()) : "";
  const soAqui = vazando.filter((k) => !prod.includes(k));

  if (soAqui.length) {
    achados += soAqui.length;
    console.log(`⛔ /en/${caminho} [${id}] — ${soAqui.length} frase(s) que a produção mostra em inglês:`);
    for (const k of soAqui.slice(0, 5)) console.log(`     "${k.slice(0, 100)}"`);
  } else {
    console.log(`·  /en/${caminho} [${id}] — ${vazando.length} em português, mas a produção também (pré-existente)`);
  }
}

console.log(
  `\nfatias exercitadas: ${[...porFatia.entries()].map(([id, n]) => `${id}×${n}`).join(" ")}` +
    (semRota ? `\n⚠️  ${semRota} HTML sem rota casada (não conferidos)` : ""),
);
console.log(achados ? `\n⛔ ${achados} regressão(ões).` : "\n✅ nenhuma frase regrediu para português.");
process.exitCode = achados ? 1 : 0;
