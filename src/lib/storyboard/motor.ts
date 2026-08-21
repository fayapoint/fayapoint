import { blocoDePersona, type PersonaProfunda } from "@/lib/persona";
import { fraseDeCamera, type Ajustes } from "./cinematica";

/**
 * O motor de storyboard — a engenharia do WorldForge aplicada ao conteúdo do usuário.
 *
 * ## O que muda em relação a "gerar um post com IA"
 *
 * Um gerador de post devolve texto. Um storyboard devolve **um plano de
 * filmagem**: quadro a quadro, o que aparece, de que ângulo, com que luz, o que
 * está escrito na tela, o que a pessoa fala e por quanto tempo. É a diferença
 * entre uma legenda e uma peça que dá para produzir.
 *
 * ## As três decisões que sustentam isso
 *
 * 1. **A persona entra como duas pessoas, nunca uma.** Quem aparece no quadro é
 *    o usuário; para quem o quadro fala é o público dele. Misturar os dois é o
 *    erro que produz "mulher de 35 anos" quando o usuário é homem — o mesmo
 *    buraco que já custou caro no gerador de livro.
 * 2. **Texto na tela é camada, não pixel.** O gerador de imagem escreve errado
 *    em português. Então o texto sai como dado (`textoNaTela`) e o prompt de
 *    imagem pede explicitamente *nenhuma* letra. Quem escreve é o editor.
 * 3. **O prompt final é composto, não pedido ao modelo.** O modelo escolhe os
 *    ajustes (enquadramento, luz, paleta) entre opções fechadas; a frase em
 *    inglês é montada por código. Assim o vocabulário não degrada de uma
 *    geração para a outra.
 */

export type IdFormato = "reel" | "carrossel" | "story" | "post" | "anuncio";

export interface Formato {
  id: IdFormato;
  titulo: string;
  promessa: string;
  aspecto: "9:16" | "4:5" | "1:1";
  quadros: number;
  /** cada quadro tem duração em segundos? (peça em vídeo) */
  temTempo: boolean;
  /** cada quadro tem fala/narração? */
  temFala: boolean;
  /** a espinha narrativa que o modelo tem de seguir */
  estrutura: string[];
}

export const FORMATOS: Record<IdFormato, Formato> = {
  reel: {
    id: "reel",
    titulo: "Reel",
    promessa: "vídeo vertical de 15 a 30 segundos",
    aspecto: "9:16",
    quadros: 5,
    temTempo: true,
    temFala: true,
    estrutura: [
      "Gancho — os 2 primeiros segundos precisam quebrar a rolagem com uma imagem, não com uma frase",
      "Contexto — a situação real de quem assiste, reconhecível em um quadro",
      "Virada — o que muda quando se sabe o que você sabe",
      "Prova — algo concreto: número, antes e depois, bastidor",
      "Chamada — o próximo passo, uma coisa só",
    ],
  },
  carrossel: {
    id: "carrossel",
    titulo: "Carrossel",
    promessa: "sequência de cartões para arrastar",
    aspecto: "4:5",
    quadros: 6,
    temTempo: false,
    temFala: false,
    estrutura: [
      "Capa — a promessa inteira em uma imagem e cinco palavras",
      "O problema — nomear a dor com as palavras de quem sente",
      "A causa — por que acontece, sem culpar quem lê",
      "O caminho — o passo que resolve",
      "A prova — exemplo concreto do seu trabalho",
      "Chamada — o convite, direto",
    ],
  },
  story: {
    id: "story",
    titulo: "Story",
    promessa: "três telas rápidas, tom de bastidor",
    aspecto: "9:16",
    quadros: 3,
    temTempo: true,
    temFala: true,
    estrutura: [
      "Flagrante — o que está acontecendo agora",
      "O detalhe — o que só quem faz percebe",
      "Convite — pergunta ou enquete",
    ],
  },
  post: {
    id: "post",
    titulo: "Post único",
    promessa: "uma imagem e uma legenda",
    aspecto: "4:5",
    quadros: 1,
    temTempo: false,
    temFala: false,
    estrutura: ["Uma imagem que carrega a ideia inteira sem precisar de legenda para ser entendida"],
  },
  anuncio: {
    id: "anuncio",
    titulo: "Anúncio",
    promessa: "peça para tráfego pago",
    aspecto: "1:1",
    quadros: 3,
    temTempo: true,
    temFala: true,
    estrutura: [
      "Interrupção — fala com quem tem o problema, nomeando o problema",
      "Oferta — o que é, para quem, com a prova mais forte que existir",
      "Ação — o clique, com o motivo de ser agora",
    ],
  },
};

export interface Quadro {
  /** posição, começando em 1 */
  numero: number;
  titulo: string;
  /** o que acontece no quadro, em português, visualmente */
  acao: string;
  /** a mesma frase em inglês — é ela que vira prompt de imagem */
  acaoEn?: string;
  /** o que está escrito na tela — camada de edição, não pixel */
  textoNaTela?: string;
  /** o que a pessoa fala ou o narrador diz */
  fala?: string;
  duracao?: number;
  ajustes: Ajustes;
  /** o prompt em inglês, montado por `montarPrompt` */
  prompt: string;
  negativo: string;
  /** URL da arte gerada, quando existir */
  arte?: string;
  estado?: "planejado" | "gerado" | "aprovado";
}

export interface Storyboard {
  _id?: string;
  userId: string;
  formato: IdFormato;
  tema: string;
  titulo: string;
  legenda: string;
  hashtags: string[];
  quadros: Quadro[];
  criadoEm?: Date;
  atualizadoEm?: Date;
}

/**
 * O negativo padrão.
 *
 * `text, letters, words, watermark` está aqui porque o texto do quadro é
 * camada: pedir letra ao gerador devolve português inventado — e o quadro
 * inteiro se perde por causa de uma palavra torta.
 */
export const NEGATIVO_PADRAO =
  "text, letters, words, typography, watermark, logo, signature, caption, subtitles, " +
  "extra fingers, deformed hands, distorted face, plastic skin, uncanny, " +
  "low resolution, jpeg artifacts, oversaturated, stock photo cliché";

/** Quem aparece no quadro — a trava de identidade, quando a persona tem rosto. */
function travaDeIdentidade(p: PersonaProfunda, nome?: string): string {
  const partes: string[] = [];
  const i = p.identidade || {};
  if (nome) partes.push(`the creator (${nome})`);
  if (i.papel) partes.push(i.papel);
  if (i.cidade) partes.push(`based in ${i.cidade}`);
  return partes.join(", ");
}

/**
 * Monta o prompt de imagem de um quadro.
 *
 * A ordem importa: assunto e ação primeiro (é o que o modelo mais pesa),
 * ambiente depois, câmera no fim. Termina sempre com o aspecto.
 */
export function montarPrompt(
  quadro: Pick<Quadro, "acao" | "ajustes"> & { acaoEn?: string },
  contexto: { formato: Formato; persona: PersonaProfunda; nome?: string; comRosto?: boolean },
): string {
  const { formato, persona, nome, comRosto } = contexto;
  const partes: string[] = [];

  // o gerador de imagem entende inglês muito melhor do que português — a
  // frase em PT fica na tela para o criador ler, a EN vai para o modelo
  partes.push((quadro.acaoEn || quadro.acao).trim());

  if (comRosto) {
    const trava = travaDeIdentidade(persona, nome);
    if (trava) partes.push(`subject: ${trava}, consistent face across all frames`);
  }

  const camera = fraseDeCamera(quadro.ajustes);
  if (camera) partes.push(camera);

  partes.push(`${formato.aspecto} vertical composition with safe margins for on-screen text`);
  partes.push("no text in the image");

  return partes.filter(Boolean).join(", ");
}

/** O sistema — o que o modelo é e o que ele nunca faz. */
export const SISTEMA =
  "Você é diretor de arte e roteirista de conteúdo curto. Recebe o perfil real de um criador e devolve um STORYBOARD produzível.\n" +
  "REGRAS:\n" +
  "- Português do Brasil, tom de quem conversa. Nada de jargão de agência.\n" +
  "- O CRIADOR e o PÚBLICO DELE são pessoas diferentes. Nunca atribua ao criador o gênero, a idade, a profissão ou as dores listadas no bloco do público. Se o gênero dele não estiver declarado, escreva sem citar gênero.\n" +
  "- Cada quadro descreve o que SE VÊ, em uma frase visual e concreta. Nada de 'mostrar profissionalismo' — isso não é imagem.\n" +
  "- Use o que o perfil traz de concreto: a cidade, o que vende, o ticket, a objeção que ele ouve. Não invente dado que não está lá.\n" +
  "- O texto na tela é curto: no máximo 7 palavras por quadro.\n" +
  "- Escolha os ajustes de câmera SOMENTE entre os valores permitidos. Devolva a chave, não a descrição.\n" +
  // ⚠️ As duas regras abaixo entraram em 20/08/2026, na primeira geração de
  // verdade: o modelo pediu "close-up do rosto" junto com ângulo "pov" (num
  // POV não se vê o rosto de quem filma) e "corpo inteiro" para um print de
  // tela. O gerador de imagem obedece aos dois e devolve quadro impossível.
  "- Coerência de câmera: 'pov' e 'over-shoulder' não combinam com enquadramento de rosto (close-up, medium-close). Em POV vê-se o que a pessoa vê, não ela.\n" +
  "- Quando o quadro é objeto, tela de celular, print ou detalhe — sem pessoa no quadro —, use 'extreme-close' ou 'flat-lay'. Nunca 'full-shot' nem 'medium'.\n" +
  "- `acao` vai em português (é o criador que lê). `acaoEn` é a MESMA frase em inglês, e é ela que vira prompt de imagem: escreva em inglês simples e visual, sem adjetivo de sentimento.\n" +
  "- Responda SÓ com o JSON pedido, sem comentário e sem cerca de código.";

/** O pedido — persona, formato, tema e o formato exato da resposta. */
export function montarPedido(entrada: {
  persona: PersonaProfunda;
  nome?: string;
  formato: Formato;
  tema: string;
  observacao?: string;
  quadros: number;
}): string {
  const { persona, nome, formato, tema, observacao, quadros } = entrada;
  const perfil = [blocoDePersona(persona, "post", { nome }), blocoDePersona(persona, "imagem", { nome })]
    .filter(Boolean)
    .join("\n\n");

  const estrutura = formato.estrutura.slice(0, quadros).map((e, i) => `${i + 1}. ${e}`).join("\n");

  return [
    "## PERFIL DO CRIADOR",
    perfil || "(perfil ainda vazio — escreva de forma útil e neutra, sem inventar dados)",
    "",
    "## PEÇA",
    `Formato: ${formato.titulo} — ${formato.promessa} (${formato.aspecto})`,
    `Tema: ${tema}`,
    observacao ? `Observação do criador: ${observacao}` : "",
    "",
    "## ESPINHA NARRATIVA (siga na ordem, um quadro para cada)",
    estrutura,
    "",
    "## AJUSTES PERMITIDOS (devolva a chave à esquerda)",
    "enquadramento: extreme-close | close-up | medium-close | medium | full-shot | wide | flat-lay",
    "angulo: eye-level | low-angle | high-angle | over-shoulder | pov",
    "luz: natural | golden-hour | window | studio-soft | neon | hard | backlight",
    "lente: wide-24 | normal-35 | portrait-85 | macro | phone",
    "profundidade: shallow | moderate | deep",
    "paleta: warm | cool | earth | vibrant | pastel | mono | marca",
    "estilo: documental | editorial | produto | ugc | cinematico | 3d | ilustracao",
    formato.temTempo ? "movimento: static | push-in | pull-out | pan | handheld | orbit" : "",
    "",
    "## RESPONDA NESTE JSON",
    "{",
    '  "titulo": "nome curto da peça",',
    '  "legenda": "a legenda do post, no tom do criador, com quebras de linha",',
    '  "hashtags": ["ate", "8", "sem", "o", "jogo", "da", "velha"],',
    '  "quadros": [',
    "    {",
    '      "titulo": "nome do quadro",',
    '      "acao": "o que se vê, em uma frase visual concreta (português)",',
    '      "acaoEn": "the same frame described in plain visual English",',
    '      "textoNaTela": "no máximo 7 palavras",',
    formato.temFala ? '      "fala": "o que a pessoa fala neste quadro",' : "",
    formato.temTempo ? '      "duracao": 4,' : "",
    '      "ajustes": { "enquadramento": "...", "angulo": "...", "luz": "...", "lente": "...", "profundidade": "...", "paleta": "...", "estilo": "..."' +
      (formato.temTempo ? ', "movimento": "..."' : "") +
      " }",
    "    }",
    "  ]",
    "}",
    `Exatamente ${quadros} quadros.`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

const CHAVES: Record<string, string[]> = {
  enquadramento: ["extreme-close", "close-up", "medium-close", "medium", "full-shot", "wide", "flat-lay"],
  angulo: ["eye-level", "low-angle", "high-angle", "over-shoulder", "pov"],
  luz: ["natural", "golden-hour", "window", "studio-soft", "neon", "hard", "backlight"],
  lente: ["wide-24", "normal-35", "portrait-85", "macro", "phone"],
  profundidade: ["shallow", "moderate", "deep"],
  paleta: ["warm", "cool", "earth", "vibrant", "pastel", "mono", "marca"],
  estilo: ["documental", "editorial", "produto", "ugc", "cinematico", "3d", "ilustracao"],
  movimento: ["static", "push-in", "pull-out", "pan", "handheld", "orbit"],
};

/** Fica só com o que é opção válida — modelo inventa valor, e valor inventado não vira prompt. */
function limparAjustes(bruto: unknown): Ajustes {
  const a: Ajustes = {};
  if (!bruto || typeof bruto !== "object") return a;
  for (const [grupo, permitidos] of Object.entries(CHAVES)) {
    const v = (bruto as Record<string, unknown>)[grupo];
    if (typeof v === "string" && permitidos.includes(v)) {
      (a as Record<string, string>)[grupo] = v;
    }
  }
  return a;
}

/** O texto do modelo → storyboard pronto, com os prompts já compostos. */
export function normalizar(
  bruto: string,
  contexto: { formato: Formato; persona: PersonaProfunda; nome?: string; comRosto?: boolean },
): Omit<Storyboard, "userId" | "tema"> {
  const limpo = bruto
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");
  const dado = JSON.parse(limpo) as {
    titulo?: string;
    legenda?: string;
    hashtags?: unknown;
    quadros?: Array<Record<string, unknown>>;
  };

  const quadros: Quadro[] = (dado.quadros || []).map((q, i) => {
    const ajustes = limparAjustes(q.ajustes);
    const acao = String(q.acao || q.titulo || "").trim();
    const acaoEn = q.acaoEn ? String(q.acaoEn).trim() : undefined;
    return {
      numero: i + 1,
      titulo: String(q.titulo || `Quadro ${i + 1}`).trim(),
      acao,
      acaoEn,
      textoNaTela: q.textoNaTela ? String(q.textoNaTela).trim() : undefined,
      fala: q.fala ? String(q.fala).trim() : undefined,
      duracao: contexto.formato.temTempo ? Math.max(1, Math.min(15, Number(q.duracao) || 4)) : undefined,
      ajustes,
      prompt: montarPrompt({ acao, acaoEn, ajustes }, contexto),
      negativo: NEGATIVO_PADRAO,
      estado: "planejado",
    };
  });

  return {
    formato: contexto.formato.id,
    titulo: String(dado.titulo || "Storyboard").trim(),
    legenda: String(dado.legenda || "").trim(),
    hashtags: Array.isArray(dado.hashtags)
      ? dado.hashtags.map((h) => String(h).replace(/^#/, "").trim()).filter(Boolean).slice(0, 8)
      : [],
    quadros,
  };
}
