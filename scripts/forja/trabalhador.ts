#!/usr/bin/env -S npx tsx
/**
 * O TRABALHADOR DA FORJA — o processo que roda na máquina do Ricardo.
 *
 * ## O desenho, em uma frase
 *
 * O site publica pedidos; este processo puxa, roda no ComfyUI, sobe o resultado
 * para o Cloudinary e devolve a URL. Nenhuma porta aberta na casa, nenhum
 * túnel, nenhum IP fixo — e com a máquina desligada os pedidos **esperam** em
 * vez de falharem.
 *
 * ## Por que ele é burro de propósito
 *
 * Ele não sabe o que é persona, personagem, crédito ou peça. Recebe um id de
 * grafo e um punhado de parâmetros já compostos, monta o workflow com o MESMO
 * motor que o site usou para compor, e executa. Toda a inteligência mora no
 * site, e é por isso que este arquivo pode ser reiniciado, movido de máquina ou
 * duplicado sem que nada do produto mude.
 *
 * ## As quatro coisas que ele faz e que não são óbvias
 *
 * 1. **Confirma que COMEÇOU.** A reserva vem com prazo de um minuto; só depois
 *    do `comecei` o aluguel vira o prazo de verdade. Um trabalhador que morre
 *    entre pegar e começar devolve o trabalho em um minuto, e não em vinte.
 * 2. **Bate o coração enquanto espera.** Um vídeo leva doze minutos; sem o
 *    `vivo` periódico o aluguel venceria no meio e outro trabalhador pegaria o
 *    mesmo trabalho — a GPU competindo consigo mesma.
 * 3. **Libera a VRAM ao trocar de família de modelo.** São 16 GB de placa e o
 *    LTX 2.5 sozinho tem 20 GB de pesos. Encadear vídeo depois de Qwen sem
 *    liberar estoura no meio da segunda passada.
 * 4. **Nunca deixa um trabalho pendurado.** Toda saída do laço passa por
 *    `concluir` — inclusive a de erro. Um trabalho sem conclusão fica preso até
 *    o aluguel vencer, e o aluguel do vídeo é de 25 minutos.
 *
 * Uso:
 *   npx tsx scripts/forja/trabalhador.ts
 *   npx tsx scripts/forja/trabalhador.ts --uma-vez     (roda o que houver e sai)
 *   npx tsx scripts/forja/trabalhador.ts --seco        (não sobe nada, só mostra)
 *
 * Ambiente (em `.env.forja` ao lado, ou no ambiente do processo):
 *   FORJA_SITE            https://fayai.com.br
 *   FORJA_WORKER_SECRET   o mesmo segredo do site
 *   COMFY_URL             http://127.0.0.1:8000
 *   CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
 */

import { hostname } from "node:os";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";

import { montarGrafo, type IdGrafo } from "../../src/lib/forja/engine/comfy/grafos";
import {
  saude,
  submeter,
  esperar,
  estado,
  baixar,
  enviarImagemDaUrl,
  liberarMemoria,
  type Cliente,
} from "../../src/lib/forja/engine/comfy/cliente";
import { ALUGUEL_SEGUNDOS, type TipoDeTrabalho } from "../../src/lib/forja/engine/fila";

// ─────────────────────────────────────────────────────────────────────
// Ambiente
// ─────────────────────────────────────────────────────────────────────

const AQUI = dirname(fileURLToPath(import.meta.url));

/**
 * Lê o `.env.forja` sem depender de `dotenv`.
 *
 * O trabalhador roda solto, fora do Next, e às vezes de dentro de uma tarefa do
 * Windows — onde `npm` e o `node_modules` do projeto podem não estar no caminho
 * que se espera. Um leitor de dez linhas remove essa dependência inteira.
 */
function carregarEnv() {
  for (const nome of [".env.forja", "../.env.forja", "../../.env.forja"]) {
    const caminho = join(AQUI, nome);
    if (!existsSync(caminho)) continue;
    for (const linha of readFileSync(caminho, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(linha);
      if (!m) continue;
      const valor = m[2].replace(/^["']|["']$/g, "");
      if (!process.env[m[1]]) process.env[m[1]] = valor;
    }
    console.log(`ambiente: ${caminho}`);
    return;
  }
}
carregarEnv();

const SITE = (process.env.FORJA_SITE || "https://fayai.com.br").replace(/\/$/, "");
const SEGREDO = process.env.FORJA_WORKER_SECRET || "";
const COMFY: Cliente = { servidor: process.env.COMFY_URL || "http://127.0.0.1:8000" };
const EU = process.env.FORJA_TRABALHADOR || `${hostname()}-gpu`;

const A = process.argv.slice(2);
const UMA_VEZ = A.includes("--uma-vez");
const SECO = A.includes("--seco");

const PAUSA_VAZIA_MS = 8000;
const PAUSA_ERRO_MS = 30000;
const BATIMENTO_MS = 45000;

if (!SEGREDO || SEGREDO.length < 16) {
  console.error("Falta FORJA_WORKER_SECRET (mínimo 16 caracteres). Ponha em .env.forja ao lado deste arquivo.");
  process.exit(2);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const temCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// ─────────────────────────────────────────────────────────────────────
// Conversa com o site
// ─────────────────────────────────────────────────────────────────────

/**
 * ⚠️ O `User-Agent` é OBRIGATÓRIO, e a razão não é etiqueta.
 *
 * O site tem detecção de robô, e `BAD_BOT_PATTERNS` (em `lib/bot-detection.ts`)
 * derruba com 403 tudo que se anuncia como `curl/`, `axios`, `node-fetch`,
 * `python-requests` e companhia. O `fetch` do Node hoje não manda UA nenhum e
 * por isso passa — o que é sorte, não desenho: basta a lista ganhar uma regra
 * de "sem UA" para o trabalhador parar de puxar serviço, em silêncio, e a fila
 * encher sem ninguém entender por quê.
 *
 * Um UA próprio e reconhecível resolve os dois lados: passa pela detecção por
 * mérito e aparece identificado no log de acesso da Netlify.
 */
const MEU_UA = "FayAI-Forja-Trabalhador/1.0 (+https://fayai.com.br)";

async function aoSite<T>(acao: string, corpo: Record<string, unknown> = {}): Promise<T> {
  const r = await fetch(`${SITE}/api/forja/trabalhador`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forja-segredo": SEGREDO,
      "User-Agent": MEU_UA,
    },
    body: JSON.stringify({ acao, trabalhador: EU, ...corpo }),
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`site respondeu ${r.status}: ${texto.slice(0, 400)}`);
  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new Error(`site respondeu algo que não é JSON: ${texto.slice(0, 200)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Cloudinary
// ─────────────────────────────────────────────────────────────────────

const PASTA_LOCAL = join(AQUI, "_saidas");

/**
 * Sobe o resultado e devolve a URL pública.
 *
 * ⚠️ `resource_type: "video"` para mp4. Mandar vídeo como `image` faz o
 * Cloudinary aceitar, guardar e servir um arquivo que nenhum `<video>` toca —
 * e o defeito só aparece na tela de quem gerou.
 *
 * Sem credenciais (ou com `--seco`), grava em disco e devolve o caminho. Serve
 * para testar o laço inteiro sem tocar em nada de produção.
 */
async function publicar(dados: Uint8Array, nome: string, ehVideo: boolean): Promise<{ url: string; bytes: number }> {
  if (SECO || !temCloudinary) {
    mkdirSync(PASTA_LOCAL, { recursive: true });
    const caminho = join(PASTA_LOCAL, nome);
    writeFileSync(caminho, dados);
    return { url: `file://${caminho}`, bytes: dados.byteLength };
  }

  const base64 = Buffer.from(dados).toString("base64");
  const tipo = ehVideo ? "video/mp4" : "image/png";
  const r = await cloudinary.uploader.upload(`data:${tipo};base64,${base64}`, {
    folder: "forja",
    resource_type: ehVideo ? "video" : "image",
    public_id: nome.replace(/\.[^.]+$/, ""),
    overwrite: true,
  });
  return { url: r.secure_url, bytes: r.bytes || dados.byteLength };
}

// ─────────────────────────────────────────────────────────────────────
// O trabalho
// ─────────────────────────────────────────────────────────────────────

interface TrabalhoRecebido {
  _id: string;
  tipo: TipoDeTrabalho;
  grafo: string;
  params: Record<string, unknown>;
  referencias?: Array<{ url: string; comoNome: string }>;
  rotulo: string;
  segundosEstimados: number;
}

/** A família do modelo do trabalho anterior — para saber quando limpar a VRAM. */
let familiaAnterior = "";

function familiaDe(grafo: string): string {
  if (grafo === "ltx25") return "video";
  if (grafo === "qwen-edit" || grafo === "qwen-2512") return "qwen";
  return grafo;
}

async function executar(t: TrabalhoRecebido): Promise<void> {
  const inicio = Date.now();
  const ehVideo = t.tipo === "video";
  let batimento: ReturnType<typeof setInterval> | undefined;

  try {
    console.log(`\n▶ ${t.rotulo}  [${t.tipo}/${t.grafo}]  ~${t.segundosEstimados}s`);

    await aoSite("comecei", { trabalhoId: t._id });
    batimento = setInterval(() => {
      aoSite("vivo", { trabalhoId: t._id }).catch(() => {});
    }, BATIMENTO_MS);

    // 1 — a VRAM, quando a família muda
    const familia = familiaDe(t.grafo);
    if (familiaAnterior && familiaAnterior !== familia) {
      console.log("  · liberando a VRAM (mudou de família de modelo)");
      await liberarMemoria(COMFY);
    }
    familiaAnterior = familia;

    // 2 — as referências vão para o input/ do ComfyUI
    for (const ref of t.referencias || []) {
      if (!/^https:\/\//.test(ref.url)) {
        throw new Error(`referência recusada (só https): ${ref.url.slice(0, 80)}`);
      }
      const nome = await enviarImagemDaUrl(COMFY, ref.url, ref.comoNome);
      console.log(`  · referência: ${nome}`);
    }

    // 3 — o grafo, montado pelo MESMO motor que o site usou para compor
    const { montado, aviso } = montarGrafo(t.grafo as IdGrafo, t.params as never);
    if (aviso) console.log(`  ⚠ ${aviso}`);

    // 4 — executar
    const { promptId } = await submeter(COMFY, montado.grafo, `forja-${EU}`);
    console.log(`  · na GPU: ${promptId}`);

    const fim = await esperar(COMFY, promptId, {
      limiteSegundos: ALUGUEL_SEGUNDOS[t.tipo] - 60,
      intervaloMs: ehVideo ? 5000 : 2000,
    });

    if (fim.fase !== "pronto") {
      throw new Error(fim.fase === "erro" ? fim.mensagem : `o ComfyUI terminou em "${fim.fase}"`);
    }

    // 5 — publicar. O primeiro arquivo é o resultado; um segundo (se houver) é
    // a miniatura que alguns nós de vídeo publicam junto.
    const principal = fim.arquivos.find((a) => (ehVideo ? /\.(mp4|webm|mkv)$/i.test(a.filename) : true)) || fim.arquivos[0];
    const dados = await baixar(COMFY, principal);
    const { url, bytes } = await publicar(dados, `${t._id}_${principal.filename}`, ehVideo);
    console.log(`  · publicado: ${url.slice(0, 100)}  (${Math.round(bytes / 1024)} KB)`);

    clearInterval(batimento);
    const segundosReais = Math.round((Date.now() - inicio) / 1000);

    await aoSite("concluir", {
      trabalhoId: t._id,
      ok: true,
      segundosReais,
      resultado: {
        url,
        bytes,
        largura: Number(t.params.largura) || undefined,
        altura: Number(t.params.altura) || undefined,
        semente: Number(t.params.seed) || undefined,
        duracaoMs: ehVideo && t.params.comprimento && t.params.fps
          ? Math.round(((Number(t.params.comprimento) - 1) / Number(t.params.fps)) * 1000)
          : undefined,
      },
    });
    console.log(`✓ ${t.rotulo} em ${segundosReais}s`);
  } catch (e) {
    clearInterval(batimento);
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`✗ ${t.rotulo}: ${msg.slice(0, 500)}`);
    /**
     * ⚠️ A conclusão de ERRO é obrigatória. Sem ela o trabalho fica preso até o
     * aluguel vencer — e o aluguel do vídeo é de 25 minutos, tempo em que a
     * pessoa já recarregou a página quinze vezes e concluiu que o site está
     * quebrado.
     */
    await aoSite("concluir", { trabalhoId: t._id, ok: false, erro: msg.slice(0, 900) }).catch((e2) => {
      console.error("  e nem consegui avisar o site:", e2 instanceof Error ? e2.message : e2);
    });
  }
}

// ─────────────────────────────────────────────────────────────────────
// O laço
// ─────────────────────────────────────────────────────────────────────

/**
 * Já soltei a VRAM nesta rodada de ócio?
 *
 * Sem esta trava, uma fila com trabalho que este trabalhador REALMENTE não pode
 * atender (outra máquina, outro tipo) viraria um laço apertado de `/free` — a
 * GPU limpando memória que já estava limpa, para sempre.
 */
let liberouAgora = false;

let parando = false;
process.on("SIGINT", () => {
  console.log("\nencerrando depois do trabalho atual…");
  parando = true;
});

async function laco() {
  console.log(`Forja — trabalhador "${EU}"`);
  console.log(`  site:   ${SITE}`);
  console.log(`  comfy:  ${COMFY.servidor}`);
  console.log(`  saída:  ${SECO || !temCloudinary ? `disco (${PASTA_LOCAL})` : "Cloudinary"}`);

  while (!parando) {
    const s = await saude(COMFY);
    if (!s.ok) {
      console.error(`ComfyUI fora do ar (${s.erro}). Nova tentativa em ${PAUSA_ERRO_MS / 1000}s.`);
      if (UMA_VEZ) break;
      await new Promise((r) => setTimeout(r, PAUSA_ERRO_MS));
      continue;
    }

    let lote: { trabalhos: TrabalhoRecebido[]; esperando: number };
    try {
      lote = await aoSite<{ trabalhos: TrabalhoRecebido[]; esperando: number }>("reservar", {
        quantos: 1,
        vramLivre: s.vramLivre,
      });
    } catch (e) {
      console.error(`não consegui falar com o site: ${e instanceof Error ? e.message : e}`);
      if (UMA_VEZ) break;
      await new Promise((r) => setTimeout(r, PAUSA_ERRO_MS));
      continue;
    }

    if (!lote.trabalhos.length) {
      /**
       * ⚠️ FILA VAZIA E FILA BLOQUEADA SÃO COISAS DIFERENTES.
       *
       * O site recusa entregar VÍDEO a uma máquina sem VRAM livre (o LTX estoura
       * na segunda passada, que é o pior momento: depois de quatro minutos de
       * trabalho feito). Mas os pesos do trabalho ANTERIOR continuam residentes,
       * e o trabalhador só libera a VRAM quando TROCA de família de modelo —
       * o que ele nunca faz, porque não conseguiu pegar o trabalho.
       *
       * Travamento medido em 27/08/2026: um clipe ficou em `esperando` para
       * sempre, com a GPU parada e o trabalhador dizendo "fila vazia".
       *
       * A saída é o próprio ócio: se não veio trabalho MAS há gente esperando,
       * o problema não é falta de serviço — é falta de memória. Solta os pesos
       * (a GPU está parada de qualquer jeito, então não custa nada) e tenta de
       * novo na mesma volta.
       */
      if (lote.esperando > 0 && !liberouAgora) {
        console.log(`  · ${lote.esperando} esperando e nada para mim: soltando a VRAM e tentando de novo`);
        await liberarMemoria(COMFY);
        /**
         * ⚠️ A pausa não é supersticiosa. O ComfyUI roda com
         * `cudaMallocAsync`: o `/free` devolve na hora, mas a memória só
         * aparece livre no `/system_stats` alguns segundos depois. Sem esperar,
         * a releitura da saúde vê o número velho, o site recusa de novo, e o
         * conserto vira um laço que não conserta nada.
         */
        await new Promise((r) => setTimeout(r, 4000));
        familiaAnterior = "";
        liberouAgora = true;
        continue;
      }
      liberouAgora = false;

      await aoSite("ocioso").catch(() => {});
      if (UMA_VEZ) {
        console.log(lote.esperando > 0 ? `fila com ${lote.esperando} que não são para mim.` : "fila vazia.");
        break;
      }
      await new Promise((r) => setTimeout(r, PAUSA_VAZIA_MS));
      continue;
    }
    liberouAgora = false;

    for (const t of lote.trabalhos) {
      await executar(t);
      if (parando) break;
    }

    if (UMA_VEZ && !lote.esperando) break;
  }

  console.log("trabalhador encerrado.");
}

laco().catch((e) => {
  console.error(e);
  process.exit(1);
});
