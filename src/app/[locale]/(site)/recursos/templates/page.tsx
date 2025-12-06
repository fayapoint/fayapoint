"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FileCode, Copy, Check, Zap } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

type Template = {
  title: string;
  description: string;
  category: string;
  prompt: string;
  tool: string;
};

export default function TemplatesPage() {
  const t = useTranslations("Templates");
  const templates = t.raw("list") as Template[];
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6">
              <FileCode size={16} className="text-orange-400" />
              <span className="text-sm text-orange-300">{t("badge")}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("title")}</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">{t("description")}</p>
          </motion.div>
        </section>

        {/* Templates Grid */}
        <section className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {templates.map((template, idx) => (
              <motion.div
                key={template.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-orange-400 uppercase tracking-wide">{template.category}</span>
                    <span className="text-xs px-2 py-1 bg-white/10 rounded-full">{template.tool}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{template.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{template.description}</p>
                </div>
                
                {/* Prompt Preview */}
                <div className="bg-black/50 border-t border-white/10 p-4">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap line-clamp-3 mb-3 font-mono">
                    {template.prompt}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(template.prompt, idx)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg text-sm transition"
                  >
                    {copiedIdx === idx ? (
                      <>
                        <Check size={16} />
                        {t("copied")}
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        {t("copyPrompt")}
                      </>
                    )}
                  </button>
                </div>
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
            className="max-w-2xl mx-auto text-center bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-white/10 rounded-2xl p-10"
          >
            <Zap className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">{t("cta.title")}</h2>
            <p className="text-gray-400 mb-6">{t("cta.description")}</p>
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors font-medium"
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
