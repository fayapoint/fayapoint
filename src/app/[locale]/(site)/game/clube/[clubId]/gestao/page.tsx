import { notFound } from "next/navigation";
import { GestaoClube } from "@/components/game/GestaoClube";

export const metadata = { title: "Gestão do clube — Winners 22", robots: { index: false, follow: false } };
export default async function GestaoPage({ params, searchParams }: { params: Promise<{ locale: string; clubId: string }>; searchParams: Promise<{ plataforma?: string }> }) {
  const { locale, clubId } = await params;
  const plataforma = (await searchParams).plataforma ?? "common-gen5";
  if (!/^\d{1,12}$/.test(clubId) || !["common-gen5", "common-gen4"].includes(plataforma)) notFound();
  return <GestaoClube clubId={clubId} locale={locale} plataforma={plataforma} />;
}
