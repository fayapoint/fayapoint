import { CREDIT_COSTS } from '@/lib/course-tiers';

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

export type IdOpcao = 'texto' | 'imagens' | 'rosto' | 'narracao';

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
  { id: 'curta', rotulo: 'Enxuta', emoji: '⚡', descricao: 'O essencial, para ler no intervalo', instrucao: 'Camada curta: abertura de 1 frase, exemplo de até 3 frases, tarefa de 1 linha.' },
  { id: 'media', rotulo: 'Na medida', emoji: '📄', descricao: 'O padrão da casa', instrucao: 'Camada padrão: abertura de até 2 frases, exemplo de até 5 frases, tarefa de 1 frase.' },
  { id: 'longa', rotulo: 'Detalhada', emoji: '📚', descricao: 'Com mais contexto e mais exemplo', instrucao: 'Camada detalhada: abertura de até 3 frases, exemplo de até 8 frases com números concretos, tarefa com 2 passos.' },
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
function acharOpcao(lista: OpcaoAjuste[], id: string, padrao: string): OpcaoAjuste {
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
  /** Custo total em créditos desta opção para ESTE curso. */
  creditos: number;
  /** Como o total foi formado — a tela mostra a conta, não só o resultado. */
  conta: string;
  /** Já entregue: não cobra de novo. */
  jaFeito: boolean;
  /** Depende de outra opção (o rosto exige o caderno de personagem). */
  requer?: IdOpcao;
  /** Ainda não existe pipeline — aparece anunciado, nunca cobrável. */
  emBreve?: boolean;
}

export interface Orcamento {
  capitulos: number;
  itens: ItemOrcamento[];
  /** Soma das opções escolhidas. */
  total: number;
}

export interface EntradaOrcamento {
  capitulos: number;
  /** Capítulos que já têm camada válida — esses não são recobrados. */
  capitulosJaFeitos: number;
  temCadernoDePersonagem: boolean;
  escolhidas: IdOpcao[];
  /** Este curso já tem narração gravada na voz escolhida? Ver `data/narradores`. */
  narracaoPronta?: boolean;
}

/**
 * ⚠️ Cobra só o que FALTA.
 *
 * Um aluno que gerou 30 capítulos, aprofundou a persona e volta para atualizar
 * 4 paga por 4. Cobrar os 30 de novo transformaria "melhorei meu perfil" numa
 * punição — exatamente o oposto do laço que queremos: quanto mais ele conta
 * sobre si, melhor o conteúdo e mais barata a atualização.
 */
export function montarOrcamento(e: EntradaOrcamento): Orcamento {
  const faltam = Math.max(0, e.capitulos - e.capitulosJaFeitos);
  const custoTexto = faltam * CREDIT_COSTS.custom_course_chapter;
  const custoImagens = e.capitulos * CREDIT_COSTS.image_generation;

  const itens: ItemOrcamento[] = [
    {
      id: 'texto',
      titulo: 'O curso escrito para você',
      descricao:
        'Cada capítulo ganha uma abertura, um exemplo e uma tarefa no contexto do seu negócio. A aula original continua intacta.',
      creditos: custoTexto,
      conta:
        faltam === e.capitulos
          ? `${faltam} capítulos × ${CREDIT_COSTS.custom_course_chapter} créditos`
          : `${faltam} capítulos que faltam × ${CREDIT_COSTS.custom_course_chapter} créditos (${e.capitulosJaFeitos} já feitos não são cobrados de novo)`,
      jaFeito: faltam === 0,
    },
    {
      id: 'imagens',
      titulo: 'Ilustrações do seu contexto',
      descricao:
        'Uma imagem por capítulo, gerada a partir do seu ramo e do seu público — não banco de imagens.',
      creditos: custoImagens,
      conta: `${e.capitulos} imagens × ${CREDIT_COSTS.image_generation} créditos`,
      jaFeito: false,
      emBreve: true,
    },
    {
      id: 'rosto',
      titulo: 'Com o seu rosto',
      descricao:
        'Um caderno de personagem a partir das suas fotos, para você aparecer nas imagens do curso com o mesmo rosto em todos os ângulos.',
      creditos: e.temCadernoDePersonagem ? 0 : CREDIT_COSTS.character_sheet,
      conta: e.temCadernoDePersonagem
        ? 'Você já tem um caderno de personagem — nada a pagar'
        : `${CREDIT_COSTS.character_sheet} créditos, uma vez só`,
      jaFeito: e.temCadernoDePersonagem,
      requer: 'imagens',
      emBreve: true,
    },
    {
      id: 'narracao',
      titulo: 'Narrado para ouvir',
      descricao:
        'O curso inteiro em áudio, na voz que você escolher abaixo — para estudar dirigindo, treinando ou lavando louça.',
      creditos: e.capitulos * CREDIT_COSTS.course_narration_chapter,
      conta: `${e.capitulos} capítulos × ${CREDIT_COSTS.course_narration_chapter} crédito`,
      jaFeito: e.narracaoPronta === true,
      // ⚠️ `emBreve` enquanto a produção de áudio não voltar (ver
      // `public/audio/PRODUCTION_STATUS.md`: a cota de caracteres acabou em
      // abril). O preço aparece porque anunciar o preço é honesto; a cobrança
      // não acontece porque `montarOrcamento` nunca soma item `emBreve`.
      emBreve: e.narracaoPronta !== true,
    },
  ];

  const total = itens
    .filter((i) => e.escolhidas.includes(i.id) && !i.jaFeito && !i.emBreve)
    .reduce((s, i) => s + i.creditos, 0);

  return { capitulos: e.capitulos, itens, total };
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
