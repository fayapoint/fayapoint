/* ⚠️ ARQUIVO GERADO — NÃO EDITE AQUI.
 * Fonte: worldforge-fayai/engine/fila.ts
 * Edite lá e rode: node scripts/forja/sincronizar-engine.mjs
 * Conferir se a cópia está em dia: node scripts/forja/sincronizar-engine.mjs --conferir
 */
/**
 * A FILA — o contrato entre o site e a GPU de casa.
 *
 * ## A restrição que desenha tudo
 *
 * O site roda na Netlify, em função serverless. A GPU está na máquina do
 * Ricardo, atrás de um roteador doméstico. **Não existe rota de entrada**, e
 * abrir uma seria expor a máquina dele à internet por causa de um botão de
 * gerar imagem.
 *
 * Então a seta é invertida: o site só GRAVA pedidos, e o trabalhador local
 * PUXA. Nenhuma porta aberta, nenhum túnel, nenhum IP fixo. E o efeito colateral
 * é o que Ricardo pediu: quando a máquina está desligada, os trabalhos ficam
 * esperando em vez de falharem — a fila vira a promessa, não o defeito.
 *
 * ## O aluguel, e por que ele existe
 *
 * Um trabalhador que morre no meio (queda de luz, ComfyUI reiniciado, Windows
 * decidindo atualizar) deixaria o trabalho preso em `rodando` para sempre. Por
 * isso reservar é ALUGAR: `reservadoAte` é um prazo, e trabalho com prazo
 * vencido volta sozinho para a fila. O trabalhador renova o prazo enquanto
 * trabalha — é o mesmo desenho de um lease distribuído, e é a diferença entre
 * uma fila que se recupera e uma que precisa de alguém olhando.
 *
 * ⚠️ **O aluguel tem de ser maior que o trabalho mais lento.** Um vídeo de 10 s
 * leva ~12 min na RTX 5060 Ti. Prazo de 5 min faria o trabalho voltar para a
 * fila enquanto ele ainda está rodando, e aí dois trabalhadores gerariam o mesmo
 * clipe — a GPU competindo consigo mesma. Ver `ALUGUEL_SEGUNDOS`.
 */

export type TipoDeTrabalho =
  | "imagem" // um quadro, ou uma imagem avulsa a pedido
  | "video" // um clipe de um quadro
  | "caderno" // os quatro ângulos do personagem
  | "peca"; // todos os quadros de uma peça, em lote

export type EstadoDoTrabalho =
  | "esperando"
  | "reservado"
  | "rodando"
  | "pronto"
  | "falhou"
  | "cancelado";

export type Onde = "local" | "nuvem";

/**
 * ## Onde o trabalho roda, e o padrão
 *
 * `local` é o padrão para tudo, e é a decisão de produto: a GPU de casa não
 * cobra nada, então o usuário gera à vontade e a fila é o único preço. A nuvem
 * existe para quem não quer esperar — e aí custa crédito, porque aí custa
 * dinheiro de verdade.
 */
export const ONDE_PADRAO: Onde = "local";

export interface PedidoDeTrabalho {
  tipo: TipoDeTrabalho;
  onde: Onde;
  /** o id do grafo (`z-image`, `ltx25`…) — decide qual builder monta o workflow */
  grafo: string;
  /** os parâmetros já compostos, prontos para `montarGrafo` */
  params: Record<string, unknown>;
  /** URLs de referência que o trabalhador precisa subir para o `input/` antes */
  referencias?: Array<{ url: string; comoNome: string }>;
  /** para onde o resultado volta no site: peça+quadro, personagem+ângulo, ou avulso */
  destino: {
    pecaId?: string;
    quadroNumero?: number;
    personagemId?: string;
    angulo?: string;
    avulso?: boolean;
  };
  /** o que a pessoa vê enquanto espera */
  rotulo: string;
}

export interface Trabalho extends PedidoDeTrabalho {
  _id: string;
  userId: string;
  estado: EstadoDoTrabalho;

  /** ordem de atendimento: MAIOR primeiro; empate desempata pelo mais antigo */
  prioridade: number;

  /** quem pegou, e até quando o aluguel vale */
  trabalhador?: string;
  reservadoAte?: Date;

  /** quantas vezes já tentou. Ver `PODE_TENTAR` */
  tentativas: number;
  ultimoErro?: string;

  /** o resultado */
  resultado?: {
    url: string;
    /** o segundo arquivo, quando existe (ex.: a miniatura de um vídeo) */
    miniatura?: string;
    largura?: number;
    altura?: number;
    duracaoMs?: number;
    bytes?: number;
    /** a semente usada — é ela que permite repetir o mesmo rosto */
    semente?: number;
  };

  /** o crédito, quando houve. `0` no caminho local. */
  creditos: number;

  criadoEm: Date;
  comecouEm?: Date;
  terminouEm?: Date;
  /** estimativa em segundos, para a tela dizer "faltam ~2 min" sem mentir muito */
  segundosEstimados: number;
}

/**
 * O prazo do aluguel, por tipo.
 *
 * Generoso de propósito: o custo de um prazo longo demais é um trabalho preso
 * por alguns minutos a mais quando o trabalhador morre. O custo de um prazo
 * curto demais é geração duplicada na GPU — muito pior, e silenciosa.
 */
export const ALUGUEL_SEGUNDOS: Record<TipoDeTrabalho, number> = {
  imagem: 5 * 60,
  video: 25 * 60,
  caderno: 15 * 60,
  peca: 30 * 60,
};

/**
 * Quantas tentativas antes de desistir.
 *
 * Duas, e não cinco: as falhas do ComfyUI se dividem em transitórias (VRAM
 * ocupada por outro processo, servidor reiniciando) e permanentes (modelo que
 * saiu do disco, prompt que estoura o encoder). A primeira classe passa na
 * segunda tentativa. A segunda classe nunca passa, e insistir cinco vezes só
 * queima GPU e faz a pessoa esperar cinco vezes mais para receber a mesma má
 * notícia.
 */
export const MAX_TENTATIVAS = 2;

/**
 * A prioridade de um pedido.
 *
 * ## A regra, e a razão de cada degrau
 *
 * - **Nuvem na frente de tudo (100).** Quem pagou crédito comprou justamente o
 *   não-esperar; deixá-lo atrás de uma fila grátis é vender uma coisa e
 *   entregar outra. (Na prática a nuvem nem passa por esta fila — mas quando
 *   passa, por indisponibilidade da API, ela mantém o lugar.)
 * - **Uma imagem sozinha (60) na frente de uma peça inteira (40).** Quem pediu
 *   uma imagem está olhando a tela. Quem mandou gerar as cinco de um Reel foi
 *   fazer outra coisa. Sem este degrau, um Reel de dez quadros bloqueia por
 *   vinte minutos alguém que queria uma imagem em quinze segundos.
 * - **O caderno alto (80).** Ele é pré-requisito: sem o caderno, todo quadro com
 *   gente sai com rosto errado. É a peça que destrava as outras.
 * - **Vídeo por último (20).** É o mais caro em GPU por unidade de utilidade, e
 *   quem pede vídeo já sabe que vai esperar.
 */
export function prioridadeDe(p: PedidoDeTrabalho): number {
  if (p.onde === "nuvem") return 100;
  if (p.tipo === "caderno") return 80;
  if (p.tipo === "video") return 20;
  if (p.tipo === "peca") return 40;
  return 60;
}

/** O que o trabalhador manda ao pedir serviço. */
export interface PedidoDeReserva {
  trabalhador: string;
  /** quantos trabalhos ele aguenta agora — 1 na GPU de casa */
  quantos: number;
  /** os tipos que ele sabe fazer, para uma máquina sem os modelos de vídeo poder ajudar mesmo assim */
  tipos?: TipoDeTrabalho[];
  /** VRAM livre em bytes, para o site não entregar vídeo a uma máquina sem folga */
  vramLivre?: number;
}

/** O que o site devolve. */
export interface RespostaDeReserva {
  trabalhos: Trabalho[];
  /** quantos ainda esperam, para o trabalhador saber se vale continuar acordado */
  esperando: number;
}

/** O que o trabalhador manda ao terminar. */
export interface Conclusao {
  trabalhoId: string;
  trabalhador: string;
  ok: boolean;
  resultado?: Trabalho["resultado"];
  erro?: string;
  /** quanto tempo levou de verdade — alimenta a estimativa da próxima vez */
  segundosReais?: number;
}

/**
 * A VRAM mínima para aceitar um trabalho de vídeo.
 *
 * O LTX 2.5 distilled tem 20 GB de pesos e roda em 16 GB de placa por
 * descarregamento — mas precisa de folga para a segunda passada, que é onde ele
 * estoura, e é o pior momento possível: depois de quatro minutos de trabalho.
 *
 * ⚠️ ERA 10 GB, e 10 GB TRAVOU A FILA (medido em 27/08/2026).
 *
 * Numa placa de 16 GB, qualquer trabalho de imagem que acabou de rodar deixa
 * menos de 10 GB livres — então o vídeo era recusado. E o trabalhador só libera
 * a VRAM quando TROCA de família de modelo, o que ele nunca fazia, porque não
 * conseguia pegar o trabalho. Resultado: um clipe em `esperando` para sempre,
 * com a GPU parada e o trabalhador dizendo "fila vazia".
 *
 * O conserto tem duas metades, e as duas são necessárias: este número virou 6
 * GB (o que a segunda passada realmente pede de folga), e o trabalhador passou
 * a soltar a VRAM quando fica ocioso COM gente esperando.
 */
export const VRAM_MINIMA_VIDEO = 6 * 1024 * 1024 * 1024;

export function podeAtender(t: Trabalho, r: PedidoDeReserva): boolean {
  if (r.tipos?.length && !r.tipos.includes(t.tipo)) return false;
  if (t.tipo === "video" && r.vramLivre !== undefined && r.vramLivre < VRAM_MINIMA_VIDEO) return false;
  return true;
}

/**
 * Quanto tempo falta, em texto que uma pessoa entende.
 *
 * ⚠️ Nunca diz "alguns instantes". A fila da casa atende um trabalho por vez, e
 * um vídeo à frente significa doze minutos — mentir sobre isso é o jeito mais
 * rápido de fazer alguém recarregar a página vinte vezes e abrir um chamado.
 */
export function esperaEmTexto(segundos: number): string {
  if (segundos <= 0) return "agora";
  if (segundos < 90) return `~${Math.max(10, Math.round(segundos / 10) * 10)} segundos`;
  const min = Math.round(segundos / 60);
  if (min < 60) return `~${min} ${min === 1 ? "minuto" : "minutos"}`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `~${h}h${String(m).padStart(2, "0")}` : `~${h}h`;
}

/**
 * A espera total de um trabalho: o que está na frente dele, mais ele.
 *
 * A fila é serial porque a GPU é uma só. Somar a estimativa de todos os que
 * vêm antes é, literalmente, a conta certa — e é a conta que a tela precisa
 * fazer para não prometer quinze segundos quando são onze minutos.
 */
export function esperaPrevista(fila: Array<Pick<Trabalho, "segundosEstimados">>, indice: number): number {
  return fila.slice(0, indice + 1).reduce((s, t) => s + (t.segundosEstimados || 0), 0);
}
