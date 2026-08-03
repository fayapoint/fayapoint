/**
 * Converte a arte gerada de PNG para WebP.
 *
 * O ComfyUI entrega PNG de 1,0–1,6 MB por peça. Dez peças são ~12 MB no
 * repositório e no pacote de build — e o Netlify cobra banda. WebP de
 * qualidade 82 corta isso para um décimo sem diferença visível numa capa que
 * ainda vai por baixo de um gradiente.
 *
 *   node scripts/otimizar-arte.mjs
 */

import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DIR = path.join(process.cwd(), "public", "inventando", "arte");

async function main() {
  const arquivos = (await readdir(DIR)).filter((f) => f.endsWith(".png"));
  if (!arquivos.length) {
    console.log("Nada para converter.");
    return;
  }

  let antes = 0;
  let depois = 0;

  for (const arquivo of arquivos) {
    const origem = path.join(DIR, arquivo);
    const destino = origem.replace(/\.png$/, ".webp");

    const tamanhoAntes = (await stat(origem)).size;
    await sharp(origem).webp({ quality: 82, effort: 5 }).toFile(destino);
    const tamanhoDepois = (await stat(destino)).size;

    antes += tamanhoAntes;
    depois += tamanhoDepois;

    // O PNG sai: manter os dois dobraria o peso do repositório sem servir a
    // ninguém — as páginas apontam para .webp.
    await unlink(origem);

    console.log(
      `${arquivo.padEnd(26)} ${(tamanhoAntes / 1024).toFixed(0).padStart(5)} KB → ${(tamanhoDepois / 1024).toFixed(0).padStart(4)} KB`,
    );
  }

  console.log(
    `\nTotal: ${(antes / 1024 / 1024).toFixed(1)} MB → ${(depois / 1024 / 1024).toFixed(1)} MB ` +
      `(${Math.round((1 - depois / antes) * 100)}% menor)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
