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
  ChevronRight,
  Eye
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const blogPosts = [
  {
    id: 1,
    title: "Como o ChatGPT está Revolucionando o Mercado de Trabalho em 2025",
    slug: "chatgpt-revolucionando-mercado-trabalho-2025",
    excerpt: "Descubra como profissionais estão usando o ChatGPT para aumentar sua produtividade em até 300% e as profissões que mais se beneficiam dessa tecnologia.",
    category: "IA Generativa",
    author: "Ricardo Faya",
    date: "18 Out, 2025",
    readTime: "8 min",
    views: 3456,
    image: "/blog/chatgpt-work.jpg",
    featured: true,
    tags: ["ChatGPT", "Produtividade", "Carreira"],
  },
  {
    id: 2,
    title: "Guia Completo: Criando Arte Profissional com Midjourney v6",
    slug: "guia-midjourney-v6",
    excerpt: "Aprenda técnicas avançadas de prompt engineering para Midjourney, incluindo styles, parameters e como criar consistência visual.",
    category: "Criação Visual",
    author: "Ricardo Faya",
    date: "17 Out, 2025",
    readTime: "12 min",
    views: 2891,
    image: "/blog/midjourney-guide.jpg",
    featured: true,
    tags: ["Midjourney", "Design", "Arte Digital"],
  },
  {
    id: 3,
    title: "Automação com n8n: 10 Workflows que Todo Negócio Precisa",
    slug: "automacao-n8n-workflows",
    excerpt: "Economize 20 horas por semana com estes workflows de automação essenciais para qualquer negócio digital.",
    category: "Automação",
    author: "Ricardo Faya",
    date: "16 Out, 2025",
    readTime: "15 min",
    views: 2234,
    image: "/blog/n8n-workflows.jpg",
    featured: false,
    tags: ["n8n", "Automação", "Produtividade"],
  },
  {
    id: 4,
    title: "Claude vs ChatGPT: Qual é Melhor para Programação?",
    slug: "claude-vs-chatgpt-programacao",
    excerpt: "Comparação detalhada entre Claude e ChatGPT para desenvolvimento de software, debugging e arquitetura de sistemas.",
    category: "Desenvolvimento",
    author: "Ricardo Faya",
    date: "15 Out, 2025",
    readTime: "10 min",
    views: 4102,
    image: "/blog/claude-chatgpt.jpg",
    featured: false,
    tags: ["Claude", "ChatGPT", "Programação"],
  },
  {
    id: 5,
    title: "O Futuro da Voz: Como ElevenLabs está Mudando o Jogo",
    slug: "elevenlabs-futuro-voz",
    excerpt: "Clonagem de voz, dublagem automática e narrações ultra-realistas. Entenda o impacto dessa tecnologia.",
    category: "Áudio e Voz",
    author: "Ricardo Faya",
    date: "14 Out, 2025",
    readTime: "6 min",
    views: 1876,
    image: "/blog/elevenlabs.jpg",
    featured: false,
    tags: ["ElevenLabs", "Áudio", "IA de Voz"],
  },
  {
    id: 6,
    title: "ROI de IA: Como Medir o Retorno do Investimento em IA",
    slug: "roi-inteligencia-artificial",
    excerpt: "Framework completo para calcular e demonstrar o ROI de projetos de IA na sua empresa.",
    category: "Negócios",
    author: "Ricardo Faya",
    date: "13 Out, 2025",
    readTime: "20 min",
    views: 3567,
    image: "/blog/roi-ai.jpg",
    featured: true,
    tags: ["ROI", "Negócios", "Estratégia"],
  },
];

const categories = [
  "Todos",
  "IA Generativa",
  "Criação Visual",
  "Automação",
  "Desenvolvimento",
  "Áudio e Voz",
  "Negócios",
  "Tutoriais",
  "Novidades",
];

const popularTags = [
  "ChatGPT",
  "Midjourney",
  "Claude",
  "n8n",
  "Automação",
  "Produtividade",
  "Marketing",
  "Design",
  "Programação",
  "ROI",
];

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);
  const recentPosts = blogPosts.slice(0, 3);

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
              Blog FayaPoint
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-400"
            >
              Insights, tutoriais e novidades sobre Inteligência Artificial
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
                    placeholder="Buscar artigos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-900/50 border-gray-700"
                  />
                </div>
              </div>

              {/* Featured Post */}
              {featuredPosts.length > 0 && selectedCategory === "Todos" && searchTerm === "" && (
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
                          Destaque
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
                            {featuredPosts[0].views.toLocaleString("pt-BR")}
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
                              Destaque
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
                            <span>{post.views.toLocaleString("pt-BR")} views</span>
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
                  Carregar Mais Artigos
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Categories */}
              <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                <h3 className="text-xl font-semibold mb-4">Categorias</h3>
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
                <h3 className="text-xl font-semibold mb-4">Tags Populares</h3>
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
                <h3 className="text-xl font-semibold mb-4">Posts Recentes</h3>
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
                <h3 className="text-xl font-semibold mb-4">Newsletter</h3>
                <p className="text-gray-400 mb-4">
                  Receba as últimas novidades de IA direto no seu email.
                </p>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  className="mb-3 bg-gray-800 border-gray-700"
                />
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Inscrever
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
