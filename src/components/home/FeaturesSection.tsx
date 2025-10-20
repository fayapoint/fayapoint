"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { X, CheckCircle2, TrendingDown, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { useRef } from "react";

const problems = [
  "Perdido com tantas ferramentas de IA disponíveis",
  "Gastando horas em tarefas repetitivas",
  "Ficando para trás da concorrência",
  "Pagando caro por consultorias fragmentadas",
  "Sem saber medir o ROI da IA",
];

const solutions = [
  "Dominando as melhores ferramentas de IA do mercado",
  "Automatizando 80% das tarefas repetitivas",
  "Liderando a transformação digital",
  "Aprendendo com quem realmente entende do assunto",
  "ROI comprovado em menos de 30 dias",
];

export function FeaturesSection() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0, 1, 1, 0]);
  
  return (
    <section ref={sectionRef} className="py-20 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          style={{ y }}
          className="absolute -top-40 -left-40 w-80 h-80 bg-red-500/20 rounded-full blur-[100px]"
        />
        <motion.div
          style={{ y: useTransform(y, (value) => value * -1) }}
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-green-500/20 rounded-full blur-[100px]"
        />
      </div>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-block mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-green-500/30 blur-xl" />
              <div className="relative backdrop-blur-sm bg-white/5 border border-white/10 rounded-full px-5 py-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Transforme desafios em oportunidades
                </span>
              </div>
            </div>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-red-400 to-green-400 bg-clip-text text-transparent">
              Seus Desafios, Nossas Soluções
            </span>
          </h2>
          <p className="text-xl text-gray-300">
            Sabemos exatamente o que você está enfrentando
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Problems with Enhanced Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, x: -40, rotateY: -10 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.7, type: "spring" }}
            viewport={{ once: true }}
            className="space-y-4 relative"
            style={{ perspective: 1000 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                animate={{ rotate: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingDown className="text-red-400" size={28} />
              </motion.div>
              <h3 className="text-2xl font-bold text-red-400">
                Sem a FayaPoint
              </h3>
            </div>
            
            <div className="space-y-4">
              {problems.map((problem, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: i * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02, x: 10 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-start gap-3 p-5 backdrop-blur-lg bg-red-900/10 rounded-xl border border-red-500/20 hover:border-red-500/40 transition-all duration-300">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    >
                      <X className="text-red-400 mt-1 flex-shrink-0" size={20} />
                    </motion.div>
                    <span className="text-gray-200">{problem}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Solutions with Enhanced Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotateY: 10 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.7, type: "spring" }}
            viewport={{ once: true }}
            className="space-y-4 relative"
            style={{ perspective: 1000 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingUp className="text-green-400" size={28} />
              </motion.div>
              <h3 className="text-2xl font-bold text-green-400">
                Com a FayaPoint
              </h3>
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="text-yellow-400" size={20} />
              </motion.div>
            </div>
            
            <div className="space-y-4">
              {solutions.map((solution, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: i * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02, x: -10 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-green-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-start gap-3 p-5 backdrop-blur-lg bg-green-900/10 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all duration-300">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 360]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        delay: i * 0.2,
                        rotate: { duration: 4, repeat: Infinity, ease: "linear" }
                      }}
                    >
                      <CheckCircle2 className="text-green-400 mt-1 flex-shrink-0" size={20} />
                    </motion.div>
                    <span className="text-gray-200">{solution}</span>
                    <motion.div
                      className="absolute -right-2 -top-2"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 + i * 0.2 }}
                    >
                      <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-sm" />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
