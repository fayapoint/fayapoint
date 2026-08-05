/**
 * Liga os vídeos que já estão no disco ao código, e só os que estão.
 *
 * Preenche duas coisas a partir do que existe em `public/`:
 *
 *   1. `LOOPS_POR_SLUG` em `src/lib/capa-loop.ts` — os loops de capa novos,
 *      batizados com o slug do curso.
 *   2. o campo `intro` de cada curso em `src/data/curso-midia.ts`.
 *
 * ── Por que ler o disco em vez de confiar numa lista ───────────────────────
 *
 * Um `<video>` apontando para um 404 **não quebra a página**: ele some em
 * silêncio. Foi assim que 19 cursos podiam ficar sem respirar sem ninguém
 * notar, e é por isso que a lista no código precisa ser a verdade do disco, e
 * não uma intenção escrita à mão.
 *
 * O script é idempotente: rodar duas vezes dá o mesmo resultado.
 *
 *   node scripts/ligar-videos.mjs          # mostra o que faria
 *   node scripts/ligar-videos.mjs --gravar
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const gravar = process.argv.includes("--gravar");

/* ── 1. Os loops de capa ──────────────────────────────────────────────────── */

const APELIDOS_JA_MAPEADOS = [
  "automacao-n8n", "autoresearch-singularity", "banana-dev-deploy-ia",
  "chatgpt-zero", "claude-ia-segura", "ia-no-whatsapp",
  "ia-sem-filtro-por-claude", "n8n-automacao-avancada",
];

const capaLoop = "src/lib/capa-loop.ts";
const slugsComLoop = readdirSync("public/cursos/capa-loop")
  .filter((f) => f.endsWith(".webm"))
  .map((f) => f.replace(/\.webm$/, ""))
  // só entra quem tem o pôster também — sem pôster, quem chega com rede lenta
  // vê um retângulo preto onde a página promete movimento.
  .filter((s) => existsSync(`public/cursos/capa-loop/${s}.webp`))
  .filter((s) => !APELIDOS_JA_MAPEADOS.includes(s))
  .sort();

let src = readFileSync(capaLoop, "utf8");
const lista = slugsComLoop.map((s) => `  "${s}",`).join("\n");
const novoBloco = `const LOOPS_POR_SLUG: string[] = [\n${lista}\n];`;
const antes = src;
src = src.replace(/const LOOPS_POR_SLUG: string\[\] = \[[\s\S]*?\];/, novoBloco);
console.log(`capa-loop.ts: ${slugsComLoop.length} loops por slug`);
if (slugsComLoop.length) console.log("  " + slugsComLoop.join("\n  "));
if (gravar && src !== antes) writeFileSync(capaLoop, src);

/* ── 2. As aberturas de curso ─────────────────────────────────────────────── */

const midia = "src/data/curso-midia.ts";
let m = readFileSync(midia, "utf8");
const intros = existsSync("public/cursos/intro")
  ? readdirSync("public/cursos/intro")
      .filter((f) => f.endsWith(".webm"))
      .map((f) => f.replace(/\.webm$/, ""))
      .filter((s) => existsSync(`public/cursos/intro/${s}.webp`))
      .sort()
  : [];

let ligados = 0, jaTinha = 0, semEntrada = [];
for (const slug of intros) {
  const chave = new RegExp(`("${slug}": \\{\\n)(    intro: \\{[^}]*\\},\\n)?`, "");
  if (!chave.test(m)) { semEntrada.push(slug); continue; }
  if (m.includes(`/cursos/intro/${slug}.webm`)) { jaTinha++; continue; }
  m = m.replace(
    chave,
    `$1    intro: { video: "/cursos/intro/${slug}.webm", poster: "/cursos/intro/${slug}.webp" },\n`,
  );
  ligados++;
}
console.log(`\ncurso-midia.ts: ${ligados} aberturas ligadas, ${jaTinha} já estavam`);
if (semEntrada.length) console.log("  ⚠️ vídeo sem curso no mapa:", semEntrada.join(", "));
if (gravar && ligados) writeFileSync(midia, m);

console.log(gravar ? "\nGRAVADO." : "\nEnsaio — use --gravar para aplicar.");
