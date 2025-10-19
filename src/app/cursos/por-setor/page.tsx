import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";

const sectors = ["E-commerce","Educação","Saúde","Advocacia","Marketing Digital","RH","Finanças","Indústria"];

export default function CoursesBySectorPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-6">Cursos por Setor</h1>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectors.map((s) => (
              <Link key={s} href={`/cursos/${s.toLowerCase().replace(/\s+/g,'-')}`}>
                <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition cursor-pointer">
                  <h3 className="text-xl font-semibold">{s}</h3>
                  <p className="text-gray-400 text-sm">Ver cursos para {s}</p>
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
