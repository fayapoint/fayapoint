import fatia from "../../../../../messages/rotas/admin-courses.json";
import { ProvedorDeRota } from "@/i18n/rota";

/**
 * Layout só para entregar a fatia de dicionário desta rota.
 *
 * ⚠️ Por que aqui e não em `admin/layout.tsx`: aquele é `"use client"`, e a
 * decisão de idioma TEM de acontecer em Server Component — senão a fatia
 * inglesa já foi serializada no HTML antes de alguém decidir não usá-la, que é
 * exatamente o erro que dobrou o peso das páginas portuguesas em 18/08/2026.
 * Ver `src/i18n/rota.tsx`.
 *
 * `/admin/courses` é a única rota pesada do painel (126 KB de dicionário); o
 * resto do `/admin` fica na fatia raiz porque precisa de menos de 1 KB.
 */
export default async function AdminCoursesLayout({
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
