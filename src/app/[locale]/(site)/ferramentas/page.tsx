"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Star, Tag, Layers, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fichasDoIdioma } from "@/data/tools-idioma";

// Build tools list from static data
type ToolEntry = {
  slug: string;
  name: string;
  category: string;
  vendor: string;
  pricing: string;
  rating: number;
  description: string;
  tags: string[];
};

/**
 * O valor de `pricing` e o de `category` sao DADO, nao rotulo: continuam em
 * portugues mesmo no site em ingles, porque sao o que o filtro compara por
 * igualdade. O que a pessoa le vem das mensagens. Traduzir a string aqui
 * zeraria o resultado do filtro.
 *
 * A excecao e `category`, que vem traduzida da ficha — por isso a lista de
 * categorias e derivada das fichas JA no idioma, e nao de uma tabela fixa.
 */
const VALORES_PRECO = ["Gratuito", "Freemium", "Open Source", "Pago"] as const;

/** Sentinela do "sem filtro". Nunca e exibido cru — vira `allCategories`. */
const TODOS = "__todos__";

export default function ToolsPage() {
  // Sem o prefixo, cada um dos 56 links da grade custa um 308 antes de abrir
  // a ficha da ferramenta. Ver [[reference_seo_armadilhas_locale]].
  const locale = useLocale();
  const t = useTranslations("ToolsDirectory");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(TODOS);
  const [pricing, setPricing] = useState<string>(TODOS);
  const [sortBy, setSortBy] = useState<string>("az");

  const tools: ToolEntry[] = useMemo(
    () =>
      fichasDoIdioma(locale).map((ferramenta) => ({
        slug: ferramenta.slug,
        name: (ferramenta as { title?: string }).title || ferramenta.slug,
        category: (ferramenta as { category?: string }).category || "IA",
        vendor: (ferramenta as { vendor?: string }).vendor || "",
        pricing: (ferramenta as { pricing?: string }).pricing || "Freemium",
        rating: (ferramenta as { rating?: number }).rating || 4.5,
        description: (ferramenta as { description?: string }).description || "",
        tags: ((ferramenta as { features?: string[] }).features || []).slice(0, 3),
      })),
    [locale],
  );

  const categories = useMemo(
    () => [TODOS, ...Array.from(new Set(tools.map((x) => x.category)))],
    [tools],
  );

  const filtered = useMemo(() => {
    const result = tools.filter(tool => {
      const matchesSearch = search === "" ||
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.vendor.toLowerCase().includes(search.toLowerCase()) ||
        tool.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = category === TODOS || tool.category === category;
      const matchesPricing = pricing === TODOS || tool.pricing === pricing;

      return matchesSearch && matchesCategory && matchesPricing;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "az") return a.name.localeCompare(b.name, locale);
      return 0;
    });
  }, [tools, search, category, pricing, sortBy, locale]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>

          {/*
            Ponte para os microcursos.
            Este diretório cobre as ferramentas consolidadas; os lançamentos da
            semana chegam primeiro em /inventando. Sem este link a seção nova
            só teria a entrada do menu — e é daqui que vem o visitante com a
            intenção certa.
          */}
          <Link
            href={`/${locale}/inventando`}
            className="group mb-8 flex flex-col gap-1 rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-5 py-4 transition-colors hover:border-amber-400/45 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <span>
              <span className="block text-sm font-semibold text-amber-200">
                {t("bridgeTitle")}
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {t("bridgeBody")}
              </span>
            </span>
            <span className="shrink-0 text-sm font-medium text-amber-200 group-hover:underline">
              {t("bridgeCta")} <ArrowRight className="inline h-4 w-4" />
            </span>
          </Link>

          {/* Controls */}
          <div className="bg-popover/50 backdrop-blur-sm rounded-lg p-6 mb-8 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    placeholder={t("searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-secondary border-border"
                  />
                </div>
              </div>

              {/* Category */}
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder={t("category")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>
                      {c === TODOS ? t("allCategories") : c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Pricing */}
              <Select value={pricing} onValueChange={setPricing}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder={t("price")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>{t("allPrices")}</SelectItem>
                  {VALORES_PRECO.map(p => (
                    <SelectItem key={p} value={p}>{t(`pricing.${p}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder={t("sort")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">{t("sortPopular")}</SelectItem>
                  <SelectItem value="rating">{t("sortRating")}</SelectItem>
                  <SelectItem value="az">{t("sortAz")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
              <Layers size={16} /> {t("found", { n: filtered.length })}
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((tool, i) => (
              <motion.div key={tool.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-6 border-border hover:bg-card/80 transition group h-full">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-xs">{tool.category}</Badge>
                    <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/40 text-xs">{t(`pricing.${tool.pricing}`)}</Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-1 group-hover:text-amber-400 transition">{tool.name}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{tool.description}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Star className="text-yellow-400" size={16} /> {tool.rating}</span>
                    <span className="text-muted-foreground">{t("vendor")} <span className="text-muted-foreground">{tool.vendor}</span></span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tool.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs border-amber-500/30 text-muted-foreground"><Tag size={12} className="mr-1" /> {tag}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/${locale}/ferramentas/${tool.slug}`} className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800">
                        {t("details")} <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/${locale}/cursos?search=${encodeURIComponent(tool.name)}`} className="flex-1">
                      <Button variant="outline" className="w-full border-amber-500 text-amber-400 hover:bg-amber-500/10">
                        {t("relatedCourses")}
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
