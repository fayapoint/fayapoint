/**
 * A FÁBRICA AUTÔNOMA — a fonte única dos números da página de venda.
 *
 * ⛔ **Nenhum número desta oferta é digitado no JSX.** Preço, contagem de
 * blueprints, de armadilhas e de linhas saem daqui. É a mesma regra da página
 * dos Fundadores, e ela existe porque esta casa manteve no ar "5.000
 * profissionais" e "30% de comissão" sem motor nenhum atrás — número em página
 * de venda que não sai da fonte é o começo disso.
 *
 * As contagens abaixo foram MEDIDAS no kit em 09/09/2026, com o comando ao
 * lado. Quando o kit crescer, rode de novo e atualize aqui — e a página inteira
 * atualiza junto.
 */

export const MEDIDO_EM = "2026-09-09";

/**
 * O que existe dentro do kit, contado. Cada linha tem o comando que a produz,
 * porque um número sem procedência é um número inventado com sorte.
 */
export const INVENTARIO = {
  /** `ls fabrica-autonoma/blueprints/[0-9]*.md | wc -l` */
  blueprints: 21,
  /** `ls fabrica-autonoma/memoria/*.md | wc -l` menos o índice */
  armadilhas: 47,
  /** arquivos de motor adaptados, fora de `_fonte/` */
  arquivosDeMotor: 161,
  /** linhas de código nos motores adaptados */
  linhasDeCodigo: 27820,
  /** pedidos reais registrados e avaliados ao longo da construção */
  promptsRegistrados: 464,
  /** os que foram distribuídos por tema dentro do kit */
  promptsNoKit: 363,
  /** portões executáveis em `portoes/` (`_comum.mjs` é biblioteca, não conta) */
  portoes: 11,
  /** perguntas da entrevista, em 12 grupos */
  perguntas: 12,
  /** meses de construção medida que viraram este material */
  mesesDeConstrucao: 5,
} as const;

export type Faixa = {
  id: "pasta" | "instalacao" | "fabrica";
  nome: string;
  preco: number;
  /** O que a pessoa é, em uma linha, quando escolhe esta faixa. */
  para: string;
  /** A frase que resume a diferença — não é slogan, é o corte. */
  corte: string;
  inclui: string[];
  /** O que esta faixa NÃO tem. Escrito, sempre. */
  naoTem: string[];
  /** Vagas por mês, quando a faixa consome tempo humano. `null` = sem limite. */
  vagasPorMes: number | null;
  destaque?: boolean;
};

/**
 * As três faixas.
 *
 * A escada é de ACESSO, não de qualidade: o material é o mesmo nas três. O que
 * muda é quanto do caminho você faz sozinho. Quem compra a primeira recebe o
 * mesmo kit que quem compra a terceira — e isso está escrito na página, porque
 * a alternativa (segurar conteúdo para justificar preço) é a prática que faz
 * ninguém acreditar em escada de preço nenhuma.
 */
export const FAIXAS: Faixa[] = [
  {
    id: "pasta",
    nome: "A Pasta",
    preco: 10000,
    para: "Você já dirige um agente e quer o mapa inteiro, agora.",
    corte: "O kit completo. Você roda, você constrói.",
    inclui: [
      `Os ${INVENTARIO.blueprints} blueprints, na ordem de dependência, cada um com portão medido`,
      `As ${INVENTARIO.armadilhas} armadilhas — cada erro já pago, com sintoma, causa e vacina`,
      `Os ${INVENTARIO.arquivosDeMotor} arquivos de motor já adaptados, lendo a sua entrevista`,
      `${INVENTARIO.promptsNoKit} pedidos reais, separados por tema, com "o que não copiar"`,
      "As cartilhas de locução, peça curta, peça longa, voz e marca",
      "Os portões executáveis: se não passa, não vai ao ar",
      "Atualizações do kit por 12 meses",
    ],
    naoTem: [
      "Ninguém constrói com você",
      "Sem revisão da sua voz nem das suas pautas",
      "Sem acompanhamento depois da compra",
    ],
    vagasPorMes: null,
  },
  {
    id: "instalacao",
    nome: "A Instalação",
    preco: 30000,
    para: "Você quer a operação de pé, e não quer descobrir sozinho onde trava.",
    corte: "O kit, mais a fábrica instalada com você.",
    inclui: [
      "Tudo da Pasta",
      "A entrevista conduzida: a sua voz e as suas pautas revisadas com você",
      "As contas ligadas: publicação, imagem, voz, banco",
      "O primeiro mês de peças acompanhado, com os portões rodando",
      "A sua voz clonada e medida, com a faixa de timbre travada",
      "Oito semanas de acompanhamento, por escrito",
    ],
    naoTem: [
      "Sem as esteiras longas (livro, audiobook, aula em vídeo, o filme)",
      "Sem o segundo agente",
    ],
    vagasPorMes: 4,
  },
  {
    id: "fabrica",
    nome: "A Fábrica Inteira",
    preco: 50000,
    para: "Você tem acervo e quer que ele vire livro, áudio, aula e filme sozinho.",
    corte: "Tudo. É esta a operação que escreveu o kit.",
    inclui: [
      "Tudo da Instalação",
      "As esteiras longas: texto → livro → audiobook com lente → aula em vídeo → YouTube",
      "A peça longa: roteiro, decupagem plano a plano, e os 7 portões de corte",
      "O segundo agente e o fórum com trava por arquivo",
      "O banco vivo, o painel da máquina e o Mission Control local",
      "A memória que não repete erro: a sua, escrita pelo agente, a cada defeito",
      "Seis meses de acompanhamento",
    ],
    naoTem: [
      "Não vendemos o resultado. Vendemos a operação — o que isto não promete está escrito acima.",
    ],
    vagasPorMes: 2,
    destaque: true,
  },
];

/**
 * O que esta oferta NÃO promete.
 *
 * Isto não é letra miúda: é a primeira coisa que a pessoa certa quer ler, e o
 * filtro que tira da fila quem pediria reembolso. Pelo Código de Defesa do
 * Consumidor a oferta vincula — o que está escrito aqui é o que pode ser
 * cobrado, e por isso o que não pode ser garantido está escrito também.
 */
export const NAO_PROMETE = [
  "Não prometemos venda, faturamento nem retorno. Nada aqui é promessa de renda.",
  "Não prometemos audiência. A fábrica publica todo dia; quem decide se aquilo interessa é quem lê.",
  "Não prometemos que você não vai precisar aprender. Você vai dirigir um agente, e dirigir se aprende dirigindo.",
  "Não prometemos zero trabalho. A entrevista é sua, a aprovação é sua, e a voz é sua.",
];

/** O custo mensal de OPERAR, que é de quem compra e não vai para nós. */
export const CUSTO_DE_OPERACAO = {
  assinaturaAgenteUSD: [100, 200] as const,
  observacao:
    "A assinatura do agente é sua e vai direto para quem a fornece. Imagem e voz rodam na sua placa, de graça; sem placa, existe o caminho por API, em centavos por peça. O banco é grátis.",
};

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
