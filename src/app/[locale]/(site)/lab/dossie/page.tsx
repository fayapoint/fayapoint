import type { Metadata } from "next";
import { montarDossie } from "@/lib/persona";
import BancadaDossie from "./BancadaDossie";

/**
 * Bancada do dossiê — **não é página de produto**, igual à `/lab/3d`.
 *
 * O dossiê real só existe atrás do login, no portal. Isso torna qualquer ajuste
 * nele caro de conferir: para ver um botão novo era preciso entrar numa conta.
 * Aqui ele é montado com `montarDossie` — a MESMA função que o portal usa —
 * sobre uma persona de exemplo, então o que se vê é o componente de verdade com
 * o cálculo de confiança de verdade.
 *
 * Fica fora do índice e fora do sitemap de propósito.
 */
export const metadata: Metadata = {
  title: "Bancada do dossiê — FayAI",
  robots: { index: false, follow: false },
};

export const dynamic = "force-static";

export default function Page() {
  // Persona parcial de propósito: com tudo preenchido o dossiê não mostra as
  // lacunas, que são metade do componente.
  const dossie = montarDossie(
    {
      identidade: { papel: "ajudo dentistas a lotar a agenda sem depender de indicação" },
      voz: { formalidade: 35, emoji: 60 },
      publico: { dores: ["perde 3h por dia respondendo a mesma pergunta"] },
      aprendizado: { objetivo: "fechar 5 clientes novos por mês" },
    } as Parameters<typeof montarDossie>[0],
    { nome: "Bancada", temFoto: false, avatar: null }
  );

  return <BancadaDossie dossie={dossie} />;
}
