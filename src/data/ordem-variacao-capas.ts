/**
 * A ordem em que os cursos NÃO destacados entram no trilho da home.
 *
 * ## O problema
 *
 * O trilho mostrava só os 6 cursos marcados como `featured`. Com 22 cursos
 * ativos no catálogo, ele dava a volta rápido demais e o visitante via o mesmo
 * livro três vezes antes de acabar de rolar — parecia um catálogo pequeno.
 *
 * ## Por que esta ordem, e não alfabética ou por preço
 *
 * O pedido foi "dê preferência a títulos que têm maior variação na capa". Isso
 * dá para medir em vez de chutar: cada capa foi reduzida à faixa onde o livro
 * está (os 720px centrais, fora das tarjas borradas), virou uma grade 8×6 de
 * médias RGB, e daí saiu uma distância entre capas.
 *
 * A escolha é por **ponto mais distante**: começando pelos 6 destaques, entra
 * sempre o curso cuja capa está mais longe de TUDO que já entrou. O efeito é que
 * as primeiras rolagens mostram couro marrom, navy, o escudo, a paleta — e não
 * seis livros azul-escuros em sequência.
 *
 * Os 6 `featured` continuam na frente e intocados: são os cursos reescritos do
 * zero, e a seção promete exatamente isso.
 *
 * ⚠️ Só entram cursos ATIVOS. Quatro dos mais distintos visualmente
 * (`automacao-n8n`, `midjourney-masterclass`, `mastering-ai-with-chatgpt`,
 * `perplexity-...-instantaneo`) são rascunho e ficaram de fora — capa bonita não
 * é motivo para anunciar curso que não está publicado.
 *
 * Recalcular quando entrarem capas novas: a receita está descrita acima.
 */
export const ORDEM_POR_VARIACAO_DE_CAPA: string[] = [
  "claude-ia-segura",
  "make-integracao-total",
  "n8n-automacao-avancada",
  "perplexity-pesquisa-inteligente",
  "prompt-engineering",
  "leonardo-ai-criacao-visual",
  "ia-sem-filtro-por-claude",
  "midjourney-arte-profissional",
  "crie-agentes-de-ia-autonomos",
  "openclaw-ia-open-source",
  "autoresearch-singularity",
  "chatgpt-allowlisting",
  "gemini-ia-google",
  "chatgpt-masterclass",
  "ia-producao",
  "claude-cowork-colaboracao",
];
