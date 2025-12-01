"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  CheckCircle, Lock, Shield, ArrowRight,
  ChevronDown, ChevronUp, Star,
  TrendingUp, Zap, Globe,
  Search, AlertTriangle, Check, X,
  Gift, Timer, MessageSquare, Bot,
  ShoppingBag, Building2, Newspaper, Sparkles,
  Brain, Target, DollarSign, Eye, EyeOff,
  Quote, BarChart3, Lightbulb, Rocket
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useServiceCart } from "@/contexts/ServiceCartContext";
import { useUser } from "@/contexts/UserContext";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { chatGPTAllowlistingCourse } from "@/data/courses/chatgpt-allowlisting-course";

// Real-world scenario examples
const realScenarios = [
  {
    icon: ShoppingBag,
    persona: "Dono de E-commerce",
    question: "Qual o melhor tênis de corrida para iniciantes?",
    without: "ChatGPT recomenda Nike, Adidas... e ignora sua loja completamente.",
    with: "ChatGPT cita SEU produto: 'A loja XYZ tem ótimas opções como o Modelo ABC por R$299'",
    result: "+47% vendas via IA"
  },
  {
    icon: Building2,
    persona: "Advogado",
    question: "Preciso de um advogado trabalhista em São Paulo",
    without: "ChatGPT lista escritórios genéricos ou diz 'consulte a OAB'.",
    with: "ChatGPT recomenda SEU escritório: 'O Dr. Silva do Escritório XYZ é especialista em...'",
    result: "+12 clientes/mês"
  },
  {
    icon: Newspaper,
    persona: "Produtor de Conteúdo",
    question: "Como fazer marketing no Instagram em 2025?",
    without: "ChatGPT usa artigos de HubSpot, Neil Patel... nunca o seu.",
    with: "ChatGPT cita SEU artigo como fonte: 'Segundo o blog XYZ, as melhores práticas são...'",
    result: "500+ citações/mês"
  }
];

export default function ChatGPTAllowlistingPage() {
  const router = useRouter();
  const { addItem } = useServiceCart();
  const { isLoggedIn } = useUser();
  
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 59, seconds: 0 });
  const [activeScenario, setActiveScenario] = useState(0);
  
  const aeoRef = useRef(null);
  const aeoInView = useInView(aeoRef, { once: true, margin: "-100px" });
  
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

  // Rotate scenarios
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScenario(prev => (prev + 1) % realScenarios.length);
    }, 8000);
    return () => clearInterval(interval);
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
        {/* HERO SECTION - Immersive Opening */}
        <section className="relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/40 via-black to-black py-24 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
          </div>
          
          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-green-400/30 rounded-full"
                style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                animate={{ y: [-20, 20], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                {/* New SEO Term Badge */}
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-4 py-2 border-0 text-sm">
                    <Brain className="mr-2" size={16} />
                    AEO: Answer Engine Optimization
                  </Badge>
                  <Badge className="bg-white/10 text-white/80 border-white/20 px-3 py-1">
                    <Timer className="mr-1" size={14} />
                    {timeLeft.hours}h {timeLeft.minutes}m restantes
                  </Badge>
                </div>

                {/* Powerful Headline */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
                  O ChatGPT está <br/>
                  <span className="relative">
                    <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      recomendando seu concorrente
                    </span>
                    <motion.span 
                      className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                    />
                  </span>
                  <br/>
                  <span className="text-white/90">enquanto você está invisível.</span>
                </h1>

                {/* Compelling Subheadline */}
                <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-xl">
                  200 milhões de pessoas perguntam ao ChatGPT todos os dias. Quando alguém pergunta sobre <strong className="text-white">seu nicho</strong>, você é citado ou ignorado?
                </p>

                {/* Primary CTA */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => addToCart(true)}
                    size="lg"
                    className="bg-green-500 hover:bg-green-400 text-black font-bold text-lg px-8 py-7 shadow-[0_0_40px_rgba(34,197,94,0.3)] hover:shadow-[0_0_60px_rgba(34,197,94,0.5)] transition-all group"
                  >
                    Quero Aparecer na IA
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                  </Button>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Shield size={16} className="text-green-500" />
                    Garantia de 30 dias
                  </div>
                </div>

                {/* Social Proof Mini */}
                <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                  <div className="flex -space-x-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 border-2 border-black flex items-center justify-center text-xs font-bold">
                        {['RF', 'JC', 'PA', 'CT', 'BO'][i]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex gap-0.5 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-400">+{course.students} profissionais já configuraram</p>
                  </div>
                </div>
              </div>

              {/* Interactive Demo Card */}
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-b from-green-500/30 to-blue-600/30 rounded-3xl blur-xl"></div>
                <Card className="relative bg-gray-900/95 backdrop-blur border-gray-700 p-0 shadow-2xl overflow-hidden">
                  {/* Simulated ChatGPT Interface */}
                  <div className="bg-[#343541] p-4 border-b border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Bot className="text-green-400" size={18} />
                      <span className="font-medium">ChatGPT</span>
                    </div>
                  </div>
                  
                  <div className="p-5 space-y-4 bg-[#40414f] min-h-[180px]">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={16} className="text-white" />
                      </div>
                      <div className="bg-[#343541] rounded-lg p-3 text-sm text-gray-200">
                        {realScenarios[activeScenario].question}
                      </div>
                    </div>
                    
                    <motion.div 
                      key={activeScenario}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-sm bg-green-600 flex items-center justify-center flex-shrink-0">
                        <Bot size={16} className="text-white" />
                      </div>
                      <div className="bg-[#343541] rounded-lg p-3 text-sm text-gray-200 border-l-2 border-green-500">
                        {realScenarios[activeScenario].with}
                      </div>
                    </motion.div>
                  </div>

                  {/* Scenario Tabs */}
                  <div className="flex border-t border-gray-700">
                    {realScenarios.map((scenario, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveScenario(i)}
                        className={`flex-1 py-3 px-2 text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                          activeScenario === i 
                            ? 'bg-green-500/20 text-green-400 border-b-2 border-green-500' 
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        <scenario.icon size={14} />
                        <span className="hidden sm:inline">{scenario.persona.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>

                  {/* Price Section */}
                  <div className="p-5 bg-gray-900 space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-3xl font-bold text-white">R$ {course.price}</span>
                        <span className="text-gray-500 line-through ml-2">R$ {course.originalPrice}</span>
                      </div>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">-{discount}%</Badge>
                    </div>

                    <Button 
                      onClick={() => addToCart(true)}
                      className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-6 text-lg transition-all hover:scale-[1.02]"
                    >
                      Dominar AEO Agora
                      <ArrowRight className="ml-2" size={20} />
                    </Button>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-400">
                      <div className="p-2 bg-gray-800/50 rounded">
                        <Lock size={14} className="mx-auto mb-1 text-green-500" />
                        Seguro
                      </div>
                      <div className="p-2 bg-gray-800/50 rounded">
                        <Zap size={14} className="mx-auto mb-1 text-green-500" />
                        Vitalício
                      </div>
                      <div className="p-2 bg-gray-800/50 rounded">
                        <Shield size={14} className="mx-auto mb-1 text-green-500" />
                        Garantia
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* AEO EXPLANATION - The New SEO */}
        <section ref={aeoRef} className="py-24 bg-gradient-to-b from-black via-gray-950 to-black relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          
          <div className="container mx-auto px-4 relative z-10">
            {/* Section Header */}
            <div className="max-w-4xl mx-auto text-center mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={aeoInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
              >
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-6 px-4 py-2">
                  <Lightbulb className="mr-2" size={16} />
                  O Novo Paradigma do Marketing Digital
                </Badge>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
                  Bem-vindo à era do{" "}
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    AEO
                  </span>
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                  <strong className="text-white">Answer Engine Optimization</strong> é a evolução natural do SEO. 
                  Enquanto o SEO tradicional te coloca nos resultados de busca, o AEO te coloca <em>dentro da resposta</em>.
                </p>
              </motion.div>
            </div>

            {/* SEO vs AEO Comparison */}
            <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
              {/* SEO Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={aeoInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gray-800/50 rounded-2xl transform group-hover:scale-[1.02] transition-transform" />
                <div className="relative p-8 border border-gray-700 rounded-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gray-700 flex items-center justify-center">
                      <Search className="text-gray-400" size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-400">SEO Tradicional</h3>
                      <p className="text-sm text-gray-500">O que você já conhece</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3 text-gray-400">
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-gray-600 flex-shrink-0" />
                      <span>Você aparece em uma <strong className="text-gray-300">lista de 10 links</strong></span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-400">
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-gray-600 flex-shrink-0" />
                      <span>Usuário precisa <strong className="text-gray-300">clicar e navegar</strong></span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-400">
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-gray-600 flex-shrink-0" />
                      <span>Competição por <strong className="text-gray-300">posição no ranking</strong></span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-400">
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-gray-600 flex-shrink-0" />
                      <span>Resultados genéricos e <strong className="text-gray-300">impessoais</strong></span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* AEO Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={aeoInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/30 to-blue-500/30 rounded-2xl blur-sm group-hover:blur-md transition-all" />
                <div className="relative p-8 bg-gray-900 border border-green-500/30 rounded-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                      <Brain className="text-white" size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">AEO: O Futuro</h3>
                      <p className="text-sm text-green-400/70">O que você vai dominar</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3 text-gray-300">
                      <Check className="mt-0.5 text-green-500 flex-shrink-0" size={18} />
                      <span>Você é <strong className="text-white">A resposta direta</strong>, não um link</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-300">
                      <Check className="mt-0.5 text-green-500 flex-shrink-0" size={18} />
                      <span>IA <strong className="text-white">recomenda e cita</strong> você automaticamente</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-300">
                      <Check className="mt-0.5 text-green-500 flex-shrink-0" size={18} />
                      <span>Competição por <strong className="text-white">ser a fonte confiável</strong></span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-300">
                      <Check className="mt-0.5 text-green-500 flex-shrink-0" size={18} />
                      <span>Respostas <strong className="text-white">personalizadas que vendem</strong></span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>

            {/* Key Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={aeoInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
            >
              <div className="text-center p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
                <div className="text-4xl font-bold text-green-400 mb-2">40%</div>
                <div className="text-sm text-gray-400">da Gen Z prefere IA ao Google</div>
              </div>
              <div className="text-center p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
                <div className="text-4xl font-bold text-blue-400 mb-2">200M+</div>
                <div className="text-sm text-gray-400">usuários ativos no ChatGPT</div>
              </div>
              <div className="text-center p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
                <div className="text-4xl font-bold text-purple-400 mb-2">95%</div>
                <div className="text-sm text-gray-400">dos sites bloqueiam IA sem saber</div>
              </div>
              <div className="text-center p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
                <div className="text-4xl font-bold text-yellow-400 mb-2">0%</div>
                <div className="text-sm text-gray-400">custo por clique via AEO</div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* BEFORE/AFTER SCENARIOS - The Real Impact */}
        <section className="py-24 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-6 px-4 py-2">
                <Target className="mr-2" size={16} />
                Cenários Reais de Mercado
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                O que muda quando você está{" "}
                <span className="text-green-400">visível</span>?
              </h2>
              <p className="text-xl text-gray-400">
                Veja como profissionais de diferentes áreas transformaram suas conversões com AEO
              </p>
            </div>

            <div className="grid gap-8 max-w-5xl mx-auto">
              {realScenarios.map((scenario, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="relative"
                >
                  <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-gray-800">
                    {/* Before */}
                    <div className="p-8 bg-gray-900/80 relative">
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <EyeOff size={12} className="mr-1" /> SEM Allowlisting
                        </Badge>
                      </div>
                      <div className="pt-8">
                        <div className="flex items-center gap-3 mb-4">
                          <scenario.icon className="text-gray-500" size={24} />
                          <span className="font-bold text-gray-400">{scenario.persona}</span>
                        </div>
                        <div className="mb-4 p-3 bg-gray-800 rounded-lg text-sm text-gray-300">
                          <span className="text-gray-500">Usuário pergunta:</span><br/>
                          &quot;{scenario.question}&quot;
                        </div>
                        <div className="flex items-start gap-2">
                          <X className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                          <p className="text-gray-400">{scenario.without}</p>
                        </div>
                      </div>
                    </div>

                    {/* After */}
                    <div className="p-8 bg-gradient-to-br from-green-900/20 to-black relative border-l border-gray-800">
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Eye size={12} className="mr-1" /> COM AEO
                        </Badge>
                      </div>
                      <div className="pt-8">
                        <div className="flex items-center gap-3 mb-4">
                          <scenario.icon className="text-green-500" size={24} />
                          <span className="font-bold text-white">{scenario.persona}</span>
                        </div>
                        <div className="mb-4 p-3 bg-black/50 rounded-lg text-sm text-gray-300 border border-green-500/20">
                          <span className="text-green-500">ChatGPT responde:</span><br/>
                          &quot;{scenario.with}&quot;
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="text-green-500" size={18} />
                          <span className="font-bold text-green-400">{scenario.result}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Win CTA */}
            <div className="text-center mt-16">
              <Button 
                onClick={() => addToCart(true)}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-bold text-lg px-10 py-7"
              >
                Quero Esses Resultados
                <Rocket className="ml-2" size={20} />
              </Button>
            </div>
          </div>
        </section>

        {/* SOLUTION / CURRICULUM */}
        <section className="py-24 bg-gray-900/50 border-y border-white/5">
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

        {/* TESTIMONIALS - Enhanced with Featured Quote */}
        <section className="py-24 bg-black relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mb-6 px-4 py-2">
                <Star className="mr-2 fill-yellow-400" size={16} />
                Resultados Comprovados
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Profissionais que <span className="text-green-400">dominaram o AEO</span>
              </h2>
            </div>

            {/* Featured Testimonial */}
            <div className="max-w-4xl mx-auto mb-12">
              <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30 p-8 md:p-12 relative overflow-hidden">
                <Quote className="absolute top-6 left-6 text-green-500/20 w-20 h-20" />
                <div className="relative z-10">
                  <p className="text-2xl md:text-3xl text-white leading-relaxed mb-8 font-light">
                    &quot;Em 2 semanas após implementar o allowlisting, nosso blog começou a aparecer em respostas do ChatGPT. 
                    <span className="text-green-400 font-medium"> O tráfego orgânico aumentou 180%!</span>&quot;
                  </p>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-xl font-bold">
                        RM
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">Rafael Mendes</div>
                        <div className="text-gray-400">CEO, TechStart Brasil</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full">
                      <BarChart3 className="text-green-400" size={18} />
                      <span className="font-bold text-green-400">Tráfego: 0 → 12k/mês</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Other Testimonials */}
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {course.testimonials.slice(1, 4).map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="bg-gray-900/80 border-gray-800 p-6 h-full hover:border-green-500/30 transition-all hover:-translate-y-1">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={14} className="fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-6 leading-relaxed">&quot;{t.comment}&quot;</p>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center font-bold text-sm">
                        {t.name.split(' ').map(n => n[0]).join('')}
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
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA - Urgency & Value Stack */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-green-950/30 to-black" />
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              {/* Value Stack */}
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  Você vai receber <span className="text-green-400">tudo isso</span>:
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-12">
                <div className="flex items-center gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                  <Check className="text-green-500 flex-shrink-0" size={20} />
                  <span className="text-gray-300">Curso completo de AEO (8+ horas)</span>
                  <span className="ml-auto text-gray-500 line-through text-sm">R$ 997</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                  <Check className="text-green-500 flex-shrink-0" size={20} />
                  <span className="text-gray-300">Templates robots.txt (20+)</span>
                  <span className="ml-auto text-gray-500 line-through text-sm">R$ 197</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                  <Check className="text-green-500 flex-shrink-0" size={20} />
                  <span className="text-gray-300">Regras Cloudflare prontas</span>
                  <span className="ml-auto text-gray-500 line-through text-sm">R$ 297</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                  <Check className="text-green-500 flex-shrink-0" size={20} />
                  <span className="text-gray-300">Dashboard de monitoramento</span>
                  <span className="ml-auto text-gray-500 line-through text-sm">R$ 497</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                  <Check className="text-green-500 flex-shrink-0" size={20} />
                  <span className="text-gray-300">Acesso comunidade VIP</span>
                  <span className="ml-auto text-gray-500 line-through text-sm">R$ 297</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                  <Check className="text-green-500 flex-shrink-0" size={20} />
                  <span className="text-gray-300">Atualizações vitalícias</span>
                  <span className="ml-auto text-gray-500 line-through text-sm">∞</span>
                </div>
              </div>

              {/* Price Box */}
              <div className="max-w-lg mx-auto">
                <Card className="bg-gray-900 border-green-500/30 p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                  
                  <div className="mb-4">
                    <span className="text-gray-400 text-lg">Valor total:</span>
                    <span className="text-gray-500 line-through ml-2 text-lg">R$ 2.285</span>
                  </div>
                  
                  <div className="mb-6">
                    <span className="text-gray-400 text-lg">Hoje apenas:</span>
                    <div className="flex items-center justify-center gap-3 mt-2">
                      <span className="text-5xl md:text-6xl font-bold text-white">R$ {course.price}</span>
                      <Badge className="bg-red-500 text-white border-0 text-lg px-3 py-1">-{discount}%</Badge>
                    </div>
                    <p className="text-green-400 text-sm mt-2">Economia de R$ {savings} + R$ {totalBonusValue} em bônus</p>
                  </div>

                  <Button 
                    onClick={() => addToCart(true)}
                    className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-8 text-xl shadow-[0_0_40px_rgba(34,197,94,0.4)] hover:shadow-[0_0_60px_rgba(34,197,94,0.6)] transition-all"
                  >
                    Dominar AEO Agora
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>

                  <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-400 flex-wrap">
                    <span className="flex items-center gap-2"><Shield size={16} className="text-green-500" /> 30 dias de garantia</span>
                    <span className="flex items-center gap-2"><Lock size={16} className="text-green-500" /> Pagamento seguro</span>
                  </div>
                </Card>

                {/* Final Trust */}
                <p className="text-center text-gray-500 text-sm mt-8 max-w-md mx-auto">
                  Seu site pode continuar invisível para milhões de usuários de IA, ou você pode agir agora e ser encontrado. A escolha é sua.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
