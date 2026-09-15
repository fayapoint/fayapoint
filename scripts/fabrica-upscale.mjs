#!/usr/bin/env node
/**
 * UPSCALE LOCAL das sequências da /fabrica — SeedVR2 3B int8 no ComfyUI (porta 8000).
 *
 *   node scripts/fabrica-upscale.mjs --video abertura_480p.mp4 --nome abertura --quadros 144
 *
 * Por que existe: o vídeo sai do Seedance 2.5 em 480p (é o que custa pouco) e
 * a página precisa de 1600 px. Esticar com lanczos dá um borrão caro; o SeedVR2
 * é um restaurador de um passo com consistência temporal de verdade — ele
 * reconstrói borda e textura sem cintilar entre quadros.
 *
 * O caminho:
 *   1. ffmpeg reduz o vídeo a EXATAMENTE `--quadros` imagens antes de subir a
 *      resolução. Não faz sentido restaurar 193 quadros para jogar 49 fora.
 *   2. O grafo é o do template oficial `utility_seedvr2_3b_int8_upscale_video`,
 *      achatado à mão, com o fatiamento temporal LIGADO (o template vem com ele
 *      desligado, e 144 quadros em 1080p não cabem em 16 GB de uma vez).
 *   3. A saída é PNG quadro a quadro, sem compressão com perda no meio — quem
 *      comprime é o `fabrica-quadros.mjs`, uma vez só.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const arg = (n, p) => (args.indexOf(`--${n}`) === -1 ? p : args[args.indexOf(`--${n}`) + 1]);

const video = arg("video");
const nome = arg("nome");
const quadros = Number(arg("quadros", "144"));
const largura = Number(arg("largura", "1920"));
const altura = Number(arg("altura", "1080"));
const servidor = arg("servidor", "http://localhost:8000");
const COMFY = arg("comfy", "C:/WORKS/ComfyUI");

if (!video || !nome || !existsSync(video)) {
  console.error("uso: --video <mp4> --nome <abertura|final> [--quadros 144]");
  process.exit(1);
}

// ── 1. reduzir ao número de quadros da página ───────────────────────────────
const duracao = Number(
  execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], { encoding: "utf8" }).trim(),
);
const entrada = `fabrica_${nome}_fonte.mp4`;
// ⚠️ `fps=N/duração` sozinho arredonda para N-1 em vídeo de 10,08 s (medido em 15/09:
// 143 quadros, e o upscale inteiro — 16 min de GPU — terminou sem copiar nada). O
// `tpad` repete o último quadro por 1 s, então `-frames:v N` sempre alcança N.
execFileSync(
  "ffmpeg",
  ["-v", "error", "-y", "-i", video, "-vf", `fps=${(quadros / duracao).toFixed(6)},tpad=stop_mode=clone:stop_duration=1`, "-frames:v", String(quadros),
   "-an", "-c:v", "libx264", "-crf", "8", "-pix_fmt", "yuv444p", path.join(COMFY, "input", entrada)],
  { stdio: "inherit" },
);

// ── 2. o grafo ──────────────────────────────────────────────────────────────
const prefixo = `fabrica/${nome}_up`;
const grafo = {
  carregar: { class_type: "LoadVideo", inputs: { file: entrada } },
  partes: { class_type: "GetVideoComponents", inputs: { video: ["carregar", 0] } },
  redimensionar: {
    class_type: "ResizeImageMaskNode",
    inputs: {
      input: ["partes", 0],
      resize_type: "scale dimensions",
      "resize_type.width": largura,
      "resize_type.height": altura,
      "resize_type.crop": "center",
      scale_method: "lanczos",
    },
  },
  preparar: { class_type: "SeedVR2Preprocess", inputs: { resized_images: ["redimensionar", 0] } },
  vae: { class_type: "VAELoader", inputs: { vae_name: "seedvr2_ema_vae_fp16.safetensors" } },
  modelo: { class_type: "UNETLoader", inputs: { unet_name: "seedvr2_3b_int8_convrot.safetensors", weight_dtype: "default" } },
  codificar: {
    class_type: "VAEEncodeTiled",
    inputs: { pixels: ["preparar", 0], vae: ["vae", 0], tile_size: 512, overlap: 128, temporal_size: 64, temporal_overlap: 8 },
  },
  fatiar: {
    class_type: "SeedVR2TemporalChunk",
    inputs: { latent: ["codificar", 0], temporal_overlap: 2, chunking_mode: "auto" },
  },
  condicionar: { class_type: "SeedVR2Conditioning", inputs: { model: ["modelo", 0], vae_conditioning: ["fatiar", 0] } },
  amostrar: {
    class_type: "KSampler",
    inputs: {
      model: ["modelo", 0], positive: ["condicionar", 0], negative: ["condicionar", 1], latent_image: ["fatiar", 0],
      seed: 959948902156062, steps: 1, cfg: 1, sampler_name: "euler", scheduler: "simple", denoise: 1,
    },
  },
  juntar: { class_type: "SeedVR2TemporalMerge", inputs: { latents: ["amostrar", 0], temporal_overlap: ["fatiar", 1] } },
  decodificar: {
    class_type: "VAEDecodeTiled",
    inputs: { samples: ["juntar", 0], vae: ["vae", 0], tile_size: 512, overlap: 128, temporal_size: 64, temporal_overlap: 8 },
  },
  corrigir: {
    class_type: "SeedVR2PostProcessing",
    inputs: { images: ["decodificar", 0], original_resized_images: ["redimensionar", 0], color_correction_method: "lab" },
  },
  salvar: { class_type: "SaveImage", inputs: { images: ["corrigir", 0], filename_prefix: prefixo } },
};

const pastaSaida = path.join(COMFY, "output", "fabrica");
for (const f of existsSync(pastaSaida) ? readdirSync(pastaSaida) : []) {
  if (f.startsWith(`${nome}_up_`)) rmSync(path.join(pastaSaida, f));
}

const r = await fetch(`${servidor}/prompt`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ prompt: grafo }),
});
const corpo = await r.json();
if (!r.ok || corpo.error) {
  console.error("⛔ o servidor recusou o grafo:", JSON.stringify(corpo, null, 2).slice(0, 3000));
  process.exit(1);
}
const id = corpo.prompt_id;
console.log(`na fila: ${id}`);

// ── 3. esperar e conferir na SAÍDA, não no log ──────────────────────────────
const inicio = Date.now();
for (;;) {
  await new Promise((ok) => setTimeout(ok, 10_000));
  const h = await (await fetch(`${servidor}/history/${id}`)).json();
  const item = h[id];
  if (!item) {
    process.stdout.write(`\r${Math.round((Date.now() - inicio) / 1000)} s…`);
    continue;
  }
  if (item.status?.status_str === "error") {
    const msg = item.status.messages?.find((m) => m[0] === "execution_error");
    console.error("\n⛔ falhou:", JSON.stringify(msg?.[1] ?? item.status, null, 2).slice(0, 3000));
    process.exit(1);
  }
  if (item.status?.completed) break;
}

const saidas = readdirSync(pastaSaida).filter((f) => f.startsWith(`${nome}_up_`) && f.endsWith(".png")).sort();
if (saidas.length !== quadros) {
  console.error(`\n⛔ saíram ${saidas.length} quadros, eram ${quadros}`);
  process.exit(1);
}
const destino = path.resolve(arg("destino", `D:/fayai/images/fabrica-quadros/${nome}_1080p`));
rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });
saidas.forEach((f, i) => copyFileSync(path.join(pastaSaida, f), path.join(destino, `${String(i + 1).padStart(3, "0")}.png`)));
console.log(`\n✅ ${saidas.length} quadros ${largura}×${altura} em ${destino} (${Math.round((Date.now() - inicio) / 1000)} s)`);
