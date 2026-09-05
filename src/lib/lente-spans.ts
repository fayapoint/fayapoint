/**
 * Envolve cada FALA do audiobook num `<span>` dentro do capítulo já renderizado.
 *
 * ## Por que isto muda a natureza da lente
 *
 * Até aqui a lente desenhava a própria coluna a partir da linha do tempo: texto
 * puro, sem as imagens, sem a formatação, sem a arte do capítulo. Era uma
 * segunda leitura do mesmo conteúdo — um painel, não uma lente.
 *
 * Uma lente não desenha: ela **enxerga o que já está lá**. Para isso, o realce
 * precisa acontecer sobre o Markdown renderizado de verdade. Este arquivo é a
 * ponte: ele acha, no DOM, onde cada frase narrada mora, e a marca.
 *
 * ## Por que isto é confiável aqui, e não seria em outro produto
 *
 * O casamento não é aproximado. O texto falado sai do MESMO Markdown que o
 * leitor mostra, e a linha do tempo carrega o texto do ROTEIRO (não o falado —
 * ver o comentário em `montar.mjs`). Então é casamento de string com âncora
 * conhecida e ordem garantida, não alinhamento estatístico.
 *
 * ## A trava que impede o pior defeito
 *
 * As falas são procuradas EM ORDEM, com um ponteiro que só anda para a frente.
 * Sem isso, uma frase curta que se repete no capítulo ("É isso.", "Não vai.")
 * casaria com a primeira ocorrência sempre, e o realce saltaria para trás no
 * meio da narração — o defeito mais desorientador possível numa lente.
 */

export type FalaParaMarcar = { i: number; texto: string };

export type ResultadoDaMarcacao = {
  /** Quantas falas acharam lugar no DOM. */
  casadas: number;
  total: number;
  /** Os spans criados, na ordem, indexados pelo `i` da fala. */
  spans: Map<number, HTMLElement>;
  /** Desfaz tudo e devolve o DOM ao estado anterior. */
  desfazer: () => void;
};

export const CLASSE_FALA = "lente-fala";

/** Achata para comparação: sem acento, sem pontuação, espaço único. */
function achatar(t: string): string {
  return t
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Junta os nós de texto do container num só texto achatado, guardando de onde
 * veio cada caractere. É esse mapa que permite voltar do texto para o `Range`.
 */
function indexar(raiz: HTMLElement) {
  const nos: Text[] = [];
  const caminhante = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
    acceptNode(no) {
      const pai = no.parentElement;
      if (!pai) return NodeFilter.FILTER_REJECT;
      // Código, fórmula e legenda de mídia não são narrados — marcá-los
      // criaria realce em texto que a voz nunca vai ler.
      if (pai.closest("pre, code, figcaption, .not-prose")) return NodeFilter.FILTER_REJECT;
      if (!no.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let no: Node | null;
  const pedacos: { texto: string; no: Text; inicio: number }[] = [];
  let achatado = "";
  // eslint-disable-next-line no-cond-assign
  while ((no = caminhante.nextNode())) {
    const t = no as Text;
    nos.push(t);

    // ── SEPARADOR ENTRE NÓS (04/09/2026) ──────────────────────────────────
    //
    // Sem isto, a última palavra de um nó gruda na primeira do seguinte:
    // "…não é editar" + "Este capítulo…" vira "editarEste", e toda fala que
    // atravessa uma fronteira de elemento deixa de casar. Medido: 12 das 52
    // falas do capítulo 1 falhavam só por isso.
    //
    // O separador não aponta para caractere nenhum do documento, então ele
    // nunca é ponta de um Range — por isso `inicio: -1`.
    if (achatado && !achatado.endsWith(" ")) {
      achatado += " ";
      pedacos.push({ texto: " ", no: t, inicio: -1 });
    }

    const bruto = t.textContent ?? "";
    // Cada caractere do texto achatado precisa saber a que posição do nó
    // original corresponde — senão não dá para montar o Range de volta.
    for (let k = 0; k < bruto.length; k++) {
      const c = achatar(bruto[k]);
      if (!c) {
        // Pontuação e acento viram separador; espaços repetidos colapsam.
        if (achatado && !achatado.endsWith(" ")) {
          achatado += " ";
          pedacos.push({ texto: " ", no: t, inicio: k });
        }
        continue;
      }
      achatado += c;
      pedacos.push({ texto: c, no: t, inicio: k });
    }
  }
  return { achatado, pedacos, nos };
}

/**
 * Marca as falas no container.
 *
 * @param raiz    o elemento que contém o Markdown renderizado
 * @param falas   as falas da linha do tempo, na ordem
 */
export function marcarFalas(raiz: HTMLElement, falas: FalaParaMarcar[]): ResultadoDaMarcacao {
  const { achatado, pedacos } = indexar(raiz);
  const spans = new Map<number, HTMLElement>();
  const criados: HTMLElement[] = [];

  // ── ACHAR TUDO ANTES DE MEXER EM QUALQUER COISA (04/09/2026) ────────────
  //
  // O índice é tirado do DOM UMA vez. Envolver uma fala num span parte nós de
  // texto e move conteúdo — ou seja, invalida o índice para todas as falas
  // seguintes. A primeira versão marcava enquanto procurava e casava 38 de 52,
  // enquanto o mesmo algoritmo rodado sozinho casava as 52: não era o
  // casamento que falhava, era o DOM mudando embaixo dele.
  //
  // Então: primeiro colhe-se toda posição, depois envolve-se DE TRÁS PARA A
  // FRENTE. Mexer no fim não desloca o começo, e cada faixa continua válida
  // quando chega a vez dela.
  const encontrados: { fala: FalaParaMarcar; de: (typeof pedacos)[number]; ate: (typeof pedacos)[number] }[] = [];

  let ponteiro = 0;
  for (const fala of falas) {
    // ── O "Passo N." É DA VOZ, NÃO DA PÁGINA ──────────────────────────────
    //
    // `roteiro.mjs` prefixa os itens numerados do Fluxo de Execução com
    // "Passo 1. " porque, no áudio, "1." não se ouve. Na tela o número vira o
    // marcador da lista e o texto começa direto — então buscar com o prefixo
    // não acha nada. Medido: 5 falas do capítulo 1 falhavam só por isso.
    const alvo = achatar(fala.texto.replace(/^Passo\s+\d+\.\s*/i, ""));
    if (alvo.length < 8) continue;          // fala curta demais para casar sem ambiguidade

    const achou = achatado.indexOf(alvo, ponteiro);
    if (achou < 0) continue;                 // não casou: a fala simplesmente não acende

    // O separador entre nós não tem posição no documento (`inicio: -1`) e
    // nunca pode ser ponta de um Range — se calhar de cair na borda, anda.
    let i0 = achou, i1 = achou + alvo.length - 1;
    while (pedacos[i0]?.inicio < 0 && i0 < i1) i0++;
    while (pedacos[i1]?.inicio < 0 && i1 > i0) i1--;
    const de = pedacos[i0];
    const ate = pedacos[i1];
    if (!de || !ate || de.inicio < 0 || ate.inicio < 0) continue;

    encontrados.push({ fala, de, ate });
    ponteiro = achou + alvo.length;
  }

  for (let k = encontrados.length - 1; k >= 0; k--) {
    const { fala, de, ate } = encontrados[k];
    try {
      const faixa = document.createRange();
      faixa.setStart(de.no, de.inicio);
      faixa.setEnd(ate.no, ate.inicio + 1);

      const span = document.createElement("span");
      span.className = CLASSE_FALA;
      span.dataset.fala = String(fala.i);

      // `surroundContents` falha quando a faixa cruza a fronteira de um
      // elemento (uma frase com negrito no meio). `extractContents` +
      // `insertNode` atravessa, ao custo de reordenar os nós internos — que é
      // exatamente o que se quer aqui.
      span.appendChild(faixa.extractContents());
      faixa.insertNode(span);

      spans.set(fala.i, span);
      criados.push(span);
    } catch {
      // DOM em estado inesperado: pular a fala é sempre melhor que quebrar a
      // página. A lente perde um realce; o aluno não perde a aula.
    }
  }

  const desfazer = () => {
    for (const span of criados) {
      const pai = span.parentNode;
      if (!pai) continue;
      while (span.firstChild) pai.insertBefore(span.firstChild, span);
      pai.removeChild(span);
      pai.normalize();
    }
    spans.clear();
  };

  return { casadas: spans.size, total: falas.length, spans, desfazer };
}
