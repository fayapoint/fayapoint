/**
 * O elo que faltava: leva a mídia gerada no ComfyUI para `public/cursos/media/`.
 *
 * ## Por que existe
 *
 * 16/08/2026. O pipeline de mídia inline dos cursos tinha as duas pontas e não
 * tinha o meio:
 *
 *   scripts/cursos/generate_course_inline_media*.py   → PNG + MP4 no ComfyUI
 *   ???                                               → ninguém
 *   scripts/cursos/insert-course-inline-markers.cjs   → marcadores no Mongo
 *
 * O `otimizar-arte.mjs` parecia ser esse meio, mas ele é fixo em
 * `public/inventando/arte` e não toca em vídeo. Os 6 cursos que já têm mídia
 * foram convertidos à mão, e o passo não ficou registrado em lugar nenhum — a
 * próxima sessão gerava 2.500 arquivos e eles morriam na pasta do ComfyUI.
 *
 * ## O contrato de nomes
 *
 * O ComfyUI numera e sufixa:      cap01-sistema_00001_.png
 *                                 cap01-fluxo-video_00001_.mp4
 * O leitor do site espera:        cap01-sistema.webp
 *                                 cap01-fluxo.webm  +  cap01-fluxo.webp
 *
 * ⚠️ O `poster` do vídeo NÃO é um quadro extraído: é a própria imagem base que
 * gerou o vídeo (`fluxo` e `dica` existem como imagem E como vídeo). Extrair um
 * quadro do MP4 dá um poster levemente diferente do primeiro frame e a troca
 * pisca na tela quando o vídeo começa.
 *
 * ⚠️ Quando há várias gerações do mesmo slot, vence a MAIS RECENTE — é o mesmo
 * critério do gerador, que refaz um slot reprovado sem apagar o anterior.
 *
 *   node scripts/cursos/publicar-midia-curso.mjs <slug>            (dry-run)
 *   node scripts/cursos/publicar-midia-curso.mjs <slug> --apply
 */
import { readdir, mkdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const execFileP = promisify(execFile);

const SLUG = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!SLUG) {
  console.error("Uso: node scripts/cursos/publicar-midia-curso.mjs <slug> [--apply]");
  process.exit(1);
}

const SRC = path.join("C:/WORKS/ComfyUI/output/course_media", SLUG, "inline");

// ⚠️ NÃO usar `process.cwd()`. Este script vive em fayapoint-ai/scripts/cursos/,
// mas é natural chamá-lo da raiz do `autoresearch` (é de lá que se roda o
// planejador). Com `cwd` o destino virava `autoresearch/public/…` — fora do
// repo do site, invisível para o build, e a falha é SILENCIOSA: o script diz
// "OK 180" e os arquivos ficam num lugar que o deploy nunca vê.
// Aconteceu em 17/08/2026, com 180 arquivos.
const RAIZ_SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEST = path.join(RAIZ_SITE, "public", "cursos", "media", SLUG, "inline");

const QUALIDADE_WEBP = 82; // mesmo número do otimizar-arte.mjs, já aprovado na capa

/** `cap01-sistema_00001_.png` → `cap01-sistema` · `cap01-fluxo-video_2_.mp4` → `cap01-fluxo` */
function slotDe(arquivo) {
  const semExt = arquivo.replace(/\.(png|mp4)$/i, "");
  const semContador = semExt.replace(/_\d+_?$/, "");
  return semContador.replace(/-video$/, "");
}

/** Entre várias gerações do mesmo slot, a mais recente por mtime. */
async function maisRecentePorSlot(arquivos, dir) {
  const porSlot = new Map();
  for (const f of arquivos) {
    const slot = slotDe(f);
    const m = (await stat(path.join(dir, f))).mtimeMs;
    const atual = porSlot.get(slot);
    if (!atual || m > atual.mtime) porSlot.set(slot, { arquivo: f, mtime: m });
  }
  return porSlot;
}

async function main() {
  if (!existsSync(SRC)) {
    console.error(`Nada gerado ainda: ${SRC} não existe.`);
    process.exit(1);
  }
  const todos = await readdir(SRC);
  const pngs = todos.filter((f) => f.toLowerCase().endsWith(".png"));
  const mp4s = todos.filter((f) => f.toLowerCase().endsWith(".mp4"));

  const imagens = await maisRecentePorSlot(pngs, SRC);
  const videos = await maisRecentePorSlot(mp4s, SRC);

  console.log(`${SLUG}: ${imagens.size} imagens · ${videos.size} vídeos em ${SRC}`);

  // Um vídeo sem a imagem de mesmo nome ficaria sem poster e o marcador
  // apontaria para um .webp inexistente — exatamente o defeito de
  // `reference_midia_caminho_placeholder`. Melhor não publicar do que publicar
  // quebrado.
  const orfaos = [...videos.keys()].filter((s) => !imagens.has(s));
  if (orfaos.length) {
    console.log(`⚠️  ${orfaos.length} vídeo(s) sem imagem base (ficariam sem poster): ${orfaos.join(", ")}`);
  }

  const plano = [];
  for (const [slot, { arquivo }] of imagens) plano.push({ tipo: "img", slot, de: arquivo, para: `${slot}.webp` });
  for (const [slot, { arquivo }] of videos) {
    if (!imagens.has(slot)) continue;
    plano.push({ tipo: "video", slot, de: arquivo, para: `${slot}.webm` });
  }

  const jaTem = plano.filter((p) => existsSync(path.join(DEST, p.para)));
  const aFazer = plano.filter((p) => !existsSync(path.join(DEST, p.para)));

  console.log(`${APPLY ? "PUBLICANDO" : "DRY-RUN"} | a converter: ${aFazer.length} | já em public/: ${jaTem.length}`);
  if (!APPLY) {
    for (const p of aFazer.slice(0, 6)) console.log(`   ${p.de}  →  ${p.para}`);
    if (aFazer.length > 6) console.log(`   … e mais ${aFazer.length - 6}`);
    return;
  }

  await mkdir(DEST, { recursive: true });
  let ok = 0, erro = 0;
  for (const p of aFazer) {
    try {
      if (p.tipo === "img") {
        await sharp(path.join(SRC, p.de)).webp({ quality: QUALIDADE_WEBP }).toFile(path.join(DEST, p.para));
      } else {
        // ⚠️ Perfil medido com ffprobe na biblioteca no ar (ia-producao,
        // rag-knowledge): VP9, **960 de largura, 25 fps, sem faixa de áudio**.
        // Sem casar largura e fps o clipe sai com várias vezes o peso dos
        // vizinhos — e o `-an` não é descuido: vídeo inline não tem áudio.
        await execFileP("ffmpeg", [
          "-y", "-loglevel", "error",
          "-i", path.join(SRC, p.de),
          "-vf", "scale=960:-2,fps=25",
          "-c:v", "libvpx-vp9", "-crf", "36", "-b:v", "0", "-an",
          "-row-mt", "1",
          path.join(DEST, p.para),
        ]);
      }
      ok++;
      if (ok % 10 === 0) console.log(`   ${ok}/${aFazer.length}`);
    } catch (e) {
      erro++;
      console.error(`   FALHA ${p.de}: ${String(e.message).slice(0, 160)}`);
    }
  }

  const finais = (await readdir(DEST)).filter((f) => /\.(webp|webm)$/.test(f));
  await writeFile(
    path.join(DEST, "..", `${SLUG}-publicacao.json`),
    JSON.stringify({ slug: SLUG, publicadoEm: new Date().toISOString(), convertidos: ok, falhas: erro, totalNaPasta: finais.length }, null, 1),
    "utf-8"
  );
  console.log(`\nOK ${ok} · falhas ${erro} · ${finais.length} arquivos em public/cursos/media/${SLUG}/inline/`);
  console.log("Próximo: deploy (os arquivos precisam estar no ar ANTES) e então");
  console.log(`  node --env-file=.env.local scripts/cursos/insert-course-inline-markers.cjs ${SLUG} --apply`);
}

main().catch((e) => { console.error(e); process.exit(1); });
