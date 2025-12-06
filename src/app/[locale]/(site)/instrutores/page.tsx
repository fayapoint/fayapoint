"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { GraduationCap, Linkedin, Twitter, Globe, Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Instructor = {
  name: string;
  role: string;
  bio: string;
  image: string;
  expertise: string[];
  linkedin?: string;
  twitter?: string;
  website?: string;
};

export default function InstructorsPage() {
  const t = useTranslations("Instructors");
  const instructors = t.raw("list") as Instructor[];

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
              <GraduationCap size={16} className="text-purple-400" />
              <span className="text-sm text-purple-300">{t("badge")}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">{t("title")}</h1>
            <p className="text-xl text-gray-400">{t("description")}</p>
          </motion.div>
        </section>

        {/* Instructors Grid */}
        <section className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {instructors.map((instructor, idx) => (
              <motion.div
                key={instructor.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gradient-to-br from-purple-600/30 to-pink-600/30">
                  {instructor.image ? (
                    <Image
                      src={instructor.image}
                      alt={instructor.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <GraduationCap className="w-20 h-20 text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  
                  {/* Social Links */}
                  <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {instructor.linkedin && (
                      <a href={instructor.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition">
                        <Linkedin size={18} />
                      </a>
                    )}
                    {instructor.twitter && (
                      <a href={instructor.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition">
                        <Twitter size={18} />
                      </a>
                    )}
                    {instructor.website && (
                      <a href={instructor.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition">
                        <Globe size={18} />
                      </a>
                    )}
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{instructor.name}</h3>
                  <p className="text-purple-400 text-sm mb-3">{instructor.role}</p>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">{instructor.bio}</p>
                  
                  {/* Expertise */}
                  <div className="flex flex-wrap gap-2">
                    {instructor.expertise.slice(0, 3).map((skill) => (
                      <span key={skill} className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
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
            className="max-w-2xl mx-auto text-center bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-white/10 rounded-2xl p-10"
          >
            <Award className="w-12 h-12 text-purple-400 mx-auto mb-4" />
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
