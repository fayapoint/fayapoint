"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, User, Eye, Tag, Share2, BookOpen } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBlogPostContent } from "@/data/blog-posts";
import type { BlogSection } from "@/data/blog-posts";
import { useState } from "react";

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  views: number;
  image: string;
  featured: boolean;
  tags: string[];
};

function SectionRenderer({ section }: { section: BlogSection }) {
  const [imgError, setImgError] = useState(false);

  switch (section.type) {
    case "paragraph":
      return (
        <p className="text-base md:text-lg leading-relaxed text-foreground/85 mb-6">
          {section.content}
        </p>
      );
    case "heading":
      return (
        <h2 className="text-xl md:text-2xl font-bold text-foreground mt-10 mb-4">
          {section.content}
        </h2>
      );
    case "image":
      if (imgError) return null;
      return (
        <figure className="my-8 rounded-2xl overflow-hidden border border-border shadow-lg">
          <img
            src={section.src}
            alt={section.alt || ""}
            className="w-full aspect-video object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
          {section.caption && (
            <figcaption className="px-4 py-3 text-sm text-muted-foreground bg-card/50 border-t border-border">
              {section.caption}
            </figcaption>
          )}
        </figure>
      );
    case "quote":
      return (
        <blockquote className="my-8 border-l-4 border-amber-500 bg-amber-500/5 rounded-r-2xl px-6 py-5 italic text-foreground/80">
          <p className="text-base md:text-lg leading-relaxed">{section.content}</p>
        </blockquote>
      );
    case "list":
      return (
        <ul className="my-6 space-y-3 pl-1">
          {section.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-base text-foreground/85">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const t = useTranslations("Blog");
  const locale = useLocale();
  const blogPosts = t.raw("posts") as BlogPost[];

  const post = blogPosts.find((p) => p.slug === slug);
  const content = getBlogPostContent(slug);
  const relatedPosts = blogPosts.filter((p) => p.slug !== slug && post && p.category === post.category).slice(0, 3);

  if (!post) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-4xl font-bold mb-6">Artigo não encontrado</h1>
            <p className="text-muted-foreground mb-8">O artigo que você procura não existe ou foi removido.</p>
            <Link href={`/${locale}/blog`}>
              <Button><ArrowLeft size={16} className="mr-2" /> Voltar ao Blog</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const heroImage = content?.heroImage || post.image;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-16 md:pt-20 pb-16">
        {/* Hero */}
        <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
          <img
            src={heroImage}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="container mx-auto max-w-4xl">
              <Link href={`/${locale}/blog`} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-4 transition">
                <ArrowLeft size={16} /> Voltar ao blog
              </Link>
              <Badge className="mb-3 bg-amber-500/90 text-black border-0">{post.category}</Badge>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
                style={{ textShadow: "0 2px 16px rgba(0,0,0,0.4), 0 4px 32px rgba(0,0,0,0.2)" }}
              >
                {post.title}
              </motion.h1>
            </div>
          </div>
        </div>

        {/* Meta bar */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto max-w-4xl px-6 py-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><User size={14} /> {post.author}</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> {post.date}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> {post.readTime}</span>
            <span className="flex items-center gap-1.5"><Eye size={14} /> {post.views.toLocaleString(locale)}</span>
            <button
              onClick={() => navigator.share?.({ title: post.title, url: window.location.href }).catch(() => {})}
              className="ml-auto flex items-center gap-1.5 hover:text-amber-400 transition"
            >
              <Share2 size={14} /> Compartilhar
            </button>
          </div>
        </div>

        {/* Article body */}
        <article className="container mx-auto max-w-4xl px-6 py-10">
          {content ? (
            <div>
              {content.sections.map((section, i) => (
                <SectionRenderer key={i} section={section} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen size={48} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Conteúdo completo em breve.</p>
              <p className="text-sm text-muted-foreground mt-2">Este artigo está sendo preparado por nossa equipe editorial.</p>
            </div>
          )}

          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-wrap items-center gap-2">
              <Tag size={16} className="text-muted-foreground" />
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-amber-500/30 text-muted-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 rounded-2xl bg-gradient-to-r from-amber-600/20 to-yellow-600/10 border border-amber-500/20 p-6 md:p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Quer dominar IA na prática?</h3>
            <p className="text-muted-foreground mb-4">Acesse nossos cursos de IA e automação. Comece grátis — sem cartão de crédito.</p>
            <Link href="/registro">
              <Button className="bg-gradient-to-r from-amber-600 to-yellow-700 text-white">
                Começar Grátis Agora
              </Button>
            </Link>
          </div>
        </article>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section className="container mx-auto max-w-4xl px-6 pb-10">
            <h3 className="text-xl font-bold mb-6">Artigos Relacionados</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/${locale}/blog/${rp.slug}`}>
                  <div className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-amber-500/40 transition-all hover:-translate-y-0.5">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={rp.image}
                        alt={rp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-amber-400 transition">{rp.title}</h4>
                      <p className="text-xs text-muted-foreground mt-2">{rp.date} · {rp.readTime}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
