import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const title = decodeURIComponent(params.slug).replace(/-/g,' ');
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl font-bold mb-6">{title}</h1>
          <p className="text-gray-400">Conteúdo do artigo em breve. Este é um placeholder funcional.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
