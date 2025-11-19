import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

export default function ResourcesIndexPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Recursos</h1>
          <ul className="list-disc list-inside text-gray-400">
            <li><Link href="/recursos/guias" className="text-purple-400">Guias Gratuitos</Link></li>
            <li><Link href="/recursos/templates" className="text-purple-400">Templates</Link></li>
            <li><Link href="/recursos/calculadora-roi" className="text-purple-400">Calculadora ROI</Link></li>
            <li><Link href="/recursos/glossario" className="text-purple-400">Glossário IA</Link></li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
