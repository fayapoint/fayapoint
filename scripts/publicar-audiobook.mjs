#!/usr/bin/env node
/**
 * Sobe o audiobook de um curso e liga o player que já existe no leitor.
 *
 * ## O que já estava pronto e não tinha o que servir
 *
 * `ChapterMediaHeader` no `CourseReaderPage` **já desenha um player** quando o
 * capítulo tem `media.audio.url`. A rota `/api/courses/<slug>/media` já lê esse
 * campo do `content-forge-chapters`. O que faltava era o áudio existir — a cota
 * de TTS acabou em abril (`public/audio/PRODUCTION_STATUS.md`) e a produção
 * parou em 34 arquivos. Com a voz local do Higgs isso deixou de ser um limite.
 *
 * ## ⛔ POR QUE ENTREGA AUTENTICADA, E NÃO URL PÚBLICA
 *
 * O audiobook é um degrau PAGO do Ateliê (`curso_narrado`, 70 créditos).
 * Cloudinary com `type: upload` devolve uma URL que qualquer um abre e baixa —
 * publicar assim é entregar o produto de graça, e o link vaza no primeiro
 * "compartilha aí". Por isso o áudio sobe como `type: authenticated`, que só
 * responde a URL ASSINADA e com prazo.
 *
 * O `media.audio` gravado no banco guarda o `publicId`, **não** uma URL pronta.
 * Quem transforma isso em link tocável é `/api/courses/<slug>/audiobook`, que
 * confere o acesso do aluno antes de assinar. Sem essa rota, o campo é inerte.
 *
 * Uso:
 *   node --env-file=.env.local scripts/publicar-audiobook.mjs --curso <slug>          # ensaio
 *   node --env-file=.env.local scripts/publicar-audiobook.mjs --curso <slug> --gravar
 *   node --env-file=.env.local scripts/publicar-audiobook.mjs --tudo --gravar
 */

import { readdirSync, statSync, existsSync, createReadStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { v2 as cloudinary } from "cloudinary";
import { MongoClient } from "mongodb";

const RAIZ = path.resolve(import.meta.dirname, "../..");
const SAIDA = path.join(RAIZ, "cursos/audio/saida");
const MANIFESTO = path.join(import.meta.dirname, "../src/data/audiobook-manifesto.json");

const BANCO = "mission-control";
const COLECAO = "content-forge-chapters";
const PASTA_CLOUD = "fayai/audiobooks";

/** O narrador de todo o acervo desde 02/09/2026. Ver `src/data/narradores.ts`. */
const NARRADOR = "ricardo";

const arg = (n, p = null) => {
  const i = process.argv.indexOf(`--${n}`);
  if (i < 0) return p;
  const v = process.argv[i + 1];
  return !v || v.startsWith("--") ? true : v;
};

const GRAVAR = arg("gravar") === true;

function capitulosProntos(curso) {
  const dir = path.join(SAIDA, curso);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /^cap\d+\.m4a$/.test(f))
    .sort()
    .map((f) => ({
      arquivo: path.join(dir, f),
      numero: Number(f.match(/\d+/)[0]),
      bytes: statSync(path.join(dir, f)).size,
    }));
}

function cursosComAudio() {
  if (!existsSync(SAIDA)) return [];
  return readdirSync(SAIDA).filter((d) => capitulosProntos(d).length > 0).sort();
}

function subir(arquivo, publicId) {
  return new Promise((ok, falhar) => {
    const fluxo = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",      // áudio entra como "video" no Cloudinary
        type: "authenticated",       // ⛔ não trocar: é o que impede o link aberto
        public_id: publicId,
        overwrite: true,
        invalidate: true,
      },
      (erro, res) => (erro ? falhar(erro) : ok(res)),
    );
    createReadStream(arquivo).pipe(fluxo);
  });
}

async function principal() {
  const alvo = arg("curso");
  const lista = arg("tudo") ? cursosComAudio() : alvo && alvo !== true ? [alvo] : null;
  if (!lista?.length) {
    console.log("diga --curso <slug> ou --tudo. Cursos com áudio pronto:", cursosComAudio().join(", ") || "(nenhum)");
    process.exit(2);
  }

  if (!GRAVAR) console.log("— ENSAIO — nada sobe e nada é gravado. Use --gravar.\n");

  if (GRAVAR) {
    for (const v of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "MONGODB_URI"]) {
      if (!process.env[v]) { console.error(`falta ${v} — rode com --env-file=.env.local`); process.exit(1); }
    }
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  const cliente = GRAVAR ? new MongoClient(process.env.MONGODB_URI) : null;
  if (cliente) await cliente.connect();
  const colecao = cliente?.db(BANCO).collection(COLECAO);

  const manifesto = existsSync(MANIFESTO)
    ? JSON.parse(await readFile(MANIFESTO, "utf8"))
    : { gerado: null, narrador: NARRADOR, cursos: {} };

  let subidos = 0, bytes = 0;

  for (const curso of lista) {
    const caps = capitulosProntos(curso);
    console.log(`\n${curso} — ${caps.length} capítulo(s), ${(caps.reduce((s, c) => s + c.bytes, 0) / 1e6).toFixed(1)} MB`);
    const feitos = [];

    for (const cap of caps) {
      const nn = String(cap.numero).padStart(2, "0");
      const publicId = `${PASTA_CLOUD}/${curso}/${NARRADOR}/cap${nn}`;
      const chapterSlug = `cap${nn}`;

      if (!GRAVAR) {
        console.log(`  [ensaio] cap${nn}  ${(cap.bytes / 1e6).toFixed(1)} MB → ${publicId}`);
        feitos.push(cap.numero);
        continue;
      }

      const r = await subir(cap.arquivo, publicId);
      bytes += cap.bytes; subidos++;

      // ── A LINHA DO TEMPO VAI NO PRÓPRIO DOCUMENTO ────────────────────────
      //
      // São ~13 KB por capítulo (menos de 5 MB no acervo inteiro), e guardá-la
      // aqui faz a lente funcionar com UMA busca: a mesma resposta que traz o
      // link assinado já traz onde cada frase começa. Subir como arquivo
      // separado no Cloudinary custaria uma segunda ida à rede, assinada
      // também, no meio da abertura da página.
      //
      // Ela NÃO é segredo — é o texto do capítulo, que o aluno já lê na tela.
      // O que precisa de assinatura é o áudio.
      const arquivoTempos = cap.arquivo.replace(/\.m4a$/, ".tempos.json");
      let linhaDoTempo = null;
      if (existsSync(arquivoTempos)) {
        linhaDoTempo = JSON.parse(await readFile(arquivoTempos, "utf8"));
      } else {
        console.log(`     (sem linha do tempo — a lente não vai seguir este capítulo)`);
      }

      // ⚠️ Grava o publicId, NUNCA `r.secure_url`. A URL que o Cloudinary
      // devolve aqui já vem assinada, mas com a assinatura da NOSSA chamada —
      // guardá-la no banco vazaria um link válido para quem lesse o documento.
      await colecao.updateOne(
        { courseSlug: curso, chapterSlug },
        {
          $set: {
            courseSlug: curso,
            chapterSlug,
            chapterNumber: cap.numero,
            "media.audio": {
              source: "cloudinary",
              publicId: r.public_id,
              tipoEntrega: "authenticated",
              narrador: NARRADOR,
              segundos: Math.round(r.duration ?? 0),
              bytes: cap.bytes,
              geradoEm: new Date().toISOString(),
              linhaDoTempo,
            },
          },
        },
        { upsert: true },
      );
      console.log(`  cap${nn}  ${(cap.bytes / 1e6).toFixed(1)} MB  ${Math.round(r.duration ?? 0)}s  ✓`);
      feitos.push(cap.numero);
    }

    manifesto.cursos[curso] = { narrador: NARRADOR, capitulos: feitos.sort((a, b) => a - b) };
  }

  if (GRAVAR) {
    manifesto.gerado = new Date().toISOString();
    await writeFile(MANIFESTO, JSON.stringify(manifesto, null, 2) + "\n", "utf8");
    console.log(`\nmanifesto: ${path.relative(RAIZ, MANIFESTO)}`);
    console.log(`${subidos} arquivo(s), ${(bytes / 1e6).toFixed(1)} MB`);
    console.log("\n⚠️ O manifesto é lido em tempo de BUILD (`narradores.ts`). Faça o deploy para o degrau 'Com audiobook' sair de 'em breve'.");
  }

  await cliente?.close();
}

principal().catch((e) => { console.error(e); process.exit(1); });
