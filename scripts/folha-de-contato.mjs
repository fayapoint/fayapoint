/**
 * Monta folhas de contato das variantes de capa, para conferência em lote.
 *
 * ── Por que existe ─────────────────────────────────────────────────────────
 *
 * A conferência da capa não é opcional — o modelo escreve o título certo quase
 * sempre, e "quase" é o problema: uma capa com o título errado mente sobre o
 * produto na vitrine, e é o tipo de erro que ninguém revisa depois que subiu.
 * Mas abrir 44 imagens de 720×1040 uma a uma é caro e cansa, e conferência
 * cansada é conferência que passa erro.
 *
 * Esta folha põe várias capas lado a lado com o slug e o número da variante
 * carimbados, no tamanho em que ainda dá para ler o título gravado. Uma folha
 * responde por seis capas.
 *
 * ⚠️ O que se confere na folha, em ordem de gravidade:
 *   1. a GRAFIA do título (acento, cedilha, palavra inventada);
 *   2. o rodapé `fayai.com.br` — é a string mais frágil do prompt, porque o
 *      modelo tende a "corrigir" domínio para outro que já viu;
 *   3. o título reto e inteiro (nada cortado pela borda);
 *   4. o couro na cor certa e o livro separado do fundo.
 *
 *   node scripts/folha-de-contato.mjs                 # todas as variantes
 *   node scripts/folha-de-contato.mjs --por-folha 4   # menos capas, maiores
 *   node scripts/folha-de-contato.mjs --pasta scripts/_capas_livro
 */

import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const argv = process.argv.slice(2);
const flag = (n, padrao) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : padrao;
};

const PASTA = path.resolve(flag("pasta", "scripts/_capas_livro/_variantes"));
const SAIDA = path.join(PASTA, "_folhas");
const POR_FOLHA = Number(flag("por-folha", 6));

/**
 * A largura de cada miniatura.
 *
 * 340px é o menor tamanho em que o título gravado continua legível o bastante
 * para pegar um acento trocado. Abaixo disso a conferência vira palpite, que é
 * pior que não conferir — dá a sensação de ter conferido.
 */
const LARG = 340;
const ALT = Math.round((1040 / 720) * LARG); // mantém 3:4
const RODAPE = 26;
const COLUNAS = 3;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function main() {
  const arquivos = (await readdir(PASTA))
    .filter((f) => f.endsWith(".webp"))
    .sort();

  if (!arquivos.length) {
    console.log(`Nenhuma variante em ${PASTA}.`);
    return;
  }

  await mkdir(SAIDA, { recursive: true });
  const linhas = Math.ceil(POR_FOLHA / COLUNAS);
  const folhaL = COLUNAS * LARG;
  const folhaA = linhas * (ALT + RODAPE);

  const folhas = [];
  for (let i = 0; i < arquivos.length; i += POR_FOLHA) folhas.push(arquivos.slice(i, i + POR_FOLHA));

  for (const [n, grupo] of folhas.entries()) {
    const camadas = [];
    for (const [j, arq] of grupo.entries()) {
      const col = j % COLUNAS;
      const lin = Math.floor(j / COLUNAS);
      const x = col * LARG;
      const y = lin * (ALT + RODAPE);

      camadas.push({
        input: await sharp(path.join(PASTA, arq)).resize(LARG, ALT, { fit: "cover" }).toBuffer(),
        left: x,
        top: y,
      });

      // O nome carimbado embaixo de cada uma. Sem ele a folha vira um mural
      // bonito e inútil: ao achar um erro não dá para saber qual arquivo trocar.
      const rotulo = arq.replace(/\.webp$/, "");
      const svg = `<svg width="${LARG}" height="${RODAPE}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${LARG}" height="${RODAPE}" fill="#0b0d16"/>
        <text x="6" y="18" font-family="Consolas,monospace" font-size="13" fill="#8fe3d0">${esc(rotulo)}</text>
      </svg>`;
      camadas.push({ input: Buffer.from(svg), left: x, top: y + ALT });
    }

    const destino = path.join(SAIDA, `folha-${String(n + 1).padStart(2, "0")}.webp`);
    await sharp({
      create: { width: folhaL, height: folhaA, channels: 3, background: "#05060a" },
    })
      .composite(camadas)
      .webp({ quality: 90 })
      .toFile(destino);

    console.log(`${path.relative(process.cwd(), destino)}  (${grupo.length} capas)`);
  }

  console.log(`\n${arquivos.length} variante(s) em ${folhas.length} folha(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
