"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  Mail, 
  Video, 
  FileText,
  Zap,
  Users,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

type HelpCategory = {
  icon: string;
  title: string;
  description: string;
  href: string;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Video,
  FileText,
  Users,
  Zap,
  MessageCircle,
};

export default function HelpCenterPage() {
  const t = useTranslations("HelpCenter");
  const categories = t.raw("categories") as HelpCategory[];

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

        {/* Quick Links */}
        <section className="container mx-auto px-4 mb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {categories.map((category, idx) => {
              const Icon = iconMap[category.icon] || BookOpen;
              return (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link href={category.href}>
                    <div className="group h-full bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-purple-500/50 transition-all">
                      <Icon className="w-10 h-10 text-purple-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-400 transition-colors">
                        {category.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">{category.description}</p>
                      <span className="inline-flex items-center text-sm text-purple-400 group-hover:gap-2 transition-all">
                        {t("viewMore")} <ArrowRight size={14} className="ml-1" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Contact Support */}
        <section className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-white/10 rounded-2xl p-10 text-center">
              <Mail className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3">{t("support.title")}</h2>
              <p className="text-gray-400 mb-6">{t("support.description")}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contato"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-medium"
                >
                  <MessageCircle size={18} />
                  {t("support.contactButton")}
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg transition-colors font-medium"
                >
                  {t("support.faqButton")}
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
