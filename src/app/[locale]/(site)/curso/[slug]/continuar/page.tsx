import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

export default function ContinueCoursePage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Continuar Curso: {params.slug}</h1>
          <p className="text-gray-400 mb-4">Player e progresso completos serão integrados mais tarde.</p>
          <Link href={`/curso/${params.slug}` } className="text-purple-400">Voltar para a página do curso</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
