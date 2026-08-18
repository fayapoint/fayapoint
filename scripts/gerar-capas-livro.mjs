/**
 * Capa de curso = LIVRO DE COURO com a arte gerada como ilustração da capa.
 *
 * ── Por que esta versão existe (03/08/2026, à noite) ───────────────────────
 *
 * De manhã eu troquei as capas-livro por artes abstratas quadradas. Consertou o
 * defeito real — o título saía torto e escrito errado, porque vinha assado no
 * pixel pelo modelo de difusão — mas jogou fora o que funcionava. Ricardo:
 * *"precisamos ter um livro como tínhamos antes, dava uma ideia muito maior de
 * um curso"* · *"o overhaul foi demasiado"*.
 *
 * Ele está certo, e o erro tem nome: eu tratei "o texto está errado" como se
 * fosse "o formato está errado". Eram problemas diferentes. Um objeto que se
 * reconhece como livro diz "curso" antes de qualquer palavra ser lida; uma
 * forma abstrata bonita não diz nada.
 *
 * ── O que fica da versão da manhã ──────────────────────────────────────────
 *
 * A regra, que era o ponto: **o modelo de imagem nunca escreve**. O livro é
 * geometria SVG, a arte é ilustração sem texto, e o título entra como texto
 * vetorial lido do banco. Muda o título no banco, a capa acompanha.
 *
 * ── A diversidade que o Ricardo pediu ──────────────────────────────────────
 *
 * *"diversificar um pouco a posição e a situação"*. Ângulo, cor do couro,
 * direção da luz e altura da câmera variam por curso — mas derivados de um
 * hash do slug, não de `Math.random()`. Rodar de novo tem que dar a mesma capa,
 * senão cada execução muda o catálogo inteiro sem ninguém pedir.
 *
 *   node --env-file=.env.local scripts/gerar-capas-livro.mjs            # ensaio
 *   node --env-file=.env.local scripts/gerar-capas-livro.mjs --gravar
 *   node --env-file=.env.local scripts/gerar-capas-livro.mjs --slug rag-knowledge
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
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

const ARTES = path.join(process.cwd(), "scripts", "_capas_v2");
const SAIDA = path.join(process.cwd(), "scripts", "_capas_livro");
// O quadro e RETRATO, nao quadrado.
//
// A 1a versao desenhava o livro num quadrado 1024x1024 e sobrava margem escura
// dos dois lados. No card do trilho — que e retrato, porque livro e objeto
// retrato — essa margem virava 40% de nada: ou o livro saia minusculo com
// `contain`, ou o `cover` cortava a lombada. Gerar em 3:4 resolve na origem:
// o quadro ja e a forma do card.
// 720x1040 e' exatamente a proporcao do card do trilho (306x440 = 0,695).
// Com 768x1024 (0,75) o `object-cover` cortava topo e base — e o que fica no
// topo de uma capa de livro e' justamente o titulo em ouro.
const LARG = 720;
const ALT = 1040;

/* ── Variação determinística ───────────────────────────────────────────── */

/** Hash estável do slug. Mesmo curso, mesma capa, sempre. */
export function semente(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Os couros.
 *
 * Cores de encadernação de verdade — oxblood, tabaco, azul-marinho, verde
 * inglês, grafite. Nada de roxo neon: o livro só passa a impressão de livro se
 * a cor for de livro.
 */
export const COUROS = [
  { nome: "oxblood", base: "#4a1220", alto: "#7a2436", baixo: "#2a0a12" },
  { nome: "tabaco", base: "#4a2a16", alto: "#7c4a28", baixo: "#281508" },
  { nome: "marinho", base: "#152238", alto: "#2a3f63", baixo: "#0a1120" },
  { nome: "verde", base: "#16301f", alto: "#2a5236", baixo: "#0a1a10" },
  { nome: "grafite", base: "#232529", alto: "#3d4148", baixo: "#111214" },
];

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Quebra o título em linhas que cabem na largura da capa. */
function quebrar(texto, corpo, largura) {
  // 0,54 e nao 0,5: a serifada em caixa alta e mais larga do que a media, e
  // com 0,5 titulos como "RAG e Knowledge Bases" encostavam no filete dourado.
  const max = Math.max(6, Math.floor(largura / (corpo * 0.54)));
  const linhas = [];
  let atual = "";
  for (const p of texto.split(/\s+/)) {
    if (!atual) atual = p;
    else if ((atual + " " + p).length <= max) atual += " " + p;
    else {
      linhas.push(atual);
      atual = p;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/**
 * O livro inteiro, em SVG.
 *
 * A perspectiva é `rotate` + `skewY` num grupo. Não é uma câmera de verdade —
 * é o suficiente para ler como objeto tridimensional e custa zero em GPU.
 * O miolo (páginas) e a lombada são desenhados como paralelogramos ANTES da
 * capa, para a capa cobrir a junção.
 */
function svgLivro({ titulo, etiqueta, arteBase64, s }) {
  const couro = COUROS[((s >> 11) ^ (s >> 3) ^ s) % COUROS.length];
  const giro = -7 + (s % 6);            // -7° a -2°
  const inclina = 2 + ((s >> 3) % 4);   // skewY 2° a 5°
  const luz = 20 + ((s >> 6) % 60);     // azimute da luz
  const desloca = -12 + ((s >> 9) % 24); // deslocamento horizontal do livro

  // Geometria da capa, antes da transformação.
  const X = 128 + desloca;
  const Y = 62;
  const W = 486;
  const H = 916;
  const LOMBADA = 42;

  // Tipografia: título grande, encolhe até caber em 4 linhas.
  let corpo = 52;
  let linhas = quebrar(titulo, corpo, W - 96);
  while (linhas.length > 4 && corpo > 30) {
    corpo -= 3;
    linhas = quebrar(titulo, corpo, W - 96);
  }
  const alturaLinha = Math.round(corpo * 1.16);
  const yTitulo = Y + 104;

  // A ilustração ocupa o terço inferior da capa, emoldurada.
  const arteY = yTitulo + linhas.length * alturaLinha + 44;
  const arteH = Math.min(420, Y + H - arteY - 124);
  const arteX = X + 52;
  const arteW = W - 104;

  const tspans = linhas
    .map((l, i) => `<tspan x="${X + 48}" y="${yTitulo + i * alturaLinha}">${esc(l)}</tspan>`)
    .join("");

  return Buffer.from(`
<svg width="${LARG}" height="${ALT}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <!-- O fundo: estúdio escuro com uma poça de luz atrás do livro. -->
    <radialGradient id="fundo" cx="50%" cy="42%" r="72%">
      <stop offset="0%" stop-color="#1b2030"/>
      <stop offset="55%" stop-color="#0d1018"/>
      <stop offset="100%" stop-color="#05060a"/>
    </radialGradient>

    <!-- Grão do couro.
         A 1ª versão usava feDiffuseLighting e compunha com o SourceGraphic:
         a iluminação SUBSTITUÍA a cor da capa e todo couro saía quase preto —
         oxblood, tabaco e marinho ficaram indistinguíveis. Agora o ruído é
         dessaturado e vira uma camada cinza SOBRE a cor, com alfa baixo. A cor
         vem do gradiente e sobrevive; o grão só quebra a chapa. -->
    <filter id="grao" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="5" seed="${s % 97}"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.5" intercept="0"/>
      </feComponentTransfer>
      <!-- Sem este recorte o feTurbulence pinta a REGIÃO DO FILTRO inteira,
           não a forma: saía um quadrado cinza de ruído atrás de cada livro.
           O operador "in" limita o ruído ao retângulo que o gerou.
           (E não escreva crase neste comentário: ele vive dentro de um
           template literal, e a crase fecha a string.) -->
      <feComposite operator="in" in2="SourceGraphic"/>
    </filter>

    <!-- Luz direcional na capa: um lado do couro pega mais luz que o outro. -->
    <linearGradient id="modelado" x1="0" y1="0" x2="1" y2="0.2"
        gradientTransform="rotate(${(luz - 40) / 6} 0.5 0.5)">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.14"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.32"/>
    </linearGradient>

    <linearGradient id="capa" x1="0" y1="0" x2="1" y2="0.35">
      <stop offset="0%" stop-color="${couro.alto}"/>
      <stop offset="42%" stop-color="${couro.base}"/>
      <stop offset="100%" stop-color="${couro.baixo}"/>
    </linearGradient>

    <linearGradient id="lombada" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${couro.baixo}"/>
      <stop offset="55%" stop-color="${couro.base}"/>
      <stop offset="100%" stop-color="${couro.baixo}"/>
    </linearGradient>

    <!-- Ouro da tipografia: não é uma cor chapada, é um gradiente com o
         reflexo no meio. É isso que faz ler como relevo dourado. -->
    <linearGradient id="ouro" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f7e7b4"/>
      <stop offset="45%" stop-color="#e2bb62"/>
      <stop offset="55%" stop-color="#c99a3c"/>
      <stop offset="100%" stop-color="#f1dc9e"/>
    </linearGradient>

    <linearGradient id="paginas" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#cfc4ae"/>
      <stop offset="50%" stop-color="#f4ecdc"/>
      <stop offset="100%" stop-color="#b9ab92"/>
    </linearGradient>

    <!-- Verniz: a faixa clara diagonal que atravessa a capa. -->
    <linearGradient id="verniz" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="38%" stop-color="#ffffff" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.28"/>
    </linearGradient>

    <filter id="sombra" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="26"/>
    </filter>

    <clipPath id="recorteArte">
      <rect x="${arteX}" y="${arteY}" width="${arteW}" height="${arteH}" rx="6"/>
    </clipPath>
  </defs>

  <rect width="${LARG}" height="${ALT}" fill="url(#fundo)"/>

  <g transform="translate(${LARG / 2} ${ALT / 2}) rotate(${giro}) skewY(${inclina}) translate(${-LARG / 2} ${-ALT / 2})">

    <!-- Sombra projetada no chão -->
    <ellipse cx="${X + W / 2}" cy="${Y + H + 26}" rx="${W * 0.52}" ry="30"
             fill="#000000" opacity="0.55" filter="url(#sombra)"/>

    <!-- Miolo: as páginas aparecendo pela borda direita e por baixo -->
    <rect x="${X + W - 6}" y="${Y + 12}" width="20" height="${H - 20}" fill="url(#paginas)"/>
    <rect x="${X + 14}" y="${Y + H - 6}" width="${W - 10}" height="16" fill="url(#paginas)" opacity="0.9"/>

    <!-- Lombada -->
    <rect x="${X - LOMBADA}" y="${Y}" width="${LOMBADA + 8}" height="${H}" rx="5" fill="url(#lombada)" filter="url(#grao)"/>
    <rect x="${X - LOMBADA + 9}" y="${Y + 26}" width="3" height="${H - 52}" fill="#000" opacity="0.45"/>
    <rect x="${X - 10}" y="${Y + 26}" width="3" height="${H - 52}" fill="#000" opacity="0.45"/>

    <!-- Capa: cor, depois grão, depois modelado da luz. Nesta ordem. -->
    <rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="7" fill="url(#capa)"/>
    <rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="7" fill="#ffffff" filter="url(#grao)" opacity="0.26"/>
    <rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="7" fill="url(#modelado)"/>

    <!-- Filete dourado gravado, a 26px da borda -->
    <rect x="${X + 26}" y="${Y + 26}" width="${W - 52}" height="${H - 52}" rx="3"
          fill="none" stroke="url(#ouro)" stroke-width="2" opacity="0.72"/>
    <rect x="${X + 33}" y="${Y + 33}" width="${W - 66}" height="${H - 66}" rx="2"
          fill="none" stroke="#000000" stroke-width="1" opacity="0.32"/>

    <!-- Título, em ouro. Vem do banco, sempre. -->
    <text font-family="Georgia, 'Times New Roman', serif" font-size="${corpo}"
          font-weight="700" fill="url(#ouro)" letter-spacing="-0.4">${tspans}</text>

    <!-- A ilustração gerada, embutida na capa -->
    <g clip-path="url(#recorteArte)">
      <image xlink:href="data:image/png;base64,${arteBase64}"
             x="${arteX}" y="${arteY}" width="${arteW}" height="${arteH}"
             preserveAspectRatio="xMidYMid slice" opacity="0.95"/>
    </g>
    <rect x="${arteX}" y="${arteY}" width="${arteW}" height="${arteH}" rx="6"
          fill="none" stroke="url(#ouro)" stroke-width="1.5" opacity="0.6"/>
    <rect x="${arteX}" y="${arteY}" width="${arteW}" height="${arteH}" rx="6"
          fill="none" stroke="#000" stroke-width="4" opacity="0.35"/>

    <!-- Rodapé da capa: nível e marca, gravados -->
    <text x="${X + 48}" y="${Y + H - 74}" font-family="Helvetica, Arial, sans-serif"
          font-size="21" fill="url(#ouro)" opacity="0.85" letter-spacing="0.6">${esc(etiqueta)}</text>
    <text x="${X + 48}" y="${Y + H - 42}" font-family="Helvetica, Arial, sans-serif"
          font-size="18" font-weight="600" fill="url(#ouro)" opacity="0.6" letter-spacing="2.4">FAYAI.COM.BR</text>

    <!-- Verniz por cima de tudo, para unificar a iluminação -->
    <rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="7" fill="url(#verniz)"/>
  </g>
</svg>`);
}

/**
 * A arte limpa, recortada da capa quadrada de manhã.
 *
 * Aquele arquivo tem a marca no topo (y≈55–80) e o véu escuro do título a
 * partir de ~67% da altura. A faixa entre 100 e 675 é arte pura — é ela que
 * vira a ilustração. Recortar evita reimprimir 26 imagens no ComfyUI (65 min)
 * para obter o que já está no disco.
 */
async function arteLimpa(arquivo) {
  return sharp(await readFile(arquivo))
    .extract({ left: 0, top: 100, width: 1024, height: 575 })
    .png()
    .toBuffer();
}

function etiquetaDe(p) {
  const n = p.courseContent ? (p.courseContent.match(/^#{1,2} Cap[íi]tulo /gim) || []).length : 0;
  const nivel = p.level || p.categoryPrimary || "Curso";
  return n ? `${nivel} · ${n} capítulos` : String(nivel);
}

/**
 * Publica uma capa que JÁ é um livro acabado — a rota do Higgsfield.
 *
 * Desde 03/08/2026 há duas maneiras de fazer uma capa: esta aqui desenha o
 * livro em SVG por cima da arte, e o prompt aprovado pelo Ricardo gera o livro
 * inteiro de uma vez, com o título gravado em ouro. Uma imagem da segunda rota
 * não pode passar por `svgLivro` — sairia um livro desenhado por cima de um
 * livro fotografado. Com `--so-subir`, o arquivo em `_capas_livro/<slug>.webp`
 * é tratado como final: só enquadra em 720×1040, sobe e aponta o banco.
 */
async function so720x1040(arquivo) {
  return sharp(await readFile(arquivo))
    .resize(LARG, ALT, { fit: "cover", position: "centre" })
    .webp({ quality: 88 })
    .toBuffer();
}

async function main() {
  const gravar = process.argv.includes("--gravar");
  const soSubir = process.argv.includes("--so-subir");
  const iSlug = process.argv.indexOf("--slug");
  const filtro = iSlug > -1 ? process.argv[iSlug + 1] : null;

  await mkdir(SAIDA, { recursive: true });

  const cliente = new MongoClient(process.env.MONGODB_URI, OPCOES_DE_SCRIPT);
  await cliente.connect();
  const col = cliente.db("fayapointProdutos").collection("products");
  const produtos = await col
    .find(filtro ? { slug: filtro } : {}, {
      projection: { slug: 1, name: 1, shortName: 1, level: 1, categoryPrimary: 1, courseContent: 1 },
    })
    .toArray();

  console.log(`${produtos.length} curso(s). ${gravar ? "Vai subir e gravar." : "ENSAIO — não grava."}\n`);

  if (gravar) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  let feitas = 0;
  for (const p of produtos) {
    const pronta = path.join(SAIDA, `${p.slug}.webp`);
    const fonteArte = path.join(ARTES, `${p.slug}.webp`);

    if (soSubir && !existsSync(pronta)) {
      console.log(`✗ ${p.slug} — --so-subir espera o livro pronto em ${SAIDA}`);
      continue;
    }
    if (!soSubir && !existsSync(fonteArte)) {
      console.log(`✗ ${p.slug} — sem arte em _capas_v2, rode gerar-capas-cursos.mjs antes`);
      continue;
    }

    try {
      let capa;
      if (soSubir) {
        capa = await so720x1040(pronta);
      } else {
        const arte = await arteLimpa(fonteArte);
        const svg = svgLivro({
          titulo: p.shortName?.trim() || p.name,
          etiqueta: etiquetaDe(p),
          arteBase64: arte.toString("base64"),
          s: semente(p.slug),
        });

        capa = await sharp(svg, { density: 144 })
          .resize(LARG, ALT)
          .webp({ quality: 88 })
          .toBuffer();
      }

      await writeFile(pronta, capa);
      console.log(`✓ ${p.slug} — ${(capa.length / 1024).toFixed(0)} KB${soSubir ? " (livro pronto, sem SVG por cima)" : ""}`);

      if (gravar) {
        const up = await new Promise((ok, erro) => {
          cloudinary.uploader
            .upload_stream(
              { folder: `fayai/courses/${p.slug}`, public_id: "capa-v2", overwrite: true, invalidate: true },
              (e, r) => (e ? erro(e) : ok(r)),
            )
            .end(capa);
        });
        await col.updateOne({ _id: p._id }, { $set: { thumbnail: up.secure_url, thumbnailUpdatedAt: new Date() } });
        console.log(`  ↑ ${up.secure_url}`);
      }
      feitas++;
    } catch (e) {
      const onde = (e.stack || "").split("\n").filter((l) => l.includes("gerar-capas-livro"))[0] || "";
      console.log(`✗ ${p.slug} — ${e.message.slice(0, 90)} ${onde.trim()}`);
    }
  }

  await cliente.close();
  // A capa nova só chega à vitrine depois que o catálogo sai do cache.
  await invalidarCache();
  console.log(`\n${feitas}/${produtos.length} capas-livro em ${SAIDA}`);
}

/**
 * As escolhas visuais que o hash do slug fez por este curso.
 *
 * Uma função só, para o arquivador poder escrever no PROMPT.md qual couro e
 * qual ângulo saíram — sem reimplementar as contas e correr o risco de
 * documentar uma capa diferente da que está no ar.
 */
export function composicaoDe(slug) {
  const s = semente(slug);
  return {
    semente: s,
    couro: COUROS[((s >> 11) ^ (s >> 3) ^ s) % COUROS.length],
    giroGraus: -7 + (s % 6),
    inclinacaoGraus: 2 + ((s >> 3) % 4),
    azimuteLuz: 20 + ((s >> 6) % 60),
    deslocamentoPx: -12 + ((s >> 9) % 24),
  };
}

// Guarda: sem ela, `import` deste arquivo regeraria as 27 capas.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
