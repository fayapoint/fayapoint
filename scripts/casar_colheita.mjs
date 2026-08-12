/**
 * Casa a colheita do Higgsfield com a fila da persona — POR PROMPT, não por posição.
 *
 * ## Por que por prompt
 *
 * O casamento por posição na grade quebra: geração que falha não vira célula, e
 * um item a menos desloca todo o resto em uma casa — 200 imagens no campo errado
 * sem nenhum erro na tela. O prompt é a única chave que a geração e a fila
 * compartilham, e ele é único por opção.
 *
 * Entrada:
 *   scripts/colheita_jobs.json  ← [{p: prompt, s: stem, q: status, t: ts}]
 *   scripts/fila_persona.json   ← [{prompt, destino, ...}]
 * Saída:
 *   scripts/mapa_persona.json   ← [{url, destino}] para o baixar_midia.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_37ULog99RS6VlchaVmXKGoThnQH/";
const raiz = new URL("..", import.meta.url).pathname.replace(/^\//, "");

const jobs = JSON.parse(readFileSync(`${raiz}scripts/colheita_jobs.json`, "utf8"));
const fila = JSON.parse(readFileSync(`${raiz}scripts/fila_persona.json`, "utf8"));

// Espaço, aspas curvas e reticências mudam entre o que foi digitado no editor e o
// que a API devolve. Normalizar evita um "não casou" que é só tipografia.
const norm = (s) =>
  String(s || "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const porPrompt = new Map();
for (const j of jobs) {
  if (!j.s || j.q !== "completed") continue;
  const k = norm(j.p);
  // Mais de uma geração com o mesmo prompt: fica a mais nova.
  const ant = porPrompt.get(k);
  if (!ant || j.t > ant.t) porPrompt.set(k, j);
}

const mapa = [];
const semImagem = [];
for (const item of fila) {
  const j = porPrompt.get(norm(item.prompt));
  if (j) mapa.push({ url: `${CDN}${j.s}.png`, destino: item.destino });
  else semImagem.push(item.destino);
}

/**
 * Segunda passada: o que foi submetido nem sempre é byte-a-byte o que está na
 * fila (o prompt foi editado no editor da página em algumas rodadas). Para
 * esses, casa pela PARTE ESPECÍFICA do prompt — o trecho que muda de opção
 * para opção — e só aceita quando o melhor candidato é claramente melhor que o
 * segundo. Empate apertado seria pior do que não casar: imagem certa na opção
 * errada não dá erro nenhum, só mente para quem olha.
 */
const usados = new Set(mapa.map((m) => m.url));
const sobra = [...porPrompt.values()].filter((j) => !usados.has(`${CDN}${j.s}.png`));

// O boilerplate é igual em todos; o que distingue é o miolo. Tira as palavras
// que aparecem em quase todo prompt antes de comparar.
const freq = new Map();
const tokens = (s) => norm(s).split(/[^a-zà-ú0-9]+/).filter((w) => w.length > 3);
for (const j of [...sobra, ...fila.map((f) => ({ p: f.prompt }))])
  for (const w of new Set(tokens(j.p ?? j.prompt))) freq.set(w, (freq.get(w) || 0) + 1);
const comum = new Set([...freq].filter(([, n]) => n > sobra.length * 0.6).map(([w]) => w));
const marcas = (s) => new Set(tokens(s).filter((w) => !comum.has(w)));
const jaccard = (a, b) => {
  let i = 0;
  for (const w of a) if (b.has(w)) i++;
  return i / (a.size + b.size - i || 1);
};

const restantes = fila.filter((f) => semImagem.includes(f.destino));
for (const item of restantes) {
  const A = marcas(item.prompt);
  const notas = sobra
    .map((j) => ({ j, n: jaccard(A, marcas(j.p)) }))
    .sort((x, y) => y.n - x.n);
  const [p1, p2] = notas;
  if (p1 && p1.n >= 0.5 && (!p2 || p1.n - p2.n >= 0.12)) {
    mapa.push({ url: `${CDN}${p1.j.s}.png`, destino: item.destino });
    sobra.splice(sobra.indexOf(p1.j), 1);
    semImagem.splice(semImagem.indexOf(item.destino), 1);
  }
}

writeFileSync(`${raiz}scripts/mapa_persona.json`, JSON.stringify(mapa, null, 2));

console.log(`jobs completos com stem: ${porPrompt.size}`);
console.log(`fila: ${fila.length}`);
console.log(`casados: ${mapa.length}`);
console.log(`sem imagem: ${semImagem.length}`);
if (semImagem.length) console.log(semImagem.slice(0, 12).join("\n"));
