"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { 
  Award, 
  BookOpen, 
  Users, 
  Target, 
  Zap, 
  Trophy,
  Star,
  Quote,
  Linkedin,
  Youtube,
  Instagram,
  Twitter
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  { number: "28+", label: "Anos de Experiência", icon: Trophy },
  { number: "5000+", label: "Alunos Formados", icon: Users },
  { number: "150+", label: "Cursos Criados", icon: BookOpen },
  { number: "94%", label: "Taxa de Satisfação", icon: Star },
];

const timeline = [
  {
    year: "1996",
    title: "Início na Mídia",
    description: "Começou a carreira como editor de vídeo profissional",
  },
  {
    year: "2008",
    title: "Fox International Channels",
    description: "Editor sênior responsável por produções internacionais",
  },
  {
    year: "2015",
    title: "Editor Chefe na FGV",
    description: "Liderou equipe de produção de conteúdo educacional",
  },
  {
    year: "2020",
    title: "Transição para IA",
    description: "Iniciou estudos intensivos em Inteligência Artificial",
  },
  {
    year: "2023",
    title: "Certificações Google Cloud",
    description: "Obteve certificações em IA Generativa e Machine Learning",
  },
  {
    year: "2025",
    title: "FayaPoint AI Academy",
    description: "Fundou a principal plataforma de ensino de IA do Brasil",
  },
];

const values = [
  {
    icon: <Target className="w-8 h-8" />,
    title: "Foco em Resultados",
    description: "Nossos cursos são práticos e orientados para resultados reais no mercado",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Comunidade Forte",
    description: "Mais de 5.000 profissionais conectados, compartilhando conhecimento",
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Inovação Constante",
    description: "Sempre atualizados com as últimas ferramentas e tendências de IA",
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: "Excelência no Ensino",
    description: "Metodologia comprovada com 94% de taxa de conclusão",
  },
];

const certifications = [
  "Prompt Design in Vertex AI",
  "Introduction to Large Language Models",
  "Introduction to Generative AI",
  "Applying AI Principles with Google Cloud",
  "Machine Learning Fundamentals",
  "Advanced Video Production",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <Badge className="mb-4 bg-purple-600/20 text-purple-400 border-purple-500/50">
                Nossa História
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Transformando Vidas com{" "}
                <span className="text-gradient">
                  Inteligência Artificial
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                De editor de vídeo internacional a pioneiro no ensino de IA no Brasil. 
                Conheça a jornada que nos trouxe até aqui.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-y border-gray-800">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                  <div className="text-3xl font-bold mb-1">{stat.number}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* About Ricardo */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="relative">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 p-1">
                    <div className="w-full h-full rounded-2xl bg-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-white mb-2">RF</div>
                        <p className="text-gray-400">Ricardo Faya</p>
                      </div>
                    </div>
                  </div>
                  {/* Social Links */}
                  <div className="flex justify-center gap-4 mt-6">
                    <a href="https://linkedin.com/in/ricardofaya" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-gray-700">
                        <Linkedin className="w-5 h-5" />
                      </Button>
                    </a>
                    <a href="https://youtube.com/@ricardofaya" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-gray-700">
                        <Youtube className="w-5 h-5" />
                      </Button>
                    </a>
                    <a href="https://instagram.com/ricardofaya" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-gray-700">
                        <Instagram className="w-5 h-5" />
                      </Button>
                    </a>
                    <a href="https://twitter.com/ricardofaya" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-gray-700">
                        <Twitter className="w-5 h-5" />
                      </Button>
                    </a>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-6">Ricardo Faya</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    Com mais de 28 anos de experiência em mídia e tecnologia, Ricardo Faya 
                    é um dos pioneiros no ensino de Inteligência Artificial no Brasil.
                  </p>
                  <p>
                    Sua jornada começou como editor de vídeo profissional, trabalhando em 
                    empresas internacionais como Fox International Channels e liderando equipes 
                    na FGV como Editor Chefe.
                  </p>
                  <p>
                    Em 2020, percebendo o potencial transformador da IA, iniciou uma intensa 
                    jornada de estudos, obtendo certificações do Google Cloud em IA Generativa, 
                    Machine Learning e Prompt Engineering.
                  </p>
                  <p>
                    Hoje, dedica-se integralmente a ensinar profissionais e empresas a 
                    dominarem as ferramentas de IA, com uma abordagem prática e resultados 
                    comprovados.
                  </p>
                </div>

                {/* Certifications */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Certificações</h3>
                  <div className="flex flex-wrap gap-2">
                    {certifications.map((cert, i) => (
                      <Badge key={i} variant="outline" className="border-purple-500/50">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Quote */}
        <section className="py-20 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <Quote className="w-12 h-12 mx-auto mb-6 text-purple-400" />
              <blockquote className="text-2xl md:text-3xl font-medium mb-6">
                &ldquo;A IA não é o futuro, é o presente. E quem não aprender a usá-la 
                hoje, ficará para trás amanhã.&rdquo;
              </blockquote>
              <cite className="text-gray-400">— Ricardo Faya, Fundador da FayaPoint</cite>
            </motion.div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Nossa Trajetória</h2>
              <p className="text-xl text-gray-400">
                Uma jornada de transformação e inovação
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {timeline.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex gap-8 mb-12 relative"
                >
                  {/* Line */}
                  {i < timeline.length - 1 && (
                    <div className="absolute left-[88px] top-12 w-0.5 h-full bg-gradient-to-b from-purple-500 to-transparent" />
                  )}
                  
                  {/* Year */}
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="text-purple-400 font-bold">{item.year}</span>
                  </div>
                  
                  {/* Dot */}
                  <div className="flex-shrink-0 w-4 h-4 bg-purple-500 rounded-full mt-1 ring-4 ring-purple-500/20" />
                  
                  {/* Content */}
                  <div className="flex-grow pb-8">
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-gray-900/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Nossos Valores</h2>
              <p className="text-xl text-gray-400">
                O que guia nossa missão de democratizar o conhecimento em IA
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {values.map((value, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="bg-white/5 backdrop-blur border-white/10 p-6 h-full">
                    <div className="text-purple-400 mb-4">{value.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                    <p className="text-gray-400">{value.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Pronto para Começar sua Jornada?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Junte-se a milhares de profissionais que já estão transformando 
                suas carreiras com IA.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/registro">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Começar Gratuitamente
                  </Button>
                </Link>
                <Link href="/cursos">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                  >
                    Ver Nossos Cursos
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
