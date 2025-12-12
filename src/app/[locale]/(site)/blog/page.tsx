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
      if (!response.ok) {
        throw new Error(data?.error || "Erro ao enviar");
      }

      setNewsletterEmail("");
      toast.success("Inscrição realizada!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao enviar";
      toast.error(message);
    } finally {
      setNewsletterLoading(false);
    }
  };

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === allCategory || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);
  const recentPosts = blogPosts.slice(0, 3);
  const formatViews = (value: number) => value.toLocaleString(locale);

  return (
    <div className="min-h-screen bg-black text-white">
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
              {heroTitle}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-400"
            >
              {heroDescription}
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Search Bar */}
              <div className="mb-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-900/50 border-gray-700"
                  />
                </div>
              </div>

              {/* Featured Post */}
              {featuredPosts.length > 0 && selectedCategory === allCategory && searchTerm === "" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <Link href={`/blog/${featuredPosts[0].slug}`}>
                    <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 overflow-hidden hover:border-purple-500/50 transition group cursor-pointer">
                      <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <TrendingUp size={64} className="text-white/30" />
                        </div>
                        <Badge className="absolute top-4 left-4 bg-yellow-500 text-black">
                          {featuredBadge}
                        </Badge>
                      </div>
                      <div className="p-6">
                        <Badge variant="outline" className="mb-3">
                          {featuredPosts[0].category}
                        </Badge>
                        <h2 className="text-2xl font-bold mb-3 group-hover:text-purple-400 transition">
                          {featuredPosts[0].title}
                        </h2>
                        <p className="text-gray-400 mb-4">
                          {featuredPosts[0].excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User size={16} />
                            {featuredPosts[0].author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={16} />
                            {featuredPosts[0].date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={16} />
                            {featuredPosts[0].readTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye size={16} />
                            {formatViews(featuredPosts[0].views)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              )}

              {/* Posts Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {filteredPosts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/blog/${post.slug}`}>
                      <Card className="bg-white/5 backdrop-blur border-white/10 hover:bg-white/10 transition overflow-hidden h-full group cursor-pointer">
                        <div className="aspect-video bg-gradient-to-br from-purple-600/50 to-pink-600/50 relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Tag size={32} className="text-white/30" />
                          </div>
                          {post.featured && (
                            <Badge className="absolute top-2 left-2 bg-yellow-500 text-black">
                              {featuredBadge}
                            </Badge>
                          )}
                        </div>
                        <div className="p-4">
                          <Badge variant="outline" className="mb-2 text-xs">
                            {post.category}
                          </Badge>
                          <h3 className="font-semibold mb-2 group-hover:text-purple-400 transition line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{post.date}</span>
                            <span>•</span>
                            <span>{post.readTime}</span>
                            <span>•</span>
                            <span>{formatViews(post.views)} {labels.viewsSuffix}</span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                >
                  {loadMoreLabel}
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Categories */}
              <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                <h3 className="text-xl font-semibold mb-4">{labels.categories}</h3>
                <div className="space-y-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        selectedCategory === category
                          ? 'bg-purple-600/20 text-purple-400'
                          : 'hover:bg-white/5 text-gray-400'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Popular Tags */}
              <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                <h3 className="text-xl font-semibold mb-4">{labels.popularTags}</h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-purple-500/50 hover:bg-purple-500/20 cursor-pointer"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Recent Posts */}
              <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                <h3 className="text-xl font-semibold mb-4">{labels.recentPosts}</h3>
                <div className="space-y-4">
                  {recentPosts.map(post => (
                    <Link 
                      key={post.id} 
                      href={`/blog/${post.slug}`}
                      className="block group"
                    >
                      <h4 className="font-medium mb-1 group-hover:text-purple-400 transition line-clamp-2">
                        {post.title}
                      </h4>
                      <p className="text-sm text-gray-500">{post.date}</p>
                    </Link>
                  ))}
                </div>
              </Card>

              {/* Newsletter */}
              <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 p-6">
                <h3 className="text-xl font-semibold mb-4">{labels.newsletter}</h3>
                <p className="text-gray-400 mb-4">
                  {labels.newsletterDescription}
                </p>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={newsletter.placeholder}
                  className="mb-3 bg-gray-800 border-gray-700"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                />
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={submitNewsletter}
                  disabled={!newsletterEmail || newsletterLoading}
                >
                  {labels.newsletterSubmit}
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
