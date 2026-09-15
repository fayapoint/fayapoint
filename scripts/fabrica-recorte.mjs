#!/usr/bin/env node
/**
 * RECORTE DO PRIMEIRO PLANO — para o texto passar POR TRÁS dos objetos da cena.
 *
 *   node scripts/fabrica-recorte.mjs --imagem estudio-4k.png --texto "cinema camera on tripod|softbox light on stand|desk" --saida public/fabrica/estudio-frente.webp
 *   node scripts/fabrica-recorte.mjs --video abertura_1080p.mp4 --texto "..." --saida public/fabrica/abertura-frente
 *
 * A imersão que o Ricardo pediu ("misturar por cima e por baixo o texto do que
 * acontece") é uma pilha de três camadas: o quadro inteiro embaixo, o texto no
 * meio e, por cima, SÓ os objetos da frente — com fundo transparente. Quem faz a
 * máscara é o SAM 3.1 no ComfyUI (porta 8000), guiado por texto: um nome de
 * objeto por `|`, as máscaras somadas.
 *
 * A borda recebe 1,2 px de desfoque antes de virar alfa: máscara dura em cima
 * de título grande aparece como serrilhado, e é o primeiro defeito que o olho
 * encontra nesse efeito.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const arg = (n, p) => (args.indexOf(`--${n}`) === -1 ? p : args[args.indexOf(`--${n}`) + 1]);

const imagem = arg("imagem");
const video = arg("video");
const textos = String(arg("texto", "")).split("|").map((t) => t.trim()).filter(Boolean);
const saida = arg("saida");
const limiar = Number(arg("limiar", "0.4"));
const servidor = arg("servidor", "http://localhost:8000");
const COMFY = arg("comfy", "C:/WORKS/ComfyUI");
const nome = `recorte_${Date.now()}`;

if ((!imagem && !video) || !textos.length || !saida) {
  console.error('uso: --imagem <png> | --video <mp4>  --texto "objeto a|objeto b"  --saida <arquivo.webp | pasta>');
  process.exit(1);
}

// ── o grafo ─────────────────────────────────────────────────────────────────
const entrada = `${nome}${path.extname(imagem ?? video)}`;
copyFileSync(imagem ?? video, path.join(COMFY, "input", entrada));

const grafo = {
  sam: { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sam3.1_multiplex_fp16.safetensors" } },
};
if (imagem) {
  grafo.fonte = { class_type: "LoadImage", inputs: { image: entrada } };
} else {
  grafo.video = { class_type: "LoadVideo", inputs: { file: entrada } };
  grafo.fonte = { class_type: "GetVideoComponents", inputs: { video: ["video", 0] } };
}

let ultimaMascara = null;
textos.forEach((texto, i) => {
  grafo[`texto${i}`] = { class_type: "CLIPTextEncode", inputs: { clip: ["sam", 1], text: texto } };
  grafo[`detectar${i}`] = {
    class_type: "SAM3_Detect",
    inputs: {
      model: ["sam", 0], image: ["fonte", 0], conditioning: [`texto${i}`, 0],
      threshold: limiar, refine_iterations: 2, individual_masks: false,
    },
  };
  if (ultimaMascara === null) {
    ultimaMascara = [`detectar${i}`, 0];
  } else {
    grafo[`somar${i}`] = {
      class_type: "MaskComposite",
      inputs: { destination: ultimaMascara, source: [`detectar${i}`, 0], x: 0, y: 0, operation: "add" },
    };
    ultimaMascara = [`somar${i}`, 0];
  }
});
grafo.paraImagem = { class_type: "MaskToImage", inputs: { mask: ultimaMascara } };
grafo.salvar = { class_type: "SaveImage", inputs: { images: ["paraImagem", 0], filename_prefix: `fabrica/${nome}` } };

const r = await fetch(`${servidor}/prompt`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ prompt: grafo }),
});
const corpo = await r.json();
if (!r.ok || corpo.error) {
  console.error("⛔ grafo recusado:", JSON.stringify(corpo, null, 2).slice(0, 3000));
  process.exit(1);
}
const id = corpo.prompt_id;
for (;;) {
  await new Promise((ok) => setTimeout(ok, 3000));
  const item = (await (await fetch(`${servidor}/history/${id}`)).json())[id];
  if (!item) continue;
  if (item.status?.status_str === "error") {
    const msg = item.status.messages?.find((m) => m[0] === "execution_error");
    console.error("⛔ falhou:", JSON.stringify(msg?.[1] ?? item.status, null, 2).slice(0, 3000));
    process.exit(1);
  }
  if (item.status?.completed) break;
}

// ── máscara → alfa ──────────────────────────────────────────────────────────
const pastaMascaras = path.join(COMFY, "output", "fabrica");
const mascaras = readdirSync(pastaMascaras).filter((f) => f.startsWith(nome) && f.endsWith(".png")).sort();
if (!mascaras.length) {
  console.error("⛔ o SAM não devolveu máscara nenhuma — confira o texto dos objetos");
  process.exit(1);
}

async function recortar(origem, mascara, destino) {
  // ⚠️ Dois defeitos mudos, os dois medidos em 15/09/2026 — a frente saía OPACA e
  // cobria o texto inteiro, sem erro nenhum:
  //   1. `joinChannel` com PNG codificado de 1 canal é ignorado;
  //   2. `removeAlpha()` no mesmo pipeline roda DEPOIS do `joinChannel` e apaga o alfa novo.
  // Por isso o RGB e o alfa saem crus, em pipelines separados, e só então se juntam.
  const rgb = await sharp(origem).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = rgb.info;
  const alfa = await sharp(mascara).resize(width, height).blur(1.2).extractChannel(0).raw().toBuffer();
  const cobertura = alfa.reduce((s, v) => s + v, 0) / alfa.length / 255;
  await sharp(rgb.data, { raw: { width, height, channels: 3 } })
    .joinChannel(alfa, { raw: { width, height, channels: 1 } })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(destino);
  const conferido = await sharp(destino).metadata();
  if (!conferido.hasAlpha) throw new Error(`⛔ ${destino} saiu sem transparência`);
  return cobertura;
}

if (imagem) {
  const cobertura = await recortar(imagem, path.join(pastaMascaras, mascaras[0]), saida);
  console.log(`✅ ${saida} — ${(cobertura * 100).toFixed(1)}% da imagem é primeiro plano`);
} else {
  // Vídeo: os quadros de origem são os PNGs do upscale, na mesma ordem das máscaras.
  const quadros = arg("quadros-dir");
  if (!quadros || !existsSync(quadros)) {
    console.error("⛔ com --video, passe também --quadros-dir <pasta de NNN.png do upscale>");
    process.exit(1);
  }
  const origem = readdirSync(quadros).filter((f) => /^\d{3}\.png$/.test(f)).sort();
  if (origem.length !== mascaras.length) {
    console.error(`⛔ ${origem.length} quadros e ${mascaras.length} máscaras`);
    process.exit(1);
  }
  rmSync(saida, { recursive: true, force: true });
  mkdirSync(saida, { recursive: true });
  for (let i = 0; i < origem.length; i++) {
    await recortar(path.join(quadros, origem[i]), path.join(pastaMascaras, mascaras[i]), path.join(saida, origem[i].replace(".png", ".webp")));
  }
  console.log(`✅ ${origem.length} quadros com fundo transparente em ${saida}`);
}
