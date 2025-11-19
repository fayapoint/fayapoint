import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

export default function RecoverPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-md">
          <h1 className="text-3xl font-bold mb-4">Recuperar Senha</h1>
          <p className="text-gray-400 mb-4">Informe seu email para enviarmos um link de recuperação.</p>
          <input className="w-full bg-gray-900 border border-gray-800 rounded p-3 mb-3" placeholder="seu@email.com" />
          <Button className="w-full bg-purple-600 hover:bg-purple-700">Enviar</Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
