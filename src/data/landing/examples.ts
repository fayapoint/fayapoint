// Banco de exemplos do minigame da landing: "entrou, fez, foi recompensado".
// Cada exemplo mostra um resultado real que a pessoa consegue reproduzir
// colando o prompt no ChatGPT/Claude/Gemini — a ponte entre a vida dela e a IA.
// O loop de autoresearch/CRO vai expandir e rankear este banco depois.

export type ExampleCategory = "trabalho" | "estudos" | "criar" | "dia-a-dia";

export interface MagicExample {
  id: string;
  category: ExampleCategory;
  emoji: string;
  title: string;
  hook: string;
  prompt: string;
  result: string;
  apply: string;
  /** O palpite — a mecânica de jogo: adivinhe o que a IA consegue fazer */
  quiz: { question: string; options: [string, string, string]; answer: 0 | 1 | 2 };
}

export const CATEGORIES: { id: ExampleCategory; emoji: string; label: string }[] = [
  { id: "trabalho", emoji: "💼", label: "Trabalho" },
  { id: "estudos", emoji: "📚", label: "Estudos" },
  { id: "criar", emoji: "🎨", label: "Criar" },
  { id: "dia-a-dia", emoji: "☕", label: "Dia a dia" },
];

export const MAGIC_EXAMPLES: MagicExample[] = [
  {
    id: "email-dificil",
    category: "trabalho",
    emoji: "📧",
    title: "O e-mail difícil, resolvido em 10 segundos",
    hook: "Aquele e-mail delicado que você adia há 3 dias? A IA escreve a versão diplomática na hora.",
    prompt:
      "Preciso responder um e-mail delicado. Situação: [descreva em 1 frase, ex.: um cliente cobrou um prazo que vamos atrasar]. Escreva uma resposta profissional, honesta e empática em português, com no máximo 6 linhas, que preserve a relação.",
    result:
      "“Olá, Marcos! Obrigado pela mensagem — você tem razão em cobrar. Tivemos um imprevisto técnico e o prazo passa para sexta-feira. Para compensar, já adiantei a primeira parte, que segue anexa. Fico à disposição hoje para qualquer ajuste.”",
    apply: "Funciona para cobranças, desculpas, negociações e feedbacks difíceis. Cole a situação, receba o texto pronto — e edite só o tom final.",
    quiz: {
      question: "Quanto tempo a IA leva para escrever esse e-mail diplomático?",
      options: ["Uns 5 minutos, pensando bem", "Menos de 10 segundos", "Ela não consegue, e-mail é coisa de humano"],
      answer: 1,
    },
  },
  {
    id: "reuniao-resumida",
    category: "trabalho",
    emoji: "📝",
    title: "Reunião de 1 hora vira 5 linhas",
    hook: "Cole a transcrição (ou suas anotações bagunçadas) e receba a ata pronta: decisões, pendências e quem faz o quê.",
    prompt:
      "Aqui estão minhas anotações de uma reunião: [cole tudo, mesmo bagunçado]. Organize em: 1) Decisões tomadas, 2) Pendências com responsável e prazo, 3) Uma frase de resumo para quem não participou.",
    result:
      "Decisões: campanha aprovada com orçamento de R$ 5 mil. Pendências: Ana envia as artes até quarta; Léo fecha o fornecedor até sexta. Resumo: a campanha de agosto está aprovada e começa dia 1º.",
    apply: "Use com o gravador do celular + transcrição automática. Nunca mais saia de reunião sem saber o que ficou combinado.",
    quiz: {
      question: "O que a IA extrai de 1 hora de reunião bagunçada?",
      options: ["Só um resumão genérico", "Nada, ela se perde no áudio", "Decisões, pendências E quem faz o quê"],
      answer: 2,
    },
  },
  {
    id: "professor-24h",
    category: "estudos",
    emoji: "🧑‍🏫",
    title: "Um professor particular disponível 24h",
    hook: "Qualquer assunto explicado do SEU jeito — com analogia, exemplo e um mini-teste no final.",
    prompt:
      "Me explique [assunto, ex.: juros compostos] como se eu tivesse 12 anos, usando uma analogia do futebol. Depois me faça 3 perguntas para testar se eu entendi, uma de cada vez, corrigindo minhas respostas.",
    result:
      "“Juros compostos são como um time que joga cada rodada com os pontos da rodada anterior somados ao elenco: o que você ganhou passa a jogar junto. R$ 100 a 10% viram 110, e no mês seguinte os 110 inteiros entram em campo...”",
    apply: "Troque a analogia pelo que você ama (culinária, música, novela). O mini-teste é o que faz o conteúdo grudar.",
    quiz: {
      question: "A IA consegue explicar juros compostos usando... futebol?",
      options: ["Consegue — com analogia E mini-teste no final", "Só se você pagar a versão premium", "Consegue, mas fica confuso"],
      answer: 0,
    },
  },
  {
    id: "flashcards",
    category: "estudos",
    emoji: "🎴",
    title: "Qualquer texto vira cartões de memorização",
    hook: "Cole o capítulo, o edital ou o slide — e receba flashcards prontos de pergunta e resposta.",
    prompt:
      "Transforme este texto em 10 flashcards de pergunta e resposta, do mais básico ao mais difícil, em português: [cole o texto]. Depois me pergunte um por um e diga se acertei.",
    result:
      "Cartão 1 — P: Qual órgão produz a insulina? R: O pâncreas. | Cartão 2 — P: Qual a diferença entre diabetes tipo 1 e 2? R: No tipo 1 o corpo não produz insulina; no tipo 2 ele resiste a ela...",
    apply: "Perfeito para concursos, provas e certificações. A IA vira seu parceiro de revisão ativa — o método que a ciência diz que funciona.",
    quiz: {
      question: "Você cola um capítulo inteiro. O que a IA devolve?",
      options: ["Um resumo comum", "10 flashcards prontos — e ainda te toma a lição", "Uma lista de links para estudar"],
      answer: 1,
    },
  },
  {
    id: "post-30s",
    category: "criar",
    emoji: "📱",
    title: "Post de Instagram completo em 30 segundos",
    hook: "Uma frase sobre seu negócio → gancho, legenda e hashtags prontos para publicar.",
    prompt:
      "Sou [ex.: confeiteira em Niterói] e quero um post sobre [ex.: bolo de pote de chocolate]. Crie: 1) um gancho de primeira linha que pare o dedo, 2) legenda curta com tom leve, 3) 8 hashtags locais e do nicho, 4) uma ideia de foto para acompanhar.",
    result:
      "Gancho: “O bolo que acaba antes do café esfriar ☕🍫” — Legenda: “Camadas de brigadeiro de verdade, feito hoje de manhã. Entrego em Niterói até as 18h...” + hashtags e sugestão de foto com luz natural.",
    apply: "Repita para cada produto. Em 10 minutos você monta a semana inteira de conteúdo — e nossos cursos mostram como automatizar isso.",
    quiz: {
      question: "Uma frase sobre seu bolo de pote. O que sai do outro lado?",
      options: ["Gancho + legenda + hashtags + ideia de foto", "Só uma legenda simples", "Um texto formal de propaganda"],
      answer: 0,
    },
  },
  {
    id: "imagem-sem-designer",
    category: "criar",
    emoji: "🖼️",
    title: "Imagem profissional sem contratar designer",
    hook: "A diferença entre uma imagem amadora e uma incrível é o prompt. Aprenda a receita.",
    prompt:
      "Crie uma imagem: [assunto, ex.: logotipo para cafeteria ‘Grão Feliz’], estilo [ex.: minimalista, flat], cores [ex.: marrom e creme], fundo [ex.: liso], iluminação [ex.: suave], sem texto adicional, alta qualidade.",
    result:
      "Uma imagem coerente com sua marca — porque você descreveu assunto, estilo, cor, fundo e luz em vez de só “faz um logo bonito”. Essa estrutura de 5 ingredientes funciona em qualquer gerador.",
    apply: "Use no gerador de imagens do ChatGPT, no Gemini ou no nosso Studio. A receita do prompt vale mais que a ferramenta.",
    quiz: {
      question: "Qual o segredo de uma imagem de IA profissional?",
      options: ["Sorte no clique", "Pagar o gerador mais caro", "A receita: assunto + estilo + cor + fundo + luz"],
      answer: 2,
    },
  },
  {
    id: "cardapio-semana",
    category: "dia-a-dia",
    emoji: "🍳",
    title: "Cardápio da semana com o que tem na geladeira",
    hook: "Liste o que você tem em casa e receba o cardápio da semana + lista de compras do que falta.",
    prompt:
      "Tenho na geladeira: [ex.: frango, arroz, ovos, tomate, queijo, macarrão]. Monte um cardápio de jantar de segunda a sexta usando isso, variado e rápido (máx. 30 min), e uma lista de compras só do que faltar.",
    result:
      "Seg: macarrão cremoso de frango. Ter: omelete recheada + salada de tomate. Qua: arroz de forno com queijo... Lista de compras: cebola, creme de leite, brócolis (3 itens).",
    apply: "Cinco minutos no domingo e a semana está resolvida. Funciona também para marmitas, dieta e orçamento apertado.",
    quiz: {
      question: "Você lista o que tem na geladeira. A IA monta...",
      options: ["Uma receita só", "O cardápio da semana + lista de compras do que falta", "Uma dieta genérica de internet"],
      answer: 1,
    },
  },
  {
    id: "conta-explicada",
    category: "dia-a-dia",
    emoji: "🔍",
    title: "Contrato ou conta confusa? Traduzido na hora",
    hook: "Cole a cláusula ou a fatura que você não entende e receba a explicação em português de gente.",
    prompt:
      "Explique em linguagem simples o que significa isto: [cole a cláusula do contrato ou o item da fatura]. Depois me diga: 1) o que devo prestar atenção, 2) que pergunta devo fazer antes de assinar/pagar.",
    result:
      "“Essa cláusula diz que a mensalidade sobe automaticamente pela inflação a cada 12 meses. Atenção: o índice usado é o IGP-M, que costuma subir mais que o IPCA. Pergunte se é possível trocar o índice...”",
    apply: "Planos de saúde, aluguel, financiamento, fatura de celular. Nunca mais assine sem entender — a IA lê as letras miúdas com você.",
    quiz: {
      question: "Cole aquela cláusula confusa do contrato. A IA te diz...",
      options: ["O que significa + o que perguntar antes de assinar", "Que você precisa de um advogado", "Só repete em outras palavras"],
      answer: 0,
    },
  },
];

export const XP_PER_EXAMPLE = 50;
export const XP_BONUS_ACERTO = 25;
export const FREE_EXAMPLES_LIMIT = 3;
export const MAX_LANDING_XP = FREE_EXAMPLES_LIMIT * (XP_PER_EXAMPLE + XP_BONUS_ACERTO);
