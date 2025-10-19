"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Filter, 
  Search, 
  Clock, 
  Users, 
  Star, 
  BookOpen,
  ChevronRight,
  Grid,
  List
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const courses = [
  {
    id: 1,
    title: "ChatGPT Masterclass: Do Zero ao Avançado",
    slug: "chatgpt-masterclass",
    instructor: "Ricardo Faya",
    level: "Todos os níveis",
    duration: "12 horas",
    students: 1234,
    rating: 4.9,
    price: 197,
    oldPrice: 397,
    thumbnail: "/courses/chatgpt.jpg",
    category: "IA Generativa",
    description: "Domine o ChatGPT e transforme sua produtividade. Aprenda prompts avançados, automação e integração com outras ferramentas.",
    isBestseller: true,
    isNew: false,
  },
  {
    id: 2,
    title: "Midjourney: Arte e Design com IA",
    slug: "midjourney-arte-design",
    instructor: "Ricardo Faya",
    level: "Intermediário",
    duration: "8 horas",
    students: 892,
    rating: 4.8,
    price: 147,
    oldPrice: 297,
    thumbnail: "/courses/midjourney.jpg",
    category: "Criação Visual",
    description: "Crie imagens impressionantes com Midjourney. Do básico ao avançado, incluindo styles, parameters e técnicas profissionais.",
    isBestseller: true,
    isNew: false,
  },
  {
    id: 3,
    title: "Automação com n8n: Workflows Poderosos",
    slug: "automacao-n8n",
    instructor: "Ricardo Faya",
    level: "Intermediário",
    duration: "16 horas",
    students: 567,
    rating: 4.9,
    price: 297,
    oldPrice: 497,
    thumbnail: "/courses/n8n.jpg",
    category: "Automação",
    description: "Automatize qualquer processo com n8n. Integre APIs, crie workflows complexos e economize dezenas de horas por semana.",
    isBestseller: false,
    isNew: true,
  },
  {
    id: 4,
    title: "Claude para Desenvolvedores",
    slug: "claude-desenvolvedores",
    instructor: "Ricardo Faya",
    level: "Avançado",
    duration: "10 horas",
    students: 423,
    rating: 5.0,
    price: 247,
    oldPrice: 397,
    thumbnail: "/courses/claude.jpg",
    category: "IA Generativa",
    description: "Aprenda a usar Claude para programação, debugging e arquitetura de software. O assistente perfeito para devs.",
    isBestseller: false,
    isNew: true,
  },
  {
    id: 5,
    title: "ElevenLabs: Voz e Áudio com IA",
    slug: "elevenlabs-voz-audio",
    instructor: "Ricardo Faya",
    level: "Iniciante",
    duration: "6 horas",
    students: 789,
    rating: 4.7,
    price: 97,
    oldPrice: 197,
    thumbnail: "/courses/elevenlabs.jpg",
    category: "Áudio e Voz",
    description: "Clone vozes, crie narrações profissionais e dublagems com IA. Perfeito para creators e produtores de conteúdo.",
    isBestseller: false,
    isNew: false,
  },
  {
    id: 6,
    title: "Perplexity: Pesquisa Avançada com IA",
    slug: "perplexity-pesquisa",
    instructor: "Ricardo Faya",
    level: "Iniciante",
    duration: "4 horas",
    students: 1567,
    rating: 4.8,
    price: 67,
    oldPrice: 147,
    thumbnail: "/courses/perplexity.jpg",
    category: "Pesquisa e Análise",
    description: "Domine a arte da pesquisa com IA. Encontre informações precisas, com fontes confiáveis e em tempo real.",
    isBestseller: true,
    isNew: false,
  },
];

const categories = [
  "Todos",
  "IA Generativa",
  "Criação Visual", 
  "Automação",
  "Áudio e Voz",
  "Pesquisa e Análise",
  "Agentes de IA",
  "Desenvolvimento",
  "Marketing",
  "Negócios",
];

const levels = ["Todos", "Iniciante", "Intermediário", "Avançado"];

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedLevel, setSelectedLevel] = useState("Todos");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || course.category === selectedCategory;
    const matchesLevel = selectedLevel === "Todos" || course.level.includes(selectedLevel);
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      case "students":
        return b.students - a.students;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Nossos Cursos
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-400"
            >
              Aprenda com projetos práticos e transforme sua carreira
            </motion.p>
          </div>

          {/* Filters Bar */}
          <div className="bg-popover/50 backdrop-blur-sm rounded-lg p-6 mb-8 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    type="text"
                    placeholder="Buscar cursos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-input border-border"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Level Filter */}
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
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
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-gray-400">
                {sortedCourses.length} cursos encontrados
              </p>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid size={18} />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List size={18} />
                </Button>
              </div>
            </div>
          </div>

          {/* Courses Grid/List */}
          <div className={viewMode === "grid" 
            ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {sortedCourses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/curso/${course.slug}`}>
                  <Card className={`backdrop-blur border-border hover:bg-card/80 transition-all duration-300 overflow-hidden group cursor-pointer ${
                    viewMode === "list" ? "flex" : ""
                  }`}>
                    {/* Thumbnail */}
                    <div className={`${viewMode === "list" ? "w-64" : ""} relative`}>
                      <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 relative">
                        {/* Placeholder for image */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen size={48} className="text-white/50" />
                        </div>
                      </div>
                      {course.isBestseller && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500 text-black">
                          Bestseller
                        </Badge>
                      )}
                      {course.isNew && (
                        <Badge className="absolute top-2 right-2 bg-green-500">
                          Novo
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1">
                      <div className="mb-2">
                        <Badge variant="outline" className="text-xs">
                          {course.category}
                        </Badge>
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-400 transition">
                        {course.title}
                      </h3>
                      
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={16} />
                          {course.students.toLocaleString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star size={16} className="text-yellow-400" />
                          {course.rating}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          {course.oldPrice && (
                            <span className="text-gray-500 line-through text-sm">
                              R$ {course.oldPrice}
                            </span>
                          )}
                          <span className="text-2xl font-bold ml-2">
                            R$ {course.price}
                          </span>
                        </div>
                        <ChevronRight className="text-gray-400 group-hover:text-purple-400 transition" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
            >
              Carregar Mais Cursos
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
