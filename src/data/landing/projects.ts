// Portfólio de projetos do ecossistema FayAI — exibido em /projetos.
// Status: "no-ar" (produto vivo), "beta", "construindo", "pesquisa" (P&D).

export type ProjectStatus = "no-ar" | "beta" | "construindo" | "pesquisa";

export interface FayProject {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  status: ProjectStatus;
  accent: string;
  tags: string[];
  href?: string;
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  "no-ar": "NO AR",
  "beta": "BETA",
  "construindo": "CONSTRUINDO",
  "pesquisa": "PESQUISA",
};

export const FAY_PROJECTS: FayProject[] = [
  {
    id: "cursos",
    name: "Cursos FayAI",
    tagline: "18 cursos de IA com certificação verificável",
    description:
      "ChatGPT, Claude, Midjourney, n8n, agentes de IA e muito mais — do zero ao avançado, 100% em português. Quiz avaliativo de verdade e certificado com código de verificação público que qualquer empregador pode conferir.",
    image: "/landing/proj-cursos.webp",
    status: "no-ar",
    accent: "#f5c04e",
    tags: ["Educação", "IA", "Certificação"],
    href: "/cursos",
  },
  {
    id: "livros",
    name: "Livros & Audiobooks",
    tagline: "Conhecimento em todos os formatos",
    description:
      "Livros como o IA Sem Filtro — escrito em parceria com a própria IA — e a linha de audiobooks com narração gerada por voz neural. Ler, ouvir ou os dois: o conhecimento se adapta à sua rotina.",
    image: "/landing/proj-livros.webp",
    status: "no-ar",
    accent: "#a78bfa",
    tags: ["Conteúdo", "TTS", "Publicação"],
    href: "/cursos",
  },
  {
    id: "uss",
    name: "Ultimate Social Suite",
    tagline: "Gestão de redes sociais com IA — apresentado no RioWebSummit",
    description:
      "Agendamento, análise e criação de conteúdo para todas as suas redes num painel só, com IA gerando posts, legendas e relatórios. Apresentado ao público no RioWebSummit e agora sendo integrado à plataforma FayAI.",
    image: "/landing/proj-uss.webp",
    status: "construindo",
    accent: "#38bdf8",
    tags: ["Social Media", "Automação", "SaaS"],
  },
  {
    id: "worldforge",
    name: "WorldForge Studio",
    tagline: "Um estúdio de cinema movido a IA para as suas histórias",
    description:
      "Crie mundos, personagens, cenas e roteiros — e o WorldForge gera os prompts de imagem e vídeo como um estúdio profissional. Já produz uma série completa internamente; a versão comercial dará a cada assinante o próprio painel de controle criativo.",
    image: "/landing/proj-worldforge.webp",
    status: "beta",
    accent: "#f472b6",
    tags: ["Storytelling", "IA generativa", "Cinema"],
  },
  {
    id: "music",
    name: "Som em Bando",
    tagline: "O app que transforma vários celulares numa experiência sonora única",
    description:
      "Cada pessoa entra com seu gosto musical e o app gera um mix da turma. Os celulares se escutam pelo microfone, detectam a forma de onda uns dos outros e se sincronizam para SOMAR — quanto mais aparelhos, maior o som. E no modo karaokê, o app separa voz e instrumental, gera o vídeo com a letra e organiza os turnos: cada um canta na sua vez.",
    image: "/landing/proj-music.webp",
    status: "construindo",
    accent: "#22d3ee",
    tags: ["Android & iOS", "Áudio", "Social"],
  },
  {
    id: "futebol",
    name: "Visão de Jogo",
    tagline: "Visão computacional aplicada ao futebol",
    description:
      "Uma ideia que nasceu dentro da Copa do Mundo de 2014, trabalhando na transmissão pela Fox Sports — e que a tecnologia só alcançou agora. Análise de partidas com segmentação e rastreamento em tempo real (SAM 3 + modelos especializados). O resto ainda é segredo.",
    image: "/landing/proj-futebol.webp",
    status: "pesquisa",
    accent: "#a3e635",
    tags: ["Visão computacional", "Esporte", "SAM 3"],
  },
  {
    id: "games",
    name: "Condutor de Games",
    tagline: "O copiloto de IA que joga do seu lado",
    description:
      "É raro se sentir ajudado por um jogo. O Condutor olha para onde você está e diz o que dá para fazer: objetivos que valem a pena, evoluções prestes a expirar, dinheiro parado no seu clube. Administrar menus não precisa ser a sua skill — jogar bem, sim.",
    image: "/landing/proj-games.webp",
    status: "pesquisa",
    accent: "#fb923c",
    tags: ["Gaming", "Copiloto IA", "EAFC"],
  },
];

// Serviços profissionais (páginas já existentes em /servicos/*)
export const SERVICES = [
  { href: "/servicos/construcao-de-sites", label: "Construção de sites", desc: "Sites modernos, rápidos e prontos para vender" },
  { href: "/servicos/automacao-e-integracao", label: "Automação com IA", desc: "n8n, agentes e integrações que trabalham por você" },
  { href: "/servicos/consultoria-ai", label: "Consultoria em IA", desc: "Do diagnóstico à implantação na sua empresa" },
  { href: "/servicos/edicao-de-video", label: "Edição de vídeo", desc: "28 anos de experiência em broadcast a seu favor" },
  { href: "/servicos/seo-local", label: "SEO local", desc: "Seja encontrado por quem está perto e pronto para comprar" },
  { href: "/agendar-consultoria", label: "Treinamento corporativo", desc: "Sua equipe dominando IA com quem faz todo dia" },
];
