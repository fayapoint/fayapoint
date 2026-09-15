#!/usr/bin/env node
/**
 * VÍDEO → QUADROS para a `SequenciaDeRolagem` da página /fabrica.
 *
 *   node scripts/fabrica-quadros.mjs --video estudio.mp4 --nome abertura --quadros 144
 *   node scripts/fabrica-quadros.mjs --video logo.mp4 --nome final --quadros 120 --reverso
 *
 * Gera `public/fabrica/<nome>/NNN.webp` (largo) e `public/fabrica/<nome>-movel/NNN.webp`
 * (recorte vertical do centro), mais `manifesto.json` com contagem e peso.
 *
 * Os números vêm do estudo da técnica, não de gosto:
 *   - 1600 px de largura no desktop: acima disso o peso cresce e ninguém vê;
 *   - WebP 78: AVIF comprime melhor mas decodifica mais devagar, e decodificar
 *     rápido é o que importa no meio da rolagem;
 *   - o celular recebe um conjunto próprio, recortado e menor — é o maior ganho
 *     de desempenho disponível, maior que qualquer ajuste de codec;
 *   - quadros com a mesma dimensão e numeração com zeros, sempre.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const arg = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i === -1 ? padrao : args[i + 1];
};
const tem = (nome) => args.includes(`--${nome}`);

// `--video` aceita um .mp4 OU a pasta de PNGs numerados que o `fabrica-upscale.mjs` deixa.
const video = arg("video");
const nome = arg("nome");
const quadros = Number(arg("quadros", "144"));
// ⚠️ Medido em 15/09/2026 com o take do Kling: 1600 px a qualidade 78 deu 74 KB por
// quadro (10,9 MB por sequência). O estudo pede ~30 KB. 1440 px a 70 é o ponto em que o
// peso cai sem o olho perceber num quadro que fica atrás de um degradê escuro.
const largura = Number(arg("largura", "1440"));
const larguraMovel = Number(arg("largura-movel", "720"));
// Proporção do recorte do celular (largura/altura) tirado do centro do quadro.
const proporcaoMovel = Number(arg("proporcao-movel", String(9 / 14)));
const qualidade = Number(arg("qualidade", "70"));

if (!video || !nome || !existsSync(video)) {
  console.error("uso: --video <arquivo> --nome <pasta> [--quadros 144] [--reverso]");
  process.exit(1);
}

const raiz = path.resolve(import.meta.dirname, "..", "public", "fabrica");
const ehPasta = statSync(video).isDirectory();
const reverso = tem("reverso") ? ",reverse" : "";

// Pasta de PNGs: cada arquivo já é um quadro da página, e a contagem tem de bater.
// Vídeo: um fps que produz exatamente `quadros` imagens ao longo do vídeo inteiro.
let entrada;
let duracao;
if (ehPasta) {
  const pngs = readdirSync(video).filter((f) => /^\d{3}\.png$/.test(f));
  if (pngs.length !== quadros) {
    console.error(`⛔ a pasta tem ${pngs.length} quadros e foram pedidos ${quadros}`);
    process.exit(1);
  }
  duracao = quadros / 24;
  entrada = ["-framerate", "24", "-i", path.join(video, "%03d.png")];
} else {
  duracao = Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], {
      encoding: "utf8",
    }).trim(),
  );
  entrada = ["-i", video];
}
const fps = ehPasta ? "24" : (quadros / duracao).toFixed(6);

function gerar(pasta, filtro) {
  rmSync(pasta, { recursive: true, force: true });
  mkdirSync(pasta, { recursive: true });
  execFileSync(
    "ffmpeg",
    [
      "-v", "error", "-y", ...entrada,
      // `tpad` repete o último quadro: sem ele, `fps=N/duração` pode entregar N-1 e a contagem falha.
      "-vf", `fps=${fps}${reverso},tpad=stop_mode=clone:stop_duration=1,${filtro}`,
      "-frames:v", String(quadros),
      "-c:v", "libwebp", "-quality", String(qualidade), "-compression_level", "6",
      path.join(pasta, "%03d.webp"),
    ],
    { stdio: "inherit" },
  );
  const arquivos = readdirSync(pasta).filter((f) => f.endsWith(".webp"));
  const bytes = arquivos.reduce((s, f) => s + statSync(path.join(pasta, f)).size, 0);
  return { quadros: arquivos.length, bytes, mediaKB: Math.round(bytes / arquivos.length / 1024) };
}

const largo = gerar(path.join(raiz, nome), `scale=${largura}:-2:flags=lanczos`);
const movel = gerar(
  path.join(raiz, `${nome}-movel`),
  `crop=trunc(ih*${proporcaoMovel}/2)*2:ih,scale=${larguraMovel}:-2:flags=lanczos`,
);

if (largo.quadros !== quadros || movel.quadros !== quadros) {
  console.error(`⛔ contagem errada: largo ${largo.quadros}, celular ${movel.quadros}, pedido ${quadros}`);
  process.exit(1);
}

const manifesto = { video: path.basename(video), duracao, quadros, reverso: Boolean(reverso), largo, movel };
writeFileSync(path.join(raiz, nome, "manifesto.json"), JSON.stringify(manifesto, null, 2) + "\n");
console.log(JSON.stringify(manifesto, null, 2));
