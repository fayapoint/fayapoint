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
  fotos?: FotoPersona[];
}

export interface CampoFaltando {
  campo: string;
  pergunta: string;
  /** O que responder isto destrava — sem isso a pergunta é formulário. */
  ganho: string;
}

export interface DimensaoDossie {
  id: string;
  titulo: string;
  /** Uma linha dizendo o que esta dimensão MUDA no que entregamos. */
  paraQue: string;
  icone: string;
  cor: string;
  confianca: number;
  conhecido: Array<{ rotulo: string; valor: string }>;
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
        [!!identidade.missao, 2],
        [(identidade.valores || []).length > 0, 2],
        [!!identidade.cidade, 1],
      ]),
      conhecido: [
        identidade.marca ? { rotulo: 'Marca', valor: identidade.marca } : null,
        extras?.nome && !identidade.marca ? { rotulo: 'Nome', valor: extras.nome } : null,
        identidade.papel ? { rotulo: 'O que você faz', valor: identidade.papel } : null,
        areas.length ? { rotulo: 'Área', valor: areas.join(' · ') } : null,
        identidade.cidade ? { rotulo: 'Onde', valor: identidade.cidade } : null,
        identidade.missao ? { rotulo: 'Missão', valor: identidade.missao } : null,
        (identidade.valores || []).length ? { rotulo: 'Valores', valor: (identidade.valores || []).join(' · ') } : null,
      ].filter(Boolean) as DimensaoDossie['conhecido'],
      faltando: [
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
          ? { rotulo: 'Formalidade', valor: voz.formalidade < 35 ? 'Fala como com um amigo' : voz.formalidade > 70 ? 'Fala como num documento' : 'Meio-termo profissional' }
          : null,
        typeof voz.emoji === 'number'
          ? { rotulo: 'Emoji', valor: voz.emoji < 20 ? 'Quase nunca' : voz.emoji > 65 ? 'Em quase toda frase' : 'De vez em quando' }
          : null,
        (voz.bordoes || []).length ? { rotulo: 'Bordões', valor: (voz.bordoes || []).join(' · ') } : null,
        voz.vocabulario ? { rotulo: 'Vocabulário', valor: voz.vocabulario } : null,
        voz.amostra ? { rotulo: 'Amostra da sua escrita', valor: `“${voz.amostra.slice(0, 120)}${voz.amostra.length > 120 ? '…' : ''}”` } : null,
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
        publico.quemE ? { rotulo: 'Quem é', valor: publico.quemE } : null,
        Array.isArray(publico.idade) ? { rotulo: 'Idade', valor: `${publico.idade[0]} a ${publico.idade[1]} anos` } : null,
        (publico.lugares || []).length ? { rotulo: 'Onde estão', valor: (publico.lugares || []).join(' · ') } : null,
        (publico.dores || []).length ? { rotulo: 'O que dói neles', valor: (publico.dores || []).join(' · ') } : null,
        (publico.desejos || []).length ? { rotulo: 'O que eles querem', valor: (publico.desejos || []).join(' · ') } : null,
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
        (estrategia.pilares || []).length ? { rotulo: 'Pilares', valor: (estrategia.pilares || []).join(' · ') } : null,
        estrategia.porSemana ? { rotulo: 'Frequência', valor: `${estrategia.porSemana}x por semana` } : null,
        (estrategia.melhoresHorarios || []).length ? { rotulo: 'Horários', valor: (estrategia.melhoresHorarios || []).join(' · ') } : null,
        (p.topHashtags || []).length ? { rotulo: 'Hashtags', valor: (p.topHashtags || []).slice(0, 6).map((h) => `#${h.replace(/^#/, '')}`).join(' ') } : null,
        (estrategia.naoFalar || []).length ? { rotulo: 'Nunca falar de', valor: (estrategia.naoFalar || []).join(' · ') } : null,
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
        estrategia.assinatura ? { rotulo: 'Chamada padrão', valor: estrategia.assinatura } : null,
        aprendizado.objetivo ? { rotulo: 'Meta pessoal', valor: aprendizado.objetivo } : null,
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
        aprendizado.ritmo ? { rotulo: 'Como prefere', valor: RITMOS[aprendizado.ritmo] ?? aprendizado.ritmo } : null,
        aprendizado.tempo ? { rotulo: 'Tempo', valor: TEMPOS[aprendizado.tempo] ?? aprendizado.tempo } : null,
        (aprendizado.ferramentas || []).length ? { rotulo: 'Já usa', valor: (aprendizado.ferramentas || []).join(' · ') } : null,
        aprendizado.travando ? { rotulo: 'O que trava', valor: aprendizado.travando } : null,
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
        };
      }).filter(Boolean) as DimensaoDossie['conhecido'],
      faltando: TIPOS_FOTO.filter((t) => t !== 'perfil' && !fotos.some((f) => f.tipo === t)).map((t) => ({
        campo: `fotos.${t}`,
        pergunta: `Envie uma foto ${ROTULO_FOTO[t].titulo.toLowerCase()}`,
        ganho: `Usada em ${ROTULO_FOTO[t].para}`,
      })),
    },
  ];

  const confianca = Math.round(dimensoes.reduce((s, d) => s + d.confianca, 0) / dimensoes.length);
  const fortes = dimensoes.filter((d) => d.confianca >= 60).length;
  const qualidade: Dossie['qualidade'] =
    fortes >= 6 ? 'dossiê' : fortes >= 4 ? 'retrato' : fortes >= 2 ? 'rascunho' : 'esboço';

  return { confianca, qualidade, dimensoes, resumo: resumir(p, extras?.nome) };
}

/**
 * Uma frase em português com o que sabemos. É o topo do painel — e a prova
 * mais honesta de quanto (ou quão pouco) conhecemos a pessoa: quando sai
 * genérica, o usuário vê sozinho que precisa completar.
 */
export function resumir(p: PersonaProfunda, nome?: string): string {
  const area = traduz(lista(p.industry), AREAS)[0];
  const tom = traduz(lista(p.toneOfVoice), TONS)[0];
  const meta = traduz(lista(p.marketingGoals), OBJETIVOS)[0];
  const nivel = p.experienceLevel ? (NIVEIS[p.experienceLevel] || '').split('—')[0].trim().toLowerCase() : '';
  const papel = p.identidade?.papel;
  const quem = p.publico?.quemE;

  const partes: string[] = [];
  partes.push(nome ? nome.split(' ')[0] : 'Você');
  if (papel) partes.push(`— ${papel} —`);
  else if (area) partes.push(`trabalha com ${area.toLowerCase()}`);
  if (quem) partes.push(`fala com ${quem.toLowerCase()}`);
  if (tom) partes.push(`num tom ${tom.toLowerCase()}`);
  if (meta) partes.push(`para ${meta.toLowerCase()}`);
  if (nivel) partes.push(`e está ${nivel} com IA`);

  if (partes.length <= 2) return 'Ainda não sei quase nada sobre você — e é por isso que o conteúdo sai com cara de genérico.';
  return partes.join(' ').replace(/\s+/g, ' ').trim() + '.';
}

// ─────────────────────────────────────────────────────────────────────
// Saída para os modelos
// ─────────────────────────────────────────────────────────────────────

/**
 * O bloco de persona que entra em TODA geração — post, imagem ou exemplo de
 * curso. Em português e por extenso, não em códigos: o modelo escreve em
 * português e `["tech"]` não diz nada que "Tecnologia" não diga melhor.
 *
 * `foco` muda o recorte: para post interessa voz e público; para curso
 * interessa nível, ritmo e o que está travando.
 */
export function blocoDePersona(p: PersonaProfunda, foco: 'post' | 'curso' | 'imagem' = 'post'): string {
  const l: string[] = [];
  const id = p.identidade || {};
  const voz = p.voz || {};
  const pub = p.publico || {};
  const est = p.estrategia || {};
  const apr = p.aprendizado || {};

  if (id.marca) l.push(`Marca: ${id.marca}`);
  if (id.papel) l.push(`O que faz: ${id.papel}`);
  const areas = traduz(lista(p.industry), AREAS);
  if (areas.length) l.push(`Área: ${areas.join(', ')}`);
  if (id.cidade) l.push(`Onde vive: ${id.cidade}`);
  if (id.missao) l.push(`Por que faz: ${id.missao}`);
  if ((id.valores || []).length) l.push(`Valores inegociáveis: ${(id.valores || []).join(', ')}`);

  if (foco !== 'curso') {
    const tons = traduz(lista(p.toneOfVoice), TONS);
    if (tons.length) l.push(`Tom de voz: ${tons.join(', ')}`);
    if (typeof voz.formalidade === 'number') {
      l.push(
        `Formalidade: ${voz.formalidade < 35 ? 'baixa — escreva como quem conversa, pode usar contração e gíria leve' : voz.formalidade > 70 ? 'alta — evite gíria, frases completas, terceira pessoa quando couber' : 'média — profissional mas próximo'}`
      );
    }
    if (typeof voz.emoji === 'number') {
      l.push(`Emoji: ${voz.emoji < 20 ? 'quase nenhum' : voz.emoji > 65 ? 'muitos, inclusive no meio da frase' : 'poucos, no fim de parágrafo'}`);
    }
    if ((voz.bordoes || []).length) l.push(`Expressões que são a cara dele: ${(voz.bordoes || []).join(' / ')}`);
    if (voz.vocabulario) l.push(`Vocabulário: ${voz.vocabulario}`);
    const recursos = [voz.usaHumor && 'humor', voz.usaPergunta && 'perguntas diretas', voz.usaHistoria && 'histórias pessoais', voz.usaCta && 'chamada para ação no fim'].filter(Boolean);
    if (recursos.length) l.push(`Usa: ${recursos.join(', ')}`);
    if (voz.amostra) l.push(`AMOSTRA REAL DA ESCRITA DELE (imite o ritmo de frase, não o assunto):\n"""\n${voz.amostra.slice(0, 900)}\n"""`);
  }

  if (pub.quemE) l.push(`Público: ${pub.quemE}`);
  if (Array.isArray(pub.idade)) l.push(`Idade do público: ${pub.idade[0]}-${pub.idade[1]}`);
  if ((pub.dores || []).length) l.push(`Dores do público: ${(pub.dores || []).join('; ')}`);
  if ((pub.desejos || []).length) l.push(`Desejos do público: ${(pub.desejos || []).join('; ')}`);
  if (p.audienceInsights) l.push(`Sinais coletados sobre ele: ${p.audienceInsights.slice(0, 400)}`);

  const metas = traduz(lista(p.marketingGoals), OBJETIVOS);
  if (metas.length) l.push(`Objetivos: ${metas.join(', ')}`);
  if ((est.pilares || []).length) l.push(`Pilares de conteúdo: ${(est.pilares || []).join(', ')}`);
  if (est.assinatura) l.push(`Chamada para ação preferida: ${est.assinatura}`);

  if (foco === 'post') {
    const formatos = traduz(lista(p.contentTypes), FORMATOS);
    if (formatos.length) l.push(`Formatos que ele produz: ${formatos.join(', ')}`);
    if ((p.topHashtags || []).length) l.push(`Hashtags dele: ${(p.topHashtags || []).slice(0, 10).map((h) => `#${h.replace(/^#/, '')}`).join(' ')}`);
  }

  if (foco === 'curso') {
    if (p.experienceLevel) l.push(`Nível com IA: ${NIVEIS[p.experienceLevel] ?? p.experienceLevel}`);
    if (apr.ritmo) l.push(`Como aprende melhor: ${RITMOS[apr.ritmo] ?? apr.ritmo}`);
    if (apr.tempo) l.push(`Tempo disponível: ${TEMPOS[apr.tempo] ?? apr.tempo}`);
    if ((apr.ferramentas || []).length) l.push(`Ferramentas que já usa: ${(apr.ferramentas || []).join(', ')}`);
    if (apr.travando) l.push(`O que já tentou e não deu certo: ${apr.travando}`);
    if (apr.objetivo) l.push(`Meta dos próximos 90 dias: ${apr.objetivo}`);
  }

  if ((est.naoFalar || []).length) l.push(`PROIBIDO mencionar: ${(est.naoFalar || []).join(', ')}`);

  return l.join('\n');
}

/** Quantos campos profundos estão preenchidos — usado no XP e no selo. */
export function profundidade(p: PersonaProfunda): number {
  return montarDossie(p).confianca;
}
