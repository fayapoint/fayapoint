"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Gift, Users, CheckCircle, ArrowRight, Percent, Clock, BarChart } from "lucide-react";
import Link from "next/link";

type Step = {
  title: string;
  description: string;
};

type Benefit = {
  icon: string;
  title: string;
  description: string;
};

const benefitIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Percent,
  Clock,
  BarChart,
  Gift,
  Users,
  DollarSign,
};

export default function AffiliatesPage() {
  const t = useTranslations("Affiliates");
  const benefits = t.raw("benefits") as Benefit[];
  const steps = t.raw("steps") as Step[];

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <DollarSign size={16} className="text-green-400" />
              <span className="text-sm text-green-300">{t("badge")}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">{t("title")}</h1>
            <p className="text-xl text-gray-400 mb-8">{t("description")}</p>
            
            {/* Commission Highlight */}
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl">
              <TrendingUp className="text-green-400" size={28} />
              <span className="text-2xl font-bold text-green-400">{t("commissionRate")}</span>
              <span className="text-gray-300">{t("commissionLabel")}</span>
            </div>
          </motion.div>
        </section>

        {/* How it Works */}
        <section className="container mx-auto px-4 mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">{t("howItWorksTitle")}</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl font-bold">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="container mx-auto px-4 mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">{t("benefitsTitle")}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, idx) => {
              const Icon = benefitIcons[benefit.icon] || Gift;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-6"
                >
                  <Icon className="w-10 h-10 text-green-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-gray-400 text-sm">{benefit.description}</p>
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
            className="max-w-3xl mx-auto text-center bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-2xl p-10"
          >
            <h2 className="text-3xl font-bold mb-4">{t("cta.title")}</h2>
            <p className="text-gray-400 mb-8">{t("cta.description")}</p>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold"
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
