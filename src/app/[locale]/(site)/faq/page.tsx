import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslations } from "next-intl";

export default function FAQPage() {
  const t = useTranslations("FAQ");

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
          <p className="text-gray-400">{t("description")}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
