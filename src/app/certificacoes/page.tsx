import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";

export default function CertificatesPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-6">Certificações</h1>
          <p className="text-gray-400 mb-6">Ganhe certificados ao concluir cursos e trilhas completas.</p>
          <Card className="p-6 bg-white/5 border-white/10">Em breve: detalhes sobre critérios e verificação pública de certificados.</Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
