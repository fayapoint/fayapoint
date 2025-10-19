"use client";

import { useMemo, useState } from "react";
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

const tools = [
  { title: "ChatGPT", slug: "chatgpt", category: "IA Conversacional", vendor: "OpenAI", pricing: "Freemium", rating: 4.9, tags: ["texto","assistente","code"], popularity: 100, description: "Assistente conversacional poderoso para texto, código e automação." },
  { title: "Claude", slug: "claude", category: "IA Conversacional", vendor: "Anthropic", pricing: "Freemium", rating: 4.9, tags: ["texto","longo","segurança"], popularity: 95, description: "IA focada em segurança e contexto extenso, ótima para devs." },
  { title: "Gemini", slug: "gemini", category: "IA Conversacional", vendor: "Google", pricing: "Gratuito", rating: 4.7, tags: ["google","multimodal"], popularity: 85, description: "IA multimodal com forte integração no ecossistema Google." },
  { title: "Perplexity", slug: "perplexity", category: "Pesquisa", vendor: "Perplexity", pricing: "Freemium", rating: 4.8, tags: ["pesquisa","fontes"], popularity: 90, description: "Pesquisa com fontes em tempo real e ótima curadoria." },
  { title: "Midjourney", slug: "midjourney", category: "Imagem", vendor: "Midjourney", pricing: "Pago", rating: 4.8, tags: ["arte","imagem"], popularity: 98, description: "Gere arte e imagens profissionais com prompts avançados." },
  { title: "DALL-E", slug: "dalle", category: "Imagem", vendor: "OpenAI", pricing: "Pago", rating: 4.6, tags: ["imagem","geração"], popularity: 80, description: "Geração de imagens integrada ao ecossistema OpenAI." },
  { title: "Stable Diffusion", slug: "stable-diffusion", category: "Imagem", vendor: "Stability AI", pricing: "Open Source", rating: 4.6, tags: ["open-source","difusão"], popularity: 75, description: "Modelo de imagem open-source altamente personalizável." },
  { title: "Leonardo AI", slug: "leonardo", category: "Imagem", vendor: "Leonardo", pricing: "Freemium", rating: 4.7, tags: ["imagem","fotos"], popularity: 70, description: "Imagens de alta qualidade com presets prontos e fácil uso." },
  { title: "n8n", slug: "n8n", category: "Automação", vendor: "n8n", pricing: "Open Source", rating: 4.8, tags: ["automação","workflows"], popularity: 92, description: "Automação poderosa com nós, webhooks e integrações." },
  { title: "Make", slug: "make", category: "Automação", vendor: "Make", pricing: "Pago", rating: 4.5, tags: ["integração","automação"], popularity: 65, description: "Crie fluxos com centenas de integrações visuais." },
  { title: "Zapier", slug: "zapier", category: "Automação", vendor: "Zapier", pricing: "Pago", rating: 4.4, tags: ["automação","integração"], popularity: 60, description: "Automação simples e popular para apps SaaS." },
  { title: "Flowise", slug: "flowise", category: "Low-code", vendor: "Flowise", pricing: "Open Source", rating: 4.6, tags: ["low-code","chatbot"], popularity: 68, description: "Crie chatbots e pipelines de LLMs com interface visual." },
];

export default function ToolsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("Todas");
  const [pricing, setPricing] = useState<string>("Todos");
  const [sortBy, setSortBy] = useState<string>("popular");

  const categories = useMemo(() => ["Todas", ...Array.from(new Set(tools.map(t => t.category)))], []);
  const pricingOptions = ["Todos", "Gratuito", "Freemium", "Open Source", "Pago"];

  const filtered = useMemo(() => {
    const base = tools.filter(t =>
      (category === "Todas" || t.category === category) &&
      (pricing === "Todos" || t.pricing === pricing) &&
      (
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.vendor.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      )
    );
    return [...base].sort((a, b) => {
      if (sortBy === "popular") return b.popularity - a.popularity;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "az") return a.title.localeCompare(b.title, "pt-BR");
      return 0;
    });
  }, [search, category, pricing, sortBy]);

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
                    <Badge variant="outline" className="text-xs">{t.category}</Badge>
                    <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/40 text-xs">{t.pricing}</Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-1 group-hover:text-purple-400 transition">{t.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{t.description}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1"><Star className="text-yellow-400" size={16} /> {t.rating}</span>
                    <span className="text-gray-500">Fornecedor: <span className="text-gray-300">{t.vendor}</span></span>
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
                    <Link href={`/cursos?search=${encodeURIComponent(t.title)}`} className="flex-1">
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
