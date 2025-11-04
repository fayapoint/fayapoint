"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionDivider } from "@/components/ui/section-divider";
import { ArrowRight, Zap, Brain, Target, Briefcase, Code, TrendingUp, BookOpen, Palette, Code2, Bot, BarChart3 } from "lucide-react";

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
    <section className="py-20 relative overflow-visible">
      <SectionDivider icon={BookOpen} />
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Trilhas de Aprendizado Completas
          </h2>
          <p className="text-xl text-muted-foreground">
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
                <Card className="bg-card/50 backdrop-blur border-border hover:bg-card transition-all duration-300 p-6 h-full cursor-pointer group hover:shadow-xl hover:shadow-primary/5">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{category.title}</h3>
                  <p className="text-muted-foreground mb-4">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{category.courses} cursos</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="group-hover:text-primary transition"
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Ver Todos os Cursos <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
