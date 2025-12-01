"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle, Lock, Shield, ArrowRight,
  ChevronDown, ChevronUp, Star, Users,
  TrendingUp, Zap, Globe, Server, Code,
  Search, AlertTriangle, Check, X, Play,
  Clock, AlertCircle, ShoppingCart, Gift,
  Trophy, Flame, Timer, BadgeCheck
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useServiceCart } from "@/contexts/ServiceCartContext";
import { useUser } from "@/contexts/UserContext";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { chatGPTAllowlistingCourse } from "@/data/courses/chatgpt-allowlisting-course";

export default function ChatGPTAllowlistingPage() {
  const router = useRouter();
  const { addItem } = useServiceCart();
  const { isLoggedIn } = useUser();
  
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 59, seconds: 0 });
  
  const course = chatGPTAllowlistingCourse;
  const discount = Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100);
  const savings = course.originalPrice - course.price;
  const totalBonusValue = course.bonuses?.reduce((sum, bonus) => sum + bonus.value, 0) || 0;

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else if (minutes > 0) { minutes--; seconds = 59; }
        else if (hours > 0) { hours--; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleModule = (id: number) => {
    setExpandedModules(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const addToCart = (buyNow = false) => {
    addItem({
      id: `course:${course.slug}`,
      type: 'course',
      name: course.title,
      quantity: 1,
      price: course.price,
      slug: course.slug
    });
    toast.success("Curso adicionado ao carrinho!");
    if (buyNow) {
      if (isLoggedIn) router.push('/checkout/cart');
      else router.push('/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Header />
      
      <main className="pt-20">
        {/* HERO SECTION */}
        <section className="relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/40 via-black to-black py-20 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }} />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-3 gap-12 items-start">
              <div className="lg:col-span-2 space-y-8">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-green-500 text-black font-bold px-3 py-1 border-0">
                    <Globe className="mr-1" size={14} />
                    Novo Padrão de SEO 2025
                  </Badge>
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 animate-pulse">
                    <Timer className="mr-1" size={14} />
                    Oferta de Lançamento: {timeLeft.hours}h {timeLeft.minutes}m
                  </Badge>
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                  Seu Site Está <br/>
                  <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    Invisível para o ChatGPT?
                  </span>
                </h1>

                {/* Subheadline */}
                <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-2xl">
                  95% dos sites bloqueiam bots de IA sem saber. 
                  Aprenda a configurar o <strong>Allowlisting Oficial</strong> e transforme o ChatGPT na sua maior fonte de tráfego qualificado.
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-white/10">
                  <div>
                    <div className="text-3xl font-bold text-green-400">200M+</div>
                    <div className="text-sm text-gray-400">Usuários ChatGPT</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-400">0%</div>
                    <div className="text-sm text-gray-400">Custo de Tráfego</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-400">100%</div>
                    <div className="text-sm text-gray-400">Conforme OpenAI</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-yellow-400">24/7</div>
                    <div className="text-sm text-gray-400">Vendas Automáticas</div>
                  </div>
                </div>

                {/* Trust Bar */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Tecnologias abordadas:</span>
                  <div className="flex gap-3 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
                    <Badge variant="outline">OpenAI</Badge>
                    <Badge variant="outline">Cloudflare</Badge>
                    <Badge variant="outline">Akamai</Badge>
                    <Badge variant="outline">robots.txt</Badge>
                  </div>
                </div>
              </div>

              {/* Purchase Card */}
              <div className="lg:col-span-1 relative">
                <div className="absolute -inset-1 bg-gradient-to-b from-green-500 to-blue-600 rounded-2xl blur opacity-30"></div>
                <Card className="relative bg-gray-900/90 backdrop-blur border-gray-800 p-6 shadow-2xl">
                  <div className="aspect-video bg-black rounded-lg mb-6 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-blue-900/20" />
                    <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <Globe className="text-green-500 w-16 h-16 opacity-80" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-mono">
                      PREVIEW
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-end gap-3">
                      <span className="text-4xl font-bold text-white">R$ {course.price}</span>
                      <span className="text-gray-500 line-through mb-1">R$ {course.originalPrice}</span>
                      <Badge className="bg-red-500 text-white mb-1">-{discount}%</Badge>
                    </div>

                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                      <span className="text-green-400 text-sm font-bold">
                        Economia de R$ {savings} (Apenas Hoje)
                      </span>
                    </div>

                    <Button 
                      onClick={() => addToCart(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg shadow-lg shadow-green-500/20 transition-all hover:scale-[1.02]"
                    >
                      Começar Agora
                      <ArrowRight className="ml-2" size={20} />
                    </Button>

                    <p className="text-center text-xs text-gray-500">
                      Acesso vitalício • Garantia de 30 dias • Certificado
                    </p>

                    <div className="space-y-3 pt-4 border-t border-gray-800">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="text-green-500" size={16} />
                        <span>Configuração Cloudflare & Akamai</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="text-green-500" size={16} />
                        <span>Templates de robots.txt</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="text-green-500" size={16} />
                        <span>Checklists de Implementação</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="text-green-500" size={16} />
                        <span>Acesso à Comunidade VIP</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM SECTION */}
        <section className="py-20 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                O Google não é mais a <span className="text-red-500">única porta de entrada</span>
              </h2>
              <p className="text-xl text-gray-400">
                Milhões de pessoas pararam de "dar um Google" e começaram a "perguntar pro ChatGPT". 
                Se você não está lá, seu concorrente estará.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800 hover:border-red-500/50 transition-colors">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="text-red-500" size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">O Bloqueio Invisível</h3>
                <p className="text-gray-400">
                  WAFs e CDNs modernos estão bloqueando bots de IA por padrão. Seu site pode estar rejeitando tráfego valioso sem você saber.
                </p>
              </div>
              <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800 hover:border-red-500/50 transition-colors">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                  <Search className="text-red-500" size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Perda de Autoridade</h3>
                <p className="text-gray-400">
                  Quando a IA não consegue ler seu site, ela usa fontes de terceiros (ou alucina). Você perde o controle da narrativa da sua marca.
                </p>
              </div>
              <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800 hover:border-red-500/50 transition-colors">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="text-red-500" size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Tráfego Zero-Click</h3>
                <p className="text-gray-400">
                  As respostas diretas da IA são o novo "topo do Google". Não estar lá significa desaparecer do radar do consumidor moderno.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SOLUTION / CURRICULUM */}
        <section className="py-20 bg-gray-900/50 border-y border-white/5">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  O que você vai dominar
                </h2>
                <p className="text-gray-400 mb-8 text-lg">
                  Um passo a passo técnico e estratégico para colocar seu site dentro do cérebro das IAs mais avançadas do mundo.
                </p>
                
                <div className="space-y-4">
                  {course.modules.map((module) => (
                    <div key={module.id} className="group">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-4 bg-black border border-gray-800 rounded-lg hover:border-green-500/50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400 group-hover:bg-green-900 group-hover:text-green-400 transition-colors">
                            {module.id}
                          </div>
                          <span className="font-semibold text-left">{module.title}</span>
                        </div>
                        {expandedModules.includes(module.id) ? (
                          <ChevronUp className="text-gray-500" />
                        ) : (
                          <ChevronDown className="text-gray-500" />
                        )}
                      </button>
                      {expandedModules.includes(module.id) && (
                        <div className="p-4 pl-16 text-gray-400 bg-black/50 border-x border-b border-gray-800 rounded-b-lg text-sm">
                          <ul className="space-y-2 list-disc pl-4">
                            {module.topics.map((topic, idx) => (
                              <li key={idx}>{topic}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="sticky top-24">
                <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-white/10 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Gift className="text-green-400" />
                    Bônus Inclusos
                  </h3>
                  <div className="space-y-6">
                    {course.bonuses?.map((bonus, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="mt-1">
                          <CheckCircle className="text-green-500 w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{bonus.title}</h4>
                          <p className="text-sm text-gray-400">{bonus.description}</p>
                          <div className="text-xs text-green-400 mt-1 font-mono">
                            Valor: R$ {bonus.value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <div className="text-sm text-gray-400 mb-1">Valor Total dos Bônus</div>
                    <div className="text-3xl font-bold text-green-400">
                      R$ {totalBonusValue}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
                      GRÁTIS COM O CURSO
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-20 bg-black">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Quem aplicou, <span className="text-green-400">aprovou</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {course.testimonials.slice(0, 3).map((t, i) => (
                <Card key={i} className="bg-gray-900 border-gray-800 p-6 hover:border-green-500/30 transition-colors">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 min-h-[80px]">"{t.comment}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center font-bold">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-white">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.role}</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="text-xs font-mono text-green-400 flex items-center gap-2">
                      <TrendingUp size={14} />
                      {t.impact}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FOOTER */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-green-900/20"></div>
          <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pronto para ser encontrado pela IA?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Junte-se a mais de {course.students} alunos que já prepararam seus sites para o futuro da internet.
            </p>
            <Button 
              onClick={() => addToCart(true)}
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-12 py-8 text-xl rounded-full shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_50px_rgba(34,197,94,0.5)] transition-all transform hover:-translate-y-1"
            >
              Quero Acesso Imediato
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-2"><Shield size={16} /> Garantia de 30 dias</span>
              <span className="flex items-center gap-2"><Lock size={16} /> Pagamento Seguro</span>
              <span className="flex items-center gap-2"><Zap size={16} /> Acesso Vitalício</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
