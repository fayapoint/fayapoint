import type { IFonte } from "@/models/PastaVivaMetodo";

/**
 * ── A SEMENTE DO ACERVO ─────────────────────────────────────────────────────
 * 10/09/2026
 *
 * O acervo da Pasta Viva não nasce vazio nem nasce inventado: nasce do próprio
 * livro. Cada método aqui sai de um capítulo específico de "Ganhar dinheiro com
 * IA", e o capítulo é citado como fonte na página do método.
 *
 * ## ⛔ Por que nenhuma semente tem `roiDeclarado`
 *
 * Porque o livro **não promete número** — é a decisão editorial dele, escrita
 * na primeira página. Copiar um ROI que a fonte não afirmou seria inventar, e
 * inventar aqui é pior do que em qualquer outro lugar do site: este é o acervo
 * que vamos citar por anos.
 *
 * O que a semente traz de número é o que é **estrutural e verificável**:
 * quanto custa começar (`investimentoReais`) e quantas horas até a primeira
 * entrega possível (`tempoConclusaoHoras`), ambos lidos do fluxo de execução do
 * capítulo. É por esses dois que o gráfico da página é desenhado — eles são
 * fato sobre o método, não previsão sobre o leitor.
 *
 * O retorno entra no acervo por duas vias, ambas datadas: quando uma fonte
 * externa declarar (o debate diário traz, com a fonte junto), ou quando nós
 * medirmos. Até lá a coluna diz "ainda não medimos" — e dizer isso é o produto.
 */

const LIVRO = (cap: number, titulo: string): IFonte => ({
  id: `livro-cap-${cap}`,
  titulo: `Capítulo ${cap}: ${titulo}`,
  autor: "Ricardo Faya — Ganhar dinheiro com IA: preste serviços e seja pago",
  tipo: "artigo",
  sustenta: "Fluxo de execução, erros comuns e checklist do método.",
});

export interface MetodoSemente {
  slug: string;
  titulo: string;
  tldr: string;
  categoria: string;
  investimentoReais: number;
  tempoConclusaoHoras: number;
  dificuldade: "baixa" | "media" | "alta";
  fontes: IFonte[];
  tutorial: { passo: number; titulo: string; detalhe: string }[];
}

export const SEMENTES: MetodoSemente[] = [
  {
    slug: "mapa-de-oportunidades-na-lista-de-contatos",
    titulo: "Mapa de oportunidades na sua lista de contatos",
    tldr: "Transformar a agenda que você já tem numa planilha de hipóteses de serviço, com problema, entrega e preço por contato.",
    categoria: "Escolher o serviço",
    investimentoReais: 0,
    tempoConclusaoHoras: 2,
    dificuldade: "baixa",
    fontes: [LIVRO(3, "Como escolher o serviço que você vai prestar (e cobrar por ele)")],
    tutorial: [
      { passo: 1, titulo: "Abra uma planilha em branco", detalhe: "Colunas: Contato, Profissão, Problema que ele tem, Como a IA resolve, Entrega tangível, Preço estimado." },
      { passo: 2, titulo: "Liste 10 pessoas sem filtrar", detalhe: "Amigos, ex-colegas, parentes, clientes antigos. Nome e profissão. Filtrar agora é o erro que esvazia a lista antes dela existir." },
      { passo: 3, titulo: "Levante a dor de cada profissão", detalhe: "Pergunte ao modelo quais dores aquela profissão tem no dia a dia e anote. Nesta etapa é hipótese, não fato." },
      { passo: 4, titulo: "Escreva o problema em uma frase", detalhe: "Se não couber numa frase, ele não é real ainda. Essa restrição é o que separa você de quem diz que faz um pouco de tudo." },
    ],
  },
  {
    slug: "primeiro-cliente-na-agenda",
    titulo: "Primeiro cliente vindo da agenda, não da internet",
    tldr: "A abordagem que fala do problema da pessoa em vez de anunciar seu serviço — feita para quem já te conhece.",
    categoria: "Achar cliente",
    investimentoReais: 0,
    tempoConclusaoHoras: 3,
    dificuldade: "baixa",
    fontes: [
      LIVRO(4, "O primeiro cliente está na sua lista de contatos, não na internet"),
      LIVRO(10, "A abordagem que não parece spam: a mensagem que fala do problema"),
    ],
    tutorial: [
      { passo: 1, titulo: "Escolha 3 contatos do mapa", detalhe: "Os três com o problema mais claro, não os três mais próximos de você." },
      { passo: 2, titulo: "Escreva falando da dor, não do serviço", detalhe: "A mensagem abre no problema da pessoa. Nenhuma menção a ferramenta, preço ou pacote na primeira mensagem." },
      { passo: 3, titulo: "Peça uma conversa, não uma compra", detalhe: "O objetivo da primeira mensagem é agendar quinze minutos, e nada além disso." },
    ],
  },
  {
    slug: "precificar-pelo-problema",
    titulo: "Precificar pelo tamanho do problema, não pelas horas",
    tldr: "O orçamento que separa esforço, mínimo aceitável e valor percebido — e para de cobrar por hora de máquina.",
    categoria: "Orçar e vender",
    investimentoReais: 0,
    tempoConclusaoHoras: 2,
    dificuldade: "media",
    fontes: [
      LIVRO(5, "Precificar sem chutar: o valor do problema, não do tempo"),
      LIVRO(11, "Orçamento: esforço, mínimo e valor percebido"),
    ],
    tutorial: [
      { passo: 1, titulo: "Calcule o esforço real", detalhe: "Horas suas, não horas do modelo. Inclua a revisão, que é onde o trabalho de verdade acontece." },
      { passo: 2, titulo: "Defina o mínimo que aceita", detalhe: "Abaixo disso você recusa. Ter o número escrito antes da conversa é o que evita o desconto dado no susto." },
      { passo: 3, titulo: "Estime o custo do problema para o cliente", detalhe: "Quanto custa a ele continuar sem resolver? O preço vive entre o seu mínimo e esse número." },
    ],
  },
  {
    slug: "rascunho-com-modelo-valor-na-edicao",
    titulo: "Rascunho com o modelo, valor na edição",
    tldr: "Usar o modelo como primeiro rascunho e cobrar pela edição — que é a parte que o cliente não consegue fazer sozinho.",
    categoria: "Entregar",
    investimentoReais: 0,
    tempoConclusaoHoras: 1,
    dificuldade: "baixa",
    fontes: [LIVRO(17, "ChatGPT como primeiro rascunho: o valor está na edição")],
    tutorial: [
      { passo: 1, titulo: "Peça o rascunho com o contexto do cliente", detalhe: "Sem contexto real o texto sai genérico — e é exatamente isso que o cliente percebe e recusa." },
      { passo: 2, titulo: "Corte metade", detalhe: "A primeira edição é subtração. O que sobra é o que tem informação." },
      { passo: 3, titulo: "Reescreva a abertura à mão", detalhe: "A abertura é o que denuncia texto de máquina. É a única parte que não vale delegar." },
    ],
  },
  {
    slug: "revisao-critica-com-segundo-modelo",
    titulo: "Revisão crítica da entrega com um segundo modelo",
    tldr: "Passar a entrega por um modelo diferente pedindo crítica, não elogio — acha o que o autor já não enxerga.",
    categoria: "Entregar",
    investimentoReais: 0,
    tempoConclusaoHoras: 1,
    dificuldade: "baixa",
    fontes: [LIVRO(18, "Claude como revisor: a crítica que melhora a entrega")],
    tutorial: [
      { passo: 1, titulo: "Peça crítica, não revisão", detalhe: "Perguntar o que está fraco e por quê rende mais do que pedir para revisar." },
      { passo: 2, titulo: "Exija o motivo de cada apontamento", detalhe: "Apontamento sem motivo é opinião, e opinião de modelo não melhora entrega." },
      { passo: 3, titulo: "Aplique você, não ele", detalhe: "Deixar o modelo reescrever devolve o texto ao genérico que você acabou de tirar." },
    ],
  },
  {
    slug: "pesquisa-com-fonte-checavel",
    titulo: "Pesquisa entregue com fonte checável",
    tldr: "Usar o modelo como pesquisador e entregar a fonte ao lado de cada afirmação — o que transforma resumo em documento aceitável.",
    categoria: "Entregar",
    investimentoReais: 0,
    tempoConclusaoHoras: 2,
    dificuldade: "media",
    fontes: [LIVRO(19, "Gemini como pesquisador: fonte e checagem")],
    tutorial: [
      { passo: 1, titulo: "Peça afirmação e fonte na mesma linha", detalhe: "Separadas, checar depois custa mais do que pesquisar do zero." },
      { passo: 2, titulo: "Abra as fontes", detalhe: "Toda fonte que você não abriu é uma fonte que pode não existir. Este é o passo que a maioria pula." },
      { passo: 3, titulo: "Marque o que não confirmou", detalhe: "Entregar com um não confirmado escrito vale mais do que entregar com confiança falsa." },
    ],
  },
  {
    slug: "acabamento-visual-da-entrega",
    titulo: "Acabamento visual que faz o cliente perceber valor",
    tldr: "O mesmo conteúdo entregue com apresentação profissional muda o que o cliente aceita pagar — e leva minutos.",
    categoria: "Entregar",
    investimentoReais: 0,
    tempoConclusaoHoras: 1,
    dificuldade: "baixa",
    fontes: [LIVRO(20, "Canva: o acabamento visual que faz o cliente perceber valor")],
    tutorial: [
      { passo: 1, titulo: "Escolha um modelo e não mude mais", detalhe: "Um formato repetido vira sua assinatura. Trocar a cada entrega gasta tempo e não constrói nada." },
      { passo: 2, titulo: "Capa com o nome do cliente", detalhe: "É o detalhe mais barato que separa uma entrega de um arquivo solto." },
      { passo: 3, titulo: "Exporte em PDF, sempre", detalhe: "O arquivo editável convida o cliente a mexer e some com a sua versão." },
    ],
  },
  {
    slug: "combinado-simples-por-escrito",
    titulo: "O combinado por escrito que protege os dois lados",
    tldr: "Documento curto com escopo, prazo, número de revisões e forma de pagamento — o que impede o trabalho de virar poço sem fundo.",
    categoria: "Orçar e vender",
    investimentoReais: 0,
    tempoConclusaoHoras: 1,
    dificuldade: "baixa",
    fontes: [
      LIVRO(14, "O contrato simples que protege os dois"),
      LIVRO(15, "Depósito e pagamento antecipado: o filtro do cliente sério"),
    ],
    tutorial: [
      { passo: 1, titulo: "Escreva o escopo pelo que NÃO inclui", detalhe: "O que está fora é o que gera conflito. Listar isso é mais útil do que listar o que está dentro." },
      { passo: 2, titulo: "Fixe o número de revisões", detalhe: "Sem teto, revisão é infinita — e é onde o lucro da entrega desaparece." },
      { passo: 3, titulo: "Peça parte antes de começar", detalhe: "O depósito não é sobre o dinheiro: é o filtro que separa cliente sério de curioso." },
    ],
  },
  {
    slug: "cobrar-como-parte-do-servico",
    titulo: "Cobrar sem constrangimento, como parte do serviço",
    tldr: "Transformar a cobrança em etapa combinada desde o início, em vez de conversa difícil no fim.",
    categoria: "Cobrar",
    investimentoReais: 0,
    tempoConclusaoHoras: 1,
    dificuldade: "media",
    fontes: [LIVRO(21, "Cobrar sem constrangimento: parte do serviço")],
    tutorial: [
      { passo: 1, titulo: "Combine a data da cobrança junto do escopo", detalhe: "Cobrança combinada no começo não é cobrança: é cronograma." },
      { passo: 2, titulo: "Mande o lembrete antes do vencimento", detalhe: "Depois do vencimento a conversa muda de tom sozinha." },
      { passo: 3, titulo: "Não entregue o arquivo final antes de fechar", detalhe: "A entrega é a única alavanca que você tem, e ela só funciona uma vez." },
    ],
  },
  {
    slug: "projeto-vira-contrato-mensal",
    titulo: "Transformar projeto avulso em contrato mensal",
    tldr: "A conversa que converte uma entrega pontual em recorrência — o que muda receita imprevisível em previsível.",
    categoria: "Escalar",
    investimentoReais: 0,
    tempoConclusaoHoras: 2,
    dificuldade: "media",
    fontes: [
      LIVRO(23, "Recorrência: transformar projeto em contrato mensal"),
      LIVRO(29, "Pacotes: aumentar o ticket sem aumentar o esforço"),
    ],
    tutorial: [
      { passo: 1, titulo: "Ofereça na entrega, não depois", detalhe: "O momento em que o cliente está mais satisfeito é o momento em que a entrega termina." },
      { passo: 2, titulo: "Proponha um volume menor por mês", detalhe: "Recorrência não é o mesmo trabalho todo mês: é a fatia que cabe no orçamento dele sem negociação nova." },
      { passo: 3, titulo: "Fixe o dia da entrega mensal", detalhe: "Data fixa é o que faz o contrato sobreviver ao terceiro mês." },
    ],
  },
  {
    slug: "automatizar-so-o-repetitivo",
    titulo: "Automatizar só a parte repetitiva",
    tldr: "Tirar de você o trabalho que se repete igual toda vez, sem automatizar a parte pela qual o cliente paga.",
    categoria: "Escalar",
    investimentoReais: 0,
    tempoConclusaoHoras: 6,
    dificuldade: "alta",
    fontes: [LIVRO(24, "n8n: automatizar o que é repetitivo sem substituir seu valor")],
    tutorial: [
      { passo: 1, titulo: "Liste o que você faz igual toda vez", detalhe: "Só entra na automação o que não muda entre clientes. O resto é o seu valor." },
      { passo: 2, titulo: "Automatize um passo só", detalhe: "Fluxo grande quebra em silêncio, e você descobre pelo cliente." },
      { passo: 3, titulo: "Mantenha a revisão humana no fim", detalhe: "Automação que entrega direto ao cliente é a forma mais rápida de perder o cliente." },
    ],
  },
  {
    slug: "funil-de-captacao-em-planilha",
    titulo: "Funil de captação numa planilha que você controla",
    tldr: "Uma lista com estágio e data do próximo toque — o que impede a captação de esfriar entre um projeto e outro.",
    categoria: "Achar cliente",
    investimentoReais: 0,
    tempoConclusaoHoras: 2,
    dificuldade: "baixa",
    fontes: [
      LIVRO(26, "Sistema de captação: a lista que nunca esfria"),
      LIVRO(27, "Google Planilhas: o funil de vendas que você controla"),
    ],
    tutorial: [
      { passo: 1, titulo: "Uma linha por pessoa, não por projeto", detalhe: "Pessoa dura anos; projeto acaba. O funil precisa sobreviver ao projeto." },
      { passo: 2, titulo: "Coluna de próximo toque com data", detalhe: "Sem data, o retorno depende de memória — e memória perde para o trabalho do dia." },
      { passo: 3, titulo: "Revise a planilha toda sexta", detalhe: "Vinte minutos por semana é o que mantém a lista viva. Menos que isso, ela morre em um mês." },
    ],
  },
];
