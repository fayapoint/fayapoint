import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

const meta = {
  "pt-BR": {
    title: "Agendar Consultoria - FayaPoint AI Academy",
    description: "Agende uma consultoria gratuita com nossos especialistas em IA.",
  },
  en: {
    title: "Schedule Consultation - FayaPoint AI Academy",
    description: "Schedule a free consultation with our AI specialists.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = meta[locale as "pt-BR" | "en"] ?? meta["pt-BR"];
  
  return generatePageMetadata({
    locale,
    path: "/agendar-consultoria",
    title: config.title,
    description: config.description,
  });
}

export default function Layout({ children }: Props) {
  return children;
}
