import type { ReactNode } from "react";

import "../globals.css";
import { CLASSE_DO_CORPO } from "../fontes";

/**
 * Layout raiz próprio da `/blocked`.
 *
 * Ela é a única página do site que vive fora de `[locale]` — é a tela de
 * bloqueio geográfico, e quem cai nela pode não ter idioma resolvido. Com o
 * `app/layout.tsx` removido (ver `[locale]/layout.tsx` para o porquê), o
 * `<html>`/`<body>` dela precisa ser escrito aqui.
 *
 * `lang` fixo em português é correto neste caso e não é a preguiça de antes: a
 * página é servida a quem foi barrado, o texto dela é um só, e não há `params`
 * de idioma para consultar.
 */
export const metadata = {
  title: "Acesso restrito | FayAI",
  robots: { index: false, follow: false },
};

export default function BlockedLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning className={CLASSE_DO_CORPO}>
        {children}
      </body>
    </html>
  );
}
