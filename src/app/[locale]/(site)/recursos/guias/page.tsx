"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FileText, Download, Clock, Star } from "lucide-react";
import Link from "next/link";

type Guide = {
  title: string;
  description: string;
  category: string;
  readTime: string;
  downloads: number;
  featured: boolean;
};

export default function GuidesPage() {
  const t = useTranslations("Guides");
  const guides = t.raw("list") as Guide[];

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <FileText size={16} className="text-blue-400" />
              <span className="text-sm text-blue-300">{t("badge")}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("title")}</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">{t("description")}</p>
          </motion.div>
        </section>

        {/* Guides Grid */}
        <section className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {guides.map((guide, idx) => (
              <motion.div
                key={guide.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-blue-500/50 transition-all"
              >
                {guide.featured && (
                  <div className="flex items-center gap-1 text-yellow-400 text-sm mb-3">
                    <Star size={14} fill="currentColor" />
                    <span>{t("featured")}</span>
                  </div>
                )}
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="text-blue-400" size={24} />
                </div>
                <span className="text-xs text-blue-400 uppercase tracking-wide">{guide.category}</span>
                <h3 className="text-xl font-semibold mt-2 mb-3 group-hover:text-blue-400 transition-colors">
                  {guide.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{guide.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {guide.readTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download size={14} /> {guide.downloads.toLocaleString()}
                  </span>
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
            className="max-w-2xl mx-auto text-center bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-white/10 rounded-2xl p-10"
          >
            <h2 className="text-2xl font-bold mb-3">{t("cta.title")}</h2>
            <p className="text-gray-400 mb-6">{t("cta.description")}</p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
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
