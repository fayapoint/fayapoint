import { Inter, Plus_Jakarta_Sans, Fira_Code, Bebas_Neue, DM_Mono } from "next/font/google";

/**
 * As fontes moram fora dos layouts porque agora há MAIS DE UM layout raiz.
 *
 * `app/layout.tsx` deixou de existir em 13/08/2026 (ver `[locale]/layout.tsx`),
 * e o `<html>`/`<body>` passou a ser escrito em dois lugares: a árvore de
 * idioma e a página `/blocked`, que vive fora dela. Declarar `next/font` nos
 * dois arquivos criaria duas famílias com os mesmos glifos e dois preloads.
 *
 * Aqui elas são declaradas uma vez e os dois layouts importam a mesma
 * instância — que é o uso documentado do `next/font` em módulo próprio.
 */

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

/** As cinco variáveis CSS, na ordem em que o `<body>` sempre as recebeu. */
export const VARIAVEIS_DE_FONTE = [
  inter.variable,
  plusJakarta.variable,
  firaCode.variable,
  bebasNeue.variable,
  dmMono.variable,
].join(" ");

/** A classe completa do `<body>` — fontes + o mesmo tema de sempre. */
export const CLASSE_DO_CORPO =
  `${VARIAVEIS_DE_FONTE} font-sans antialiased bg-background text-foreground min-h-screen`;
