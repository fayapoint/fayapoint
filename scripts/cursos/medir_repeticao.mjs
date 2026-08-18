/**
 * Quanto de um curso é o MESMO parágrafo repetido — o núcleo da medida.
 *
 * ## Por que isto existe
 *
 * A régua de ESTRUTURA (8 seções, volume por capítulo) dá **8/8** a um curso que
 * repete o mesmo texto trinta vezes trocando o nome da ferramenta. Foi assim que
 * quatro cursos passaram — `automacao-n8n`, `midjourney-masterclass`,
 * `mastering-ai-with-chatgpt` e o de Perplexity — todos com estrutura perfeita e
 * ~49% do texto sendo cópia literal. Estrutura não é substância, e só esta
 * medida separa as duas.
 *
 * O portão: **acima de 5% o curso não passa.** Os cursos limpos da casa (o
 * gabarito `chatgpt-zero` e os 11 que passaram pelo `padronizar-curso.ts`)
 * marcam 0,0% — 5% é folga generosa, não meta.
 *
 * ## Por que este arquivo mora AQUI e não só na caixa de ferramentas
 *
 * ⚠️ A `regua-chatgpt-zero.mjs` importava isto de `../../cursos/`, que está
 * **fora do repositório** e não vai para o Git. Num clone, a régua quebrava no
 * `import` — antes de imprimir qualquer coisa. É o mesmo erro que o teto de pool
 * cometia ao morar só no `.env.local`: a proteção existe na máquina de quem a
 * escreveu e em nenhuma outra.
 *
 * O núcleo (medir texto) vive aqui, versionado. A ferramenta de linha de comando
 * — que lê `estado/<slug>/cap*.md`, fala com o Mongo e imprime o relatório —
 * continua em `autoresearch/cursos/medir_repeticao.mjs` e **importa daqui**, para
 * que a conta seja uma só. Se as duas divergirem, o portão passa a reprovar uma
 * coisa e a régua outra, e ninguém percebe.
 */

/** Acima disto, o curso não passa. Ver o cabeçalho. */
export const PORTAO_REPETICAO = 5;

/**
 * Os parágrafos que CONTAM para a medida.
 *
 * Ficam de fora, de propósito:
 *
 * - títulos (`#`), porque o padrão editorial EXIGE os mesmos nove títulos em
 *   todo capítulo — contá-los acusaria de plágio justamente o curso que obedece;
 * - marcadores de mídia (comentário HTML), gerados por slot e portanto idênticos
 *   por construção;
 * - bloco de código, que costuma repetir por ser o mesmo comando.
 *
 * O corte de 80 caracteres separa frase de conteúdo de rótulo curto
 * ("## Erros Comuns", "> **Dica Pro:**"). Abaixo disso, repetir é normal.
 */
export function paragrafos(texto) {
  return texto
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length >= 80 && !p.startsWith("#"));
}

/**
 * Normaliza o que é SLOT de template, não escrita.
 *
 * O molde dos cursos ocos trocava só o nome da ferramenta e a pontuação. Sem
 * baixar a caixa e tirar o que não é letra nem número, cada cópia parecia um
 * parágrafo novo e a medida dava quase zero para um curso 73% copiado.
 */
function chave(p) {
  return p.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "").replace(/\s+/g, " ").trim();
}

/**
 * A medida. `pct` é a fração dos CARACTERES que estão em parágrafos repetidos —
 * não a fração dos parágrafos: um molde de 900 caracteres repetido 30 vezes pesa
 * o que realmente ocupa na tela do aluno.
 */
export function medir(texto) {
  const ps = paragrafos(texto);
  const total = ps.reduce((s, p) => s + p.length, 0);
  const contagem = new Map();
  for (const p of ps) {
    const k = chave(p);
    contagem.set(k, (contagem.get(k) || 0) + 1);
  }
  let repetidos = 0;
  const campeoes = new Map();
  for (const p of ps) {
    const k = chave(p);
    if (contagem.get(k) > 1) {
      repetidos += p.length;
      if (!campeoes.has(k)) campeoes.set(k, { vezes: contagem.get(k), trecho: p.slice(0, 110) });
    }
  }
  return {
    paragrafos: ps.length,
    chars: total,
    pct: total ? (repetidos / total) * 100 : 0,
    piores: [...campeoes.values()].sort((a, b) => b.vezes - a.vezes).slice(0, 5),
  };
}
