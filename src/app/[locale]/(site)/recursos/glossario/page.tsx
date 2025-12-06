"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Term = {
  term: string;
  definition: string;
  category: string;
};

export default function GlossaryPage() {
  const t = useTranslations("Glossary");
  const terms = t.raw("terms") as Term[];
  const categories = t.raw("categories") as string[];
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredTerms = terms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(search.toLowerCase()) ||
                          term.definition.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedTerms = filteredTerms.reduce((acc, term) => {
    const letter = term.term[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(term);
    return acc;
  }, {} as Record<string, Term[]>);

  const sortedLetters = Object.keys(groupedTerms).sort();

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="container mx-auto px-4 text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <BookOpen size={16} className="text-purple-400" />
              <span className="text-sm text-purple-300">{t("badge")}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("title")}</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">{t("description")}</p>
          </motion.div>
        </section>

        {/* Search & Filter */}
        <section className="container mx-auto px-4 max-w-4xl mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  selectedCategory === "all" ? "bg-purple-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                {t("allCategories")}
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    selectedCategory === cat ? "bg-purple-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Terms */}
        <section className="container mx-auto px-4 max-w-4xl">
          {sortedLetters.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t("noResults")}
            </div>
          ) : (
            <div className="space-y-8">
              {sortedLetters.map(letter => (
                <div key={letter}>
                  <h2 className="text-3xl font-bold text-purple-400 mb-4 sticky top-24 bg-black py-2">{letter}</h2>
                  <div className="space-y-4">
                    {groupedTerms[letter].map((term, idx) => (
                      <motion.div
                        key={term.term}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.02 }}
                        className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{term.term}</h3>
                            <p className="text-gray-400 mt-1">{term.definition}</p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full whitespace-nowrap">
                            {term.category}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
