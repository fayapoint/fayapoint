#!/usr/bin/env node
/**
 * Liga o VÍDEO da aula ao capítulo — o campo irmão do audiobook.
 *
 * ## O que este script faz, e o que ele NÃO faz
 *
 * Ele **não sobe nada para o YouTube**. A subida exige a conta do Ricardo, e
 * conta é dele: o montador (`cursos/aula_em_video.mjs`) já deixa o MP4, a
 * miniatura e o pacote de título/descrição prontos em `outputs/aulas/<curso>/`,
 * e o `_publicar.md` é para colar. Depois de publicar como **não listado**,
 * este script grava o ID no capítulo e a lente passa a oferecer "assistir".
 *
 * ## Onde grava, e por que não em `media.video`
 *
 * Grava em `media.videoAula`, no MESMO documento do audiobook
 * (`mission-control.content-forge-chapters`, chave `courseSlug` + `capNN`) —
 * porque é lá que mora a `linhaDoTempo` que a lente segue, e o vídeo anda nessa
 * mesma régua (ele é montado a partir da mesma narração).
 *
 * ⚠️ `media.video` seria o campo "óbvio" e está errado: ele é lido pela rota
 * PÚBLICA `/api/courses/<slug>/media`, que desenha um player no topo do
 * capítulo. Gravar ali daria dois tocadores na mesma tela — o de cima sem lente
 * nenhuma — e no capítulo errado, porque aquela rota deduz o índice do sufixo
 * numérico do `chapterSlug` e o leitor tem uma "Apresentação" no índice 0.
 *
 * ## O portão
 *
 * Capítulo sem `media.audio.linhaDoTempo` é recusado: sem régua, o vídeo tocaria
 * e a lente ficaria parada — um defeito que não dá erro em lugar nenhum.
 *
 * Uso:
 *   node --env-file=.env.local scripts/publicar-video-aula.mjs --curso chatgpt-zero --capitulo 3 --youtube dQw4w9WgXcQ
 *   node --env-file=.env.local scripts/publicar-video-aula.mjs --curso chatgpt-zero --mapa videos.json --gravar
 *   node --env-file=.env.local scripts/publicar-video-aula.mjs --curso chatgpt-zero --capitulo 3 --url https://.../cap03.mp4 --gravar
 *
 * O `--mapa` é um JSON `{ "1": "<idOuUrlDoYouTube>", "2": "..." }` com o número
 * do capítulo como chave — o mesmo NN de `capNN.m4a` e de `capNN.mp4`.
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

import { MongoClient } from "mongodb";

const BANCO = "mission-control";
const COLECAO = "content-forge-chapters";

const arg = (n, p = null) => {
  const i = process.argv.indexOf(`--${n}`);
  if (i < 0) return p;
  const v = process.argv[i + 1];
  return !v || v.startsWith("--") ? true : v;
};

const GRAVAR = arg("gravar") === true;

/** Aceita o ID cru ou qualquer URL de YouTube — colar o link é o gesto natural. */
const YOUTUBE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)?([A-Za-z0-9_-]{11})(?:[?&].*)?$/;

function idDoYouTube(bruto) {
  const m = String(bruto).trim().match(YOUTUBE);
  return m ? m[1] : null;
}

async function principal() {
  const curso = arg("curso");
  if (!curso || curso === true) {
    console.error("uso: --curso <slug> (--capitulo <n> --youtube <id|url> | --mapa <arquivo.json>) [--gravar]");
    process.exit(2);
  }
  if (!process.env.MONGODB_URI) {
    console.error("falta MONGODB_URI — rode com --env-file=.env.local");
    process.exit(1);
  }

  // ── 1. O que publicar ────────────────────────────────────────────────────
  const pedidos = [];
  const mapa = arg("mapa");
  if (mapa && mapa !== true) {
    if (!existsSync(mapa)) { console.error(`não achei ${mapa}`); process.exit(1); }
    const dados = JSON.parse(await readFile(mapa, "utf8"));
    for (const [n, valor] of Object.entries(dados)) pedidos.push({ numero: Number(n), bruto: String(valor) });
  } else {
    const capitulo = Number(arg("capitulo", NaN));
    const yt = arg("youtube");
    const url = arg("url");
    if (!Number.isFinite(capitulo) || (!yt && !url)) {
      console.error("diga --capitulo <n> e --youtube <id|url> (ou --url <endereço do mp4>)");
      process.exit(2);
    }
    pedidos.push({ numero: capitulo, bruto: yt && yt !== true ? String(yt) : null, url: url && url !== true ? String(url) : null });
  }

  if (!GRAVAR) console.log("— ENSAIO — nada é gravado. Use --gravar.\n");

  const cliente = new MongoClient(process.env.MONGODB_URI);
  await cliente.connect();
  const colecao = cliente.db(BANCO).collection(COLECAO);

  let gravados = 0, recusados = 0;

  for (const p of pedidos) {
    const nn = String(p.numero).padStart(2, "0");
    const chapterSlug = `cap${nn}`;

    const doc = await colecao.findOne(
      { courseSlug: curso, chapterSlug },
      { projection: { "media.audio.linhaDoTempo.segundos": 1, "media.audio.publicId": 1, title: 1 } },
    );

    // ── O PORTÃO ──────────────────────────────────────────────────────────
    //
    // Sem linha do tempo o vídeo tocaria e a lente ficaria parada — sem erro,
    // sem aviso, e com o aluno achando que a leitura acompanhada quebrou.
    if (!doc?.media?.audio?.linhaDoTempo?.segundos) {
      console.log(`  cap${nn}  RECUSADO: sem linha do tempo no banco (rode publicar-audiobook.mjs antes)`);
      recusados++;
      continue;
    }

    const videoAula = p.url
      ? { fonte: "arquivo", url: p.url, titulo: doc.title ?? null, gravadoEm: new Date().toISOString() }
      : (() => {
          const id = idDoYouTube(p.bruto);
          if (!id) return null;
          return {
            fonte: "youtube",
            videoId: id,
            // Registrado para não se perder: se algum dia o vídeo virar público
            // ou for removido, é aqui que se descobre o que era esperado.
            listagem: "nao-listado",
            titulo: doc.title ?? null,
            gravadoEm: new Date().toISOString(),
          };
        })();

    if (!videoAula) {
      console.log(`  cap${nn}  RECUSADO: "${p.bruto}" não tem um ID de YouTube de 11 caracteres`);
      recusados++;
      continue;
    }

    const alvo = videoAula.fonte === "youtube" ? videoAula.videoId : videoAula.url;
    if (!GRAVAR) {
      console.log(`  [ensaio] cap${nn}  ${videoAula.fonte}: ${alvo}  (${doc.media.audio.linhaDoTempo.segundos}s de régua)`);
      continue;
    }

    await colecao.updateOne({ courseSlug: curso, chapterSlug }, { $set: { "media.videoAula": videoAula } });
    console.log(`  cap${nn}  ${videoAula.fonte}: ${alvo}  ✓`);
    gravados++;
  }

  await cliente.close();
  console.log(`\n${gravados} gravado(s), ${recusados} recusado(s).`);
  if (gravados) console.log("O leitor mostra 'Assistir' na barra da lente no próximo carregamento do capítulo.");
}

principal().catch((e) => { console.error(e); process.exit(1); });
