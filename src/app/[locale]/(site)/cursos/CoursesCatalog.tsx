"use client";
import { useT } from "@/i18n/dicionario";

import { useState, useMemo, useEffect } from "react";
import { Link } from "@/i18n/navigation";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from "@/lib/products";
import { AttractiveCourseCard } from "@/components/courses/AttractiveCourseCard";
import { CapaDoCurso } from "@/components/courses/CapaDoCurso";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DEFAULT_EDITORIAL_VERIFICATION,
  formatEditorialDate,
} from "@/lib/editorial-verification";

type MonthlyOfferPayload = {
  monthKey: string;
  freeCourse: Product | null;
  pools: {
    beginner: Product[];
    intermediate: Product[];
    advanced: Product[];
  };
};

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

export default function CoursesCatalog({
  initialProducts = [],
}: {
  initialProducts?: Product[];
}) {
  const T = useT();
  const t = useTranslations("Courses");
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [monthlyOffers, setMonthlyOffers] = useState<MonthlyOfferPayload | null>(null);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [searchTerm, setSearchTerm] = useState("");

  // Read search param from URL on mount (e.g. from tools page "Cursos relacionados" link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");
    if (search) {
      setSearchTerm(search);
    }
  }, []);
  const allCategoriesLabel = t("filters.allCategoriesLabel");
  const [selectedCategory, setSelectedCategory] = useState(allCategoriesLabel);
  const levelOptions = t.raw("filters.levelOptions") as LevelOption[];
  const sortOptions = t.raw("filters.sortOptions") as SortOption[];
  const [selectedLevel, setSelectedLevel] = useState(levelOptions[0]?.value ?? "all");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const isPtBr = locale === "pt-BR";
  // O catálogo chega pronto do servidor; aqui só buscamos o que falta.
  //
  // Antes os cursos vinham TODOS deste efeito, e o HTML servido de `/cursos`
  // eram 873 caracteres sem um único card — a vitrine inteira invisível para o
  // rastreador (medido em produção 28/07/2026). Pior: `/api/` é `Disallow` no
  // robots.txt, então nem renderizando o JS o Googlebot chegava aos cursos.
  //
  // A oferta do mês continua no cliente de propósito: é promoção rotativa, não
  // é o conteúdo pelo qual a página deve ranquear.
  useEffect(() => {
    async function fetchData() {
      try {
        if (initialProducts.length === 0) {
          const response = await fetch(`/api/products?type=course&locale=${locale}`);
          const data = await response.json();
          setProducts(data.products || []);
        }

        const monthlyOffersResponse = await fetch(`/api/courses/monthly-offers?locale=${locale}`);
        if (monthlyOffersResponse.ok) {
          const monthlyData = await monthlyOffersResponse.json();
          setMonthlyOffers(monthlyData);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [initialProducts.length, locale]);

  const categories = useMemo(() => [
    allCategoriesLabel,
    ...Array.from(new Set(products.map(p => p.categoryPrimary).filter(Boolean)))
  ], [products, allCategoriesLabel]);

  const filteredCourses = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = searchTerm === "" ||
        (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.tool || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.copy?.shortDescription || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === allCategoriesLabel || product.categoryPrimary === selectedCategory;
      const matchesLevel =
        selectedLevel === "all" ||
        product.level.includes(selectedLevel) ||
        product.level === "Todos os níveis";
      
      return matchesSearch && matchesCategory && matchesLevel;
    });

    // Sort courses (featured courses always lead, regardless of sort mode)
    filtered = [...filtered].sort((a, b) => {
      const featuredDiff = (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      if (featuredDiff !== 0) return featuredDiff;
      if (a.featured && b.featured) {
        return (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0);
      }

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

  const totalStudents = products.reduce((sum, p) => sum + (p.metrics?.students || 0), 0).toLocaleString(locale);
  const totalCourses = products.length;
  const averageRating = products.length
    ? (products.reduce((sum, p) => sum + (p.metrics?.rating || 0), 0) / products.length).toFixed(1)
    : "0.0";
  const totalLessons = products.reduce((sum, p) => sum + (p.metrics?.lessons || 0), 0).toLocaleString(locale);

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-amber-900/30 to-black">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-4"
          >
            {T(heroTitle)}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground mb-8"
          >
            {T(heroSubtitle)}
          </motion.p>
          
          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-8 mb-8"
          >
            <div>
              <p className="text-3xl font-bold text-amber-400">{loading ? '...' : totalCourses}</p>
              <p className="text-muted-foreground">{T(statsLabels.courses)}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">
                {loading ? "..." : `${totalLessons}+`}
              </p>
              <p className="text-muted-foreground">{T(statsLabels.lessons)}</p>
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder={T(searchPlaceholder)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-card border-border text-white"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Active Search Results Banner - shown when filtering via URL param */}
      {searchTerm && !loading && (
        <section className="py-8 bg-gradient-to-r from-amber-900/30 via-card to-amber-900/30 border-b border-amber-500/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {isPtBr ? T("Resultados para") : T("Results for")}
                </p>
                <h2 className="text-2xl md:text-3xl font-bold">
                  {isPtBr
                    ? `${filteredCourses.length} curso${filteredCourses.length !== 1 ? "s" : ""} sobre "${searchTerm}"`
                    : `${filteredCourses.length} course${filteredCourses.length !== 1 ? "s" : ""} about "${searchTerm}"`}
                </h2>
              </div>
              <Button
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                onClick={() => setSearchTerm("")}
              >
                {isPtBr ? T("Limpar filtro") : T("Clear filter")}
              </Button>
            </div>

            {filteredCourses.length > 0 && (
              <div className={`mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6`}>
                {filteredCourses.map((product, index) => (
                  <AttractiveCourseCard
                    key={product.slug}
                    product={product}
                    index={index}
                  />
                ))}
              </div>
            )}

            {filteredCourses.length === 0 && (
              <div className="mt-6 text-center py-8">
                <p className="text-lg text-muted-foreground">
                  {isPtBr
                    ? `Nenhum curso encontrado para "${searchTerm}". Explore nosso catálogo completo abaixo.`
                    : `No courses found for "${searchTerm}". Explore our full catalog below.`}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Trust Banner */}
      <section className="py-6 bg-gradient-to-r from-amber-900/50 via-yellow-900/50 to-amber-900/50 border-y border-amber-500/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="text-green-400" size={18} />
              <span>{t("promo.guarantee")}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="text-amber-400" size={18} />
              <span>{t("promo.lifetimeAccess")}</span>
            </div>
            {/* ⚠️ O canon de modelos saiu daqui em 03/08/2026.
                A faixa anunciava "Verificado em 27 de abr. de 2026 · GPT-5.5 /
                Claude Opus 4.7 / Gemini 3.1" — três modelos que já eram
                passado, estampados na vitrine de um site que ensina IA. Foi a
                mesma decisão que apagou a faixa do leitor: uma data de
                verificação envelhece sozinha e, quando envelhece, deixa de ser
                prova e passa a ser confissão.
                Ficam as duas garantias que não dependem de data. */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="text-blue-400" size={18} />
              <span>{isPtBr ? T("Conteúdo atualizado continuamente") : T("Continuously updated content")}</span>
            </div>
          </div>
        </div>
      </section>

      {monthlyOffers?.freeCourse && (
        <section className="py-10 bg-gradient-to-b from-black to-emerald-950/10">
          <div className="container mx-auto px-4">
            <Card className="overflow-hidden border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-black to-amber-900/30 p-0">
              <div className="grid gap-0 lg:grid-cols-[auto_1.3fr_0.9fr] lg:items-center">
                {/* Course Cover Thumbnail */}
                {monthlyOffers.freeCourse.thumbnail && (
                  <div className="hidden lg:flex w-56 items-center justify-center p-5">
                    <CapaDoCurso
                      slug={monthlyOffers.freeCourse.slug}
                      thumbnail={monthlyOffers.freeCourse.thumbnail}
                      alt={T(monthlyOffers.freeCourse.name)}
                      className="w-full rounded-lg shadow-xl shadow-black/50 ring-1 ring-emerald-500/20"
                    />
                  </div>
                )}
                <div className="p-6 md:p-8">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{isPtBr ? T("Curso grátis do mês") : T("Free course of the month")}</span>
                  </div>
                  <h2 className="text-3xl font-bold text-white">
                    {T(monthlyOffers.freeCourse.name)}
                  </h2>
                  <p className="mt-3 max-w-3xl text-muted-foreground">
                    {isPtBr
                      ? T("Todo usuário pode testar a experiência completa da academia neste curso, incluindo progresso salvo e certificado liberado.")
                      : T("Every user can test the full academy experience on this course, including saved progress and certificate access.")}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                      {isPtBr ? T("Certificado incluso") : T("Certificate included")}
                    </Badge>
                    {monthlyOffers.freeCourse.metrics?.lessons != null && (
                      <Badge className="bg-secondary text-gray-200 border-border">
                        {monthlyOffers.freeCourse.metrics.lessons} {isPtBr ? T("aulas") : T("lessons")}
                      </Badge>
                    )}
                    {monthlyOffers.freeCourse.metrics?.duration && (
                      <Badge className="bg-secondary text-gray-200 border-border">
                        {T(monthlyOffers.freeCourse.metrics.duration)}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <Link href={`/curso/${monthlyOffers.freeCourse.slug}`}>
                      <Button className="bg-gradient-to-r from-emerald-500 to-green-500 text-black hover:from-emerald-400 hover:to-green-400">
                        {isPtBr ? T("Ver curso grátis") : T("View free course")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {isPtBr
                        ? `${monthlyOffers.pools.beginner.length} iniciantes, ${monthlyOffers.pools.intermediate.length} intermediários e ${monthlyOffers.pools.advanced.length} avançados no catálogo deste mês.`
                        : `${monthlyOffers.pools.beginner.length} beginner, ${monthlyOffers.pools.intermediate.length} intermediate, and ${monthlyOffers.pools.advanced.length} advanced courses in this month’s catalog.`}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 p-6 md:p-8 lg:p-4">
                  <div className="rounded-2xl border border-border bg-secondary p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {isPtBr ? T("Explorador") : T("Explorer")}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">{monthlyOffers.pools.beginner.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {isPtBr ? T("cursos iniciantes liberados neste mês") : T("beginner courses unlocked this month")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-secondary p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {isPtBr ? T("Profissional") : T("Professional")}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">{monthlyOffers.pools.intermediate.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {isPtBr ? T("intermediários no catálogo rotativo") : T("intermediate courses in the rotating catalog")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-secondary p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {isPtBr ? T("Expert") : T("Expert")}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">{monthlyOffers.pools.advanced.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {isPtBr ? T("avançados disponíveis para planos altos") : T("advanced courses available for upper tiers")}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

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
                      {/* O fundo era laranja chapado e a capa vinha esticada com
                          `h-full object-cover` — a altura da célula é ditada pela
                          coluna de texto ao lado, então o livro deformava junto.
                          Agora a capa entra na proporção dela, centrada, sobre o
                          navy da marca. */}
                      <div className="relative bg-gradient-to-br from-amber-900/25 via-black to-black flex items-center justify-center overflow-hidden p-6">
                        {featured.thumbnail ? (
                          <>
                            <CapaDoCurso
                              slug={featured.slug}
                              thumbnail={featured.thumbnail}
                              alt={T(featured.name)}
                              modo="auto"
                              eager
                              className="w-full max-w-[300px] rounded-xl shadow-2xl shadow-black/60 ring-1 ring-amber-500/20"
                            />
                            <div className="absolute bottom-4 left-4">
                              <Badge className="bg-yellow-400 text-black font-bold">
                                {t("featured.bestseller")}
                              </Badge>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-12">
                            <Trophy className="mx-auto mb-4 text-yellow-400" size={64} />
                            <Badge className="bg-yellow-400 text-black font-bold">
                              {t("featured.bestseller")}
                            </Badge>
                          </div>
                        )}
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
                        {/* ⚠️ Saiu em 03/08/2026 o selo "100% de cobertura
                            real · GPT-5.4 / Claude Opus 4.6". Ricardo: *"este
                            tipo de afirmação só leva o usuário a acreditar
                            exatamente no oposto"*. No lugar, o número que o
                            visitante confere sozinho abrindo o curso. */}
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                          <Shield className="h-3.5 w-3.5" />
                          <span>
                            {isPtBr
                              ? `${featured.contentChapters ?? featured.curriculum?.moduleCount ?? 0} capítulos escritos`
                              : `${featured.contentChapters ?? featured.curriculum?.moduleCount ?? 0} written chapters`}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">
                            {T(featured.categoryPrimary)}
                          </Badge>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                            {featured.metrics.students.toLocaleString()}+ {t("featured.students")}
                          </Badge>
                        </div>

                        <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                          {T(featured.name)}
                        </h3>

                        <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                          {T(featured.copy.shortDescription)}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Star className="text-yellow-400 fill-yellow-400" size={20} />
                            <span className="font-bold text-lg">{featured.metrics.rating}</span>
                            <span className="text-muted-foreground">({featured.metrics.reviewCount} {t("featured.reviews")})</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock size={18} />
                            <span>{T(featured.metrics.duration)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users size={18} />
                            <span>{featured.metrics.lessons} {t("featured.lessons")}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                          <div>
                            {featured.pricing.originalPrice > featured.pricing.price && (
                              <span className="text-muted-foreground line-through text-lg mr-3">
                                
                                {T("R$")} {featured.pricing.originalPrice.toLocaleString()}
                              </span>
                            )}
                            <span className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                              
                              {T("R$")} {featured.pricing.price.toLocaleString()}
                            </span>
                          </div>
                          <Button className="bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 text-white font-bold px-8 py-6 text-lg">
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
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px] bg-card border-border">
                  <SelectValue placeholder={T(filtersLabels.categoryPlaceholder)} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{T(cat)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[150px] bg-card border-border">
                  <SelectValue placeholder={T(filtersLabels.levelPlaceholder)} />
                </SelectTrigger>
                <SelectContent>
                  {levelOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {T(option.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px] bg-card border-border">
                  <SelectValue placeholder={T(filtersLabels.sortPlaceholder)} />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {T(option.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
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
                <p className="text-muted-foreground text-lg">{T(loadingLabel)}</p>
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
              <p className="text-xl text-muted-foreground">{T(emptyStateTitle)}</p>
              <p className="text-muted-foreground mt-2">{T(emptyStateDescription)}</p>
            </div>
          )}
        </div>
      </section>
      
    </div>
  );
}
