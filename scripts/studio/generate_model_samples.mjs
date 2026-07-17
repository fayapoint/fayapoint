/**
 * Fase 4.4 (17/07/2026): thumbnail de exemplo POR MODELO do Studio AI.
 * Mesmo prompt de referência em todos os modelos → o usuário VÊ a diferença.
 * Saída: public/portal/studio/<id>.png (converter depois p/ webp via ffmpeg).
 * Uso: node scripts/studio/generate_model_samples.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const OUT = path.join(ROOT, "public", "portal", "studio");
fs.mkdirSync(OUT, { recursive: true });

// mesma cena em todos: comparável e com a cara da casa
const REF_PROMPT =
  "A friendly little robot barista making coffee in a cozy brazilian cafe at golden hour, " +
  "steam rising, warm bokeh lights, detailed, vibrant colors";

const MODELS = [
  ["gemini-flash-lite", "google/gemini-3.1-flash-lite-image", {}],
  ["nano-banana-1", "google/gemini-2.5-flash-image", {}],
  ["gemini-flash", "google/gemini-3.1-flash-image", {}],
  ["gemini-pro-image", "google/gemini-3-pro-image", {}],
  ["gpt-image-2", "openai/gpt-5.4-image-2", {}],
  ["nano-banana-pro", "google/gemini-3-pro-image-preview", { modalities: ["image", "text"] }],
  ["gpt-5-image-mini", "openai/gpt-5-image-mini", {}],
];

const envFile = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const KEY = envFile.match(/^OPENROUTER_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error("OPENROUTER_API_KEY não encontrada no .env.local");

async function generateOne(id, orModel, extra) {
  const dest = path.join(OUT, `${id}.png`);
  if (fs.existsSync(dest)) {
    console.log(`[${id}] já existe — pulando`);
    return;
  }
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://fayai.com.br",
      "X-Title": "Fayapoint AI",
    },
    body: JSON.stringify({
      model: orModel,
      messages: [{ role: "user", content: REF_PROMPT }],
      ...extra,
    }),
  });
  if (!res.ok) {
    console.log(`[${id}] HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
    return;
  }
  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  let url = msg?.images?.[0]?.image_url?.url;
  if (!url && msg?.content) {
    url = msg.content.match(/https?:\/\/[^\s)"]+/)?.[0] ||
          msg.content.match(/data:image\/[^;]+;base64,[^"\s)]+/)?.[0];
  }
  if (!url) {
    console.log(`[${id}] sem imagem na resposta`);
    return;
  }
  let buf;
  if (url.startsWith("data:")) {
    buf = Buffer.from(url.split(",")[1], "base64");
  } else {
    buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  }
  fs.writeFileSync(dest, buf);
  console.log(`[${id}] OK ${(buf.length / 1024).toFixed(0)}KB`);
}

for (const [id, orModel, extra] of MODELS) {
  try {
    await generateOne(id, orModel, extra);
  } catch (e) {
    console.log(`[${id}] ERRO: ${e.message}`);
  }
}
console.log("STUDIO SAMPLES DONE");
