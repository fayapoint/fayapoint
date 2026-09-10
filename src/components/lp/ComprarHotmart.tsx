import { ArrowRight } from "lucide-react";

/**
 * O botão de compra das landing pages — um só, para todas elas.
 *
 * ## Por que existe
 *
 * Na rodada 1 do gauntlet da LP do ebook, o crítico de sistema reprovou dois
 * defeitos que nascem do mesmo lugar — CTA escrito à mão em cada página:
 *
 * 1. **Dois dourados no mesmo site.** A `/fabrica` usa o hex da marca,
 *    `#f5c04e`; a LP tinha nascido com `amber-400` do Tailwind (`#fbbf24`),
 *    visivelmente mais laranja. Lado a lado, o dourado de uma página não era o
 *    da outra.
 * 2. **Botões da mesma família com formas diferentes** — raio, padding e brilho
 *    divergentes nos dois CTAs mais importantes do site.
 *
 * Na rodada 2 o mesmo crítico reprovou de novo, e o apontamento foi justo:
 * centralizar a cor numa constante JS **não é tokenizar**. Agora o dourado é
 * `--color-ouro` no `@theme inline`, e este componente usa `bg-ouro` como
 * qualquer outra cor do sistema — sem hex cru, sem concatenar alpha à mão.
 */
export function ComprarHotmart({
  href,
  preco,
  tom = "quente",
  className = "",
}: {
  href: string;
  /** Já formatado, ex.: "R$ 67". */
  preco: string;
  tom?: "quente" | "calmo";
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold transition-opacity hover:opacity-90 ${
        tom === "calmo"
          ? "border border-border bg-secondary text-foreground hover:bg-white/10"
          : "bg-ouro text-ouro-foreground shadow-glow-ouro"
      } ${className}`}
    >
      Comprar por {preco} <ArrowRight size={18} />
    </a>
  );
}
