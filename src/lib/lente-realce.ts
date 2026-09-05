/**
 * Onde cada FALA do audiobook mora no capítulo já renderizado — sem tocar no DOM.
 *
 * ## Por que este arquivo substituiu `lente-spans.ts`
 *
 * A primeira lente envolvia cada frase narrada num `<span>` dentro do Markdown
 * renderizado. Funcionava, e **derrubava a página**:
 *
 *     Uncaught NotFoundError: Failed to execute removeChild on Node:
 *     The node to be removed is not a child of this node.
 *
 * Aquele DOM é do React. Ao envolver um nó de texto num span, ele deixa de ser
 * filho do `<p>` que o React acha que o tem. Quando o React vai atualizar aquele
 * parágrafo — trocar de capítulo, por exemplo — ele chama `removeChild` num nó
 * que mudou de pai, e a árvore inteira quebra: tela branca com
 * "Application error".
 *
 * O `desfazer()` não salvava, e não tinha como salvar: ele rodava na limpeza de
 * um `useEffect`, e limpeza de efeito passivo acontece DEPOIS de o React já ter
 * mexido no DOM daquele commit. Chegava sempre tarde.
 *
 * Era intermitente porque depende da forma do conteúdo: quando o React troca a
 * subárvore inteira, ele remove os pais e nem olha os filhos; quando reconcilia
 * no lugar, encosta nos nós de texto e quebra. Por isso passou pelos meus testes
 * em `chatgpt-zero` e morreu no primeiro capítulo de `chatgpt-masterclass`.
 *
 * ## O que ficou no lugar
 *
 * `Range` + **CSS Custom Highlight API**. As faixas são achadas do mesmo jeito —
 * mesma achatação, mesmo ponteiro que só anda para a frente — mas nada é
 * envolvido: o navegador pinta o realce por cima do texto, nativamente, e o DOM
 * continua exatamente como o React o deixou.
 *
 * ⚠️ Um `Range` aponta para nós vivos. Se o conteúdo mudar, as faixas viram
 * lixo — por isso elas são refeitas a cada capítulo, e nunca guardadas.
 */

export type FalaParaMarcar = { i: number; texto: string };

export type Faixas = {
  /** Quantas falas acharam lugar no capítulo. */
  casadas: number;
  total: number;
  /** A faixa de cada fala, indexada pelo `i` dela. */
  faixas: Map<number, Range>;
};

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
  const caminhante = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
    acceptNode(no) {
      const pai = no.parentElement;
      if (!pai) return NodeFilter.FILTER_REJECT;
      // ── BLOCO DE CÓDIGO NÃO, CÓDIGO EM LINHA SIM ─────────────────────────
      //
      // Recusar `code` inteiro parece certo — a voz não lê bloco de código — e
      // está errado para o código EM LINHA: `M`, `efConstruction`, `nprobe` são
      // narrados no meio da frase, e pular esse pedaço parte a frase ao meio. A
      // fala inteira deixa de casar, não só a palavra.
      //
      // Medido nos 134 capítulos: `rag-knowledge` cap11 casava 39 de 53 (74%), e
      // as catorze falhas eram todas frases com termo entre crases. Era o único
      // capítulo abaixo do portão de 95% no acervo inteiro.
      if (pai.closest("pre, figcaption, .not-prose")) return NodeFilter.FILTER_REJECT;
      if (!no.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let no: Node | null;
  const pedacos: { no: Text; inicio: number }[] = [];
  let achatado = "";
  while ((no = caminhante.nextNode())) {
    const t = no as Text;

    // ── SEPARADOR ENTRE NÓS ────────────────────────────────────────────────
    //
    // Sem isto, a última palavra de um nó gruda na primeira do seguinte:
    // "…não é editar" + "Este capítulo…" vira "editarEste", e toda fala que
    // atravessa uma fronteira de elemento deixa de casar. Medido: 12 das 52
    // falas do capítulo 1 falhavam só por isso.
    //
    // O separador não aponta para caractere nenhum do documento, então ele nunca
    // pode ser ponta de uma faixa — por isso `inicio: -1`.
    if (achatado && !achatado.endsWith(" ")) {
      achatado += " ";
      pedacos.push({ no: t, inicio: -1 });
    }

    const bruto = t.textContent ?? "";
    for (let k = 0; k < bruto.length; k++) {
      const c = achatar(bruto[k]);
      if (!c) {
        if (achatado && !achatado.endsWith(" ")) {
          achatado += " ";
          pedacos.push({ no: t, inicio: k });
        }
        continue;
      }
      achatado += c;
      pedacos.push({ no: t, inicio: k });
    }
  }
  return { achatado, pedacos };
}

type Pedaco = { no: Text; inicio: number };

function faixaEntre(pedacos: Pedaco[], de: number, ate: number): Range | null {
  let i0 = de, i1 = ate;
  while (pedacos[i0]?.inicio < 0 && i0 < i1) i0++;
  while (pedacos[i1]?.inicio < 0 && i1 > i0) i1--;
  const a = pedacos[i0];
  const b = pedacos[i1];
  if (!a || !b || a.inicio < 0 || b.inicio < 0) return null;
  try {
    const f = document.createRange();
    f.setStart(a.no, a.inicio);
    f.setEnd(b.no, b.inicio + 1);
    return f;
  } catch {
    // DOM em estado inesperado: pular a faixa é sempre melhor que quebrar a
    // página. A lente perde um realce; o aluno não perde a aula.
    return null;
  }
}

/**
 * Acha a faixa de cada fala dentro do container. **Não muda o DOM.**
 *
 * As falas são procuradas EM ORDEM, com um ponteiro que só anda para a frente.
 * Sem isso, uma frase curta que se repete no capítulo ("É isso.", "Não vai.")
 * casaria sempre com a primeira ocorrência, e o realce saltaria para trás no
 * meio da narração — o defeito mais desorientador possível numa lente.
 */
export function acharFaixas(raiz: HTMLElement, falas: FalaParaMarcar[]): Faixas {
  const { achatado, pedacos } = indexar(raiz);
  const faixas = new Map<number, Range>();

  let ponteiro = 0;
  for (const fala of falas) {
    // ── O "Passo N." É DA VOZ, NÃO DA PÁGINA ───────────────────────────────
    //
    // `roteiro.mjs` prefixa os itens numerados com "Passo 1. " porque, no áudio,
    // "1." não se ouve. Na tela o número vira o marcador da lista e o texto
    // começa direto — então buscar com o prefixo não acha nada. Medido: 5 falas
    // do capítulo 1 falhavam só por isso.
    const alvo = achatar(fala.texto.replace(/^Passo\s+\d+\.\s*/i, ""));
    if (alvo.length < 8) continue;          // curta demais para casar sem ambiguidade

    const achou = achatado.indexOf(alvo, ponteiro);
    if (achou < 0) continue;                 // não casou: a fala simplesmente não acende

    const faixa = faixaEntre(pedacos, achou, achou + alvo.length - 1);
    if (faixa) faixas.set(fala.i, faixa);
    ponteiro = achou + alvo.length;
  }

  return { casadas: faixas.size, total: falas.length, faixas };
}

/** Acha uma faixa por texto — usado para reacender os trechos já guardados. */
export function acharTrecho(raiz: HTMLElement, texto: string): Range | null {
  const alvo = achatar(texto);
  if (alvo.length < 8) return null;
  const { achatado, pedacos } = indexar(raiz);
  const achou = achatado.indexOf(alvo);
  if (achou < 0) return null;
  return faixaEntre(pedacos, achou, achou + alvo.length - 1);
}

/** O navegador sabe pintar realce sem DOM? (Chrome 105+, Safari 17.2+, Firefox 140+) */
export const temRealceNativo = () =>
  typeof CSS !== "undefined" && !!(CSS as unknown as { highlights?: unknown }).highlights;

const REGISTRO = ["lente-porvir", "lente-lida", "lente-guardado", "lente-atual"] as const;
export type NomeDeRealce = (typeof REGISTRO)[number];

/**
 * Publica os realces. A ORDEM importa: quando duas faixas se sobrepõem, quem tem
 * prioridade maior pinta por cima. A frase que toca precisa vencer o verde e o
 * azul, e o grifo do aluno precisa vencer os dois estados da narração.
 */
export function publicarRealces(porNome: Partial<Record<NomeDeRealce, Range[]>>) {
  if (!temRealceNativo()) return;
  REGISTRO.forEach((nome, ordem) => {
    const faixas = porNome[nome];
    if (!faixas || faixas.length === 0) { CSS.highlights.delete(nome); return; }
    const h = new Highlight(...faixas);
    h.priority = ordem + 1;
    CSS.highlights.set(nome, h);
  });
}

/** Apaga tudo o que a lente pintou. Barato, e não encosta no DOM. */
export function limparRealces() {
  if (!temRealceNativo()) return;
  for (const nome of REGISTRO) CSS.highlights.delete(nome);
}
