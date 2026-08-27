/* ⚠️ ARQUIVO GERADO — NÃO EDITE AQUI.
 * Fonte: worldforge-fayai/engine/prompts/imagem.ts
 * Edite lá e rode: node scripts/forja/sincronizar-engine.mjs
 * Conferir se a cópia está em dia: node scripts/forja/sincronizar-engine.mjs --conferir
 */
/**
 * O PROMPT DE IMAGEM — a composição, não o pedido.
 *
 * ## A decisão que sustenta este arquivo
 *
 * O prompt final é **composto por código**, nunca pedido ao modelo de texto. O
 * modelo escolhe os ajustes entre opções fechadas (`vocabulario.ts`) e escreve
 * a AÇÃO; a frase em inglês é montada aqui. É o que impede o vocabulário de
 * degradar de uma geração para a outra — e é o que torna possível trocar de
 * gerador sem reescrever nada do lado de cima.
 *
 * ## Os quatro dialetos
 *
 * Modelo de difusão não é intercambiável. O mesmo texto que faz o Z-Image
 * acertar faz o Qwen Edit ignorar a foto de referência, porque o Edit espera
 * INSTRUÇÃO ("mantenha o rosto, troque o fundo") e não DESCRIÇÃO. Por isso a
 * composição termina num `dialeto`, e não numa string só.
 *
 * ## A ordem, e por que ela é essa
 *
 * Assunto e ação primeiro — é o que o modelo mais pesa, e o que ele trunca por
 * último. Depois quem é a pessoa (a trava de identidade), depois o que ela
 * veste, depois onde está, e só então a câmera. O aspecto fecha, porque é
 * instrução de enquadramento e não de conteúdo.
 *
 * ## Texto na imagem
 *
 * Por padrão, **nenhum**. O texto do quadro é camada de edição, não pixel: o
 * gerador escreve português inventado e o quadro inteiro se perde por causa de
 * uma palavra torta. A exceção é declarada e cara — ver `TEXTO_NA_ARTE`.
 */

import { fraseDeCamera, type Ajustes } from "../vocabulario";
import { descreverPersonagem, type Personagem } from "../personagem";

// ─────────────────────────────────────────────────────────────────────
// Os modelos que a casa tem
// ─────────────────────────────────────────────────────────────────────

export type DialetoImagem = "descritivo" | "instrucional" | "tipografico";

export interface ModeloImagem {
  id: string;
  rotulo: string;
  /** o que ele faz melhor que os outros, em uma linha para a tela */
  bom: string;
  dialeto: DialetoImagem;
  /** aceita foto de referência para travar o rosto? */
  aceitaReferencia: boolean;
  /** escreve texto legível dentro da arte? */
  escreveTexto: boolean;
  /** roda na GPU de casa (grátis) ou é API paga? */
  onde: "local" | "nuvem";
  /** passos e cfg do grafo — ficam aqui para a tela poder explicar o custo em tempo */
  passos: number;
  segundosTipicos: number;
}

/**
 * ⚠️ Esta tabela descreve o que está INSTALADO na máquina do Ricardo
 * (verificado em 27/08/2026 contra `/object_info`). Modelo que sai da máquina
 * some daqui — e o motor cai no `padraoDe()`, que devolve o Z-Image.
 *
 * O ERNIE está aqui por um motivo só, e é o motivo certo: das opções locais,
 * é a única que escreve português sem embaralhar. Ver `reference_texto_na_arte_modelo`.
 */
export const MODELOS_IMAGEM: ModeloImagem[] = [
  {
    id: "z-image",
    rotulo: "Rápido",
    bom: "o dia a dia: sai em segundos e acerta cena com gente",
    dialeto: "descritivo",
    aceitaReferencia: false,
    escreveTexto: false,
    onde: "local",
    passos: 8,
    segundosTipicos: 12,
  },
  {
    id: "qwen-2512",
    rotulo: "Caprichado",
    bom: "quando a composição importa: mais detalhe, mais obediência ao pedido",
    dialeto: "descritivo",
    aceitaReferencia: false,
    escreveTexto: false,
    onde: "local",
    passos: 4,
    segundosTipicos: 25,
  },
  {
    id: "qwen-edit",
    rotulo: "Com o seu rosto",
    bom: "parte de uma foto sua e mantém o rosto igual em qualquer cena",
    dialeto: "instrucional",
    aceitaReferencia: true,
    escreveTexto: false,
    onde: "local",
    passos: 4,
    segundosTipicos: 30,
  },
  {
    id: "ernie",
    rotulo: "Com texto na arte",
    bom: "o único que escreve português certo dentro da imagem",
    dialeto: "tipografico",
    aceitaReferencia: false,
    escreveTexto: true,
    onde: "local",
    passos: 20,
    segundosTipicos: 40,
  },
];

export function acharModelo(id?: string): ModeloImagem {
  return MODELOS_IMAGEM.find((m) => m.id === id) || MODELOS_IMAGEM[0];
}

/**
 * O modelo certo para o que se está pedindo, quando ninguém escolheu.
 *
 * A regra é de produto, não técnica: se a pessoa tem rosto cadastrado e o
 * quadro tem gente, o rosto dela é o ativo mais valioso da peça e vale os 30
 * segundos a mais. Se o quadro pede letra, só um modelo serve. No resto, o
 * rápido — porque a fila é de graça mas a paciência não.
 */
export function padraoDe(entrada: { comPessoa?: boolean; comReferencia?: boolean; comTexto?: boolean }): ModeloImagem {
  if (entrada.comTexto) return acharModelo("ernie");
  if (entrada.comPessoa && entrada.comReferencia) return acharModelo("qwen-edit");
  return acharModelo("z-image");
}

// ─────────────────────────────────────────────────────────────────────
// Os negativos
// ─────────────────────────────────────────────────────────────────────

/**
 * O negativo padrão.
 *
 * `text, letters, words, watermark` está aqui porque o texto do quadro é
 * camada: pedir letra ao gerador devolve português inventado. As mãos e os
 * dedos estão porque é o defeito que mais mata quadro de pessoa. E
 * `stock photo cliché` está porque o pecado do conteúdo de negócio não é a
 * imagem feia — é a imagem genérica.
 */
export const NEGATIVO_PADRAO = [
  "text, letters, words, typography, watermark, logo, signature, caption, subtitles",
  "extra fingers, deformed hands, malformed limbs, distorted face, plastic skin, uncanny",
  "low resolution, blurry, jpeg artifacts, oversaturated, harsh HDR",
  "stock photo cliché, generic business handshake, fake smile, staged office",
  /**
   * ⚠️ A linha que nasceu de um prejuízo (27/08/2026).
   *
   * Uma descrição de personagem que pedia consistência "entre os quadros do
   * conjunto" fez o Z-Image devolver uma FOLHA DE CONTATO 3×3 de retratos, no
   * lugar do único quadro pedido. A frase foi consertada em `personagem.ts`,
   * mas a causa é mais geral: qualquer prompt que sugira série, ângulos ou
   * variações convida o gerador a dividir a tela — e a peça do usuário é UM
   * quadro, sempre. Este bloco é o cinto de segurança.
   */
  "contact sheet, photo grid, collage, multiple panels, split screen, storyboard sheet, side-by-side variations, tiled images",
].join(", ");

/** Quando o quadro PEDE letra, o negativo muda de inimigo. */
export const NEGATIVO_COM_TEXTO = [
  "warped text, misspelled text, gibberish letters, duplicated letters, broken glyphs",
  "extra fingers, deformed hands, distorted face, plastic skin",
  "low resolution, blurry, jpeg artifacts, oversaturated",
  "watermark, signature, subtitles",
].join(", ");

/**
 * ⚠️ Marca de terceiro entra sozinha na imagem.
 *
 * Medido: um prompt que dizia apenas "Brazilian friends" devolveu escudo da CBF
 * no peito e swoosh da Nike no ombro. O gerador completa "brasileiro" com o
 * repertório dele, e o repertório dele é cheio de marca registrada. Este bloco
 * entra sempre que há gente vestida no quadro.
 */
export const NEGATIVO_SEM_MARCA =
  "brand logos, sports team crests, national team badges, sponsor logos, trademarked symbols on clothing";

// ─────────────────────────────────────────────────────────────────────
// A composição
// ─────────────────────────────────────────────────────────────────────

export interface QuadroParaImagem {
  /** o que acontece, em português — é o dono que lê */
  acao: string;
  /** a MESMA frase em inglês visual — é ela que vira prompt */
  acaoEn?: string;
  ajustes: Ajustes;
  /** o que está escrito na tela; só vira pixel se `textoNaArte` for verdadeiro */
  textoNaTela?: string;
  /** o cenário, quando o quadro tem um cadastrado */
  cenarioEn?: string;
}

export interface ContextoDeImagem {
  aspecto: "9:16" | "4:5" | "1:1" | "16:9";
  /** quem aparece — a trava de identidade sai daqui */
  personagens?: Array<{ personagem: Personagem; figurinoId?: string }>;
  /** as cores da marca, quando a paleta escolhida é `marca` */
  coresDaMarca?: string;
  /** manda a letra para dentro da arte (custa o modelo tipográfico) */
  textoNaArte?: boolean;
  modelo?: ModeloImagem;
}

export interface PromptDeImagem {
  positivo: string;
  negativo: string;
  modelo: ModeloImagem;
  /** o que o dono lê na tela, em português, para conferir sem saber inglês */
  leitura: string;
}

/**
 * As proporções em pixels, na grade de 64 que os modelos querem.
 *
 * ⚠️ Fora da grade, o VAE corta a borda e a composição escorrega — e o defeito
 * aparece só no resultado, nunca na validação.
 */
export const TAMANHOS: Record<string, { largura: number; altura: number }> = {
  "9:16": { largura: 768, altura: 1344 },
  "4:5": { largura: 896, altura: 1152 },
  "1:1": { largura: 1024, altura: 1024 },
  "16:9": { largura: 1344, altura: 768 },
};

function limpar(s: string): string {
  return s.replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").replace(/,\s*,/g, ",").trim().replace(/[,.\s]+$/, "");
}

/**
 * Monta o prompt de imagem de um quadro.
 *
 * O `dialeto` do modelo decide a FORMA, não o conteúdo: os mesmos blocos, em
 * ordem diferente e com verbo diferente. Um dialeto novo entra aqui e todo o
 * resto do sistema continua igual — que é a razão de a composição ser código.
 */
export function montarPromptDeImagem(
  quadro: QuadroParaImagem,
  ctx: ContextoDeImagem,
): PromptDeImagem {
  const modelo =
    ctx.modelo ||
    padraoDe({
      comPessoa: !!ctx.personagens?.length,
      comReferencia: !!ctx.personagens?.some((p) => p.personagem.referencias?.length || p.personagem.caderno?.imagens?.length),
      comTexto: !!(ctx.textoNaArte && quadro.textoNaTela),
    });

  const acao = (quadro.acaoEn || quadro.acao || "").trim();

  /**
   * ⚠️ Enquadramento de objeto ENGOLE a trava de identidade.
   *
   * `flat-lay` é a câmera no teto olhando uma mesa; `tela` é o celular ocupando
   * o quadro. Nos dois, não há pessoa em cena — e mandar a descrição física de
   * alguém junto faz o gerador colocá-la ali de qualquer jeito, porque o
   * prompt disse que ela existe. Medido: um `flat-lay` de ferramentas com a
   * ficha de um personagem anexada devolveu nove retratos e nenhuma ferramenta.
   *
   * A regra já estava escrita no prompt do sistema, em português, pedindo ao
   * modelo que não misturasse os dois. Pedir reduz; não zera. Aqui a regra é
   * mecânica.
   */
  const semPessoa = quadro.ajustes?.enquadramento === "flat-lay" || quadro.ajustes?.enquadramento === "tela";

  const gente = semPessoa
    ? []
    : (ctx.personagens || [])
        .map(({ personagem, figurinoId }) =>
          descreverPersonagem(personagem, { figurinoId, alvo: "imagem", consistente: true }),
        )
        .filter(Boolean);
  const camera = fraseDeCamera(quadro.ajustes, { alvo: "imagem", coresDaMarca: ctx.coresDaMarca });
  const enquadre = `${ctx.aspecto} composition, subject placed with safe margins so on-screen text can be added later`;

  let positivo: string;

  if (modelo.dialeto === "instrucional") {
    /**
     * Qwen Edit parte de uma foto real. Falar com ele como se descrevesse uma
     * imagem do zero faz ele REDESENHAR a pessoa — que é exatamente o que a
     * foto de referência estava lá para impedir. Então a frase começa com o que
     * PRESERVAR e só depois diz o que muda.
     */
    const preservar =
      "Keep the person's face, hair and body exactly as in the reference photo — same identity, same features.";
    const mudar = `Place them in this scene: ${acao}.`;
    const veste = gente.length ? gente.map((g) => `Wardrobe: ${g}.`).join(" ") : "";
    positivo = limpar([preservar, mudar, veste, camera ? `${camera}.` : "", enquadre].join(" "));
  } else if (modelo.dialeto === "tipografico") {
    /**
     * Letra que gruda no quadro não é "texto animado": é OBJETO FÍSICO. Dar
     * matéria à letra e dizer onde ela está presa é o que separa o texto NA
     * cena do texto SOBRE a cena. Mesma receita que o LTX 2.5 quer.
     */
    const letra = (quadro.textoNaTela || "").trim();
    positivo = limpar(
      [
        acao,
        gente.join(", "),
        letra
          ? `the words "${letra}" rendered as a real physical object in the scene — crisp lettering on a surface within the frame, correctly spelled, in Brazilian Portuguese, with its own shadow`
          : "",
        quadro.cenarioEn || "",
        camera,
        enquadre,
      ].join(", "),
    );
  } else {
    positivo = limpar(
      [acao, gente.join(", "), quadro.cenarioEn || "", camera, enquadre, "no text anywhere in the image"].join(", "),
    );
  }

  const negativo = [
    modelo.escreveTexto && ctx.textoNaArte ? NEGATIVO_COM_TEXTO : NEGATIVO_PADRAO,
    gente.length ? NEGATIVO_SEM_MARCA : "",
  ]
    .filter(Boolean)
    .join(", ");

  return { positivo, negativo, modelo, leitura: leituraEmPortugues(quadro, ctx, modelo, semPessoa) };
}

/**
 * O mesmo prompt, em português, para o dono conferir.
 *
 * Existe porque o usuário da FayAI não lê inglês de set de filmagem — e um
 * campo cheio de "shallow depth of field, 85mm" é uma caixa preta que ele não
 * tem como aprovar. Sem isto, o botão "gerar" é um ato de fé.
 */
function leituraEmPortugues(
  q: QuadroParaImagem,
  ctx: ContextoDeImagem,
  m: ModeloImagem,
  semPessoa = false,
): string {
  const linhas: string[] = [];
  linhas.push(`O que se vê: ${q.acao}`);
  if (ctx.personagens?.length) {
    linhas.push(
      semPessoa
        ? `Ninguém aparece: o enquadramento é de objeto, então deixei ${ctx.personagens.map((p) => p.personagem.nome).join(", ")} de fora.`
        : `Quem aparece: ${ctx.personagens.map((p) => p.personagem.nome).join(", ")}`,
    );
  }
  if (q.textoNaTela) {
    linhas.push(
      ctx.textoNaArte
        ? `Escrito DENTRO da arte: "${q.textoNaTela}"`
        : `Escrito por cima na edição: "${q.textoNaTela}"`,
    );
  }
  linhas.push(`Formato: ${ctx.aspecto} · Gerador: ${m.rotulo}`);
  return linhas.join("\n");
}
