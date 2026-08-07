/**
 * A árvore pt-BR saiu IGUAL? Compara o texto visível de cada página entre este
 * build e a produção.
 *
 * Esta é a checagem que protege a regra do projeto: português é o original,
 * inglês é aditivo, e nenhuma tradução pode regredir o que já está no ar. Como
 * o trabalho desta rodada trocou milhares de trechos de JSX por `{T("...")}`,
 * "não regrediu" não é opinião — tem de ser medido.
 *
 * O que ele NÃO é: um diff byte a byte. Preço, notícia e contagem de aluno
 * mudam sozinhos entre um servidor e outro. Ele compara CONJUNTOS de frases e
 * mostra o que sumiu de um lado e apareceu do outro, que é onde uma tradução
 * mal aplicada apareceria — frase inteira desaparecendo, ou virando inglês.
 *
 * Uso:
 *   node scripts/i18n/comparar-pt.mjs
 *   node scripts/i18n/comparar-pt.mjs --rota /precos
 */

const LOCAL = "http://localhost:3002";
const PRODUCAO = "https://fayai.com.br";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const ROTAS = ["/", "/cursos", "/ferramentas", "/precos", "/sobre", "/faq", "/servicos", "/arcade"];

/** As frases visíveis da página, normalizadas. */
function frases(html) {
  const limpo = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  const saida = new Set();
  for (const m of limpo.matchAll(/>([^<>]{4,})</g)) {
    const t = m[1].replace(/&[a-z]+;|&#\d+;/gi, " ").replace(/\s+/g, " ").trim();
    // fora número puro e data: mudam entre servidores sem ninguém ter mexido
    if (t.length < 4 || /^[\d\s.,:%R$/-]+$/.test(t)) continue;
    saida.add(t);
  }
  return saida;
}

const pegar = async (url) => {
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  return res.ok ? frases(await res.text()) : null;
};

const iRota = process.argv.indexOf("--rota");
const rotas = iRota >= 0 ? [process.argv[iRota + 1]] : ROTAS;

let sumiramTotal = 0;
for (const rota of rotas) {
  const caminho = `/pt-BR${rota === "/" ? "" : rota}`;
  const [aqui, la] = await Promise.all([
    pegar(`${LOCAL}${caminho}`).catch(() => null),
    pegar(`${PRODUCAO}${caminho}`).catch(() => null),
  ]);

  if (!aqui || !la) {
    console.log(`${rota}: não deu para comparar (local=${!!aqui} produção=${!!la})`);
    continue;
  }

  const sumiram = [...la].filter((f) => !aqui.has(f));
  const surgiram = [...aqui].filter((f) => !la.has(f));
  sumiramTotal += sumiram.length;

  console.log(`\n${rota}  —  ${la.size} na produção, ${aqui.size} aqui`);
  console.log(`  sumiram: ${sumiram.length}   surgiram: ${surgiram.length}`);
  for (const f of sumiram.slice(0, 8)) console.log(`    − ${f.slice(0, 100)}`);
  for (const f of surgiram.slice(0, 4)) console.log(`    + ${f.slice(0, 100)}`);
}

console.log(`\n${sumiramTotal} frase(s) que a produção tem e este build não.`);
