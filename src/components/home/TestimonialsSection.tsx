"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";

const testimonials = [
  {
    name: "Ana Silva",
    role: "CEO, TechStart",
    content: "Implementei IA na minha empresa e reduzi 40% dos custos operacionais. Os cursos do Ricardo são práticos e diretos ao ponto.",
    rating: 5,
    image: "/testimonials/ana.jpg",
  },
  {
    name: "Carlos Mendes",
    role: "Criador de Conteúdo",
    content: "Triplicei minha produção de conteúdo usando as técnicas ensinadas. Agora uso IA diariamente no meu workflow.",
    rating: 5,
    image: "/testimonials/carlos.jpg",
  },
  {
    name: "Juliana Costa",
    role: "Gerente de Marketing",
    content: "O ROI foi imediato! Em 2 meses já havia economizado o valor investido em todos os cursos.",
    rating: 5,
    image: "/testimonials/juliana.jpg",
  },
  {
    name: "Pedro Santos",
    role: "Desenvolvedor Full Stack",
    content: "As aulas de automação com n8n mudaram completamente minha forma de trabalhar. Economizo 20 horas por semana!",
    rating: 5,
    image: "/testimonials/pedro.jpg",
  },
  {
    name: "Mariana Oliveira",
    role: "Designer Freelancer",
    content: "Midjourney e DALL-E viraram minhas ferramentas principais. Consigo entregar projetos 3x mais rápido.",
    rating: 5,
    image: "/testimonials/mariana.jpg",
  },
  {
    name: "Roberto Lima",
    role: "Consultor Empresarial",
    content: "A visão estratégica sobre IA que aprendi aqui me diferencia completamente no mercado.",
    rating: 5,
    image: "/testimonials/roberto.jpg",
  },
];

export function TestimonialsSection() {
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
            Histórias de Transformação
          </h2>
          <p className="text-xl text-gray-400">
            Veja o que nossos alunos conquistaram
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white/5 backdrop-blur border-white/10 p-6 h-full flex flex-col">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic flex-grow">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
