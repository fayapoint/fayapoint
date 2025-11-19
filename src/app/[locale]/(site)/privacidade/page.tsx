import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-gray-400">Conteúdo de privacidade (LGPD) em breve.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
