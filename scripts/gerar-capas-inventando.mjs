/**
 * Gera as imagens da seção Inventando + a hero do site, no ComfyUI local.
 *
 * Linguagem visual: a referência que o Ricardo mandou — escultura de vidro
 * translúcido em violeta e turquesa sobre azul-marinho profundo, com cenas
 * vivas dentro do cristal, fluxos de dados orbitando e chão espelhado.
 *
 * ⚠️ Nada de texto dentro da imagem. As capas de curso do site estão com
 * texto errado justamente porque o texto foi assado no pixel — quando o
 * título muda, a imagem mente. Título é HTML por cima, sempre.
 *
 *   node scripts/gerar-capas-inventando.mjs
 *   node scripts/gerar-capas-inventando.mjs --so=hero
 */

import { writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const COMFY = "http://127.0.0.1:8000";
const SAIDA = path.join(process.cwd(), "public", "inventando", "arte");

/** Combinação conhecida boa neste servidor (ComfyUI 0.29.2). */
const MODELO = {
  unet: "qwen_image_2512_fp8_e4m3fn.safetensors",
  clip: "qwen_2.5_vl_7b_fp8_scaled.safetensors",
  clipType: "qwen_image",
  vae: "qwen_image_vae.safetensors",
};

const ESTILO =
  "translucent crystal glass sculpture, violet and cyan glass with deep internal refraction and caustics, " +
  "deep navy blue background, glowing teal binary code and data streams orbiting in arcs, " +
  "volumetric light, glossy reflective floor with soft reflection, cinematic studio lighting, " +
  "octane render, ultra detailed, 8k, premium product photography";

const NEGATIVO =
  "text, letters, words, typography, watermark, signature, logo, caption, subtitle, " +
  "ugly, blurry, low quality, jpeg artifacts, deformed, cluttered, busy, flat lighting";

/**
 * O que gerar. `assunto` é o miolo do prompt; o estilo é comum a todos para
 * que a seção inteira pareça uma coisa só.
 */
const PECAS = [
  {
    nome: "hero",
    largura: 1536,
    altura: 864,
    assunto:
      "a towering crystal letter A and letter I standing side by side, and inside the transparent glass you can see tiny living scenes — a cozy lit living room, a river winding through pine forest mountains, a glowing geometric diamond",
  },
  // Uma peça por categoria da seção. Capa de microcurso herda a da categoria
  // quando não tiver arte própria.
  { nome: "cat-video", assunto: "a crystal glass film camera and clapperboard, with a moving film strip of tiny landscapes frozen inside the glass" },
  { nome: "cat-audio", assunto: "a crystal glass sound wave ribbon and a faceted microphone, with luminous waveform ripples suspended inside the glass" },
  { nome: "cat-imagem", assunto: "a crystal glass artist palette and prism splitting light into a spectrum, with a tiny painted landscape visible inside" },
  { nome: "cat-modelos", assunto: "a crystal glass brain made of interconnected geometric nodes and glowing neural pathways inside translucent facets" },
  { nome: "cat-robotica", assunto: "a crystal glass robotic hand reaching upward, delicate faceted fingers with glowing joints and circuitry inside" },
  { nome: "cat-mundos", assunto: "a crystal glass floating island world inside a transparent sphere, tiny mountains and a waterfall visible within the glass" },
  { nome: "cat-produtividade", assunto: "a crystal glass hourglass and stacked geometric documents, with flowing luminous particles inside instead of sand" },
  // Peças de apoio para o topo das páginas.
  { nome: "ferramentaria", largura: 1536, altura: 864, assunto: "an elegant crystal glass workbench holding faceted translucent tools — a wrench, a compass, a gear — each glowing from within" },
  { nome: "microcurso", largura: 1536, altura: 864, assunto: "a crystal glass open book floating, with holographic pages of light rising from it and tiny scenes glowing inside the cover" },
];

function fluxo({ assunto, largura = 1280, altura = 720, semente }) {
  const positivo = `${assunto}, ${ESTILO}`;
  return {
    1: { class_type: "UNETLoader", inputs: { unet_name: MODELO.unet, weight_dtype: "default" } },
    2: { class_type: "CLIPLoader", inputs: { clip_name: MODELO.clip, type: MODELO.clipType } },
    3: { class_type: "VAELoader", inputs: { vae_name: MODELO.vae } },
    4: { class_type: "CLIPTextEncode", inputs: { clip: ["2", 0], text: positivo } },
    5: { class_type: "CLIPTextEncode", inputs: { clip: ["2", 0], text: NEGATIVO } },
    6: { class_type: "EmptySD3LatentImage", inputs: { width: largura, height: altura, batch_size: 1 } },
    7: {
      class_type: "KSampler",
      inputs: {
        model: ["1", 0], positive: ["4", 0], negative: ["5", 0], latent_image: ["6", 0],
        seed: semente, steps: 20, cfg: 2.5, sampler_name: "euler", scheduler: "simple", denoise: 1,
      },
    },
    8: { class_type: "VAEDecode", inputs: { samples: ["7", 0], vae: ["3", 0] } },
    9: { class_type: "SaveImage", inputs: { images: ["8", 0], filename_prefix: "inventando" } },
  };
}

async function enfileirar(prompt) {
  const r = await fetch(`${COMFY}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!r.ok) throw new Error(`enfileirar HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return (await r.json()).prompt_id;
}

/**
 * Espera o resultado no histórico.
 *
 * ⚠️ Fila vazia NÃO é sinal de sucesso — o job pode ter morrido. O único
 * critério aceitável é o arquivo aparecer no histórico com nome.
 */
async function esperar(promptId, limiteMs = 420000) {
  const inicio = Date.now();
  while (Date.now() - inicio < limiteMs) {
    const r = await fetch(`${COMFY}/history/${promptId}`);
    const h = await r.json();
    const item = h[promptId];
    if (item) {
      if (item.status?.status_str === "error") {
        const msg = JSON.stringify(item.status?.messages ?? []).slice(0, 400);
        throw new Error(`ComfyUI falhou: ${msg}`);
      }
      const imagens = Object.values(item.outputs ?? {}).flatMap((o) => o.images ?? []);
      if (imagens.length) return imagens[0];
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error("tempo esgotado");
}

async function baixar(img, destino) {
  const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder ?? "", type: img.type ?? "output" });
  const r = await fetch(`${COMFY}/view?${q}`);
  if (!r.ok) throw new Error(`baixar HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 10000) throw new Error(`imagem pequena demais (${buf.length} B)`);
  await writeFile(destino, buf);
  return buf.length;
}

async function main() {
  const arg = process.argv.find((a) => a.startsWith("--so="));
  const filtro = arg ? arg.slice(5).split(",") : null;

  await mkdir(SAIDA, { recursive: true });
  const alvos = PECAS.filter((p) => !filtro || filtro.includes(p.nome));

  console.log(`Gerando ${alvos.length} peças em ${SAIDA}\n`);

  let ok = 0;
  for (const [i, peca] of alvos.entries()) {
    const destino = path.join(SAIDA, `${peca.nome}.png`);
    if (existsSync(destino) && !filtro) {
      console.log(`[${i + 1}/${alvos.length}] ${peca.nome.padEnd(20)} já existe, pulando`);
      ok++;
      continue;
    }
    const t0 = Date.now();
    try {
      const semente = Math.floor(Math.random() * 2 ** 31);
      const id = await enfileirar(fluxo({ ...peca, semente }));
      const img = await esperar(id);
      const bytes = await baixar(img, destino);
      const seg = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`[${i + 1}/${alvos.length}] ${peca.nome.padEnd(20)} OK  ${(bytes / 1024).toFixed(0)} KB  ${seg}s`);
      ok++;
    } catch (e) {
      console.log(`[${i + 1}/${alvos.length}] ${peca.nome.padEnd(20)} FALHOU: ${e.message}`);
    }
  }

  const arquivos = await readdir(SAIDA).catch(() => []);
  console.log(`\n${ok}/${alvos.length} geradas. ${arquivos.length} arquivos em public/inventando/arte/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
