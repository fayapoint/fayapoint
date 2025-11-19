"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Grid,
  List,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from "@/lib/products";
import { AttractiveCourseCard } from "@/components/courses/AttractiveCourseCard";

type LevelOption = {
  value: string;
  label: string;
};

type SortOption = {
  value: string;
  label: string;
};

type StatsLabels = {
  students: string;
  courses: string;
  rating: string;
  lessons: string;
};

export default function CoursesPage() {
  const t = useTranslations("Courses");
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const allCategoriesLabel = t("filters.allCategoriesLabel");
  const [selectedCategory, setSelectedCategory] = useState(allCategoriesLabel);
  const levelOptions = t.raw("filters.levelOptions") as LevelOption[];
  const sortOptions = t.raw("filters.sortOptions") as SortOption[];
  const [selectedLevel, setSelectedLevel] = useState(levelOptions[0]?.value ?? "all");
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
    allCategoriesLabel,
    ...Array.from(new Set(products.map(p => p.categoryPrimary)))
  ], [products, allCategoriesLabel]);

  const filteredCourses = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = searchTerm === "" || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tool.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.copy.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === allCategoriesLabel || product.categoryPrimary === selectedCategory;
      const matchesLevel =
        selectedLevel === "all" ||
        product.level.includes(selectedLevel) ||
        product.level === "Todos os níveis";
      
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
  }, [products, searchTerm, selectedCategory, selectedLevel, sortBy, allCategoriesLabel]);

  const statsLabels = t.raw("stats") as StatsLabels;
  const heroTitle = t("hero.title");
  const heroSubtitle = t("hero.subtitle");
  const searchPlaceholder = t("searchPlaceholder");
  const filtersLabels = t.raw("filters") as { categoryPlaceholder: string; levelPlaceholder: string; sortPlaceholder: string; results: string; };
  const loadingLabel = t("loading");
  const emptyStateTitle = t("empty.title");
  const emptyStateDescription = t("empty.description");

  const totalStudents = products.reduce((sum, p) => sum + p.metrics.students, 0).toLocaleString(locale);
  const totalCourses = products.length;
  const averageRating = products.length
    ? (products.reduce((sum, p) => sum + p.metrics.rating, 0) / products.length).toFixed(1)
    : "0.0";
  const totalLessons = products.reduce((sum, p) => sum + p.metrics.lessons, 0).toLocaleString(locale);

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
            {heroTitle}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-300 mb-8"
          >
            {heroSubtitle}
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
                {loading ? "..." : `${totalStudents}+`}
              </p>
              <p className="text-gray-400">{statsLabels.students}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">{loading ? '...' : products.length}</p>
              <p className="text-gray-400">{statsLabels.courses}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">
                {loading ? "..." : averageRating}
              </p>
              <p className="text-gray-400">{statsLabels.rating}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">
                {loading ? "..." : `${totalLessons}+`}
              </p>
              <p className="text-gray-400">{statsLabels.lessons}</p>
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
                placeholder={searchPlaceholder}
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
                  <SelectValue placeholder={filtersLabels.categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[150px] bg-gray-900 border-gray-700">
                  <SelectValue placeholder={filtersLabels.levelPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {levelOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px] bg-gray-900 border-gray-700">
                  <SelectValue placeholder={filtersLabels.sortPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-400">
                {t("filters.results", { count: filteredCourses.length })}
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
                <p className="text-gray-400 text-lg">{loadingLabel}</p>
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
              <p className="text-xl text-gray-400">{emptyStateTitle}</p>
              <p className="text-gray-500 mt-2">{emptyStateDescription}</p>
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
