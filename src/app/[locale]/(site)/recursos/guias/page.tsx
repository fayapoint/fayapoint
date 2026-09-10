import type { Metadata } from "next";
import { FileText, Clock, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { guias } from "@/data/guias";
import { generatePageMetadata } from "@/lib/metadata";

/**
 * A vitrine dos guias.
 *
 * ⚠️ O que esta página era até 10/09/2026, e por que foi trocada: ela listava
 * SEIS guias escritos à mão no dicionário de tradução (`Guides.list` em
 * messages/pt-BR.json), cada um com uma contagem de downloads — "12.500",
 * "8.300", "9.100". Nenhum dos seis existia. Não havia rota de guia, os cartões
 * não eram links e não havia uma linha de conteúdo por trás. Era número
 * inventado numa página pública, da mesma família da `/afiliados` que prometia
 * 30% de comissão sem ter motor que pagasse.
 *
 * Agora a lista vem de `@/data/guias`, que é o conteúdo de verdade, e a
 * contagem de downloads não voltou: não se mede o que não se entrega. O que
 * cada cartão mostra — tempo de leitura e categoria — sai do próprio texto.
 */

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "https://fayai.com.br";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const base = generatePageMetadata({
    locale,
    path: "/recursos/guias",
    title: "Guias práticos de IA",
    description:
      "Guias escritos para as perguntas que as pessoas realmente digitam: como funciona, como usar, qual escolher.",
  });

  /* Só-português, pelo mesmo motivo da página de cada guia — o comentário
   * longo está lá, em `[slug]/page.tsx`. O sitemap acompanha por
   * `SO_EM_PORTUGUES`; os três lugares mudam juntos quando houver tradução. */
  const soPt = {
    ...base,
    alternates: {
      ...base.alternates,
      languages: {
        "x-default": `${SITE_URL}/pt-BR/recursos/guias`,
        "pt-BR": `${SITE_URL}/pt-BR/recursos/guias`,
      },
    },
  };

  if (locale !== "pt-BR") return { ...soPt, robots: { index: false, follow: true } };
  return soPt;
}

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pt-32 pb-20">
        <section className="container mx-auto mb-16 px-4 text-center">
          <div className="entra">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2">
              <FileText size={16} className="text-blue-400" />
              <span className="text-sm text-blue-300">Grátis, sem cadastro</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">Guias práticos de IA</h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Escritos para a pergunta que você digitaria — não para o assunto que soa bonito.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {guias.map((guia) => (
              <Link
                key={guia.slug}
                href={`/recursos/guias/${guia.slug}`}
                className="entra-2 group flex flex-col rounded-xl border border-border bg-secondary p-6 transition-all hover:border-blue-500/50 hover:bg-white/10"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20">
                  <FileText className="text-blue-400" size={24} />
                </div>
                <span className="text-xs uppercase tracking-wide text-blue-400">
                  {guia.categoria}
                </span>
                <h2 className="mb-3 mt-2 text-xl font-semibold transition-colors group-hover:text-blue-400">
                  {guia.titulo}
                </h2>
                <p className="mb-5 flex-1 text-sm text-muted-foreground">{guia.descricao}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {guia.leitura} min
                  </span>
                  <span className="flex items-center gap-1 text-blue-400 opacity-0 transition-opacity group-hover:opacity-100">
                    Ler <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="container mx-auto mt-20 px-4">
          <div className="entra-3 mx-auto max-w-2xl rounded-2xl border border-border bg-gradient-to-r from-blue-900/20 to-amber-900/20 p-10 text-center">
            <h2 className="mb-3 text-2xl font-bold">O guia mostra o caminho. O curso anda com você.</h2>
            <p className="mb-6 text-muted-foreground">
              Cada guia aponta para o curso que aprofunda o mesmo assunto, com exercício e exemplo
              pronto.
            </p>
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700"
            >
              Ver os cursos <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
