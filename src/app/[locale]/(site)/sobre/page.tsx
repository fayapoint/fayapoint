import { obterT } from "@/i18n/dicionario-servidor";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
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
import { getTranslations } from "next-intl/server";
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

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const T = await obterT(locale);
  const t = await getTranslations({ locale, namespace: "About" });

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
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image
              src="/rwx1.jpg"
              alt={T("Ricardo Faya apresentando um workshop de IA")}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/60 via-black/80 to-yellow-900/50" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div
              className="entra text-center max-w-4xl mx-auto"
            >
              <Badge className="mb-4 bg-amber-600/20 text-amber-400 border-amber-500/50">
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
                    {T(highlight)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => {
                const Icon = statIcons[i] ?? Trophy;
                return (
                  <div
                    key={stat.label}
                    className="entra-2 text-center"
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                    <div className="text-3xl font-bold mb-1">{T(stat.number)}</div>
                    <div className="text-muted-foreground">{T(stat.label)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* About Ricardo */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="entra-3"
              >
                <div className="relative">
                  <div className="absolute -bottom-10 -left-12 hidden lg:block w-40 h-40 bg-amber-600/20 blur-3xl rounded-full" />
                  <div className="relative aspect-[3/4] rounded-3xl overflow-hidden ring-1 ring-white/15 shadow-2xl">
                    <Image
                      src="/rwx2.jpg"
                      alt={T("Retrato de Ricardo Faya em treinamento presencial")}
                      fill
                      priority
                      sizes="(min-width: 1024px) 480px, 90vw"
                      className="object-cover"
                    />
                  </div>
                  {/* Social Links */}
                  <div className="flex justify-center gap-4 mt-6">
                    <a href="https://linkedin.com/in/ricardofaya" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-border">
                        <Linkedin className="w-5 h-5" />
                      </Button>
                    </a>
                    <a href="https://youtube.com/@ricardofaya" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-border">
                        <Youtube className="w-5 h-5" />
                      </Button>
                    </a>
                    <a href="https://instagram.com/ricardofaya" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-border">
                        <Instagram className="w-5 h-5" />
                      </Button>
                    </a>
                    <a href="https://twitter.com/ricardofaya" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-border">
                        <Twitter className="w-5 h-5" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              <div className="entra-4"
              >
                <h2 className="text-3xl font-bold mb-6">{t("aboutRicardo.title")}</h2>
                <div className="space-y-4 text-muted-foreground">
                  {aboutParagraphs.map((paragraph, index) => (
                    <p key={index}>{T(paragraph)}</p>
                  ))}
                </div>

                {/* Certifications */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">{t("aboutRicardo.certificationsTitle")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {certifications.map((cert) => (
                      <Badge key={cert} variant="outline" className="border-amber-500/50">
                        {T(cert)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Behind the Scenes Gallery */}
        <section className="py-20 bg-gradient-to-b from-black/20 via-transparent to-black/20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge className="bg-amber-600/20 text-amber-300 border-amber-500/40 mb-4">
                {t("gallery.badge")}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("gallery.title")}</h2>
              <p className="text-lg text-muted-foreground">{t("gallery.description")}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {gallery.map((image, index) => (
                <div
                  key={image.src}
                  className="entra-4 group relative overflow-hidden rounded-3xl border border-border bg-secondary"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={image.src}
                      alt={T(image.title)}
                      fill
                      sizes="(min-width: 768px) 45vw, 90vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <p className="text-sm uppercase tracking-wide text-amber-300 mb-1">{T(image.title)}</p>
                      <p className="text-lg font-semibold text-white">{T(image.description)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quote */}
        <section className="py-20 bg-gradient-to-r from-amber-900/30 to-yellow-900/20">
          <div className="container mx-auto px-4">
            <div
              className="entra-4 max-w-4xl mx-auto text-center"
            >
              <Quote className="w-12 h-12 mx-auto mb-6 text-amber-400" />
              <blockquote className="text-2xl md:text-3xl font-medium mb-6">{t("quote.text")}</blockquote>
              <cite className="text-muted-foreground">{t("quote.cite")}</cite>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("timeline.title")}</h2>
              <p className="text-xl text-muted-foreground">{t("timeline.subtitle")}</p>
            </div>

            <div className="max-w-4xl mx-auto">
              {timeline.map((item, i) => (
                <div
                  key={i}
                  className="entra-4 flex gap-8 mb-12 relative"
                >
                  {/* Line */}
                  {i < timeline.length - 1 && (
                    <div className="absolute left-[88px] top-12 w-0.5 h-full bg-gradient-to-b from-amber-500 to-transparent" />
                  )}
                  
                  {/* Year */}
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="text-amber-400 font-bold">{T(item.year)}</span>
                  </div>
                  
                  {/* Dot */}
                  <div className="flex-shrink-0 w-4 h-4 bg-amber-500 rounded-full mt-1 ring-4 ring-amber-500/20" />
                  
                  {/* Content */}
                  <div className="flex-grow pb-8">
                    <h3 className="text-xl font-semibold mb-2">{T(item.title)}</h3>
                    <p className="text-muted-foreground">{T(item.description)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("values.title")}</h2>
              <p className="text-xl text-muted-foreground">{t("values.subtitle")}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {values.map((value, i) => {
                const Icon = valueIcons[i] ?? Target;
                return (
                  <div className="entra-4"
                    key={value.title}
                  >
                    <Card className="bg-secondary backdrop-blur border-border p-6 h-full">
                      <div className="text-amber-400 mb-4">
                        <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{T(value.title)}</h3>
                      <p className="text-muted-foreground">{T(value.description)}</p>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div
              className="entra-4 text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("cta.title")}</h2>
              <p className="text-xl text-muted-foreground mb-8">{t("cta.description")}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/registro">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800"
                  >
                    {t("cta.primaryButton")}
                  </Button>
                </Link>
                <Link href="/cursos">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-amber-500 text-amber-400 hover:bg-amber-500/10"
                  >
                    {t("cta.secondaryButton")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
