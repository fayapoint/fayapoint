"use client";

import { useState, useMemo, useEffect } from "react";
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
import type { Product } from "@/lib/products";
import { AttractiveCourseCard } from "@/components/courses/AttractiveCourseCard";

export default function CoursesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedLevel, setSelectedLevel] = useState("Todos");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch products from MongoDB on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products?type=course');
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const categories = useMemo(() => [
    "Todas",
    ...Array.from(new Set(products.map(p => p.categoryPrimary)))
  ], [products]);

  const levels = ["Todos", "Iniciante", "Intermediário", "Avançado", "Todos os níveis"];

  const filteredCourses = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = searchTerm === "" || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tool.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.copy.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "Todas" || product.categoryPrimary === selectedCategory;
      const matchesLevel = selectedLevel === "Todos" || product.level.includes(selectedLevel) || product.level === "Todos os níveis";
      
      return matchesSearch && matchesCategory && matchesLevel;
    });

    // Sort courses
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.pricing.price - b.pricing.price;
        case "price-high":
          return b.pricing.price - a.pricing.price;
        case "rating":
          return b.metrics.rating - a.metrics.rating;
        case "newest":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "popular":
        default:
          return b.metrics.students - a.metrics.students;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedLevel, sortBy]);

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
                {loading ? '...' : products.reduce((sum, p) => sum + p.metrics.students, 0).toLocaleString()}+
              </p>
              <p className="text-gray-400">Alunos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">{loading ? '...' : products.length}</p>
              <p className="text-gray-400">Cursos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">
                {loading ? '...' : (products.reduce((sum, p) => sum + p.metrics.rating, 0) / products.length).toFixed(1)}
              </p>
              <p className="text-gray-400">Avaliação Média</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">
                {loading ? '...' : products.reduce((sum, p) => sum + p.metrics.lessons, 0).toLocaleString()}+
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
            {loading ? (
              <div className="col-span-full text-center py-20">
                <p className="text-gray-400 text-lg">Carregando cursos...</p>
              </div>
            ) : (
              filteredCourses.map((product, index) => (
                <AttractiveCourseCard 
                  key={product.slug}
                  product={product}
                  index={index}
                />
              ))
            )}
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
