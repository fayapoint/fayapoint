import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";

const tools = ["ChatGPT","Claude","Gemini","Perplexity","Midjourney","DALL-E","Stable Diffusion","n8n","Make","Zapier","Flowise"];

export default function CoursesByToolPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-6">Cursos por Ferramenta</h1>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((t) => (
              <Link key={t} href={`/cursos/${t.toLowerCase().replace(/\s+/g,'-')}`}>
                <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition cursor-pointer">
                  <h3 className="text-xl font-semibold">{t}</h3>
                  <p className="text-gray-400 text-sm">Ver cursos de {t}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
