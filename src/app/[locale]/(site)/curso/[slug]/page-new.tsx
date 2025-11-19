"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircle, Clock, Users, Star, Award, CheckCircle, Lock,
  Download, Globe, Calendar, BookOpen, Target, ChevronDown,
  ChevronUp, MessageSquare, Share2, Heart, ShoppingCart,
  TrendingUp, Zap, Building2, User, Sparkles, Trophy,
  Gift, Shield, HelpCircle, ArrowRight, Rocket, Brain,
  DollarSign, Timer, AlertCircle, Check, X, Play, ChevronRight,
  Quote, BadgeCheck, Flame, Crown, PhoneCall
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/lib/products";

export default function CourseSalesPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [expandedFaqs, setExpandedFaqs] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 47, seconds: 21 });
  
  // Fetch product from MongoDB
  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${slug}`);
        const data = await res.json();
        setProduct(data.product);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando curso...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Curso não encontrado</h1>
          <Link href="/cursos">
            <Button>Ver Todos os Cursos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const discount = Math.round(((product.pricing.originalPrice - product.pricing.price) / product.pricing.originalPrice) * 100);
  const savings = product.pricing.originalPrice - product.pricing.price;
  
  // Calculate total bonus value
  const totalBonusValue = product.bonuses?.reduce((sum, bonus) => sum + bonus.value, 0) || 0;
  const totalValue = product.pricing.originalPrice + totalBonusValue;

  const toggleModule = (id: number) => {
    setExpandedModules(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleFaq = (id: number) => {
    setExpandedFaqs(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="pt-20">
        {/* HERO SECTION - Above the Fold */}
        <section className="relative bg-gradient-to-b from-purple-900/20 via-black to-black py-12 overflow-hidden">
          {/* Background Animation */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, purple 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }} />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                  <Link href="/" className="hover:text-white">Home</Link>
                  <ChevronRight size={14} />
                  <Link href="/cursos" className="hover:text-white">Cursos</Link>
                  <ChevronRight size={14} />
                  <span className="text-purple-400">{product.categoryPrimary}</span>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {product.metrics.students > 5000 && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-0">
                      <Flame className="mr-1" size={14} />
                      Bestseller #{1}
                    </Badge>
                  )}
                  <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-black border-0">
                    <Trophy className="mr-1" size={14} />
                    Mais Vendido {new Date().getFullYear()}
                    </Badge>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 animate-pulse">
                    <Timer className="mr-1" size={14} />
                    Oferta Expira em {timeLeft.hours}h {timeLeft.minutes}m
                  </Badge>
                </div>

                {/* Headline - Outcome Focused */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    {product.name}
                  </span>
                </h1>

                {/* Subheadline - Mechanism */}
                <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
                  {product.copy.subheadline}
                </p>

                {/* Social Proof Bar */}
                <div className="flex flex-wrap items-center gap-6 mb-8 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2">
                    <Star className="text-yellow-400 fill-yellow-400" size={20} />
                    <div>
                      <div className="font-bold text-lg">{product.metrics.rating}</div>
                      <div className="text-xs text-gray-400">{product.metrics.reviewCount} avaliações</div>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-12 hidden md:block" />
                  <div className="flex items-center gap-2">
                    <Users className="text-purple-400" size={20} />
                    <div>
                      <div className="font-bold text-lg">{product.metrics.students.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">alunos matriculados</div>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-12 hidden md:block" />
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-green-400" size={20} />
                    <div className="text-sm text-gray-300">
                      <span className="font-bold text-green-400">127</span> matrículas nas últimas 24h
                    </div>
                  </div>
                </div>

                {/* Instructor Quick Info */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold">
                    RF
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Criado por</div>
                    <div className="font-bold text-lg">Ricardo Faya</div>
                    <div className="text-sm text-gray-400">50.000+ alunos • 20+ cursos • 28 anos exp.</div>
                  </div>
                </div>
              </div>

              {/* STICKY SIDEBAR - Purchase Card */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Card className="bg-gray-900/50 backdrop-blur border-2 border-purple-500/50 p-6 shadow-2xl shadow-purple-500/20">
                    {/* Video Preview */}
                    <div className="relative aspect-video bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg mb-6 group cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
                        >
                          <Play className="text-white ml-1" size={32} />
                        </motion.div>
                      </div>
                      <div className="absolute top-3 right-3 bg-black/70 px-3 py-1 rounded-full text-sm font-semibold">
                        Preview Gratuito
                      </div>
                      <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1 rounded-full text-sm">
                        <Clock className="inline mr-1" size={14} />
                        {product.metrics.duration}
                      </div>
                    </div>

                    {/* Urgency Timer */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-red-900/50 to-orange-900/50 rounded-lg border-2 border-red-500/50">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="text-red-400" size={20} />
                        <span className="font-bold text-red-400">OFERTA LIMITADA</span>
                      </div>
                      <div className="flex justify-center gap-2 text-2xl font-bold">
                        <div className="bg-black/50 px-3 py-2 rounded">
                          {timeLeft.hours.toString().padStart(2, '0')}
                        </div>
                        <span>:</span>
                        <div className="bg-black/50 px-3 py-2 rounded">
                          {timeLeft.minutes.toString().padStart(2, '0')}
                        </div>
                        <span>:</span>
                        <div className="bg-black/50 px-3 py-2 rounded">
                          {timeLeft.seconds.toString().padStart(2, '0')}
                        </div>
                      </div>
                      <p className="text-xs text-center text-gray-400 mt-2">
                        Garanta seu desconto antes que acabe!
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-500 line-through text-2xl">
                          R$ {product.pricing.originalPrice.toLocaleString()}
                        </span>
                        <Badge className="bg-red-500 text-white text-lg px-3 py-1">
                          -{discount}%
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          R$ {product.pricing.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-400">
                        ou <span className="font-semibold text-white">12x de R$ {(product.pricing.price / 12).toFixed(2)}</span> sem juros
                      </p>
                      <div className="mt-2 p-2 bg-green-500/10 border border-green-500/50 rounded text-center">
                        <span className="text-green-400 font-bold">
                          Economize R$ {savings.toLocaleString()} hoje!
                        </span>
                      </div>
                    </div>

                    {/* CTAs */}
                    <div className="space-y-3 mb-6">
                      <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg shadow-lg shadow-purple-500/50"
                        size="lg"
                      >
                        <ShoppingCart className="mr-2" size={20} />
                        Comprar Agora
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10"
                        size="lg"
                      >
                        Adicionar ao Carrinho
                      </Button>
                    </div>

                    {/* What's Included */}
                    <div className="space-y-3 mb-6">
                      <h3 className="font-bold text-sm uppercase text-gray-400 mb-3">
                        Este curso inclui:
                      </h3>
                      {[
                        `${product.metrics.lessons} aulas em vídeo`,
                        `${product.metrics.duration} de conteúdo`,
                        'Acesso vitalício',
                        'Certificado de conclusão',
                        'Atualizações gratuitas',
                        'Suporte direto',
                        'Projetos práticos',
                        'Comunidade exclusiva'
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Check className="text-green-400 flex-shrink-0" size={16} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Guarantee Badge */}
                    <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border-2 border-green-500/50 text-center">
                      <Shield className="mx-auto mb-2 text-green-400" size={32} />
                      <div className="font-bold text-green-400 mb-1">
                        Garantia de 30 Dias
                      </div>
                      <p className="text-xs text-gray-400">
                        100% do seu dinheiro de volta, sem perguntas
                      </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <BadgeCheck size={14} />
                        <span>Compra Segura</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Lock size={14} />
                        <span>Dados Protegidos</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM AGITATION SECTION */}
        <section className="py-16 bg-gradient-to-b from-black to-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                <span className="text-red-400">Você está lutando</span> com algum desses problemas?
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  "Passa horas em tarefas repetitivas que poderiam ser automatizadas",
                  "Não sabe como usar IA de forma produtiva no trabalho",
                  "Vê outros ganhando dinheiro com IA mas não sabe por onde começar",
                  "Tentou aprender sozinho mas ficou perdido com tanta informação",
                  "Quer se destacar no mercado mas falta conhecimento técnico",
                  "Tem medo de ficar para trás na revolução da IA"
                ].map((problem, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-red-900/10 border border-red-500/30 rounded-lg"
                  >
                    <X className="text-red-400 flex-shrink-0 mt-1" size={20} />
                    <p className="text-gray-300">{problem}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-12 p-8 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl border-2 border-purple-500/50 text-center">
                <p className="text-2xl font-bold mb-4">
                  Se você se identificou com pelo menos 2 desses problemas...
                </p>
                <p className="text-xl text-purple-400">
                  Este curso foi feito especificamente para você! 👇
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TRANSFORMATION SECTION */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Imagine transformar <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">sua vida profissional</span> em apenas 30 dias
              </h2>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Before */}
                <div className="p-8 bg-gray-800/50 border-2 border-gray-700 rounded-2xl">
                  <div className="text-center mb-6">
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                      ANTES
                    </Badge>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Trabalhando 60+ horas por semana",
                      "Tarefas manuais repetitivas",
                      "Estagnado na carreira",
                      "Renda limitada",
                      "Sem tempo para família"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <X className="text-red-400 flex-shrink-0 mt-1" size={20} />
                        <span className="text-gray-400">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* After */}
                <div className="p-8 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500 rounded-2xl">
                  <div className="text-center mb-6">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                      DEPOIS
                    </Badge>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Economizando 20+ horas por semana",
                      "Automação inteligente trabalhando 24/7",
                      "Promoções e oportunidades chegando",
                      "Renda aumentada em 40-60%",
                      "Mais tempo para o que importa"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="text-green-400 flex-shrink-0 mt-1" size={20} />
                        <span className="text-white font-semibold">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Transformation Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                {[
                  { value: "20+", label: "horas economizadas/semana" },
                  { value: "40-60%", label: "aumento salarial médio" },
                  { value: "90%", label: "taxa de satisfação" },
                  { value: "30 dias", label: "para primeiros resultados" }
                ].map((stat, i) => (
                  <div key={i} className="text-center p-6 bg-black/50 rounded-lg border border-purple-500/30">
                    <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* WHAT YOU'LL LEARN */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
                O que você vai <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">dominar</span>
              </h2>
              <p className="text-xl text-gray-400 text-center mb-12">
                Resultados concretos que você alcançará ao concluir este curso
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {product.copy.benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 p-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/30 hover:border-purple-500 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-lg font-semibold mb-1">{benefit}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-12 text-center">
                <Button
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-12 py-6 text-lg"
                  size="lg"
                >
                  Sim, Quero Dominar Tudo Isso Agora
                  <ArrowRight className="ml-2" size={20} />
                </Button>
                <p className="text-sm text-gray-400 mt-4">
                  ✓ Acesso imediato ✓ Garantia de 30 dias ✓ Certificado incluído
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Continue with more sections in next part... */}
        
        {/* Placeholder for remaining sections */}
        <div className="py-16 bg-gray-900">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-500">
              [Continuação da página com: Curriculum, Bonuses, Testimonials, FAQ, Guarantee, Final CTA...]
            </p>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
