"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { HelpCircle, Search, MessageCircle } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQCategory = {
  title: string;
  items: FAQItem[];
};

export default function FAQPage() {
  const t = useTranslations("FAQ");
  const categories = t.raw("categories") as FAQCategory[];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="container mx-auto px-4 text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <HelpCircle size={16} className="text-purple-400" />
              <span className="text-sm text-purple-300">{t("badge")}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("title")}</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">{t("description")}</p>
          </motion.div>
        </section>

        {/* FAQ Categories */}
        <section className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-12">
            {categories.map((category, catIdx) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: catIdx * 0.1 }}
              >
                <h2 className="text-2xl font-bold mb-6 text-purple-400">{category.title}</h2>
                <Accordion type="single" collapsible className="space-y-3">
                  {category.items.map((item, idx) => (
                    <AccordionItem 
                      key={idx} 
                      value={`${catIdx}-${idx}`}
                      className="bg-white/5 border border-white/10 rounded-xl px-6 data-[state=open]:bg-white/10"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-5">
                        <span className="font-medium">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-400 pb-5">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-white/10 rounded-2xl p-10"
          >
            <MessageCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">{t("cta.title")}</h2>
            <p className="text-gray-400 mb-6">{t("cta.description")}</p>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-medium"
            >
              {t("cta.button")}
            </Link>
          </motion.div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
