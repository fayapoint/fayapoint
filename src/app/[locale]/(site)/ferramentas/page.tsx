"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Star, Tag, Layers, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toolsData } from "@/data/tools-complete";

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

const staticTools: ToolEntry[] = Object.entries(toolsData).map(([slug, tool]) => ({
  slug,
  name: (tool as { title?: string }).title || slug,
  category: (tool as { category?: string }).category || "IA",
  vendor: (tool as { vendor?: string }).vendor || "",
  pricing: (tool as { pricing?: string }).pricing || "Freemium",
  rating: (tool as { rating?: number }).rating || 4.5,
  description: (tool as { description?: string }).description || "",
  tags: ((tool as { features?: string[] }).features || []).slice(0, 3),
}));

export default function ToolsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("Todas");
  const [pricing, setPricing] = useState<string>("Todos");
  const [sortBy, setSortBy] = useState<string>("az");

  const categories = useMemo(() => ["Todas", ...Array.from(new Set(staticTools.map(t => t.category)))], []);
  const pricingOptions = ["Todos", "Gratuito", "Freemium", "Open Source", "Pago"];

  const filtered = useMemo(() => {
    const result = staticTools.filter(tool => {
      const matchesSearch = search === "" ||
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.vendor.toLowerCase().includes(search.toLowerCase()) ||
        tool.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = category === "Todas" || tool.category === category;
      const matchesPricing = pricing === "Todos" || tool.pricing === pricing;

      return matchesSearch && matchesCategory && matchesPricing;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "az") return a.name.localeCompare(b.name, "pt-BR");
      return 0;
    });
  }, [search, category, pricing, sortBy]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3">Diretório de Ferramentas de IA</h1>
            <p className="text-muted-foreground">Descubra, compare e aprenda as principais ferramentas de IA do mercado</p>
          </div>

          {/* Controls */}
          <div className="bg-popover/50 backdrop-blur-sm rounded-lg p-6 mb-8 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    placeholder="Buscar por nome, fornecedor ou tag..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-secondary border-border"
                  />
                </div>
              </div>

              {/* Category */}
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Pricing */}
              <Select value={pricing} onValueChange={setPricing}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Preço" />
                </SelectTrigger>
                <SelectContent>
                  {pricingOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Mais Popular</SelectItem>
                  <SelectItem value="rating">Melhor Avaliado</SelectItem>
                  <SelectItem value="az">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
              <Layers size={16} /> {filtered.length} ferramentas encontradas
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t, i) => (
              <motion.div key={t.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-6 border-border hover:bg-card/80 transition group h-full">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-xs">{t.category}</Badge>
                    <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/40 text-xs">{t.pricing}</Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-1 group-hover:text-amber-400 transition">{t.name}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{t.description}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Star className="text-yellow-400" size={16} /> {t.rating}</span>
                    <span className="text-muted-foreground">Fornecedor: <span className="text-muted-foreground">{t.vendor}</span></span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {t.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs border-amber-500/30 text-muted-foreground"><Tag size={12} className="mr-1" /> {tag}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/ferramentas/${t.slug}`} className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800">
                        Ver detalhes <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/cursos?search=${encodeURIComponent(t.name)}`} className="flex-1">
                      <Button variant="outline" className="w-full border-amber-500 text-amber-400 hover:bg-amber-500/10">
                        Cursos relacionados
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
