#!/usr/bin/env node
/**
 * Traz o motor da Forja para dentro do site.
 *
 * ## Por que existe um sync e não um import
 *
 * O motor mora em `worldforge-fayai/engine/` — que é um repositório à parte, o
 * fork do WorldForge. O site é construído pela Netlify a partir do repositório
 * DELE: qualquer import que saia da raiz do projeto quebra o build lá, mesmo
 * funcionando aqui. E publicar o motor como pacote npm por causa de dez
 * arquivos seria trocar um problema pequeno por um pipeline.
 *
 * Então o motor é VENDIDO para dentro: copiado, e carimbado como cópia. O
 * carimbo é a parte que importa. A armadilha real deste repositório não é ter
 * duas cópias — é ter duas cópias que PARECEM ser a fonte. Já aconteceu: a
 * mesma função existia em dois lugares e foi consertada só num, e o defeito
 * ficou um mês no ar. Aqui, quem abrir a cópia lê na primeira linha que ela é
 * gerada e onde fica o original.
 *
 * ## O portão
 *
 * `--conferir` não escreve nada e sai com 1 se a cópia estiver diferente da
 * fonte. É o que o CI (ou o Ricardo, antes de um deploy) roda para descobrir
 * que alguém editou a cópia.
 *
 * Uso:
 *   node scripts/forja/sincronizar-engine.mjs
 *   node scripts/forja/sincronizar-engine.mjs --conferir
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, statSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ_SITE = resolve(AQUI, "../..");
const FONTE = resolve(RAIZ_SITE, "../worldforge-fayai/engine");
const DESTINO = resolve(RAIZ_SITE, "src/lib/forja/engine");

const conferir = process.argv.includes("--conferir");

/** O que não viaja: o teste bate no ComfyUI e o tsconfig é do fork. */
const IGNORAR = new Set(["_teste", "tsconfig.json"]);

function carimbo(caminhoRelativo) {
  return [
    "/* ⚠️ ARQUIVO GERADO — NÃO EDITE AQUI.",
    ` * Fonte: worldforge-fayai/engine/${caminhoRelativo.replace(/\\/g, "/")}`,
    " * Edite lá e rode: node scripts/forja/sincronizar-engine.mjs",
    " * Conferir se a cópia está em dia: node scripts/forja/sincronizar-engine.mjs --conferir",
    " */",
    "",
  ].join("\n");
}

function listar(dir, base = "") {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    if (IGNORAR.has(nome)) continue;
    const cheio = join(dir, nome);
    const rel = base ? join(base, nome) : nome;
    if (statSync(cheio).isDirectory()) saida.push(...listar(cheio, rel));
    else if (nome.endsWith(".ts")) saida.push(rel);
  }
  return saida;
}

if (!existsSync(FONTE)) {
  console.error(`Não achei o motor em ${FONTE}.`);
  console.error("O fork do WorldForge precisa estar ao lado do site, em ../worldforge-fayai.");
  process.exit(2);
}

const arquivos = listar(FONTE);
let diferentes = 0;
let escritos = 0;

for (const rel of arquivos) {
  const conteudo = carimbo(rel) + readFileSync(join(FONTE, rel), "utf8");
  const alvo = join(DESTINO, rel);
  const atual = existsSync(alvo) ? readFileSync(alvo, "utf8") : null;

  if (atual === conteudo) continue;
  diferentes++;

  if (conferir) {
    console.log(`  ✗ fora de dia: src/lib/forja/engine/${rel.replace(/\\/g, "/")}`);
    continue;
  }

  mkdirSync(dirname(alvo), { recursive: true });
  writeFileSync(alvo, conteudo, "utf8");
  escritos++;
  console.log(`  → ${rel.replace(/\\/g, "/")}`);
}

// arquivos que sumiram da fonte não podem sobreviver na cópia: um módulo morto
// que ainda compila é a forma mais silenciosa de um import continuar apontando
// para código que ninguém mantém
if (existsSync(DESTINO)) {
  const naCopia = listar(DESTINO);
  for (const rel of naCopia) {
    if (arquivos.includes(rel)) continue;
    diferentes++;
    if (conferir) {
      console.log(`  ✗ sobrando na cópia: src/lib/forja/engine/${rel.replace(/\\/g, "/")}`);
    } else {
      rmSync(join(DESTINO, rel));
      console.log(`  ✗ removido (não existe mais na fonte): ${rel.replace(/\\/g, "/")}`);
    }
  }
}

if (conferir) {
  if (diferentes) {
    console.error(`\n${diferentes} arquivo(s) fora de dia. Rode sem --conferir.`);
    process.exit(1);
  }
  console.log(`✓ a cópia está em dia (${arquivos.length} arquivos)`);
} else {
  console.log(`\n✓ ${escritos} escrito(s) de ${arquivos.length}. Fonte: ${relative(RAIZ_SITE, FONTE)}`);
}
