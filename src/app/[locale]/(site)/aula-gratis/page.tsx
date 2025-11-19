import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

export default function FreeClassPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Aula Gratuita</h1>
          <p className="text-gray-400 mb-6">Assista a uma aula introdutória sobre IA e descubra como começar hoje.</p>
          <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg mb-6" />
          <Button className="bg-purple-600 hover:bg-purple-700">Criar conta grátis</Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
