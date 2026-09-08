import { FederacaoClubes } from "@/components/game/FederacaoClubes";

export const metadata = { title: "Federação — Winners 22", robots: { index: false, follow: false } };
export default async function FederacaoPage({ params }: { params: Promise<{ locale: string }> }) {
  return <FederacaoClubes locale={(await params).locale} />;
}
