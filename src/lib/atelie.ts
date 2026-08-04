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

export type IdOpcao = 'texto' | 'imagens' | 'rosto';

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
