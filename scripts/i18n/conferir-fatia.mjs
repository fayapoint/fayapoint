/**
 * A prova de que a fatia do cliente nao fez a tela inglesa voltar a portugues.
 *
 * ## Por que existe
 *
 * `fatiar-dicionario.mjs` recorta o dicionario pelo grafo de importacao do
 * codigo de cliente. Se o recorte perder uma entrada, o sintoma NAO e um erro:
 * `traduzir()` devolve o original e a frase aparece em portugues numa pagina
 * inglesa. Ninguem percebe ate um leitor reclamar.
 *
 * Na primeira tentativa isso aconteceu de verdade: o extrator nao desfazia o
 * escape `
` que o codemod grava dentro dos literais, e **17 frases**
 * regrediram em `/en/ferramentaria`, `/en/api-docs`, `/en/projetos` e
 * `/en/radar`. Foi este script que pegou.
 *
 * ## Como funciona
 *
 * Toma as chaves que ficaram FORA da fatia — as unicas que podem ter regredido —
 * e procura cada uma no texto visivel das paginas `/en` recem-construidas. Se
 * achar, confere contra uma referencia que ainda tem o dicionario inteiro: se la
 * a frase aparece em ingles e aqui em portugues, e regressao.
 *
 * ## Uso
 *
 *     npm run build                        # precisa do .next/server/app/en
 *     node scripts/i18n/conferir-fatia.mjs [url-de-referencia]
 *
 * A referencia padrao e a producao. Depois de publicar a fatia, aponte para um
 * permalink de deploy ANTERIOR (`https://<id>--fayai.netlify.app`), senao a
 * referencia ja estara com a fatia e a comparacao nao prova nada.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROD = process.argv[2] || "https://fayai.com.br";
const dic = JSON.parse(readFileSync(path.join(RAIZ, "messages/dicionario.en.json"), "utf8"));
const fatia = JSON.parse(readFileSync(path.join(RAIZ, "messages/dicionario.cliente.en.json"), "utf8"));

/** Só as chaves que a fatia NÃO tem: são as únicas que podem ter regredido. */
const suspeitas = Object.keys(dic).filter((k) => !(k in fatia) && k.length >= 25);
console.log(`chaves fora da fatia com 25+ caracteres: ${suspeitas.length}\n`);

function visivel(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/\s+/g, " ");
}

const dir = path.join(RAIZ, ".next/server/app/en");
const paginas = readdirSync(dir).filter((f) => f.endsWith(".html")).map((f) => f.replace(/\.html$/, ""));
console.log(`páginas /en estáticas construídas: ${paginas.length}\n`);

let achados = 0;
for (const p of paginas) {
  const html = visivel(readFileSync(path.join(dir, p + ".html"), "utf8"));
  const vazando = suspeitas.filter((k) => html.includes(k));
  if (!vazando.length) continue;

  // Confirma contra a produção: se lá também aparece, não é regressão minha.
  const resp = await fetch(`${PROD}/en/${p}`, { headers: { "user-agent": "Mozilla/5.0" } }).catch(() => null);
  const prod = resp && resp.ok ? visivel(await resp.text()) : "";
  const soAqui = vazando.filter((k) => !prod.includes(k));

  if (soAqui.length) {
    achados += soAqui.length;
    console.log(`⛔ /en/${p} — ${soAqui.length} frase(s) em português que a produção mostra em inglês:`);
    for (const k of soAqui.slice(0, 5)) console.log(`     "${k.slice(0, 100)}"`);
  } else if (vazando.length) {
    console.log(`·  /en/${p} — ${vazando.length} em português, mas a produção também (pré-existente)`);
  }
}
console.log(achados ? `\n⛔ ${achados} regressão(ões).` : "\n✅ nenhuma frase regrediu para português.");
