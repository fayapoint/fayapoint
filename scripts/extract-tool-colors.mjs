/**
 * Extrai a cor de marca de cada logo baixado.
 *
 * Por que cor e não imagem: as `og:image` que as empresas publicam têm 41
 * estilos diferentes — proporções, fundos claros e escuros, umas com texto
 * grande, outras sem. Numa grade lado a lado isso vira colcha de retalho, que
 * é exatamente o defeito que estamos consertando.
 *
 * O caminho que dá unidade sem apagar a identidade de cada ferramenta: o logo
 * (que é limpo e reconhecível) sobre um gradiente construído a partir da cor
 * dominante do próprio logo. Cada cartão fica com a cara da marca, e todos
 * ficam com a mesma linguagem.
 *
 * A cor sai em JSON e o gradiente é montado em CSS na hora de renderizar —
 * imagem composta ficaria pesada, borrada em tela retina e impossível de animar.
 *
 *   node scripts/extract-tool-colors.mjs
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const RAIZ = path.join(process.cwd(), "public", "ferramentaria");
const DIR_LOGO = path.join(RAIZ, "logos");

/** RGB → HSL, com H em graus e S/L em 0–100. */
function rgbParaHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return [h * 360, s * 100, l * 100];
}

/**
 * Cor dominante do logo, ignorando pixels que não dizem nada sobre a marca.
 *
 * Três filtros, cada um resolvendo um caso real que apareceu nos 54 logos:
 *
 * 1. **Transparência** — favicon quase sempre vem com fundo transparente. Sem
 *    filtrar alfa, a cor dominante de quase todos daria preto.
 * 2. **Cinzas** — logo preto-e-branco (OpenAI, Vercel, Hugging Face em parte)
 *    tem cinza como cor mais frequente. Cinza não é cor de marca; nesses casos
 *    é melhor devolver nulo e deixar a página usar a paleta da casa.
 * 3. **Quantização em blocos de 24** — sem agrupar, um degradê suave espalha a
 *    contagem por centenas de tons parecidos e nenhum vence.
 */
async function corDoLogo(arquivo) {
  const { data, info } = await sharp(arquivo)
    .resize(64, 64, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const contagem = new Map();
  const canais = info.channels;

  for (let i = 0; i < data.length; i += canais) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 200) continue; // 1. transparente

    const [, s, l] = rgbParaHsl(r, g, b);
    if (s < 18) continue; // 2. cinza / preto / branco
    if (l < 12 || l > 92) continue; // quase preto ou quase branco

    const chave = `${Math.round(r / 24)},${Math.round(g / 24)},${Math.round(b / 24)}`; // 3.
    const atual = contagem.get(chave) || { n: 0, r: 0, g: 0, b: 0 };
    atual.n += 1;
    atual.r += r;
    atual.g += g;
    atual.b += b;
    contagem.set(chave, atual);
  }

  if (contagem.size === 0) return null;

  const vencedor = [...contagem.values()].sort((a, b) => b.n - a.n)[0];
  const r = Math.round(vencedor.r / vencedor.n);
  const g = Math.round(vencedor.g / vencedor.n);
  const b = Math.round(vencedor.b / vencedor.n);
  const [h, s, l] = rgbParaHsl(r, g, b);

  return {
    hex: `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`,
    h: Math.round(h),
    s: Math.round(s),
    l: Math.round(l),
    pixels: vencedor.n,
  };
}

async function main() {
  const arquivos = (await readdir(DIR_LOGO)).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
  const manifesto = JSON.parse(await readFile(path.join(RAIZ, "manifesto.json"), "utf8"));

  let comCor = 0;
  for (const arquivo of arquivos.sort()) {
    const slug = arquivo.replace(/\.[^.]+$/, "");
    try {
      const cor = await corDoLogo(path.join(DIR_LOGO, arquivo));
      if (!manifesto[slug]) manifesto[slug] = { logo: arquivo, capa: null };
      manifesto[slug].cor = cor ? cor.hex : null;
      manifesto[slug].hsl = cor ? [cor.h, cor.s, cor.l] : null;
      if (cor) comCor++;
      console.log(
        `${slug.padEnd(22)} ${(cor?.hex ?? "— sem cor de marca").padEnd(20)} ${
          cor ? `h${cor.h} s${cor.s} l${cor.l}` : "usa paleta da casa"
        }`,
      );
    } catch (e) {
      console.log(`${slug.padEnd(22)} ERRO: ${e.message}`);
    }
  }

  await writeFile(path.join(RAIZ, "manifesto.json"), JSON.stringify(manifesto, null, 2));
  console.log(`\n${comCor}/${arquivos.length} com cor de marca extraída.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
