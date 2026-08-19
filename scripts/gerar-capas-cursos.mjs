/**
 * Regera a capa de TODOS os cursos do banco — 1024×1024, no card quadrado.
 *
 * ── O defeito que este script existe para consertar ────────────────────────
 *
 * As capas antigas eram mockups de livro 3D com o título **assado no pixel**
 * por um modelo de difusão. O resultado, medido em 03/08/2026 olhando as seis
 * primeiras: "Make Automacio" (não existe essa palavra), "n8n Automacao" e
 * "Zero ao Avancado" (sem cedilha), e lixo tipográfico — "#N5F3" — na capa do
 * Leonardo. Fora a distorção: o texto acompanhava a perspectiva da capa do
 * livro, então ficava torto de propósito.
 *
 * Pior que o erro de grafia é o congelamento: quando o título do curso muda no
 * banco, a capa continua anunciando o título velho e ninguém percebe.
 *
 * A regra, então: **o modelo produz só a arte**. Marca e título entram depois,
 * compostos como SVG vetorial pelo sharp — nítidos em qualquer tela, sempre
 * iguais ao que está no banco, e regeráveis em um segundo.
 *
 * É a mesma regra de `gerar-hero-og.mjs`, aplicada ao catálogo inteiro.
 *
 *   node --env-file=.env.local scripts/gerar-capas-cursos.mjs           # ensaio
 *   node --env-file=.env.local scripts/gerar-capas-cursos.mjs --gravar  # sobe e grava
 *   node --env-file=.env.local scripts/gerar-capas-cursos.mjs --slug rag-knowledge
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import sharp from "sharp";
import { MongoClient } from "mongodb";
// O teto do pool. Sem ele o driver assume maxPoolSize:100, e o cluster
// grátis inteiro tem 500 — divididas com os outros projetos.
// Ver `scripts/lib/mongo.cjs`.
import { OPCOES_DE_SCRIPT } from "./lib/mongo.mjs";
import { invalidarCache } from "./lib/invalidar-cache.mjs";
import { v2 as cloudinary } from "cloudinary";

const COMFY = "http://127.0.0.1:8000";
const SAIDA = path.join(process.cwd(), "scripts", "_capas_v2");
const LADO = 1024;

/* ── A arte ────────────────────────────────────────────────────────────────
 *
 * Uma linguagem visual só para o catálogo inteiro: cristal violeta e turquesa
 * sobre azul-marinho profundo — a mesma da `/og-fayai.jpg` e das artes do
 * `/inventando`. O que muda de curso para curso é só o OBJETO no centro.
 *
 * O terço inferior fica deliberadamente vazio: é onde o título vai entrar.
 */
export const ESTILO =
  "translucent violet and cyan crystal glass, deep internal refraction and caustics, " +
  "deep navy blue background, glowing teal data streams orbiting in wide arcs, " +
  "volumetric light, cinematic studio lighting, octane render, ultra detailed, 8k, " +
  "centered composition, generous empty dark space in the lower third";

export const NEGATIVO =
  "text, letters, words, typography, watermark, signature, logo, caption, book, book cover, " +
  "ugly, blurry, low quality, deformed, cluttered, busy, human face, hands";

/**
 * O objeto no centro da arte, escolhido pelo assunto do curso.
 *
 * ⚠️ Roteia por SLUG e FERRAMENTA — nunca pelo `name`. O nome é texto de
 * marketing e carrega palavra genérica que sequestra a busca: "Make
 * (Integromat): Integração **Visual** e Automação" caía no ramo de arte e
 * ganhou uma paleta de pintor; "Prompt Engineering: Domine a **Arte** de
 * Conversar" cairia no mesmo buraco. Slug e ferramenta são estáveis e
 * descrevem o assunto, não a promessa.
 *
 * A ordem também importa: marca primeiro (midjourney, perplexity), palavra
 * genérica depois (produção, segurança).
 */
export function motivo({ slug = "", tool = "" }) {
  const s = `${slug} ${tool}`.toLowerCase();
  const tem = (...ks) => ks.some((k) => s.includes(k));

  if (tem("whatsapp")) return "a floating crystal speech bubble with a smaller one nested inside, message glyphs as light particles";

  /**
   * Os cursos de PROFISSÃO entram antes das marcas: eles são "Multi-tool" e o
   * assunto está só no slug. Sem estes ramos os seis caem no poliedro genérico
   * — seis capas iguais lado a lado na grade, que é o mesmo que capa nenhuma.
   *
   * ⚠️ `rh` casado como `para-rh`, nunca como `rh` solto: duas letras tão
   * curtas casam dentro de qualquer palavra e roubariam a capa do curso ao lado.
   * O `NEGATIVO` proíbe livro e rosto humano, então nada aqui pede os dois.
   */
  if (tem("estudar", "concurso", "vestibular")) return "a crystal hourglass whose falling grains reassemble into an ordered luminous lattice below it";
  if (tem("advogado", "juridic", "jurídic")) return "a crystal balance scale in perfect equilibrium, both pans glowing from within";
  if (tem("consultorio", "consultório", "medic", "clinic", "saude", "saúde")) return "a crystal pulse line rising in a single arc above a faceted glass slab, light travelling along its path";
  if (tem("para-rh", "recrutamento", "recursos humanos")) return "a wide crystal funnel of faceted glass narrowing to one bright point, small luminous shards descending through it";
  if (tem("dinheiro", "renda", "freelanc")) return "a stack of crystal coins refracting light, luminous streams spiralling upward from the top coin";
  if (tem("professor", "ensino", "docente")) return "a crystal compass rose radiating wide beams of teal light toward a semicircle of small glass spheres";
  if (tem("video", "vídeo")) return "a crystal film strip curling in a spiral, frames glowing from within";
  if (tem("midjourney", "leonardo")) return "a crystal painter's palette dissolving into a swarm of luminous pixels";
  if (tem("perplexity", "pesquisa")) return "a crystal magnifying lens focusing beams of light into a bright point";
  if (tem("rag", "knowledge")) return "a crystal library of floating glass tablets arranged in concentric rings";
  if (tem("allowlist")) return "a crystal lighthouse casting a wide beam of teal light across dark water";
  if (tem("n8n", "make", "automac", "automaç")) return "three large mechanical cogwheels with clearly defined gear teeth, meshing together";
  if (tem("agente", "autonom", "openclaw", "cowork")) return "three crystal humanoid silhouettes made of faceted glass standing in formation";
  if (tem("prompt")) return "a crystal quill pen writing a ribbon of light that unfolds into geometric shapes";
  if (tem("banana", "deploy", "docker")) return "a crystal rocket of faceted glass lifting off a lattice platform";
  if (tem("singularity", "autoresearch")) return "a crystal möbius strip folding into itself, light circulating along its surface";
  if (tem("segura", "seguran")) return "a crystal shield with a glowing lock at its centre, light refracting outward";
  if (tem("gemini", "google")) return "a crystal double helix of interlocking glass ribbons rising upward";
  if (tem("sem-filtro")) return "a crystal mask splitting open to reveal light pouring out from inside";
  if (tem("claude", "anthropic")) return "a calm crystal monolith with soft internal light and orbiting glass shards";
  if (tem("producao", "produção", "producto")) return "a crystal conveyor belt carrying glowing geometric solids through an arch";
  if (tem("dia-a-dia")) return "a crystal key turning inside a floating glass door frame";
  if (tem("chatgpt", "gpt")) return "a crystal sphere segmented into glowing concentric rings";
  return "a faceted crystal polyhedron suspended in mid air, light refracting through its core";
}

/**
 * O prompt positivo completo, montado num lugar só.
 *
 * O objeto vem primeiro e sozinho na frase, e o estilo entra depois como
 * material. Com o estilo grudado por vírgula, o Qwen dilui o objeto no meio
 * dos adjetivos: o pedido de engrenagens virou uma paleta de pintor no
 * primeiro ensaio.
 *
 * Exportado porque o arquivador (`arquivar-capas.mjs`) precisa escrever o
 * prompt EXATO em `D:\fayai\Cursos\capas\...\PROMPT.md`. Se ele remontasse a
 * frase por conta própria, o arquivo documentaria uma capa que não é a que
 * está no ar.
 */
export function promptDe(produto) {
  return `${motivo(produto)}. The object is made of ${ESTILO}`;
}

/* ── O livro inteiro, num prompt só ───────────────────────────────────────── */

/**
 * O prefixo que transforma o prompt do objeto no prompt do LIVRO acabado.
 *
 * ── Por que a regra "o modelo nunca escreve" foi revista ───────────────────
 *
 * Ela nasceu do Qwen local, que cuspia "Make Automacio" e "#N5F3" — e continua
 * valendo para ele: o `NEGATIVO` acima segue proibindo texto, e o pipeline do
 * ComfyUI segue compondo título em SVG. O que mudou é que o Higgsfield acerta
 * a grafia, inclusive com acento e cedilha, e grava o título em ouro no couro
 * com um relevo que o SVG não imita.
 *
 * O preço é conhecido e aceito: título assado no pixel volta a congelar. Se o
 * `shortName` mudar no banco, a capa continua anunciando o título velho até
 * alguém regerar. É a troca que o Ricardo fez com a capa na mão, em 03/08.
 *
 * ⚠️ Começa em "A book", não "a brand new book". Não é preciosismo: as duas
 * variantes foram geradas lado a lado em 03/08 e "a brand new book" levou o
 * modelo a um livro em 3/4, deitado, com o título subindo torto na diagonal —
 * ilegível no card de 180px do trilho. "A book" dá o livro de frente, título
 * reto, que é o que foi aprovado.
 *
 * Os espaços duplos são os do prompt aprovado. Não fazem diferença para o
 * codificador de texto, mas manter o prompt literal é o ponto deste arquivo.
 */
export const PREFIXO_LIVRO = (titulo) =>
  `A book with a leather cover and the title of the book is  engraved with gold ` +
  `with the robotto font, having the text "${titulo}",   the image on the cover ` +
  `of the book, also is engraved, making it seamless integrated in the book, it is `;

/**
 * O prompt do livro acabado — o formato aprovado pelo Ricardo em 03/08/2026.
 *
 * Monta-se sobre o `promptDe` de propósito: objeto e estilo têm um dono só.
 * Se o motivo de um curso mudar aqui e não lá, as duas rotas de geração
 * passariam a desenhar coisas diferentes para o mesmo curso.
 */
export function promptLivro(produto) {
  const titulo = produto.shortName?.trim() || produto.name || produto.slug;
  return PREFIXO_LIVRO(titulo) + promptDe(produto);
}

/** Parâmetros do KSampler, para o arquivador documentar sem adivinhar. */
export const PARAMETROS = {
  modelo: "qwen_image_2512_fp8_e4m3fn.safetensors",
  clip: "qwen_2.5_vl_7b_fp8_scaled.safetensors",
  vae: "qwen_image_vae.safetensors",
  lado: LADO,
  steps: 24,
  cfg: 2.5,
  sampler: "euler",
  scheduler: "simple",
  denoise: 1,
};

function fluxo(prompt, semente, slug = "") {
  return {
    1: { class_type: "UNETLoader", inputs: { unet_name: "qwen_image_2512_fp8_e4m3fn.safetensors", weight_dtype: "default" } },
    2: { class_type: "CLIPLoader", inputs: { clip_name: "qwen_2.5_vl_7b_fp8_scaled.safetensors", type: "qwen_image" } },
    3: { class_type: "VAELoader", inputs: { vae_name: "qwen_image_vae.safetensors" } },
    4: { class_type: "CLIPTextEncode", inputs: { clip: ["2", 0], text: prompt } },
    5: { class_type: "CLIPTextEncode", inputs: { clip: ["2", 0], text: NEGATIVO } },
    6: { class_type: "EmptySD3LatentImage", inputs: { width: LADO, height: LADO, batch_size: 1 } },
    7: {
      class_type: "KSampler",
      inputs: {
        model: ["1", 0], positive: ["4", 0], negative: ["5", 0], latent_image: ["6", 0],
        seed: semente, steps: 24, cfg: 2.5, sampler_name: "euler", scheduler: "simple", denoise: 1,
      },
    },
    8: { class_type: "VAEDecode", inputs: { samples: ["7", 0], vae: ["3", 0] } },
    // ⚠️ O prefixo LEVA O SLUG. Sem ele, a rodada de 03/08/2026 deixou 29
    // arquivos chamados `capa_000NN_.png` em C:\WORKS\ComfyUI\output e ninguém
    // mais soube qual PNG cru pertencia a qual curso — foi preciso casar as
    // 29 imagens por semelhança para arquivá-las. O nome do arquivo é o único
    // vínculo entre a arte crua e o curso; não desperdice esse vínculo.
    9: { class_type: "SaveImage", inputs: { images: ["8", 0], filename_prefix: slug ? `capa_${slug}` : "capa" } },
  };
}

async function gerarArte(prompt, slug = "") {
  const r = await fetch(`${COMFY}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: fluxo(prompt, Math.floor(Math.random() * 2 ** 31), slug) }),
  });
  if (!r.ok) throw new Error(`enfileirar HTTP ${r.status}`);
  const { prompt_id } = await r.json();

  const inicio = Date.now();
  while (Date.now() - inicio < 420000) {
    const h = await (await fetch(`${COMFY}/history/${prompt_id}`)).json();
    const item = h[prompt_id];
    if (item?.status?.status_str === "error") throw new Error("ComfyUI falhou");
    const img = Object.values(item?.outputs ?? {}).flatMap((o) => o.images ?? [])[0];
    if (img) {
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder ?? "", type: img.type ?? "output" });
      return Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer());
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error("tempo esgotado no ComfyUI");
}

/* ── O texto ───────────────────────────────────────────────────────────── */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Quebra o título em linhas que cabem na largura.
 *
 * O SVG não quebra texto sozinho, então a conta é feita aqui: Georgia bold
 * tem largura média ~0.52 do corpo. Estimar erra pouco e erra para menos, que
 * é o lado seguro — a linha sobra, não vaza.
 */
function quebrar(texto, corpo, largura) {
  const max = Math.floor(largura / (corpo * 0.52));
  const linhas = [];
  let atual = "";
  for (const p of texto.split(/\s+/)) {
    if (!atual) atual = p;
    else if ((atual + " " + p).length <= max) atual += " " + p;
    else { linhas.push(atual); atual = p; }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function camadaTexto({ titulo, etiqueta }) {
  const MARGEM = 68;
  const UTIL = LADO - MARGEM * 2;

  // Título longo encolhe até caber em três linhas. Quatro linhas de serifada
  // grande viram um bloco que compete com a arte em vez de rotulá-la.
  let corpo = 62;
  let linhas = quebrar(titulo, corpo, UTIL);
  while (linhas.length > 3 && corpo > 38) {
    corpo -= 4;
    linhas = quebrar(titulo, corpo, UTIL);
  }

  const alturaLinha = Math.round(corpo * 1.14);
  const baseTitulo = LADO - 118 - (linhas.length - 1) * alturaLinha;
  const inicioVeu = Math.max(0.3, (baseTitulo - corpo - 90) / LADO);

  const tspans = linhas
    .map((l, i) => `<tspan x="${MARGEM}" y="${baseTitulo + i * alturaLinha}">${esc(l)}</tspan>`)
    .join("");

  return Buffer.from(`
<svg width="${LADO}" height="${LADO}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="veu" x1="0" y1="0" x2="0" y2="1">
      <stop offset="${(inicioVeu * 100).toFixed(0)}%" stop-color="#05060f" stop-opacity="0"/>
      <stop offset="78%" stop-color="#05060f" stop-opacity="0.88"/>
      <stop offset="100%" stop-color="#05060f" stop-opacity="0.97"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${LADO}" height="${LADO}" fill="url(#veu)"/>

  <text x="${MARGEM}" y="72" font-family="Helvetica, Arial, sans-serif"
        font-size="23" font-weight="600" fill="#8fe8dc" letter-spacing="2.6">FAYAI.COM.BR</text>

  <text font-family="Georgia, 'Times New Roman', serif" font-size="${corpo}"
        font-weight="700" fill="#ffffff" letter-spacing="-0.8">${tspans}</text>

  <rect x="${MARGEM}" y="${LADO - 92}" width="52" height="3" fill="#8fe8dc"/>
  <text x="${MARGEM}" y="${LADO - 48}" font-family="Helvetica, Arial, sans-serif"
        font-size="25" fill="#b9c4d8" letter-spacing="0.3">${esc(etiqueta)}</text>
</svg>`);
}

/* ── O laço ────────────────────────────────────────────────────────────── */

function etiquetaDe(p) {
  const n = p.courseContent ? (p.courseContent.match(/^#{1,2} Cap[íi]tulo /gim) || []).length : 0;
  const nivel = p.level || p.categoryPrimary || "Curso";
  return n ? `${nivel} · ${n} capítulos` : String(nivel);
}

async function main() {
  const gravar = process.argv.includes("--gravar");
  const soSlug = process.argv[process.argv.indexOf("--slug") + 1];
  const filtrar = process.argv.includes("--slug") ? soSlug : null;

  await mkdir(SAIDA, { recursive: true });

  const cliente = new MongoClient(process.env.MONGODB_URI, OPCOES_DE_SCRIPT);
  await cliente.connect();
  const col = cliente.db("fayapointProdutos").collection("products");
  const produtos = await col
    .find(filtrar ? { slug: filtrar } : {}, { projection: { slug: 1, name: 1, shortName: 1, tool: 1, level: 1, categoryPrimary: 1, courseContent: 1, thumbnail: 1 } })
    .toArray();

  console.log(`${produtos.length} curso(s). ${gravar ? "Vai subir e gravar." : "ENSAIO — não grava nada."}\n`);

  if (gravar) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  let feitas = 0;
  for (const p of produtos) {
    const arquivo = path.join(SAIDA, `${p.slug}.webp`);
    const titulo = p.shortName?.trim() || p.name;
    const etiqueta = etiquetaDe(p);

    try {
      let composta;
      if (existsSync(arquivo)) {
        composta = await readFile(arquivo);
        console.log(`· ${p.slug} — já estava no disco`);
      } else {
        const bruta = await gerarArte(promptDe(p), p.slug);
        composta = await sharp(bruta)
          .resize(LADO, LADO, { fit: "cover", position: "centre" })
          .composite([{ input: camadaTexto({ titulo, etiqueta }), top: 0, left: 0 }])
          .webp({ quality: 86 })
          .toBuffer();
        await writeFile(arquivo, composta);
        console.log(`✓ ${p.slug} — ${(composta.length / 1024).toFixed(0)} KB · "${titulo}"`);
      }

      if (gravar) {
        const up = await new Promise((ok, erro) => {
          cloudinary.uploader
            .upload_stream(
              { folder: `fayai/courses/${p.slug}`, public_id: "capa-v2", overwrite: true, resource_type: "image" },
              (e, r) => (e ? erro(e) : ok(r))
            )
            .end(composta);
        });
        await col.updateOne({ _id: p._id }, { $set: { thumbnail: up.secure_url, thumbnailUpdatedAt: new Date() } });
        console.log(`  ↑ ${up.secure_url}`);
      }
      feitas++;
    } catch (e) {
      console.log(`✗ ${p.slug} — ${e.message.slice(0, 120)}`);
    }
  }

  await cliente.close();
  // A capa nova só aparece na vitrine depois que o catálogo sai do cache.
  if (gravar && feitas) await invalidarCache();
  console.log(`\n${feitas}/${produtos.length} capas prontas em ${SAIDA}`);
  if (!gravar) console.log("Ensaio. Rode de novo com --gravar para subir ao Cloudinary e apontar o banco.");
}

// Só roda quando chamado direto. O arquivador importa `motivo`, `promptDe` e
// `PARAMETROS` deste arquivo — sem esta guarda, `import` dispararia uma
// regeração completa do catálogo no ComfyUI.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
