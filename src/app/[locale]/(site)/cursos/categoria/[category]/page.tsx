"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Clock, Users, Star, ChevronRight, Grid, List, Filter } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const allCourses = [
  { id: 1, title: "ChatGPT Masterclass: Do Zero ao Avançado", slug: "chatgpt-masterclass", category: "ia-generativa", level: "Todos", duration: "12 horas", students: 1234, rating: 4.9, price: 197, oldPrice: 397, description: "Domine o ChatGPT e transforme sua produtividade." },
  { id: 2, title: "Midjourney: Arte e Design com IA", slug: "midjourney-arte-design", category: "criacao-visual", level: "Intermediário", duration: "8 horas", students: 892, rating: 4.8, price: 147, oldPrice: 297, description: "Crie imagens impressionantes com Midjourney." },
  { id: 3, title: "Automação com n8n: Workflows Poderosos", slug: "automacao-n8n", category: "automacao", level: "Intermediário", duration: "16 horas", students: 567, rating: 4.9, price: 297, oldPrice: 497, description: "Automatize qualquer processo com n8n." },
  { id: 4, title: "Claude para Desenvolvedores", slug: "claude-desenvolvedores", category: "ia-generativa", level: "Avançado", duration: "10 horas", students: 423, rating: 5.0, price: 247, oldPrice: 397, description: "Assistente perfeito para devs." },
  { id: 5, title: "Perplexity: Pesquisa Avançada com IA", slug: "perplexity-pesquisa", category: "pesquisa-analise", level: "Iniciante", duration: "4 horas", students: 1567, rating: 4.8, price: 67, oldPrice: 147, description: "Pesquisa com fontes em tempo real." },
];

const categoryMap: Record<string, string> = {
  "ia-generativa": "IA Generativa",
  "criacao-visual": "Criação Visual",
  "automacao": "Automação",
  "agentes-ia": "Agentes de IA",
  "pesquisa-analise": "Pesquisa e Análise",
  "ia-negocios": "IA para Negócios",
};

export default function CoursesByCategoryPage() {
  const params = useParams<{ category: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const pageTitle = categoryMap[params.category] ?? params.category.replace(/-/g, " ");

  const filtered = useMemo(() => {
    const base = allCourses.filter((c) => c.category === params.category);
    const searched = base.filter((c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const sorted = [...searched].sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "students") return b.students - a.students;
      return 0;
    });
    return sorted;
  }, [params.category, searchTerm, sortBy]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">{pageTitle}</h1>
            <p className="text-gray-400">Cursos organizados por categoria</p>
          </div>

          <div className="bg-popover/50 backdrop-blur-sm rounded-lg p-6 mb-8 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    placeholder="Buscar nesta categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-input border-border"
                  />
                </div>
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Mais Popular</SelectItem>
                  <SelectItem value="rating">Melhor Avaliado</SelectItem>
                  <SelectItem value="price-low">Menor Preço</SelectItem>
                  <SelectItem value="price-high">Maior Preço</SelectItem>
                  <SelectItem value="students">Mais Alunos</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-end gap-2">
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
                  <Grid size={18} />
                </Button>
                <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
                  <List size={18} />
                </Button>
              </div>
            </div>
          </div>

          <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filtered.map((course, i) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/curso/${course.slug}`}>
                  <Card className={`bg-white/5 backdrop-blur border-white/10 hover:bg-white/10 transition overflow-hidden group cursor-pointer ${viewMode === "list" ? "flex" : ""}`}>
                    <div className={`${viewMode === "list" ? "w-64" : ""} relative`}>
                      <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Badge className="bg-black/40">{pageTitle}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 flex-1">
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-400 transition">{course.title}</h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                        <span className="flex items-center gap-1"><Clock size={16} />{course.duration}</span>
                        <span className="flex items-center gap-1"><Users size={16} />{course.students.toLocaleString("pt-BR")}</span>
                        <span className="flex items-center gap-1"><Star size={16} className="text-yellow-400" />{course.rating}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          {course.oldPrice && <span className="text-gray-500 line-through text-sm">R$ {course.oldPrice.toLocaleString("pt-BR")}</span>}
                          <span className="text-2xl font-bold ml-2">R$ {course.price.toLocaleString("pt-BR")}</span>
                        </div>
                        <ChevronRight className="text-gray-400 group-hover:text-purple-400 transition" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
