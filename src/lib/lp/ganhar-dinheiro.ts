/**
 * A FONTE ÚNICA DE NÚMEROS da landing do ebook "Ganhar dinheiro com IA".
 *
 * ## Por que este arquivo existe
 *
 * Nenhum número da página de venda é digitado no JSX. É o mesmo padrão da
 * `/fabrica`, e ele existe por dano medido: esta casa já manteve no ar "5.000
 * profissionais" sem motor nenhum atrás, uma vitrine que somava 1.547 aulas
 * para 778 capítulos reais, e uma seção de guias que anunciava 12.500
 * downloads de material que não existia. Número em página de venda que não vem
 * de uma fonte é o primeiro passo para lá.
 *
 * ## ⛔ SÃO 30 CAPÍTULOS. Nunca 31.
 *
 * Medido no arquivo, não estimado: `Capítulo 1:` a `Capítulo 30:` em
 * `produtos/ebook/_corpo.html`, e 120 páginas (`/Type /Page` exato, sem casar
 * com `/Type /Pages`) no PDF.
 *
 * O 31º `<h1 class="cap">` do corpo é o **título do livro**, não um capítulo.
 * Quem contou `<h1>` contou o livro junto, e o número inflado já tinha ido
 * para a descrição na Hotmart, a capa, o kit do afiliado, os dois Reels, o
 * painel e a capa do próprio PDF antes de alguém abrir o arquivo (corrigido em
 * 10/09/2026, commit `bc5cf0e`).
 *
 * ⚠️ **O banco ainda guarda o número errado.** `products.ganhar-dinheiro-com-ia`
 * tem `contentChapters: 31` e `metrics.lessons: 31`, e a soma das aulas dos 6
 * módulos do `curriculum` também dá 31. **Não leia dali para esta página.**
 *
 * ## ⛔ E não se promete valor, prazo ou renda
 *
 * A frase "do primeiro R$500 ao mês previsível" saiu da capa do PDF em
 * 10/09/2026 exatamente por prometer valor na mesma peça que dizia não
 * prometer. Ela continua viva em `copy.shortDescription` no banco — mais um
 * motivo para esta página não puxar texto de lá. Pelo Código de Defesa do
 * Consumidor a oferta vincula: o que a página promete, o produto deve.
 *
 * O que se pode dizer é o que o livro FAZ (ensina a escolher, orçar, entregar,
 * cobrar), nunca o que o leitor vai GANHAR.
 */

import { HOTMART_CHECKOUT, PRECO_EBOOK } from "@/lib/pasta-viva/config";

export { HOTMART_CHECKOUT, PRECO_EBOOK };

/** Medido no PDF em 10/09/2026: `/Type /Page` exato = 120. */
export const PAGINAS = 120;

/** Medido em `produtos/ebook/_corpo.html`: `Capítulo 1:` … `Capítulo 30:`. */
export const CAPITULOS = 30;

/** Garantia legal do produto na Hotmart. */
export const DIAS_GARANTIA = 7;

export const MEDIDO_EM = "10/09/2026";

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

/**
 * As 6 partes, em faixas SEQUENCIAIS de capítulo — 2+7+6+5+5+5 = 30.
 *
 * Sequencial de propósito: o leitor abre o PDF e encontra exatamente esta
 * ordem. Agrupar por tema soaria melhor na página e mentiria sobre o arquivo.
 */
export const PARTES = [
  {
    n: 1,
    titulo: "O terreno",
    faixa: [1, 2] as const,
    resumo:
      "Onde a IA ajuda e onde ela inventa com confiança — e por que a maior parte do que se vende como “ganhar dinheiro com IA” não tem comprador.",
  },
  {
    n: 2,
    titulo: "Escolher o serviço e o cliente",
    faixa: [3, 9] as const,
    resumo:
      "Que serviço prestar, para quem, como validar a ideia numa conversa e montar um portfólio antes de ter cliente.",
  },
  {
    n: 3,
    titulo: "Orçar e vender",
    faixa: [10, 15] as const,
    resumo:
      "Abordar sem parecer spam, estimar esforço, conduzir a conversa por diagnóstico e fechar com contrato e pagamento antecipado.",
  },
  {
    n: 4,
    titulo: "Entregar com padrão",
    faixa: [16, 20] as const,
    resumo:
      "O processo do briefing ao arquivo final, com ChatGPT no rascunho, Claude na revisão, Gemini na checagem e Canva no acabamento.",
  },
  {
    n: 5,
    titulo: "Cobrar e repetir",
    faixa: [21, 25] as const,
    resumo:
      "Cobrança sem constrangimento, reajuste depois do primeiro cliente, contrato mensal, e o que automatizar com n8n sem perder o que você cobra.",
  },
  {
    n: 6,
    titulo: "Captação constante e ticket maior",
    faixa: [26, 30] as const,
    resumo:
      "A lista que não esfria, o funil numa planilha que você controla, pacotes, produto digital e o ciclo completo do primeiro contato ao reajuste.",
  },
] as const;

/**
 * Os 30 títulos, copiados de `produtos/ebook/_corpo.html`.
 *
 * Ficam aqui porque a página mostra o sumário de verdade: sumário genérico
 * (“você vai aprender a vender mais”) é o que todo infoproduto tem, e é
 * exatamente por isso que ninguém acredita nele. O índice real é a prova mais
 * barata de que o material existe — e cada linha é conferível abrindo o PDF.
 */
export const TITULOS: readonly string[] = [
  "O erro de quem trata o ChatGPT como um funcionário que entrega pronto",
  "Por que a maioria das “formas de ganhar dinheiro com IA” não paga",
  "Como escolher o serviço que você vai prestar (e cobrar por ele)",
  "O primeiro cliente está na sua lista de contatos, não na internet",
  "Precificar sem chutar: o valor do problema, não do tempo",
  "Nicho: atender todo mundo é não atender ninguém",
  "Validar a ideia: a conversa que vale R$0 e evita meses de erro",
  "Montar a oferta: o que exatamente você vai entregar",
  "Portfólio que vende sem você estar presente",
  "A abordagem que não parece spam: a mensagem que fala do problema",
  "Orçamento: esforço, mínimo e valor percebido",
  "A conversa de venda: diagnóstico antes do pitch",
  "Quando o cliente pergunta “quanto custa?”",
  "O contrato simples que protege os dois",
  "Depósito e pagamento antecipado: o filtro do cliente sério",
  "O processo de entrega: do briefing ao arquivo final",
  "ChatGPT como primeiro rascunho: o valor está na edição",
  "Claude como revisor: a crítica que melhora a entrega",
  "Gemini como pesquisador: fonte e checagem",
  "Canva: o acabamento visual que faz o cliente perceber valor",
  "Cobrar sem constrangimento: parte do serviço",
  "Reajuste: o preço justo depois do primeiro cliente",
  "Recorrência: transformar projeto em contrato mensal",
  "n8n: automatizar o que é repetitivo sem substituir seu valor",
  "Feedback e reclamação: a informação grátis que melhora o serviço",
  "Sistema de captação: a lista que nunca esfria",
  "Google Planilhas: o funil de vendas que você controla",
  "Produto digital complementar: renda desacoplada do tempo",
  "Pacotes: aumentar o ticket sem aumentar o esforço",
  "O ciclo completo: do primeiro contato ao reajuste",
];

/** As ferramentas nomeadas no livro, com o papel que cada uma tem. */
export const FERRAMENTAS = [
  { nome: "ChatGPT", papel: "primeiro rascunho" },
  { nome: "Claude", papel: "revisão e crítica" },
  { nome: "Gemini", papel: "pesquisa e checagem" },
  { nome: "Canva", papel: "acabamento visual" },
  { nome: "n8n", papel: "automatizar o repetitivo" },
  { nome: "Notion", papel: "organizar o cliente" },
  { nome: "WhatsApp Business", papel: "o canal onde o cliente já está" },
  { nome: "Google Planilhas", papel: "o funil que você controla" },
] as const;

/** Para quem o livro é — vem de `targetAudience` do produto. */
export const PARA_QUEM = [
  "Quem já mexeu com ChatGPT e quer transformar isso em trabalho pago",
  "Freelancer que quer subir o preço usando IA no processo",
  "Assalariado que quer atender um cliente no fim de semana",
  "Quem foi demitido e tem alguns meses de fôlego",
] as const;

/**
 * O que o livro NÃO é. Fica ANTES do preço na página, e é argumento, não
 * ressalva: quem vende método e não resultado tem de dizer isso onde o leitor
 * ainda está decidindo. A promessa que precisa de letra miúda é a errada.
 */
/**
 * As perguntas que chegam antes da compra.
 *
 * Vieram da página irmã `/pt-BR/ganhar-dinheiro-com-ia`, que já as tinha
 * escritas — inclusive a mais importante delas, "quanto dá para ganhar?", com
 * a única resposta honesta possível. Copiar daqui é melhor que reescrever:
 * duas páginas do mesmo produto respondendo diferente à mesma pergunta é como
 * se perde a confiança que o resto da página constrói.
 */
export const FAQ: ReadonlyArray<{ p: string; r: string }> = [
  {
    p: "Serve para quem nunca vendeu nada?",
    r: "Serve — o material começa pelo primeiro serviço, não pelo décimo. O primeiro método do acervo custa R$ 0 e leva duas horas.",
  },
  {
    p: "É vídeo ou curso com aula ao vivo?",
    r: `Não. É PDF: ${PAGINAS} páginas, ${CAPITULOS} capítulos, para ler no seu ritmo. Sem live, sem grupo, sem prazo.`,
  },
  {
    p: "Quanto dá para ganhar?",
    r: "Ninguém pode responder isso, e quem responde está inventando. O que o material faz é tirar você do “não sei o que oferecer” e te dar um preço defensável.",
  },
  {
    p: "A Pasta Viva custa à parte?",
    r: "Não. Ela vem com o ebook.",
  },
  {
    p: "Como recebo o acesso à Pasta Viva?",
    r: "O código está na primeira página do PDF. Você resgata uma vez em fayai.com.br/pt-BR/pasta-viva/entrar e o acesso fica permanente na sua conta.",
  },
];

export const NAO_PROMETE = [
  "Não promete valor, prazo nem renda. Nenhum número de resultado aparece aqui porque nenhum foi medido.",
  "Não é renda passiva: é prestar serviço, com cliente do outro lado e prazo para entregar.",
  "Não ensina a gerar conteúdo em massa para vender — o capítulo 2 explica por que isso não tem comprador.",
  "Não vem com aula em vídeo. É um PDF de leitura, mais o acervo que se renova no site.",
] as const;
