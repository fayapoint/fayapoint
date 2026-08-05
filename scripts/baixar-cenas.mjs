/**
 * Baixa as cenas geradas no Higgsfield e as deixa prontas para o site.
 *
 * ── Por que este script existe ─────────────────────────────────────────────
 *
 * O passo do download era o que travava a produção de arte. Extrair as URLs
 * assinadas pelo JavaScript da página do Higgsfield é bloqueado, e o diálogo
 * nativo de "Salvar como" do Windows engole os cliques seguintes — uma imagem
 * baixada por vez, à mão, com o navegador refém.
 *
 * A saída é o MCP: `show_generations` devolve `results.rawUrl` do CloudFront e
 * é uma LEITURA — não custa crédito nenhum. Gera-se na interface web (onde o
 * `Unlimited` vale) e baixa-se por aqui.
 *
 * ── Uso ────────────────────────────────────────────────────────────────────
 *
 *   node scripts/baixar-cenas.mjs <mapa.tsv> <pasta-destino>
 *
 * O TSV é `nome<TAB>url`, uma linha por peça. O `nome` vira o arquivo final.
 *
 * ── O que ele faz com a imagem ─────────────────────────────────────────────
 *
 * O PNG do CloudFront tem 1376×768 e ~2 MB. Na página de venda ele aparece
 * dentro de uma coluna de no máximo 896px, então servir 1376 já é folga de
 * sobra para tela retina — e webp a 82 corta o peso em mais de vinte vezes.
 * Um site de cursos que carrega 3 imagens de 2 MB por página de produto perde
 * a venda antes de a primeira dobra desenhar.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const [, , mapa, destino] = process.argv;
if (!mapa || !destino) {
  console.error("uso: node scripts/baixar-cenas.mjs <mapa.tsv> <pasta-destino>");
  process.exit(1);
}

mkdirSync(destino, { recursive: true });

const linhas = readFileSync(mapa, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => l.split("\t"));

let ok = 0;
const falhas = [];

for (const [nome, url] of linhas) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const png = Buffer.from(await r.arrayBuffer());
    const saida = join(destino, `${nome}.webp`);
    const info = await sharp(png)
      .resize({ width: 1376, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(saida);
    console.log(
      `${nome}  ${info.width}×${info.height}  ${(png.length / 1024 / 1024).toFixed(2)} MB → ${(info.size / 1024).toFixed(0)} KB`,
    );
    ok++;
  } catch (e) {
    console.error(`FALHOU ${nome}: ${e.message}`);
    falhas.push(nome);
  }
}

console.log(`\n${ok}/${linhas.length} baixadas em ${destino}`);
if (falhas.length) {
  console.log("faltaram:", falhas.join(", "));
  process.exitCode = 1;
}
