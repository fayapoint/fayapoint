import { obterT } from "@/i18n/dicionario-servidor";

import { FaixaDeVideo } from "@/components/ui/FaixaDeVideo";
import { getTranslations } from "next-intl/server";
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
import { Link } from "@/i18n/navigation";

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

export default async function HelpCenterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const T = await obterT(locale);
  const t = await getTranslations({ locale, namespace: "HelpCenter" });
  const categories = t.raw("categories") as HelpCategory[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="container mx-auto px-4 text-center mb-16">
          <div className="entra"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
              <HelpCircle size={16} className="text-amber-400" />
              <span className="text-sm text-amber-300">{t("badge")}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("title")}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("description")}</p>
          </div>

          {/* A boia — `AJU-01-boia`. Estava pronto e sem destino no código. */}
          <FaixaDeVideo
            src="/ajuda/hero-loop.webm"
            poster="/ajuda/hero-loop.webp"
            className="mx-auto mt-10 max-w-4xl"
          />
        </section>

        {/* Quick Links */}
        <section className="container mx-auto px-4 mb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {categories.map((category, idx) => {
              const Icon = iconMap[category.icon] || BookOpen;
              return (
                <div className="entra-2"
                  key={category.title}
                >
                  <Link href={category.href}>
                    <div className="group h-full bg-secondary border border-border rounded-xl p-6 hover:bg-white/10 hover:border-amber-500/50 transition-all">
                      <Icon className="w-10 h-10 text-amber-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-amber-400 transition-colors">
                        {T(category.title)}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">{T(category.description)}</p>
                      <span className="inline-flex items-center text-sm text-amber-400 group-hover:gap-2 transition-all">
                        {t("viewMore")} <ArrowRight size={14} className="ml-1" />
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Primeiros passos + problemas comuns.
            ⚠️ 20/08/2026: esta página servia 1.198 caracteres ao rastreador —
            seis cards de categoria e nada mais. Página de ajuda sem resposta
            dentro é soft 404: o Google não indexa e quem chegou continua sem
            saber o que fazer. O conteúdo abaixo é DIFERENTE do /faq de
            propósito; repetir as mesmas perguntas em duas URLs faria as duas
            competirem entre si. */}
        <section className="container mx-auto px-4 mb-16 max-w-4xl">
          <h2 className="text-3xl font-bold mb-3">{t("stepsTitle")}</h2>
          <p className="text-muted-foreground mb-8">{t("stepsIntro")}</p>
          <ol className="space-y-6">
            {(t.raw("steps") as { title: string; text: string }[]).map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-semibold text-amber-300">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="container mx-auto px-4 mb-16 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">{t("troubleTitle")}</h2>
          <div className="space-y-5">
            {(t.raw("trouble") as { q: string; a: string }[]).map((item) => (
              <div key={item.q} className="rounded-xl border border-border bg-secondary/40 p-6">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Support */}
        <section className="container mx-auto px-4">
          <div
            className="entra-3 max-w-3xl mx-auto"
          >
            <div className="bg-gradient-to-r from-amber-900/30 to-blue-900/20 border border-border rounded-2xl p-10 text-center">
              <Mail className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3">{t("support.title")}</h2>
              <p className="text-muted-foreground mb-6">{t("support.description")}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contato"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors font-medium"
                >
                  <MessageCircle size={18} />
                  {t("support.contactButton")}
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-white/10 border border-white/20 rounded-lg transition-colors font-medium"
                >
                  {t("support.faqButton")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
    </div>
  );
}
