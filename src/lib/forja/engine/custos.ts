/* ⚠️ ARQUIVO GERADO — NÃO EDITE AQUI.
 * Fonte: worldforge-fayai/engine/custos.ts
 * Edite lá e rode: node scripts/forja/sincronizar-engine.mjs
 * Conferir se a cópia está em dia: node scripts/forja/sincronizar-engine.mjs --conferir
 */
/**
 * OS CUSTOS — o que é de graça, o que custa crédito, e por quê.
 *
 * ## A decisão do Ricardo, e o que ela implica
 *
 * *"para as gerações 'grátis' que serão feitas com meu computador local, isso
 * tem que ser o padrão, vai ter uma fila."*
 *
 * Ou seja: **gerar é de graça**. A GPU da casa não emite fatura, então cobrar
 * crédito por rodar nela seria cobrar por nada. O preço do caminho grátis é o
 * TEMPO — e por isso a fila não é um defeito a esconder, é o produto.
 *
 * ## O que sobra para vender, então
 *
 * Quando o produto é gratuito, o que se vende é a remoção da restrição. Aqui há
 * três restrições reais, e cada uma vira uma escolha honesta:
 *
 * 1. **A espera.** Uma GPU, um trabalho por vez. `furar_fila` compra a frente
 *    da fila — e é o item mais honesto do cardápio, porque entrega exatamente o
 *    que promete e não tira nada de ninguém que não escolheu esperar.
 * 2. **O limite de uso justo.** Sem teto, dez pessoas gerando um Reel cada
 *    ocupam a placa por duas horas e a décima primeira espera até amanhã. O teto
 *    diário protege a fila de quem chegou depois. Passou do teto, a pessoa
 *    escolhe: esperar a virada do dia (de graça) ou pagar a continuação —
 *    exatamente o desenho que o Studio de imagem já usa.
 * 3. **A máquina estar desligada.** O caminho de nuvem existe para isso, e
 *    custa porque custa de verdade.
 *
 * ⚠️ **Nada aqui cobra antes de entregar.** A regra da casa é a do Ateliê: a
 * caixa registradora cobra o que foi entregue. Um trabalho que falha na GPU não
 * debita nada — e é por isso que o débito acontece na conclusão do trabalho, e
 * não na hora de enfileirar.
 */

import type { Onde, TipoDeTrabalho } from "./fila";

/**
 * As chaves que vão para o extrato do aluno.
 *
 * ⚠️ Precisam existir em `CREDIT_COSTS` do site (`lib/course-tiers.ts`) para a
 * rota `/api/credits` aceitá-las e para o Mission Control poder editar o preço.
 * Chave que não existe lá é cobrança que estoura na hora de debitar.
 */
export const ACOES = {
  /** o caminho local, o padrão: zero */
  forja_local: "forja_local",
  /** uma imagem na nuvem, quando a máquina está desligada ou a pessoa não quer esperar */
  forja_imagem_nuvem: "forja_imagem_nuvem",
  /** um clipe na nuvem */
  forja_video_nuvem: "forja_video_nuvem",
  /** a frente da fila local */
  forja_furar_fila: "forja_furar_fila",
  /** continuar gerando depois do teto diário de uso justo */
  forja_extra_do_dia: "forja_extra_do_dia",
} as const;

/**
 * ⚠️ Não existe linha para "personagem extra", e a ausência é deliberada.
 *
 * A regra da casa (`character_sheet_extra: 20`) cobrava o segundo caderno
 * porque o primeiro custava API paga. Na Forja o caderno roda na GPU de casa e
 * custa zero — cobrar 20 por um recurso que não custa nada seria inventar uma
 * escassez. A FICHA de personagem é um formulário; cobrar por preencher
 * formulário é o tipo de linha que faz a pessoa desconfiar do resto da tabela.
 *
 * O que protege a placa é o teto diário (`TETO_DIARIO`), que já pesa o caderno
 * em 3. E quem quiser o caderno na nuvem paga `forja_imagem_nuvem` por ângulo,
 * que é o custo real.
 */

export type AcaoDaForja = (typeof ACOES)[keyof typeof ACOES];

/**
 * Os preços padrão, em créditos (1 crédito = R$1 na paridade da casa).
 *
 * ⚠️ São PADRÃO, não verdade: o preço vivo sai da tabela do Mission Control
 * (`lib/precos-runtime.ts`). Enquanto o Ricardo não gravar outro número, vale
 * este. Ver `reference_precos_vivos_mission_control`.
 */
export const PRECOS_PADRAO: Record<AcaoDaForja, number> = {
  forja_local: 0,
  // ancorado no `image_generation` que já existe e vale R$1
  forja_imagem_nuvem: 1,
  /**
   * Um clipe de 5 s numa API de vídeo custa entre US$0,20 e US$0,50 de verdade.
   * 12 cobre o custo com folga para variação de câmbio sem virar assalto.
   */
  forja_video_nuvem: 12,
  /**
   * Furar fila é barato de propósito. Se doer, ninguém compra e a fila continua
   * do mesmo tamanho — o item existe para ser usado, não para ser admirado.
   */
  forja_furar_fila: 2,
  forja_extra_do_dia: 1,
};

/**
 * O teto diário de uso justo, por plano — em TRABALHOS locais, não em imagens.
 *
 * Contar trabalho e não imagem é o certo: um Reel de cinco quadros é um pedido
 * só na cabeça de quem pediu, e cobrar cinco do teto por um clique faria o teto
 * parecer quebrado.
 *
 * ⚠️ O vídeo pesa mais no teto porque pesa mais na GPU — ver `PESO_NA_FILA`. Um
 * teto que trata 15 s de vídeo como 15 s de imagem entrega a placa inteira para
 * a primeira pessoa que descobrir isso.
 */
export const TETO_DIARIO: Record<string, number> = {
  free: 12,
  starter: 30,
  pro: 60,
  expert: 120,
};

/** O quanto cada tipo consome do teto. Proporcional ao tempo de GPU, arredondado para cima. */
export const PESO_NA_FILA: Record<TipoDeTrabalho, number> = {
  imagem: 1,
  caderno: 3,
  peca: 2,
  video: 6,
};

export interface Cobranca {
  acao: AcaoDaForja;
  creditos: number;
  /** o que aparece no extrato do aluno */
  descricao: string;
  /** o que aparece na tela ANTES de a pessoa decidir */
  explicacao: string;
}

export interface EntradaDeCobranca {
  tipo: TipoDeTrabalho;
  onde: Onde;
  furarFila?: boolean;
  /** já passou do teto diário? */
  acimaDoTeto?: boolean;
  /**
   * Quantos arquivos este pedido produz.
   *
   * Um caderno de personagem é UM trabalho e QUATRO imagens. Na nuvem isso são
   * quatro chamadas pagas — cobrar uma faria a casa pagar as outras três.
   * Localmente não muda nada, porque localmente nada é cobrado.
   */
  unidades?: number;
  rotulo: string;
  precos?: Partial<Record<AcaoDaForja, number>>;
}

function preco(acao: AcaoDaForja, tabela?: Partial<Record<AcaoDaForja, number>>): number {
  return tabela?.[acao] ?? PRECOS_PADRAO[acao];
}

/**
 * A conta de um pedido, item a item.
 *
 * Devolve uma LISTA e não um total, porque a tela precisa mostrar de onde vem
 * cada real. "12 créditos" é um número que a pessoa aceita ou recusa no escuro;
 * "10 pelo clipe na nuvem + 2 por furar a fila" é uma decisão.
 */
export function montarConta(e: EntradaDeCobranca): { itens: Cobranca[]; total: number } {
  const itens: Cobranca[] = [];

  if (e.onde === "nuvem") {
    const acao = e.tipo === "video" ? ACOES.forja_video_nuvem : ACOES.forja_imagem_nuvem;
    const unidades = Math.max(1, e.unidades || 1);
    itens.push({
      acao,
      creditos: preco(acao, e.precos) * unidades,
      descricao: `Forja — ${e.rotulo} (nuvem)`,
      explicacao: "Gerado num servidor pago, sem fila. É o que custa quando a máquina da casa não está disponível.",
    });
  } else {
    if (e.acimaDoTeto) {
      const n = preco(ACOES.forja_extra_do_dia, e.precos) * (PESO_NA_FILA[e.tipo] || 1);
      itens.push({
        acao: ACOES.forja_extra_do_dia,
        creditos: n,
        descricao: `Forja — ${e.rotulo} (além do dia)`,
        explicacao: "Você já usou as gerações grátis de hoje. Isto continua na mesma GPU — o crédito compra a continuação, não uma qualidade diferente.",
      });
    }
    if (e.furarFila) {
      itens.push({
        acao: ACOES.forja_furar_fila,
        creditos: preco(ACOES.forja_furar_fila, e.precos),
        descricao: `Forja — prioridade (${e.rotulo})`,
        explicacao: "Passa na frente de quem está esperando. Não muda o resultado, muda a hora em que ele chega.",
      });
    }
  }

  return { itens, total: itens.reduce((s, i) => s + i.creditos, 0) };
}

/**
 * O texto que a tela mostra quando o pedido é de graça.
 *
 * Existe como função porque "grátis" sozinho, num produto com créditos ao lado,
 * lê como pegadinha — a pessoa procura a letra miúda. Dizer ONDE roda e POR QUE
 * não custa é o que faz o grátis ser lido como grátis.
 */
export function textoDoGratis(esperaSegundos: number, restantesHoje: number): string {
  const partes = ["Sem crédito nenhum: roda na GPU da FayAI."];
  if (esperaSegundos > 0) partes.push("A fila é o preço.");
  if (restantesHoje <= 3) {
    partes.push(`Restam ${restantesHoje} ${restantesHoje === 1 ? "geração grátis" : "gerações grátis"} hoje.`);
  }
  return partes.join(" ");
}
