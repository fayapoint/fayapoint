import fatia from "../../../../../messages/rotas/radar.json";
import { ProvedorDeRota } from "@/i18n/rota";

/**
 * Layout só para entregar a fatia de dicionário desta rota.
 *
 * `/radar` é a segunda página mais pesada em texto de interface (141 KB do
 * dicionário inglês, 1.532 entradas): o painel inteiro é componente de cliente
 * e lê os rótulos em tempo de execução. Sem este provedor, essas 141 KB
 * cairiam na fatia raiz e passariam a viajar no HTML de TODA página `/en`.
 *
 * Ver `src/i18n/rota.tsx`. Nada de metadados aqui — a página cuida dos dela.
 */
export default async function RadarLayout({
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
