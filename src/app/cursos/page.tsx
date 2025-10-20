"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Search, Filter, SlidersHorizontal, Star, Clock, Users, DollarSign, 
  CheckCircle, TrendingUp, Award, BookOpen, Zap, Grid, List, ChevronRight 
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { allCourses, calculateDiscountPercentage } from "@/data/courses";

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedLevel, setSelectedLevel] = useState("Todos");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const categories = useMemo(() => [
    "Todas",
    ...Array.from(new Set(allCourses.map(c => c.category)))
  ], []);

  const levels = ["Todos", "Iniciante", "Intermediário", "Avançado", "Todos os níveis"];

  const filteredCourses = useMemo(() => {
    let filtered = allCourses.filter(course => {
      const matchesSearch = searchTerm === "" || 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.tool.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "Todas" || course.category === selectedCategory;
      const matchesLevel = selectedLevel === "Todos" || course.level.includes(selectedLevel) || course.level === "Todos os níveis";
      
      return matchesSearch && matchesCategory && matchesLevel;
    });

    // Sort courses
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "newest":
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case "popular":
        default:
          return b.students - a.students;
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, selectedLevel, sortBy]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-purple-900/20 to-black">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-4"
          >
            Cursos de IA e Automação
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-300 mb-8"
          >
            Domine as ferramentas mais poderosas do mercado com projetos práticos
          </motion.p>
          
          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-8 mb-8"
          >
            <div>
              <p className="text-3xl font-bold text-purple-400">
                {allCourses.reduce((sum, c) => sum + c.students, 0).toLocaleString()}+
              </p>
              <p className="text-gray-400">Alunos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">{allCourses.length}</p>
              <p className="text-gray-400">Cursos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">4.8</p>
              <p className="text-gray-400">Avaliação Média</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">
                {allCourses.reduce((sum, c) => sum + c.totalLessons, 0)}+
              </p>
              <p className="text-gray-400">Aulas</p>
            </div>
          </motion.div>
          
          {/* Search */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px] bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[150px] bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px] bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Mais Popular</SelectItem>
                  <SelectItem value="rating">Melhor Avaliado</SelectItem>
                  <SelectItem value="newest">Mais Recente</SelectItem>
                  <SelectItem value="price-low">Menor Preço</SelectItem>
                  <SelectItem value="price-high">Maior Preço</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-400">
                {filteredCourses.length} cursos encontrados
              </p>
              <div className="flex gap-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid size={18} />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid/List */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className={viewMode === "grid" 
            ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-6"
          }>
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/curso/${course.slug}`}>
                  <Card className={`group hover:border-purple-500 transition-all duration-300 overflow-hidden ${
                    viewMode === "list" ? "flex gap-6" : ""
                  }`}>
                    {/* Course Image/Header */}
                    <div className={`relative ${viewMode === "list" ? "w-48 shrink-0" : ""}`}>
                      <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 text-center">
                        <BookOpen className="mx-auto mb-2 text-white" size={32} />
                        <p className="text-white font-semibold">{course.tool}</p>
                      </div>
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-2">
                        {course.students > 5000 && (
                          <Badge className="bg-red-500 text-white">
                            <TrendingUp size={12} className="mr-1" />
                            Bestseller
                          </Badge>
                        )}
                        {new Date(course.lastUpdated).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 && (
                          <Badge className="bg-green-500 text-white">
                            <Zap size={12} className="mr-1" />
                            Novo
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Course Info */}
                    <div className="p-6 flex-1">
                      <div className="mb-2">
                        <Badge variant="outline" className="text-xs">
                          {course.category}
                        </Badge>
                      </div>
                      
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">
                        {course.title}
                      </h3>
                      
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {course.shortDescription}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Star className="text-yellow-400" size={16} />
                          <strong className="text-white">{course.rating}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={16} />
                          {course.students.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {course.duration}
                        </span>
                      </div>
                      
                      <Separator className="mb-4" />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          {course.originalPrice > course.price && (
                            <p className="text-gray-400 line-through text-sm">
                              R$ {course.originalPrice}
                            </p>
                          )}
                          <p className="text-2xl font-bold text-purple-400">
                            R$ {course.price}
                          </p>
                        </div>
                        <Button 
                          className="bg-purple-600 hover:bg-purple-700 group-hover:translate-x-1 transition-transform"
                        >
                          Ver Curso
                          <ChevronRight size={16} className="ml-1" />
                        </Button>
                      </div>
                      
                      {/* Discount Badge */}
                      {course.originalPrice > course.price && (
                        <div className="mt-3">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                            {calculateDiscountPercentage(course)}% OFF
                          </Badge>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          
          {filteredCourses.length === 0 && (
            <div className="text-center py-20">
              <p className="text-xl text-gray-400">Nenhum curso encontrado</p>
              <p className="text-gray-500 mt-2">Tente ajustar os filtros</p>
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
