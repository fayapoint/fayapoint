/**
 * Varre `public/cursos/media/` e escreve o manifesto que o leitor usa.
 *
 * ## Por que um manifesto, e não um `fs.readdir` na rota
 *
 * A arte por capítulo mora em `public/`, que na Netlify é servido pela CDN — a
 * função serverless que responde `/api/courses/<slug>/media` **não enxerga esses
 * arquivos**. Uma checagem de sistema de arquivos em produção diria "não existe"
 * para 1.474 arquivos que existem. Então o inventário é feito aqui, na máquina
 * onde os arquivos estão, e vira um JSON que entra no bundle.
 *
 * Rode depois de acrescentar ou remover arte:
 *   node scripts/gerar-manifesto-media.mjs
 */
import { readdirSync, existsSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";

const RAIZ = path.join(process.cwd(), "public", "cursos", "media");
const SAIDA = path.join(process.cwd(), "src", "data", "curso-media-local.json");

if (!existsSync(RAIZ)) {
  console.error(`✗ ${RAIZ} não existe`);
  process.exit(1);
}

const manifesto = {};
let totalCapitulos = 0;
let totalArquivos = 0;

for (const slug of readdirSync(RAIZ)) {
  const dir = path.join(RAIZ, slug);
  if (!statSync(dir).isDirectory()) continue;

  const capitulos = {};

  // A abertura do capítulo, quando existe: `cap-07.webp`
  for (const f of readdirSync(dir)) {
    const m = f.match(/^cap-(\d+)\.webp$/);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    capitulos[n] = capitulos[n] || { papeis: {} };
    capitulos[n].abertura = f;
    totalArquivos++;
  }

  // As cenas de dentro: `cap07-fluxo.webp` e, às vezes, `cap07-fluxo.webm`
  const inline = path.join(dir, "inline");
  if (existsSync(inline)) {
    for (const f of readdirSync(inline)) {
      const m = f.match(/^cap(\d+)-([a-z]+)\.(webp|webm)$/);
      if (!m) continue;
      const [, num, papel, ext] = m;
      const n = parseInt(num, 10);
      capitulos[n] = capitulos[n] || { papeis: {} };
      const p = (capitulos[n].papeis[papel] = capitulos[n].papeis[papel] || {});
      if (ext === "webp") p.imagem = true;
      else p.loop = true;
      totalArquivos++;
    }
  }

  const n = Object.keys(capitulos).length;
  if (!n) continue;
  manifesto[slug] = capitulos;
  totalCapitulos += n;
  console.log(`✓ ${slug.padEnd(56)} ${String(n).padStart(3)} capítulos`);
}

writeFileSync(SAIDA, JSON.stringify(manifesto), "utf8");
const kb = (statSync(SAIDA).size / 1024).toFixed(1);
console.log(
  `\n${Object.keys(manifesto).length} cursos · ${totalCapitulos} capítulos · ${totalArquivos} arquivos → ${SAIDA} (${kb} KB)`,
);
