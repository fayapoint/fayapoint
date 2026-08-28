import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { generatePageMetadata } from "@/lib/metadata";
import { getProdutoDaLoja, sanitizarHtmlDaLoja, textoPuro } from "@/lib/loja";
import GaleriaDeImagens from "./GaleriaDeImagens";
import ProdutoInterativo from "./ProdutoInterativo";

export const revalidate = 900;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const produto = await getProdutoDaLoja(slug).catch(() => null);

  return generatePageMetadata({
    locale,
    path: `/loja/${slug}`,
    title: produto ? `${produto.name} | FayAI` : "Loja | FayAI",
    description: produto
      ? textoPuro(produto.shortDescription) || textoPuro(produto.fullDescription)
      : undefined,
    ...(produto?.thumbnail && { image: produto.thumbnail }),
  });
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  // Sem `catch` de propósito: banco fora do ar tem de ser erro, não 404 — o
  // 404 diria ao rastreador que o produto deixou de existir.
  const produto = await getProdutoDaLoja(slug);
  if (!produto) notFound();

  const t = await getTranslations("Store");
  const descricaoCurta = sanitizarHtmlDaLoja(produto.shortDescription);
  const descricaoCompleta = sanitizarHtmlDaLoja(produto.fullDescription);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
      <section className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
        <Link
          href="/loja"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-8"
        >
          <ArrowLeft size={16} />
          {t("backToStore")}
        </Link>

        <div className="grid gap-10 lg:grid-cols-2">
          <GaleriaDeImagens imagens={produto.images} alt={produto.name} />

          <div>
            <Badge variant="outline" className="mb-3 text-xs text-muted-foreground">
              {produto.categoryName}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{produto.name}</h1>
            {produto.brand && (
              <p className="text-sm text-muted-foreground mb-4">
                {t("brand")}: {produto.brand}
              </p>
            )}
            {descricaoCurta && (
              <div
                className="prose prose-invert prose-sm max-w-none text-foreground/90"
                dangerouslySetInnerHTML={{ __html: descricaoCurta }}
              />
            )}
            <ProdutoInterativo produto={produto} />
          </div>
        </div>

        {descricaoCompleta && (
          <div className="mt-14 max-w-3xl">
            <h2 className="text-xl font-semibold mb-4">{t("description")}</h2>
            <div
              className="prose prose-invert max-w-none text-foreground/90"
              dangerouslySetInnerHTML={{ __html: descricaoCompleta }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
