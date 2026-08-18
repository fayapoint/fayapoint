/**
 * Separa do dicionário de interface a parte que o NAVEGADOR precisa receber.
 *
 * ## O problema, medido em 18/08/2026
 *
 * `messages/dicionario.en.json` tem 7.712 entradas e 806 KB, e ia INTEIRO dentro
 * das `messages` do next-intl — ou seja, embutido no HTML de **toda página
 * `/en`**, inclusive nas que não usam uma linha dele:
 *
 *     /pt-BR/cursos    553 KB cru ·  88 KB comprimido
 *     /en/cursos     1.342 KB cru · 341 KB comprimido   ← +253 KB por visita
 *
 * ## Por que dá para cortar, e onde está o limite
 *
 * O dicionário serve dois públicos com custos MUITO diferentes:
 *
 * - **Server Components** (`obterT`) leem o arquivo no servidor. Custo de rede
 *   para o visitante: **zero**. São eles que traduzem as páginas de conteúdo
 *   longo — notícia, ferramenta, `/inventando` — que é de onde vem a maior parte
 *   das 7.712 entradas.
 * - **Client Components** (`useT`) leem do `NextIntlClientProvider`, e é isso
 *   que viaja no HTML.
 *
 * Então a fatia certa é: **as entradas que o código de cliente pode alcançar**.
 *
 * ⚠️ E "alcançar" não é "estar escrito no arquivo". Há 935 chamadas
 * `T(variável)` em arquivos de cliente — `T(post.title)`, `T(step.description)`,
 * `T(section.content)` —, e o valor delas costuma vir de uma constante declarada
 * em OUTRO módulo que o componente importa. Recortar só pelos literais do
 * próprio arquivo deixaria essas de fora, e o sintoma seria a tela inglesa
 * voltando a português **em silêncio** — que é a armadilha conhecida deste
 * projeto. Por isso aqui se caminha o GRAFO DE IMPORTAÇÃO a partir de cada
 * arquivo `"use client"`.
 *
 * ⚠️ O que fica de fora e por quê: string que chega ao cliente vinda do BANCO
 * (título de curso, corpo de notícia). Essa nunca esteve no dicionário — ele é
 * gerado varrendo o código-fonte, não o Mongo —, então `T()` já devolvia o
 * original antes desta mudança e continua devolvendo. Não há regressão possível
 * por esse caminho; a tradução de conteúdo de banco é outro mecanismo
 * (`i18n.en` no produto, `conteudoTraduzido` nas aulas).
 *
 * ## Uso
 *
 *     node scripts/i18n/fatiar-dicionario.mjs            # grava a fatia
 *     node scripts/i18n/fatiar-dicionario.mjs --conferir # só relata, não grava
 *
 * Roda no `prebuild`, para a fatia nunca envelhecer em relação ao código.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..", "..");
const SRC = path.join(RAIZ, "src");
const DICIONARIO = path.join(RAIZ, "messages", "dicionario.en.json");
const FATIA = path.join(RAIZ, "messages", "dicionario.cliente.en.json");

const soConferir = process.argv.includes("--conferir");

/** A mesma normalização de `src/i18n/dicionario.ts` — as duas TÊM de concordar. */
function chaveDe(texto) {
  return texto.trim().replace(/\s+/g, " ");
}

const EXTENSOES = [".tsx", ".ts", ".jsx", ".js", ".mjs"];

/** Resolve `@/x`, `./x` e `../x` para um caminho real de arquivo. */
function resolver(deArquivo, especificador) {
  let base;
  if (especificador.startsWith("@/")) base = path.join(SRC, especificador.slice(2));
  else if (especificador.startsWith(".")) base = path.resolve(path.dirname(deArquivo), especificador);
  else return null; // pacote do node_modules: não tem literal nosso

  for (const ext of ["", ...EXTENSOES]) {
    const tentativa = base + ext;
    if (existsSync(tentativa) && !tentativa.endsWith("/")) {
      try {
        if (readFileSync(tentativa) !== undefined) return tentativa;
      } catch {
        /* diretório */
      }
    }
  }
  for (const ext of EXTENSOES) {
    const indice = path.join(base, "index" + ext);
    if (existsSync(indice)) return indice;
  }
  return null;
}

const RE_IMPORT = /(?:^|\n)\s*(?:import|export)[^'"\n]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function importacoesDe(txt) {
  const out = [];
  let m;
  RE_IMPORT.lastIndex = 0;
  while ((m = RE_IMPORT.exec(txt)) !== null) out.push(m[1] || m[2]);
  return out;
}

/**
 * Desfaz o escape de um literal — via `JSON.parse`, e não por um punhado de
 * `replace`.
 *
 * ⚠️ A primeira versão trocava só `\n`, `\"` e `\'`. O codemod que gerou o
 * dicionário quebra frase longa DENTRO do literal com `\r\n` — em
 * `FerramentariaClient.tsx` há literalmente
 * `"...organizadas\r\n          pelo que você quer"`. Sem tratar o `\r`, a chave
 * extraída ficava com uma barra invertida solta, não casava com o dicionário, e
 * a entrada sumia da fatia.
 *
 * O sintoma foi o temido: 17 frases voltaram a português em `/en/ferramentaria`,
 * `/en/api-docs`, `/en/projetos` e `/en/radar`. Foram pegas pela conferência
 * contra a produção, não pelo olho — por isso ela existe.
 */
function desescapar(bruto) {
  try {
    return JSON.parse('"' + bruto.replace(/\\'/g, "'").replace(/(?<!\\)"/g, '\\"') + '"');
  } catch {
    return bruto;
  }
}

/**
 * Literais de string do arquivo.
 *
 * ⚠️ Três passadas independentes (aspas duplas, simples, crase) em vez de uma
 * alternância só. Numa alternância, um apóstrofo no meio de uma frase em
 * português abre uma "string" falsa que engole o resto da linha e some com
 * literais legítimos.
 */
function literais(txt) {
  const out = [];
  for (const re of [/"((?:[^"\\\n]|\\.)*)"/g, /'((?:[^'\\\n]|\\.)*)'/g, /`([^`$\\]*)`/g]) {
    let m;
    while ((m = re.exec(txt)) !== null) {
      if (m[1]) out.push(desescapar(m[1]));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------

const dicionario = JSON.parse(readFileSync(DICIONARIO, "utf8"));
const chavesDoDicionario = new Set(Object.keys(dicionario));

/**
 * A lista de arquivos-fonte.
 *
 * ⚠️ `git ls-files` é só o atalho rápido; a caminhada do disco é a reserva.
 *
 * Isto roda no `prebuild`, ou seja DENTRO do build da Netlify. Se o contêiner
 * não tiver git, ou o deploy vier de um caminho que não é clone (rebuild pelo
 * painel, restauração de cache), o `execSync` lança e derruba o build inteiro —
 * por causa de uma otimização de i18n. Nenhuma economia de bytes vale um deploy
 * que não sai.
 */
function fontes() {
  try {
    const saida = execSync("git ls-files src", { cwd: RAIZ, encoding: "utf8", maxBuffer: 1 << 26 });
    const lista = saida.split("\n").filter((f) => /\.(tsx?|jsx?|mjs)$/.test(f));
    if (lista.length) return lista.map((f) => path.join(RAIZ, f));
  } catch {
    /* sem git: cai na caminhada do disco */
  }
  const out = [];
  const andar = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) andar(p);
      else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) out.push(p);
    }
  };
  andar(SRC);
  return out;
}

const todos = fontes();

const conteudo = new Map();
const ler = (f) => {
  if (!conteudo.has(f)) {
    try {
      conteudo.set(f, readFileSync(f, "utf8"));
    } catch {
      conteudo.set(f, "");
    }
  }
  return conteudo.get(f);
};

const ehCliente = (f) => /^\s*["']use client["']/m.test(ler(f).slice(0, 400));

// Caminha o grafo a partir de todo arquivo "use client".
const alcancaveis = new Set();
const fila = todos.filter(ehCliente);
for (const f of fila) alcancaveis.add(f);

while (fila.length) {
  const atual = fila.pop();
  for (const esp of importacoesDe(ler(atual))) {
    const destino = resolver(atual, esp);
    if (destino && !alcancaveis.has(destino)) {
      alcancaveis.add(destino);
      fila.push(destino);
    }
  }
}

const fatia = {};
for (const f of alcancaveis) {
  for (const bruto of literais(ler(f))) {
    const k = chaveDe(bruto);
    if (chavesDoDicionario.has(k)) fatia[k] = dicionario[k];
  }
}

const bytesDe = (o) => Buffer.byteLength(JSON.stringify(o));
const total = bytesDe(dicionario);
const parcial = bytesDe(fatia);
const clientes = todos.filter(ehCliente).length;

console.log(
  `dicionário : ${Object.keys(dicionario).length} entradas · ${(total / 1024).toFixed(0)} KB\n` +
    `cliente    : ${clientes} arquivos "use client" · ${alcancaveis.size} no grafo de importação\n` +
    `fatia      : ${Object.keys(fatia).length} entradas · ${(parcial / 1024).toFixed(0)} KB ` +
    `(${((parcial / total) * 100).toFixed(0)}% — economia de ${((total - parcial) / 1024).toFixed(0)} KB por página /en)`,
);

if (soConferir) {
  const atual = existsSync(FATIA) ? readFileSync(FATIA, "utf8") : "";
  const novo = JSON.stringify(fatia, null, 0);
  if (atual !== novo) {
    console.error(
      "\n⛔ A fatia no disco está diferente do que o código pede.\n" +
        "   Rode: node scripts/i18n/fatiar-dicionario.mjs",
    );
    process.exitCode = 1;
  } else {
    console.log("\n✅ a fatia no disco está em dia com o código.");
  }
} else {
  writeFileSync(FATIA, JSON.stringify(fatia, null, 0), "utf8");
  console.log(`\ngravado: ${path.relative(RAIZ, FATIA)}`);
}
