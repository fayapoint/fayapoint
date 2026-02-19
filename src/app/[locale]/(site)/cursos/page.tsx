"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Grid,
  List,
  Flame,
  Trophy,
  Timer,
  Shield,
  Sparkles,
  ArrowRight,
  Star,
  Users,
  Clock,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from "@/lib/products";
import { AttractiveCourseCard } from "@/components/courses/AttractiveCourseCard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
              <p className="text-3xl font-bold text-purple-400">{loading ? '...' : totalCourses}</p>
              <p className="text-gray-400">{statsLabels.courses}</p>
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

      {/* Trust Banner */}
      <section className="py-6 bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-purple-900/50 border-y border-purple-500/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-gray-300">
              <Shield className="text-green-400" size={18} />
              <span>{t("promo.guarantee")}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Sparkles className="text-purple-400" size={18} />
              <span>{t("promo.lifetimeAccess")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Bestseller Section */}
      {!loading && products.length > 0 && (
        <section className="py-12 bg-gradient-to-b from-black to-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-lg px-4 py-2">
                <Flame className="mr-2" size={18} />
                {t("featured.badge")}
              </Badge>
              <h2 className="text-2xl font-bold">{t("featured.title")}</h2>
            </div>

            {/* Featured Course Card */}
            {(() => {
              const featured = products.reduce((best, p) => 
                p.metrics.students > (best?.metrics.students || 0) ? p : best
              , products[0]);
              
              if (!featured) return null;
              
              const discount = featured.pricing.originalPrice > featured.pricing.price 
                ? Math.round(((featured.pricing.originalPrice - featured.pricing.price) / featured.pricing.originalPrice) * 100)
                : 0;
              
              return (
                <Link href={`/curso/${featured.slug}`}>
                  <Card className="overflow-hidden border-2 border-yellow-500/50 hover:border-yellow-400 transition-all bg-gradient-to-br from-gray-900 via-gray-900 to-yellow-900/20 hover:shadow-2xl hover:shadow-yellow-500/20">
                    <div className="grid md:grid-cols-3 gap-0">
                      {/* Image/Visual Section */}
                      <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-12 flex items-center justify-center">
                        <div className="text-center">
                          <Trophy className="mx-auto mb-4 text-yellow-400" size={64} />
                          <Badge className="bg-yellow-400 text-black font-bold">
                            {t("featured.bestseller")}
                          </Badge>
                        </div>
                        {discount > 0 && (
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-red-500 text-white text-xl font-bold px-4 py-2">
                              -{discount}%
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="md:col-span-2 p-8">
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                            {featured.categoryPrimary}
                          </Badge>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                            {featured.metrics.students.toLocaleString()}+ {t("featured.students")}
                          </Badge>
                        </div>

                        <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                          {featured.name}
                        </h3>

                        <p className="text-gray-400 mb-6 text-lg leading-relaxed">
                          {featured.copy.shortDescription}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Star className="text-yellow-400 fill-yellow-400" size={20} />
                            <span className="font-bold text-lg">{featured.metrics.rating}</span>
                            <span className="text-gray-400">({featured.metrics.reviewCount} {t("featured.reviews")})</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Clock size={18} />
                            <span>{featured.metrics.duration}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Users size={18} />
                            <span>{featured.metrics.lessons} {t("featured.lessons")}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                          <div>
                            {featured.pricing.originalPrice > featured.pricing.price && (
                              <span className="text-gray-500 line-through text-lg mr-3">
                                R$ {featured.pricing.originalPrice.toLocaleString()}
                              </span>
                            )}
                            <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                              R$ {featured.pricing.price.toLocaleString()}
                            </span>
                          </div>
                          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-6 text-lg">
                            {t("featured.viewCourse")}
                            <ArrowRight className="ml-2" size={20} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })()}
          </div>
        </section>
      )}

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
          
          {!loading && filteredCourses.length === 0 && (
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
