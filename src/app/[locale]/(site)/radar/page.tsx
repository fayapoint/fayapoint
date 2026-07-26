import type { Metadata } from "next";
import { RadarPagina } from "@/components/radar/RadarPagina";

export const metadata: Metadata = {
  title: "Radar FayAI — o que o Brasil e o mundo estão procurando agora",
  description:
    "Tendências medidas, não estimadas: buscas em alta do Google por estado, artigos mais lidos da Wikipédia e a demanda real de inteligência artificial no autocomplete do Google e do YouTube.",
  alternates: { canonical: "/radar" },
};

// As tendências mudam ao longo do dia; a página é montada no cliente e a
// medição vem da API, que tem cache próprio de 30 min.
export const dynamic = "force-static";

export default function Page() {
  return <RadarPagina />;
}
