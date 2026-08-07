"use client";
import { useT } from "@/i18n/dicionario";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, User, Eye, Tag, Share2, BookOpen } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
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
  /**
   * Opcional de propósito (05/08/2026).
   *
   * Era obrigatório, e por isso todo post novo precisava chegar com um número
   * de visualizações — que ninguém mede e portanto ninguém pode escrever sem
   * inventar. Um contador inventado ao lado de uma notícia com fonte contamina
   * a notícia: quem desconfia do número passa a desconfiar do texto. Agora o
   * selo só aparece onde existe número de verdade.
   */
  views?: number;
  image: string;
  featured: boolean;
  tags: string[];
};

function SectionRenderer({ section }: { section: BlogSection }) {
  const T = useT();
  const [imgError, setImgError] = useState(false);

  switch (section.type) {
    case "paragraph":
      return (
        <p className="text-base md:text-lg leading-relaxed text-foreground/85 mb-6">
          {T(section.content)}
        </p>
      );
    case "heading":
      return (
        <h2 className="text-xl md:text-2xl font-bold text-foreground mt-10 mb-4">
          {T(section.content)}
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
              {T(section.caption)}
            </figcaption>
          )}
        </figure>
      );
    case "quote":
      return (
        <blockquote className="my-8 border-l-4 border-amber-500 bg-amber-500/5 rounded-r-2xl px-6 py-5 italic text-foreground/80">
          <p className="text-base md:text-lg leading-relaxed">{T(section.content)}</p>
        </blockquote>
      );
    case "list":
      return (
        <ul className="my-6 space-y-3 pl-1">
          {section.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-base text-foreground/85">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="leading-relaxed">{T(item)}</span>
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

export default function BlogPostView() {
  const T = useT();
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
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-4xl font-bold mb-6">{T("Artigo não encontrado")}</h1>
            <p className="text-muted-foreground mb-8">{T("O artigo que você procura não existe ou foi removido.")}</p>
            <Link href={`/${locale}/blog`}>
              <Button><ArrowLeft size={16} className="mr-2" />  {T("Voltar ao Blog")}</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const heroImage = content?.heroImage || post.image;
  /**
   * O topo em movimento, onde existe vídeo.
   *
   * Dois vídeos de blog estavam prontos em disco desde 03/08 e entravam no
   * deploy sem nenhuma rota apontando para eles. O pôster continua sendo a
   * arte parada, então quem chega com rede lenta vê a mesma coisa de antes —
   * o vídeo é acréscimo, nunca requisito.
   */
  const heroVideo = content?.heroVideo;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pt-16 md:pt-20 pb-16">
        {/* Hero */}
        <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
          {heroVideo ? (
            <video
              src={heroVideo}
              poster={heroImage}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={T(post.title)}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={heroImage}
              alt={T(post.title)}
              className="w-full h-full object-cover"
              loading="eager"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="container mx-auto max-w-4xl">
              <Link href={`/${locale}/blog`} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-4 transition">
                <ArrowLeft size={16} />  {T("Voltar ao blog")}
              </Link>
              <Badge className="mb-3 bg-amber-500/90 text-black border-0">{T(post.category)}</Badge>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
                style={{ textShadow: "0 2px 16px rgba(0,0,0,0.4), 0 4px 32px rgba(0,0,0,0.2)" }}
              >
                {T(post.title)}
              </motion.h1>
            </div>
          </div>
        </div>

        {/* Meta bar */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto max-w-4xl px-6 py-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><User size={14} /> {T(post.author)}</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> {T(post.date)}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> {T(post.readTime)}</span>
            {typeof post.views === "number" && (
              <span className="flex items-center gap-1.5"><Eye size={14} /> {post.views.toLocaleString(locale)}</span>
            )}
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
              <p className="text-lg text-muted-foreground">{T("Conteúdo completo em breve.")}</p>
              <p className="text-sm text-muted-foreground mt-2">{T("Este artigo está sendo preparado por nossa equipe editorial.")}</p>
            </div>
          )}

          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-wrap items-center gap-2">
              <Tag size={16} className="text-muted-foreground" />
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-amber-500/30 text-muted-foreground">
                  {T(tag)}
                </Badge>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 rounded-2xl bg-gradient-to-r from-amber-600/20 to-yellow-600/10 border border-amber-500/20 p-6 md:p-8 text-center">
            <h3 className="text-xl font-bold mb-2">{T("Quer dominar IA na prática?")}</h3>
            <p className="text-muted-foreground mb-4">{T("Acesse nossos cursos de IA e automação. Comece grátis — sem cartão de crédito.")}</p>
            <Link href="/registro">
              <Button className="bg-gradient-to-r from-amber-600 to-yellow-700 text-white">
                
                {T("Começar Grátis Agora")}
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
                        alt={T(rp.title)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-amber-400 transition">{T(rp.title)}</h4>
                      <p className="text-xs text-muted-foreground mt-2">{T(rp.date)} · {T(rp.readTime)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
