import fatia from "../../../../../messages/rotas/lab.json";
import { ProvedorDeRota } from "@/i18n/rota";

/**
 * Layout só para entregar a fatia de dicionário desta rota. Ver `src/i18n/rota.tsx`.
 */
export default async function LabLayout({
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
