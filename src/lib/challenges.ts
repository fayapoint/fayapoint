export type ChallengeDestination = "courses" | "studio" | "games" | "resources";

export interface ChallengeGuide {
  title: string;
  intro: string;
  steps: [string, string, string];
  cta: string;
  destination: ChallengeDestination;
  art: string;
}

const GUIDES: Record<string, ChallengeGuide> = {
  complete_lesson: {
    title: "Conclua uma lição hoje",
    intro: "Um passo curto mantém sua trilha viva e transforma intenção em progresso real.",
    steps: ["Abra um curso da sua biblioteca", "Escolha a próxima lição", "Conclua a aula para registrar o avanço"],
    cta: "Abrir meus cursos",
    destination: "courses",
    art: "/portal/trail/primeiro-curso.webp",
  },
  complete_3_lessons: {
    title: "Conclua 3 lições hoje",
    intro: "Faça um bloco de aprendizagem curto e saia com três avanços registrados.",
    steps: ["Retome um curso em andamento", "Conclua três lições em sequência", "Confira o progresso atualizado"],
    cta: "Continuar aprendendo",
    destination: "courses",
    art: "/portal/trail/meio-caminho.webp",
  },
  study_30min: {
    title: "Estude por 30 minutos",
    intro: "Reserve meia hora sem distrações para avançar em um curso que importa para você.",
    steps: ["Escolha um curso em andamento", "Ative um cronômetro de 30 minutos", "Conclua ao menos uma lição"],
    cta: "Começar bloco de estudo",
    destination: "courses",
    art: "/portal/trail/curso-completo.webp",
  },
  study_1h: {
    title: "Estude por 1 hora",
    intro: "Transforme uma hora focada em um avanço concreto na sua trilha de IA.",
    steps: ["Abra o curso que quer priorizar", "Separe dois blocos de 30 minutos", "Marque as lições concluídas"],
    cta: "Abrir curso em andamento",
    destination: "courses",
    art: "/portal/trail/curso-completo.webp",
  },
  generate_image: {
    title: "Crie uma imagem com IA",
    intro: "Pratique direção visual criando uma imagem simples no Studio AI.",
    steps: ["Abra o Studio AI", "Descreva assunto, cenário e estilo", "Gere e salve a sua criação"],
    cta: "Criar no Studio AI",
    destination: "studio",
    art: "/portal/trail/primeira-imagem.webp",
  },
  generate_3_images: {
    title: "Crie 3 imagens com IA",
    intro: "Compare três variações para aprender como pequenas mudanças alteram o resultado.",
    steps: ["Crie uma primeira versão no Studio", "Mude apenas um elemento do prompt", "Gere a terceira e compare"],
    cta: "Abrir Studio AI",
    destination: "studio",
    art: "/portal/trail/primeira-imagem.webp",
  },
  explore_tool: {
    title: "Explore uma ferramenta de IA",
    intro: "Descubra uma ferramenta nova e entenda onde ela pode ajudar de verdade.",
    steps: ["Abra os recursos da FayAi", "Escolha uma ferramenta", "Leia o guia e anote um uso prático"],
    cta: "Explorar recursos",
    destination: "resources",
    art: "/portal/trail/magica.webp",
  },
  share_creation: {
    title: "Compartilhe uma criação",
    intro: "Transforme o que você criou em conversa, feedback e portfólio.",
    steps: ["Escolha uma criação sua", "Revise imagem e descrição", "Compartilhe no canal que preferir"],
    cta: "Ver minhas criações",
    destination: "studio",
    art: "/portal/trail/primeira-conquista.webp",
  },
};

export function getChallengeGuide(id?: string, fallbackDescription?: string): ChallengeGuide {
  if (id && GUIDES[id]) return GUIDES[id];

  return {
    title: fallbackDescription || "Complete seu desafio de hoje",
    intro: "Faça uma ação pequena e verificável para manter seu aprendizado em movimento.",
    steps: ["Escolha uma ação da sua trilha", "Execute com atenção", "Confira o progresso no portal"],
    cta: "Ver meus cursos",
    destination: "courses",
    art: "/portal/trail/primeira-conquista.webp",
  };
}
