import { useT } from "@/i18n/dicionario";
import { Button } from "@/components/ui/button";

export default function RecoverPage() {
  const T = useT();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-md">
          <h1 className="text-3xl font-bold mb-4">{T("Recuperar Senha")}</h1>
          <p className="text-muted-foreground mb-4">{T("Informe seu email para enviarmos um link de recuperação.")}</p>
          <input className="w-full bg-card border border-border rounded p-3 mb-3" placeholder={T("seu@email.com")} />
          <Button className="w-full bg-amber-600 hover:bg-amber-700">{T("Enviar")}</Button>
        </div>
      </main>
    </div>
  );
}
