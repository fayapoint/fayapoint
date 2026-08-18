/**
 * Recorta o dicionário de interface POR ROTA.
 *
 * ## O caminho até aqui
 *
 * `messages/dicionario.en.json` tem 7.712 entradas e 806 KB, e ia INTEIRO
 * dentro das `messages` do next-intl — embutido no HTML de toda página `/en`.
 *
 * O primeiro corte (18/08/2026) mandou só o que QUALQUER componente de cliente
 * do projeto alcança: 580 KB. Ajudou, mas continuava sendo a mesma conta para
 * todo mundo — `/en/sobre`, que usa 28 entradas, pagava o mesmo que
 * `/en/portal`. Medido por rota (cadeia de layouts + a página):
 *
 *     (site)/layout ..........   2 KB     ← o que TODA página paga
 *     /sobre, /faq, /blog ....   2 KB
 *     /ferramentas ........... 120 KB
 *     /cursos ................ 129 KB
 *     / (home) ............... 137 KB
 *     /curso/[slug] .......... 141 KB
 *     /portal ................ 257 KB
 *
 * A união das rotas dá 566 KB. A fatia global não estava errada — estava sendo
 * cobrada da rota errada.
 *
 * ## Como o provedor de cada rota é descoberto
 *
 * **Pela própria fonte, e não por uma lista aqui dentro.** Um arquivo de rota
 * declara o seu provedor importando o JSON:
 *
 *     import fatia from "../../../messages/rotas/cursos.json";
 *
 * Este script varre `src/app`, acha esses imports e grava exatamente os
 * arquivos que a fonte pede. Lista em dois lugares envelhece; aqui não há
 * segundo lugar.
 *
 * Alcance de cada provedor:
 *
 *  - em `layout.tsx` → cobre a pasta inteira, menos o que estiver debaixo de um
 *    provedor mais fundo;
 *  - em `page.tsx` (ou `error`, `not-found`…) → cobre só aquele arquivo.
 *
 * Tudo que sobra cai em `messages/rotas/_raiz.json`, que o layout raiz entrega
 * (`src/i18n/fatia-do-cliente.ts`).
 *
 * ## ⚠️ Por que rota nova não pode quebrar
 *
 * O sintoma de uma chave que falta NÃO é erro: `traduzir()` devolve o original
 * e a frase aparece em português numa página inglesa, calada. Já aconteceu —
 * 17 frases em `/en/ferramentaria`, `/en/api-docs`, `/en/projetos` e
 * `/en/radar`, na primeira versão do recorte.
 *
 * Por isso o desenho aqui é o inverso do óbvio: quem não tem provedor **não
 * fica sem dicionário**, cai na fatia raiz. Rota nova pesada não regride a
 * tradução; ela engorda a raiz, e aí o teto abaixo falha o build com o nome da
 * rota. Erro barulhento em vez de tela em português.
 *
 * ## Uso
 *
 *     node scripts/i18n/fatiar-por-rota.mjs             # grava
 *     node scripts/i18n/fatiar-por-rota.mjs --conferir  # só confere
 *
 * Roda no `prebuild`, para as fatias nunca envelhecerem quanto ao código.
 * `conferir-fatia.mjs` importa daqui, para conferir o HTML construído contra a
 * fatia que cada rota recebeu de verdade.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const RAIZ = path.resolve(AQUI, "..", "..");
const SRC = path.join(RAIZ, "src");
const APP = path.join(SRC, "app");
const DICIONARIO = path.join(RAIZ, "messages", "dicionario.en.json");
const PASTA = path.join(RAIZ, "messages", "rotas");
export const RAIZ_ID = "_raiz";

/**
 * Teto da fatia raiz — a única que TODA página paga.
 *
 * Hoje ela é o layout `(site)` (28 entradas) mais o punhado de rotas pequenas
 * sem provedor: 8,8 KB. Se uma rota nova e pesada entrar sem provedor, é aqui
 * que o build para, dizendo qual é.
 */
const TETO_RAIZ_KB = 12;

/** A mesma normalização de `src/i18n/dicionario.ts` — as duas TÊM de concordar. */
const chaveDe = (texto) => texto.trim().replace(/\s+/g, " ");

const EXTENSOES = [".tsx", ".ts", ".jsx", ".js", ".mjs"];

const conteudo = new Map();
function ler(f) {
  if (!conteudo.has(f)) {
    try {
      conteudo.set(f, statSync(f).isFile() ? readFileSync(f, "utf8") : "");
    } catch {
      conteudo.set(f, "");
    }
  }
  return conteudo.get(f);
}

/** Resolve `@/x`, `./x` e `../x` para um caminho real de arquivo. */
function resolver(deArquivo, especificador) {
  let base;
  if (especificador.startsWith("@/")) base = path.join(SRC, especificador.slice(2));
  else if (especificador.startsWith(".")) base = path.resolve(path.dirname(deArquivo), especificador);
  else return null; // pacote do node_modules: não tem literal nosso

  for (const ext of EXTENSOES) {
    const tentativa = base + ext;
    if (existsSync(tentativa)) return tentativa;
  }
  try {
    if (existsSync(base) && statSync(base).isFile()) return base;
  } catch {
    /* ignora */
  }
  for (const ext of EXTENSOES) {
    const indice = path.join(base, "index" + ext);
    if (existsSync(indice)) return indice;
  }
  return null;
}

const RE_IMPORT =
  /(?:^|\n)\s*(?:import|export)[^'"\n]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

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
 * `"...organizadas\r\n          pelo que você quer"`. Sem tratar o `\r`, a
 * chave saía com uma barra invertida solta, não casava com o dicionário, e a
 * entrada sumia da fatia. Foram 17 frases de volta ao português.
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
 * português abre uma "string" falsa que engole o resto da linha.
 */
function literais(txt) {
  const out = [];
  for (const re of [/"((?:[^"\\\n]|\\.)*)"/g, /'((?:[^'\\\n]|\\.)*)'/g, /`([^`$\\]*)`/g]) {
    let m;
    while ((m = re.exec(txt)) !== null) if (m[1]) out.push(desescapar(m[1]));
  }
  return out;
}

const ehCliente = (f) => /^\s*["']use client["']/m.test(ler(f).slice(0, 400));

export const dicionario = JSON.parse(readFileSync(DICIONARIO, "utf8"));
const chavesDoDicionario = new Set(Object.keys(dicionario));

/**
 * As chaves de dicionário que estes arquivos de entrada podem levar ao NAVEGADOR.
 *
 * Caminha o grafo de importação marcando quando cruza uma fronteira
 * `"use client"`. Antes da fronteira o módulo é servidor: o que ele traduz sai
 * pronto no HTML e não custa um byte de dicionário ao visitante. Depois dela,
 * tudo — inclusive o que o componente de cliente importa — pode ser lido em
 * tempo de execução no navegador.
 *
 * ⚠️ Recolhe do GRAFO, e não dos literais do próprio arquivo. Há 935 chamadas
 * `T(variável)` em componentes de cliente (`T(post.title)`,
 * `T(step.description)`) cujo valor vem de constante declarada em outro módulo.
 * Recortar pelo arquivo deixaria essas de fora — em silêncio.
 */
export function chavesDe(entradas) {
  const out = new Set();
  const visto = new Set();
  const fila = entradas.map((f) => [f, false]);
  while (fila.length) {
    const [f, clientePai] = fila.pop();
    const cliente = clientePai || ehCliente(f);
    const marca = f + "|" + cliente;
    if (visto.has(marca)) continue;
    visto.add(marca);
    const txt = ler(f);
    if (cliente)
      for (const bruto of literais(txt)) {
        const k = chaveDe(bruto);
        if (chavesDoDicionario.has(k)) out.add(k);
      }
    for (const esp of importacoesDe(txt)) {
      const destino = resolver(f, esp);
      if (destino) fila.push([destino, cliente]);
    }
  }
  return out;
}

// --- os arquivos de rota ---------------------------------------------------

const ESPECIAL =
  /^(page|layout|template|error|not-found|loading|default|global-error)\.(tsx|ts|jsx|js)$/;

const arquivos = [];
(function andar(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) andar(p);
    else if (ESPECIAL.test(e.name)) arquivos.push(p);
  }
})(APP);
arquivos.sort();

const layouts = arquivos.filter((f) => /[\\/]layout\.(tsx|ts|jsx|js)$/.test(f));
export const rel = (f) => path.relative(APP, f).replace(/\\/g, "/");
const cadeiaDe = (f) => layouts.filter((l) => f.startsWith(path.dirname(l) + path.sep));

// --- quem declara provedor -------------------------------------------------

const RE_FATIA = /["'][^"']*messages\/rotas\/([A-Za-z0-9._-]+)\.json["']/;

/** id -> { arquivo, dir, ehLayout } */
const provedores = new Map();
for (const f of arquivos) {
  const m = ler(f).match(RE_FATIA);
  if (!m) continue;
  const id = m[1];
  if (id === RAIZ_ID) {
    console.error(
      `⛔ ${rel(f)} importa a fatia raiz. A raiz é entregue pelo layout raiz, via src/i18n/fatia-do-cliente.ts.`,
    );
    process.exit(1);
  }
  if (provedores.has(id)) {
    console.error(
      `⛔ dois arquivos pedem a mesma fatia "${id}": ${rel(provedores.get(id).arquivo)} e ${rel(f)}`,
    );
    process.exit(1);
  }
  provedores.set(id, {
    arquivo: f,
    dir: path.dirname(f),
    ehLayout: /[\\/]layout\.(tsx|ts|jsx|js)$/.test(f),
  });
}

const arquivosDeProvedorPagina = new Map(
  [...provedores.entries()].filter(([, p]) => !p.ehLayout).map(([id, p]) => [p.arquivo, id]),
);

/**
 * O provedor que atende um arquivo de rota: o mais FUNDO que o cobre.
 * `_raiz` quando ninguém o cobre.
 */
export function provedorDe(f) {
  const proprio = arquivosDeProvedorPagina.get(f);
  if (proprio) return proprio;
  let melhor = RAIZ_ID;
  let profundidade = -1;
  for (const [id, p] of provedores) {
    if (!p.ehLayout) continue;
    if (f === p.arquivo || f.startsWith(p.dir + path.sep)) {
      const d = p.dir.split(path.sep).length;
      if (d > profundidade) {
        profundidade = d;
        melhor = id;
      }
    }
  }
  return melhor;
}

// --- as fatias -------------------------------------------------------------

const escopo = new Map([[RAIZ_ID, []]]);
for (const id of provedores.keys()) escopo.set(id, []);
for (const f of arquivos) escopo.get(provedorDe(f)).push(f);

/** id -> objeto de tradução */
export const fatias = new Map();
for (const [id, cobertos] of escopo) {
  const p = provedores.get(id);
  const entradas = new Set(cobertos);
  // o próprio arquivo do provedor e a cadeia de layouts acima dele: o que eles
  // renderizam por conta própria também vive dentro deste provedor.
  if (p) {
    entradas.add(p.arquivo);
    for (const l of cadeiaDe(p.arquivo)) entradas.add(l);
  }
  for (const f of cobertos) for (const l of cadeiaDe(f)) entradas.add(l);
  const chaves = chavesDe([...entradas]);
  const obj = {};
  for (const k of [...chaves].sort()) obj[k] = dicionario[k];
  fatias.set(id, obj);
}

/**
 * A URL pública de um `page.tsx`, com `:x` no lugar de segmento dinâmico.
 * `[locale]/(site)/curso/[slug]/page.tsx` → `/curso/:slug`
 *
 * Serve à conferência, que precisa casar um HTML construído com a rota que o
 * gerou — e portanto com a fatia que ela recebeu.
 */
export function urlDaPagina(arquivo) {
  const partes = rel(arquivo).split("/").slice(0, -1);
  const url = partes
    .filter((s) => s !== "[locale]" && !(s.startsWith("(") && s.endsWith(")")))
    .map((s) => (s.startsWith("[") ? ":" + s.replace(/[[\].]/g, "").replace(/^\.\.\./, "") : s));
  return "/" + url.join("/");
}

/** URL pública → id da fatia, para todo `page.tsx`. */
export function mapaDeRotas() {
  const mapa = new Map();
  for (const f of arquivos) {
    if (!/[\\/]page\.(tsx|ts|jsx|js)$/.test(f)) continue;
    mapa.set(urlDaPagina(f), provedorDe(f));
  }
  return mapa;
}

// --- linha de comando ------------------------------------------------------

const kb = (o) => Buffer.byteLength(JSON.stringify(o)) / 1024;

function principal() {
  const soConferir = process.argv.includes("--conferir");

  const linhas = [...fatias.entries()]
    .map(([id, o]) => ({
      id,
      entradas: Object.keys(o).length,
      kb: kb(o),
      rotas: escopo.get(id).length,
      onde: provedores.has(id)
        ? rel(provedores.get(id).arquivo)
        : "src/app/[locale]/layout.tsx (fatia raiz)",
    }))
    .sort((a, b) => b.kb - a.kb);

  console.log(
    `dicionário : ${Object.keys(dicionario).length} entradas · ${kb(dicionario).toFixed(0)} KB (fica no servidor)\n` +
      `provedores : ${provedores.size} + a raiz · ${arquivos.length} arquivos de rota\n`,
  );
  for (const l of linhas) {
    console.log(
      `${l.kb.toFixed(0).padStart(5)} KB ${String(l.entradas).padStart(5)} entradas ${String(l.rotas).padStart(3)} rota(s)  ${l.id.padEnd(20)} ${l.onde}`,
    );
  }

  const raiz = fatias.get(RAIZ_ID);
  console.log(`\nfatia raiz : ${kb(raiz).toFixed(1)} KB — é o que TODA página /en paga (era 580 KB).`);

  if (kb(raiz) > TETO_RAIZ_KB) {
    const pesadas = escopo
      .get(RAIZ_ID)
      .map((f) => ({
        f,
        kb: kb(Object.fromEntries([...chavesDe([f, ...cadeiaDe(f)])].map((k) => [k, dicionario[k]]))),
      }))
      .sort((a, b) => b.kb - a.kb)
      .slice(0, 10);
    console.error(
      `\n⛔ a fatia raiz passou do teto de ${TETO_RAIZ_KB} KB. Ela vai no HTML de TODA página /en.\n` +
        `   Dê provedor próprio às rotas pesadas abaixo (ver src/i18n/rota.tsx):\n` +
        pesadas.map((x) => `     ${x.kb.toFixed(0).padStart(4)} KB  ${rel(x.f)}`).join("\n"),
    );
    process.exit(1);
  }

  if (!existsSync(PASTA)) mkdirSync(PASTA, { recursive: true });

  let divergiu = 0;
  for (const [id, obj] of fatias) {
    const arquivo = path.join(PASTA, id + ".json");
    const novo = JSON.stringify(obj, null, 0);
    const atual = existsSync(arquivo) ? readFileSync(arquivo, "utf8") : null;
    if (atual === novo) continue;
    if (soConferir) {
      divergiu++;
      console.error(`   ${atual === null ? "falta" : "difere"}: messages/rotas/${id}.json`);
    } else {
      writeFileSync(arquivo, novo, "utf8");
    }
  }

  // fatia órfã: JSON que nenhum arquivo de rota pede mais
  for (const nome of existsSync(PASTA) ? readdirSync(PASTA) : []) {
    if (!nome.endsWith(".json")) continue;
    if (fatias.has(nome.replace(/\.json$/, ""))) continue;
    console.log(`·  messages/rotas/${nome} não é pedido por rota nenhuma — pode apagar.`);
  }

  if (soConferir) {
    if (divergiu) {
      console.error(`\n⛔ ${divergiu} fatia(s) fora de dia. Rode: node scripts/i18n/fatiar-por-rota.mjs`);
      process.exitCode = 1;
    } else {
      console.log("\n✅ as fatias no disco estão em dia com o código.");
    }
  } else {
    console.log(`\ngravado: messages/rotas/ (${fatias.size} arquivos)`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) principal();
