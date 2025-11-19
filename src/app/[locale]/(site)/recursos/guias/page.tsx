import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Guias Gratuitos</h1>
          <p className="text-gray-400">Baixe materiais e guias práticos sobre IA.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
