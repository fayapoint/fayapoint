/**
 * Gera a imagem social do site (`/og-fayai.jpg`) — 1200×630.
 *
 * ── A regra que este script existe para cumprir ────────────────────────────
 *
 * O texto NÃO é gerado pelo modelo de imagem. O modelo produz só a arte; a
 * marca e a frase entram depois, compostas como SVG vetorial pelo sharp.
 *
 * O motivo é o defeito que o Ricardo relatou em 02/08/2026: "muitos dos cursos
 * estão com as capas com texto errado". Texto assado no pixel por um modelo de
 * difusão sai torto, com letra trocada, e — pior — congela: quando o título do
 * curso muda, a capa passa a mentir e ninguém percebe. Texto composto depois é
 * nítido em qualquer tela, sempre correto, e regerável em um segundo.
 *
 * ── O formato ──────────────────────────────────────────────────────────────
 *
 * 1200×630 é a medida que Facebook, LinkedIn, WhatsApp e X recortam sem cortar
 * nada. A arte é gerada em 1536×864 (mesma proporção do 16:9) e reduzida — o
 * modelo compõe melhor em tela maior, e reduzir preserva nitidez.
 *
 *   node scripts/gerar-hero-og.mjs
 */

import { writeFile, readFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const COMFY = "http://127.0.0.1:8000";
const PUBLIC = path.join(process.cwd(), "public");
const BRUTO = path.join(PUBLIC, "inventando", "arte", "_og-bruto.png");
const DESTINO = path.join(PUBLIC, "og-fayai.jpg");

const LARGURA = 1200;
const ALTURA = 630;

const PROMPT =
  "two towering crystal glass letters A and I standing side by side on a reflective floor, " +
  "translucent violet and cyan glass with deep internal refraction and caustics, " +
  "inside the transparent glass you can see tiny living scenes — a cozy lit living room, " +
  "a river winding through pine forest mountains — " +
  "deep navy blue background, glowing teal binary code and data streams orbiting in wide arcs, " +
  "volumetric light, cinematic studio lighting, octane render, ultra detailed, 8k, " +
  "composition centered with generous empty space at the bottom third";

const NEGATIVO =
  "text, letters of the alphabet other than A and I, words, typography, watermark, signature, " +
  "logo, caption, ugly, blurry, low quality, deformed, cluttered, busy";

function fluxo(semente) {
  return {
    1: { class_type: "UNETLoader", inputs: { unet_name: "qwen_image_2512_fp8_e4m3fn.safetensors", weight_dtype: "default" } },
    2: { class_type: "CLIPLoader", inputs: { clip_name: "qwen_2.5_vl_7b_fp8_scaled.safetensors", type: "qwen_image" } },
    3: { class_type: "VAELoader", inputs: { vae_name: "qwen_image_vae.safetensors" } },
    4: { class_type: "CLIPTextEncode", inputs: { clip: ["2", 0], text: PROMPT } },
    5: { class_type: "CLIPTextEncode", inputs: { clip: ["2", 0], text: NEGATIVO } },
    6: { class_type: "EmptySD3LatentImage", inputs: { width: 1536, height: 864, batch_size: 1 } },
    7: {
      class_type: "KSampler",
      inputs: {
        model: ["1", 0], positive: ["4", 0], negative: ["5", 0], latent_image: ["6", 0],
        seed: semente, steps: 24, cfg: 2.5, sampler_name: "euler", scheduler: "simple", denoise: 1,
      },
    },
    8: { class_type: "VAEDecode", inputs: { samples: ["7", 0], vae: ["3", 0] } },
    9: { class_type: "SaveImage", inputs: { images: ["8", 0], filename_prefix: "og" } },
  };
}

async function gerarArte() {
  const r = await fetch(`${COMFY}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: fluxo(Math.floor(Math.random() * 2 ** 31)) }),
  });
  if (!r.ok) throw new Error(`enfileirar HTTP ${r.status}`);
  const { prompt_id } = await r.json();

  const inicio = Date.now();
  while (Date.now() - inicio < 420000) {
    const h = await (await fetch(`${COMFY}/history/${prompt_id}`)).json();
    const item = h[prompt_id];
    if (item?.status?.status_str === "error") throw new Error("ComfyUI falhou");
    const img = Object.values(item?.outputs ?? {}).flatMap((o) => o.images ?? [])[0];
    if (img) {
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder ?? "", type: img.type ?? "output" });
      const buf = Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer());
      await writeFile(BRUTO, buf);
      return buf.length;
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error("tempo esgotado");
}

/** Escapa o que vai dentro de um nó de texto do SVG. */
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * A camada de texto, em SVG.
 *
 * Vetorial de propósito: renderiza nítido em qualquer densidade de tela e é
 * regerado em um segundo quando a frase mudar.
 */
function camadaTexto({ marca, frase }) {
  return Buffer.from(`
<svg width="${LARGURA}" height="${ALTURA}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="45%" stop-color="#05060f" stop-opacity="0"/>
      <stop offset="100%" stop-color="#05060f" stop-opacity="0.94"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${LARGURA}" height="${ALTURA}" fill="url(#base)"/>
  <text x="60" y="${ALTURA - 92}" font-family="Georgia, 'Times New Roman', serif"
        font-size="66" font-weight="700" fill="#ffffff" letter-spacing="-1">${esc(marca)}</text>
  <text x="62" y="${ALTURA - 46}" font-family="Helvetica, Arial, sans-serif"
        font-size="27" fill="#8fe8dc" letter-spacing="0.4">${esc(frase)}</text>
</svg>`);
}

async function main() {
  if (!existsSync(BRUTO)) {
    console.log("Gerando a arte no ComfyUI...");
    const bytes = await gerarArte();
    console.log(`arte bruta: ${(bytes / 1024).toFixed(0)} KB`);
  } else {
    console.log("Reaproveitando a arte bruta já baixada.");
  }

  const composta = await sharp(await readFile(BRUTO))
    .resize(LARGURA, ALTURA, { fit: "cover", position: "centre" })
    .composite([{ input: camadaTexto({ marca: "fayai.com.br", frase: "Cursos e microcursos de IA, em português" }), top: 0, left: 0 }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  await writeFile(DESTINO, composta);
  await unlink(BRUTO).catch(() => {});

  const meta = await sharp(composta).metadata();
  console.log(`\n/og-fayai.jpg  ${meta.width}×${meta.height}  ${(composta.length / 1024).toFixed(0)} KB`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
