/**
 * Rasteriza a família da marca a partir dos SVG — PNG do PWA, ícone da Apple,
 * o `.ico` de sempre e o ativo com fundo das faturas.
 *
 * ## Por que um segundo script
 *
 * `scripts/logo-svg.py` é quem sabe TIPOGRAFIA (fontTools abre a Inter e tira
 * os contornos). Este aqui é quem sabe PIXEL (sharp/librsvg desenha e comprime).
 * Separados, cada um tem uma dependência só, e regerar o PNG não exige Python.
 *
 * A ordem importa: rode o Python primeiro, este depois. Ele lê os SVG do
 * disco — se eles estiverem velhos, os PNG saem velhos junto.
 *
 * ## O `.ico` escrito na mão
 *
 * `sharp` não escreve ICO, e uma dependência nova só para isso não se paga. O
 * formato aceita PNG embutido desde o IE11: cabeçalho de 6 bytes, uma entrada
 * de 16 bytes por tamanho, e os PNG colados no fim. São 30 linhas e nenhum
 * pacote a mais.
 *
 * Rodar:  node scripts/marca-rasterizar.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";

const RAIZ = process.cwd();

const svg = (caminho) => readFile(`${RAIZ}/${caminho}`);

/**
 * A densidade que faz o SVG render sair com ~2x o alvo — e nem um pixel a mais.
 *
 * O librsvg desenha na razão `densidade/96` do viewBox. Uma densidade fixa alta
 * funciona no símbolo (viewBox 512) e estoura no letreiro (viewBox 5781): 384
 * pedia um raster de 23.000 px de largura, e o sharp recusa por limite de
 * pixels. Aqui a conta sai do próprio arquivo.
 */
function densidadePara(conteudo, larguraAlvo) {
  const vb = String(conteudo).match(/viewBox="([\d.\s-]+)"/);
  const largura = vb ? parseFloat(vb[1].trim().split(/\s+/)[2]) : 512;
  return Math.max(24, Math.min(1200, (96 * larguraAlvo * 2) / largura));
}

async function png(entrada, saida, lado, opcoes = {}) {
  const { largura = lado, altura = lado ?? null, fundo = null } = opcoes;
  // `altura: null` deixa o sharp deduzir pela proporção do SVG — é como o
  // letreiro sai sem eu ter de repetir aqui a conta do viewBox.
  const conteudo = await svg(entrada);
  let img = sharp(conteudo, { density: densidadePara(conteudo, largura) }).resize(largura, altura, {
    fit: "contain",
    background: fundo ?? { r: 0, g: 0, b: 0, alpha: 0 },
  });
  if (fundo) img = img.flatten({ background: fundo });
  const dados = await img.png({ compressionLevel: 9, palette: false }).toBuffer();
  await mkdir(dirname(`${RAIZ}/${saida}`), { recursive: true });
  await writeFile(`${RAIZ}/${saida}`, dados);
  console.log(`-> ${saida}  (${largura}x${altura}, ${dados.length} bytes)`);
  return dados;
}

/**
 * O ícone "maskable" do Android: o sistema recorta um círculo por cima, então
 * o desenho precisa caber na zona segura de 80% — sem esta folga o "Ai" perde
 * as pontas em telefone com ícone redondo.
 */
async function maskable(saida, lado = 512) {
  const marcaSvg = await svg("public/brand/fayai-marca.svg");
  const marca = await sharp(marcaSvg, { density: densidadePara(marcaSvg, lado) })
    .resize(Math.round(lado * 0.72), Math.round(lado * 0.72))
    .png()
    .toBuffer();
  const dados = await sharp({
    create: {
      width: lado,
      height: lado,
      channels: 4,
      background: { r: 12, g: 14, b: 29, alpha: 1 },
    },
  })
    .composite([{ input: marca, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(`${RAIZ}/${saida}`, dados);
  console.log(`-> ${saida}  (${lado}x${lado} maskable, ${dados.length} bytes)`);
}

/** Empacota PNGs num `.ico` (formato PNG-embutido, aceito por todo navegador atual). */
function empacotarIco(imagens) {
  const cabecalho = Buffer.alloc(6);
  cabecalho.writeUInt16LE(0, 0); // reservado
  cabecalho.writeUInt16LE(1, 2); // 1 = ícone
  cabecalho.writeUInt16LE(imagens.length, 4);

  let deslocamento = 6 + imagens.length * 16;
  const entradas = [];
  for (const { lado, dados } of imagens) {
    const e = Buffer.alloc(16);
    e.writeUInt8(lado >= 256 ? 0 : lado, 0); // 0 significa 256
    e.writeUInt8(lado >= 256 ? 0 : lado, 1);
    e.writeUInt8(0, 2); // paleta
    e.writeUInt8(0, 3); // reservado
    e.writeUInt16LE(1, 4); // planos
    e.writeUInt16LE(32, 6); // bits por pixel
    e.writeUInt32LE(dados.length, 8);
    e.writeUInt32LE(deslocamento, 12);
    entradas.push(e);
    deslocamento += dados.length;
  }
  return Buffer.concat([cabecalho, ...entradas, ...imagens.map((i) => i.dados)]);
}

async function ico(saida, lados = [16, 32, 48]) {
  const fonte = await svg("public/brand/fayai-marca.svg");
  const imagens = [];
  for (const lado of lados) {
    imagens.push({
      lado,
      dados: await sharp(fonte, { density: densidadePara(fonte, lado * 4) })
        .resize(lado, lado)
        .png({ compressionLevel: 9 })
        .toBuffer(),
    });
  }
  const dados = empacotarIco(imagens);
  await writeFile(`${RAIZ}/${saida}`, dados);
  console.log(`-> ${saida}  (${lados.join("/")}, ${dados.length} bytes)`);
}

async function main() {
  // Favicon clássico + o ícone que o iOS usa na tela de início (a Apple não
  // lê SVG e não respeita transparência — daí o quadrado navy).
  await ico("src/app/favicon.ico");
  await png("public/brand/fayai-marca.svg", "src/app/apple-icon.png", 180);

  // PWA / manifest.
  await png("public/brand/fayai-marca.svg", "public/brand/fayai-icone-192.png", 192);
  await png("public/brand/fayai-marca.svg", "public/brand/fayai-icone-512.png", 512);
  await maskable("public/brand/fayai-icone-maskable-512.png");

  // O quadrado para redes sociais e o bloco das faturas.
  await png("public/brand/fayai-marca.svg", "public/brand/fayai-logo-quadrado.png", 512);
  await png("public/brand/fayai-invoice-logo.svg", "public/brand/fayai-invoice-logo.png", null, {
    largura: 900,
    altura: 300,
  });
  // Letreiro solto em alta, para quem pede "manda o logo em PNG".
  await png("public/brand/fayai-logo.svg", "public/brand/fayai-logo.png", null, {
    largura: 1600,
    altura: null,
  });
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
