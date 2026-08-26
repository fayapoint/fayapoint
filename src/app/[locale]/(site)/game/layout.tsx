import fatia from "../../../../../messages/rotas/game.json";
import { ProvedorDeRota } from "@/i18n/rota";

/**
 * ⚠️ ESTE LAYOUT EXISTE SÓ PARA O DICIONÁRIO (26/08/2026).
 *
 * O `/game` nasceu em 23/08 sem provedor de rota, e por isso as frases dele
 * caíam na fatia da RAIZ — a que vai no HTML de TODA página `/en`. Enquanto o
 * dicionário não tinha essas entradas, ninguém notou; assim que
 * `scripts/i18n/interface.mjs` as colheu, a raiz saltou de 8 KB para 27 KB e o
 * `prebuild` parou o build, como ele foi feito para fazer:
 *
 *     ⛔ a fatia raiz passou do teto de 12 KB.
 *        Dê provedor próprio às rotas pesadas abaixo:
 *            19 KB  [locale]/(site)/game/page.tsx
 *            16 KB  [locale]/(site)/game/clube/[clubId]/page.tsx
 *
 * Erro barulhento em vez de tela errada — ver `src/i18n/fatia-do-cliente.ts`.
 * Com o provedor aqui, as quatro rotas do jogo pagam as suas frases e mais
 * ninguém paga por elas.
 */
export default async function GameLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ProvedorDeRota locale={locale} fatia={fatia}>
      {children}
    </ProvedorDeRota>
  );
}
