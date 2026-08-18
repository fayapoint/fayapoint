import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";
import fatia from "../../../../messages/rotas/projetos.json";
import { ProvedorDeRota } from "@/i18n/rota";

/**
 * Canônica própria de `/projetos`.
 *
 * Até 28/07/2026 esta página não declarava nenhuma e herdava a do layout de
 * `[locale]`, que apontava para a home — ou seja, dizia ao Google "descarte
 * esta página, a boa é a home". Eram 28 rotas públicas no mesmo caso, e é a
 * origem do "Cópia, o Google e o usuário selecionaram uma página canônica
 * diferente" no Search Console.
 *
 * Só `alternates` sai daqui: título e descrição seguem vindo de quem já os
 * definia.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { alternates } = generatePageMetadata({ locale, path: "/projetos" });
  return { alternates };
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ProvedorDeRota locale={locale} fatia={fatia}>
      {children}
    </ProvedorDeRota>
  );
}
