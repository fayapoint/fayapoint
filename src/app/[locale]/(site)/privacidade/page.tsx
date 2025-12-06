"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Shield, Lock } from "lucide-react";

type Section = {
  title: string;
  content: string;
};

export default function PrivacyPage() {
  const t = useTranslations("Privacy");
  const sections = t.raw("sections") as Section[];

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <Shield size={16} className="text-green-400" />
              <span className="text-sm text-green-300">{t("badge")}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("title")}</h1>
            <p className="text-gray-400">{t("lastUpdated")}</p>
          </motion.div>
        </section>

        {/* LGPD Badge */}
        <section className="container mx-auto px-4 max-w-3xl mb-8">
          <div className="flex items-center justify-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <Lock className="text-green-400" />
            <span className="text-green-300 font-medium">{t("lgpdCompliance")}</span>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12"
          >
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="text-gray-300 mb-8">{t("intro")}</p>
              
              {sections.map((section, idx) => (
                <div key={idx} className="mb-8">
                  <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-green-400">{idx + 1}.</span> {section.title}
                  </h2>
                  <p className="text-gray-400 whitespace-pre-line">{section.content}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
