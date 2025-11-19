import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const terms: { term: string; def: string }[] = [
  { term: "LLM", def: "Large Language Model. Modelos de linguagem de grande porte usados para gerar e compreender texto." },
  { term: "RAG", def: "Retrieval-Augmented Generation. Técnica que combina busca de informações com geração por IA." },
  { term: "Prompt", def: "Instrução dada a um modelo de IA para orientar sua resposta." },
];

export default function GlossaryPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl font-bold mb-6">Glossário de IA</h1>
          <div className="space-y-4">
            {terms.map((t)=> (
              <div key={t.term} className="border-b border-gray-800 pb-3">
                <h3 className="text-xl font-semibold">{t.term}</h3>
                <p className="text-gray-400">{t.def}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
