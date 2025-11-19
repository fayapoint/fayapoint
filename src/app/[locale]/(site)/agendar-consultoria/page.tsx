import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function ConsultPage() {
  const t = useTranslations("Consultation");

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
          <p className="text-gray-400 mb-6">{t("description")}</p>
          <div className="grid gap-4">
            <input className="bg-gray-900 border border-gray-800 rounded p-3" placeholder={t("fields.name") as string} />
            <input className="bg-gray-900 border border-gray-800 rounded p-3" placeholder={t("fields.email") as string} />
            <textarea
              className="bg-gray-900 border border-gray-800 rounded p-3"
              placeholder={t("fields.details") as string}
              rows={5}
            />
            <Button className="bg-purple-600 hover:bg-purple-700">{t("submit")}</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
