import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

type Sector = string;

export default function CoursesBySectorPage() {
  const t = useTranslations("CoursesBySector");
  const sectors = t.raw("sectors") as Sector[];
  const formatSlug = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-6">{t("title")}</h1>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectors.map((sector) => (
              <Link key={sector} href={`/cursos/${formatSlug(sector)}`}>
                <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition cursor-pointer">
                  <h3 className="text-xl font-semibold">{sector}</h3>
                  <p className="text-gray-400 text-sm">{t("cta", { sector })}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
