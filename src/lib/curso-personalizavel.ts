/**
 * Quais cursos podem passar pelo Ateliê — e o único que não pode.
 *
 * O Ateliê reescreve o curso na voz e no negócio de quem está lendo. Isso é a
 * melhor coisa que o FayAI faz, e vale para todo o catálogo **menos um**.
 *
 * `ia-sem-filtro-por-claude` é o livro escrito em primeira pessoa por uma IA. O
 * Ricardo leu de ponta a ponta, aprovou como está e foi explícito: *"o conteúdo
 * tá pronto, nisso a gente não mexe mais, é sagrado."* Um livro que se apresenta
 * como a voz de um autor específico não pode oferecer um botão que troca essa
 * voz pela do leitor — a oferta contradiz a obra.
 *
 * Por isso a exceção mora AQUI, num lugar só, e não espalhada por cada tela que
 * mostra o botão. Toda porta do Ateliê tem de passar por esta função: o card do
 * portal, a faixa do aluno na página de venda e a própria rota `/curso/<slug>/meu`.
 * Uma porta esquecida é o botão de volta.
 */
const NAO_PERSONALIZAVEIS = new Set(["ia-sem-filtro-por-claude"]);

export function podePersonalizar(slug: string): boolean {
  return !NAO_PERSONALIZAVEIS.has(slug);
}

/** Por que este curso não aceita Ateliê — para explicar no lugar do botão. */
export function motivoSemPersonalizacao(slug: string): string | null {
  if (slug === "ia-sem-filtro-por-claude") {
    return "Este livro foi escrito em primeira pessoa por uma IA e é publicado como ela o escreveu — sem reescrita.";
  }
  return null;
}
