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
  /**
   * Número que o ALUNO vê. `null` quando o bloco não é capítulo — o primeiro
   * `# ` de vários cursos é o título do curso, não a aula 1.
   *
   * O `indice` continua sendo a posição crua e NÃO pode mudar: é a chave que
   * liga `UserCourseLayer.capitulo` ao bloco na hora de injetar. Filtrar o
   * preâmbulo aqui deslocaria todas as camadas já gravadas dos alunos.
   */
  numero: number | null;
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
  const blocos = markdown
    .replace(/\r\n/g, '\n')
    .split(SPLIT_CAPITULO)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((corpo, indice) => ({
      indice,
      titulo: (corpo.split('\n')[0] || '').replace(/^#\s+/, '').trim(),
      corpo,
      numero: null as number | null,
    }))
    .filter((c) => !!c.titulo);

  // Quando o curso numera os capítulos ("# Capítulo 7: ..."), só esses são
  // aula — o resto é capa. Sem isso o preâmbulo virava "CAPÍTULO 1" no prompt
  // e empurrava a numeração de todos os outros em um.
  const numerados = blocos.filter((b) => /^Cap[íi]tulo\s+\d+/i.test(b.titulo));
  if (numerados.length) {
    for (const b of blocos) {
      const m = b.titulo.match(/^Cap[íi]tulo\s+(\d+)/i);
      b.numero = m ? Number(m[1]) : null;
    }
  } else {
    blocos.forEach((b, i) => {
      b.numero = i + 1;
    });
  }

  return blocos;
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

/* ──────────────────────────────────────────────────────────────────────────
 * A JANELA QUE A CAMADA VÊ, E O QUE FAZ ELA ENVELHECER (19/08/2026)
 *
 * Até hoje as duas coisas eram a mesma: `corpo.slice(0, 2600)` servia de
 * trecho para o modelo E de base do hash. As duas estavam erradas, cada uma
 * do seu jeito, e o defeito é mudo nos dois casos.
 *
 * **Como base de hash**, a janela mede o pedaço errado do capítulo. Consertar
 * os cinco passos do Fluxo de Execução, os Erros Comuns, o Exercício ou o
 * Resumo não muda os primeiros 2.600 de ~8.000 caracteres: a camada NÃO
 * regenera e o aluno continua lendo uma abertura escrita para um capítulo que
 * não existe mais. E o inverso é pior: inserir um marcador de mídia — que não
 * é conteúdo — muda esses 2.600 e manda regerar a camada de todo mundo. Medido
 * em `ia-para-criar-videos`: **19,9% da janela era marcador**.
 *
 * **Como trecho para o modelo**, o corte cego em 2.600 entrega Visão Geral e
 * Conceitos-Chave e esconde da personalização tudo da seção 4 em diante — os
 * cenários, o exercício, o checklist. A camada fala do capítulo pela metade
 * porque só viu metade.
 *
 * Daí os dois nomes abaixo, e a divisão de trabalho entre eles:
 *
 *   `impressaoDoCapitulo` → o capítulo INTEIRO, sem marcador. Texto envelhece
 *                           camada; mídia não.
 *   `digestDoCapitulo`    → um resumo estruturado dentro do mesmo orçamento de
 *                           caracteres, com pedaço de todas as seções.
 *
 * ⚠️ Trocar a base do hash força UMA regeração das camadas que já existem
 * (5 cursos, 122 capítulos em 19/08). É o preço de uma vez só — por isso vem
 * ANTES da onda de reescrita, não depois.
 * ────────────────────────────────────────────────────────────────────────── */

const ABRE_COMENTARIO = '<' + '!--';
const FECHA_COMENTARIO = '--' + '>';

/**
 * Tira o que não é conteúdo: marcador de mídia e bloco de camada injetada.
 *
 * ⚠️ O padrão é montado por concatenação de propósito. O literal `<!--/` no
 * fonte mata a rota no Turbopack — 404 silencioso, sem erro de build. Mesma
 * armadilha de 17/07, e o `removerCamadas` acima já convive com ela.
 */
export function semMarcadores(corpo: string): string {
  const comentario = new RegExp(
    ABRE_COMENTARIO + String.raw`\s*\/?(?:media|fayai):[\s\S]*?` + FECHA_COMENTARIO,
    'g'
  );
  return corpo
    .replace(comentario, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** A impressão que decide se a camada envelheceu: capítulo inteiro, sem mídia. */
export function impressaoDoCapitulo(corpo: string, impressao: (t: string) => string): string {
  return impressao(semMarcadores(corpo));
}

const primeiraFrase = (p: string) => {
  const t = p.trim().replace(/\s+/g, ' ');
  const m = t.match(/^.{20,240}?[.!?](?=\s|$)/);
  return m ? m[0] : t.slice(0, 240);
};

/**
 * O capítulo comprimido para caber no prompt sem esconder metade dele.
 *
 * Mantém a Visão Geral inteira (é o enquadramento do problema, e é dela que
 * sai a abertura), a primeira frase de cada parágrafo de Conceitos-Chave, os
 * passos do Fluxo de Execução (é o que a tarefa do aluno vai espelhar), o
 * primeiro cenário e o Exercício inteiro — que é a única seção com critério
 * de pronto, e a que a `tarefa` personalizada tem de substituir sem piorar.
 *
 * Capítulo fora do padrão editorial (sem `## `) cai no corte cego de antes:
 * é o comportamento certo para os cursos de capítulo temático, que ainda não
 * têm as nove seções.
 */
export function digestDoCapitulo(corpo: string, teto = 2600): string {
  const limpo = semMarcadores(corpo);
  const linhas = limpo.split('\n');
  const titulo = (linhas[0] || '').startsWith('# ') ? linhas[0].trim() : '';

  const secoes = new Map<string, string>();
  let atual: string | null = null;
  const acumulado: string[] = [];
  const fechar = () => {
    if (atual) secoes.set(atual, acumulado.join('\n').trim());
    acumulado.length = 0;
  };
  for (const linha of linhas) {
    const m = linha.match(/^##\s+(.+?)\s*$/);
    if (m) {
      fechar();
      atual = m[1].toLowerCase();
    } else if (atual) {
      acumulado.push(linha);
    }
  }
  fechar();
  if (!secoes.size) return limpo.slice(0, teto);

  const pega = (chave: string) => {
    for (const [nome, texto] of secoes) if (nome.includes(chave)) return texto;
    return '';
  };
  const paragrafos = (t: string) => t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  const visao = pega('visão geral') || pega('visao geral');
  const conceitos = paragrafos(pega('conceitos')).map((p) => primeiraFrase(p).slice(0, 200));
  // Do passo interessa o VERBO e o objeto. O passo inteiro tem ~300 caracteres
  // e cinco deles sozinhos empurram Cenários e Exercício para fora do teto —
  // medido: com o passo inteiro o digest de `ia-para-estudar/cap07` perdia as
  // duas seções que mais ajudam a escrever a tarefa do aluno.
  const passos = pega('fluxo')
    .split('\n')
    .filter((l) => /^\s*(\d+[.)]|[-*])\s+/.test(l))
    .map((l) => primeiraFrase(l).slice(0, 130));
  const cenario = (paragrafos(pega('cenários') || pega('cenarios'))[0] || '').slice(0, 600);
  const exercicio = pega('exercício') || pega('exercicio');

  // Ordem de documento na saída, ordem de PRIORIDADE no corte: o que o modelo
  // não pode perder é o enquadramento (Visão Geral) e a entrega (Exercício).
  const pecas = [
    { pos: 0, prio: 0, txt: titulo },
    { pos: 1, prio: 1, txt: visao && `## Visão Geral\n${visao}` },
    { pos: 2, prio: 3, txt: conceitos.length && `## Conceitos-Chave\n${conceitos.join('\n')}` },
    { pos: 3, prio: 4, txt: passos.length && `## Fluxo de Execução\n${passos.join('\n')}` },
    { pos: 4, prio: 5, txt: cenario && `## Cenários Aplicados\n${cenario}` },
    { pos: 5, prio: 2, txt: exercicio && `## Exercício Prático\n${exercicio}` },
  ].filter((p) => typeof p.txt === 'string' && p.txt.length > 0) as {
    pos: number; prio: number; txt: string;
  }[];

  const juntar = (lista: typeof pecas) =>
    lista.slice().sort((a, b) => a.pos - b.pos).map((p) => p.txt).join('\n\n');

  let escolhidas = pecas;
  while (juntar(escolhidas).length > teto && escolhidas.length > 1) {
    const pior = escolhidas.reduce((a, b) => (b.prio > a.prio ? b : a));
    escolhidas = escolhidas.filter((p) => p !== pior);
  }
  return juntar(escolhidas).slice(0, teto);
}
