import type { Product } from "@/lib/products";

/**
 * Casar um curso com uma categoria da vitrine — sem inventar catálogo.
 *
 * ## Por que isto existe (26/08/2026)
 *
 * `/cursos/categoria/<slug>` renderizava **cinco cursos INVENTADOS**, escritos
 * à mão dentro do próprio arquivo: "ChatGPT Masterclass" com 1.234 alunos e
 * nota 4,9, "Midjourney: Arte e Design" com 892 alunos, preços de R$ 197 com
 * R$ 397 riscado — e slugs que não existem, então cada card levava a lugar
 * nenhum. Seis links da `/descobrir` apontavam para lá.
 *
 * Era a soma dos itens 3 e 4 do laudo (prova social inventada e preço de
 * referência que nunca foi praticado) numa página que ninguém tinha aberto.
 *
 * ## A taxonomia do banco é inconsistente, e isto não esconde isso
 *
 * `categoryPrimary` tem, hoje: "IA Generativa" (6), "Iniciante" (6),
 * "Automação" (2), "Criação Visual" (2), "Inteligência Artificial" (2),
 * "Avançado" (2), "Pesquisa e Análise" (1), "SEO para IA" (1). Metade são
 * NÍVEL, não assunto — "Iniciante" não é categoria.
 *
 * O casamento abaixo é tolerante de propósito (sem acento, sem conectivo, e
 * também pelas `tags`), para que curso nenhum fique inalcançável enquanto a
 * taxonomia não é arrumada. O que ele NÃO faz é preencher a tela com curso que
 * não existe: categoria vazia é categoria vazia.
 */

/** Sem acento, minúsculo, com hífen — e sem os conectivos que só atrapalham. */
export function normalizar(texto: string): string {
  return (texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\b(e|de|da|do|para|com|a|o)\b/g, " ")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Os pedaços que valem para casar — sem os de duas letras.
 *
 * ⚠️ Comparar por SUBSTRING aqui é desastre, e eu fiz: `"criacao-visual"`
 * contém `"ia"` (em "cr-IA-cao"), então a etiqueta `IA` casava com criação
 * visual e a contagem saiu inflada em quase todas as categorias. É a mesma lei
 * do `startsWith("/api")` que tratava `/api-docs` como rota de API: **casar por
 * segmento, nunca por pedaço de palavra.**
 */
const segmentos = (texto: string) =>
  normalizar(texto)
    .split("-")
    .filter((t) => t.length >= 3);

export function ehDaCategoria(produto: Product, slug: string): boolean {
  const alvo = segmentos(slug);
  if (!alvo.length) return false;
  const campos = [
    produto.categoryPrimary,
    produto.categorySecondary,
    ...(produto.tags ?? []),
  ];
  return campos.some((c) => {
    const seg = segmentos(String(c ?? ""));
    if (!seg.length) return false;
    // Casa quando todo pedaço significativo do alvo está no campo.
    return alvo.every((t) => seg.includes(t));
  });
}

export function contarPorCategoria(produtos: Product[], slug: string): number {
  return produtos.filter((p) => ehDaCategoria(p, slug)).length;
}
