/**
 * Cada cena do capítulo volta para o parágrafo que ela ilustra.
 *
 * ## O que estava errado
 *
 * A arte dos cursos nunca foi "seis imagens do capítulo". `cursos/padrao.md`
 * registra, desde o primeiro piloto, que cada uma foi PEDIDA para um lugar:
 *
 *     sistema    → Conceitos-Chave        fluxo      → Fluxo de Execução (vídeo)
 *     intencao   → Conceitos-Chave        cenario    → Cenários Aplicados
 *     validacao  → Erros Comuns           dica       → Dica Pro (vídeo)
 *
 * O leitor recebia as seis já achatadas numa lista, desenhava uma grade de duas
 * colunas ANTES da primeira linha de texto e seguia. O capítulo abria com seis
 * ilustrações sem contexto e depois corria sete mil caracteres sem nenhuma.
 *
 * ## O que este arquivo faz
 *
 * Devolve o papel ao título de seção correspondente, para o leitor desenhar a
 * cena logo abaixo do `##` certo. É só isto — nenhum conteúdo muda.
 *
 * ⚠️ E NENHUM CONTEÚDO PODE MUDAR. O texto dos cinco cursos com audiobook está
 * amarrado ao áudio fala a fala: a lente destaca a frase que está tocando pelo
 * índice dela na linha do tempo. Inserir um marcador de imagem no Markdown
 * deslocaria falas e dessincronizaria o capítulo inteiro. Por isso a colocação
 * acontece na RENDERIZAÇÃO, e o Markdown continua byte a byte o mesmo.
 *
 * ## Título casa sem acento e em inglês
 *
 * O acervo tem capítulo em pt-BR e em /en, e nem todo capítulo antigo segue o
 * padrão à risca ("Erros Comuns" x "Erros comuns"). O casamento normaliza
 * acento e caixa, e cada seção aceita as variantes que existem no acervo — a
 * mesma lista que o `H2_SECTIONS` do leitor já usa para os ícones.
 */

/**
 * O mínimo que uma cena precisa ter para ser colocada: o papel.
 *
 * Deliberadamente estrutural, e não o `CenaLocal` do disco. O leitor trabalha
 * com `MediaAsset` (que vem do banco e tem `url` opcional), e as duas formas
 * têm de passar por aqui sem conversão — este módulo só lê `papel`, então
 * exigir a forma completa seria pedir garantia que ele não usa.
 */
export type CenaColocavel = { papel?: string };

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Papel → títulos de seção que o recebem, em ordem de preferência.
 *
 * A ordem DENTRO da lista não importa (é só casamento); a ordem das ENTRADAS
 * importa quando duas cenas disputam a mesma seção — ver `planoDeCenas`.
 */
const DESTINO: Record<string, string[]> = {
  sistema: ["Conceitos-Chave", "Conceitos Chave", "Key Concepts"],
  intencao: ["Conceitos-Chave", "Conceitos Chave", "Key Concepts"],
  fluxo: ["Fluxo de Execução", "Fluxo de Execucao", "Execution Flow", "Execution Workflow"],
  cenario: ["Cenários Aplicados", "Cenarios Aplicados", "Applied Scenarios"],
  validacao: ["Erros Comuns", "Common Mistakes", "Common Errors"],
  // `dica` ilustra a Dica Pro, que no padrão é uma CITAÇÃO e não um `##`. Sem
  // título próprio para pendurar, ela vai no Exercício Prático — a seção
  // seguinte, e a única que fala de fazer em vez de entender.
  dica: ["Exercício Prático", "Exercicio Pratico", "Practical Exercise", "Hands-On Exercise"],
  checklist: ["Checklist de Implementação", "Checklist de Implementacao", "Implementation Checklist"],
  planos: ["Resumo do Capítulo", "Resumo do Capitulo", "Chapter Summary"],
};

export type PlanoDeCenas<C extends CenaColocavel = CenaColocavel> = {
  /** título de seção normalizado → cenas que vão logo abaixo dele */
  porSecao: Map<string, C[]>;
  /** o que não achou seção — continua aparecendo, no fim do capítulo */
  sobras: C[];
};

/**
 * Distribui as cenas do capítulo pelas seções que ele realmente tem.
 *
 * `titulos` são os `##` do capítulo, na ordem em que aparecem. Uma cena cuja
 * seção não existe naquele capítulo NÃO some: vai para `sobras`, e o leitor a
 * desenha no fim. Capítulo fora do padrão continua mostrando toda a arte.
 */
export function planoDeCenas<C extends CenaColocavel>(cenas: C[], titulos: string[]): PlanoDeCenas<C> {
  const existentes = new Set(titulos.map(normalizar));
  const porSecao = new Map<string, C[]>();
  const sobras: C[] = [];

  for (const cena of cenas) {
    const papel = cena.papel;
    const alvos = papel ? DESTINO[papel] : undefined;
    const achou = alvos?.map(normalizar).find((t) => existentes.has(t));
    if (!achou) {
      sobras.push(cena);
      continue;
    }
    porSecao.set(achou, [...(porSecao.get(achou) ?? []), cena]);
  }

  return { porSecao, sobras };
}

/** As cenas que vão abaixo deste título, se houver. */
export function cenasDaSecao<C extends CenaColocavel>(plano: PlanoDeCenas<C> | null, titulo: string): C[] {
  if (!plano) return [];
  return plano.porSecao.get(normalizar(titulo)) ?? [];
}

/** Os `##` de um Markdown, na ordem. */
export function titulosDeSecao(markdown: string): string[] {
  const achados: string[] = [];
  for (const linha of markdown.split("\n")) {
    const m = linha.match(/^##\s+(.+?)\s*$/);
    if (m) achados.push(m[1].replace(/[*_`]/g, "").trim());
  }
  return achados;
}
