import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Comunidade</h1>
          <p className="text-gray-400">Espaço para discussões, projetos e networking entre alunos. Em breve com recursos completos.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
