"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Rocket, MessageCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-purple-900/20" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para Dominar a IA?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Junte-se a mais de 5.000 profissionais que já transformaram suas carreiras.
            Comece agora com nossa aula gratuita e descubra o poder da IA.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/registro">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <Rocket className="mr-2" /> Começar Minha Jornada
              </Button>
            </Link>
            <Link href="/agendar-consultoria">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-purple-500 text-purple-400 hover:bg-purple-500/10 text-lg px-8"
              >
                <Calendar className="mr-2" /> Agendar Consultoria Grátis
              </Button>
            </Link>
          </div>

          {/* Trust Elements */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Acesso imediato</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Garantia de 30 dias</span>
            </div>
          </div>

          {/* WhatsApp Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="mt-12 pt-12 border-t border-gray-800"
          >
            <p className="text-gray-400 mb-4">Prefere conversar primeiro?</p>
            <a 
              href="https://wa.me/5521999999999?text=Olá! Gostaria de saber mais sobre os cursos de IA da FayaPoint."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Fale conosco no WhatsApp</span>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
