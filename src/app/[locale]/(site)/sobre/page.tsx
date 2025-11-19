"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Users,
  Target,
  Zap,
  Trophy,
  Star,
  Quote,
  Linkedin,
  Youtube,
  Instagram,
  Twitter,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Stat = {
  number: string;
  label: string;
};

type GalleryItem = {
  src: string;
  title: string;
  description: string;
};

type TimelineItem = {
  year: string;
  title: string;
  description: string;
};

type ValueItem = {
  title: string;
  description: string;
};

export default function AboutPage() {
  const t = useTranslations("About");

  const heroHighlights = t.raw("hero.highlights") as string[];
  const stats = t.raw("stats") as Stat[];
  const aboutParagraphs = t.raw("aboutRicardo.paragraphs") as string[];
  const certifications = t.raw("certifications") as string[];
  const gallery = t.raw("gallery.items") as GalleryItem[];
  const timeline = t.raw("timeline.items") as TimelineItem[];
  const values = t.raw("values.items") as ValueItem[];

  const statIcons = [Trophy, Users, BookOpen, Star];
  const valueIcons = [Target, Users, Zap, Award];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image
              src="/rwx1.jpg"
              alt="Ricardo Faya apresentando um workshop de IA"
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-black/80 to-pink-900/50" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <Badge className="mb-4 bg-purple-600/20 text-purple-400 border-purple-500/50">
                {t("hero.badge")}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                {t.rich("hero.title", {
                  highlight: (chunks) => <span className="text-gradient">{chunks}</span>,
                })}
              </h1>
              <p className="text-xl text-gray-200 mb-12">
                {t("hero.description")}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {heroHighlights.map((highlight) => (
                  <Badge key={highlight} className="bg-white/10 border-white/30 text-gray-100">
                    {highlight}
                  </Badge>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-y border-gray-800">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => {
                const Icon = statIcons[i] ?? Trophy;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center"
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                    <div className="text-3xl font-bold mb-1">{stat.number}</div>
                    <div className="text-gray-400">{stat.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* About Ricardo */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="relative">
                  <div className="absolute -bottom-10 -left-12 hidden lg:block w-40 h-40 bg-purple-600/20 blur-3xl rounded-full" />
                  <div className="relative aspect-[3/4] rounded-3xl overflow-hidden ring-1 ring-white/15 shadow-2xl">
                    <Image
                      src="/rwx2.jpg"
                      alt="Retrato de Ricardo Faya em treinamento presencial"
                      fill
                      priority
                      sizes="(min-width: 1024px) 480px, 90vw"
                      className="object-cover"
                    />
                  </div>
                  {/* Social Links */}
                  <div className="flex justify-center gap-4 mt-6">
                    <a href="https://linkedin.com/in/ricardofaya" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-gray-700">
                        <Linkedin className="w-5 h-5" />
                      </Button>
                    </a>
                    <a href="https://youtube.com/@ricardofaya" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-gray-700">
                        <Youtube className="w-5 h-5" />
                      </Button>
                    </a>
                    <a href="https://instagram.com/ricardofaya" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-gray-700">
                        <Instagram className="w-5 h-5" />
                      </Button>
                    </a>
                    <a href="https://twitter.com/ricardofaya" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-gray-700">
                        <Twitter className="w-5 h-5" />
                      </Button>
                    </a>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-6">{t("aboutRicardo.title")}</h2>
                <div className="space-y-4 text-gray-300">
                  {aboutParagraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                {/* Certifications */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">{t("aboutRicardo.certificationsTitle")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {certifications.map((cert) => (
                      <Badge key={cert} variant="outline" className="border-purple-500/50">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Behind the Scenes Gallery */}
        <section className="py-20 bg-gradient-to-b from-black/20 via-transparent to-black/20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/40 mb-4">
                {t("gallery.badge")}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("gallery.title")}</h2>
              <p className="text-lg text-gray-400">{t("gallery.description")}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {gallery.map((image, index) => (
                <motion.div
                  key={image.src}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={image.src}
                      alt={image.title}
                      fill
                      sizes="(min-width: 768px) 45vw, 90vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <p className="text-sm uppercase tracking-wide text-purple-300 mb-1">{image.title}</p>
                      <p className="text-lg font-semibold text-white">{image.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Quote */}
        <section className="py-20 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <Quote className="w-12 h-12 mx-auto mb-6 text-purple-400" />
              <blockquote className="text-2xl md:text-3xl font-medium mb-6">{t("quote.text")}</blockquote>
              <cite className="text-gray-400">{t("quote.cite")}</cite>
            </motion.div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("timeline.title")}</h2>
              <p className="text-xl text-gray-400">{t("timeline.subtitle")}</p>
            </div>

            <div className="max-w-4xl mx-auto">
              {timeline.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex gap-8 mb-12 relative"
                >
                  {/* Line */}
                  {i < timeline.length - 1 && (
                    <div className="absolute left-[88px] top-12 w-0.5 h-full bg-gradient-to-b from-purple-500 to-transparent" />
                  )}
                  
                  {/* Year */}
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="text-purple-400 font-bold">{item.year}</span>
                  </div>
                  
                  {/* Dot */}
                  <div className="flex-shrink-0 w-4 h-4 bg-purple-500 rounded-full mt-1 ring-4 ring-purple-500/20" />
                  
                  {/* Content */}
                  <div className="flex-grow pb-8">
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-gray-900/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("values.title")}</h2>
              <p className="text-xl text-gray-400">{t("values.subtitle")}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {values.map((value, i) => {
                const Icon = valueIcons[i] ?? Target;
                return (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="bg-white/5 backdrop-blur border-white/10 p-6 h-full">
                      <div className="text-purple-400 mb-4">
                        <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                      <p className="text-gray-400">{value.description}</p>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("cta.title")}</h2>
              <p className="text-xl text-gray-300 mb-8">{t("cta.description")}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/registro">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {t("cta.primaryButton")}
                  </Button>
                </Link>
                <Link href="/cursos">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                  >
                    {t("cta.secondaryButton")}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
