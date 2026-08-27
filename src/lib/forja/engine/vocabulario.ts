/* ⚠️ ARQUIVO GERADO — NÃO EDITE AQUI.
 * Fonte: worldforge-fayai/engine/vocabulario.ts
 * Edite lá e rode: node scripts/forja/sincronizar-engine.mjs
 * Conferir se a cópia está em dia: node scripts/forja/sincronizar-engine.mjs --conferir
 */
/**
 * O VOCABULÁRIO — o dicionário fechado de direção de fotografia da Forja.
 *
 * ## Por que um vocabulário fechado, e não texto livre
 *
 * O que separa uma imagem de IA amadora de uma que parece filmada não é o
 * modelo: é a descrição. "mulher sorrindo na loja" e "medium close-up, 85mm,
 * shallow depth of field, golden hour side light, warm palette, subtle film
 * grain" saem do mesmo gerador e não se parecem.
 *
 * O WorldForge acumulou esse vocabulário fazendo storyboard de série. Aqui ele
 * serve à peça do usuário: **rótulo em português** para ele escolher, **texto
 * em inglês** para o gerador receber. O usuário nunca precisa saber inglês de
 * set de filmagem; o prompt sai como se soubesse.
 *
 * ## As três decisões desta revisão (27/08/2026)
 *
 * 1. **Cada opção fala DOIS idiomas de máquina.** `imagem` é o fragmento
 *    nominal que modelo de difusão come melhor ("85mm portrait lens, creamy
 *    background separation"); `video` é a mesma ideia em FRASE, porque o LTX
 *    2.5 é condicionado por Gemma e responde a linguagem natural — "the camera
 *    pushes in slowly" bate "slow push-in dolly" nele. Ter os dois no mesmo
 *    lugar é o que impede o quadro e o clipe de descreverem cenas diferentes.
 *
 * 2. **Os conflitos são DADO, não pedido no prompt do sistema.** O motor antigo
 *    pedia ao modelo, em português, que não misturasse POV com close-up de
 *    rosto. Pedir funciona quase sempre — e "quase sempre" numa fila que roda
 *    sozinha vira quadro impossível gerado às 3 da manhã. Aqui o conflito está
 *    em `CONFLITOS` e `resolverConflitos()` conserta antes de compor. O pedido
 *    ao modelo continua existindo, como primeira linha de defesa.
 *
 * 3. **Nada de opção que o gerador não honra.** Toda entrada aqui foi escrita
 *    para caber na ordem que o LTX 2.5 quer (ação → movimento → personagem e
 *    ambiente → câmera e luz) e no que o Z-Image/Qwen entendem. Opção bonita
 *    que o modelo ignora é botão que mente para o usuário.
 */

export interface Opcao {
  valor: string;
  rotulo: string;
  /** o que isso significa em uma linha, para quem nunca filmou */
  explica: string;
  /** fragmento nominal — para modelo de imagem (Z-Image, Qwen, Flux) */
  imagem: string;
  /**
   * frase natural — para o LTX 2.5, que é condicionado por Gemma.
   *
   * Vazio significa "a de imagem serve": vale para tudo que descreve estado
   * (lente, paleta) e não movimento.
   */
  video?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Enquadramento — o que cabe no quadro
// ─────────────────────────────────────────────────────────────────────

export const ENQUADRAMENTO: Opcao[] = [
  {
    valor: "extreme-close",
    rotulo: "Detalhe",
    explica: "só um detalhe: a mão, o produto, o olho",
    imagem: "extreme close-up, macro detail shot, intimate focus on a single feature",
    video: "an extreme close-up that fills the frame with one small detail",
  },
  {
    valor: "close-up",
    rotulo: "Primeiro plano",
    explica: "o rosto ocupa a tela — emoção",
    imagem: "close-up shot, face filling frame, capturing emotion and subtle expression",
    video: "a close-up on the face, holding the expression",
  },
  {
    valor: "medium-close",
    rotulo: "Meio primeiro plano",
    explica: "cabeça e ombros — como numa conversa",
    imagem: "medium close-up, head and shoulders, conversational framing",
    video: "a medium close-up framing head and shoulders, as in conversation",
  },
  {
    valor: "medium",
    rotulo: "Plano médio",
    explica: "da cintura para cima — gesto e ambiente",
    imagem: "medium shot, waist up, balanced between subject and environment",
    video: "a medium shot from the waist up, gesture and room both readable",
  },
  {
    valor: "full-shot",
    rotulo: "Corpo inteiro",
    explica: "a pessoa por completo no lugar",
    imagem: "full shot, entire body visible, subject in complete context",
    video: "a full shot with the whole body in frame",
  },
  {
    valor: "wide",
    rotulo: "Plano aberto",
    explica: "o lugar manda, a pessoa é parte dele",
    imagem: "wide shot, establishing environment, subject within larger context",
    video: "a wide establishing shot where the place dominates",
  },
  {
    valor: "flat-lay",
    rotulo: "Mesa vista de cima",
    explica: "objetos arrumados, câmera no teto",
    imagem: "flat lay top-down shot, objects arranged on surface, overhead perspective",
    video: "an overhead top-down frame looking straight down at the surface",
  },
  {
    /**
     * ⚠️ Entrou em 27/08/2026 para fechar um buraco real: metade dos quadros de
     * conteúdo é tela de celular ou de computador, e o vocabulário antigo só
     * tinha `extreme-close`. O resultado eram prints com moldura de telefone
     * ocupando 5% do quadro, ilegíveis no feed.
     */
    valor: "tela",
    rotulo: "Tela cheia",
    explica: "a tela do celular ou do computador ocupa o quadro",
    imagem:
      "screen-filling shot of a device display, screen occupies most of the frame, slight off-axis angle, crisp interface",
    video: "the device screen fills the frame and stays readable as the camera drifts slightly",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Ângulo — de onde se olha
// ─────────────────────────────────────────────────────────────────────

export const ANGULO: Opcao[] = [
  {
    valor: "eye-level",
    rotulo: "Na altura dos olhos",
    explica: "natural, de igual para igual",
    imagem: "eye-level shot, natural perspective, direct engagement",
    video: "the camera sits at eye level, level with the subject",
  },
  {
    valor: "low-angle",
    rotulo: "De baixo",
    explica: "dá autoridade ao que está na frente",
    imagem: "low-angle shot looking up, emphasizing authority and presence",
    video: "the camera looks up from below, making the subject tower",
  },
  {
    valor: "high-angle",
    rotulo: "De cima",
    explica: "acolhe, diminui, mostra o conjunto",
    imagem: "high-angle shot looking down, overview and approachability",
    video: "the camera looks down from above, taking in the whole arrangement",
  },
  {
    valor: "over-shoulder",
    rotulo: "Por trás do ombro",
    explica: "o espectador entra na cena",
    imagem: "over-the-shoulder shot, viewer placed inside the conversation",
    video: "the camera sits behind a shoulder, looking past it into the scene",
  },
  {
    valor: "pov",
    rotulo: "Ponto de vista",
    explica: "a câmera é o olho de quem age",
    imagem: "first-person POV shot, camera as the subject's own eyes, hands visible in frame",
    video: "a first-person point of view: the camera is the person's own eyes, their hands enter the bottom of the frame",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Luz
// ─────────────────────────────────────────────────────────────────────

export const LUZ: Opcao[] = [
  {
    valor: "natural",
    rotulo: "Luz natural",
    explica: "do dia, sem equipamento",
    imagem: "natural lighting, sun as key light, authentic ambient illumination",
    video: "lit only by daylight",
  },
  {
    valor: "golden-hour",
    rotulo: "Fim de tarde",
    explica: "dourada, sombra longa, calor",
    imagem: "golden hour lighting, warm sunset tones, long soft shadows",
    video: "late golden-hour sun rakes across the scene, shadows long and warm",
  },
  {
    valor: "window",
    rotulo: "Luz de janela",
    explica: "suave, de lado — a mais fácil de repetir",
    imagem: "soft window light from the side, gentle falloff, natural indoor key",
    video: "soft window light falls from one side",
  },
  {
    valor: "studio-soft",
    rotulo: "Estúdio suave",
    explica: "limpa, sem sombra dura — produto",
    imagem: "soft studio lighting, large diffused source, clean shadowless product look",
    video: "a large diffused studio source lights everything evenly",
  },
  {
    valor: "neon",
    rotulo: "Neon urbano",
    explica: "cor forte, noite, cidade",
    imagem: "neon lighting, saturated magenta and cyan, urban night mood",
    video: "magenta and cyan neon spill over everything, reflections on wet surfaces",
  },
  {
    valor: "hard",
    rotulo: "Luz dura",
    explica: "sombra marcada, contraste, drama",
    imagem: "hard directional light, sharp defined shadows, high contrast drama",
    video: "one hard light throws sharp shadows",
  },
  {
    valor: "backlight",
    rotulo: "Contraluz",
    explica: "silhueta e brilho no contorno",
    imagem: "backlight, rim light separating subject from background, glowing edges",
    video: "the light comes from behind, tracing a bright rim around the subject",
  },
  {
    valor: "tela-como-luz",
    rotulo: "Luz da tela",
    explica: "o rosto iluminado pelo monitor — trabalho noturno",
    imagem: "face lit only by the glow of a screen, cool blue key from below, dark surroundings",
    video: "the screen is the only light source, its glow shifting across the face",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Lente e profundidade — estado, não movimento: `video` herda `imagem`
// ─────────────────────────────────────────────────────────────────────

export const LENTE: Opcao[] = [
  { valor: "wide-24", rotulo: "Grande angular (24mm)", explica: "cabe tudo, exagera o perto", imagem: "24mm wide angle lens, expansive field of view" },
  { valor: "normal-35", rotulo: "Natural (35mm)", explica: "vê como o olho vê", imagem: "35mm lens, natural documentary perspective" },
  { valor: "portrait-85", rotulo: "Retrato (85mm)", explica: "achata bonito o rosto, fundo desfoca", imagem: "85mm portrait lens, flattering compression, creamy background separation" },
  { valor: "macro", rotulo: "Macro", explica: "textura de pertinho", imagem: "macro lens, extreme detail, textural surface" },
  { valor: "phone", rotulo: "Celular", explica: "parece feito por quem estava lá", imagem: "smartphone camera look, casual authentic framing" },
];

export const PROFUNDIDADE: Opcao[] = [
  { valor: "shallow", rotulo: "Fundo desfocado", explica: "a pessoa salta da imagem", imagem: "shallow depth of field, f/1.8, creamy bokeh, subject isolation" },
  { valor: "moderate", rotulo: "Equilibrado", explica: "pessoa nítida, fundo legível", imagem: "moderate depth of field, f/4, subject sharp with soft background" },
  { valor: "deep", rotulo: "Tudo nítido", explica: "o ambiente também conta a história", imagem: "deep depth of field, f/8, everything in sharp focus" },
];

// ─────────────────────────────────────────────────────────────────────
// Paleta e estilo
// ─────────────────────────────────────────────────────────────────────

export const PALETA: Opcao[] = [
  { valor: "warm", rotulo: "Quente", explica: "acolhe: âmbar, terracota, dourado", imagem: "warm color palette, amber and terracotta tones, golden highlights" },
  { valor: "cool", rotulo: "Fria", explica: "tecnologia, calma, azul e cinza", imagem: "cool color palette, blue and steel grey tones, clean technical mood" },
  { valor: "earth", rotulo: "Terrosa", explica: "artesanal, natural, bege e verde", imagem: "earthy palette, beige, olive and clay tones, natural materials" },
  { valor: "vibrant", rotulo: "Vibrante", explica: "para parar o dedo na rolagem", imagem: "vibrant saturated palette, bold contrasting colors, high energy" },
  { valor: "pastel", rotulo: "Pastel", explica: "leve, delicado, sem clichê", imagem: "soft pastel palette, muted low-saturation tones, airy feel" },
  { valor: "mono", rotulo: "Monocromática", explica: "uma cor só, e o resto neutro", imagem: "monochromatic palette with a single accent color against neutrals" },
  { valor: "marca", rotulo: "Cores da marca", explica: "usa as cores que você já usa", imagem: "brand color palette" },
];

export const ESTILO: Opcao[] = [
  {
    valor: "documental",
    rotulo: "Documental",
    explica: "parece flagrante, não posado",
    imagem: "documentary photography, candid unposed moment, natural imperfection, real skin texture",
    video: "shot like a documentary: candid, unposed, nothing staged",
  },
  {
    valor: "editorial",
    rotulo: "Editorial",
    explica: "revista: composição limpa e intencional",
    imagem: "editorial photography, deliberate composition, magazine quality, controlled negative space",
    video: "composed like an editorial spread, deliberate and clean",
  },
  {
    valor: "produto",
    rotulo: "Produto",
    explica: "o objeto é a estrela, fundo controlado",
    imagem: "product photography, controlled seamless background, hero object lighting, crisp edges",
    video: "product-film look: the object is the hero, background controlled",
  },
  {
    valor: "ugc",
    rotulo: "Feito por cliente",
    explica: "cru, honesto, celular na mão",
    imagem: "UGC style, handheld smartphone photo, unpolished authentic look, slightly imperfect framing",
    video: "filmed on a phone by someone who was there, slightly unsteady and honest",
  },
  {
    valor: "cinematico",
    rotulo: "Cinematográfico",
    explica: "parece quadro de filme",
    imagem: "cinematic still, anamorphic feel, filmic color grading, subtle grain",
    video: "cinematic, filmic color, the frame composed like a movie still",
  },
  {
    valor: "3d",
    rotulo: "3D estilizado",
    explica: "render limpo, quase brinquedo",
    imagem: "stylized 3D render, soft global illumination, clean rounded shapes, subsurface scattering",
    video: "a clean stylized 3D render with soft global illumination",
  },
  {
    valor: "ilustracao",
    rotulo: "Ilustração",
    explica: "desenho, não foto",
    imagem: "flat vector illustration, clean shapes, limited palette, no photographic texture",
    video: "flat illustrated animation, clean shapes, limited palette",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Movimento — só faz sentido em vídeo
// ─────────────────────────────────────────────────────────────────────

/**
 * ⚠️ Aqui o campo `video` é o que importa e o `imagem` é o subproduto.
 *
 * Num quadro parado, "push-in" não existe — mas a INTENÇÃO do movimento muda a
 * composição do primeiro quadro (um push-in começa mais aberto do que termina).
 * Por isso o texto de imagem descreve o ponto de PARTIDA, não o movimento.
 */
export const MOVIMENTO: Opcao[] = [
  {
    valor: "static",
    rotulo: "Parada",
    explica: "a câmera não anda",
    imagem: "locked-off static frame",
    video: "the camera stays completely still on a tripod",
  },
  {
    valor: "push-in",
    rotulo: "Aproxima",
    explica: "entra devagar no assunto",
    imagem: "composed slightly wide, leaving room to move closer",
    video: "the camera pushes in slowly toward the subject",
  },
  {
    valor: "pull-out",
    rotulo: "Afasta",
    explica: "revela o entorno",
    imagem: "composed tight on the subject",
    video: "the camera pulls back to reveal the surroundings",
  },
  {
    valor: "pan",
    rotulo: "Varre",
    explica: "acompanha de lado",
    imagem: "subject placed off-center with space to move into",
    video: "the camera pans smoothly across, following the action",
  },
  {
    valor: "tilt",
    rotulo: "Sobe o olhar",
    explica: "vai do chão para o alto, ou o contrário",
    imagem: "vertical composition with strong top-to-bottom structure",
    video: "the camera tilts upward, revealing the scene from bottom to top",
  },
  {
    valor: "handheld",
    rotulo: "Na mão",
    explica: "vibra de leve — presença humana",
    imagem: "slightly off-axis handheld framing",
    video: "handheld, with a small human tremor in the frame",
  },
  {
    valor: "orbit",
    rotulo: "Gira em volta",
    explica: "mostra o objeto por todos os lados",
    imagem: "three-quarter angle on the subject",
    video: "the camera circles around the subject, revealing its other side",
  },
  {
    valor: "tracking",
    rotulo: "Acompanha andando",
    explica: "anda junto com quem se move",
    imagem: "subject mid-stride, motion implied",
    video: "the camera tracks alongside the subject as they move, holding the same distance",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Grupos novos (27/08/2026) — o que faltava para peça de criador
// ─────────────────────────────────────────────────────────────────────

/**
 * O HUMOR do quadro.
 *
 * Existe porque "luz" e "paleta" descrevem a física e não a intenção. Dois
 * quadros com a mesma luz de janela contam coisas opostas dependendo de o rosto
 * estar aliviado ou tenso — e o gerador só sabe disso se alguém disser.
 */
export const HUMOR: Opcao[] = [
  { valor: "confiante", rotulo: "Confiante", explica: "quem sabe o que está fazendo", imagem: "calm confident presence, relaxed shoulders, steady gaze" },
  { valor: "aliviado", rotulo: "Aliviado", explica: "o peso saiu das costas", imagem: "visible relief, softened posture, a breath let out" },
  { valor: "concentrado", rotulo: "Concentrado", explica: "trabalho de verdade acontecendo", imagem: "deep focus, absorbed in the task, unaware of the camera" },
  { valor: "tenso", rotulo: "Tenso", explica: "o problema antes da virada", imagem: "tension in the jaw and hands, pressure held in" },
  { valor: "caloroso", rotulo: "Caloroso", explica: "acolhe quem está do outro lado", imagem: "warm open expression, welcoming body language" },
  { valor: "surpreso", rotulo: "Surpreso", explica: "a informação que muda tudo", imagem: "genuine surprise caught mid-reaction, eyes widening" },
  { valor: "neutro", rotulo: "Neutro", explica: "sem emoção marcada — deixa o objeto falar", imagem: "neutral unemphatic expression" },
];

/**
 * O ÁUDIO do clipe — só LTX 2.5, e por isso só `video`.
 *
 * ⚠️ O `comfy-video` mede que o LTX come áudio como FRASE ("Audio: light rain,
 * distant traffic") e engasga com lista de tags. Por isso o `imagem` fica vazio
 * e o `video` é uma frase inteira, já com o prefixo `Audio:`.
 */
export const AUDIO: Opcao[] = [
  { valor: "sem-audio", rotulo: "Sem som", explica: "silêncio — a trilha entra na edição", imagem: "", video: "" },
  { valor: "ambiente-interno", rotulo: "Ambiente interno", explica: "o zumbido da sala", imagem: "", video: "Audio: quiet room tone, a distant refrigerator hum, occasional keyboard taps." },
  { valor: "rua", rotulo: "Rua", explica: "cidade lá fora", imagem: "", video: "Audio: street ambience, distant traffic, footsteps on pavement." },
  { valor: "cafe", rotulo: "Cafeteria", explica: "conversa borrada e xícaras", imagem: "", video: "Audio: café ambience, blurred conversation, cups on saucers, an espresso machine." },
  { valor: "natureza", rotulo: "Natureza", explica: "vento, pássaros, folhas", imagem: "", video: "Audio: light wind through leaves, distant birdsong." },
  { valor: "fala", rotulo: "A pessoa fala", explica: "a fala do quadro é dita em cena", imagem: "", video: "" },
];

// ─────────────────────────────────────────────────────────────────────
// O índice
// ─────────────────────────────────────────────────────────────────────

export const GRUPOS = [
  { chave: "enquadramento", rotulo: "Enquadramento", opcoes: ENQUADRAMENTO, soVideo: false },
  { chave: "angulo", rotulo: "Ângulo", opcoes: ANGULO, soVideo: false },
  { chave: "luz", rotulo: "Luz", opcoes: LUZ, soVideo: false },
  { chave: "lente", rotulo: "Lente", opcoes: LENTE, soVideo: false },
  { chave: "profundidade", rotulo: "Profundidade", opcoes: PROFUNDIDADE, soVideo: false },
  { chave: "paleta", rotulo: "Paleta", opcoes: PALETA, soVideo: false },
  { chave: "estilo", rotulo: "Estilo", opcoes: ESTILO, soVideo: false },
  { chave: "humor", rotulo: "Humor", opcoes: HUMOR, soVideo: false },
  { chave: "movimento", rotulo: "Movimento", opcoes: MOVIMENTO, soVideo: true },
  { chave: "audio", rotulo: "Som", opcoes: AUDIO, soVideo: true },
] as const;

export type ChaveAjuste = (typeof GRUPOS)[number]["chave"];

/** Os ajustes de um quadro — as chaves, não os textos. */
export type Ajustes = Partial<Record<ChaveAjuste, string>>;

const MAPA: Record<string, Opcao[]> = Object.fromEntries(
  GRUPOS.map((g) => [g.chave, g.opcoes as unknown as Opcao[]]),
);

/** As chaves válidas de cada grupo — é contra isto que `limparAjustes` filtra. */
export const CHAVES_VALIDAS: Record<string, string[]> = Object.fromEntries(
  GRUPOS.map((g) => [g.chave, (g.opcoes as unknown as Opcao[]).map((o) => o.valor)]),
);

/** O fragmento em inglês de um ajuste, no idioma de máquina pedido. */
export function textoDoAjuste(grupo: string, valor: string | undefined, alvo: "imagem" | "video" = "imagem"): string {
  if (!valor) return "";
  const o = MAPA[grupo]?.find((x) => x.valor === valor);
  if (!o) return "";
  if (alvo === "video") return o.video !== undefined ? o.video : o.imagem;
  return o.imagem;
}

/** O rótulo em português — o que aparece na tela. */
export function rotuloDoAjuste(grupo: string, valor?: string): string {
  if (!valor) return "";
  return MAPA[grupo]?.find((o) => o.valor === valor)?.rotulo || valor;
}

// ─────────────────────────────────────────────────────────────────────
// Os conflitos — o que NÃO existe no mundo físico
// ─────────────────────────────────────────────────────────────────────

/**
 * Combinações que produzem quadro impossível, com o conserto de cada uma.
 *
 * ## Por que isto é dado e não súplica
 *
 * O motor de storyboard antigo listava estas mesmas regras em português no
 * prompt do sistema, com um ⚠️ explicando que na primeira geração de verdade o
 * modelo pediu "close-up do rosto" com ângulo "pov". A instrução reduz a
 * frequência; não zera. E a Forja vai rodar numa FILA, sozinha, gerando vídeo
 * que custa minutos de GPU: um quadro impossível ali não é um retrabalho de
 * clique, é meia hora de placa queimada.
 *
 * `quando` é lido como E de todas as condições; `entao` é o que se sobrescreve.
 * A ordem importa — conserta-se de cima para baixo.
 */
export const CONFLITOS: Array<{
  quando: Partial<Record<ChaveAjuste, string[]>>;
  entao: Ajustes;
  porque: string;
}> = [
  {
    // Num POV vê-se o que a pessoa vê, não ela.
    quando: { angulo: ["pov"], enquadramento: ["close-up", "medium-close"] },
    entao: { enquadramento: "medium" },
    porque: "Em ponto de vista não se vê o próprio rosto — o enquadramento virou plano médio.",
  },
  {
    quando: { angulo: ["over-shoulder"], enquadramento: ["close-up"] },
    entao: { enquadramento: "medium-close" },
    porque: "Por trás do ombro não cabe primeiro plano do rosto de quem está na frente.",
  },
  {
    // Mesa vista de cima é ângulo por definição: dois ângulos brigam.
    quando: { enquadramento: ["flat-lay"] },
    entao: { angulo: "high-angle" },
    porque: "Mesa vista de cima já é um ângulo — o de baixo e o de olhos não se aplicam.",
  },
  {
    quando: { enquadramento: ["tela"], angulo: ["low-angle", "pov"] },
    entao: { angulo: "high-angle" },
    porque: "Tela cheia é lida de cima ou de frente; de baixo o reflexo come a interface.",
  },
  {
    // Macro em plano aberto é contradição ótica.
    quando: { lente: ["macro"], enquadramento: ["wide", "full-shot"] },
    entao: { lente: "normal-35" },
    porque: "Lente macro não abre plano — a lente virou natural.",
  },
  {
    quando: { lente: ["portrait-85"], enquadramento: ["wide"] },
    entao: { lente: "normal-35" },
    porque: "85mm não faz plano aberto sem afastar a câmera meio quarteirão.",
  },
  {
    // "Tudo nítido" e "fundo desfocado" pedidos juntos pela lente e pela
    // profundidade: quem manda é a profundidade, que é a escolha explícita.
    quando: { profundidade: ["deep"], lente: ["portrait-85"] },
    entao: { lente: "normal-35" },
    porque: "Profundidade total pede lente que feche o diafragma sem esmagar o fundo.",
  },
  {
    quando: { luz: ["tela-como-luz"], estilo: ["produto"] },
    entao: { luz: "studio-soft" },
    porque: "Foto de produto não se ilumina com brilho de monitor.",
  },
];

export interface ResultadoConflito {
  ajustes: Ajustes;
  /** o que foi consertado, em português — vai para a tela, não para o prompt */
  correcoes: string[];
}

/**
 * Fica só com opção válida e conserta o que é fisicamente impossível.
 *
 * Modelo inventa valor, e valor inventado não vira prompt. Depois de filtrar,
 * aplica `CONFLITOS` — e devolve o que mudou, porque o usuário tem o direito de
 * ver que a máquina mexeu na escolha dele.
 */
export function resolverConflitos(bruto: unknown): ResultadoConflito {
  const a: Ajustes = {};
  const correcoes: string[] = [];

  if (bruto && typeof bruto === "object") {
    for (const [grupo, permitidos] of Object.entries(CHAVES_VALIDAS)) {
      const v = (bruto as Record<string, unknown>)[grupo];
      if (typeof v === "string" && permitidos.includes(v)) {
        (a as Record<string, string>)[grupo] = v;
      }
    }
  }

  for (const regra of CONFLITOS) {
    const bate = Object.entries(regra.quando).every(([g, vals]) => {
      const atual = (a as Record<string, string | undefined>)[g];
      return atual !== undefined && (vals as string[]).includes(atual);
    });
    if (!bate) continue;
    // só corrige se REALMENTE muda algo — senão a tela mostra aviso à toa
    const mudou = Object.entries(regra.entao).some(
      ([g, v]) => (a as Record<string, string | undefined>)[g] !== v,
    );
    if (!mudou) continue;
    Object.assign(a, regra.entao);
    correcoes.push(regra.porque);
  }

  return { ajustes: a, correcoes };
}

/**
 * A frase de câmera: junta os ajustes escolhidos numa linha.
 *
 * A ordem não é alfabética — é a ordem em que um diretor de fotografia
 * descreveria: o que se vê, de onde, com que lente, com que luz, em que cor, em
 * que estilo. O movimento fica por último porque em imagem ele é só a dica de
 * composição e em vídeo é a última coisa que o LTX quer ouvir.
 */
export function fraseDeCamera(
  a: Ajustes,
  opcoes: { alvo?: "imagem" | "video"; coresDaMarca?: string } = {},
): string {
  const alvo = opcoes.alvo || "imagem";
  const partes = [
    textoDoAjuste("enquadramento", a.enquadramento, alvo),
    textoDoAjuste("angulo", a.angulo, alvo),
    textoDoAjuste("lente", a.lente, alvo),
    textoDoAjuste("profundidade", a.profundidade, alvo),
    textoDoAjuste("luz", a.luz, alvo),
    a.paleta === "marca" && opcoes.coresDaMarca
      ? `brand color palette: ${opcoes.coresDaMarca}`
      : textoDoAjuste("paleta", a.paleta, alvo),
    textoDoAjuste("estilo", a.estilo, alvo),
    textoDoAjuste("humor", a.humor, alvo),
    textoDoAjuste("movimento", a.movimento, alvo),
  ].filter(Boolean);
  return partes.join(alvo === "video" ? ". " : ", ");
}

/** As opções de um grupo em texto, para montar o pedido ao modelo. */
export function listarParaOModelo(soVideo: boolean): string {
  return GRUPOS.filter((g) => (soVideo ? true : !g.soVideo))
    .map((g) => `${g.chave}: ${(g.opcoes as unknown as Opcao[]).map((o) => o.valor).join(" | ")}`)
    .join("\n");
}
