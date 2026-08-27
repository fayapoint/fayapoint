/* ⚠️ ARQUIVO GERADO — NÃO EDITE AQUI.
 * Fonte: worldforge-fayai/engine/prompts/video.ts
 * Edite lá e rode: node scripts/forja/sincronizar-engine.mjs
 * Conferir se a cópia está em dia: node scripts/forja/sincronizar-engine.mjs --conferir
 */
/**
 * O PROMPT DE VÍDEO — dialeto LTX 2.5.
 *
 * ## Por que o vídeo não é "o prompt de imagem com movimento no fim"
 *
 * O LTX 2.5 é condicionado por um Gemma de 12B. Ele lê LINGUAGEM, não lista de
 * etiquetas. O mesmo quadro que o Z-Image entende como
 * "medium shot, 85mm, golden hour, push-in" o LTX entende muito melhor como
 * "a medium shot in late golden-hour sun; the camera pushes in slowly". A
 * diferença aparece no resultado: com lista de etiquetas ele produz movimento
 * genérico, com frase ele produz a trajetória descrita.
 *
 * ## A ordem que o LTX quer (medida, não suposta)
 *
 * Ação principal → detalhe do movimento → personagem e ambiente → câmera e luz.
 * Abaixo de 200 palavras, **uma ação dominante a cada 2–3 s**. A aderência do
 * 2.5 é alta: briefing focado bate briefing exaustivo. O áudio entra como frase
 * comum, nunca como lista de tags.
 *
 * ## A armadilha que custa cinco minutos de GPU por erro
 *
 * `forca` (o `strength` da primeira passada) decide se o texto pedido aparece.
 * Acima de ~0,7 o i2v obedece à IMAGEM e trata o prompt como ajuste — ele não
 * inventa uma parede que não existe na semente. Abaixo de ~0,6 ele tem
 * liberdade para construir a cena descrita, e aí o texto entra. Escolher errado
 * não dá erro: dá um clipe inteiro sem o que se pediu. Por isso a escolha é
 * função (`forcaPara`), e não um campo que alguém preenche de memória.
 */

import { fraseDeCamera, textoDoAjuste, type Ajustes } from "../vocabulario";
import { descreverPersonagem, type Personagem } from "../personagem";

/**
 * O negativo do LTX.
 *
 * Diferente do de imagem: aqui os inimigos são temporais. `morphing faces` e
 * `flickering` são os dois defeitos que aparecem em clipe e não em quadro, e
 * `warped text` está aqui mesmo quando não se pede texto — porque o modelo
 * inventa letreiro em vitrine, em placa e em tela de celular por conta própria.
 */
export const NEGATIVO_VIDEO = [
  "cartoon, 3d render, videogame, plastic skin, waxy",
  "distorted hands, extra fingers, morphing faces, identity drift",
  "warped text, misspelled text, gibberish letters, watermark, logo overlay, subtitles",
  "blurry, low resolution, jpeg artifacts, oversaturated, flickering, jittery motion",
].join(", ");

export const NEGATIVO_VIDEO_SEM_MARCA =
  "brand logos, sports team crests, sponsor logos, trademarked symbols on clothing";

export interface QuadroParaVideo {
  acao: string;
  acaoEn?: string;
  ajustes: Ajustes;
  /** o que a pessoa fala neste quadro — vira fala sincronizada, se pedido */
  fala?: string;
  /** o que está escrito, quando se quer a letra DENTRO da cena */
  textoNaTela?: string;
  duracao?: number;
  cenarioEn?: string;
}

export interface ContextoDeVideo {
  aspecto: "9:16" | "4:5" | "1:1" | "16:9";
  personagens?: Array<{ personagem: Personagem; figurinoId?: string }>;
  coresDaMarca?: string;
  /** a imagem de partida (o quadro já gerado). Sem ela, é texto→vídeo. */
  imagemDePartida?: string;
  /** manda a letra para dentro da cena (muda a `forca`) */
  textoNaCena?: boolean;
  /** a fala é dita em cena, com áudio sincronizado */
  falaSincronizada?: boolean;
}

export interface PromptDeVideo {
  positivo: string;
  negativo: string;
  /** o `strength` da primeira passada — ver `forcaPara` */
  forca: number;
  segundos: number;
  /** o comprimento em quadros, já na grade 8n+1 */
  comprimento: number;
  fps: number;
  largura: number;
  altura: number;
  leitura: string;
  /** por que a força é essa — vai para a tela, para a escolha ser explicável */
  porqueForca: string;
}

export const TAMANHOS_VIDEO: Record<string, { largura: number; altura: number }> = {
  // ⚠️ Múltiplos de 32. O LTX corta em silêncio o que não estiver na grade.
  "9:16": { largura: 704, altura: 1280 },
  "4:5": { largura: 832, altura: 1024 },
  "1:1": { largura: 960, altura: 960 },
  "16:9": { largura: 1280, altura: 704 },
};

/**
 * A força da primeira passada — a decisão que mais muda o resultado.
 *
 * Os três casos, na ordem em que o produto os encontra:
 *
 * 1. **Sem imagem de partida** — é texto→vídeo, e `forca` não se aplica; o 1.0
 *    é o que o grafo espera para ignorar a entrada.
 * 2. **Quer letra na cena** — precisa de liberdade para construir a superfície
 *    onde a letra vai. 0,55.
 * 3. **Tem gente com rosto travado** — o rosto da semente é o ativo; qualquer
 *    liberdade a mais é risco de virar outra pessoa. 0,8.
 * 4. **O resto** — 0,7, que é o ponto em que o clipe ainda parece a imagem
 *    aprovada e já tem movimento próprio.
 */
export function forcaPara(ctx: ContextoDeVideo): { forca: number; porque: string } {
  if (!ctx.imagemDePartida) {
    return { forca: 1, porque: "Sem quadro de partida: o clipe é construído do zero pelo texto." };
  }
  if (ctx.textoNaCena) {
    return {
      forca: 0.55,
      porque:
        "Você pediu letra dentro da cena. Com força baixa o gerador pode construir a parede ou a tela onde a letra se apoia — acima de 0,7 ele obedeceria à imagem e a letra não apareceria.",
    };
  }
  if (ctx.personagens?.length) {
    return {
      forca: 0.8,
      porque:
        "Tem gente no quadro: a força alta segura o rosto da imagem aprovada e impede que ele vire outra pessoa no meio do movimento.",
    };
  }
  return { forca: 0.7, porque: "O clipe segue a imagem aprovada e ganha movimento próprio." };
}

/** O comprimento tem que ser 8n+1. Fora da grade, o sampler devolve clipe mais curto sem avisar. */
export function comprimentoDe(segundos: number, fps: number): number {
  const bruto = Math.round(segundos * fps) + 1;
  return Math.max(9, Math.round((bruto - 1) / 8) * 8 + 1);
}

function limpar(s: string): string {
  return s.replace(/\s+/g, " ").replace(/\s+\./g, ".").replace(/\.\.+/g, ".").trim();
}

/**
 * Monta o prompt de vídeo de um quadro.
 *
 * Cada bloco é uma FRASE, e as frases entram na ordem que o LTX quer. O corte
 * em 200 palavras é o teto medido: acima disso a aderência cai, e o que se
 * perde é sempre o fim — a câmera e a luz.
 */
export function montarPromptDeVideo(q: QuadroParaVideo, ctx: ContextoDeVideo): PromptDeVideo {
  const fps = 24;
  const segundos = Math.max(2, Math.min(10, q.duracao || 5));
  const { largura, altura } = TAMANHOS_VIDEO[ctx.aspecto] || TAMANHOS_VIDEO["9:16"];
  const { forca, porque } = forcaPara(ctx);

  const frases: string[] = [];

  // 1 — a ação dominante
  const acao = (q.acaoEn || q.acao || "").trim().replace(/[.\s]+$/, "");
  if (acao) frases.push(`${acao[0].toUpperCase()}${acao.slice(1)}.`);

  /**
   * 2 — quem está em cena.
   *
   * ⚠️ Mesma regra da imagem: `flat-lay` e `tela` são enquadramentos de OBJETO,
   * e mandar a descrição de uma pessoa junto faz o gerador colocá-la ali. Em
   * vídeo o estrago é maior, porque são minutos de GPU em vez de segundos.
   */
  const semPessoa = q.ajustes?.enquadramento === "flat-lay" || q.ajustes?.enquadramento === "tela";
  const gente = semPessoa
    ? []
    : (ctx.personagens || []).map(({ personagem, figurinoId }) =>
        descreverPersonagem(personagem, { figurinoId, alvo: "video", consistente: true }),
      );
  if (gente.length) {
    frases.push(`In frame: ${gente.join("; ")}.`);
  }

  // 3 — o ambiente
  if (q.cenarioEn) frases.push(`${q.cenarioEn.replace(/[.\s]+$/, "")}.`);

  // 4 — a letra como objeto físico (só quando pedida)
  if (ctx.textoNaCena && q.textoNaTela) {
    const letra = q.textoNaTela.trim();
    frases.push(
      `The words "${letra}" appear in the scene as crisp physical lettering on a surface — real material with its own thickness and shadow — and stay perfectly locked to that surface as the camera moves.`,
    );
  }

  // 5 — a câmera e a luz, por último e em frase
  const camera = fraseDeCamera(q.ajustes, { alvo: "video", coresDaMarca: ctx.coresDaMarca });
  if (camera) frases.push(`${camera.replace(/[.\s]+$/, "")}.`);

  // 6 — o áudio, como frase comum
  if (ctx.falaSincronizada && q.fala) {
    /**
     * O marcador de fala do LTX. A transcrição real entra pelo grafo
     * (`StringReplace`), e não aqui, para a mesma cena poder ser regerada com
     * outra fala sem recompor o prompt inteiro.
     */
    const quem = ctx.personagens?.[0]?.personagem.nome ? "the person" : "the speaker";
    frases.push(`${quem[0].toUpperCase()}${quem.slice(1)} says "<Transcript1>".`);
  }
  const audio = textoDoAjuste("audio", q.ajustes.audio, "video");
  if (audio) frases.push(audio);

  let positivo = limpar(frases.join(" "));

  // o teto de 200 palavras: o que sobra é sempre o fim, então corta-se o fim
  const palavras = positivo.split(/\s+/);
  if (palavras.length > 200) positivo = `${palavras.slice(0, 200).join(" ")}.`;

  const negativo = [NEGATIVO_VIDEO, gente.length ? NEGATIVO_VIDEO_SEM_MARCA : ""].filter(Boolean).join(", ");

  return {
    positivo,
    negativo,
    forca,
    porqueForca: porque,
    segundos,
    comprimento: comprimentoDe(segundos, fps),
    fps,
    largura,
    altura,
    leitura: [
      `O que acontece: ${q.acao}`,
      q.fala ? `Fala: "${q.fala}"` : "",
      `Duração: ${segundos}s · ${ctx.aspecto} · ${largura}×${altura}`,
      ctx.imagemDePartida ? "Parte do quadro que você aprovou." : "Construído do zero pelo texto.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

/**
 * ⚠️ Com força baixa, o PRIMEIRO QUADRO ainda é a semente.
 *
 * Medido em 13/08/2026: com `forca` 0,6 o clipe abre na imagem de partida e só
 * depois entra a cena descrita. Em produção isso é um flash da imagem errada no
 * começo do Reel. Esta função diz quantos quadros cortar — o corte acontece no
 * grafo (`Video Slice`), não aqui.
 */
export function quadrosParaCortar(forca: number, fps: number): number {
  if (forca >= 0.65) return 0;
  return Math.round(fps * 0.25); // um quarto de segundo
}
