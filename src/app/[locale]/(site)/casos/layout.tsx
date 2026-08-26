import type { Metadata } from "next";
import { routeMetadata } from "@/lib/metadata";
import fatia from "../../../../../messages/rotas/casos.json";
import { ProvedorDeRota } from "@/i18n/rota";

/**
 * Canônica própria de `/casos`.
 *
 * Até 28/07/2026 esta página não declarava nenhuma e herdava a do layout de
 * `[locale]`, que apontava para a home — ou seja, dizia ao Google "descarte
 * esta página, a boa é a home". Eram 28 rotas públicas no mesmo caso, e é a
 * origem do "Cópia, o Google e o usuário selecionaram uma página canônica
 * diferente" no Search Console.
 *
 * Desde 29/07/2026 o título e a descrição também saem daqui. Antes não
 * saíam, e a página servia o título da home — ver ROUTE_SEO em
 * `src/lib/metadata.ts`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata({ locale, path: "/casos" });
}

/**
 * ⚠️ `/casos` PRECISA DA PRÓPRIA FATIA DO DICIONÁRIO (26/08/2026).
 *
 * A galeria é uma ilha de cliente com 39 trechos de interface, e Client
 * Component lê o dicionário do PROVEDOR — não do servidor. Sem provedor
 * próprio, a rota cai na fatia da raiz, que é de 2 KB e não alcança essas
 * frases: o resultado foi `/en/casos` com o dossiê traduzido e o cromo em
 * português ("Trinta e quatro anos", "Peças no acervo"), sem erro nenhum.
 *
 * O `prebuild` (`scripts/i18n/fatiar-por-rota.mjs`) descobre o provedor pelo
 * import abaixo e grava o arquivo. Ele não existe até a primeira passagem.
 */
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
