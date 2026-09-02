/**
 * Quebra o Markdown de um capítulo nas mesmas FALAS que o audiobook usa.
 *
 * ## Por que isto existe no cliente
 *
 * A lente nasceu presa ao áudio: sem `capNN.tempos.json`, sem lente. Isso
 * deixava o recurso invisível em 24 dos 25 cursos — e o Ricardo tentou achá-lo
 * no site e não achou, justamente por isso.
 *
 * Mas a lente resolve dois problemas, não um. Um é acompanhar a narração; o
 * outro é **não se perder num bloco de dez minutos de texto**, e esse existe
 * mesmo sem voz nenhuma. Então a quebra em frases, que o `cursos/audio/
 * roteiro.mjs` faz no servidor para produzir o áudio, passa a existir também
 * aqui, para produzir a LEITURA.
 *
 * ⚠️ As duas precisam concordar. Quando houver linha do tempo, é ELA que manda
 * (traz o texto que foi realmente narrado); esta função é o caminho de quem
 * ainda não tem áudio. Se as duas divergirem, o pior que acontece é o modo de
 * leitura cortar a frase num lugar levemente diferente — nada quebra, porque
 * aqui não há sincronia para desalinhar.
 */

export type FalaDeLeitura = {
  i: number;
  texto: string;
  tipo: "titulo" | "secao" | "paragrafo" | "item" | "passo" | "citacao";
  secao: string | null;
};

/** Tira do texto tudo que é marcação visual e não se lê em voz alta. */
function limpar(t: string): string {
  return t
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$|[.,;:!?])/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Quebra um parágrafo em frases de leitura.
 *
 * O teto de 280 caracteres não é estético: é o tamanho em que a frase ainda
 * cabe ampliada na tela de um celular. Acima disso o aluno passa a rolar DENTRO
 * da frase em foco, que é exatamente o que a lente existe para evitar.
 */
function emFalas(texto: string, teto = 280): string[] {
  const frases = texto
    .split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ0-9"“])/)
    .map((f) => f.trim())
    .filter(Boolean);

  const saida: string[] = [];
  let atual = "";
  for (const f of frases) {
    if (!atual) atual = f;
    else if (atual.length + 1 + f.length <= teto) atual += " " + f;
    else { saida.push(atual); atual = f; }
  }
  if (atual) saida.push(atual);

  return saida.flatMap((f) => {
    if (f.length <= teto * 1.6) return [f];
    const partes: string[] = [];
    let buf = "";
    for (const p of f.split(/(?<=,)\s+/)) {
      if (!buf) buf = p;
      else if (buf.length + 1 + p.length <= teto) buf += " " + p;
      else { partes.push(buf); buf = p; }
    }
    if (buf) partes.push(buf);
    return partes;
  });
}

const SECOES_DE_PASSO = new Set(["Fluxo de Execução"]);

export function falasDoCapitulo(markdown: string): FalaDeLeitura[] {
  const falas: FalaDeLeitura[] = [];
  let secao: string | null = null;
  let bloco: string[] = [];
  let emCodigo = false;

  const push = (texto: string, tipo: FalaDeLeitura["tipo"]) => {
    if (texto) falas.push({ i: falas.length, texto, tipo, secao });
  };

  const despejar = () => {
    if (!bloco.length) return;
    const texto = limpar(bloco.join(" "));
    bloco = [];
    if (!texto) return;
    for (const f of emFalas(texto)) push(f, "paragrafo");
  };

  for (const bruta of (markdown ?? "").split(/\r?\n/)) {
    const linha = bruta.trimEnd();

    if (/^\s*```/.test(linha)) { despejar(); emCodigo = !emCodigo; continue; }
    if (emCodigo) continue;
    if (/^\s*\|.*\|\s*$/.test(linha)) { despejar(); continue; }

    if (/^#\s+/.test(linha)) {
      despejar();
      const t = limpar(linha.replace(/^#\s+/, ""));
      const m = t.match(/^Cap[íi]tulo\s+(\d+)\s*[:.—-]\s*(.+)$/i);
      if (m) { push(`Capítulo ${m[1]}.`, "titulo"); push(m[2].replace(/[.:]$/, "") + ".", "titulo"); }
      else push(t.replace(/[.:]$/, "") + ".", "titulo");
      continue;
    }

    if (/^##\s+/.test(linha)) {
      despejar();
      secao = limpar(linha.replace(/^##\s+/, ""));
      push(secao.replace(/[.:]$/, "") + ".", "secao");
      continue;
    }

    if (/^###+\s+/.test(linha)) {
      despejar();
      push(limpar(linha.replace(/^###+\s+/, "")).replace(/[.:]$/, "") + ".", "secao");
      continue;
    }

    if (/^>\s?/.test(linha)) {
      despejar();
      for (const f of emFalas(limpar(linha.replace(/^>\s?/, "")))) push(f, "citacao");
      continue;
    }

    const numerada = linha.match(/^(\d+)\.\s+(.*)$/);
    if (numerada) {
      despejar();
      const t = limpar(numerada[2]);
      if (!t) continue;
      const passo = secao && SECOES_DE_PASSO.has(secao) ? `Passo ${numerada[1]}. ` : "";
      emFalas(t).forEach((f, i) => push((i === 0 ? passo : "") + f, "passo"));
      continue;
    }

    const item = linha.match(/^\s*[-*]\s+(.*)$/);
    if (item) {
      despejar();
      for (const f of emFalas(limpar(item[1]))) push(f, "item");
      continue;
    }

    if (!linha.trim()) { despejar(); continue; }
    bloco.push(linha.trim());
  }
  despejar();

  return falas;
}
