"use client";
import { useT } from "@/i18n/dicionario";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttractiveCourseCard } from "@/components/courses/AttractiveCourseCard";
import { ehDaCategoria } from "@/lib/categoria-de-curso";
import type { Product } from "@/lib/products";

/**
 * ⚠️ ESTA PÁGINA MOSTRAVA CINCO CURSOS QUE NÃO EXISTEM (até 26/08/2026)
 *
 * O arquivo trazia um array escrito à mão — "ChatGPT Masterclass" com 1.234
 * alunos e nota 4,9, "Midjourney: Arte e Design" com 892 alunos, "Perplexity"
 * com 1.567 —, preços de R$ 197 com R$ 397 riscado, e slugs que não existem no
 * catálogo: cada cartão levava a lugar nenhum. Seis links da `/descobrir`
 * apontavam para cá.
 *
 * Era a soma dos itens 3 e 4 do laudo (prova social inventada e preço de
 * referência nunca praticado) numa página que a varredura de 55 rotas não abriu,
 * porque é rota dinâmica.
 *
 * Agora lê o catálogo de verdade, e categoria sem curso diz que está sem curso.
 * O casamento está em `lib/categoria-de-curso.ts`, e é por SEGMENTO — comparar
 * por pedaço de palavra fazia a etiqueta `IA` casar com "cr-IA-cao visual".
 */

const categoryMap: Record<string, string> = {
  "ia-generativa": "IA Generativa",
  "criacao-visual": "Criação Visual",
  automacao: "Automação",
  "agentes-ia": "Agentes de IA",
  "pesquisa-analise": "Pesquisa e Análise",
  "ia-negocios": "IA para Negócios",
};

export default function CoursesByCategoryPage() {
  const T = useT();
  const params = useParams<{ category: string }>();
  const locale = useLocale();
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("novidade");

  useEffect(() => {
    let vivo = true;
    fetch(`/api/products?type=course&limit=200&locale=${locale}`)
      .then((r) => r.json())
      .then((d) => {
        if (vivo) setProdutos(d.products || []);
      })
      .catch(() => {
        if (vivo) setProdutos([]);
      })
      .finally(() => {
        if (vivo) setCarregando(false);
      });
    return () => {
      vivo = false;
    };
  }, [locale]);

  const pageTitle = categoryMap[params.category] ?? params.category.replace(/-/g, " ");

  const filtrados = useMemo(() => {
    const busca = searchTerm.trim().toLowerCase();
    const base = produtos
      .filter((p) => ehDaCategoria(p, params.category))
      .filter(
        (p) =>
          !busca ||
          (p.name || "").toLowerCase().includes(busca) ||
          (p.copy?.shortDescription || "").toLowerCase().includes(busca),
      );
    /**
     * ⚠️ Sem "mais popular" e sem "melhor avaliado": aluno e nota são ZERO no
     * catálogo inteiro desde o item 3 do laudo, e ordenar por um campo que só
     * tem zeros é uma ordenação falsa com cara de verdadeira.
     */
    return [...base].sort((a, b) => {
      if (sortBy === "preco-menor") return a.pricing.price - b.pricing.price;
      if (sortBy === "preco-maior") return b.pricing.price - a.pricing.price;
      if (sortBy === "maior") return (b.contentChapters ?? 0) - (a.contentChapters ?? 0);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [produtos, params.category, searchTerm, sortBy]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">{T(pageTitle)}</h1>
            <p className="text-muted-foreground">
              {carregando
                ? T("Carregando o catálogo…")
                : `${filtrados.length} ${filtrados.length === 1 ? T("curso") : T("cursos")}`}
            </p>
          </div>

          <div className="bg-popover/50 backdrop-blur-sm rounded-lg p-6 mb-8 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    placeholder={T("Buscar nesta categoria...")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-input border-border"
                  />
                </div>
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger aria-label={T("Ordenar por")} className="bg-input border-border">
                  <SelectValue placeholder={T("Ordenar por")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novidade">{T("Atualizado por último")}</SelectItem>
                  <SelectItem value="maior">{T("Mais capítulos")}</SelectItem>
                  <SelectItem value="preco-menor">{T("Menor preço")}</SelectItem>
                  <SelectItem value="preco-maior">{T("Maior preço")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filtrados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtrados.map((p, i) => (
                <AttractiveCourseCard key={p.slug} product={p} index={i} />
              ))}
            </div>
          ) : (
            !carregando && (
              /* Categoria vazia diz que está vazia — e oferece o caminho que
                 tem curso. O contrário disto era inventar cinco. */
              <div className="mx-auto max-w-md rounded-2xl border border-border bg-card/60 p-8 text-center">
                <p className="text-lg font-semibold mb-2">
                  {T("Ainda não há curso nesta categoria.")}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {T("O catálogo cresce todo mês — enquanto isso, o resto está aqui.")}
                </p>
                <Button asChild>
                  <Link href="/cursos">{T("Ver todos os cursos")}</Link>
                </Button>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
