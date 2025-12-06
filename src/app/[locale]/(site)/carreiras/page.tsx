"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Clock, Heart, Zap, Users, Coffee, Laptop } from "lucide-react";
import Link from "next/link";

type Benefit = {
  icon: string;
  title: string;
  description: string;
};

type Position = {
  title: string;
  department: string;
  location: string;
  type: string;
};

const benefitIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Laptop,
  Coffee,
  Heart,
  Zap,
  Users,
  Clock,
};

export default function CareersPage() {
  const t = useTranslations("Careers");
  const benefits = t.raw("benefits") as Benefit[];
  const positions = t.raw("positions") as Position[];

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Briefcase size={16} className="text-purple-400" />
              <span className="text-sm text-purple-300">{t("badge")}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">{t("title")}</h1>
            <p className="text-xl text-gray-400">{t("description")}</p>
          </motion.div>
        </section>

        {/* Benefits */}
        <section className="container mx-auto px-4 mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">{t("benefitsTitle")}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, idx) => {
              const Icon = benefitIcons[benefit.icon] || Heart;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-6"
                >
                  <Icon className="w-10 h-10 text-purple-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-gray-400 text-sm">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Open Positions */}
        <section className="container mx-auto px-4 mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">{t("positionsTitle")}</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {positions.length > 0 ? (
              positions.map((position, idx) => (
                <motion.div
                  key={position.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-purple-500/50 transition-all cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold group-hover:text-purple-400 transition-colors">
                        {position.title}
                      </h3>
                      <p className="text-purple-400 text-sm">{position.department}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {position.type}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">{t("noPositions")}</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-white/10 rounded-2xl p-10"
          >
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
