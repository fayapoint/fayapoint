/* ⚠️ ARQUIVO GERADO — NÃO EDITE AQUI.
 * Fonte: worldforge-fayai/engine/personagem.ts
 * Edite lá e rode: node scripts/forja/sincronizar-engine.mjs
 * Conferir se a cópia está em dia: node scripts/forja/sincronizar-engine.mjs --conferir
 */
/**
 * O PERSONAGEM — o rosto que sobrevive a vinte imagens.
 *
 * ## O problema que este arquivo resolve
 *
 * Uma foto produz uma imagem parecida. O que faz o mesmo rosto atravessar cinco
 * quadros de um Reel — de frente, de perfil, no balcão, na rua — é ter a pessoa
 * DESCRITA, não só fotografada. O gerador não guarda memória entre chamadas: se
 * a descrição do quadro 1 diz "homem de barba" e a do quadro 4 diz "o criador",
 * saem duas pessoas diferentes, e o vídeo inteiro se perde.
 *
 * O WorldForge resolveu isso para uma série de TV: ficha de personagem com
 * aparência física em campos fechados, e um construtor que transforma a ficha
 * numa TRAVA DE IDENTIDADE repetida em todo prompt. Este arquivo é essa
 * engenharia, afinada para o criador da FayAI.
 *
 * ## A diferença em relação ao WorldForge original
 *
 * Lá, todo personagem era inventado. Aqui há **três origens**, e elas se
 * comportam de forma diferente:
 *
 * - `criador` — é a pessoa real. A trava sai da persona dela + da foto que ela
 *   enviou, e a foto vale mais que qualquer adjetivo: o caminho de geração é
 *   edição por referência, não descrição.
 * - `publico` — é o cliente típico dela. **Inventado de propósito**, e é aqui
 *   que a criação de personagem devolve valor para a persona: descrever o
 *   cliente em detalhe é a pergunta que o construtor de persona nunca soube
 *   fazer direito. Ver `contribuicaoParaPersona`.
 * - `elenco` — mascote, sócio, funcionário, personagem de história.
 *
 * ⚠️ **A regra que já custou caro**: o criador e o público dele são pessoas
 * DIFERENTES. Misturar os dois foi o que fez o gerador de livro chamar o
 * Ricardo de "mulher de aproximadamente 35 anos". Aqui a separação é
 * estrutural — são registros distintos, com `origem` distinta — e não uma
 * recomendação no prompt.
 */

// ─────────────────────────────────────────────────────────────────────
// Os campos fechados da aparência
// ─────────────────────────────────────────────────────────────────────

export interface OpcaoAparencia {
  valor: string;
  rotulo: string;
  /** o fragmento em inglês que entra na trava de identidade */
  en: string;
}

export const PELE: OpcaoAparencia[] = [
  { valor: "muito-clara", rotulo: "Muito clara", en: "very fair skin" },
  { valor: "clara", rotulo: "Clara", en: "fair skin" },
  { valor: "media", rotulo: "Média", en: "medium skin tone" },
  { valor: "morena-clara", rotulo: "Morena clara", en: "light brown skin" },
  { valor: "morena", rotulo: "Morena", en: "brown skin" },
  { valor: "negra", rotulo: "Negra", en: "dark brown skin" },
  { valor: "negra-retinta", rotulo: "Negra retinta", en: "deep dark skin" },
  { valor: "oliva", rotulo: "Oliva", en: "olive skin" },
];

export const CABELO_COR: OpcaoAparencia[] = [
  { valor: "preto", rotulo: "Preto", en: "black hair" },
  { valor: "castanho-escuro", rotulo: "Castanho escuro", en: "dark brown hair" },
  { valor: "castanho", rotulo: "Castanho", en: "brown hair" },
  { valor: "castanho-claro", rotulo: "Castanho claro", en: "light brown hair" },
  { valor: "loiro", rotulo: "Loiro", en: "blonde hair" },
  { valor: "ruivo", rotulo: "Ruivo", en: "red hair" },
  { valor: "grisalho", rotulo: "Grisalho", en: "greying hair" },
  { valor: "branco", rotulo: "Branco", en: "white hair" },
  { valor: "colorido", rotulo: "Colorido", en: "dyed vivid-colored hair" },
];

export const CABELO_ESTILO: OpcaoAparencia[] = [
  { valor: "curto", rotulo: "Curto", en: "short hair" },
  { valor: "raspado", rotulo: "Raspado", en: "buzzcut" },
  { valor: "careca", rotulo: "Careca", en: "bald" },
  { valor: "medio", rotulo: "Médio", en: "medium-length hair" },
  { valor: "longo", rotulo: "Longo", en: "long hair" },
  { valor: "cacheado", rotulo: "Cacheado", en: "curly hair" },
  { valor: "crespo", rotulo: "Crespo", en: "tightly coiled natural hair" },
  { valor: "ondulado", rotulo: "Ondulado", en: "wavy hair" },
  { valor: "liso", rotulo: "Liso", en: "straight hair" },
  { valor: "preso", rotulo: "Preso / coque", en: "hair tied back in a bun" },
  { valor: "rabo", rotulo: "Rabo de cavalo", en: "ponytail" },
  { valor: "trancas", rotulo: "Tranças", en: "braids" },
  { valor: "dreads", rotulo: "Dreads", en: "dreadlocks" },
];

export const BARBA: OpcaoAparencia[] = [
  { valor: "sem", rotulo: "Sem barba", en: "clean-shaven" },
  { valor: "por-fazer", rotulo: "Por fazer", en: "light stubble" },
  { valor: "curta", rotulo: "Curta", en: "short trimmed beard" },
  { valor: "cheia", rotulo: "Cheia", en: "full beard" },
  { valor: "cavanhaque", rotulo: "Cavanhaque", en: "goatee" },
  { valor: "bigode", rotulo: "Bigode", en: "moustache" },
];

export const OLHOS: OpcaoAparencia[] = [
  { valor: "castanhos", rotulo: "Castanhos", en: "brown eyes" },
  { valor: "castanhos-escuros", rotulo: "Castanhos escuros", en: "dark brown eyes" },
  { valor: "verdes", rotulo: "Verdes", en: "green eyes" },
  { valor: "azuis", rotulo: "Azuis", en: "blue eyes" },
  { valor: "mel", rotulo: "Mel", en: "hazel eyes" },
  { valor: "pretos", rotulo: "Pretos", en: "black eyes" },
];

export const CORPO: OpcaoAparencia[] = [
  { valor: "magro", rotulo: "Magro", en: "slim build" },
  { valor: "esbelto", rotulo: "Esbelto", en: "lean build" },
  { valor: "medio", rotulo: "Médio", en: "average build" },
  { valor: "atletico", rotulo: "Atlético", en: "athletic build" },
  { valor: "forte", rotulo: "Forte", en: "muscular build" },
  { valor: "encorpado", rotulo: "Encorpado", en: "stocky build" },
  { valor: "gordo", rotulo: "Gordo", en: "heavyset build" },
  { valor: "curvilineo", rotulo: "Curvilíneo", en: "curvy build" },
];

/**
 * ⚠️ `neutro` não é ausência de instrução — é uma instrução ATIVA.
 *
 * A mesma regra do `TRATAMENTOS` da persona. Sem marcar gênero, o gerador
 * escolhe um, e escolhe o do estereótipo do ramo: "consultor" sai homem,
 * "manicure" sai mulher. Dizer "androgynous, do not emphasise gender" é o que
 * impede a máquina de decidir pela pessoa.
 */
export const GENERO_APARENTE: OpcaoAparencia[] = [
  { valor: "homem", rotulo: "Homem", en: "a man" },
  { valor: "mulher", rotulo: "Mulher", en: "a woman" },
  { valor: "neutro", rotulo: "Prefiro não marcar", en: "a person, androgynous presentation, do not emphasise gender" },
];

const CATALOGO: Record<string, OpcaoAparencia[]> = {
  pele: PELE,
  cabeloCor: CABELO_COR,
  cabeloEstilo: CABELO_ESTILO,
  barba: BARBA,
  olhos: OLHOS,
  corpo: CORPO,
  genero: GENERO_APARENTE,
};

export function enDe(campo: string, valor?: string): string {
  if (!valor) return "";
  return CATALOGO[campo]?.find((o) => o.valor === valor)?.en || "";
}

export function rotuloDe(campo: string, valor?: string): string {
  if (!valor) return "";
  return CATALOGO[campo]?.find((o) => o.valor === valor)?.rotulo || valor;
}

// ─────────────────────────────────────────────────────────────────────
// O registro
// ─────────────────────────────────────────────────────────────────────

export type OrigemPersonagem = "criador" | "publico" | "elenco";

export interface Aparencia {
  genero?: string;
  idade?: number;
  faixaEtaria?: string;
  pele?: string;
  cabeloCor?: string;
  cabeloEstilo?: string;
  barba?: string;
  olhos?: string;
  corpo?: string;
  alturaCm?: number;
  oculos?: boolean;
  tipoOculos?: string;
  /** cicatrizes, tatuagens, sinais — o que o olho fixa e o gerador esquece */
  marcas?: string[];
  /** a frase que o dono escreveu, e que vale mais que os campos fechados */
  descricaoLivre?: string;
}

export interface Figurino {
  id: string;
  nome: string;
  /** o que veste, em português — o dono lê */
  descricao: string;
  /** o mesmo, em inglês — o gerador lê */
  en?: string;
  /** quando usar: "todo dia", "gravação", "evento" */
  ocasiao?: string;
  padrao?: boolean;
}

export interface Personagem {
  _id?: string;
  userId?: string;
  origem: OrigemPersonagem;
  nome: string;
  /** o papel dele na sua história: "eu", "a cliente que some depois do orçamento", "o mascote" */
  papel?: string;
  /** uma linha que o dono lê e reconhece na hora */
  resumo?: string;

  aparencia: Aparencia;
  figurinos: Figurino[];

  /** ── só faz sentido para `publico`: é isto que devolve valor à persona ── */
  psicologia?: {
    /** o que essa pessoa quer, na frase dela */
    quer?: string;
    /** o que a impede */
    trava?: string;
    /** o que ela diz quando não vai comprar */
    objecao?: string;
    /** onde ela passa o dia */
    rotina?: string;
    /** o jeito de falar dela — vira diálogo e legenda */
    fala?: string;
  };

  /** ── as fotos e o caderno ── */
  /** foto real enviada — quando existe, é ELA que ancora, não a descrição */
  referencias?: string[];
  /** o caderno: o mesmo rosto em vários ângulos, gerado pela fila */
  caderno?: {
    imagens?: string[];
    origem?: string[];
    geradoEm?: Date | string;
    status?: "pendente" | "pronto" | "falhou";
  };

  /**
   * A semente do gerador. Guardada porque semente igual + prompt igual devolve
   * rosto muito mais parecido — é o truque mais barato de consistência que
   * existe, e o que o WorldForge não tinha.
   */
  semente?: number;

  criadoEm?: Date | string;
  atualizadoEm?: Date | string;
}

// ─────────────────────────────────────────────────────────────────────
// A trava de identidade
// ─────────────────────────────────────────────────────────────────────

/**
 * A frase que repete a MESMA pessoa em todo prompt.
 *
 * ## A ordem, e por que ela é essa
 *
 * Gênero e idade primeiro porque é o que o modelo pesa mais e o que erra mais.
 * Depois pele, cabelo, barba, olhos, corpo — do que ocupa mais pixel para o que
 * ocupa menos. As marcas por último, porque são o detalhe que o modelo descarta
 * quando o prompt fica longo, e ficar no fim é ficar perto do que ele acabou de
 * ler.
 *
 * ⚠️ `descricaoLivre` entra INTEIRA e no fim dos campos fechados, não no lugar
 * deles. Quem escreveu "tem uma falha no sorriso e nunca tira o boné" está
 * dizendo algo que nenhum campo fechado captura, e apagar os campos por causa
 * dela perderia a base.
 */
export function travaDeIdentidade(p: Personagem, opcoes: { comNome?: boolean } = {}): string {
  const a = p.aparencia || {};
  const partes: string[] = [];

  if (opcoes.comNome && p.nome) partes.push(`${p.nome}:`);

  const quem = enDe("genero", a.genero) || "a person";
  const idade = a.idade
    ? `${quem} in their ${Math.floor(a.idade / 10) * 10}s, around ${a.idade} years old`
    : a.faixaEtaria
      ? `${quem}, ${a.faixaEtaria}`
      : quem;
  partes.push(idade);

  for (const campo of ["pele", "cabeloEstilo", "cabeloCor", "barba", "olhos", "corpo"] as const) {
    const t = enDe(campo, a[campo] as string | undefined);
    if (t) partes.push(t);
  }

  if (a.alturaCm) partes.push(`${a.alturaCm} cm tall`);
  if (a.oculos) partes.push(a.tipoOculos ? `wearing ${a.tipoOculos} glasses` : "wearing glasses");
  if (a.marcas?.length) partes.push(a.marcas.join(", "));
  if (a.descricaoLivre) partes.push(a.descricaoLivre.trim());

  return partes.join(", ");
}

/** O figurino que vale para este quadro: o pedido, ou o padrão, ou nada. */
export function figurinoDe(p: Personagem, id?: string): Figurino | undefined {
  const lista = p.figurinos || [];
  if (id) {
    const achado = lista.find((f) => f.id === id);
    if (achado) return achado;
  }
  return lista.find((f) => f.padrao) || lista[0];
}

/**
 * A descrição completa do personagem para um quadro: identidade + figurino.
 *
 * `consistente` acrescenta a frase que ensina o gerador a repetir — e ela é
 * diferente em imagem e em vídeo. Em imagem se pede "same face across the
 * set"; num clipe de LTX se pede que o rosto **não se transforme durante o
 * movimento**, que é o defeito real do i2v (morphing faces).
 */
export function descreverPersonagem(
  p: Personagem,
  opcoes: { figurinoId?: string; alvo?: "imagem" | "video"; consistente?: boolean } = {},
): string {
  const alvo = opcoes.alvo || "imagem";
  const partes = [travaDeIdentidade(p)];

  const fig = figurinoDe(p, opcoes.figurinoId);
  if (fig) partes.push(`wearing ${fig.en || fig.descricao}`);

  if (opcoes.consistente) {
    /**
     * ⚠️ ESTA FRASE JÁ QUEBROU UMA GERAÇÃO INTEIRA (27/08/2026).
     *
     * A versão anterior dizia, para IMAGEM, "consistent face and features
     * across every frame of the set". A intenção era boa e a leitura do modelo
     * foi literal: ele produziu uma FOLHA DE CONTATO 3×3 com nove retratos da
     * mesma pessoa. Faz sentido — pedir consistência "entre os quadros do
     * conjunto" descreve um conjunto, e o gerador desenhou o conjunto.
     *
     * A lição: num quadro parado, consistência entre gerações NÃO se pede ao
     * modelo. Ela vem da descrição fechada (acima) mais a SEMENTE fixa. O que
     * se pede aqui é o contrário — que ele entregue UM quadro só.
     *
     * Em vídeo a frase original está certa e continua: ali os quadros existem
     * de verdade dentro da mesma geração, e `morphing faces` é o defeito real.
     */
    partes.push(
      alvo === "video"
        ? "the same face throughout, features stable, no morphing between frames"
        : "a single photograph, one frame",
    );
  }

  return partes.filter(Boolean).join(", ");
}

// ─────────────────────────────────────────────────────────────────────
// A ponte com a persona do usuário
// ─────────────────────────────────────────────────────────────────────

/**
 * O recorte da `PersonaProfunda` de que a Forja precisa.
 *
 * Declarado aqui, e estrutural, para o motor não depender do módulo de persona
 * do site — o motor precisa continuar puro para poder ser vendido para dentro
 * do Next e rodado fora dele (no worker, nos testes).
 */
export interface PersonaEntrada {
  identidade?: { marca?: string; papel?: string; cidade?: string; tratamento?: string };
  publico?: { idade?: [number, number]; lugares?: string[]; quemE?: string; dores?: string[]; desejos?: string[] };
  negocio?: { oQueVende?: string; ticket?: number; canal?: string; objecao?: string; orgulho?: string };
  estrategia?: { pilares?: string[]; assinatura?: string; naoFalar?: string[] };
  voz?: { vocabulario?: string; amostra?: string; bordoes?: string[] };
  fotos?: Array<{ url?: string; origem?: string }>;
  caderno?: { imagens?: string[]; status?: string };
}

/** `tratamento` da persona → `genero` aparente. Neutro é o padrão seguro. */
function generoDoTratamento(t?: string): string {
  if (t === "ele") return "homem";
  if (t === "ela") return "mulher";
  return "neutro";
}

/**
 * Semeia o personagem `criador` a partir do que já sabemos da pessoa.
 *
 * Não inventa aparência: o que a persona sabe é o PAPEL e a CIDADE, não a cor
 * do cabelo. Os campos físicos ficam vazios de propósito — é a tela que os
 * pergunta, uma vez, e aí eles valem para sempre. Inventar aqui produziria um
 * personagem que não se parece com ninguém e que o dono nunca corrigiria,
 * porque campo preenchido não pede atenção.
 */
export function criadorDePersona(persona: PersonaEntrada, nome?: string): Personagem {
  const i = persona.identidade || {};
  const n = persona.negocio || {};
  const fotos = (persona.fotos || [])
    .filter((f) => f.url && f.origem !== "google")
    .map((f) => f.url as string);

  return {
    origem: "criador",
    nome: nome || i.marca || "Você",
    papel: i.papel || "",
    resumo: [i.papel, i.cidade ? `em ${i.cidade}` : "", n.oQueVende ? `— ${n.oQueVende}` : ""]
      .filter(Boolean)
      .join(" ")
      .trim(),
    aparencia: { genero: generoDoTratamento(i.tratamento) },
    figurinos: [],
    referencias: fotos,
    caderno: persona.caderno as Personagem["caderno"],
  };
}

/**
 * Semeia o personagem `publico` — o cliente típico — do que a persona já disse.
 *
 * Aqui o preenchimento automático é o certo, e pelo motivo oposto ao de cima: a
 * persona JÁ tem estes campos respondidos (dores, desejos, objeção, quem é), e
 * copiá-los evita perguntar duas vezes a mesma coisa. O que a ficha acrescenta
 * é a CARA — e é isso que a tela pergunta.
 */
export function publicoDePersona(persona: PersonaEntrada): Personagem {
  const pu = persona.publico || {};
  const ne = persona.negocio || {};
  const idadeMedia = pu.idade ? Math.round((pu.idade[0] + pu.idade[1]) / 2) : undefined;

  return {
    origem: "publico",
    nome: "Cliente típico",
    papel: pu.quemE || "quem compra de você",
    resumo: pu.quemE || "",
    aparencia: {
      genero: "neutro",
      idade: idadeMedia,
      faixaEtaria: pu.idade ? `between ${pu.idade[0]} and ${pu.idade[1]} years old` : undefined,
    },
    figurinos: [],
    psicologia: {
      quer: (pu.desejos || [])[0] || "",
      trava: (pu.dores || [])[0] || "",
      objecao: ne.objecao || "",
      rotina: (pu.lugares || []).join(", "),
    },
  };
}

/**
 * O que uma ficha de personagem DEVOLVE para a persona do usuário.
 *
 * ## Por que este caminho existe
 *
 * Ricardo pediu que a criação de personagem "enriqueça a persona do usuário", e
 * a leitura fácil seria a inversa — usar a persona para montar o personagem. Só
 * que o valor real está na volta: o construtor de persona pergunta "quem é seu
 * público?" e recebe um parágrafo genérico, porque a pergunta é abstrata.
 * Pedir para a pessoa DESENHAR o cliente — que idade, o que veste, o que ela
 * diz quando não vai comprar — é a mesma pergunta em forma concreta, e a
 * resposta concreta é a que serve para escrever.
 *
 * Devolve só o que está preenchido e só o que é do público. Personagem de
 * `elenco` não mexe na persona, e `criador` mexe apenas na identidade.
 *
 * ⚠️ Devolve um objeto de CAMINHOS (`publico.dores`), não um `PersonaProfunda`
 * inteiro: quem grava é a rota, com `$set` campo a campo, para nunca sobrepor
 * o que a pessoa já respondeu com um branco.
 */
export function contribuicaoParaPersona(p: Personagem): Record<string, unknown> {
  const saida: Record<string, unknown> = {};

  if (p.origem === "publico") {
    const ps = p.psicologia || {};
    if (ps.quer) saida["publico.desejos"] = [ps.quer];
    if (ps.trava) saida["publico.dores"] = [ps.trava];
    if (ps.objecao) saida["negocio.objecao"] = ps.objecao;
    if (p.papel || p.resumo) saida["publico.quemE"] = p.resumo || p.papel;
    if (p.aparencia?.idade) {
      const i = p.aparencia.idade;
      saida["publico.idade"] = [Math.max(16, i - 8), i + 8];
    }
    if (ps.rotina) saida["publico.lugares"] = ps.rotina.split(",").map((s) => s.trim()).filter(Boolean);
  }

  if (p.origem === "criador") {
    if (p.papel) saida["identidade.papel"] = p.papel;
    const g = p.aparencia?.genero;
    if (g === "homem") saida["identidade.tratamento"] = "ele";
    if (g === "mulher") saida["identidade.tratamento"] = "ela";
  }

  return saida;
}

/**
 * O quanto a ficha está pronta, em 0-100, e o que falta.
 *
 * Mesma regra da persona: confiança é MEDIDA, não inventada. E cada lacuna vem
 * com o que ela destrava — pedir dado sem dizer para quê é formulário.
 */
export function prontidao(p: Personagem): { percentual: number; faltando: Array<{ campo: string; pergunta: string; destrava: string }> } {
  const faltando: Array<{ campo: string; pergunta: string; destrava: string }> = [];
  const a = p.aparencia || {};

  const exigidos: Array<[boolean, string, string, string]> = [
    [!!a.genero, "aparencia.genero", "Como você quer ser retratado?", "impede o gerador de escolher por você"],
    [!!(a.idade || a.faixaEtaria), "aparencia.idade", "Que idade aparenta?", "sem isso o rosto muda de idade entre um quadro e outro"],
    [!!a.pele, "aparencia.pele", "Tom de pele?", "é o campo que o gerador mais erra quando fica em branco"],
    [!!a.cabeloEstilo, "aparencia.cabeloEstilo", "Como é o cabelo?", "o que mais identifica alguém de longe"],
    [!!a.cabeloCor, "aparencia.cabeloCor", "Cor do cabelo?", "completa a silhueta"],
    [!!(p.figurinos || []).length, "figurinos", "O que você veste quando aparece?", "sem figurino cada quadro inventa uma roupa"],
    [!!(p.referencias || []).length, "referencias", "Manda uma foto sua?", "a foto ancora o rosto melhor que qualquer descrição"],
  ];

  for (const [ok, campo, pergunta, destrava] of exigidos) {
    if (!ok) faltando.push({ campo, pergunta, destrava });
  }

  const percentual = Math.round(((exigidos.length - faltando.length) / exigidos.length) * 100);
  return { percentual, faltando };
}

/**
 * O caderno de personagem — os ângulos que valem gerar.
 *
 * Quatro cobre o uso real sem fazer a pessoa esperar. A ordem é a de utilidade:
 * frontal serve de referência para tudo, três-quartos é o que mais aparece em
 * quadro de conversa, sorrindo é o que vira foto de perfil, e o de trabalho é o
 * único de meio corpo — é dele que sai o figurino.
 */
export const ANGULOS_DO_CADERNO = [
  {
    id: "frente",
    rotulo: "De frente",
    en: "frontal portrait looking straight into the camera, neutral confident expression, soft studio light, plain out-of-focus background",
  },
  {
    id: "tres-quartos",
    rotulo: "Três quartos",
    en: "three-quarter portrait, head turned slightly, eyes to camera, soft side light, plain out-of-focus background",
  },
  {
    id: "sorrindo",
    rotulo: "Sorrindo",
    en: "frontal portrait with a natural warm smile, warm studio light, plain out-of-focus background",
  },
  {
    id: "trabalhando",
    rotulo: "Trabalhando",
    en: "waist-up portrait in a working environment, professional posture, looking at the camera, natural light, softly blurred background",
  },
] as const;
