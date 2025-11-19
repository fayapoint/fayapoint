"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  PlayCircle, Clock, Users, Star, Award, CheckCircle, Lock, Download,
  Globe, Calendar, BookOpen, Target, ChevronDown, ChevronUp, MessageSquare,
  Share2, Heart, ShoppingCart, TrendingUp, Zap, Building2, User, Sparkles,
  Trophy, Gift, Shield, HelpCircle, ArrowRight, Rocket, Brain, DollarSign
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

export default function EnhancedCoursePage() {
  const params = useParams();
  const course = getCourseBySlug(params.slug as string);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  if (!course) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Curso não encontrado</h1>
            <Link href="/cursos">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Ver todos os cursos
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const discount = Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100);

  const handleEnroll = () => {
    toast.success("Redirecionando para checkout...");
    // Implement checkout logic
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 bg-gradient-to-b from-purple-900/20 to-black">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/50">
                  {course.category}
                </Badge>
                <Badge variant="outline">
                  {course.level}
                </Badge>
                {discount > 0 && (
                  <Badge className="bg-red-600/20 text-red-400 border-red-500/50">
                    -{discount}% OFF
                  </Badge>
                )}
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold">
                {course.title}
              </h1>
              
              <p className="text-xl text-gray-300">
                {course.subtitle}
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="text-yellow-400" size={18} />
                  <strong>{course.rating}</strong> ({course.students.toLocaleString()} alunos)
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={18} />
                  {course.duration}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={18} />
                  {course.totalLessons} aulas
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={18} />
                  Atualizado: {course.lastUpdated}
                </span>
              </div>
              
              <p className="text-gray-300">
                {course.shortDescription}
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:sticky lg:top-24"
            >
              <Card className="p-8 bg-gray-900 border-purple-500/20">
                <div className="space-y-6">
                  {/* Price */}
                  <div>
                    {discount > 0 && (
                      <p className="text-gray-400 line-through text-lg">
                        R$ {course.originalPrice.toLocaleString('pt-BR')}
                      </p>
                    )}
                    <p className="text-4xl font-bold">
                      R$ {course.price.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      ou 12x de R$ {(course.price / 12).toFixed(2)}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleEnroll}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
                  >
                    <ShoppingCart className="mr-2" />
                    Comprar Agora
                  </Button>
                  
                  <div className="space-y-3 text-sm">
                    <p className="flex items-center gap-2">
                      <CheckCircle className="text-green-400" size={18} />
                      Acesso vitalício
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle className="text-green-400" size={18} />
                      Certificado de conclusão
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle className="text-green-400" size={18} />
                      30 dias de garantia
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle className="text-green-400" size={18} />
                      Suporte direto com instrutor
                    </p>
                  </div>
                  
                  <Separator className="bg-gray-700" />
                  
                  <div className="text-center text-sm text-gray-400">
                    <p>🔒 Compra 100% segura</p>
                    <p className="mt-2">✅ Satisfação garantida ou seu dinheiro de volta</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Impact Section */}
      <section className="py-16 bg-gradient-to-b from-black to-purple-900/10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Impacto Transformador do {course.tool}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 bg-gray-900/50 border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <User className="text-purple-400" size={24} />
                <h3 className="text-xl font-semibold">Para Você</h3>
              </div>
              <ul className="space-y-3">
                {course.impactForIndividuals.slice(0, 6).map((impact, i) => (
                  <li key={i} className="text-sm text-gray-300">
                    {impact}
                  </li>
                ))}
              </ul>
            </Card>
            
            <Card className="p-6 bg-gray-900/50 border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Rocket className="text-purple-400" size={24} />
                <h3 className="text-xl font-semibold">Para Empreendedores</h3>
              </div>
              <ul className="space-y-3">
                {course.impactForEntrepreneurs.slice(0, 6).map((impact, i) => (
                  <li key={i} className="text-sm text-gray-300">
                    {impact}
                  </li>
                ))}
              </ul>
            </Card>
            
            <Card className="p-6 bg-gray-900/50 border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="text-purple-400" size={24} />
                <h3 className="text-xl font-semibold">Para Empresas</h3>
              </div>
              <ul className="space-y-3">
                {course.impactForCompanies.slice(0, 6).map((impact, i) => (
                  <li key={i} className="text-sm text-gray-300">
                    {impact}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Full Description */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="p-8 bg-gray-900/50 border-purple-500/20">
            <h2 className="text-2xl font-bold mb-6">Sobre o Curso</h2>
            <div className="prose prose-invert max-w-none">
              {course.fullDescription.split('\n\n').map((paragraph, i) => (
                <p key={i} className="text-gray-300 mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </Card>
        </div>
      </section>
      
      {/* What You'll Learn */}
      <section className="py-16 bg-gradient-to-b from-black to-purple-900/10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">
            O Que Você Vai Aprender
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {course.whatYouLearn.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <CheckCircle className="text-green-400 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-300">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Curriculum */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Conteúdo do Curso
          </h2>
          
          <div className="space-y-4 max-w-4xl mx-auto">
            {course.modules.map((module) => (
              <Card key={module.id} className="p-6 bg-gray-900/50 border-purple-500/20">
                <button
                  onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                  className="w-full"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="text-lg font-semibold">
                        Módulo {module.id}: {module.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {module.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span>{module.duration}</span>
                        <span>{module.lessons} aulas</span>
                      </div>
                    </div>
                    {expandedModule === module.id ? (
                      <ChevronUp className="text-purple-400" />
                    ) : (
                      <ChevronDown className="text-purple-400" />
                    )}
                  </div>
                </button>
                
                {expandedModule === module.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 pt-4 border-t border-gray-700"
                  >
                    <ul className="space-y-2">
                      {module.topics.map((topic, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                          <PlayCircle size={16} className="text-purple-400" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 bg-gradient-to-b from-black to-purple-900/10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">
            O Que Nossos Alunos Dizem
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {course.testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 bg-gray-900/50 border-purple-500/20 h-full">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        className={i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}
                      />
                    ))}
                  </div>
                  
                  <p className="text-gray-300 mb-4">
                    &ldquo;{testimonial.comment}&rdquo;
                  </p>
                  
                  {testimonial.impact && (
                    <p className="text-green-400 text-sm mb-4 font-semibold">
                      ✨ {testimonial.impact}
                    </p>
                  )}
                  
                  <div className="mt-auto">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">
                      {testimonial.role}
                      {testimonial.company && ` - ${testimonial.company}`}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Bonuses */}
      {course.bonuses && course.bonuses.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">
              🎁 Bônus Exclusivos
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {course.bonuses.map((bonus, i) => (
                <Card key={i} className="p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
                  <Gift className="text-purple-400 mb-3" size={24} />
                  <h3 className="font-semibold mb-2">{bonus.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">{bonus.description}</p>
                  <p className="text-lg font-bold text-purple-400">
                    Valor: R$ {bonus.value}
                  </p>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <p className="text-2xl font-bold text-purple-400">
                Total em Bônus: R$ {course.bonuses.reduce((sum, b) => sum + b.value, 0).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </section>
      )}
      
      {/* FAQs */}
      <section className="py-16 bg-gradient-to-b from-black to-purple-900/10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Perguntas Frequentes
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {course.faqs.map((faq, i) => (
              <Card key={i} className="p-6 bg-gray-900/50 border-purple-500/20">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="font-semibold pr-4">{faq.question}</h3>
                  {expandedFaq === i ? (
                    <ChevronUp className="text-purple-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="text-purple-400 flex-shrink-0" />
                  )}
                </button>
                
                {expandedFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 text-gray-300"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900 to-pink-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para Transformar Sua Vida?
          </h2>
          <p className="text-xl mb-8 text-gray-200 max-w-2xl mx-auto">
            Junte-se a mais de {course.students.toLocaleString()} alunos que já estão dominando {course.tool}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              onClick={handleEnroll}
              size="lg"
              className="bg-white text-purple-900 hover:bg-gray-100 text-lg px-8 py-6"
            >
              <ShoppingCart className="mr-2" />
              Garantir Minha Vaga Agora
            </Button>
            <div className="text-left">
              <p className="text-3xl font-bold">
                R$ {course.price.toLocaleString('pt-BR')}
              </p>
              {discount > 0 && (
                <p className="text-gray-300 line-through">
                  R$ {course.originalPrice.toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6 justify-center text-sm">
            <span className="flex items-center gap-2">
              <Shield className="text-green-400" />
              30 dias de garantia
            </span>
            <span className="flex items-center gap-2">
              <Award className="text-yellow-400" />
              Certificado incluído
            </span>
            <span className="flex items-center gap-2">
              <Users className="text-blue-400" />
              Comunidade exclusiva
            </span>
            <span className="flex items-center gap-2">
              <Zap className="text-purple-400" />
              Acesso imediato
            </span>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
