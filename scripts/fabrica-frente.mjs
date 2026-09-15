#!/usr/bin/env node
/**
 * PRIMEIRO PLANO → PÁGINA — os recortes com alfa do `fabrica-recorte.mjs` no tamanho da sequência.
 *
 *   node scripts/fabrica-frente.mjs --de D:/fayai/images/fabrica-quadros/abertura_frente --nome abertura
 *   node scripts/fabrica-frente.mjs --de .../abertura_frente_luz --nome abertura --manter 52:100
 *
 * Gera `public/fabrica/<nome>-frente/NNN.webp` (1440 px) e `<nome>-frente-movel/NNN.webp`
 * (o MESMO recorte 9:14 do centro que o `fabrica-quadros.mjs` faz para o celular, 720 px).
 *
 * `--manter x0:x1` zera o alfa fora da faixa horizontal (em % da largura do quadro). Serve para
 * ficar com UM objeto quando o SAM acha dois parecidos e alterna entre eles de um quadro para o
 * outro — foi o caso dos dois softboxes da abertura (15/09/2026).
 *
 * ⚠️ A pilha da frente só engana o olho se cada quadro cair EXATAMENTE em cima do quadro de
 * baixo: mesma contagem, mesma proporção, mesmo recorte. Uma borda 2 px fora denuncia o truque.
 * Por isso o recorte do celular refaz a conta do ffmpeg (`crop=trunc(ih*9/14/2)*2:ih`, centrado;
 * `scale=720:-2`) e cada arquivo gerado é conferido contra o quadro de baixo já publicado — e
 * contra a perda do alfa, que já saiu muda uma vez (ver `fabrica-recorte.mjs`).
 */
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const arg = (n, p) => (args.indexOf(`--${n}`) === -1 ? p : args[args.indexOf(`--${n}`) + 1]);
const de = arg("de");
const nome = arg("nome");
const largura = Number(arg("largura", "1440"));
const larguraMovel = Number(arg("largura-movel", "720"));
const proporcaoMovel = Number(arg("proporcao-movel", String(9 / 14)));
const qualidade = Number(arg("qualidade", "80"));
const faixa = arg("manter") ? arg("manter").split(":").map(Number) : null;

if (!de || !nome || !existsSync(de) || (faixa && !(faixa[0] >= 0 && faixa[0] < faixa[1] && faixa[1] <= 100))) {
  console.error("uso: --de <pasta NNN.webp com alfa> --nome <sequência já publicada em public/fabrica> [--manter x0:x1]");
  process.exit(1);
}

const raiz = path.resolve(import.meta.dirname, "..", "public", "fabrica");
const base = path.join(raiz, nome);
const baseMovel = path.join(raiz, `${nome}-movel`);
const origem = readdirSync(de).filter((f) => /^\d{3}\.webp$/.test(f)).sort();
const contagemBase = readdirSync(base).filter((f) => /^\d{3}\.webp$/.test(f)).length;
if (origem.length !== contagemBase) {
  console.error(`⛔ ${origem.length} recortes e ${contagemBase} quadros em ${base}`);
  process.exit(1);
}

const dimensao = async (arquivo) => {
  const m = await sharp(arquivo).metadata();
  return `${m.width}×${m.height}`;
};
const alvo = await dimensao(path.join(base, "001.webp"));
const alvoMovel = existsSync(baseMovel) ? await dimensao(path.join(baseMovel, "001.webp")) : null;

const destino = path.join(raiz, `${nome}-frente`);
const destinoMovel = path.join(raiz, `${nome}-frente-movel`);
for (const d of [destino, destinoMovel]) {
  rmSync(d, { recursive: true, force: true });
  mkdirSync(d, { recursive: true });
}

/** O recorte de origem, já com o alfa zerado fora da faixa pedida. Cada saída abre o seu. */
async function preparar(src) {
  if (!faixa) return () => sharp(src);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const xa = Math.round((faixa[0] / 100) * info.width);
  const xb = Math.round((faixa[1] / 100) * info.width);
  for (let y = 0; y < info.height; y++) {
    const linha = y * info.width;
    for (let x = 0; x < xa; x++) data[(linha + x) * 4 + 3] = 0;
    for (let x = xb; x < info.width; x++) data[(linha + x) * 4 + 3] = 0;
  }
  return () => sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
}

let bytes = 0;
let bytesMovel = 0;
for (const f of origem) {
  const src = path.join(de, f);
  const { width: w, height: h } = await sharp(src).metadata();
  const abrir = await preparar(src);
  const saidaLarga = path.join(destino, f);
  await abrir().resize(largura).webp({ quality: qualidade, alphaQuality: 90 }).toFile(saidaLarga);

  const larguraRecorte = Math.trunc((h * proporcaoMovel) / 2) * 2;
  const alturaMovel = Math.round((h * larguraMovel) / larguraRecorte / 2) * 2;
  const saidaMovel = path.join(destinoMovel, f);
  await abrir()
    .extract({ left: Math.floor((w - larguraRecorte) / 2), top: 0, width: larguraRecorte, height: h })
    .resize(larguraMovel, alturaMovel, { fit: "fill" })
    .webp({ quality: qualidade, alphaQuality: 90 })
    .toFile(saidaMovel);

  for (const [arquivo, esperado] of [
    [saidaLarga, alvo],
    [saidaMovel, alvoMovel],
  ]) {
    const m = await sharp(arquivo).metadata();
    if (!m.hasAlpha) throw new Error(`⛔ ${arquivo} saiu sem transparência`);
    if (esperado && `${m.width}×${m.height}` !== esperado) {
      throw new Error(`⛔ ${arquivo} tem ${m.width}×${m.height}; o quadro de baixo tem ${esperado}`);
    }
  }
  bytes += statSync(saidaLarga).size;
  bytesMovel += statSync(saidaMovel).size;
}

const kb = (b) => Math.round(b / origem.length / 1024);
console.log(`✅ ${origem.length} quadros · ${nome}-frente ${kb(bytes)} KB · ${nome}-frente-movel ${kb(bytesMovel)} KB (média por quadro)`);
