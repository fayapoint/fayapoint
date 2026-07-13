// Conteúdo das páginas individuais de projeto (/projetos/[id]).
// Fotos em /public/landing/photos/{id}-hero.webp e {id}-g1..g9.webp.

export interface ProjectDetail {
  lead: string;
  story: string[];
  features: { title: string; desc: string }[];
  captions: string[]; // g1..g9
  cta?: { label: string; href: string };
}

export const PROJECT_DETAILS: Record<string, ProjectDetail> = {
  cursos: {
    lead: "Aprender IA não é assistir aula — é fazer, errar, repetir e sair com prova de que você sabe.",
    story: [
      "Os 18 cursos da FayAI cobrem o arsenal completo da era da IA: ChatGPT, Claude, Gemini, Midjourney, Leonardo, n8n, Make, agentes autônomos, engenharia de prompt e muito mais. Tudo 100% em português, atualizado constantemente — porque nesse mundo, conteúdo de seis meses atrás já é história antiga.",
      "Cada curso termina numa certificação de verdade: quiz avaliativo com nota mínima de 70%, até 3 tentativas, e um código de verificação público que qualquer empregador pode conferir online. Não é um PDF decorativo — é um certificado que aguenta pergunta de RH.",
      "E o melhor: você começa de graça. Todo mês um curso completo fica aberto, sem cartão de crédito, sem pegadinha.",
    ],
    features: [
      { title: "18 cursos completos", desc: "Das ferramentas mais famosas às técnicas avançadas de agentes" },
      { title: "Certificação verificável", desc: "Quiz com 70% de nota mínima e código público de verificação" },
      { title: "100% em português", desc: "Feito para o Brasil, com exemplos da vida real brasileira" },
      { title: "Curso grátis todo mês", desc: "Sem cartão, sem compromisso — entre e comece agora" },
      { title: "Atualização contínua", desc: "GPT-5.5, Claude Opus, Gemini 3.1 — sempre a versão atual" },
      { title: "Do zero ao avançado", desc: "Nenhum pré-requisito além de curiosidade" },
    ],
    captions: [
      "Estude onde estiver, no seu ritmo",
      "Prática guiada com as ferramentas reais",
      "Certificado com verificação pública",
      "Comunidade que aprende junto",
      "Aulas que cabem no trajeto de ônibus",
      "Cada módulo, uma conquista",
      "A sensação do primeiro prompt que funciona",
      "Para os que gostam de estudar de madrugada",
      "Progresso que dá para ver",
    ],
    cta: { label: "Ver os cursos", href: "/cursos" },
  },
  livros: {
    lead: "O conhecimento tem que caber na sua vida — no papel, na tela ou nos seus fones de ouvido.",
    story: [
      "A linha editorial da FayAI nasceu de um experimento radical: o livro IA Sem Filtro foi escrito em parceria com a própria inteligência artificial, numa conversa franca sobre o que ela é, o que não é, e o que vem por aí. O resultado é um retrato honesto da tecnologia mais transformadora da nossa geração.",
      "Agora essa biblioteca ganha voz: os audiobooks FayAI usam narração neural de última geração — a mesma tecnologia que ensinamos nos cursos — para transformar cada título numa experiência de ouvir gente, não robô.",
      "Ler no e-reader, ouvir no trânsito, folhear no sofá. O formato é você quem escolhe; o conteúdo é sempre o mesmo: denso, direto e sem enrolação.",
    ],
    features: [
      { title: "IA Sem Filtro", desc: "O livro escrito com a IA sobre a IA — sem filtro mesmo" },
      { title: "Audiobooks neurais", desc: "Narração gerada por voz neural de altíssima qualidade" },
      { title: "Multi-formato", desc: "PDF, e-reader e áudio — pague uma vez, leia como quiser" },
      { title: "Conteúdo denso", desc: "Zero enrolação: cada capítulo ensina algo aplicável" },
    ],
    captions: [
      "Boas histórias pedem um bom café",
      "Audiobook: conhecimento de olhos fechados",
      "Qualidade de estúdio em cada narração",
      "A estante que cresce com você",
      "Aprenda até correndo",
      "Páginas que valem a luz acesa",
      "O ritual da leitura antes de dormir",
      "Por trás do áudio: engenharia de verdade",
      "Conhecimento que se compartilha",
    ],
    cta: { label: "Conhecer os livros", href: "/cursos" },
  },
  uss: {
    lead: "Todas as suas redes sociais num painel só — com IA fazendo o trabalho pesado.",
    story: [
      "O Ultimate Social Suite foi apresentado ao público no RioWebSummit com uma promessa simples: gerenciar redes sociais não deveria consumir a vida de ninguém. Agendamento, criação de conteúdo com IA, análise de resultados e relatórios — tudo num lugar só.",
      "A IA do USS escreve legendas no tom da sua marca, sugere os melhores horários com base no SEU público, e transforma métricas confusas em recomendações claras: faça mais disso, pare com aquilo.",
      "Agora o USS está sendo integrado ao ecossistema FayAI — a mesma conta, o mesmo painel, a mesma IA que já conhece você. Em breve, como módulo da plataforma.",
    ],
    features: [
      { title: "Todas as redes", desc: "Instagram, Facebook, YouTube e mais — um painel só" },
      { title: "IA que escreve", desc: "Posts, legendas e hashtags no tom da sua marca" },
      { title: "Agendamento inteligente", desc: "Publique nos horários em que SEU público está online" },
      { title: "Métricas que orientam", desc: "Relatórios que dizem o que fazer, não só o que houve" },
      { title: "Apresentado no RioWebSummit", desc: "Validado ao vivo diante do público" },
    ],
    captions: [
      "Sua audiência, na palma da mão",
      "Estratégia se constrói em equipe",
      "Criar conteúdo virou processo, não sofrimento",
      "Cada notificação, uma oportunidade",
      "O calendário que trabalha por você",
      "Edição profissional no celular",
      "Métricas subindo é hábito, não sorte",
      "Feito para o pequeno negócio brasileiro",
      "Suas redes trabalhando enquanto você dorme",
    ],
  },
  worldforge: {
    lead: "Um estúdio de cinema inteiro — roteiro, direção de arte e produção — movido a IA.",
    story: [
      "O WorldForge nasceu de uma necessidade real: produzir uma série completa com IA exige organizar mundos, personagens, cenas, diálogos e prompts de imagem com rigor de estúdio profissional. Nenhuma ferramenta fazia isso. Então construímos.",
      "No WorldForge, cada história vira um universo navegável: personagens com fichas completas, locações com identidade visual, cenas decompostas em shots — e para cada shot, o prompt perfeito de imagem ou vídeo, gerado com o contexto inteiro do mundo em mente. É a diferença entre pedir 'um castelo' e pedir O castelo da SUA história.",
      "Hoje o WorldForge produz internamente uma série original completa. A versão comercial dará a cada assinante o próprio estúdio: seu painel, seus mundos, suas histórias — com a mesma engenharia que usamos todos os dias.",
    ],
    features: [
      { title: "Mundos navegáveis", desc: "Personagens, locações e cenas organizados como num estúdio" },
      { title: "Prompts com contexto", desc: "Cada imagem gerada conhece a história inteira" },
      { title: "Do roteiro ao shot", desc: "Decomposição profissional de cenas em planos" },
      { title: "Testado em produção", desc: "Uma série original completa já nasce dentro dele" },
      { title: "Seu próprio estúdio", desc: "Na versão comercial, cada assinante tem seu painel" },
    ],
    captions: [
      "Cada cena começa com uma claquete",
      "Onde o roteiro encontra a máquina",
      "Do rascunho ao mundo pronto",
      "A lente é a IA; o olhar é seu",
      "Cor é emoção calibrada",
      "Mundos em miniatura, ambição em escala",
      "Toda história precisa de um palco",
      "O mapa da narrativa na parede",
      "E no final... o mundo que você criou",
    ],
  },
  music: {
    lead: "Vários celulares. Uma música. Quanto mais gente, maior o som.",
    story: [
      "Som em Bando começa com uma pergunta: por que a música do encontro toca num celular só? O app conecta os aparelhos de todo mundo e cria um mix com o gosto de cada pessoa presente — a playlist deixa de ser de alguém e vira da turma.",
      "A mágica técnica: os celulares se escutam. Usando o microfone, cada aparelho detecta a forma de onda dos outros e se ajusta em tempo real para SOMAR — transformando um bando de celulares numa parede de som sincronizada. Quanto mais aparelhos na roda, maior a experiência.",
      "E quando a noite esquenta, vira karaokê: o app separa a voz do instrumental, joga a letra na tela em vídeo, e organiza os turnos — ele diz de quem é a vez de pegar o microfone. Ninguém fica de fora, ninguém monopoliza.",
    ],
    features: [
      { title: "Mix coletivo", desc: "A playlist nasce do gosto de todo mundo presente" },
      { title: "Sincronização por microfone", desc: "Os celulares se escutam e ajustam a onda para somar" },
      { title: "Quanto mais, melhor", desc: "Cada aparelho a mais aumenta a parede de som" },
      { title: "Karaokê instantâneo", desc: "Voz separada do instrumental + letra em vídeo" },
      { title: "Turnos automáticos", desc: "O app organiza quem canta agora — e quem vem depois" },
      { title: "Android & iOS", desc: "Feito para funcionar em qualquer roda de amigos" },
    ],
    captions: [
      "Todos os aparelhos, uma onda só",
      "Karaokê sem equipamento: só o app",
      "A forma de onda que une a roda",
      "Toda festa precisa de trilha",
      "Música é melhor dividida",
      "Sua vez no microfone",
      "Do violão ao algoritmo, o ritual é o mesmo",
      "Celulares em sincronia perfeita",
      "O show é de todo mundo",
    ],
  },
  futebol: {
    lead: "Uma ideia que nasceu dentro da Copa de 2014 — e que a tecnologia só alcançou agora.",
    story: [
      "Em 2014, editando a Copa do Mundo pela Fox Sports, Ricardo visualizou algo que nenhuma transmissão fazia — e que nenhuma faz até hoje. A ideia ficou guardada por mais de uma década, esperando a tecnologia amadurecer.",
      "Ela amadureceu. Com modelos de segmentação como o SAM 3 e redes de detecção treinadas especificamente para futebol — jogadores, bola, campo, movimentação — hoje é possível entender uma partida em tempo real, quadro a quadro, com precisão que era ficção científica em 2014.",
      "O que exatamente vamos fazer com isso? Ainda é segredo. Mas quem passou 28 anos dentro de transmissões esportivas sabe onde dói — e onde ninguém olhou ainda.",
    ],
    features: [
      { title: "Visão computacional", desc: "SAM 3 + modelos especializados em futebol" },
      { title: "Tempo real", desc: "Jogadores, bola e campo entendidos quadro a quadro" },
      { title: "28 anos de broadcast", desc: "A visão de quem editou Copa e Olimpíadas por dentro" },
      { title: "Ineditismo", desc: "Nada parecido existe — em 12 anos, ninguém fez" },
    ],
    captions: [
      "O palco: 90 minutos de dados em movimento",
      "A bola vista como a máquina vê",
      "Cada jogada, milhares de pontos rastreados",
      "Da prancheta ao algoritmo",
      "Novos ângulos, novas perguntas",
      "A sala de onde as transmissões nascem",
      "Onde tudo começa: a rua",
      "O momento que a análise quer explicar",
      "Física, chuva e uma fração de segundo",
    ],
  },
  games: {
    lead: "É raro se sentir ajudado por um jogo. O Condutor joga do seu lado.",
    story: [
      "Jogos modernos são maravilhosos — e assoberbantes. Menus infinitos, moedas paralelas, eventos que expiram, evoluções escondidas. No EAFC, por exemplo: quantas vezes você deixou dinheiro parado no clube, perdeu uma evolução que expirava, ou simplesmente não soube por onde começar a sessão?",
      "O Condutor de Games é um copiloto de IA que olha para onde você está e responde a pergunta que o jogo nunca responde: 'e agora, o que vale a pena fazer?'. Objetivos rankeados por retorno, alertas do que expira, oportunidades de mercado — conversando com você, como um amigo que manja.",
      "Ser bom de jogo deveria ser sobre jogar — não sobre administrar planilhas mentais. A skill contra outros jogadores continua sua; a burocracia, a gente assume.",
    ],
    features: [
      { title: "Consciência de contexto", desc: "O Condutor entende onde você está no jogo" },
      { title: "Prioridades rankeadas", desc: "O que vale a pena fazer AGORA, em ordem" },
      { title: "Alertas de expiração", desc: "Evoluções e eventos nunca mais passam batido" },
      { title: "Inteligência de mercado", desc: "Seu capital no jogo trabalhando direito" },
      { title: "Conversa, não menu", desc: "Pergunte como perguntaria a um amigo que manja" },
    ],
    captions: [
      "O controle na mão, o copiloto do lado",
      "Foco no jogo — o resto é com o Condutor",
      "Jogo numa tela, inteligência na outra",
      "Do sofá ao competitivo",
      "Jogar junto é melhor",
      "Cada tecla, uma decisão",
      "O QG de todo jogador",
      "O companheiro que cabe no bolso",
      "A vitória continua sendo sua",
    ],
  },
};
