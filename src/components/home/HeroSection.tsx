"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Play, 
  ArrowRight, 
  Users, 
  BookOpen, 
  Trophy, 
  Star, 
  Sparkles,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";

export function HeroSection() {
  // Animated counters
  const [studentsCount, setStudentsCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    const timer1 = setInterval(() => {
      setStudentsCount(prev => prev < 5000 ? prev + 100 : 5000);
    }, 30);
    const timer2 = setInterval(() => {
      setCoursesCount(prev => prev < 150 ? prev + 3 : 150);
    }, 50);
    const timer3 = setInterval(() => {
      setCompletionRate(prev => prev < 94 ? prev + 2 : 94);
    }, 40);

    return () => {
      clearInterval(timer1);
      clearInterval(timer2);
      clearInterval(timer3);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatedGradientText className="mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              <span>Nova Era da Educação em IA no Brasil</span>
            </AnimatedGradientText>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Domine a{" "}
            <span className="text-gradient">
              Inteligência Artificial
            </span>
            <br />e Transforme sua Carreira
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Aprenda com quem tem 28+ anos de experiência em mídia e tecnologia. 
            Cursos práticos de ChatGPT, Midjourney, automação e mais de 100 ferramentas de IA.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link href="/aula-gratis">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8"
              >
                <Play className="mr-2" /> Assistir Aula Grátis
              </Button>
            </Link>
            <Link href="/cursos">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-purple-500 text-purple-400 hover:bg-purple-500/10 text-lg px-8"
              >
                Ver Todos os Cursos <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-8 items-center"
          >
            <div className="flex items-center gap-2">
              <Users className="text-purple-400" />
              <div className="text-left">
                <div className="text-2xl font-bold">{studentsCount.toLocaleString("pt-BR")}+</div>
                <div className="text-sm text-gray-400">Alunos</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="text-pink-400" />
              <div className="text-left">
                <div className="text-2xl font-bold">{coursesCount}+</div>
                <div className="text-sm text-gray-400">Cursos</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="text-yellow-400" />
              <div className="text-left">
                <div className="text-2xl font-bold">{completionRate}%</div>
                <div className="text-sm text-gray-400">Taxa de Conclusão</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="text-orange-400" />
              <div className="text-left">
                <div className="text-2xl font-bold">4.9/5</div>
                <div className="text-sm text-gray-400">Avaliação</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="animate-bounce">
          <ChevronDown className="text-gray-400" />
        </div>
      </motion.div>
    </section>
  );
}
