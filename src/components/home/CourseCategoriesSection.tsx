"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Brain, 
  Palette, 
  Code2, 
  Bot, 
  BarChart3, 
  Briefcase,
  ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const categories = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "IA Generativa",
    description: "ChatGPT, Claude, Gemini e prompts avançados",
    courses: 25,
    color: "from-purple-500 to-pink-500",
    href: "/cursos/categoria/ia-generativa",
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: "Criação Visual",
    description: "Midjourney, DALL-E, Stable Diffusion",
    courses: 18,
    color: "from-blue-500 to-cyan-500",
    href: "/cursos/categoria/criacao-visual",
  },
  {
    icon: <Code2 className="w-6 h-6" />,
    title: "Automação",
    description: "n8n, Make, Zapier, APIs e integrações",
    courses: 22,
    color: "from-green-500 to-emerald-500",
    href: "/cursos/categoria/automacao",
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: "Agentes de IA",
    description: "AutoGPT, AgentGPT, Custom Agents",
    courses: 15,
    color: "from-orange-500 to-red-500",
    href: "/cursos/categoria/agentes-ia",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Análise de Dados",
    description: "Julius AI, DataRobot, análise sem código",
    courses: 12,
    color: "from-indigo-500 to-purple-500",
    href: "/cursos/categoria/analise-dados",
  },
  {
    icon: <Briefcase className="w-6 h-6" />,
    title: "IA para Negócios",
    description: "ROI, implementação, casos práticos",
    courses: 20,
    color: "from-yellow-500 to-orange-500",
    href: "/cursos/categoria/ia-negocios",
  },
];

export function CourseCategoriesSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-purple-900/10 to-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Trilhas de Aprendizado Completas
          </h2>
          <p className="text-xl text-gray-400">
            Mais de 150 cursos organizados para seu sucesso
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {categories.map((category, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Link href={category.href}>
                <Card className="bg-white/5 backdrop-blur border-white/10 hover:bg-white/10 transition-all duration-300 p-6 h-full cursor-pointer group">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                  <p className="text-gray-400 mb-4">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{category.courses} cursos</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="group-hover:text-purple-400 transition"
                    >
                      Explorar <ArrowRight className="ml-1 w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link href="/cursos">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Ver Todos os Cursos <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
