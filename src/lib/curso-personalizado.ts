/**
 * O curso escrito para UMA pessoa (27/07/2026).
 *
 * ## O que já existia, e por que não bastava
 *
 * O motor Expert v1 (`lib/course-examples.ts`) troca o miolo de slots
 * `<!--exemplo-->` que um autor tenha marcado à mão no markdown. Funciona bem
 * — e só funciona em curso que TEM slot. Dos vinte cursos do catálogo, a
 * maioria não tem nenhum, então para quase todo aluno "conteúdo personalizado"
 * era exatamente o mesmo texto de todo mundo.
 *
 * ## O que este módulo faz
 *
 * Trabalha sobre a estrutura que TODO curso tem: o capítulo (`# ` de primeiro
 * nível). Para cada capítulo, três peças curtas escritas a partir da persona:
 *
 * | peça | responde |
 * |---|---|
 * | `abertura` | por que ESTE capítulo importa para o negócio DELE |
 * | `exemplo` | o conceito do capítulo aplicado ao ramo dele, com números plausíveis |
 * | `tarefa` | o que ele faz hoje, com o que já tem aberto na tela |
 *
 * A aula original não é reescrita. Isso é decisão, não limitação: o texto do
 * curso é revisado e verificado editorialmente ([[editorial-verification]]),
 * e deixar um modelo reescrever a explicação inteira troca conteúdo conferido
 * por conteúdo plausível. A camada personalizada envolve a aula — ela não a
 * substitui.
 *
 * ## Idempotência
 *
 * O bloco entra marcado (`<!--fayai:cap-N-->`). Reinjetar remove a versão
 * anterior antes de escrever a nova, então gerar de novo depois de o aluno
 * completar a persona não empilha três aberturas no mesmo capítulo.
 */

export interface CapituloDoCurso {
  indice: number;
  titulo: string;
  corpo: string;
}

export interface CamadaDeCapitulo {
  indice: number;
  abertura?: string;
  exemplo?: string;
  tarefa?: string;
}

const SPLIT_CAPITULO = /(?=^# [^#].*$)/gm;

/** Marcador do bloco injetado — permite substituir sem duplicar. */
const marca = (i: number) => `<` + `!--fayai:cap-${i}--` + `>`;
const marcaFim = (i: number) => `<` + `!--/fayai:cap-${i}--` + `>`;

export function dividirCapitulos(markdown: string): CapituloDoCurso[] {
  return markdown
    .replace(/\r\n/g, '\n')
    .split(SPLIT_CAPITULO)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((corpo, indice) => ({
      indice,
      titulo: (corpo.split('\n')[0] || '').replace(/^#\s+/, '').trim(),
      corpo,
    }))
    .filter((c) => !!c.titulo);
}

function montarBloco(nome: string | undefined, c: CamadaDeCapitulo): string {
  const linhas: string[] = [];
  if (c.abertura) linhas.push(`> **🎯 Por que isto muda o seu jogo**  \n> ${c.abertura.replace(/\n+/g, '  \n> ')}`);
  if (c.exemplo) linhas.push(`> **🧩 No seu contexto**  \n> ${c.exemplo.replace(/\n+/g, '  \n> ')}`);
  if (c.tarefa) {
    const quem = nome ? `, ${nome.split(' ')[0]}` : '';
    linhas.push(`> **✍️ Sua vez${quem}**  \n> ${c.tarefa.replace(/\n+/g, '  \n> ')}`);
  }
  return linhas.join('\n>\n');
}

/**
 * Injeta as camadas logo abaixo do título de cada capítulo.
 *
 * Abaixo do título e não no fim: quem abre o capítulo precisa saber por que
 * ele importa ANTES de ler quinze parágrafos — a camada é o gancho, e gancho
 * no rodapé não engancha ninguém.
 */
export function injetarCamada(markdown: string, camadas: CamadaDeCapitulo[], nome?: string): string {
  if (!camadas.length) return markdown;
  const porIndice = new Map(camadas.map((c) => [c.indice, c]));

  return dividirCapitulos(markdown)
    .map((cap) => {
      // Limpa uma injeção anterior antes de escrever a nova.
      const limpo = cap.corpo.replace(
        new RegExp(`${marca(cap.indice)}[\\s\\S]*?${marcaFim(cap.indice)}\\n*`, 'g'),
        ''
      );
      const camada = porIndice.get(cap.indice);
      if (!camada) return limpo;

      const bloco = montarBloco(nome, camada);
      if (!bloco) return limpo;

      const linhas = limpo.split('\n');
      const titulo = linhas[0];
      const resto = linhas.slice(1).join('\n');
      return `${titulo}\n\n${marca(cap.indice)}\n${bloco}\n${marcaFim(cap.indice)}\n${resto}`;
    })
    .join('\n\n');
}

/** Remove qualquer camada injetada — usado quando o aluno pede o texto original. */
export function removerCamadas(markdown: string): string {
  // Montado por concatenação: o literal `<!--/` em fonte mata a rota no
  // Turbopack (404 silencioso, sem erro de build) — mesma armadilha de 17/07.
  const abre = `<` + `!--fayai:cap-\\d+--` + `>`;
  const fecha = `<` + `!--/fayai:cap-\\d+--` + `>`;
  return markdown.replace(new RegExp(`${abre}[\\s\\S]*?${fecha}\\n*`, 'g'), '');
}
