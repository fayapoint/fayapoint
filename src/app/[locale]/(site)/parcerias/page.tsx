"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Handshake, Building, GraduationCap, Megaphone, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

type PartnerType = {
  icon: string;
  title: string;
  description: string;
  benefits: string[];
};

const partnerIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Building,
  GraduationCap,
  Megaphone,
  Handshake,
};

export default function PartnershipsPage() {
  const t = useTranslations("Partnerships");
  const partnerTypes = t.raw("types") as PartnerType[];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="container mx-auto px-4 text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <Handshake size={16} className="text-blue-400" />
              <span className="text-sm text-blue-300">{t("badge")}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">{t("title")}</h1>
            <p className="text-xl text-gray-400">{t("description")}</p>
          </motion.div>
        </section>

        {/* Partner Types */}
        <section className="container mx-auto px-4 mb-20">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {partnerTypes.map((type, idx) => {
              const Icon = partnerIcons[type.icon] || Handshake;
              return (
                <motion.div
                  key={type.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                  <Icon className="w-12 h-12 text-blue-400 mb-4" />
                  <h3 className="text-2xl font-bold mb-3">{type.title}</h3>
                  <p className="text-gray-400 mb-6">{type.description}</p>
                  <ul className="space-y-3">
                    {type.benefits.map((benefit, bidx) => (
                      <li key={bidx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-white/10 rounded-2xl p-10"
          >
            <h2 className="text-3xl font-bold mb-4">{t("cta.title")}</h2>
            <p className="text-gray-400 mb-8">{t("cta.description")}</p>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold"
            >
              {t("cta.button")}
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
