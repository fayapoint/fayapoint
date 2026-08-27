/* ⚠️ ARQUIVO GERADO — NÃO EDITE AQUI.
 * Fonte: worldforge-fayai/engine/formatos.ts
 * Edite lá e rode: node scripts/forja/sincronizar-engine.mjs
 * Conferir se a cópia está em dia: node scripts/forja/sincronizar-engine.mjs --conferir
 */
/**
 * OS FORMATOS — o que se pode montar na Forja.
 *
 * Cada formato carrega uma ESPINHA NARRATIVA, e ela é o que separa isto de um
 * gerador de post. Um gerador devolve texto; um formato com espinha devolve
 * cinco quadros em que o segundo só existe porque o primeiro aconteceu.
 *
 * ## O que mudou em relação ao Ateliê de Storyboard antigo (27/08/2026)
 *
 * Os cinco formatos originais ficam, porque a espinha deles foi escrita com
 * cuidado e funciona. Entram três que só passaram a ser possíveis quando a
 * Forja ganhou vídeo de verdade e personagem consistente:
 *
 * - **`clipe`** — um quadro só, mas em movimento. É o formato mais pedido e o
 *   que o storyboard antigo não conseguia entregar: a pessoa quer UM vídeo
 *   curto, não um plano de cinco quadros.
 * - **`serie`** — a mesma pessoa em três peças ligadas. Só existe porque o
 *   personagem agora sobrevive entre gerações.
 * - **`bastidor`** — o formato que usa o personagem do PÚBLICO, e não o do
 *   criador. É o que transforma a ficha do cliente típico em conteúdo.
 */

export type IdFormato = "reel" | "clipe" | "carrossel" | "story" | "post" | "anuncio" | "serie" | "bastidor";

export interface Formato {
  id: IdFormato;
  titulo: string;
  promessa: string;
  aspecto: "9:16" | "4:5" | "1:1" | "16:9";
  quadros: number;
  /** cada quadro tem duração em segundos? (peça em vídeo) */
  temTempo: boolean;
  /** cada quadro tem fala/narração? */
  temFala: boolean;
  /** os quadros viram clipe por padrão? */
  ehVideo: boolean;
  /** quem aparece por padrão: o criador, o cliente típico, ou ninguém */
  protagonista: "criador" | "publico" | "nenhum";
  /** a espinha narrativa que o modelo tem de seguir */
  estrutura: string[];
}

export const FORMATOS: Record<IdFormato, Formato> = {
  reel: {
    id: "reel",
    titulo: "Reel",
    promessa: "vídeo vertical de 15 a 30 segundos",
    aspecto: "9:16",
    quadros: 5,
    temTempo: true,
    temFala: true,
    ehVideo: true,
    protagonista: "criador",
    estrutura: [
      "Gancho — os 2 primeiros segundos precisam quebrar a rolagem com uma imagem, não com uma frase",
      "Contexto — a situação real de quem assiste, reconhecível em um quadro",
      "Virada — o que muda quando se sabe o que você sabe",
      "Prova — algo concreto: número, antes e depois, bastidor",
      "Chamada — o próximo passo, uma coisa só",
    ],
  },
  clipe: {
    id: "clipe",
    titulo: "Clipe",
    promessa: "um vídeo curto, de um plano só",
    aspecto: "9:16",
    quadros: 1,
    temTempo: true,
    temFala: true,
    ehVideo: true,
    protagonista: "criador",
    estrutura: [
      "Um plano que carrega a ideia inteira: começa mostrando o problema e termina mostrando a saída, sem corte",
    ],
  },
  carrossel: {
    id: "carrossel",
    titulo: "Carrossel",
    promessa: "sequência de cartões para arrastar",
    aspecto: "4:5",
    quadros: 6,
    temTempo: false,
    temFala: false,
    ehVideo: false,
    protagonista: "criador",
    estrutura: [
      "Capa — a promessa inteira em uma imagem e cinco palavras",
      "O problema — nomear a dor com as palavras de quem sente",
      "A causa — por que acontece, sem culpar quem lê",
      "O caminho — o passo que resolve",
      "A prova — exemplo concreto do seu trabalho",
      "Chamada — o convite, direto",
    ],
  },
  story: {
    id: "story",
    titulo: "Story",
    promessa: "três telas rápidas, tom de bastidor",
    aspecto: "9:16",
    quadros: 3,
    temTempo: true,
    temFala: true,
    ehVideo: true,
    protagonista: "criador",
    estrutura: [
      "Flagrante — o que está acontecendo agora",
      "O detalhe — o que só quem faz percebe",
      "Convite — pergunta ou enquete",
    ],
  },
  post: {
    id: "post",
    titulo: "Post único",
    promessa: "uma imagem e uma legenda",
    aspecto: "4:5",
    quadros: 1,
    temTempo: false,
    temFala: false,
    ehVideo: false,
    protagonista: "nenhum",
    estrutura: [
      "Uma imagem que carrega a ideia inteira sem precisar de legenda para ser entendida",
    ],
  },
  anuncio: {
    id: "anuncio",
    titulo: "Anúncio",
    promessa: "peça para tráfego pago",
    aspecto: "1:1",
    quadros: 3,
    temTempo: true,
    temFala: true,
    ehVideo: true,
    protagonista: "criador",
    estrutura: [
      "Interrupção — fala com quem tem o problema, nomeando o problema",
      "Oferta — o que é, para quem, com a prova mais forte que existir",
      "Ação — o clique, com o motivo de ser agora",
    ],
  },
  serie: {
    id: "serie",
    titulo: "Série",
    promessa: "três peças ligadas, a mesma pessoa nas três",
    aspecto: "9:16",
    quadros: 3,
    temTempo: true,
    temFala: true,
    ehVideo: true,
    protagonista: "criador",
    estrutura: [
      "Parte 1 — o erro que quase todo mundo comete, mostrado acontecendo",
      "Parte 2 — o que fazer no lugar, mostrado sendo feito",
      "Parte 3 — o resultado, com o antes ainda fresco na cabeça de quem assiste",
    ],
  },
  bastidor: {
    id: "bastidor",
    titulo: "O cliente",
    promessa: "a história do seu cliente típico, contada em cena",
    aspecto: "9:16",
    quadros: 4,
    temTempo: true,
    temFala: true,
    ehVideo: true,
    protagonista: "publico",
    estrutura: [
      "O dia dele antes — a cena da dor, sem ninguém explicando nada",
      "A tentativa que não deu — o que ele já tentou sozinho",
      "O encontro — como ele chega até você, mostrado, não narrado",
      "O depois — a mesma cena do começo, agora diferente",
    ],
  },
};

export function acharFormato(id?: string): Formato {
  return FORMATOS[id as IdFormato] || FORMATOS.reel;
}

export const LISTA_DE_FORMATOS = Object.values(FORMATOS);
