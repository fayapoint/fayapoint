import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

/**
 * Canônica própria de `/chatgpt-allowlisting`.
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
  const { alternates } = generatePageMetadata({ locale, path: "/chatgpt-allowlisting" });
  return { alternates };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
