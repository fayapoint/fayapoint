import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Templates</h1>
          <p className="text-gray-400">Coleção de templates e prompts para uso imediato.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
