"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, Shield, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Starter",
    price: "47",
    period: "/mês",
    description: "Perfeito para começar sua jornada",
    features: [
      "5 cursos básicos por mês",
      "Acesso à comunidade",
      "Certificados de conclusão",
      "Suporte por email",
      "Material de apoio",
    ],
    highlighted: false,
    cta: "Começar Agora",
    href: "/checkout/starter",
  },
  {
    name: "Pro",
    price: "197",
    period: "/mês",
    description: "Para profissionais sérios sobre IA",
    features: [
      "Acesso ilimitado a todos os cursos",
      "Mentorias em grupo mensais",
      "Projetos práticos exclusivos",
      "Suporte prioritário",
      "Templates e automações prontas",
      "Acesso antecipado a novos cursos",
      "Descontos em ferramentas parceiras",
    ],
    highlighted: true,
    badge: "MAIS POPULAR",
    cta: "Escolher Pro",
    href: "/checkout/pro",
  },
  {
    name: "Business",
    price: "497",
    period: "/mês",
    description: "Transforme sua empresa com IA",
    features: [
      "Tudo do plano Pro",
      "Consultoria individual mensal",
      "Treinamento para sua equipe",
      "Implementação personalizada",
      "Dashboard de métricas",
      "API access",
      "White-label options",
      "Suporte 24/7 via WhatsApp",
    ],
    highlighted: false,
    cta: "Falar com Vendas",
    href: "/contato/vendas",
  },
];

export function PricingSection() {
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
            Investimento que se Paga
          </h2>
          <p className="text-xl text-gray-400">
            Escolha o plano ideal para sua jornada
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={plan.highlighted ? "md:-mt-4" : ""}
            >
              <Card 
                className={`${
                  plan.highlighted 
                    ? 'border-purple-500 bg-purple-900/20 shadow-2xl' 
                    : 'border-white/10 bg-white/5'
                } backdrop-blur p-8 relative h-full flex flex-col`}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4">
                    {plan.badge}
                  </Badge>
                )}
                
                <div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-5xl font-bold">R${plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <CheckCircle2 className="text-green-400 mt-1 flex-shrink-0" size={20} />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Link href={plan.href} className="mt-auto">
                  <Button 
                    className={`w-full ${
                      plan.highlighted 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                        : ''
                    }`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="flex items-center justify-center gap-8 mb-4">
            <div className="flex items-center gap-2 text-gray-400">
              <Shield className="w-5 h-5" />
              <span>Garantia de 30 dias</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Star className="w-5 h-5" />
              <span>4.9/5 de avaliação</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Cancele quando quiser • Sem multas • Sem pegadinhas
          </p>
        </motion.div>
      </div>
    </section>
  );
}
