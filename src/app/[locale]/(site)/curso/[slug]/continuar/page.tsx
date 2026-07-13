import Link from "next/link";

export default async function ContinueCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Continuar Curso: {slug}</h1>
          <p className="text-muted-foreground mb-4">Player e progresso completos serão integrados mais tarde.</p>
          <Link href={`/curso/${slug}`} className="text-amber-400">Voltar para a página do curso</Link>
        </div>
      </main>
    </div>
  );
}
