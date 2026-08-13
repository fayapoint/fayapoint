import {
  CREDIT_COSTS,
  PACOTES_CURSO,
  diferencaDePacote,
  type IdPacote,
  type CreditAction,
} from '@/lib/course-tiers';

/**
 * O Ateliê — o orçamento antes do compromisso (03/08/2026).
 *
 * ## O problema de produto que este arquivo resolve
 *
 * Ricardo: *"daremos a ele uma previsão de quanto vai custar o curso dele e ele
 * utiliza seus créditos, fechando o ciclo da necessidade de ter o tier maior
 * para ter mais créditos e eles serem realmente úteis. E ao mesmo tempo,
 * conseguimos exemplificar o conteúdo personalizado a todos, sem gastar um
 * centavo para isso."*
 *
 * São duas exigências que puxam para lados opostos e as duas têm razão:
 * mostrar valor de graça, e cobrar pelo trabalho. O desenho que atende às duas
 * é a **amostra grátis de um capítulo** (uma chamada de modelo, cacheada por
 * aluno e curso) seguida de um **orçamento explícito** do resto. Ninguém gasta
 * crédito para descobrir se vale, e ninguém recebe trinta capítulos de graça.
 *
 * ## Por que o orçamento mora numa função pura
 *
 * Ele aparece em três lugares — a página do Ateliê, a confirmação antes de
 * gerar, e a validação no servidor. Se cada um fizesse a própria conta, mais
 * cedo ou mais tarde a tela prometeria um preço e o servidor cobraria outro.
 * Aqui não há banco nem rede: entra o número de capítulos, sai o orçamento.
 */

/**
 * ⚠️ **Deixou de ser um menu e virou uma ESCADA** (11/08/2026).
 *
 * Eram quatro caixas de seleção independentes (`texto`, `imagens`, `rosto`,
 * `narracao`), cada uma com a própria conta por capítulo. Ricardo mandou o
 * preço passar a ser por CURSO, com degraus até o completo — e degrau não é
 * caixa de seleção: escolher "narração sem texto" nunca fez sentido, e o menu
 * permitia. Agora são quatro opções mutuamente exclusivas, cada uma contendo a
 * anterior. Ver `PACOTES_CURSO` em `lib/course-tiers.ts`.
 */
export type IdOpcao = IdPacote;

// ─────────────────────────────────────────────────────────────────────
// Os ajustes — a personalização que a persona sozinha não decide
// ─────────────────────────────────────────────────────────────────────

/**
 * Ricardo, 10/08: *"ele não permite customização compreensiva"*. Ele tinha
 * razão, e o diagnóstico é preciso: o Ateliê tinha três caixas de seleção
 * ("texto", "imagens", "rosto") que decidiam O QUE gerar, e **nada** que
 * decidisse COMO. Todo o "como" vinha da persona — que descreve quem a pessoa
 * é, não como ela quer ESTE curso.
 *
 * São coisas diferentes e a diferença aparece na primeira leitura: a mesma
 * pessoa quer o curso de tributação denso e o de Instagram direto ao ponto. A
 * persona não tem como saber disso; ela nem deveria.
 *
 * ⚠️ **Cada ajuste vira frase no prompt** (`instrucoesDeAjuste`). Controle que
 * não muda a saída é enfeite, e enfeite que promete controle é pior do que não
 * ter controle nenhum.
 */
export interface Ajustes {
  tom: string;
  profundidade: string;
  extensao: string;
  /** Até 3 — acima disso o prompt perde foco e todos os pesos se anulam. */
  foco: string[];
  narrador: string;
}

export interface OpcaoAjuste {
  id: string;
  rotulo: string;
  descricao: string;
  emoji: string;
  /** O que ESTA escolha manda o modelo fazer. É o que entra no prompt. */
  instrucao: string;
}

export const TONS_AJUSTE: OpcaoAjuste[] = [
  { id: 'espelho', rotulo: 'Do meu jeito', emoji: '🪞', descricao: 'Usa o tom que está na sua persona', instrucao: 'Use exatamente o tom de voz descrito no perfil do aluno.' },
  { id: 'direto', rotulo: 'Direto ao ponto', emoji: '🎯', descricao: 'Sem rodeio, frase curta', instrucao: 'Seja direto: frases curtas, zero rodeio, nenhuma introdução cerimoniosa.' },
  { id: 'professor', rotulo: 'Professor paciente', emoji: '🧑‍🏫', descricao: 'Explica cada termo na primeira vez', instrucao: 'Explique cada termo técnico na primeira vez que aparecer, com calma e sem pressupor conhecimento.' },
  { id: 'parceiro', rotulo: 'Conversa de parceiro', emoji: '🤝', descricao: 'Como um colega que já passou por isso', instrucao: 'Escreva como um colega mais experiente conversando de igual para igual, admitindo dificuldades reais.' },
  { id: 'provocador', rotulo: 'Provocador', emoji: '🔥', descricao: 'Confronta a acomodação', instrucao: 'Confronte a acomodação do aluno: aponte o custo de não agir, sem ofender.' },
  { id: 'analitico', rotulo: 'Analítico', emoji: '📊', descricao: 'Números e critério antes da opinião', instrucao: 'Priorize números, critérios de decisão e comparações antes de qualquer opinião.' },
];

export const PROFUNDIDADES: OpcaoAjuste[] = [
  { id: 'pratico', rotulo: 'Mão na massa', emoji: '🛠️', descricao: 'O que fazer, na ordem', instrucao: 'Foque no passo a passo executável; teoria só quando muda a execução.' },
  { id: 'equilibrado', rotulo: 'Equilibrado', emoji: '⚖️', descricao: 'Porquê curto, prática longa', instrucao: 'Dê o porquê em uma frase e gaste o resto na prática.' },
  { id: 'fundo', rotulo: 'Vai fundo', emoji: '🔬', descricao: 'Entender antes de aplicar', instrucao: 'Aprofunde o mecanismo por trás do que está sendo ensinado antes de aplicar.' },
];

export const EXTENSOES: OpcaoAjuste[] = [
  /**
   * ⚠️ A ESCADA INTEIRA SUBIU UM DEGRAU EM 12/08/2026 — e é aqui que o tamanho
   * do livro se decide, não no prompt do sistema.
   *
   * O padrão da casa era "abertura de até 2 frases, exemplo de até 5, tarefa de
   * 1 frase": dez frases por capítulo. Num curso de 16, tudo que o aluno paga
   * para ter de si mesmo cabia em duas páginas. Ricardo, com o livro pronto na
   * frente: *"a versão que eu vi parecia muito pequena"*.
   *
   * O que era "detalhada" virou o padrão, e cada degrau ganhou o que faltava
   * para o texto ser material de trabalho: número no exemplo, antes/depois, e
   * tarefa em passos — um parágrafo bonito sobre o ramo dele não se usa na
   * segunda-feira.
   *
   * ⚠️ **Não repita estes números no prompt do sistema.** Eles entram como
   * "ajustes deste aluno" e vencem o que vier antes; ter o tamanho em dois
   * lugares é a receita para a tela prometer um tamanho e o texto sair outro.
   */
  { id: 'curta', rotulo: 'Enxuta', emoji: '⚡', descricao: 'O essencial, para ler no intervalo', instrucao: 'Camada curta: abertura de 2 frases, exemplo de até 5 frases com pelo menos um número concreto, tarefa em 2 passos numerados.' },
  { id: 'media', rotulo: 'Na medida', emoji: '📄', descricao: 'O padrão da casa', instrucao: 'Camada padrão: abertura de 3 a 4 frases; exemplo de 8 a 10 frases, com um caso concreto do ramo dele, números plausíveis declarados como exemplo e o antes/depois; tarefa em 3 passos numerados (use "1)", "2)", "3)" com quebra de linha entre eles).' },
  { id: 'longa', rotulo: 'Detalhada', emoji: '📚', descricao: 'Com mais contexto e mais exemplo', instrucao: 'Camada detalhada: abertura de 4 a 5 frases; exemplo de 12 a 16 frases com o caso desenvolvido do começo ao fim, números plausíveis declarados como exemplo, o antes/depois e o erro mais comum; tarefa em 4 a 6 passos numerados (use "1)", "2)", "3)" com quebra de linha), terminando por como ele sabe que deu certo.' },
];

export const FOCOS: OpcaoAjuste[] = [
  { id: 'vender', rotulo: 'Vender mais', emoji: '💰', descricao: 'Puxa tudo para receita', instrucao: 'Puxe cada exemplo para o efeito em vendas e receita do aluno.' },
  { id: 'tempo', rotulo: 'Ganhar tempo', emoji: '⏱️', descricao: 'Tudo medido em horas devolvidas', instrucao: 'Meça cada ganho em horas devolvidas ao aluno por semana.' },
  { id: 'conteudo', rotulo: 'Produzir conteúdo', emoji: '🎬', descricao: 'Aplicado à produção dele', instrucao: 'Aplique o capítulo à produção de conteúdo do aluno.' },
  { id: 'atendimento', rotulo: 'Atender melhor', emoji: '💬', descricao: 'Aplicado ao atendimento', instrucao: 'Aplique o capítulo ao atendimento e ao pós-venda do aluno.' },
  { id: 'equipe', rotulo: 'Organizar a equipe', emoji: '👥', descricao: 'Processo e delegação', instrucao: 'Traduza o capítulo em processo que a equipe do aluno consiga seguir.' },
  { id: 'custo', rotulo: 'Cortar custo', emoji: '✂️', descricao: 'Onde para de sangrar', instrucao: 'Mostre onde o capítulo corta custo ou desperdício no negócio do aluno.' },
];

export const AJUSTES_PADRAO: Ajustes = {
  tom: 'espelho',
  profundidade: 'equilibrado',
  extensao: 'media',
  foco: [],
  narrador: 'fernando_borges',
};

/** Um ajuste desconhecido (veio de uma versão antiga da tela) cai no padrão. */
export function acharOpcao(lista: OpcaoAjuste[], id: string, padrao: string): OpcaoAjuste {
  return lista.find((o) => o.id === id) || lista.find((o) => o.id === padrao)!;
}

export function normalizarAjustes(bruto: Partial<Ajustes> | null | undefined): Ajustes {
  const a = bruto || {};
  return {
    tom: acharOpcao(TONS_AJUSTE, String(a.tom || ''), AJUSTES_PADRAO.tom).id,
    profundidade: acharOpcao(PROFUNDIDADES, String(a.profundidade || ''), AJUSTES_PADRAO.profundidade).id,
    extensao: acharOpcao(EXTENSOES, String(a.extensao || ''), AJUSTES_PADRAO.extensao).id,
    foco: (Array.isArray(a.foco) ? a.foco : []).filter((f) => FOCOS.some((o) => o.id === f)).slice(0, 3),
    narrador: String(a.narrador || AJUSTES_PADRAO.narrador),
  };
}

/**
 * As escolhas viradas em instrução — o pedaço que o modelo realmente lê.
 *
 * Fica ao lado do catálogo, e não no motor, porque é a MESMA lista que a tela
 * desenha: separar os dois é como o rótulo de um botão acaba prometendo uma
 * coisa e o prompt pedindo outra.
 */
export function instrucoesDeAjuste(a: Ajustes): string {
  const linhas = [
    acharOpcao(TONS_AJUSTE, a.tom, AJUSTES_PADRAO.tom).instrucao,
    acharOpcao(PROFUNDIDADES, a.profundidade, AJUSTES_PADRAO.profundidade).instrucao,
    acharOpcao(EXTENSOES, a.extensao, AJUSTES_PADRAO.extensao).instrucao,
    ...a.foco.map((f) => FOCOS.find((o) => o.id === f)?.instrucao).filter(Boolean),
  ];
  return linhas.map((l, i) => `${i + 1}. ${l}`).join('\n');
}

export interface ItemOrcamento {
  id: IdOpcao;
  titulo: string;
  descricao: string;
  /** O que este degrau acrescenta ao de baixo. */
  inclui: string[];
  emoji: string;
  imagem?: string;
  /** O que o aluno paga AGORA por este degrau — já descontado o que ele tem. */
  creditos: number;
  /** O preço de tabela, para a tela poder riscar quando há desconto por degrau. */
  precoCheio: number;
  /** Como o total foi formado — a tela mostra a conta, não só o resultado. */
  conta: string;
  /** Já pago: este degrau (ou um acima) é dele. */
  jaFeito: boolean;
  /** Ainda não existe pipeline — aparece anunciado, nunca cobrável. */
  emBreve?: boolean;
}

export interface Orcamento {
  capitulos: number;
  itens: ItemOrcamento[];
  /** O degrau que o aluno já comprou neste curso, se comprou. */
  pacotePago: IdPacote | null;
  /** O que a escolha atual custa agora. */
  total: number;
}

export interface EntradaOrcamento {
  capitulos: number;
  /** Capítulos que já têm camada válida — relatados, não descontados. */
  capitulosJaFeitos: number;
  temCadernoDePersonagem: boolean;
  /** O degrau escolhido na tela. Sempre um só — é uma escada. */
  escolhidas: IdOpcao[];
  /** O degrau que este aluno já pagou neste curso (`AtelieConfig.pacotePago`). */
  pacotePago?: IdPacote | null;
  /** Este curso já tem narração gravada na voz escolhida? Ver `data/narradores`. */
  narracaoPronta?: boolean;
  /** A tabela viva do Mission Control. Sem ela, o padrão de fábrica. */
  precos?: Record<string, number>;
}

/**
 * A escada de pacotes, precificada para ESTE aluno neste curso.
 *
 * ## ⚠️ O que mudou em 11/08/2026, e por quê
 *
 * Era um orçamento somado por capítulo: `faltam × 2`, `capítulos × 3`, e o
 * total dependia do tamanho do curso. Tinha uma virtude real — cobrava só o que
 * faltava — e um defeito maior: **o aluno não sabia o preço antes de escolher o
 * curso**. Cada curso custava um número diferente, e um preço que só aparece
 * depois da escolha não é uma tabela, é um orçamento.
 *
 * Agora o preço é do curso e é o mesmo para todos: 25 na entrada, 100 no
 * completo. A virtude antiga não se perdeu, mudou de forma — **pagou uma vez,
 * é seu**: gerar de novo depois de aprofundar o perfil não custa nada, e subir
 * de degrau paga só a diferença (`diferencaDePacote`).
 */
export function montarOrcamento(e: EntradaOrcamento): Orcamento {
  const precos = e.precos || (CREDIT_COSTS as unknown as Record<string, number>);
  const pago = e.pacotePago || null;
  const indicePago = pago ? PACOTES_CURSO.findIndex((p) => p.id === pago) : -1;
  const escolhido = (e.escolhidas[0] || 'escrito') as IdPacote;

  const itens: ItemOrcamento[] = PACOTES_CURSO.map((p, i) => {
    const cheio = precos[p.acao as CreditAction] ?? 0;
    const aPagar = diferencaDePacote(pago, p.id, precos);
    const jaFeito = i <= indicePago;
    // A narração só é "em breve" enquanto não houver áudio pronto para este
    // curso nesta voz. Com áudio pronto, o degrau é entregável.
    const emBreve = p.emBreve === true && !(p.id === 'narrado' && e.narracaoPronta === true);

    return {
      id: p.id,
      titulo: p.titulo,
      descricao: p.promessa,
      inclui: p.inclui,
      emoji: p.emoji,
      imagem: p.imagem,
      creditos: aPagar,
      precoCheio: cheio,
      conta: jaFeito
        ? 'Você já tem este pacote neste curso — nada a pagar'
        : indicePago >= 0
          ? `${cheio} créditos − ${cheio - aPagar} que você já pagou = ${aPagar}`
          : `${cheio} créditos pelo curso inteiro (${e.capitulos} capítulos), uma vez só`,
      jaFeito,
      emBreve,
    };
  });

  const alvo = itens.find((i) => i.id === escolhido);
  const total = alvo && !alvo.jaFeito && !alvo.emBreve ? alvo.creditos : 0;

  return { capitulos: e.capitulos, itens, pacotePago: pago, total };
}

/**
 * A confiança da persona traduzida no que o aluno vai SENTIR.
 *
 * O número sozinho ("34%") não diz a ninguém se vale apertar o botão. Estas
 * faixas existem porque a promessa precisa ser calibrada antes da compra: quem
 * gera com persona rasa recebe texto morno, culpa o produto e não volta.
 */
export type Calibre = 'insuficiente' | 'basico' | 'bom' | 'afiado';

export function calibrar(confianca: number, minima: number): {
  calibre: Calibre;
  titulo: string;
  frase: string;
} {
  if (confianca < minima) {
    return {
      calibre: 'insuficiente',
      titulo: 'Ainda não dá para escrever sobre você',
      frase:
        'Sei pouco do seu contexto para escrever sem inventar — e um texto que AFIRMA falar do seu negócio e fala de um negócio genérico é pior do que não personalizar.',
    };
  }
  if (confianca < 55) {
    return {
      calibre: 'basico',
      titulo: 'Dá para começar',
      frase:
        'Já dá para citar o seu ramo e o seu público. Os exemplos vão soar certos, mas ainda genéricos dentro do seu ramo.',
    };
  }
  if (confianca < 75) {
    return {
      calibre: 'bom',
      titulo: 'Vai sair com a sua cara',
      frase:
        'Sei o suficiente para escrever exemplos com a sua rotina, o seu público e o que você já tentou.',
    };
  }
  return {
    calibre: 'afiado',
    titulo: 'Vai sair afiado',
    frase:
      'Conheço a sua voz, o seu público e as suas travas. Os exemplos vão parecer escritos por alguém que trabalha com você.',
  };
}
