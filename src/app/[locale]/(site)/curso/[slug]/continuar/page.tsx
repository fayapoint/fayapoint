import Link from "next/link";
import { obterT } from "@/i18n/dicionario-servidor";
import { comIdioma } from "@/lib/rota-idioma";

export default async function ContinueCoursePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const T = await obterT(locale);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">
            {/* o slug é identificador, não texto — não passa pelo dicionário */}
            {T("Continuar Curso:")} {slug}
          </h1>
          <p className="text-muted-foreground mb-4">
            {T("Player e progresso completos serão integrados mais tarde.")}
          </p>
          {/* Link interno sem prefixo de idioma custa um 308 por clique —
              ver [[reference_seo_armadilhas_locale]]. */}
          <Link href={comIdioma(`/curso/${slug}`, locale)} className="text-amber-400">
            {T("Voltar para a página do curso")}
          </Link>
        </div>
      </main>
    </div>
  );
}
