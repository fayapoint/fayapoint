import Link from "next/link";
import type { Product } from "@/lib/products";

/**
 * Índice das prévias — a peça de link interno do hub de cursos.
 *
 * ## Por que existe
 *
 * O Search Console de 02/08/2026 mostrou **30 links internos para 147 páginas**
 * e 20 de 170 indexadas, com 89 páginas em "detectada, mas não indexada". Isso
 * não é defeito técnico: é o Google decidindo que não vale rastrear um site sem
 * autoridade cujas páginas profundas ninguém aponta.
 *
 * A vitrine já linka cada curso, mas por dentro de um card que é um `<Link>`
 * inteiro — não dá para aninhar um segundo âncora ali sem gerar HTML inválido.
 * Esta seção resolve por fora e, de quebra, é **renderizada no servidor**: os
 * cards da vitrine dependem de estado de filtro no cliente, e link que só existe
 * depois da hidratação vale pouco para rastreador.
 *
 * Não é bloco de SEO: é a resposta à objeção mais comum de quem chega numa
 * página de curso pago — "dá para ver antes de pagar?".
 */
export default function IndicePrevias({
  produtos,
  locale,
}: {
  produtos: Product[];
  locale: string;
}) {
  const cursos = produtos
    .filter((p) => p.slug && (p.name || p.shortName))
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));

  if (!cursos.length) return null;

  return (
    <section
      aria-labelledby="indice-previas"
      className="border-t border-border/60 bg-black/20 py-14"
    >
      <div className="container mx-auto px-4">
        <h2 id="indice-previas" className="text-2xl font-semibold text-white">
          Leia um capítulo antes de pagar
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
          Cada curso tem uma prévia aberta, sem cadastro: a ementa completa, capítulo a capítulo,
          e um capítulo inteiro para você julgar a profundidade do material com os próprios olhos.
        </p>

        <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {cursos.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/${locale}/curso/${c.slug}/previa`}
                className="group flex items-baseline gap-2 text-[15px] text-white/75 transition-colors hover:text-white"
              >
                <span className="text-emerald-400/70 transition-transform group-hover:translate-x-0.5">
                  ›
                </span>
                <span className="underline-offset-4 group-hover:underline">
                  {c.name || c.shortName}
                </span>
                {typeof c.metrics?.lessons === "number" && c.metrics.lessons > 0 && (
                  <span className="shrink-0 text-xs text-white/35">
                    {c.metrics.lessons} aulas
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
