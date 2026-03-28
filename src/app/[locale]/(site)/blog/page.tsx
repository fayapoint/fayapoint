"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  Tag,
  Search,
  TrendingUp,
  Eye,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { getAttributionUtmPayload } from "@/lib/attribution";

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  views: number;
  image: string;
  featured: boolean;
  tags: string[];
};

type BlogLabels = {
  viewsSuffix: string;
  categories: string;
  popularTags: string;
  recentPosts: string;
  newsletter: string;
  newsletterDescription: string;
  newsletterSubmit: string;
};

type BlogNewsletter = {
  placeholder: string;
};

function PostImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className={`bg-gradient-to-br from-amber-600/40 to-yellow-700/30 flex items-center justify-center ${className}`}>
        <Sparkles size={32} className="text-white/30" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}

export default function BlogPage() {
  const t = useTranslations("Blog");
  const locale = useLocale();
  const categories = t.raw("categories") as string[];
  const allCategory = categories[0];
  const blogPosts = t.raw("posts") as BlogPost[];
  const popularTags = t.raw("popularTags") as string[];
  const labels = t.raw("labels") as BlogLabels;
  const newsletter = t.raw("newsletter") as BlogNewsletter;
  const heroTitle = t("hero.title");
  const heroDescription = t("hero.description");
  const searchPlaceholder = t("searchPlaceholder");
  const loadMoreLabel = t("loadMore");
  const featuredBadge = t("badges.featured");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(allCategory);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  const submitNewsletter = async () => {
    if (!newsletterEmail) return;
    setNewsletterLoading(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newsletterEmail,
          source: "blog_newsletter",
          leadType: "newsletter",
          referrerUrl: typeof window !== "undefined" ? window.location.href : undefined,
          utm: getAttributionUtmPayload(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Erro ao enviar");
      setNewsletterEmail("");
      toast.success("Inscrição realizada!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar");
    } finally {
      setNewsletterLoading(false);
    }
  };

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === allCategory || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter((post) => post.featured);
  const recentPosts = blogPosts.slice(0, 4);
  const formatViews = (value: number) => value.toLocaleString(locale);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="pt-16 md:pt-20 pb-16">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.08),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.06),transparent_40%)]" />
          <div className="container relative mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 mb-6"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Blog</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-4xl md:text-6xl font-black mb-4 tracking-tight"
              style={{
                textShadow: "0 4px 24px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              {heroTitle}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              {heroDescription}
            </motion.p>
          </div>
        </section>

        <div className="container mx-auto px-4">
          {/* ── SEARCH + CATEGORY PILLS (mobile-first) ── */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 rounded-xl bg-card border-border text-base"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            {/* ── MAIN CONTENT ── */}
            <div>
              {/* Featured post — large hero card */}
              {featuredPosts.length > 0 && selectedCategory === allCategory && searchTerm === "" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <Link href={`/${locale}/blog/${featuredPosts[0].slug}`}>
                    <div className="group relative rounded-3xl overflow-hidden border border-border hover:border-amber-500/40 transition-all hover:-translate-y-0.5 shadow-lg shadow-black/5">
                      <div className="aspect-[21/9] md:aspect-[21/8] overflow-hidden">
                        <PostImage
                          src={featuredPosts[0].image}
                          alt={featuredPosts[0].title}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                        <Badge className="bg-amber-500/90 text-black border-0 mb-3">
                          {featuredBadge}
                        </Badge>
                        <h2
                          className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-3 leading-tight"
                          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.5), 0 4px 32px rgba(0,0,0,0.3)" }}
                        >
                          {featuredPosts[0].title}
                        </h2>
                        <p className="text-white/70 mb-4 line-clamp-2 max-w-2xl text-sm md:text-base">
                          {featuredPosts[0].excerpt}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-white/60">
                          <span className="flex items-center gap-1"><User size={14} /> {featuredPosts[0].author}</span>
                          <span className="flex items-center gap-1"><Calendar size={14} /> {featuredPosts[0].date}</span>
                          <span className="flex items-center gap-1"><Clock size={14} /> {featuredPosts[0].readTime}</span>
                          <span className="flex items-center gap-1"><Eye size={14} /> {formatViews(featuredPosts[0].views)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* Posts grid */}
              <div className="grid sm:grid-cols-2 gap-5">
                {filteredPosts.slice(0, visibleCount).map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  >
                    <Link href={`/${locale}/blog/${post.slug}`}>
                      <div className="group h-full rounded-2xl border border-border bg-card overflow-hidden hover:border-amber-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/5">
                        <div className="aspect-video overflow-hidden relative">
                          <PostImage
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          {post.featured && (
                            <Badge className="absolute top-3 left-3 bg-amber-500/90 text-black border-0 text-[10px]">
                              {featuredBadge}
                            </Badge>
                          )}
                          <Badge variant="outline" className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm border-white/20 text-white text-[10px]">
                            {post.category}
                          </Badge>
                        </div>
                        <div className="p-4 md:p-5">
                          <h3
                            className="font-bold text-base md:text-lg mb-2 group-hover:text-amber-400 transition line-clamp-2 leading-snug"
                            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                          >
                            {post.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <span>{post.date}</span>
                              <span>{post.readTime}</span>
                            </div>
                            <span className="flex items-center gap-1">
                              <Eye size={12} /> {formatViews(post.views)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Load more */}
              {filteredPosts.length > visibleCount && (
                <div className="text-center mt-10">
                  <Button
                    variant="outline"
                    className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 rounded-xl px-8"
                    onClick={() => setVisibleCount((c) => c + 12)}
                  >
                    {loadMoreLabel}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              )}
            </div>

            {/* ── SIDEBAR ── */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* Categories */}
              <Card className="bg-card border-border p-5 rounded-2xl">
                <h3 className="text-lg font-bold mb-3">{labels.categories}</h3>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                        selectedCategory === category
                          ? "bg-amber-500/15 text-amber-400 font-medium"
                          : "text-muted-foreground hover:bg-card hover:text-foreground"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Popular Tags */}
              <Card className="bg-card border-border p-5 rounded-2xl">
                <h3 className="text-lg font-bold mb-3">{labels.popularTags}</h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-border hover:border-amber-500/50 hover:bg-amber-500/10 cursor-pointer transition text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Recent posts */}
              <Card className="bg-card border-border p-5 rounded-2xl">
                <h3 className="text-lg font-bold mb-3">{labels.recentPosts}</h3>
                <div className="space-y-3">
                  {recentPosts.map((post) => (
                    <Link key={post.id} href={`/${locale}/blog/${post.slug}`} className="group flex gap-3">
                      <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0">
                        <PostImage
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium line-clamp-2 group-hover:text-amber-400 transition leading-snug">
                          {post.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">{post.date}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>

              {/* Newsletter */}
              <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-600/5 border-amber-500/20 p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <TrendingUp size={16} className="text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold">{labels.newsletter}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{labels.newsletterDescription}</p>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={newsletter.placeholder}
                  className="mb-3 bg-background border-border rounded-xl"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                />
                <Button
                  className="w-full bg-gradient-to-r from-amber-600 to-yellow-700 text-white rounded-xl"
                  onClick={submitNewsletter}
                  disabled={!newsletterEmail || newsletterLoading}
                >
                  {labels.newsletterSubmit}
                </Button>
              </Card>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
