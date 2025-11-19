"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  PlayCircle,
  Clock,
  Users,
  Star,
  Award,
  CheckCircle,
  Lock,
  Download,
  Globe,
  Calendar,
  BookOpen,
  Target,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Share2,
  Heart,
  ShoppingCart,
  TrendingUp,
  Zap,
  Building2,
  User,
  Sparkles,
  Trophy,
  Gift,
  Shield,
  HelpCircle,
  ArrowRight,
  Rocket,
  Brain,
  DollarSign
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";
import { getCourseBySlug } from "@/data/courses";

type LessonItem = { id: number; title: string; duration: string; isFree?: boolean };
type ModuleItem = { id: number; title: string; duration: string; lessons: number | LessonItem[] };
type ReviewLike = { name: string; rating: number; comment: string; role?: string; date?: string };

export default function CoursePage() {
  const params = useParams();
  const course = getCourseBySlug(params.slug as string);
  
  // Fallback data for old structure
  const courseData = course || {
  id: 1,
  title: "ChatGPT Masterclass: Do Zero ao Avançado",
  subtitle: "Domine o ChatGPT e transforme sua produtividade com técnicas avançadas de prompt engineering",
  instructor: {
    name: "Ricardo Faya",
    bio: "28+ anos de experiência em mídia e tecnologia, certificado em IA pelo Google Cloud",
    avatar: "/instructor.jpg",
    students: 5234,
    courses: 15,
    rating: 4.9,
  },
  price: 197,
  originalPrice: 397,
  currency: "BRL",
  rating: 4.9,
  totalRatings: 342,
  students: 1234,
  lastUpdated: "Outubro 2025",
  language: "Português",
  duration: "12 horas",
  totalLessons: 67,
  level: "Todos os níveis",
  certificate: true,
  category: "IA Generativa",
  tags: ["ChatGPT", "Prompt Engineering", "Automação", "Produtividade"],
  
  features: [
    "12 horas de conteúdo em vídeo",
    "67 aulas práticas",
    "Certificado de conclusão",
    "Acesso vitalício",
    "Atualizações gratuitas",
    "Suporte direto com instrutor",
    "Comunidade exclusiva",
    "30 dias de garantia",
  ],
  
  requirements: [
    "Computador com acesso à internet",
    "Conta gratuita no ChatGPT",
    "Vontade de aprender e praticar",
    "Nenhum conhecimento prévio necessário",
  ],
  
  whatYouLearn: [
    "Dominar completamente o ChatGPT e suas funcionalidades avançadas",
    "Criar prompts profissionais que geram resultados extraordinários",
    "Automatizar tarefas repetitivas e economizar 20+ horas por semana",
    "Integrar ChatGPT com outras ferramentas e APIs",
    "Criar assistentes personalizados para diferentes necessidades",
    "Usar ChatGPT para programação, escrita e análise de dados",
    "Monetizar suas habilidades com ChatGPT",
    "Implementar IA no seu negócio ou trabalho",
  ],
  
  targetAudience: [
    "Profissionais que querem aumentar produtividade",
    "Empreendedores buscando automatizar processos",
    "Criadores de conteúdo",
    "Desenvolvedores e programadores",
    "Estudantes e acadêmicos",
    "Qualquer pessoa interessada em IA",
  ],
  
  modules: [
    {
      id: 1,
      title: "Módulo 1: Fundamentos do ChatGPT",
      duration: "2h 30min",
      lessons: [
        { id: 1, title: "Introdução ao ChatGPT", duration: "15:30", isFree: true },
        { id: 2, title: "Como o ChatGPT funciona", duration: "12:45", isFree: true },
        { id: 3, title: "Interface e configurações", duration: "10:20", isFree: false },
        { id: 4, title: "Primeiros prompts", duration: "18:15", isFree: false },
        { id: 5, title: "Erros comuns e como evitar", duration: "20:00", isFree: false },
      ],
    },
    {
      id: 2,
      title: "Módulo 2: Prompt Engineering Avançado",
      duration: "3h 15min",
      lessons: [
        { id: 6, title: "Anatomia de um prompt perfeito", duration: "25:00", isFree: false },
        { id: 7, title: "Técnicas de few-shot learning", duration: "30:00", isFree: false },
        { id: 8, title: "Chain of thought prompting", duration: "28:30", isFree: false },
        { id: 9, title: "Role-playing e personas", duration: "22:15", isFree: false },
        { id: 10, title: "Prompt templates profissionais", duration: "35:00", isFree: false },
      ],
    },
    {
      id: 3,
      title: "Módulo 3: Automação e Integração",
      duration: "2h 45min",
      lessons: [
        { id: 11, title: "ChatGPT API básico", duration: "30:00", isFree: false },
        { id: 12, title: "Integração com Zapier", duration: "25:00", isFree: false },
        { id: 13, title: "Automação com n8n", duration: "35:00", isFree: false },
        { id: 14, title: "Criando chatbots", duration: "28:00", isFree: false },
        { id: 15, title: "Workflows automatizados", duration: "32:00", isFree: false },
      ],
    },
    {
      id: 4,
      title: "Módulo 4: Casos de Uso Profissionais",
      duration: "3h 30min",
      lessons: [
        { id: 16, title: "ChatGPT para Marketing", duration: "40:00", isFree: false },
        { id: 17, title: "ChatGPT para Vendas", duration: "35:00", isFree: false },
        { id: 18, title: "ChatGPT para Programação", duration: "45:00", isFree: false },
        { id: 19, title: "ChatGPT para Análise de Dados", duration: "38:00", isFree: false },
        { id: 20, title: "ChatGPT para Educação", duration: "32:00", isFree: false },
      ],
    },
  ],
  
  reviews: [
    {
      id: 1,
      name: "Maria Silva",
      avatar: "/user1.jpg",
      rating: 5,
      date: "2 dias atrás",
      comment: "Curso incrível! Aprendi muito mais do que esperava. Ricardo é um excelente professor.",
    },
    {
      id: 2,
      name: "João Santos",
      avatar: "/user2.jpg",
      rating: 5,
      date: "1 semana atrás",
      comment: "Já recuperei o investimento só com as automações que aprendi. Recomendo muito!",
    },
    {
      id: 3,
      name: "Ana Costa",
      avatar: "/user3.jpg",
      rating: 4,
      date: "2 semanas atrás",
      comment: "Ótimo curso, muito completo. Só senti falta de mais exercícios práticos.",
    },
  ],
};

// Build a typed testimonials list from either `testimonials` or legacy `reviews`
const obj = courseData as unknown as Record<string, unknown>;
const tRaw = obj["testimonials"];
const rRaw = obj["reviews"];
const testimonialsList: ReviewLike[] = (Array.isArray(tRaw) ? tRaw : Array.isArray(rRaw) ? rRaw : []).map((item: unknown) => {
  const o = item as Record<string, unknown>;
  return {
    name: String(o.name ?? ""),
    rating: Number(o.rating ?? 0),
    comment: String(o.comment ?? ""),
    role: typeof o.role === "string" ? o.role : undefined,
    date: typeof o.date === "string" ? o.date : undefined,
  };
});
const testimonialsCount = testimonialsList.length;

// State & handlers
const [expandedModules, setExpandedModules] = useState<number[]>([1]);
const [activeTab, setActiveTab] = useState("overview");
const [isInCart, setIsInCart] = useState(false);
const [isFavorite, setIsFavorite] = useState(false);

const toggleModule = (moduleId: number) => {
  setExpandedModules(prev =>
    prev.includes(moduleId)
      ? prev.filter(id => id !== moduleId)
      : [...prev, moduleId]
  );
};

const handleAddToCart = () => {
  setIsInCart(!isInCart);
  toast.success(isInCart ? "Removido do carrinho" : "Adicionado ao carrinho!");
};

const handleFavorite = () => {
  setIsFavorite(!isFavorite);
  toast.success(isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos!");
};

const handleEnroll = () => {
  toast.success("Redirecionando para checkout...");
};

return (
  <div className="min-h-screen bg-background text-foreground">
    <Header />
    
    <main className="pt-24">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                  <Link href="/" className="hover:text-white">Home</Link>
                  <span>/</span>
                  <Link href="/cursos" className="hover:text-white">Cursos</Link>
                  <span>/</span>
                  <span>{courseData.category}</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  {courseData.title}
                </h1>
                
                <p className="text-xl text-gray-300 mb-6">
                  {courseData.subtitle}
                </p>

                <div className="flex items-center gap-4 mb-6">
                  <Badge className="bg-yellow-500 text-black">Bestseller</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="text-yellow-400 fill-yellow-400" size={18} />
                    <span className="font-semibold">{courseData.rating}</span>
                    <span className="text-gray-400">{testimonialsCount.toLocaleString("pt-BR")} avaliações</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={18} className="text-gray-400" />
                    <span>{courseData.students.toLocaleString("pt-BR")} alunos</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Globe size={16} />
                    Português
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    Atualizado em {courseData.lastUpdated}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award size={16} />
                    Certificado de conclusão
                  </span>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-4 mt-8 p-4 bg-gray-900/50 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-2xl font-bold">RF</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Instrutor</p>
                    <p className="font-semibold">Ricardo Faya</p>
                    <p className="text-sm text-gray-400">50.000+ alunos • 20+ cursos</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Purchase Card */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="backdrop-blur border-border p-6 sticky top-24">
                  {/* Video Preview */}
                  <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg mb-6 relative group cursor-pointer">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle size={64} className="text-white/80 group-hover:scale-110 transition" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-sm">
                      Preview Gratuito
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-bold">R$ {courseData.price}</span>
                      <span className="text-gray-500 line-through">R$ {courseData.originalPrice}</span>
                      <Badge className="bg-green-500 text-black">{Math.max(0, Math.round(((courseData.originalPrice - courseData.price) / courseData.originalPrice) * 100))}% OFF</Badge>
                    </div>
                    <p className="text-sm text-gray-400">
                      ou 12x de R$ {(courseData.price / 12).toFixed(2)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      size="lg"
                      onClick={handleEnroll}
                    >
                      Comprar Agora
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-gray-700"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="mr-2" size={18} />
                      {isInCart ? "No Carrinho" : "Adicionar ao Carrinho"}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={handleFavorite}
                      >
                        <Heart className={`mr-2 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} size={18} />
                        Favoritar
                      </Button>
                      <Button variant="ghost" className="flex-1">
                        <Share2 className="mr-2" size={18} />
                        Compartilhar
                      </Button>
                    </div>
                  </div>

                  {/* Features */}
                  <Separator className="my-6 bg-border" />
                  <div className="space-y-3">
                    <h3 className="font-semibold mb-3">Este curso inclui:</h3>
                    {(courseData.features || []).map((feature: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="text-green-400 flex-shrink-0" size={16} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-popover/50 border border-border">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="curriculum">Conteúdo do Curso</TabsTrigger>
              <TabsTrigger value="reviews">Avaliações</TabsTrigger>
              <TabsTrigger value="instructor">Instrutor</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <Card className="backdrop-blur border-border p-6">
                <h2 className="text-2xl font-bold mb-4">O que você aprenderá</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {(courseData.whatYouLearn || []).map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="text-green-400 mt-1 flex-shrink-0" size={20} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="backdrop-blur border-border p-6">
                <h2 className="text-2xl font-bold mb-4">Requisitos</h2>
                <ul className="space-y-2">
                  {(courseData.requirements || []).map((req: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <Target className="text-purple-400" size={16} />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="backdrop-blur border-border p-6">
                <h2 className="text-2xl font-bold mb-4">Para quem é este curso</h2>
                <ul className="space-y-2">
                  {(courseData.targetAudience || []).map((audience: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <Users className="text-blue-400" size={16} />
                      <span>{audience}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </TabsContent>

            {/* Curriculum Tab */}
            <TabsContent value="curriculum">
              <Card className="backdrop-blur border-border p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Conteúdo do Curso</h2>
                  <p className="text-gray-400">
                    {(courseData.modules || []).length} módulos • {(courseData.totalLessons || 0)} aulas • {(courseData.duration || '')} total
                  </p>
                </div>

                <div className="space-y-4">
                  {(courseData.modules || []).map((module: ModuleItem) => (
                    <div key={module.id} className="border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-popover/40 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold">{module.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {Array.isArray(module.lessons) ? module.lessons.length : module.lessons} aulas
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-400">{module.duration}</span>
                          {expandedModules.includes(module.id) ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </div>
                      </button>

                      {expandedModules.includes(module.id) && Array.isArray(module.lessons) && (
                        <div className="border-t border-border">
                          {module.lessons.map((lesson: LessonItem) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-4 hover:bg-popover/30 transition"
                            >
                              <div className="flex items-center gap-3">
                                {lesson.isFree ? (
                                  <PlayCircle className="text-green-400" size={18} />
                                ) : (
                                  <Lock className="text-gray-500" size={18} />
                                )}
                                <span>{lesson.title}</span>
                                {lesson.isFree && (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
                                    Grátis
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-gray-400">{lesson.duration}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <Card className="backdrop-blur border-border p-6">
                <h2 className="text-2xl font-bold mb-6">Avaliações dos Alunos</h2>
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-2">{courseData.rating}</div>
                    <div className="flex justify-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="text-yellow-400 fill-yellow-400" size={20} />
                      ))}
                    </div>
                    <p className="text-gray-400">{testimonialsCount} avaliações</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {testimonialsList.map((review: ReviewLike, i: number) => (
                    <div key={i} className="border-b border-border pb-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="font-bold">
                            {review.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="font-semibold">{review.name}</span>
                            <div className="flex">
                              {[...Array(review.rating)].map((_, j) => (
                                <Star key={j} className="text-yellow-400 fill-yellow-400" size={16} />
                              ))}
                            </div>
                            <span className="text-sm text-gray-400">{review.role || review.date || ""}</span>
                          </div>
                          <p className="text-gray-300">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full mt-6 border-gray-700">
                  Ver Mais Avaliações
                </Button>
              </Card>
            </TabsContent>

            {/* Instructor Tab */}
            <TabsContent value="instructor">
              <Card className="backdrop-blur border-border p-6">
                <div className="flex items-start gap-6">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-4xl font-bold">RF</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">Ricardo Faya</h2>
                    <p className="text-gray-400 mb-4">Especialista em IA e Automação</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <div className="text-2xl font-bold">4.9</div>
                        <div className="text-sm text-gray-400">Avaliação</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">50.000+</div>
                        <div className="text-sm text-gray-400">Alunos</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">20+</div>
                        <div className="text-sm text-gray-400">Cursos</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">28+</div>
                        <div className="text-sm text-gray-400">Anos de Experiência</div>
                      </div>
                    </div>

                    <Link href="/sobre">
                      <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10">
                        Ver Perfil Completo
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);
}
