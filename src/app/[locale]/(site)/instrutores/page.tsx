import { obterT } from "@/i18n/dicionario-servidor";

import { getTranslations } from "next-intl/server";
import { GraduationCap, Linkedin, Twitter, Globe, Award } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

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

export default async function InstructorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const T = await obterT(locale);
  const t = await getTranslations({ locale, namespace: "Instructors" });
  const instructors = t.raw("list") as Instructor[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="container mx-auto px-4 text-center mb-20">
          <div
            className="entra max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
              <GraduationCap size={16} className="text-amber-400" />
              <span className="text-sm text-amber-300">{t("badge")}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">{t("title")}</h1>
            <p className="text-xl text-muted-foreground">{t("description")}</p>
          </div>
        </section>

        {/* Instructors Grid */}
        <section className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {instructors.map((instructor, idx) => (
              <div
                key={instructor.name}
                className="entra-2 bg-secondary border border-border rounded-2xl overflow-hidden group"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gradient-to-br from-amber-600/30 to-yellow-600/30">
                  {instructor.image ? (
                    <Image
                      src={instructor.image}
                      alt={T(instructor.name)}
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
                  <h3 className="text-xl font-bold mb-1">{T(instructor.name)}</h3>
                  <p className="text-amber-400 text-sm mb-3">{T(instructor.role)}</p>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{T(instructor.bio)}</p>
                  
                  {/* Expertise */}
                  <div className="flex flex-wrap gap-2">
                    {instructor.expertise.slice(0, 3).map((skill) => (
                      <span key={skill} className="px-2 py-1 text-xs bg-amber-500/20 text-amber-300 rounded-full">
                        {T(skill)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Como o material é feito.
            ⚠️ 20/08/2026: a página servia 1.048 caracteres — um card de
            instrutor e um botão. Quem chega aqui está fazendo uma pergunta de
            confiança ("quem escreveu isto, e por que eu acreditaria?"), e um
            card só não responde. O rastreador chegava à mesma conclusão por
            outro caminho: página sem assunto, tratada como soft 404. */}
        <section className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold">{t("method.title")}</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">{t("method.intro")}</p>
          <ol className="mt-8 space-y-6">
            {(t.raw("method.items") as { title: string; text: string }[]).map((item, i) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-semibold text-amber-300">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12 rounded-2xl border border-border bg-secondary/40 p-8">
            <h2 className="text-2xl font-semibold">{t("teachTitle")}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{t("teachText")}</p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm font-medium">
              <Link href="/cursos/por-ferramenta" className="text-amber-400 hover:underline">
                {t("teachLink")}
              </Link>
              <Link href="/cursos" className="text-amber-400 hover:underline">
                {t("catalogLink")}
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 mt-20">
          <div
            className="entra-3 max-w-2xl mx-auto text-center bg-gradient-to-r from-amber-900/30 to-blue-900/20 border border-border rounded-2xl p-10"
          >
            <Award className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">{t("cta.title")}</h2>
            <p className="text-muted-foreground mb-6">{t("cta.description")}</p>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors font-medium"
            >
              {t("cta.button")}
            </Link>
          </div>
        </section>
      </main>
      
    </div>
  );
}
