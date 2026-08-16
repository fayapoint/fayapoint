/**
 * A persona do usuário — o domínio compartilhado (27/07/2026).
 *
 * ## Por que este arquivo existe
 *
 * O USS de 2024 (`Uss/docs/engine`, `Uss/src/lib/persona/single-source-of-truth.ts`)
 * já trabalhava com uma persona de OITO blocos: identidade, voz, público,
 * estratégia de conteúdo, visual, metas, dados sociais e desempenho. O
 * `socialPersona` que herdamos aqui tinha cinco listas de rótulos e três
 * strings soltas — o suficiente para escolher um adjetivo, longe do suficiente
 * para escrever como a pessoa escreve.
 *
 * A diferença prática está no prompt: `["tech", "formal"]` produz post de
 * agência. `"escreve frases curtas, usa emoji no fim, evita jargão, fala com
 * dono de loja de bairro que tem medo de parecer amador"` produz post dele.
 *
 * ## As três regras que este módulo impõe
 *
 * 1. **Confiança é medida, não inventada.** Cada dimensão devolve o quanto
 *    sabemos dela em 0-100, pesado por campo. Dizer "conheço você 100%" com
 *    cinco cliques seria mentira, e mentira que o usuário detecta na primeira
 *    geração de conteúdo ruim.
 * 2. **Toda lacuna vem com a pergunta que a fecha e o que ela destrava.**
 *    Pedir dado sem dizer para quê é formulário; o painel lateral só ganha o
 *    direito de perguntar porque responde "para quê" antes.
 * 3. **Rótulo nunca vai cru para o modelo.** `industry: ["tech"]` vira
 *    "Tecnologia" em português no bloco de persona — o modelo escreve em
 *    português e recebe o contexto em português.
 */

// ─────────────────────────────────────────────────────────────────────
// Vocabulário — os rótulos que o construtor oferece
// ─────────────────────────────────────────────────────────────────────

export const AREAS: Record<string, string> = {
  tech: 'Tecnologia',
  health: 'Saúde',
  education: 'Educação',
  ecommerce: 'E-commerce',
  finance: 'Finanças',
  marketing: 'Marketing',
  food: 'Alimentação',
  fitness: 'Fitness',
  beauty: 'Beleza',
  travel: 'Viagens',
  'real-estate': 'Imobiliário',
  law: 'Direito',
  art: 'Arte & Design',
  entertainment: 'Entretenimento',
  sustainability: 'Sustentabilidade',
  consulting: 'Consultoria',
  retail: 'Varejo',
  other: 'Outro',
};

export const TONS: Record<string, string> = {
  formal: 'Formal',
  casual: 'Casual',
  fun: 'Divertido',
  inspirational: 'Inspiracional',
  academic: 'Acadêmico',
  energetic: 'Energético',
  emotional: 'Emocional',
  analytical: 'Analítico',
  controversial: 'Controverso',
  mysterious: 'Misterioso',
  dramatic: 'Dramático',
  neutral: 'Neutro',
  visionary: 'Visionário',
  romantic: 'Romântico',
};

export const OBJETIVOS: Record<string, string> = {
  engagement: 'Aumentar engajamento',
  leads: 'Gerar leads',
  authority: 'Construir autoridade',
  sales: 'Aumentar vendas',
  awareness: 'Visibilidade da marca',
  community: 'Criar comunidade',
  education: 'Educar audiência',
  traffic: 'Gerar tráfego',
  retention: 'Fidelizar clientes',
  networking: 'Networking',
  'personal-brand': 'Marca pessoal',
  conversion: 'Converter seguidores',
  'content-scale': 'Escalar conteúdo',
  automate: 'Automatizar processos',
};

export const FORMATOS: Record<string, string> = {
  photos: 'Fotos',
  videos: 'Vídeos',
  stories: 'Stories',
  reels: 'Reels',
  carousels: 'Carrosséis',
  text: 'Texto',
  lives: 'Lives',
  podcasts: 'Podcasts',
  infographics: 'Infográficos',
  memes: 'Memes',
  guides: 'Guias',
  tutorials: 'Tutoriais',
  reviews: 'Reviews',
  'behind-scenes': 'Bastidores',
  testimonials: 'Depoimentos',
  newsletters: 'Newsletters',
  threads: 'Threads',
  shorts: 'Shorts',
};

export const NIVEIS: Record<string, string> = {
  beginner: 'Iniciante — está começando com IA',
  intermediate: 'Intermediário — já usa, quer usar melhor',
  advanced: 'Avançado — usa todo dia, quer profundidade',
};

/** Como o aluno aprende melhor — entra no conteúdo do curso, não no post. */
export const RITMOS: Record<string, string> = {
  'mao-na-massa': 'Mão na massa — quer o passo a passo para executar hoje',
  conceitual: 'Conceitual — quer entender o porquê antes de aplicar',
  'caso-real': 'Caso real — aprende vendo alguém do ramo dele fazendo',
  referencia: 'Referência — quer o material para consultar quando precisar',
};

export const TEMPOS: Record<string, string> = {
  '15min': '15 minutos por dia',
  '1h-semana': '1 hora por semana',
  '3h-semana': '3 horas por semana',
  'fim-de-semana': 'Só no fim de semana',
};

/**
 * ── COMO NOS DIRIGIMOS A ELE (16/08/2026) ────────────────────────────────
 *
 * Ricardo, depois de responder o console inteiro: *"num momento ele me chamou
 * de mulher de aproximadamente 35 anos, isso mostra que não sabemos nada do
 * nosso cliente e expulsamos ele."*
 *
 * Ele tem razão duas vezes. A primeira é o defeito de engenharia, consertado em
 * `blocoDePersona` — o público DELE estava no mesmo bloco que ele, sob o título
 * "ALUNO:", e o modelo pegou a descrição mais vívida que encontrou. A segunda é
 * mais simples e mais funda: **nunca perguntamos**. Sem perguntar, sobra chutar,
 * e chutar gênero erra em quase metade das vezes.
 *
 * Então passa a ser um campo, com uma saída honesta ("não marque") como padrão
 * de quem não respondeu. `neutro` não é indecisão: é a instrução que evita
 * "bem-vinda" e "você mesma" quando não sabemos.
 */
export const TRATAMENTOS: Record<string, string> = {
  masculino: 'No masculino ("bem-vindo", "você mesmo")',
  feminino: 'No feminino ("bem-vinda", "você mesma")',
  neutro: 'Sem marcar gênero — reescreva a frase se for preciso',
};

export const TIPOS_FOTO = ['perfil', 'profissional', 'casual', 'pessoal'] as const;
export type TipoFoto = (typeof TIPOS_FOTO)[number];

export const ROTULO_FOTO: Record<TipoFoto, { titulo: string; para: string }> = {
  perfil: { titulo: 'Avatar', para: 'a foto que já veio da sua conta — é o rosto padrão do portal' },
  profissional: { titulo: 'Profissional', para: 'posts de autoridade, LinkedIn, capa de curso, certificado' },
  casual: { titulo: 'Casual', para: 'Stories e posts do dia a dia, onde formal soa distante' },
  pessoal: { titulo: 'Pessoal', para: 'bastidores e histórias — o conteúdo que mais conecta' },
};

// ─────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────

export interface FotoPersona {
  tipo: TipoFoto;
  url: string;
  /** 'google' | 'upload' | 'studio' — de onde a imagem veio */
  origem: string;
  publicId?: string;
  addedAt?: Date | string;
}

/** O formato profundo. Os campos rasos antigos continuam existindo ao lado. */
export interface PersonaProfunda {
  // rasos herdados (o construtor de 5 passos alimenta estes)
  industry?: string[];
  toneOfVoice?: string[];
  marketingGoals?: string[];
  contentTypes?: string[];
  experienceLevel?: string;
  topHashtags?: string[];
  contentThemes?: string[];
  audienceInsights?: string;
  writingStyle?: string;
  postingFrequency?: string;
  primaryInterests?: string[];
  completionPercent?: number;
  personaVersion?: number;

  // profundos (USS)
  identidade?: {
    marca?: string;
    papel?: string;
    cidade?: string;
    missao?: string;
    valores?: string[];
    site?: string;
    /**
     * Chave de `TRATAMENTOS`. Vazio = `neutro`, e neutro é uma instrução ATIVA
     * ("não marque gênero"), não a ausência de uma. Ver `TRATAMENTOS`.
     */
    tratamento?: string;
  };
  voz?: {
    /** 0 = nenhum emoji, 100 = emoji em toda frase */
    emoji?: number;
    /** 0 = fala como no bar, 100 = fala como em parecer jurídico */
    formalidade?: number;
    bordoes?: string[];
    usaHumor?: boolean;
    usaPergunta?: boolean;
    usaHistoria?: boolean;
    usaCta?: boolean;
    vocabulario?: string;
    /** Trecho que a pessoa escreveu — a amostra vale mais que qualquer adjetivo */
    amostra?: string;
  };
  publico?: {
    idade?: [number, number];
    lugares?: string[];
    quemE?: string;
    dores?: string[];
    desejos?: string[];
  };
  estrategia?: {
    pilares?: string[];
    porSemana?: number;
    melhoresHorarios?: string[];
    assinatura?: string;
    naoFalar?: string[];
  };
  aprendizado?: {
    objetivo?: string;
    ritmo?: string;
    tempo?: string;
    ferramentas?: string[];
    travando?: string;
  };
  /**
   * O NEGÓCIO — a dimensão nova de 03/08/2026, e a que mais muda o exemplo.
   *
   * Ricardo: *"se você pensar e refletir sobre o que temos e o quanto a mais
   * podemos e na verdade devemos ter, vai perceber que está muito raso o quanto
   * coletamos de informação, deixando assim o conteúdo final bem superficial e
   * quase não justifica ele gastar seus créditos."*
   *
   * Ele está certo, e dá para apontar onde: as sete dimensões antigas descrevem
   * QUEM a pessoa é e COMO ela fala. Nenhuma descreve o que ela VENDE. O
   * exemplo do capítulo — a peça mais cara da camada, aquela que precisa de
   * números plausíveis — era escrito sem saber preço, canal, volume ou objeção.
   * Daí "imagine que você atende clientes": correto, genérico e esquecível.
   *
   * Com ticket e objeção na mão, o mesmo exemplo vira "numa venda de R$180, a
   * objeção 'vou pensar' que você ouve toda semana...". É a diferença entre
   * material didático e consultoria.
   */
  negocio?: {
    /** O que ela vende, em uma frase concreta. */
    oQueVende?: string;
    /** Ticket médio em reais — o número que torna todo exemplo plausível. */
    ticket?: number;
    /** Onde a venda acontece: Instagram, WhatsApp, loja física, marketplace… */
    canal?: string;
    /** A objeção que ela mais ouve. Ouro puro para exemplo e para tarefa. */
    objecao?: string;
    /** Quantos clientes por mês, aproximadamente — dá escala ao exemplo. */
    clientesPorMes?: number;
    /** O produto ou serviço do qual ela mais se orgulha. */
    orgulho?: string;
    /** Concorrentes e referências que ela admira (perfis, marcas). */
    referencias?: string[];
  };
  fotos?: FotoPersona[];
  /**
   * O caderno de personagem — as imagens do mesmo rosto em vários ângulos.
   *
   * Gravado aqui, e não numa coleção própria, porque é persona: envelhece com
   * ela, viaja com ela e some com ela. `imagens` guarda as URLs no Cloudinary;
   * `origem` diz de quais fotos ele foi tirado, para dar para refazer quando a
   * pessoa mandar fotos melhores.
   */
  caderno?: {
    imagens?: string[];
    origem?: string[];
    geradoEm?: Date | string;
    /** 'pendente' enquanto a fila não devolveu — o crédito só sai no fim. */
    status?: 'pendente' | 'pronto' | 'falhou';
  };
}

export interface CampoFaltando {
  campo: string;
  pergunta: string;
  /** O que responder isto destrava — sem isso a pergunta é formulário. */
  ganho: string;
}

/**
 * ── OS CAMPOS QUE NÃO PODEM FICAR EM BRANCO (16/08/2026) ─────────────────
 *
 * Ricardo: *"devemos ressaltar áreas críticas, como nome do negócio, ou área de
 * trabalho atual, e outras partes que contenham informações que mudam muito
 * como o texto é enxergado pelo nosso escritor."*
 *
 * O console tratava as 27 perguntas como iguais — mesma cor, mesma vez na fila,
 * mesmo peso na barra. Não são. Um campo em branco aqui não deixa o texto
 * "menos afiado": deixa o texto ERRADO, e errado de um jeito que a pessoa lê
 * como desprezo. `publico.quemE` sem `identidade.papel` do lado foi exatamente
 * o que produziu "mulher de aproximadamente 35 anos".
 *
 * ⚠️ O valor não é um rótulo, é a CONSEQUÊNCIA de deixar em branco — é isso que
 * a tela mostra. "Campo importante" não move ninguém; "sem isto o texto te
 * chama pelo gênero errado" move.
 */
export const CAMPOS_CRITICOS: Record<string, string> = {
  'identidade.tratamento':
    'Sem isto o texto pode te tratar no gênero errado — o erro que mais faz alguém fechar a página.',
  'identidade.marca':
    'É o nome que aparece dentro dos exemplos. Em branco, todo capítulo diz "a sua empresa".',
  'identidade.papel':
    'Define o ramo do livro inteiro. Errado aqui, erram os 16 capítulos de uma vez.',
  'publico.quemE':
    'É o CLIENTE do aluno, não o aluno. É o campo que o escritor mais confunde — e a confusão soa como se não te conhecêssemos.',
  'negocio.oQueVende': 'É o que transforma "imagine um produto seu" no seu produto, com nome.',
  'negocio.ticket': 'É o número de toda conta de retorno. Sem ele o exemplo inventa um.',
  'negocio.objecao': 'É a matéria-prima das tarefas — a que ataca o que te custa dinheiro hoje.',
  'voz.amostra': 'Vale mais que todos os outros juntos: é daqui que sai o seu ritmo de frase.',
  'aprendizado.travando': 'Faz o curso atacar o SEU travamento em vez do travamento médio.',
};

export function ehCritico(campo: string | undefined): boolean {
  return !!campo && campo in CAMPOS_CRITICOS;
}

export interface DimensaoDossie {
  id: string;
  titulo: string;
  /** Uma linha dizendo o que esta dimensão MUDA no que entregamos. */
  paraQue: string;
  icone: string;
  cor: string;
  confianca: number;
  /**
   * O que já sabemos.
   *
   * ⚠️ `campo` não é enfeite: sem ele, um valor preenchido só podia ser LIDO —
   * ele saía de `faltando` e não tinha mais editor nenhum. Ricardo em 10/08:
   * *"eu só vi agora quando cliquei que podia editar"*. Com o campo, toda linha
   * conhecida abre o mesmo editor da lacuna, já preenchida. Fica sem `campo` só
   * o que não é editável por texto (as fotos, e o que vem de fora).
   */
  conhecido: Array<{ rotulo: string; valor: string; campo?: string }>;
  faltando: CampoFaltando[];
}

export interface Dossie {
  confianca: number;
  /** Quantas das dimensões passam de 60 — o que o USS chamava de dataQuality. */
  qualidade: 'esboço' | 'rascunho' | 'retrato' | 'dossiê';
  dimensoes: DimensaoDossie[];
  /** A frase que resume a pessoa em linguagem natural — o topo do painel. */
  resumo: string;
}

// ─────────────────────────────────────────────────────────────────────
// Leitura
// ─────────────────────────────────────────────────────────────────────

const lista = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()) : []);
const texto = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const traduz = (ids: string[], mapa: Record<string, string>) => ids.map((id) => mapa[id] ?? id);

/** Um campo vale ponto se está preenchido. Peso = quanto ele muda a saída. */
function pontos(itens: Array<[boolean, number]>): number {
  const total = itens.reduce((s, [, p]) => s + p, 0);
  const feito = itens.reduce((s, [ok, p]) => s + (ok ? p : 0), 0);
  return total === 0 ? 0 : Math.round((feito / total) * 100);
}

/**
 * O dossiê: o que sabemos, o quanto sabemos e o que falta perguntar.
 *
 * A ordem das dimensões não é decorativa — ela vai da que mais muda o
 * resultado (voz) para a que menos muda (visual). O painel mostra nesta ordem
 * e o usuário fecha as lacunas caras primeiro.
 */
export function montarDossie(p: PersonaProfunda, extras?: { nome?: string; temFoto?: boolean; avatar?: string | null }): Dossie {
  const identidade = p.identidade || {};
  const voz = p.voz || {};
  const publico = p.publico || {};
  const estrategia = p.estrategia || {};
  const aprendizado = p.aprendizado || {};
  const negocio = p.negocio || {};
  const fotos = p.fotos || [];

  const areas = traduz(lista(p.industry), AREAS);
  const tons = traduz(lista(p.toneOfVoice), TONS);
  const metas = traduz(lista(p.marketingGoals), OBJETIVOS);
  const formatos = traduz(lista(p.contentTypes), FORMATOS);

  const dimensoes: DimensaoDossie[] = [
    {
      id: 'identidade',
      titulo: 'Quem você é',
      paraQue: 'É o "eu" dos textos. Sem isto o conteúdo fala de você na terceira pessoa, como um release.',
      icone: 'user',
      cor: '#f5c04e',
      confianca: pontos([
        [!!(extras?.nome || identidade.marca), 3],
        [!!identidade.papel, 3],
        [areas.length > 0, 3],
        // ⚠️ Peso 3, igual ao papel. Tratamento errado não deixa o texto pior —
        // deixa o texto ofensivo, e a barra tem de cobrar isso como cobra o resto.
        [!!identidade.tratamento, 3],
        [!!identidade.missao, 2],
        [(identidade.valores || []).length > 0, 2],
        [!!identidade.cidade, 1],
      ]),
      conhecido: [
        identidade.marca ? { rotulo: 'Marca', valor: identidade.marca, campo: 'identidade.marca' } : null,
        extras?.nome && !identidade.marca ? { rotulo: 'Nome', valor: extras.nome, campo: 'identidade.marca' } : null,
        identidade.papel ? { rotulo: 'O que você faz', valor: identidade.papel, campo: 'identidade.papel' } : null,
        areas.length ? { rotulo: 'Área', valor: areas.join(' · ') } : null,
        identidade.tratamento
          ? { rotulo: 'Como falar com você', valor: TRATAMENTOS[identidade.tratamento] ?? identidade.tratamento, campo: 'identidade.tratamento' }
          : null,
        identidade.cidade ? { rotulo: 'Onde', valor: identidade.cidade, campo: 'identidade.cidade' } : null,
        identidade.missao ? { rotulo: 'Missão', valor: identidade.missao, campo: 'identidade.missao' } : null,
        (identidade.valores || []).length ? { rotulo: 'Valores', valor: (identidade.valores || []).join(' · '), campo: 'identidade.valores' } : null,
      ].filter(Boolean) as DimensaoDossie['conhecido'],
      faltando: [
        // ⚠️ PRIMEIRO da fila de propósito. É a pergunta mais barata do console
        // (um clique) e a única cujo erro faz a pessoa ir embora.
        !identidade.tratamento && {
          campo: 'identidade.tratamento',
          pergunta: 'Como eu devo falar com você?',
          ganho: 'Evita o pior erro possível: te tratar no gênero errado dentro do seu próprio livro',
        },
        !identidade.papel && {
          campo: 'identidade.papel',
          pergunta: 'Numa frase, o que você faz para quem?',
          ganho: 'Vira a primeira linha da bio e o enquadramento de todo post',
        },
        !identidade.missao && {
          campo: 'identidade.missao',
          pergunta: 'Por que você faz isso? O que te move?',
          ganho: 'É o que separa conteúdo com alma de conteúdo de estagiário',
        },
        !(identidade.valores || []).length && {
          campo: 'identidade.valores',
          pergunta: 'Três coisas que você nunca abriria mão no seu trabalho',
          ganho: 'A IA passa a saber o que NÃO escrever no seu nome',
        },
      ].filter(Boolean) as CampoFaltando[],
    },
    {
      id: 'voz',
      titulo: 'Como você fala',
      paraQue: 'A dimensão que mais muda o texto. Adjetivo de tom afina pouco; uma amostra sua afina tudo.',
      icone: 'mic',
      cor: '#a78bfa',
      confianca: pontos([
        [tons.length > 0, 2],
        [typeof voz.formalidade === 'number', 2],
        [typeof voz.emoji === 'number', 2],
        [!!voz.amostra, 5],
        [(voz.bordoes || []).length > 0, 2],
        [!!voz.vocabulario, 2],
        [voz.usaHumor !== undefined, 1],
      ]),
      conhecido: [
        tons.length ? { rotulo: 'Tom', valor: tons.join(' · ') } : null,
        typeof voz.formalidade === 'number'
          ? { rotulo: 'Formalidade', valor: voz.formalidade < 35 ? 'Fala como com um amigo' : voz.formalidade > 70 ? 'Fala como num documento' : 'Meio-termo profissional', campo: 'voz.formalidade' }
          : null,
        typeof voz.emoji === 'number'
          ? { rotulo: 'Emoji', valor: voz.emoji < 20 ? 'Quase nunca' : voz.emoji > 65 ? 'Em quase toda frase' : 'De vez em quando', campo: 'voz.emoji' }
          : null,
        (voz.bordoes || []).length ? { rotulo: 'Bordões', valor: (voz.bordoes || []).join(' · '), campo: 'voz.bordoes' } : null,
        voz.vocabulario ? { rotulo: 'Vocabulário', valor: voz.vocabulario } : null,
        voz.amostra ? { rotulo: 'Amostra da sua escrita', valor: `“${voz.amostra.slice(0, 120)}${voz.amostra.length > 120 ? '…' : ''}”`, campo: 'voz.amostra' } : null,
        voz.usaHumor !== undefined
          ? {
              rotulo: 'Recursos',
              valor: [voz.usaHumor && 'humor', voz.usaPergunta && 'perguntas', voz.usaHistoria && 'histórias', voz.usaCta && 'chamada para ação']
                .filter(Boolean)
                .join(' · ') || 'nenhum marcado',
            }
          : null,
      ].filter(Boolean) as DimensaoDossie['conhecido'],
      faltando: [
        !voz.amostra && {
          campo: 'voz.amostra',
          pergunta: 'Cole algo que VOCÊ escreveu — um post, um áudio transcrito, um e-mail',
          ganho: 'Vale mais que todos os outros campos juntos: é daqui que sai o seu ritmo de frase',
        },
        !(voz.bordoes || []).length && {
          campo: 'voz.bordoes',
          pergunta: 'Tem alguma expressão que é a sua cara? Como você abre e como fecha?',
          ganho: 'Sua assinatura aparece em todo conteúdo sem você precisar reescrever',
        },
        typeof voz.formalidade !== 'number' && {
          campo: 'voz.formalidade',
          pergunta: 'Você fala com seu público como com um cliente ou como com um amigo?',
          ganho: 'Calibra "você/tu", gírias e o tamanho das frases',
        },
      ].filter(Boolean) as CampoFaltando[],
    },
    {
      id: 'publico',
      titulo: 'Com quem você fala',
      paraQue: 'Um post só é bom para alguém. Sem público definido a IA escreve para "todo mundo", que é ninguém.',
      icone: 'users',
      cor: '#38bdf8',
      confianca: pontos([
        [!!publico.quemE, 4],
        [(publico.dores || []).length > 0, 4],
        [(publico.desejos || []).length > 0, 3],
        [Array.isArray(publico.idade), 2],
        [(publico.lugares || []).length > 0, 1],
        [!!p.audienceInsights, 2],
      ]),
      conhecido: [
        publico.quemE ? { rotulo: 'Quem é', valor: publico.quemE, campo: 'publico.quemE' } : null,
        Array.isArray(publico.idade) ? { rotulo: 'Idade', valor: `${publico.idade[0]} a ${publico.idade[1]} anos` } : null,
        (publico.lugares || []).length ? { rotulo: 'Onde estão', valor: (publico.lugares || []).join(' · '), campo: 'publico.lugares' } : null,
        (publico.dores || []).length ? { rotulo: 'O que dói neles', valor: (publico.dores || []).join(' · '), campo: 'publico.dores' } : null,
        (publico.desejos || []).length ? { rotulo: 'O que eles querem', valor: (publico.desejos || []).join(' · '), campo: 'publico.desejos' } : null,
        p.audienceInsights ? { rotulo: 'Sinais coletados', valor: p.audienceInsights.slice(0, 160) } : null,
      ].filter(Boolean) as DimensaoDossie['conhecido'],
      faltando: [
        !publico.quemE && {
          campo: 'publico.quemE',
          pergunta: 'Descreva UMA pessoa real do seu público. Nome, o que faz, o problema dela',
          ganho: 'A IA para de escrever para uma multidão e passa a escrever para ela',
        },
        !(publico.dores || []).length && {
          campo: 'publico.dores',
          pergunta: 'Que frustração eles têm que você resolve?',
          ganho: 'É a matéria-prima de todo gancho que faz parar o dedo',
        },
        !(publico.desejos || []).length && {
          campo: 'publico.desejos',
          pergunta: 'Como a vida deles fica depois que você ajuda?',
          ganho: 'Vira a promessa dos títulos e o final das histórias',
        },
      ].filter(Boolean) as CampoFaltando[],
    },
    {
      id: 'conteudo',
      titulo: 'O que você publica',
      paraQue: 'Define o formato, o comprimento e o calendário — e o que a IA não deve sugerir.',
      icone: 'layers',
      cor: '#34d399',
      confianca: pontos([
        [formatos.length > 0, 3],
        [(estrategia.pilares || []).length > 0, 4],
        [!!estrategia.porSemana, 2],
        [(estrategia.melhoresHorarios || []).length > 0, 2],
        [(p.topHashtags || []).length > 0, 1],
        [(estrategia.naoFalar || []).length > 0, 2],
      ]),
      conhecido: [
        formatos.length ? { rotulo: 'Formatos', valor: formatos.join(' · ') } : null,
        (estrategia.pilares || []).length ? { rotulo: 'Pilares', valor: (estrategia.pilares || []).join(' · '), campo: 'estrategia.pilares' } : null,
        estrategia.porSemana ? { rotulo: 'Frequência', valor: `${estrategia.porSemana}x por semana`, campo: 'estrategia.porSemana' } : null,
        (estrategia.melhoresHorarios || []).length ? { rotulo: 'Horários', valor: (estrategia.melhoresHorarios || []).join(' · ') } : null,
        (p.topHashtags || []).length ? { rotulo: 'Hashtags', valor: (p.topHashtags || []).slice(0, 6).map((h) => `#${h.replace(/^#/, '')}`).join(' ') } : null,
        (estrategia.naoFalar || []).length ? { rotulo: 'Nunca falar de', valor: (estrategia.naoFalar || []).join(' · '), campo: 'estrategia.naoFalar' } : null,
      ].filter(Boolean) as DimensaoDossie['conhecido'],
      faltando: [
        !(estrategia.pilares || []).length && {
          campo: 'estrategia.pilares',
          pergunta: 'Três assuntos que você poderia defender por uma hora',
          ganho: 'Vira o calendário: a IA passa a sugerir pauta em vez de esperar tema',
        },
        !(estrategia.naoFalar || []).length && {
          campo: 'estrategia.naoFalar',
          pergunta: 'Tem assunto que você não toca? Política, concorrente, preço?',
          ganho: 'A trava que evita o post que você teria de apagar depois',
        },
        !estrategia.porSemana && {
          campo: 'estrategia.porSemana',
          pergunta: 'Quantos posts por semana são realistas para você?',
          ganho: 'Dimensiona o calendário e o lote que a gente gera de uma vez',
        },
      ].filter(Boolean) as CampoFaltando[],
    },
    {
      id: 'objetivo',
      titulo: 'Onde você quer chegar',
      paraQue: 'Muda a chamada para ação de cada peça — vender, ensinar e conversar pedem finais diferentes.',
      icone: 'target',
      cor: '#fb7185',
      confianca: pontos([
        [metas.length > 0, 4],
        [!!estrategia.assinatura, 2],
        [!!aprendizado.objetivo, 3],
      ]),
      conhecido: [
        metas.length ? { rotulo: 'Objetivos', valor: metas.join(' · ') } : null,
        estrategia.assinatura ? { rotulo: 'Chamada padrão', valor: estrategia.assinatura, campo: 'estrategia.assinatura' } : null,
        aprendizado.objetivo ? { rotulo: 'Meta pessoal', valor: aprendizado.objetivo, campo: 'aprendizado.objetivo' } : null,
      ].filter(Boolean) as DimensaoDossie['conhecido'],
      faltando: [
        !aprendizado.objetivo && {
          campo: 'aprendizado.objetivo',
          pergunta: 'O que precisa acontecer nos próximos 90 dias para você dizer que valeu?',
          ganho: 'Ordena o curso e as sugestões pelo que te leva lá primeiro',
        },
        !estrategia.assinatura && {
          campo: 'estrategia.assinatura',
          pergunta: 'Como você quer que cada post termine? "Me chama no direct"? "Link na bio"?',
          ganho: 'Toda peça sai com a sua chamada, sem você reescrever o final',
        },
      ].filter(Boolean) as CampoFaltando[],
    },
    {
      id: 'negocio',
      titulo: 'O que você vende',
      paraQue:
        'A dimensão que dá NÚMERO ao exemplo. Sem ticket e sem objeção, o exemplo do capítulo vira "imagine que você atende clientes" — correto e esquecível.',
      icone: 'store',
      cor: '#34d399',
      confianca: pontos([
        [!!negocio.oQueVende, 3],
        [typeof negocio.ticket === 'number' && negocio.ticket > 0, 3],
        [!!negocio.objecao, 3],
        [!!negocio.canal, 2],
        [typeof negocio.clientesPorMes === 'number' && negocio.clientesPorMes > 0, 2],
        [!!negocio.orgulho, 1],
        [(negocio.referencias || []).length > 0, 1],
      ]),
      conhecido: [
        negocio.oQueVende ? { rotulo: 'Vende', valor: negocio.oQueVende, campo: 'negocio.oQueVende' } : null,
        negocio.ticket ? { rotulo: 'Ticket médio', valor: `R$ ${negocio.ticket}`, campo: 'negocio.ticket' } : null,
        negocio.canal ? { rotulo: 'Canal de venda', valor: negocio.canal, campo: 'negocio.canal' } : null,
        negocio.clientesPorMes ? { rotulo: 'Clientes/mês', valor: String(negocio.clientesPorMes), campo: 'negocio.clientesPorMes' } : null,
        negocio.objecao ? { rotulo: 'Objeção mais comum', valor: negocio.objecao, campo: 'negocio.objecao' } : null,
        negocio.orgulho ? { rotulo: 'Orgulho', valor: negocio.orgulho, campo: 'negocio.orgulho' } : null,
        (negocio.referencias || []).length
          ? { rotulo: 'Referências', valor: (negocio.referencias || []).join(' · '), campo: 'negocio.referencias' }
          : null,
      ].filter(Boolean) as DimensaoDossie['conhecido'],
      faltando: [
        !negocio.oQueVende && {
          campo: 'negocio.oQueVende',
          pergunta: 'O que você vende, em uma frase? ("banho e tosa para cães de porte pequeno")',
          ganho: 'Os exemplos passam a falar do seu produto, não de "o seu negócio"',
        },
        !negocio.ticket && {
          campo: 'negocio.ticket',
          pergunta: 'Quanto custa, em média, uma venda sua?',
          ganho: 'Todo cálculo de retorno no curso passa a usar o SEU número',
        },
        !negocio.objecao && {
          campo: 'negocio.objecao',
          pergunta: 'Qual a desculpa que você mais ouve de quem não compra?',
          ganho: 'As tarefas passam a atacar a objeção que te custa dinheiro hoje',
        },
        !negocio.canal && {
          campo: 'negocio.canal',
          pergunta: 'Onde a venda acontece? WhatsApp, Instagram, loja, marketplace?',
          ganho: 'Os exemplos usam a ferramenta que você já tem aberta',
        },
        !(negocio.referencias || []).length && {
          campo: 'negocio.referencias',
          pergunta: 'Cite 2 ou 3 perfis ou marcas que você admira no seu ramo',
          ganho: 'Serve de régua de qualidade e de fonte de ideias no seu nível',
        },
      ].filter(Boolean) as CampoFaltando[],
    },
    {
      id: 'aprendizado',
      titulo: 'Como você aprende',
      paraQue: 'É o que personaliza o CURSO, não o post: exemplos do seu ramo, ritmo e profundidade.',
      icone: 'book',
      cor: '#facc15',
      confianca: pontos([
        [!!p.experienceLevel, 3],
        [!!aprendizado.ritmo, 3],
        [!!aprendizado.tempo, 2],
        [(aprendizado.ferramentas || []).length > 0, 2],
        [!!aprendizado.travando, 3],
      ]),
      conhecido: [
        p.experienceLevel ? { rotulo: 'Nível', valor: NIVEIS[p.experienceLevel] ?? p.experienceLevel } : null,
        aprendizado.ritmo ? { rotulo: 'Como prefere', valor: RITMOS[aprendizado.ritmo] ?? aprendizado.ritmo, campo: 'aprendizado.ritmo' } : null,
        aprendizado.tempo ? { rotulo: 'Tempo', valor: TEMPOS[aprendizado.tempo] ?? aprendizado.tempo, campo: 'aprendizado.tempo' } : null,
        (aprendizado.ferramentas || []).length ? { rotulo: 'Já usa', valor: (aprendizado.ferramentas || []).join(' · '), campo: 'aprendizado.ferramentas' } : null,
        aprendizado.travando ? { rotulo: 'O que trava', valor: aprendizado.travando, campo: 'aprendizado.travando' } : null,
      ].filter(Boolean) as DimensaoDossie['conhecido'],
      faltando: [
        !aprendizado.travando && {
          campo: 'aprendizado.travando',
          pergunta: 'O que você já tentou fazer com IA e não deu certo?',
          ganho: 'O curso passa a atacar o seu travamento em vez do travamento médio',
        },
        !aprendizado.ritmo && {
          campo: 'aprendizado.ritmo',
          pergunta: 'Você prefere o passo a passo ou entender o porquê primeiro?',
          ganho: 'Reescreve os exemplos do curso no formato que te faz avançar',
        },
        !(aprendizado.ferramentas || []).length && {
          campo: 'aprendizado.ferramentas',
          pergunta: 'Que ferramentas você já usa hoje? (ChatGPT, Canva, Excel…)',
          ganho: 'Os exemplos passam a usar o que você já tem aberto',
        },
      ].filter(Boolean) as CampoFaltando[],
    },
    {
      id: 'rosto',
      titulo: 'Seu rosto e sua marca',
      paraQue: 'Sem imagem sua, todo post nasce com banco de imagens — e banco de imagens não constrói marca pessoal.',
      icone: 'camera',
      cor: '#f472b6',
      confianca: pontos([
        [fotos.some((f) => f.tipo === 'perfil') || !!extras?.temFoto, 2],
        [fotos.some((f) => f.tipo === 'profissional'), 3],
        [fotos.some((f) => f.tipo === 'casual'), 2],
        [fotos.some((f) => f.tipo === 'pessoal'), 2],
      ]),
      conhecido: TIPOS_FOTO.map((t) => {
        const f = fotos.find((x) => x.tipo === t);
        // A vaga `perfil` costuma não estar em `fotos`: ela é materializada a
        // partir do avatar da conta (ver `/api/user/persona-fotos`). Dizer
        // "veio da sua conta Google" quando é o caso é o ponto — o usuário
        // reclamou justamente de a gente pedir o que já tínhamos.
        if (!f && !(t === 'perfil' && extras?.temFoto)) return null;
        const doGoogle = f ? f.origem === 'google' : (extras?.avatar || '').includes('googleusercontent');
        return {
          rotulo: ROTULO_FOTO[t].titulo,
          valor: doGoogle ? 'veio da sua conta Google' : f ? 'enviada por você' : 'veio da sua conta',
          // Trocar a foto que já existe é o pedido mais óbvio do mundo e não
          // existia: preenchida, a vaga sumia de `faltando` e virava rótulo.
          campo: `fotos.${t}`,
        };
      }).filter(Boolean) as DimensaoDossie['conhecido'],
      faltando: TIPOS_FOTO.filter((t) => t !== 'perfil' && !fotos.some((f) => f.tipo === t)).map((t) => ({
        campo: `fotos.${t}`,
        pergunta: `Envie uma foto ${ROTULO_FOTO[t].titulo.toLowerCase()}`,
        ganho: `Usada em ${ROTULO_FOTO[t].para}`,
      })),
    },
  ];

  // ⚠️ A média é sobre `dimensoes.length`, não sobre um 7 escrito à mão — a
  // dimensão "O que você vende" entrou em 03/08 e virou oito. Um denominador
  // fixo teria feito a confiança de todo mundo passar de 100 sem aviso.
  const confianca = Math.round(dimensoes.reduce((s, d) => s + d.confianca, 0) / dimensoes.length);
  const fortes = dimensoes.filter((d) => d.confianca >= 60).length;
  const qualidade: Dossie['qualidade'] =
    fortes >= 7 ? 'dossiê' : fortes >= 5 ? 'retrato' : fortes >= 2 ? 'rascunho' : 'esboço';

  return { confianca, qualidade, dimensoes, resumo: resumir(p, extras?.nome) };
}

/**
 * Uma frase em português com o que sabemos. É o topo do painel — e a prova
 * mais honesta de quanto (ou quão pouco) conhecemos a pessoa: quando sai
 * genérica, o usuário vê sozinho que precisa completar.
 *
 * ## ⚠️ Por que ela foi partida em DUAS frases (16/08/2026)
 *
 * A versão antiga emendava tudo numa oração só e produzia, no painel "VOCÊ,
 * MONTADO", esta linha:
 *
 * > *Ricardo — Trabalho com tecnologia e quero usar IA no meu trabalho — fala
 * > com dona de pequeno negócio, 30 a 45 anos, faz tudo sozinha e não tem tempo
 * > de aprender ferramenta nova num tom descontraído…*
 *
 * Lida em voz alta, essa frase descreve o Ricardo como uma dona de pequeno
 * negócio de 30 a 45 anos. O painel se chama "o que já sabemos **sobre você**",
 * e o que ele mostrava era o público. Era o mesmo defeito de `blocoDePersona`,
 * só que na tela em vez de no prompt — e a tela é onde a pessoa descobre se
 * confia na gente.
 *
 * Agora são duas frases com sujeitos diferentes, e a segunda começa por "Escreve
 * para:" — impossível ler como se fosse ele.
 */
export function resumir(p: PersonaProfunda, nome?: string): string {
  const area = traduz(lista(p.industry), AREAS)[0];
  const tom = traduz(lista(p.toneOfVoice), TONS)[0];
  const meta = traduz(lista(p.marketingGoals), OBJETIVOS)[0];
  const nivel = p.experienceLevel ? (NIVEIS[p.experienceLevel] || '').split('—')[0].trim().toLowerCase() : '';
  const papel = p.identidade?.papel;
  const quem = p.publico?.quemE;

  // Frase 1 — o SUJEITO é ele.
  const dele: string[] = [];
  dele.push(nome ? nome.split(' ')[0] : 'Você');
  if (papel) dele.push(`— ${papel}`);
  else if (area) dele.push(`— trabalha com ${area.toLowerCase()}`);
  if (tom) dele.push(`— escreve num tom ${tom.toLowerCase()}`);
  if (meta) dele.push(`para ${meta.toLowerCase()}`);
  if (nivel) dele.push(`e está ${nivel} com IA`);

  const frases: string[] = [];
  if (dele.length > 1) frases.push(dele.join(' ').replace(/\s+/g, ' ').trim() + '.');

  // Frase 2 — o SUJEITO é o público. Sujeito próprio, ponto próprio.
  if (quem) frases.push(`Escreve para: ${quem.trim().replace(/\.$/, '')}.`);

  if (!frases.length || (frases.length === 1 && !papel && !area && !tom && !meta && !nivel)) {
    return 'Ainda não sei quase nada sobre você — e é por isso que o conteúdo sai com cara de genérico.';
  }
  return frases.join(' ');
}

/**
 * A persona está literalmente vazia?
 *
 * ⚠️ Existe porque `blocoDePersona` deixou de poder ser medido pelo tamanho.
 * Ele agora emite SEMPRE duas linhas de segurança ("não sabemos o gênero", "não
 * sabemos a idade") — que é justamente o ponto — e o `perfil.length < 12` que
 * a prévia usava para detectar "nada preenchido" passaria a nunca disparar,
 * gastando uma chamada de modelo para provar coisa nenhuma.
 */
export function personaVazia(p: PersonaProfunda): boolean {
  const grupos = gruposDePrompt(p, 'curso');
  const aluno = grupos.find((g) => g.id === 'aluno');
  // Só o grupo do aluno, e nele só as duas linhas de segurança = ninguém
  // respondeu nada. (Escolher o tratamento não cria linha nova: ele muda o
  // valor da linha que já existia.)
  return grupos.length === 1 && (aluno?.linhas.length ?? 0) <= 2;
}

// ─────────────────────────────────────────────────────────────────────
// Saída para os modelos
// ─────────────────────────────────────────────────────────────────────

/**
 * ── UMA LINHA DO QUE VAI PARA O MODELO ───────────────────────────────────
 *
 * `campo` existe para a tela de revisão poder abrir o editor certo. Uma linha
 * que a pessoa lê e não pode consertar é pior do que não mostrar: ela vê o erro
 * e fica sem saída.
 */
export interface LinhaDePrompt {
  rotulo: string;
  valor: string;
  campo?: string;
  critico?: boolean;
  /**
   * A linha existe, mas o que ela diz é "não sabemos".
   *
   * ⚠️ Sem esta marca a tela de revisão contaria as duas linhas de segurança
   * como dado preenchido — e o alerta de "informação crítica em branco" ficaria
   * mudo justamente para o campo que originou o problema todo (o tratamento).
   */
  emBranco?: boolean;
}

export interface GrupoDePrompt {
  id: 'aluno' | 'voz' | 'publico' | 'estrategia' | 'negocio' | 'aprendizado' | 'proibido';
  /** O cabeçalho EXATO que o modelo lê. A tela mostra o mesmo. */
  titulo: string;
  /** A frase de desambiguação que vai junto do cabeçalho, quando é preciso. */
  aviso?: string;
  linhas: LinhaDePrompt[];
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * O QUE O ESCRITOR RECEBE, EM GRUPOS COM DONO (16/08/2026)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ## O defeito que esta função existe para matar
 *
 * Ricardo, 16/08/2026: *"eu escolhi tudo, respondi tudo que me foi pedido, e num
 * momento ele me chamou de mulher de aproximadamente 35 anos, isso mostra que
 * não sabemos nada do nosso cliente e expulsamos ele."*
 *
 * Não era falta de dado. Era o dado certo com o dono errado. O bloco antigo era
 * uma lista chapada de `Rótulo: valor` que o `atelie-servidor` mandava assim:
 *
 *     ALUNO:
 *     O que faz: Trabalho com tecnologia e quero usar IA no meu trabalho
 *     Área: Tecnologia
 *     Público: dona de pequeno negócio, 30 a 45 anos, faz tudo sozinha…
 *     Idade do público: 30-45
 *
 * Sob o título **ALUNO** havia uma mulher de 30 a 45 anos descrita com muito
 * mais cor e muito mais detalhe do que o próprio aluno. O sistema mandava
 * "escreva na segunda pessoa, cite a rotina dele de forma concreta" — e a única
 * rotina concreta ali era a dela. O modelo fez exatamente o que foi pedido.
 *
 * ## As três regras que os grupos impõem
 *
 * 1. **Todo dado tem dono declarado.** `publico.*` mora sob um cabeçalho que
 *    diz, em maiúsculas, que aquilo é o CLIENTE do aluno.
 * 2. **O que não sabemos é dito, não omitido.** Campo ausente vira uma linha
 *    "não sabemos — não invente", porque silêncio o modelo preenche sozinho:
 *    foi assim que "aproximadamente 35 anos" apareceu do nada.
 * 3. **A tela lê a MESMA estrutura.** `gruposDePrompt` alimenta o prompt e a
 *    aba "o que vai ser usado" da mesa de ajustes. Se um dia divergirem, a
 *    pessoa revisa um texto e o modelo recebe outro — que é o defeito de
 *    confiança mais caro que este produto pode ter.
 */
export function gruposDePrompt(
  p: PersonaProfunda,
  foco: 'post' | 'curso' | 'imagem' = 'post',
  extras?: { nome?: string },
): GrupoDePrompt[] {
  const id = p.identidade || {};
  const voz = p.voz || {};
  const pub = p.publico || {};
  const est = p.estrategia || {};
  const apr = p.aprendizado || {};
  const neg = p.negocio || {};
  const grupos: GrupoDePrompt[] = [];

  const linha = (rotulo: string, valor: string | null | undefined, campo?: string): LinhaDePrompt | null =>
    valor ? { rotulo, valor, campo, critico: ehCritico(campo) } : null;
  const limpar = (xs: Array<LinhaDePrompt | null>) => xs.filter(Boolean) as LinhaDePrompt[];

  // ── 1. O ALUNO ─────────────────────────────────────────────────────────
  const areas = traduz(lista(p.industry), AREAS);
  const tratamento = id.tratamento || 'neutro';
  const alunoLinhas = limpar([
    linha('Nome', extras?.nome),
    linha('Marca', id.marca, 'identidade.marca'),
    linha('O que faz', id.papel, 'identidade.papel'),
    areas.length ? { rotulo: 'Área', valor: areas.join(', ') } : null,
    linha('Onde vive', id.cidade, 'identidade.cidade'),
    linha('Por que faz', id.missao, 'identidade.missao'),
    (id.valores || []).length
      ? { rotulo: 'Valores inegociáveis', valor: (id.valores || []).join(', '), campo: 'identidade.valores' }
      : null,
    {
      // ⚠️ Esta linha sai SEMPRE, inclusive (principalmente) quando não sabemos.
      // Era o buraco por onde entrava o chute de gênero.
      rotulo: 'Como tratá-lo',
      valor:
        tratamento === 'masculino'
          ? 'no masculino'
          : tratamento === 'feminino'
            ? 'no feminino'
            : 'ELE NÃO INFORMOU O GÊNERO. Escreva sem nenhuma marca de gênero — nada de "bem-vinda/bem-vindo", "você mesma/mesmo", nem adjetivo flexionado referindo-se a ele. Reescreva a frase se for preciso.',
      campo: 'identidade.tratamento',
      critico: true,
      emBranco: !id.tratamento,
    },
    {
      // A idade do aluno NÃO é coletada em lugar nenhum. Dizer isso é o que
      // impede o modelo de tomar a idade do público emprestada.
      rotulo: 'Idade dele',
      valor: 'NÃO SABEMOS e não perguntamos. Jamais cite, sugira ou suponha a idade do aluno.',
      critico: true,
      emBranco: true,
    },
  ]);
  grupos.push({
    id: 'aluno',
    titulo: 'QUEM É O ALUNO — é com ESTA pessoa que você fala, na segunda pessoa',
    aviso:
      'Tudo neste bloco descreve o aluno. Nenhum outro bloco descreve o aluno. Se um traço não estiver aqui, ele não é do aluno.',
    linhas: alunoLinhas,
  });

  // ── 2. A VOZ ───────────────────────────────────────────────────────────
  if (foco !== 'curso') {
    const tons = traduz(lista(p.toneOfVoice), TONS);
    const recursos = [
      voz.usaHumor && 'humor',
      voz.usaPergunta && 'perguntas diretas',
      voz.usaHistoria && 'histórias pessoais',
      voz.usaCta && 'chamada para ação no fim',
    ].filter(Boolean) as string[];
    const vozLinhas = limpar([
      tons.length ? { rotulo: 'Tom de voz', valor: tons.join(', ') } : null,
      typeof voz.formalidade === 'number'
        ? {
            rotulo: 'Formalidade',
            valor:
              voz.formalidade < 35
                ? 'baixa — escreva como quem conversa, pode usar contração e gíria leve'
                : voz.formalidade > 70
                  ? 'alta — evite gíria, frases completas, terceira pessoa quando couber'
                  : 'média — profissional mas próximo',
            campo: 'voz.formalidade',
          }
        : null,
      typeof voz.emoji === 'number'
        ? {
            rotulo: 'Emoji',
            valor:
              voz.emoji < 20
                ? 'quase nenhum'
                : voz.emoji > 65
                  ? 'muitos, inclusive no meio da frase'
                  : 'poucos, no fim de parágrafo',
            campo: 'voz.emoji',
          }
        : null,
      (voz.bordoes || []).length
        ? { rotulo: 'Expressões que são a cara dele', valor: (voz.bordoes || []).join(' / '), campo: 'voz.bordoes' }
        : null,
      linha('Vocabulário', voz.vocabulario),
      recursos.length ? { rotulo: 'Usa', valor: recursos.join(', ') } : null,
      voz.amostra
        ? {
            rotulo: 'AMOSTRA REAL DA ESCRITA DELE (imite o ritmo de frase, não o assunto)',
            valor: `\n"""\n${voz.amostra.slice(0, 900)}\n"""`,
            campo: 'voz.amostra',
            critico: true,
          }
        : null,
    ]);
    if (vozLinhas.length) {
      grupos.push({ id: 'voz', titulo: 'COMO O ALUNO ESCREVE', linhas: vozLinhas });
    }
  }

  // ── 3. O PÚBLICO — o bloco que causou o estrago ────────────────────────
  const publicoLinhas = limpar([
    linha('Quem é', pub.quemE, 'publico.quemE'),
    Array.isArray(pub.idade) ? { rotulo: 'Idade DELES', valor: `${pub.idade[0]}-${pub.idade[1]} anos` } : null,
    (pub.lugares || []).length
      ? { rotulo: 'Onde estão', valor: (pub.lugares || []).join(', '), campo: 'publico.lugares' }
      : null,
    (pub.dores || []).length
      ? { rotulo: 'Dores DELES', valor: (pub.dores || []).join('; '), campo: 'publico.dores' }
      : null,
    (pub.desejos || []).length
      ? { rotulo: 'Desejos DELES', valor: (pub.desejos || []).join('; '), campo: 'publico.desejos' }
      : null,
    linha('Sinais coletados sobre eles', p.audienceInsights?.slice(0, 400)),
  ]);
  if (publicoLinhas.length) {
    grupos.push({
      id: 'publico',
      titulo: 'QUEM É O PÚBLICO DO ALUNO — são os CLIENTES dele, NÃO ele',
      aviso:
        'PROIBIDO atribuir ao aluno qualquer traço deste bloco. A idade, o gênero, a profissão e as dores aqui são de terceiros. Escrever "você, dona de pequeno negócio de 35 anos" quando isto está descrito aqui é o erro mais grave possível nesta tarefa.',
      linhas: publicoLinhas,
    });
  }

  // ── 4. ESTRATÉGIA ──────────────────────────────────────────────────────
  const metas = traduz(lista(p.marketingGoals), OBJETIVOS);
  const estLinhas = limpar([
    metas.length ? { rotulo: 'Objetivos', valor: metas.join(', ') } : null,
    (est.pilares || []).length
      ? { rotulo: 'Pilares de conteúdo', valor: (est.pilares || []).join(', '), campo: 'estrategia.pilares' }
      : null,
    linha('Chamada para ação preferida', est.assinatura, 'estrategia.assinatura'),
    ...(foco === 'post'
      ? [
          traduz(lista(p.contentTypes), FORMATOS).length
            ? { rotulo: 'Formatos que ele produz', valor: traduz(lista(p.contentTypes), FORMATOS).join(', ') }
            : null,
          (p.topHashtags || []).length
            ? {
                rotulo: 'Hashtags dele',
                valor: (p.topHashtags || []).slice(0, 10).map((h) => `#${h.replace(/^#/, '')}`).join(' '),
              }
            : null,
        ]
      : []),
  ]);
  if (estLinhas.length) {
    grupos.push({ id: 'estrategia', titulo: 'O QUE O ALUNO PUBLICA E ONDE QUER CHEGAR', linhas: estLinhas });
  }

  /**
   * ── 5. O NEGÓCIO ──────────────────────────────────────────────────────
   *
   * Entra em TODOS os focos — inclusive imagem. É o bloco que dá número ao
   * exemplo do curso, contexto ao post e cenário à imagem. Ticket e objeção
   * primeiro: são os dois que o modelo mais usa.
   */
  const negLinhas = limpar([
    linha('O que vende', neg.oQueVende, 'negocio.oQueVende'),
    neg.ticket
      ? {
          rotulo: 'Ticket médio',
          valor: `R$ ${neg.ticket} — use ESTE número nas contas de retorno`,
          campo: 'negocio.ticket',
          critico: true,
        }
      : null,
    neg.objecao
      ? { rotulo: 'Objeção que mais ouve', valor: `"${neg.objecao}"`, campo: 'negocio.objecao', critico: true }
      : null,
    linha('Onde vende', neg.canal, 'negocio.canal'),
    neg.clientesPorMes
      ? { rotulo: 'Clientes por mês', valor: `cerca de ${neg.clientesPorMes}`, campo: 'negocio.clientesPorMes' }
      : null,
    linha('Do que mais se orgulha', neg.orgulho, 'negocio.orgulho'),
    (neg.referencias || []).length
      ? { rotulo: 'Referências que admira', valor: (neg.referencias || []).join(', '), campo: 'negocio.referencias' }
      : null,
  ]);
  if (negLinhas.length) {
    grupos.push({ id: 'negocio', titulo: 'O NEGÓCIO DO ALUNO', linhas: negLinhas });
  }

  // ── 6. COMO ELE APRENDE ────────────────────────────────────────────────
  if (foco === 'curso') {
    const aprLinhas = limpar([
      p.experienceLevel
        ? { rotulo: 'Nível com IA', valor: NIVEIS[p.experienceLevel] ?? p.experienceLevel }
        : null,
      apr.ritmo ? { rotulo: 'Como aprende melhor', valor: RITMOS[apr.ritmo] ?? apr.ritmo, campo: 'aprendizado.ritmo' } : null,
      apr.tempo ? { rotulo: 'Tempo disponível', valor: TEMPOS[apr.tempo] ?? apr.tempo, campo: 'aprendizado.tempo' } : null,
      (apr.ferramentas || []).length
        ? { rotulo: 'Ferramentas que já usa', valor: (apr.ferramentas || []).join(', '), campo: 'aprendizado.ferramentas' }
        : null,
      linha('O que já tentou e não deu certo', apr.travando, 'aprendizado.travando'),
      linha('Meta dos próximos 90 dias', apr.objetivo, 'aprendizado.objetivo'),
    ]);
    if (aprLinhas.length) {
      grupos.push({ id: 'aprendizado', titulo: 'COMO O ALUNO APRENDE', linhas: aprLinhas });
    }
  }

  // ── 7. A TRAVA ─────────────────────────────────────────────────────────
  if ((est.naoFalar || []).length) {
    grupos.push({
      id: 'proibido',
      titulo: 'PROIBIDO MENCIONAR',
      linhas: [{ rotulo: 'Assuntos vetados por ele', valor: (est.naoFalar || []).join(', '), campo: 'estrategia.naoFalar' }],
    });
  }

  return grupos;
}

/**
 * O bloco de persona que entra em TODA geração — post, imagem ou exemplo de
 * curso. Em português e por extenso, não em códigos: o modelo escreve em
 * português e `["tech"]` não diz nada que "Tecnologia" não diga melhor.
 *
 * `foco` muda o recorte: para post interessa voz e público; para curso
 * interessa nível, ritmo e o que está travando.
 *
 * ⚠️ Isto é só a RENDERIZAÇÃO de `gruposDePrompt`. Toda decisão de conteúdo
 * mora lá — inclusive a separação entre o aluno e o público dele, que é o que
 * impede o modelo de trocar um pelo outro.
 */
export function blocoDePersona(
  p: PersonaProfunda,
  foco: 'post' | 'curso' | 'imagem' = 'post',
  extras?: { nome?: string },
): string {
  return gruposDePrompt(p, foco, extras)
    .map((g) => {
      const cabeca = `### ${g.titulo}` + (g.aviso ? `\n(${g.aviso})` : '');
      return `${cabeca}\n${g.linhas.map((l) => `${l.rotulo}: ${l.valor}`).join('\n')}`;
    })
    .join('\n\n');
}

/** Quantos campos profundos estão preenchidos — usado no XP e no selo. */
export function profundidade(p: PersonaProfunda): number {
  return montarDossie(p).confianca;
}
