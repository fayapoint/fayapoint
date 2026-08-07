import { useT } from "@/i18n/dicionario";
import { Card } from "@/components/ui/card";

export default function CertificatesPage() {
  const T = useT();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-6">{T("Certificações")}</h1>
          <p className="text-muted-foreground mb-6">{T("Ganhe certificados ao concluir cursos e trilhas completas.")}</p>
          <Card className="p-6 bg-secondary border-border">{T("Em breve: detalhes sobre critérios e verificação pública de certificados.")}</Card>
        </div>
      </main>
    </div>
  );
}
