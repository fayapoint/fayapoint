import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
          <p className="text-gray-400">Conteúdo legal será adicionado aqui.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
