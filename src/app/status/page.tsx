import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Status</h1>
          <p className="text-gray-400">Status da plataforma (placeholder).</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
