"use client";

import { motion } from "framer-motion";
import { X, CheckCircle2 } from "lucide-react";

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
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Seus Desafios, Nossas Soluções
          </h2>
          <p className="text-xl text-gray-400">
            Sabemos exatamente o que você está enfrentando
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Problems */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold text-red-400 mb-4">
              ❌ Sem a FayaPoint
            </h3>
            <div className="space-y-3">
              {problems.map((problem, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3 p-4 bg-red-900/20 rounded-lg border border-red-500/30 backdrop-blur-sm"
                >
                  <X className="text-red-400 mt-1 flex-shrink-0" size={20} />
                  <span>{problem}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Solutions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold text-green-400 mb-4">
              ✅ Com a FayaPoint
            </h3>
            <div className="space-y-3">
              {solutions.map((solution, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3 p-4 bg-green-900/20 rounded-lg border border-green-500/30 backdrop-blur-sm"
                >
                  <CheckCircle2 className="text-green-400 mt-1 flex-shrink-0" size={20} />
                  <span>{solution}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
