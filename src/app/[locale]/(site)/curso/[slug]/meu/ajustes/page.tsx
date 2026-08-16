import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MesaDeAjustes from "./MesaDeAjustes";
import { podePersonalizar } from "@/lib/curso-personalizavel";

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * A MESA DE AJUSTES — `/curso/<slug>/meu/ajustes`.
 *
 * ⚠️ `noindex` e dinâmica pelo mesmo motivo do Ateliê: é a tela de UMA pessoa,
 * com a persona dela dentro. Ver a nota em `../page.tsx`.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "Como escrever o seu livro | FayAI",
    description: "Revise o que vai ser usado e escolha como este curso é reescrito para você.",
    robots: { index: false, follow: false },
    alternates: { canonical: `/curso/${slug}` },
  };
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  if (!podePersonalizar(slug)) redirect(`/${locale}/curso/${slug}`);
  return <MesaDeAjustes slug={slug} locale={locale} />;
}
