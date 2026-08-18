import fatia from "../../../../../messages/rotas/ferramentaria.json";
import { ProvedorDeRota } from "@/i18n/rota";

/**
 * Layout só para entregar a fatia de dicionário desta rota.
 *
 * `/ferramentaria` é página de cliente e importa `src/data/tools-complete.ts`
 * — 115 KB de dados com texto em português que o `T()` traduz no navegador.
 * São 123 KB de dicionário que, sem este provedor, viajariam no HTML de TODA
 * página `/en`.
 *
 * ⚠️ Foi aqui que a primeira versão do recorte regrediu 17 frases para
 * português: o codemod grava `\r\n` dentro dos literais
 * (`"...organizadas\r\n          pelo que você quer"`) e o extrator desfazia
 * só `\n`. Ver `scripts/i18n/fatiar-por-rota.mjs` e `conferir-fatia.mjs`.
 */
export default async function FerramentariaLayout({
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
