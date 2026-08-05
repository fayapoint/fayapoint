/**
 * Baixa os vídeos gerados no Higgsfield e os deixa prontos para o site.
 *
 * Entrada: um TSV `nome<TAB>carimbo_id`, o mesmo formato de `baixar-cenas.mjs`.
 * O nome decide o destino:
 *
 *   `intro-<slug>`      → `public/cursos/intro/<slug>.webm` + `.webp`
 *   `inventando-hero`   → `public/inventando/hero-loop.webm` + `.webp`
 *   `atelie-home`       → `public/home/atelie-loop.webm` (o pôster já existe)
 *   qualquer outro nome → `public/cursos/capa-loop/<nome>.webm` + `.webp`
 *
 * ── As duas receitas de conversão, e por que são diferentes ────────────────
 *
 * O **loop de capa** é quadrado e vive dentro de um card de 306px: 960px de
 * largura é folga de sobra e o alvo de peso é ~400 KB, porque a vitrine carrega
 * vários ao mesmo tempo.
 *
 * O **vídeo de abertura** é 16:9 e ocupa a largura de uma coluna de 1024px numa
 * página que a pessoa já decidiu abrir. Ele pode ser maior — mas continua mudo
 * e continua com pôster, porque um retângulo preto no lugar onde a página
 * promete movimento é pior do que não ter vídeo.
 *
 * ⚠️ `-an` em todos: são peças decorativas. Áudio aqui só serviria para
 * assustar quem abre a página com o som ligado.
 */

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";

const [, , tsv] = process.argv;
if (!tsv) {
  console.error("uso: node scripts/baixar-videos.mjs <mapa.tsv>");
  process.exit(1);
}

const BASE =
  "https://d8j0ntlcm91z4.cloudfront.net/user_37ULog99RS6VlchaVmXKGoThnQH/hf_";

/** Onde cada nome vai parar, e com que receita. */
function destino(nome) {
  if (nome.startsWith("intro-")) {
    return { caminho: `public/cursos/intro/${nome.slice(6)}`, largura: 1024, crf: 36, poster: true };
  }
  if (nome === "inventando-hero") {
    return { caminho: "public/inventando/hero-loop", largura: 1280, crf: 38, poster: true };
  }
  if (nome === "atelie-home") {
    return { caminho: "public/home/atelie-loop", largura: 1024, crf: 36, poster: false };
  }
  return { caminho: `public/cursos/capa-loop/${nome}`, largura: 960, crf: 34, poster: true };
}

const linhas = readFileSync(tsv, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => l.split("\t"));

let ok = 0;
const falhas = [];

for (const [nome, carimbo] of linhas) {
  const d = destino(nome);
  const tmp = `scripts/_tmp-video-${nome}.mp4`;
  try {
    const r = await fetch(`${BASE}${carimbo}.mp4`);
    if (!r.ok) throw new Error("HTTP " + r.status);
    writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
    mkdirSync(dirname(d.caminho), { recursive: true });

    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-i", tmp,
      "-an", "-vf", `scale=${d.largura}:-2,fps=24`,
      "-c:v", "libvpx-vp9", "-crf", String(d.crf), "-b:v", "0", "-row-mt", "1",
      `${d.caminho}.webm`,
    ]);

    if (d.poster) {
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-i", tmp,
        "-vframes", "1", "-vf", `scale=${d.largura}:-2`,
        "-quality", "82", `${d.caminho}.webp`,
      ]);
    }

    const kb = (n) => {
      try { return Math.round(readFileSync(n).length / 1024); } catch { return "?"; }
    };
    console.log(`${nome.padEnd(34)} ${kb(d.caminho + ".webm")} KB webm${d.poster ? `  ${kb(d.caminho + ".webp")} KB pôster` : ""}`);
    ok++;
  } catch (e) {
    console.error("FALHOU", nome, e.message);
    falhas.push(nome);
  } finally {
    try { unlinkSync(tmp); } catch { /* já foi */ }
  }
}

console.log(`\n${ok}/${linhas.length} vídeos prontos`);
if (falhas.length) {
  console.log("faltaram:", falhas.join(", "));
  process.exitCode = 1;
}
