"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Filter, Star, Tag, Layers, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


import type { Product } from "@/lib/products";

export default function ToolsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("Todas");
  const [pricing, setPricing] = useState<string>("Todos");
  const [sortBy, setSortBy] = useState<string>("popular");

  useEffect(() => {
    async function fetchTools() {
      try {
        const response = await fetch('/api/products?type=tool');
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching tools:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTools();
  }, []);

  const categories = useMemo(() => ["Todas", ...Array.from(new Set(products.map(p => p.categoryPrimary)))], [products]);
  const pricingOptions = ["Todos", "Gratuito", "Freemium", "Open Source", "Pago"];

  const filtered = useMemo(() => {
    const filtered = products.filter(product => {
      const matchesSearch = search === "" || 
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.tool.toLowerCase().includes(search.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      
      const matchesCategory = category === "Todas" || product.categoryPrimary === category;
      const matchesPricing = pricing === "Todos" || product.pricing.price === 0 && pricing === "Gratuito" || product.pricing.price > 0 && pricing === "Pago";
      
      return matchesSearch && matchesCategory && matchesPricing;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "popular") return b.metrics.students - a.metrics.students;
      if (sortBy === "rating") return b.metrics.rating - a.metrics.rating;
      if (sortBy === "az") return a.name.localeCompare(b.name, "pt-BR");
      return 0;
    });
  }, [products, search, category, pricing, sortBy]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3">Diretório de Ferramentas de IA</h1>
            <p className="text-gray-400">Descubra, compare e aprenda as principais ferramentas de IA do mercado</p>
          </div>

          {/* Controls */}
          <div className="bg-popover/50 backdrop-blur-sm rounded-lg p-6 mb-8 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    placeholder="Buscar por nome, fornecedor ou tag..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              {/* Category */}
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Pricing */}
              <Select value={pricing} onValueChange={setPricing}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Preço" />
                </SelectTrigger>
                <SelectContent>
                  {pricingOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Mais Popular</SelectItem>
                  <SelectItem value="rating">Melhor Avaliado</SelectItem>
                  <SelectItem value="az">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 text-sm text-gray-400 flex items-center gap-2">
              <Layers size={16} /> {filtered.length} ferramentas encontradas
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t, i) => (
              <motion.div key={t.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-6 border-border hover:bg-card/80 transition group h-full">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-xs">{t.categoryPrimary}</Badge>
                    <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/40 text-xs">{t.pricing.price > 0 ? 'Pago' : 'Gratuito'}</Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-1 group-hover:text-purple-400 transition">{t.name}</h3>
                  <p className="text-gray-400 text-sm mb-3">{t.copy.shortDescription}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1"><Star className="text-yellow-400" size={16} /> {t.metrics.rating}</span>
                    <span className="text-gray-500">Fornecedor: <span className="text-gray-300">{t.tool}</span></span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {t.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs border-purple-500/30 text-gray-300"><Tag size={12} className="mr-1" /> {tag}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/ferramentas/${t.slug}`} className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        Ver detalhes <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/cursos?search=${encodeURIComponent(t.name)}`} className="flex-1">
                      <Button variant="outline" className="w-full border-purple-500 text-purple-400 hover:bg-purple-500/10">
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
      <Footer />
    </div>
  );
}
