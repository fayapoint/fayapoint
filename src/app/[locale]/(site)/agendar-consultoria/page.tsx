import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

export default function ConsultPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-4xl font-bold mb-4">Agendar Consultoria</h1>
          <p className="text-gray-400 mb-6">Preencha seus dados e retornaremos para confirmar o melhor horário.</p>
          <div className="grid gap-4">
            <input className="bg-gray-900 border border-gray-800 rounded p-3" placeholder="Nome" />
            <input className="bg-gray-900 border border-gray-800 rounded p-3" placeholder="Email" />
            <textarea className="bg-gray-900 border border-gray-800 rounded p-3" placeholder="Descreva sua necessidade" rows={5} />
            <Button className="bg-purple-600 hover:bg-purple-700">Enviar</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
