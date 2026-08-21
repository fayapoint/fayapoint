/**
 * O vocabulário de câmera — portado do WorldForge (`tch/web/src/lib/cinematicPromptOptions.ts`).
 *
 * ## Por que este arquivo existe
 *
 * O que separa uma imagem de IA amadora de uma que parece filmada não é o
 * modelo: é a descrição. "mulher sorrindo na loja" e "medium close-up, 85mm,
 * shallow depth of field, golden hour side light, warm palette, subtle film
 * grain" saem do mesmo gerador e não se parecem.
 *
 * O WorldForge acumulou esse vocabulário fazendo storyboard de série. Aqui ele
 * serve ao post do usuário: **rótulo em português** para ele escolher,
 * **`prompt` em inglês** para o gerador receber. O usuário nunca precisa saber
 * inglês de set de filmagem; o prompt sai como se soubesse.
 */

export interface Opcao {
  valor: string;
  rotulo: string;
  /** o que isso significa em uma linha, para quem nunca filmou */
  explica: string;
  /** o texto que entra no prompt, em inglês */
  prompt: string;
}

export const ENQUADRAMENTO: Opcao[] = [
  { valor: "extreme-close", rotulo: "Detalhe", explica: "só um detalhe: a mão, o produto, o olho", prompt: "extreme close-up, macro detail shot, intimate focus on a single feature" },
  { valor: "close-up", rotulo: "Primeiro plano", explica: "o rosto ocupa a tela — emoção", prompt: "close-up shot, face filling frame, capturing emotion and subtle expression" },
  { valor: "medium-close", rotulo: "Meio primeiro plano", explica: "cabeça e ombros — como numa conversa", prompt: "medium close-up, head and shoulders, conversational framing" },
  { valor: "medium", rotulo: "Plano médio", explica: "da cintura para cima — gesto e ambiente", prompt: "medium shot, waist up, balanced between subject and environment" },
  { valor: "full-shot", rotulo: "Corpo inteiro", explica: "a pessoa por completo no lugar", prompt: "full shot, entire body visible, subject in complete context" },
  { valor: "wide", rotulo: "Plano aberto", explica: "o lugar manda, a pessoa é parte dele", prompt: "wide shot, establishing environment, subject within larger context" },
  { valor: "flat-lay", rotulo: "Mesa vista de cima", explica: "objetos arrumados, câmera no teto", prompt: "flat lay top-down shot, objects arranged on surface, overhead perspective" },
];

export const ANGULO: Opcao[] = [
  { valor: "eye-level", rotulo: "Na altura dos olhos", explica: "natural, de igual para igual", prompt: "eye-level shot, natural perspective, direct engagement" },
  { valor: "low-angle", rotulo: "De baixo", explica: "dá autoridade ao que está na frente", prompt: "low-angle shot looking up, emphasizing authority and presence" },
  { valor: "high-angle", rotulo: "De cima", explica: "acolhe, diminui, mostra o conjunto", prompt: "high-angle shot looking down, overview and approachability" },
  { valor: "over-shoulder", rotulo: "Por trás do ombro", explica: "o espectador entra na cena", prompt: "over-the-shoulder shot, viewer placed inside the conversation" },
  { valor: "pov", rotulo: "Ponto de vista", explica: "a câmera é o olho de quem age", prompt: "first-person POV shot, camera as the subject's own eyes, hands visible" },
];

export const LUZ: Opcao[] = [
  { valor: "natural", rotulo: "Luz natural", explica: "do dia, sem equipamento", prompt: "natural lighting, sun as key light, authentic ambient illumination" },
  { valor: "golden-hour", rotulo: "Fim de tarde", explica: "dourada, sombra longa, calor", prompt: "golden hour lighting, warm sunset tones, long soft shadows" },
  { valor: "window", rotulo: "Luz de janela", explica: "suave, de lado — a mais fácil de repetir", prompt: "soft window light from the side, gentle falloff, natural indoor key" },
  { valor: "studio-soft", rotulo: "Estúdio suave", explica: "limpa, sem sombra dura — produto", prompt: "soft studio lighting, large diffused source, clean shadowless product look" },
  { valor: "neon", rotulo: "Neon urbano", explica: "cor forte, noite, cidade", prompt: "neon lighting, saturated magenta and cyan, urban night mood" },
  { valor: "hard", rotulo: "Luz dura", explica: "sombra marcada, contraste, drama", prompt: "hard directional light, sharp defined shadows, high contrast drama" },
  { valor: "backlight", rotulo: "Contraluz", explica: "silhueta e brilho no contorno", prompt: "backlight, rim light separating subject from background, glowing edges" },
];

export const LENTE: Opcao[] = [
  { valor: "wide-24", rotulo: "Grande angular (24mm)", explica: "cabe tudo, exagera o perto", prompt: "24mm wide angle lens, expansive field of view" },
  { valor: "normal-35", rotulo: "Natural (35mm)", explica: "vê como o olho vê", prompt: "35mm lens, natural documentary perspective" },
  { valor: "portrait-85", rotulo: "Retrato (85mm)", explica: "achata bonito o rosto, fundo desfoca", prompt: "85mm portrait lens, flattering compression, creamy background separation" },
  { valor: "macro", rotulo: "Macro", explica: "textura de pertinho", prompt: "macro lens, extreme detail, textural surface" },
  { valor: "phone", rotulo: "Celular", explica: "parece feito por quem estava lá", prompt: "smartphone camera look, casual authentic framing" },
];

export const PROFUNDIDADE: Opcao[] = [
  { valor: "shallow", rotulo: "Fundo desfocado", explica: "a pessoa salta da imagem", prompt: "shallow depth of field, f/1.8, creamy bokeh, subject isolation" },
  { valor: "moderate", rotulo: "Equilibrado", explica: "pessoa nítida, fundo legível", prompt: "moderate depth of field, f/4, subject sharp with soft background" },
  { valor: "deep", rotulo: "Tudo nítido", explica: "o ambiente também conta a história", prompt: "deep depth of field, f/8, everything in sharp focus" },
];

export const PALETA: Opcao[] = [
  { valor: "warm", rotulo: "Quente", explica: "acolhe: âmbar, terracota, dourado", prompt: "warm color palette, amber and terracotta tones, golden highlights" },
  { valor: "cool", rotulo: "Fria", explica: "tecnologia, calma, azul e cinza", prompt: "cool color palette, blue and steel grey tones, clean technical mood" },
  { valor: "earth", rotulo: "Terrosa", explica: "artesanal, natural, bege e verde", prompt: "earthy palette, beige, olive and clay tones, natural materials" },
  { valor: "vibrant", rotulo: "Vibrante", explica: "para parar o dedo na rolagem", prompt: "vibrant saturated palette, bold contrasting colors, high energy" },
  { valor: "pastel", rotulo: "Pastel", explica: "leve, delicado, feminino sem clichê", prompt: "soft pastel palette, muted low-saturation tones, airy feel" },
  { valor: "mono", rotulo: "Monocromática", explica: "uma cor só, e o resto neutro", prompt: "monochromatic palette with a single accent color against neutrals" },
  { valor: "marca", rotulo: "Cores da marca", explica: "usa as cores que você já usa", prompt: "brand color palette" },
];

export const ESTILO: Opcao[] = [
  { valor: "documental", rotulo: "Documental", explica: "parece flagrante, não posado", prompt: "documentary style, candid unposed moment, natural imperfection" },
  { valor: "editorial", rotulo: "Editorial", explica: "revista: composição limpa e intencional", prompt: "editorial photography style, deliberate composition, magazine quality" },
  { valor: "produto", rotulo: "Produto", explica: "o objeto é a estrela, fundo controlado", prompt: "product photography, controlled background, hero object lighting" },
  { valor: "ugc", rotulo: "Feito por cliente", explica: "cru, honesto, celular na mão", prompt: "UGC style, handheld smartphone, unpolished authentic look" },
  { valor: "cinematico", rotulo: "Cinematográfico", explica: "parece quadro de filme", prompt: "cinematic still, anamorphic feel, filmic color grading" },
  { valor: "3d", rotulo: "3D estilizado", explica: "render limpo, quase brinquedo", prompt: "stylized 3D render, soft global illumination, clean shapes" },
  { valor: "ilustracao", rotulo: "Ilustração", explica: "desenho, não foto", prompt: "flat vector illustration, clean shapes, limited palette" },
];

export const MOVIMENTO: Opcao[] = [
  { valor: "static", rotulo: "Parada", explica: "a câmera não anda", prompt: "static locked-off camera" },
  { valor: "push-in", rotulo: "Aproxima", explica: "entra devagar no assunto", prompt: "slow push-in dolly toward subject" },
  { valor: "pull-out", rotulo: "Afasta", explica: "revela o entorno", prompt: "slow pull-out revealing the surroundings" },
  { valor: "pan", rotulo: "Varre", explica: "acompanha de lado", prompt: "smooth horizontal pan following the action" },
  { valor: "handheld", rotulo: "Na mão", explica: "vibra de leve — presença humana", prompt: "handheld micro-shake, human presence" },
  { valor: "orbit", rotulo: "Gira em volta", explica: "mostra o objeto por todos os lados", prompt: "orbital camera move around the subject" },
];

export const GRUPOS = [
  { chave: "enquadramento", rotulo: "Enquadramento", opcoes: ENQUADRAMENTO },
  { chave: "angulo", rotulo: "Ângulo", opcoes: ANGULO },
  { chave: "luz", rotulo: "Luz", opcoes: LUZ },
  { chave: "lente", rotulo: "Lente", opcoes: LENTE },
  { chave: "profundidade", rotulo: "Profundidade", opcoes: PROFUNDIDADE },
  { chave: "paleta", rotulo: "Paleta", opcoes: PALETA },
  { chave: "estilo", rotulo: "Estilo", opcoes: ESTILO },
  { chave: "movimento", rotulo: "Movimento", opcoes: MOVIMENTO },
] as const;

export type ChaveAjuste = (typeof GRUPOS)[number]["chave"];

/** Os ajustes de um quadro — as chaves, não os textos. */
export type Ajustes = Partial<Record<ChaveAjuste, string>>;

const MAPA: Record<string, Opcao[]> = Object.fromEntries(GRUPOS.map((g) => [g.chave, g.opcoes as unknown as Opcao[]]));

/** O texto em inglês de um ajuste, ou vazio se a chave não existir. */
export function textoDoAjuste(grupo: string, valor?: string): string {
  if (!valor) return "";
  return MAPA[grupo]?.find((o) => o.valor === valor)?.prompt || "";
}

/** O rótulo em português — o que aparece na tela. */
export function rotuloDoAjuste(grupo: string, valor?: string): string {
  if (!valor) return "";
  return MAPA[grupo]?.find((o) => o.valor === valor)?.rotulo || valor;
}

/**
 * A frase de câmera: junta os ajustes escolhidos numa linha em inglês.
 *
 * A ordem não é alfabética — é a ordem em que um diretor de fotografia
 * descreveria: o que se vê, de onde, com que luz, em que cor, em que estilo.
 */
export function fraseDeCamera(a: Ajustes, coresDaMarca?: string): string {
  const partes = [
    textoDoAjuste("enquadramento", a.enquadramento),
    textoDoAjuste("angulo", a.angulo),
    textoDoAjuste("lente", a.lente),
    textoDoAjuste("profundidade", a.profundidade),
    textoDoAjuste("luz", a.luz),
    a.paleta === "marca" && coresDaMarca
      ? `brand color palette: ${coresDaMarca}`
      : textoDoAjuste("paleta", a.paleta),
    textoDoAjuste("estilo", a.estilo),
    textoDoAjuste("movimento", a.movimento),
  ].filter(Boolean);
  return partes.join(", ");
}
