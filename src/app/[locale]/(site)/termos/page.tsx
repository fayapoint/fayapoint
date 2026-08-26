import { obterT } from "@/i18n/dicionario-servidor";

import { getTranslations } from "next-intl/server";
import { FileText, Scale } from "lucide-react";

type Section = {
  title: string;
  content: string;
};

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const T = await obterT(locale);
  const t = await getTranslations({ locale, namespace: "Terms" });
  const sections = t.raw("sections") as Section[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="container mx-auto px-4 text-center mb-16">
          <div className="entra"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <Scale size={16} className="text-blue-400" />
              <span className="text-sm text-blue-300">{t("badge")}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("title")}</h1>
            <p className="text-muted-foreground">{t("lastUpdated")}</p>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 max-w-3xl">
          <div
            className="entra-2 bg-secondary border border-border rounded-2xl p-8 md:p-12"
          >
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="text-muted-foreground mb-8">{t("intro")}</p>
              
              {sections.map((section, idx) => (
                <div key={idx} className="mb-8">
                  <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-amber-400">{idx + 1}.</span> {T(section.title)}
                  </h2>
                  <p className="text-muted-foreground whitespace-pre-line">{T(section.content)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
    </div>
  );
}
