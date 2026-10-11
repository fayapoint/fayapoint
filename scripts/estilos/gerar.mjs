/**
 * Gera a imagem de exemplo de cada estilo do Atlas (/estilos) no ComfyUI local.
 *
 * A fonte é `src/data/estilos.json`: o prompt que o visitante copia é o mesmo
 * que gera o exemplo (assunto `ex` + estilo `p`), então a imagem não mente
 * sobre o que o prompt faz.
 *
 * Uso:
 *   node scripts/estilos/gerar.mjs                    # o que falta
 *   node scripts/estilos/gerar.mjs --so ghibli,noir   # só estes ids
 *   node scripts/estilos/gerar.mjs --refazer          # tudo de novo
 *   node scripts/estilos/gerar.mjs --comparar         # folha de contato entre modelos
 *
 * ⚠️ Um job por vez na fila do ComfyUI, de propósito: o turno do Estúdio Social
 * (06h30 e 11h40) usa o mesmo servidor, e 180 jobs enfileirados de uma vez o
 * deixariam esperando a fila inteira. Ver estudio-social/motor/placa.mjs.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "../..");
const DADOS = path.join(RAIZ, "src/data/estilos.json");
const SAIDA = path.join(RAIZ, "public/estilos");
const PLACA = path.resolve(RAIZ, "../estudio-social/motor/placa.mjs");
const COMFY = "http://127.0.0.1:8000";
const LARGURA = 896;
const ALTURA = 1120;
const NEGATIVO = "low quality, blurry, deformed hands, extra fingers, watermark, signature, text, jpeg artifacts";

const arg = (nome) => {
  const i = process.argv.indexOf(nome);
  return i < 0 ? null : (process.argv[i + 1] ?? "");
};
const tem = (nome) => process.argv.includes(nome);
const MODELO = arg("--modelo") ?? "qwen-leve";

/** Cada receita devolve o grafo em formato API; a saída é sempre o nó "salvar". */
const RECEITAS = {
  qwen: (prompt, seed, prefixo, leve = false) => ({
    unet: { class_type: "UNETLoader", inputs: { unet_name: "qwen_image_2512_fp8_e4m3fn.safetensors", weight_dtype: "default" } },
    ...(leve ? { lora: { class_type: "LoraLoaderModelOnly", inputs: { lora_name: "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors", strength_model: 1, model: ["unet", 0] } } } : {}),
    fluxo: { class_type: "ModelSamplingAuraFlow", inputs: { shift: 3.1, model: [leve ? "lora" : "unet", 0] } },
    clip: { class_type: "CLIPLoader", inputs: { clip_name: "qwen_2.5_vl_7b_fp8_scaled.safetensors", type: "qwen_image", device: "default" } },
    vae: { class_type: "VAELoader", inputs: { vae_name: "qwen_image_vae.safetensors" } },
    pos: { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["clip", 0] } },
    neg: { class_type: "CLIPTextEncode", inputs: { text: leve ? "" : NEGATIVO, clip: ["clip", 0] } },
    latente: { class_type: "EmptySD3LatentImage", inputs: { width: LARGURA, height: ALTURA, batch_size: 1 } },
    amostra: { class_type: "KSampler", inputs: { seed, control_after_generate: "fixed", steps: leve ? 4 : 20, cfg: leve ? 1 : 4, sampler_name: "euler", scheduler: "simple", denoise: 1, model: ["fluxo", 0], positive: ["pos", 0], negative: ["neg", 0], latent_image: ["latente", 0] } },
    imagem: { class_type: "VAEDecode", inputs: { samples: ["amostra", 0], vae: ["vae", 0] } },
    salvar: { class_type: "SaveImage", inputs: { filename_prefix: prefixo, images: ["imagem", 0] } },
  }),
  "qwen-leve": (prompt, seed, prefixo) => RECEITAS.qwen(prompt, seed, prefixo, true),
  zimage: (prompt, seed, prefixo) => ({
    unet: { class_type: "UNETLoader", inputs: { unet_name: "z_image_bf16.safetensors", weight_dtype: "default" } },
    fluxo: { class_type: "ModelSamplingAuraFlow", inputs: { shift: 3, model: ["unet", 0] } },
    clip: { class_type: "CLIPLoader", inputs: { clip_name: "qwen_3_4b.safetensors", type: "lumina2", device: "default" } },
    vae: { class_type: "VAELoader", inputs: { vae_name: "ae.safetensors" } },
    pos: { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["clip", 0] } },
    neg: { class_type: "CLIPTextEncode", inputs: { text: NEGATIVO, clip: ["clip", 0] } },
    latente: { class_type: "EmptySD3LatentImage", inputs: { width: LARGURA, height: ALTURA, batch_size: 1 } },
    amostra: { class_type: "KSampler", inputs: { seed, control_after_generate: "fixed", steps: 25, cfg: 4, sampler_name: "res_multistep", scheduler: "simple", denoise: 1, model: ["fluxo", 0], positive: ["pos", 0], negative: ["neg", 0], latent_image: ["latente", 0] } },
    imagem: { class_type: "VAEDecode", inputs: { samples: ["amostra", 0], vae: ["vae", 0] } },
    salvar: { class_type: "SaveImage", inputs: { filename_prefix: prefixo, images: ["imagem", 0] } },
  }),
  mage: (prompt, seed, prefixo) => ({
    unet: { class_type: "UNETLoader", inputs: { unet_name: "mage_flow_int8_convrot.safetensors", weight_dtype: "default" } },
    clip: { class_type: "CLIPLoader", inputs: { clip_name: "qwen3vl_4b_bf16.safetensors", type: "mage", device: "default" } },
    vae: { class_type: "VAELoader", inputs: { vae_name: "mage_flow_vae_bf16.safetensors" } },
    texto: { class_type: "TextEncodeMageFlowEdit", inputs: { clip: ["clip", 0], vae: ["vae", 0], prompt, negative_prompt: NEGATIVO, width: LARGURA, height: ALTURA, batch_size: 1 } },
    amostra: { class_type: "KSampler", inputs: { seed, control_after_generate: "fixed", steps: 30, cfg: 5, sampler_name: "euler", scheduler: "simple", denoise: 1, model: ["unet", 0], positive: ["texto", 0], negative: ["texto", 1], latent_image: ["texto", 2] } },
    imagem: { class_type: "VAEDecode", inputs: { samples: ["amostra", 0], vae: ["vae", 0] } },
    salvar: { class_type: "SaveImage", inputs: { filename_prefix: prefixo, images: ["imagem", 0] } },
  }),
};

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Submete um grafo, espera terminar e devolve o PNG. Erro do nó vem no texto. */
async function rodar(grafo) {
  const r = await fetch(`${COMFY}/prompt`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: grafo }) });
  const j = await r.json();
  if (!r.ok || !j.prompt_id) throw new Error(`recusado: ${JSON.stringify(j.node_errors ?? j.error ?? j).slice(0, 400)}`);
  for (let i = 0; i < 900; i++) {
    await dormir(2000);
    const h = (await (await fetch(`${COMFY}/history/${j.prompt_id}`)).json())[j.prompt_id];
    if (!h) continue;
    if (h.status?.status_str === "error") throw new Error(`falhou: ${JSON.stringify(h.status.messages?.at(-1)).slice(0, 400)}`);
    const img = h.outputs?.salvar?.images?.[0];
    if (!img) continue;
    const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder, type: img.type });
    return Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer());
  }
  throw new Error("passou de 30 min");
}

/** Espera a placa ficar livre (ou nossa). Sem o script da placa, segue direto. */
async function esperarPlaca() {
  if (!existsSync(PLACA)) return;
  for (;;) {
    const estado = execFileSync("node", [PLACA, "--estado"], { encoding: "utf8" });
    if (/dono:\s*(livre|atlas)/i.test(estado)) return;
    console.log("placa ocupada, esperando:", estado.trim().split("\n")[0]);
    await dormir(30000);
  }
}
const placa = (...a) => {
  if (!existsSync(PLACA)) return;
  try { execFileSync("node", [PLACA, ...a], { encoding: "utf8" }); } catch { /* reserva é cortesia, não trava o lote */ }
};

const semente = (id) => [...id].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);

async function comparar() {
  const pasta = arg("--pasta") || path.join(process.env.TEMP ?? ".", "atlas");
  await mkdir(pasta, { recursive: true });
  const casos = [
    ["ghibli", "a girl and her small dog on a grassy hill above a seaside town, Studio Ghibli style, hand-painted anime film look, lush watercolour-like backgrounds, towering summer clouds, soft natural light, gentle nostalgic mood"],
    ["ukiyoe", "a fishing boat under a great wave, ukiyo-e woodblock print, flat areas of colour, flowing black outlines, stylised waves and clouds, soft indigo, vermilion and cream palette, visible wood-grain texture, Edo-period composition"],
    ["noir", "a detective under a streetlamp, film noir still, black and white, hard low-key lighting, venetian blind shadows across the scene, wet street reflections, smoky haze, deep contrast, 1940s detective mood"],
  ];
  const modelos = (arg("--modelos") || "qwen-leve,zimage,mage,qwen").split(",");
  const pecas = [];
  for (const [m, modelo] of modelos.entries()) {
    for (const [c, [id, prompt]] of casos.entries()) {
      const t0 = Date.now();
      try {
        const png = await rodar(RECEITAS[modelo](prompt, 1234, `atlas/_comparar_${modelo}_${id}`));
        pecas.push({ input: await sharp(png).resize(448, 560).toBuffer(), left: m * 448, top: c * 560 });
        console.log(modelo, id, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
      } catch (e) {
        console.log(modelo, id, "ERRO", e.message);
      }
    }
  }
  const folha = path.join(pasta, "comparar.jpg");
  await sharp({ create: { width: modelos.length * 448, height: casos.length * 560, channels: 3, background: "#222" } }).composite(pecas).jpeg({ quality: 82 }).toFile(folha);
  console.log("colunas:", modelos.join(" | "), "\nfolha:", folha);
}

async function lote() {
  const { estilos } = JSON.parse(await readFile(DADOS, "utf8"));
  const so = arg("--so")?.split(",");
  await mkdir(path.join(SAIDA, "p"), { recursive: true });
  const fila = estilos.filter((e) => (so ? so.includes(e.id) : true) && (tem("--refazer") || so || !existsSync(path.join(SAIDA, `${e.id}.webp`))));
  console.log(`${fila.length} de ${estilos.length} a gerar com ${MODELO}`);
  placa("--tomar", "atlas", "--prioridade", "1", "--minutos", "360", "--pid", String(process.pid));
  let feitas = 0;
  const falhas = [];
  for (const e of fila) {
    await esperarPlaca();
    // Movimento de câmera não cabe numa foto: o exemplo é um quadro de filme, e a página o anima.
    const prompt = e.f === "video"
      ? `${e.ex}, cinematic film still, natural light, shallow depth of field, 35mm lens, subtle film grain`
      : `${e.ex}${e.p.endsWith(".") ? ". " : ", "}${e.p}`;
    const t0 = Date.now();
    try {
      const png = await rodar(RECEITAS[MODELO](prompt, semente(e.id), `atlas/${e.id}`));
      await writeFile(path.join(SAIDA, `${e.id}.webp`), await sharp(png).resize(800, 1000).webp({ quality: 80 }).toBuffer());
      await writeFile(path.join(SAIDA, "p", `${e.id}.webp`), await sharp(png).resize(320, 400).webp({ quality: 72 }).toBuffer());
      feitas++;
      console.log(`${feitas}/${fila.length} ${e.id} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    } catch (err) {
      falhas.push(e.id);
      console.log(`FALHA ${e.id}: ${err.message}`);
    }
  }
  placa("--soltar", "atlas");
  console.log(`fim: ${feitas} feitas, ${falhas.length} falhas ${falhas.join(",")}`);
  if (falhas.length) process.exitCode = 1;
}

await (tem("--comparar") ? comparar() : lote());
