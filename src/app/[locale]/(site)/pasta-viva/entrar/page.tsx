import { redirect } from "next/navigation";
import { getAcessoPastaViva } from "@/lib/pasta-viva/acesso";
import { FormularioResgate } from "@/components/pasta-viva/FormularioResgate";

/**
 * O resgate do código impresso no PDF.
 *
 * Quem já tem acesso não vê este formulário — vai direto para o acervo. Um
 * formulário que aceita código de quem já entrou só serve para queimar código
 * à toa e gerar suporte.
 */

export const dynamic = "force-dynamic";

export default async function EntrarPage() {
  const acesso = await getAcessoPastaViva();
  if (acesso.liberado) redirect("/pasta-viva");

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        Pasta Viva
      </p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">
        Resgatar o código do seu ebook
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        O código está na primeira página do PDF que você baixou da Hotmart. Ele
        vale para uma conta só, e uma vez resgatado o acesso fica permanente
        nesta conta — você não precisa digitá-lo de novo.
      </p>

      <FormularioResgate autenticado={acesso.autenticado} />
    </main>
  );
}
