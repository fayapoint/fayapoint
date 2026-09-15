#!/usr/bin/env node
/**
 * TELAS NÍTIDAS — a letra das peças reais volta da foto 4K para o fim da abertura.
 *
 *   node scripts/fabrica-telas.mjs \
 *     --quadros-dir D:/fayai/images/fabrica-quadros/abertura_seedance20_1080p \
 *     --foto D:/fayai/images/fabrica-estudio-abertura/image-fim-4k-a.png \
 *     --saida D:/fayai/images/fabrica-quadros/abertura_seedance20_1080p_telas
 *
 * O problema que o Ricardo apontou (15/09/2026): o vídeo monta o estúdio muito bem,
 * mas as telas saem com a letra embaralhada ("CITUTTOURAÇÃO") — e upscale não
 * inventa letra certa. Só que a abertura tem a câmera TRAVADA e termina na foto 4K
 * que o próprio vídeo recebeu como último quadro. Então a letra certa já existe:
 *
 *   1. alinha a foto ao último quadro (escala + deslocamento, só na região das telas);
 *   2. acha o primeiro quadro em que as telas já estão acesas e paradas;
 *   3. dali em diante, funde por cima SÓ as telas da foto, com borda suave;
 *   4. nos últimos quadros, funde o quadro inteiro — a rolagem para na foto 4K.
 *
 * ## `--so-final` (o fechamento)
 *
 *   node scripts/fabrica-telas.mjs --so-final --fusao-final 18 --miolo 440,320,1460,760 \
 *     --quadros-dir D:/fayai/images/fabrica-quadros/final_seedance20_1080p \
 *     --foto D:/fayai/10_MARCA/logo_aplicacoes_higgsfield_2026-09-14/02_titanio.png \
 *     --saida D:/fayai/images/fabrica-quadros/final_seedance20_1080p_logo
 *
 * Sem telas: só a fusão final, para o quadro de parada ser o logo verdadeiro — letra de
 * modelo de vídeo não é letra de marca. Aqui a câmera NÃO está travada: o logo ainda
 * avança devagar nos últimos quadros. Com um alinhamento só (o do último quadro), a fusão
 * mostrou contorno duplo no F e no "Ai" entre os quadros 132 e 140 (medido em 15/09).
 * Por isso, neste modo, cada quadro da fusão ganha o próprio alinhamento, buscado em volta
 * do alinhamento do quadro seguinte.
 *
 * Sem OpenCV (não está instalado): o alinhamento é uma busca grossa e depois fina
 * pela menor diferença de pixels, em miniatura, feita com sharp e JS puro.
 */
import { mkdirSync, readdirSync, rmSync, copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const arg = (n, p) => (args.indexOf(`--${n}`) === -1 ? p : args[args.indexOf(`--${n}`) + 1]);
const dir = arg("quadros-dir");
const foto = arg("foto");
const saida = arg("saida");
const fundirFinal = Number(arg("fusao-final", "6"));
const rampa = Number(arg("rampa", "8"));
const soFinal = args.includes("--so-final");

if (!dir || !foto || !saida || !existsSync(dir) || !existsSync(foto)) {
  console.error("uso: --quadros-dir <pasta NNN.png> --foto <still 4K> --saida <pasta> [--so-final] [--miolo x0,y0,x1,y1]");
  process.exit(1);
}

const quadros = readdirSync(dir).filter((f) => /^\d{3}\.png$/.test(f)).sort();
const N = quadros.length;
const W = 1920;
const H = 1080;

// As quatro telas na foto (coordenadas em 1920×1080, medidas em 15/09/2026):
// tela da parede, monitor da esquerda, monitor da direita, tela do notebook.
const TELAS = [
  { x0: 765, y0: 182, x1: 1070, y1: 362 },
  { x0: 685, y0: 355, x1: 820, y1: 565 },
  { x0: 1033, y0: 357, x1: 1165, y1: 567 },
  { x0: 840, y0: 475, x1: 1012, y1: 590 },
];
const MARGEM = 6;
const BORDA = 10;
// Região usada para alinhar e medir: o miolo da cena, longe do chão que reflete.
// No fechamento, passe a caixa do logo com `--miolo`.
const MIOLO = (() => {
  const m = arg("miolo");
  if (!m) return { x0: 560, y0: 120, x1: 1380, y1: 640 };
  const [x0, y0, x1, y1] = m.split(",").map(Number);
  return { x0, y0, x1, y1 };
})();

const cru = async (arquivo, w, h) =>
  (await sharp(arquivo).resize(w, h, { fit: "fill" }).removeAlpha().raw().toBuffer());

const cinza = (rgb, n) => {
  const g = new Float32Array(n);
  for (let i = 0; i < n; i++) g[i] = rgb[i * 3] * 0.299 + rgb[i * 3 + 1] * 0.587 + rgb[i * 3 + 2] * 0.114;
  return g;
};

const pw = 480;
const ph = 270;

/** Diferença média no miolo, com a foto escalada `s` e deslocada (dx, dy), em grade reduzida. */
function diferenca(gFoto, gQuadro, s, dx, dy) {
  const f = pw / W;
  const cx = pw / 2;
  const cy = ph / 2;
  let soma = 0;
  let n = 0;
  for (let y = Math.floor(MIOLO.y0 * f); y < MIOLO.y1 * f; y++) {
    for (let x = Math.floor(MIOLO.x0 * f); x < MIOLO.x1 * f; x++) {
      const sx = Math.round((x - cx - dx * f) / s + cx);
      const sy = Math.round((y - cy - dy * f) / s + cy);
      if (sx < 0 || sy < 0 || sx >= pw || sy >= ph) continue;
      soma += Math.abs(gFoto[sy * pw + sx] - gQuadro[y * pw + x]);
      n++;
    }
  }
  return soma / Math.max(1, n);
}

/** Busca grossa em volta de `c` (raio de escala `sR`, de deslocamento `pR`) e depois fina. */
function buscar(gFoto, gQuadro, c, { sR, sP, pR, pP }) {
  let m = { s: c.s, dx: c.dx, dy: c.dy, d: Infinity };
  for (let s = c.s - sR; s <= c.s + sR + 1e-9; s += sP) {
    for (let dx = c.dx - pR; dx <= c.dx + pR; dx += pP) {
      for (let dy = c.dy - pR; dy <= c.dy + pR; dy += pP) {
        const d = diferenca(gFoto, gQuadro, s, dx, dy);
        if (d < m.d) m = { s, dx, dy, d };
      }
    }
  }
  const g = { ...m };
  for (let s = g.s - 0.004; s <= g.s + 0.0041; s += 0.001) {
    for (let dx = g.dx - 2; dx <= g.dx + 2; dx += 0.5) {
      for (let dy = g.dy - 2; dy <= g.dy + 2; dy += 0.5) {
        const d = diferenca(gFoto, gQuadro, s, dx, dy);
        if (d < m.d) m = { s, dx, dy, d };
      }
    }
  }
  return m;
}

const fotoCheia = await cru(foto, W, H);

/** A foto transformada em resolução cheia (amostragem bilinear). */
function alinhar({ s, dx, dy }) {
  const out = Buffer.alloc(W * H * 3);
  const cx = W / 2;
  const cy = H / 2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const sx = (x - cx - dx) / s + cx;
      const sy = (y - cy - dy) / s + cy;
      const x0 = Math.max(0, Math.min(W - 2, Math.floor(sx)));
      const y0 = Math.max(0, Math.min(H - 2, Math.floor(sy)));
      const ax = Math.min(1, Math.max(0, sx - x0));
      const ay = Math.min(1, Math.max(0, sy - y0));
      for (let c = 0; c < 3; c++) {
        const p00 = fotoCheia[(y0 * W + x0) * 3 + c];
        const p10 = fotoCheia[(y0 * W + x0 + 1) * 3 + c];
        const p01 = fotoCheia[((y0 + 1) * W + x0) * 3 + c];
        const p11 = fotoCheia[((y0 + 1) * W + x0 + 1) * 3 + c];
        out[(y * W + x) * 3 + c] = (p00 * (1 - ax) + p10 * ax) * (1 - ay) + (p01 * (1 - ax) + p11 * ax) * ay;
      }
    }
  }
  return out;
}

const fundir = async (origem, destino, foto, a, mascara) => {
  const rgb = await cru(origem, W, H);
  const out = Buffer.alloc(W * H * 3);
  for (let p = 0; p < W * H; p++) {
    const k = mascara ? Math.max(a.tudo, a.telas * mascara[p]) : a.tudo;
    for (let c = 0; c < 3; c++) out[p * 3 + c] = rgb[p * 3 + c] * (1 - k) + foto[p * 3 + c] * k;
  }
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 6 }).toFile(destino);
};

// ── 1. alinhar ────────────────────────────────────────────────────────────
const gFotoP = cinza(await cru(foto, pw, ph), pw * ph);
const gDe = async (i) => cinza(await cru(path.join(dir, quadros[i]), pw, ph), pw * ph);
const inicio = { s: 1, dx: 0, dy: 0 };
const ultimo = soFinal
  ? buscar(gFotoP, await gDe(N - 1), inicio, { sR: 0.06, sP: 0.005, pR: 40, pP: 2 })
  : buscar(gFotoP, await gDe(N - 1), inicio, { sR: 0.03, sP: 0.005, pR: 24, pP: 2 });
const fmt = (m) => `escala ${m.s.toFixed(3)} · dx ${m.dx} · dy ${m.dy} · diferença ${m.d.toFixed(2)}`;
console.log(`alinhamento no último quadro: ${fmt(ultimo)}`);

rmSync(saida, { recursive: true, force: true });
mkdirSync(saida, { recursive: true });

if (soFinal) {
  // ── fechamento: um alinhamento por quadro, do último para trás ────────────
  const k0 = N - fundirFinal;
  const porQuadro = new Map([[N - 1, ultimo]]);
  for (let i = N - 2; i >= k0; i--) {
    const m = buscar(gFotoP, await gDe(i), porQuadro.get(i + 1), { sR: 0.012, sP: 0.002, pR: 8, pP: 1 });
    porQuadro.set(i, m);
    console.log(`  quadro ${i + 1}: ${fmt(m)}`);
  }
  for (let i = 0; i < N; i++) {
    const origem = path.join(dir, quadros[i]);
    const destino = path.join(saida, quadros[i]);
    if (i < k0) {
      copyFileSync(origem, destino);
      continue;
    }
    const t = (i - k0 + 1) / fundirFinal;
    await fundir(origem, destino, alinhar(porQuadro.get(i)), { tudo: t * t * (3 - 2 * t), telas: 0 });
  }
  console.log(`✅ ${N} quadros em ${saida} — logo da foto fundido nos últimos ${fundirFinal}, alinhado quadro a quadro`);
  process.exit(0);
}

const alinhada = alinhar(ultimo);

// Máscara das telas com borda suave.
const mascara = new Float32Array(W * H);
for (const t of TELAS) {
  const x0 = t.x0 - MARGEM;
  const y0 = t.y0 - MARGEM;
  const x1 = t.x1 + MARGEM;
  const y1 = t.y1 + MARGEM;
  for (let y = Math.max(0, y0 - BORDA); y < Math.min(H, y1 + BORDA); y++) {
    for (let x = Math.max(0, x0 - BORDA); x < Math.min(W, x1 + BORDA); x++) {
      const fora = Math.max(x0 - x, x - x1, y0 - y, y - y1, 0);
      const a = fora >= BORDA ? 0 : 1 - fora / BORDA;
      const i = y * W + x;
      if (a > mascara[i]) mascara[i] = a * a * (3 - 2 * a);
    }
  }
}

// ── 2. achar o quadro em que as telas assentaram ──────────────────────────
const difTelas = async (arquivo) => {
  const rgb = await cru(arquivo, W, H);
  let soma = 0;
  let n = 0;
  for (const t of TELAS) {
    for (let y = t.y0; y < t.y1; y += 2) {
      for (let x = t.x0; x < t.x1; x += 2) {
        const i = (y * W + x) * 3;
        soma += Math.abs(rgb[i] - alinhada[i]) + Math.abs(rgb[i + 1] - alinhada[i + 1]) + Math.abs(rgb[i + 2] - alinhada[i + 2]);
        n++;
      }
    }
  }
  return soma / (n * 3);
};
const referencia = await difTelas(path.join(dir, quadros[N - 1]));
let k0 = N - fundirFinal;
// `--telas-desde N` (base 1) fixa o quadro: depois do `fabrica-suavizar.py` as telas ainda
// deslizam até o fim do trecho, e a detecção por diferença não enxerga deslizamento de 25 px.
const telasDesde = arg("telas-desde");
if (telasDesde) k0 = Number(telasDesde) - 1;
else for (let i = Math.floor(N * 0.4); i < N; i++) {
  if ((await difTelas(path.join(dir, quadros[i]))) < referencia * 1.35 + 4) {
    k0 = i;
    break;
  }
}
console.log(`telas assentadas a partir do quadro ${k0 + 1} de ${N} (diferença de referência ${referencia.toFixed(1)})`);

// ── 3. compor ─────────────────────────────────────────────────────────────
for (let i = 0; i < N; i++) {
  const origem = path.join(dir, quadros[i]);
  const destino = path.join(saida, quadros[i]);
  const aTelas = i < k0 ? 0 : Math.min(1, (i - k0 + 1) / rampa);
  const aTudo = i < N - fundirFinal ? 0 : (i - (N - fundirFinal) + 1) / fundirFinal;
  if (aTelas === 0 && aTudo === 0) {
    copyFileSync(origem, destino);
    continue;
  }
  await fundir(origem, destino, alinhada, { tudo: aTudo, telas: aTelas }, mascara);
}
console.log(`✅ ${N} quadros em ${saida} — telas da foto a partir do ${k0 + 1}, quadro inteiro nos últimos ${fundirFinal}`);
