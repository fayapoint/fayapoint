/**
 * Gera a capa no formato APROVADO — o livro inteiro, numa geração só — usando
 * o ComfyUI local em vez do Higgsfield.
 *
 * ── Por que este arquivo existe ────────────────────────────────────────────
 *
 * Em 03/08/2026 o Ricardo aprovou um formato de capa novo: um prompt só
 * descreve o livro acabado — couro, título gravado em ouro, e a arte gravada
 * no MESMO relevo, integrada à capa em vez de colada por cima. Três capas
 * saíram assim, pelo site do Higgsfield, à mão. As outras 19 continuaram no
 * formato antigo, em que o modelo desenha só um objeto de cristal e um SVG
 * desenha o livro por cima.
 *
 * O problema de escalar pelo Higgsfield: é manual, é uma capa por vez, e a
 * promoção ilimitada dele não vale pelo MCP. Repetir 19 vezes à mão na véspera
 * do Rio Innovation Week não é plano.
 *
 * ── A regra que foi revista, e o limite dela ───────────────────────────────
 *
 * "O Qwen local nunca escreve" nasceu de uma rodada real: saiu "Make
 * Automacio", "Zero ao Avancado" sem cedilha e "#N5F3" na capa do Leonardo.
 * Mas aquela rodada era do `qwen_image_fp8` antigo desenhando um mockup de
 * livro 3D. O `qwen_image_2512` é outro modelo e escreve bem melhor.
 *
 * ⚠️ **Bem melhor não é sempre.** Este script NÃO substitui a conferência: ele
 * gera `--variantes` alternativas por curso e o humano escolhe. Uma capa com o
 * título errado é pior que uma capa feia — ela mente sobre o produto na
 * vitrine. A conferência é o passo 2 do fluxo, não é opcional.
 *
 * ── O fluxo ───────────────────────────────────────────────────────────────
 *
 *   1. node --env-file=.env.local scripts/gerar-capas-livro-comfy.mjs --slug automacao-n8n --variantes 3
 *        → escreve as variantes em scripts/_capas_livro/_variantes/<slug>-N.webp
 *   2. Conferir a grafia do título e escolher; copiar a escolhida para
 *        scripts/_capas_livro/<slug>.webp
 *   3. node --env-file=.env.local scripts/gerar-capas-livro.mjs --slug <slug> --so-subir --gravar
 *   4. node --env-file=.env.local scripts/arquivar-capas.mjs --gravar
 *
 * O passo 2 tem atalho: `--eleger 2` copia a variante 2 para o lugar final.
 *
 *   --todos              percorre o catálogo ativo inteiro
 *   --slug <slug>        um curso só (pode repetir)
 *   --variantes <n>      quantas alternativas por curso (padrão 3)
 *   --eleger <n>         copia a variante n para scripts/_capas_livro/<slug>.webp
 *   --semente <n>        fixa a primeira semente (as seguintes são +1, +2…)
 *   --recompor <png>     só reescreve o texto sobre um PNG cru já gerado
 *
 * ⚠️ `--recompor` existe para ajustar tipografia sem pagar 3 minutos de GPU por
 * tentativa. Os PNGs crus ficam em `C:\WORKS\ComfyUI\output\livro_<slug>_*.png`.
 *   node --env-file=.env.local scripts/gerar-capas-livro-comfy.mjs \
 *     --recompor "C:/WORKS/ComfyUI/output/livro_x_00001_.png" --titulo "Meu Título"
 */

import { writeFile, mkdir, copyFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { MongoClient } from "mongodb";

import { motivo } from "./gerar-capas-cursos.mjs";

/**
 * A paleta dos couros.
 *
 * ── Por que existe ─────────────────────────────────────────────────────────
 *
 * A primeira rodada saiu com o catálogo inteiro em azul-marinho, e o Ricardo
 * cortou: *"gosto da variação de cores, não quero todos azul marinho"*. Uma
 * estante de 22 livros idênticos no trilho parece um erro de carregamento —
 * a variação é o que faz a fileira parecer um acervo.
 *
 * ── O que varia e o que NÃO varia ──────────────────────────────────────────
 *
 * Varia: o couro e a luz de contorno.
 *
 * NÃO varia: o cristal violeta e turquesa da ilustração, o ouro do título e
 * **o fundo**.
 *
 * O cristal e o ouro são a linguagem visual do catálogo, a mesma da
 * `/og-fayai.jpg` e das artes do `/inventando` — se mudassem de cor junto, cada
 * capa viraria produto de uma marca diferente. O couro é a variação; o cristal
 * é a marca.
 *
 * ⚠️ O fundo saiu da variação depois do primeiro ensaio de 04/08, e a razão só
 * aparece na FILEIRA: com `fundo` acompanhando o couro, o livro marrom ficava
 * em cena marrom e o bordô em cena bordô. Duas coisas ruins ao mesmo tempo —
 * o livro perdia separação do próprio fundo, e 22 fundos diferentes lado a lado
 * no trilho viravam retalho. Fundo escuro e neutro para todos faz a cor do
 * couro saltar e a fileira parecer uma estante fotografada no mesmo estúdio,
 * que é o que ela deve parecer.
 *
 * ⚠️ Todo couro desta lista é ESCURO e dessaturado, e isso é requisito, não
 * gosto: o título é ouro polido, e ouro sobre couro claro perde contraste no
 * card de 228px do trilho — que é o tamanho em que a capa é realmente vista.
 * Ao acrescentar uma cor, confira o título no card pequeno, não na imagem
 * cheia.
 */
/** O palco, igual para o catálogo inteiro. */
const FUNDO = "very dark desaturated charcoal, almost black";

const COUROS = [
  { couro: "dark navy blue", luz: "cool blue" },
  { couro: "deep oxblood burgundy", luz: "warm amber" },
  { couro: "dark forest green", luz: "soft emerald" },
  { couro: "charcoal black", luz: "cool silver" },
  { couro: "deep aubergine purple", luz: "soft magenta" },
  { couro: "dark teal", luz: "pale cyan" },
  { couro: "rich cognac brown", luz: "warm gold" },
  { couro: "deep indigo", luz: "soft periwinkle" },
];

/**
 * Escolhe o couro pelo SLUG, não por sorteio.
 *
 * O hash torna a escolha determinística: rodar o gerador de novo devolve
 * exatamente a mesma cor para o mesmo curso. Com `Math.random()`, cada execução
 * repintaria o catálogo inteiro sem ninguém pedir — e uma capa regerada para
 * corrigir uma letra torta voltaria de outra cor, quebrando a estante.
 *
 * É o mesmo princípio que a rota antiga já usava para couro, ângulo e luz.
 */
function couroDe(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return COUROS[h % COUROS.length];
}

/**
 * O prompt do livro, escrito PARA O QWEN.
 *
 * ── Por que não reusa o `promptLivro` de gerar-capas-cursos.mjs ────────────
 *
 * Aquele é o prompt literal aprovado, e o lugar dele é o Higgsfield. Medido
 * nesta sessão, passando-o ao Qwen 2512: a grafia sai perfeita ("Automação com
 * n8n", com cedilha e til — a regra "o Qwen local nunca escreve" caiu com o
 * 2512), mas o LIVRO sai de vidro violeta em vez de couro.
 *
 * A causa é a que o próprio PROMPT.md já avisava: o estilo é material do
 * OBJETO, e o `promptDe` termina com um bloco escrito para uma arte sem livro
 * — "deep navy blue background", "centered composition", "generous empty dark
 * space in the lower third". Envolvido pelo prefixo do livro, esse bloco passa
 * a descrever a cena inteira e o "translucent crystal glass" encosta no
 * substantivo mais próximo, que é o livro. O Higgsfield desfaz essa ambiguidade
 * sozinho; o Qwen obedece ao literal.
 *
 * ── O que este prompt faz de diferente ─────────────────────────────────────
 *
 * Uma frase por elemento, cada uma dizendo QUAL superfície tem QUAL material:
 * a capa é couro; só a ilustração é cristal. E a composição da referência
 * aprovada entra explícita (título em cima e centrado, arte no meio,
 * assinatura embaixo, sombra no chão) em vez de ser esperada por sorte.
 *
 * ── ⚠️ O MODELO NÃO ESCREVE. Medido em 04/08/2026. ────────────────────────
 *
 * A primeira versão desta rota pedia o título ao próprio Qwen, e os primeiros
 * ensaios animaram: "Automação com n8n", "IA no WhatsApp" e "Google Gemini"
 * saíram perfeitos, com cedilha e til. O erro foi meu, de amostra: os três são
 * títulos CURTOS. Na primeira folha de contato do lote apareceu o que a amostra
 * escondia:
 *
 *   "IA para o Dia a Mia"          (era "Dia a Dia") — nas DUAS variantes
 *   "Autoresearch e a Singulariddaate"  (era "Singularidade")
 *
 * No catálogo, **8 dos 22 títulos passam de 18 caracteres**. Para esses, apostar
 * em gerar variantes até sair uma certa é sorte, não plano — e uma capa com o
 * título errado mente sobre o produto na vitrine, que é pior que uma capa feia.
 *
 * Então o modelo desenha o LIVRO e o SVG escreve — a mesma regra que já valia
 * para a rota antiga, agora aplicada a um livro fotorrealista em vez de uma arte
 * plana. Três ganhos além da grafia:
 *
 *   · tipografia igual no catálogo inteiro (o modelo escolhia uma fonte por capa);
 *   · o título volta a acompanhar o banco — mudar `shortName` deixa de exigir
 *     regerar a imagem, que era o preço explícito do formato aprovado em 03/08;
 *   · o rodapé `fayai.com.br` também deixa de ser sorteio.
 *
 * O prompt abaixo, portanto, PROÍBE texto e reserva as faixas onde a tipografia
 * vai entrar. A composição vive em `escreverNaCapa()`.
 */
export function promptLivroQwen(produto) {
  const c = couroDe(produto.slug || produto.shortName || "");
  return (
    `Professional 3D product photograph of a single closed hardcover book standing upright, ` +
    `front cover facing the camera straight on, centered in frame. ` +
    `The cover is ${c.couro} textured leather with a visible grain, completely blank with no text. ` +
    `In the middle of the cover, engraved into the leather and glowing from within, ` +
    `${motivo(produto)}, made of translucent violet and cyan crystal with internal refraction, ` +
    `with glowing teal data streams orbiting it in wide arcs. ` +
    `The upper third of the cover is empty smooth leather, and the lower area is empty smooth leather. ` +
    `${FUNDO} background, dramatic cinematic studio lighting, soft ${c.luz} rim light along the book edges, ` +
    `soft shadow on the floor beneath the book, ultra detailed, sharp focus, 8k.`
  );
}

const COMFY = "http://127.0.0.1:8000";

/** O quadro final: 3:4, a proporção do card do trilho. */
const LARGURA_FINAL = 720;
const ALTURA_FINAL = 1040;

/**
 * O quadro da geração.
 *
 * Múltiplos de 32 (exigência do VAE) e proporção 0,694 — a mais próxima de
 * 720×1040 (0,6923) que fecha em 32. A sobra some num corte central de 8px,
 * abaixo do que qualquer olho nota, e evita esticar a imagem.
 *
 * ⚠️ Não gerar direto em 720×1040: 720 não é múltiplo de 32 e o ComfyUI
 * arredonda por baixo em silêncio, entregando 704 de largura — a capa sairia
 * 2% mais estreita e o título deslocado do centro.
 */
const LARGURA_GER = 800;
const ALTURA_GER = 1152;

/**
 * O negativo do modo LIVRO — é outro problema, então é outra lista.
 *
 * ⚠️ O `NEGATIVO` de `gerar-capas-cursos.mjs` proíbe "text, letters, words,
 * typography, book, book cover". Ele existe para a rota antiga, em que o
 * modelo desenha SÓ o objeto e o título entra em SVG. Reaproveitá-lo aqui
 * pediria ao modelo um livro com o título gravado e, na mesma frase, proibiria
 * livro e texto — as duas instruções se anulam e o resultado é sorte. Por isso
 * a lista abaixo é escrita do zero em vez de importada.
 *
 * O que este banimento cobre são os defeitos MEDIDOS do formato aprovado:
 * o livro em 3/4 com o título torto (o defeito do "a brand new book"), a pilha
 * de livros, e o texto ilegível — que num prompt de título é o defeito caro.
 */
const NEGATIVO_LIVRO =
  // ⚠️ Texto voltou a ser PROIBIDO em 04/08, quando o título passou a ser
  // escrito em SVG. Enquanto o modelo escrevia, banir texto teria anulado o
  // próprio pedido; agora que ele só desenha o livro, qualquer letra que ele
  // inventar vai aparecer POR BAIXO da tipografia de verdade — e letra torta
  // meio escondida atrás do título é pior que letra torta sozinha.
  "text, letters, words, typography, title, lettering, watermark, signature, logo, caption, url, " +
  // O defeito medido nesta sessão: o livro inteiro sai de vidro violeta, porque
  // o material da ilustração escorre para a capa. Banir aqui é a segunda trava;
  // a primeira é o prompt dizer, superfície por superfície, qual é qual.
  "transparent book, glass book, crystal book, translucent cover, see-through cover, " +
  "tilted book, rotated book, book lying down, open book, floating book, " +
  "multiple books, stack of books, spine facing viewer, " +
  "blurry, low quality, deformed, cluttered, human face, hands";

const PARAMETROS = {
  modelo: "qwen_image_2512_fp8_e4m3fn.safetensors",
  clip: "qwen_2.5_vl_7b_fp8_scaled.safetensors",
  vae: "qwen_image_vae.safetensors",
  largura: LARGURA_GER,
  altura: ALTURA_GER,
  steps: 30,
  cfg: 3.2,
  sampler: "euler",
  scheduler: "simple",
};

/**
 * `steps` 30 e `cfg` 3,2 — mais que os 24/2,5 da rota do objeto, de propósito.
 *
 * O raciocínio: texto legível é o que mais custa passos num modelo de difusão
 * — a forma de uma engrenagem já está resolvida no meio da amostragem, mas a
 * diferença entre "ç" e "c" se decide nos últimos passos. E o cfg mais alto
 * puxa o modelo para o prompt literal, que é onde o título entre aspas está.
 *
 * ⚠️ Não é número medido: é o ponto de partida desta rota. Se as variantes
 * saírem com o título errado, é o primeiro par a mexer — e vale anotar aqui o
 * que foi tentado, para o próximo não repetir a mesma busca.
 */
function fluxo(prompt, semente, slug) {
  return {
    1: { class_type: "UNETLoader", inputs: { unet_name: PARAMETROS.modelo, weight_dtype: "default" } },
    2: { class_type: "CLIPLoader", inputs: { clip_name: PARAMETROS.clip, type: "qwen_image" } },
    3: { class_type: "VAELoader", inputs: { vae_name: PARAMETROS.vae } },
    4: { class_type: "CLIPTextEncode", inputs: { clip: ["2", 0], text: prompt } },
    5: { class_type: "CLIPTextEncode", inputs: { clip: ["2", 0], text: NEGATIVO_LIVRO } },
    6: { class_type: "EmptySD3LatentImage", inputs: { width: LARGURA_GER, height: ALTURA_GER, batch_size: 1 } },
    7: {
      class_type: "KSampler",
      inputs: {
        model: ["1", 0], positive: ["4", 0], negative: ["5", 0], latent_image: ["6", 0],
        seed: semente, steps: PARAMETROS.steps, cfg: PARAMETROS.cfg,
        sampler_name: PARAMETROS.sampler, scheduler: PARAMETROS.scheduler, denoise: 1,
      },
    },
    8: { class_type: "VAEDecode", inputs: { samples: ["7", 0], vae: ["3", 0] } },
    // O slug no nome do arquivo. Em 03/08 uma rodada deixou 29 PNGs chamados
    // `capa_000NN_.png` e foi preciso casá-los por semelhança para saber de
    // quem era cada um — o nome é o único vínculo entre o PNG cru e o curso.
    9: { class_type: "SaveImage", inputs: { images: ["8", 0], filename_prefix: `livro_${slug}` } },
  };
}

/* ── A tipografia ─────────────────────────────────────────────────────────── */

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Quebra o título em linhas que cabem na largura da capa.
 *
 * A conta é a mesma de `gerar-capas-cursos.mjs`: Georgia bold tem largura média
 * ~0,52 do corpo. Estimar erra pouco e erra para menos, que é o lado seguro —
 * a linha sobra em vez de vazar pela borda do livro.
 */
function quebrar(texto, corpo, largura) {
  const max = Math.max(6, Math.floor(largura / (corpo * 0.52)));
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
 * Escreve título e endereço sobre a capa que o modelo desenhou.
 *
 * ## O relevo
 *
 * Ouro chapado sobre couro lê como adesivo. O que faz ler como GRAVADO são três
 * camadas na mesma posição: uma cópia escura deslocada 2px para baixo (a sombra
 * que a letra afundada projeta), uma cópia clara deslocada 1px para cima (a luz
 * batendo na borda de cima do sulco) e o ouro por cima. É o mesmo truque do
 * gradiente `#ouro`, que já tem o reflexo no meio.
 *
 * ## A moldura de onde o texto pode ficar
 *
 * ⚠️ O livro que o modelo desenha não ocupa o quadro inteiro: ele fica centrado,
 * com fundo em volta e a lombada de um dos lados. Escrever de borda a borda do
 * QUADRO poria o título no ar, ao lado do livro. Os limites abaixo foram
 * medidos nas gerações de 04/08 e descrevem a capa, não a imagem.
 *
 * Se o enquadramento do prompt mudar, estes números precisam ser remedidos —
 * o sintoma de estarem errados é o título encostando na lombada ou saindo para
 * o fundo.
 */
const CAPA = { x: 0.14, largura: 0.70, tituloY: 0.155, rodapeY: 0.80 };

/**
 * Onde a capa do livro começa e termina, MEDIDO nesta imagem.
 *
 * ⚠️ Por que não uma moldura fixa: o modelo não põe o livro no mesmo lugar duas
 * vezes. Entre duas gerações do mesmo prompt a capa andou ~40px e mudou de
 * largura. Com moldura fixa, o título encostava na lombada numa e sobrava para
 * o fundo na outra — e o defeito só apareceria depois de subir, em algumas
 * capas e não em todas, que é o pior formato de defeito.
 *
 * Como mede: o fundo é quase preto por construção (`FUNDO`) e o couro é bem
 * mais claro. Varrendo algumas linhas na faixa do TÍTULO — não no meio, onde a
 * arte de cristal brilha e mentiria sobre a borda — a primeira e a última
 * coluna acima do limiar são as bordas da capa.
 *
 * Se não achar borda (fundo claro demais, livro escuro demais), devolve a
 * moldura fixa: uma estimativa razoável é melhor que uma medida errada.
 */
async function medirCapa(pngBuffer, L, A) {
  const { data, info } = await sharp(pngBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const linhas = [0.16, 0.2, 0.24, 0.28].map((f) => Math.floor(A * f));
  const LIMIAR = 46; // acima do fundo "very dark charcoal", abaixo do couro escuro
  let esq = Infinity;
  let dir = -Infinity;

  for (const y of linhas) {
    let e = -1;
    let d = -1;
    for (let x = 0; x < L; x++) {
      if (data[y * info.width + x] > LIMIAR) {
        if (e < 0) e = x;
        d = x;
      }
    }
    if (e >= 0 && d - e > L * 0.35) {
      esq = Math.min(esq, e);
      dir = Math.max(dir, d);
    }
  }

  if (!isFinite(esq) || dir <= esq) {
    return { x: Math.round(L * CAPA.x), largura: Math.round(L * CAPA.largura) };
  }

  // A borda direita achada inclui a LOMBADA e as páginas, que ficam do lado de
  // fora da capa da frente. Descontar 9% evita o título subir na quina — foi o
  // defeito visto na primeira geração do `autoresearch-singularity`.
  const bruta = dir - esq;
  return { x: Math.round(esq), largura: Math.round(bruta * 0.91) };
}

async function escreverNaCapa(pngBuffer, titulo) {
  const meta = await sharp(pngBuffer).metadata();
  const L = meta.width;
  const A = meta.height;

  const medida = await medirCapa(pngBuffer, L, A);
  const capaX = medida.x;
  const capaL = medida.largura;
  const centro = capaX + capaL / 2;

  // Corpo proporcional à capa, encolhendo quando o título é longo — assim
  // "Autoresearch e a Singularidade" cabe em duas linhas em vez de três
  // apertadas, e "n8n" não vira um cartaz.
  let corpo = Math.round(capaL * 0.135);
  let linhas = quebrar(titulo, corpo, capaL * 0.84);
  while (linhas.length > 2 && corpo > capaL * 0.075) {
    corpo = Math.round(corpo * 0.9);
    linhas = quebrar(titulo, corpo, capaL * 0.84);
  }

  const alturaLinha = Math.round(corpo * 1.18);
  const topo = Math.round(A * CAPA.tituloY) + corpo;

  const tspans = linhas
    .map((l, i) => `<tspan x="${centro}" dy="${i === 0 ? 0 : alturaLinha}">${esc(l)}</tspan>`)
    .join("");

  const texto = (dx, dy, fill, opacidade) => `
    <text x="${centro}" y="${topo + dy}" text-anchor="middle"
          font-family="Georgia, 'Times New Roman', serif" font-size="${corpo}"
          font-weight="700" letter-spacing="-0.4"
          fill="${fill}" opacity="${opacidade}"
          transform="translate(${dx},0)">${tspans}</text>`;

  const rodapeY = Math.round(A * CAPA.rodapeY);
  const corpoRodape = Math.round(capaL * 0.055);
  const rodape = (dy, fill, op) => `
    <text x="${centro}" y="${rodapeY + dy}" text-anchor="middle"
          font-family="Helvetica, Arial, sans-serif" font-size="${corpoRodape}"
          font-weight="600" letter-spacing="${corpoRodape * 0.12}"
          fill="${fill}" opacity="${op}">fayai.com.br</text>`;

  const svg = `<svg width="${L}" height="${A}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ouro" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f7e7b4"/>
      <stop offset="45%" stop-color="#e2bb62"/>
      <stop offset="55%" stop-color="#c99a3c"/>
      <stop offset="100%" stop-color="#f1dc9e"/>
    </linearGradient>
  </defs>
  ${texto(0, 2, "#000000", 0.55)}
  ${texto(0, -1, "#ffffff", 0.22)}
  ${texto(0, 0, "url(#ouro)", 1)}
  ${rodape(2, "#000000", 0.5)}
  ${rodape(0, "url(#ouro)", 0.92)}
</svg>`;

  return sharp(pngBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .toBuffer();
}

async function gerar(prompt, semente, slug) {
  const r = await fetch(`${COMFY}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: fluxo(prompt, semente, slug) }),
  });
  if (!r.ok) throw new Error(`enfileirar HTTP ${r.status}: ${await r.text()}`);
  const { prompt_id } = await r.json();

  const inicio = Date.now();
  while (Date.now() - inicio < 600000) {
    const h = await (await fetch(`${COMFY}/history/${prompt_id}`)).json();
    const item = h[prompt_id];
    if (item?.status?.status_str === "error") {
      const msg = item.status.messages?.find((m) => m[0] === "execution_error");
      throw new Error(`ComfyUI falhou: ${JSON.stringify(msg?.[1]?.exception_message ?? "")}`);
    }
    const img = Object.values(item?.outputs ?? {}).flatMap((o) => o.images ?? [])[0];
    if (img) {
      const q = new URLSearchParams({
        filename: img.filename, subfolder: img.subfolder ?? "", type: img.type ?? "output",
      });
      return Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer());
    }
    await new Promise((s) => setTimeout(s, 2000));
  }
  throw new Error("tempo esgotado no ComfyUI");
}

/* ── O catálogo ─────────────────────────────────────────────────────────── */

async function produtos(slugs) {
  const uri = process.env.MONGODB_URI_PRODUTOS || process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI_PRODUTOS ausente — rode com --env-file=.env.local");
  const cli = new MongoClient(uri);
  await cli.connect();
  try {
    const col = cli.db("fayapointProdutos").collection("products");
    const filtro = slugs.length ? { slug: { $in: slugs } } : { status: "active" };
    return await col
      .find(filtro, { projection: { slug: 1, name: 1, shortName: 1, tool: 1, level: 1 } })
      .sort({ slug: 1 })
      .toArray();
  } finally {
    await cli.close();
  }
}

/* ── Principal ──────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const flag = (n, padrao = null) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : padrao;
};
const tem = (n) => argv.includes(`--${n}`);

const slugs = argv.reduce((acc, a, i) => (a === "--slug" && argv[i + 1] ? [...acc, argv[i + 1]] : acc), []);
const variantes = Number(flag("variantes", 3));
const eleger = flag("eleger") ? Number(flag("eleger")) : null;
const sementeBase = flag("semente") ? Number(flag("semente")) : null;

const DIR_FINAL = path.join(process.cwd(), "scripts", "_capas_livro");
const DIR_VAR = path.join(DIR_FINAL, "_variantes");

async function main() {
  // Recomposição: nenhuma GPU envolvida, só tipografia.
  const recompor = flag("recompor");
  if (recompor) {
    const titulo = flag("titulo", "Título de Teste");
    const { readFile } = await import("node:fs/promises");
    const bruto = await readFile(recompor);
    const recortado = await sharp(bruto)
      .resize(LARGURA_FINAL, ALTURA_FINAL, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();
    await mkdir(DIR_VAR, { recursive: true });
    const destino = path.join(DIR_VAR, `_recomposto-${path.basename(recompor, ".png")}.webp`);
    await sharp(await escreverNaCapa(recortado, titulo)).webp({ quality: 92 }).toFile(destino);
    console.log(path.relative(process.cwd(), destino));
    return;
  }

  if (!slugs.length && !tem("todos")) {
    console.error("Use --slug <slug> (pode repetir) ou --todos.");
    process.exit(1);
  }

  // Falhar cedo e com nome: sem o ComfyUI de pé, cada curso daria um
  // `fetch failed` genérico e a rodada de 22 levaria minutos para dizer isso.
  try {
    await fetch(`${COMFY}/system_stats`, { signal: AbortSignal.timeout(8000) });
  } catch {
    console.error(`ComfyUI não responde em ${COMFY}. Abra-o (ele não sobe sozinho) e repita.`);
    process.exit(1);
  }

  await mkdir(DIR_VAR, { recursive: true });
  const lista = await produtos(slugs);
  if (!lista.length) {
    console.error("Nenhum produto encontrado para esses slugs.");
    process.exit(1);
  }

  console.log(`${lista.length} curso(s) × ${variantes} variante(s) = ${lista.length * variantes} geração(ões)\n`);

  for (const p of lista) {
    const titulo = p.shortName?.trim() || p.name || p.slug;
    const prompt = promptLivroQwen(p);
    console.log(`── ${p.slug}  ·  "${titulo}"`);

    for (let v = 1; v <= variantes; v++) {
      const semente = sementeBase !== null ? sementeBase + v - 1 : Math.floor(Math.random() * 2 ** 31);
      const t0 = Date.now();
      try {
        const png = await gerar(prompt, semente, p.slug);
        const destino = path.join(DIR_VAR, `${p.slug}-${v}.webp`);

        // ⚠️ Recorta ANTES de escrever. A moldura `CAPA` está em fração do
        // quadro FINAL — escrever em 800×1152 e recortar depois moveria o
        // título junto com o corte e o tiraria do centro da capa.
        const recortado = await sharp(png)
          // `cover` e não `fill`: esticar 800×1152 para 720×1040 deformaria a
          // arte em 0,3% na horizontal.
          .resize(LARGURA_FINAL, ALTURA_FINAL, { fit: "cover", position: "centre" })
          .png()
          .toBuffer();

        const comTexto = await escreverNaCapa(recortado, titulo);
        await sharp(comTexto).webp({ quality: 92 }).toFile(destino);
        console.log(`   v${v}  semente ${semente}  ${((Date.now() - t0) / 1000).toFixed(0)}s  →  ${path.relative(process.cwd(), destino)}`);
      } catch (e) {
        console.error(`   v${v}  FALHOU: ${e.message}`);
      }
    }

    if (eleger) {
      const origem = path.join(DIR_VAR, `${p.slug}-${eleger}.webp`);
      if (existsSync(origem)) {
        await copyFile(origem, path.join(DIR_FINAL, `${p.slug}.webp`));
        console.log(`   eleita: v${eleger} → _capas_livro/${p.slug}.webp`);
      }
    }
    console.log();
  }

  const feitas = (await readdir(DIR_VAR)).filter((f) => f.endsWith(".webp")).length;
  console.log(`Pronto. ${feitas} variante(s) em ${path.relative(process.cwd(), DIR_VAR)}.`);
  console.log("Confira a GRAFIA do título em cada uma antes de eleger — o modelo escreve bem, não escreve sempre.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
