import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function SalesContactPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-4xl font-bold mb-4">Falar com Vendas</h1>
          <p className="text-gray-400">Nos conte sobre sua empresa e suas necessidades. Responderemos em até 1 dia útil.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
