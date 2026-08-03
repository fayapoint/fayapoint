import Link from "next/link";
import { Lock, Check, Crown, ArrowRight } from "lucide-react";
import type { AcessoMicrocurso } from "@/lib/inventando-acesso";
import { PRECO_EXPERT } from "@/lib/inventando-acesso";

/**
 * O portão entre o que o plano abre e o que falta.
 *
 * Duas decisões de conversão que valem explicação:
 *
 * 1. **O título da aula trancada aparece; o conteúdo não.** Esconder a
 *    existência da aula esconde também o motivo de pagar. A pessoa precisa
 *    conseguir ler "Rodar por conta própria — 3 min" e sentir falta.
 *
 * 2. **A escada inteira fica visível, com o Expert sempre marcado.** Mesmo
 *    para quem está no Explorador, o degrau seguinte é apresentado ao lado do
 *    topo — o objetivo é que o Expert seja o destino óbvio, não o degrau.
 */

const ESCADA_ROTULOS: Record<string, { nome: string; abre: string }> = {
  free: { nome: "Gratuito", abre: "Ficha da ferramenta" },
  explorador: { nome: "Explorador", abre: "1ª aula + limitações" },
  profissional: { nome: "Profissional", abre: "2ª aula + para quem serve" },
  expert: { nome: "Expert", abre: "Microcurso completo" },
};

const ORDEM = ["free", "explorador", "profissional", "expert"] as const;

export function AulasTrancadas({
  titulos,
  acesso,
  locale,
}: {
  titulos: Array<{ titulo: string; duracao: string }>;
  acesso: AcessoMicrocurso;
  locale: string;
}) {
  if (titulos.length === 0) return null;

  const destinoCta = acesso.autenticado ? `/${locale}/precos` : `/${locale}/registro`;

  return (
    <section aria-labelledby="portao-titulo" className="mt-10">
      {/* Aulas trancadas — título visível, conteúdo ausente do HTML */}
      <ul className="space-y-2.5">
        {titulos.map((aula, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5"
          >
            <Lock aria-hidden className="h-4 w-4 shrink-0 text-white/30" />
            <span className="flex-1 text-[15px] font-medium text-white/45">
              {aula.titulo}
            </span>
            <span className="shrink-0 text-xs text-white/25">{aula.duracao}</span>
          </li>
        ))}
      </ul>

      {/* O portão */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-[#f5c04e]/25 bg-gradient-to-b from-[#f5c04e]/[0.09] to-transparent">
        <div className="p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <Crown aria-hidden className="h-4 w-4 text-[#f5c04e]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#f5c04e]">
              Conteúdo do plano Expert
            </span>
          </div>

          <h2
            id="portao-titulo"
            className="mt-3 text-xl font-bold leading-snug text-white sm:text-2xl"
          >
            {acesso.aulasBloqueadas === acesso.totalAulas
              ? `As ${acesso.totalAulas} aulas deste microcurso estão fechadas`
              : `Faltam ${acesso.aulasBloqueadas} ${
                  acesso.aulasBloqueadas === 1 ? "aula" : "aulas"
                } para você concluir`}
          </h2>

          <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-white/65">
            {acesso.plano === "free" ? (
              <>
                Você está vendo a ficha da ferramenta — o que ela é e o que ela
                não faz. O passo a passo, os critérios de escolha e o que fazer
                com ela ficam no microcurso, e o microcurso completo é do{" "}
                <strong className="text-white">Expert</strong>.
              </>
            ) : (
              <>
                Seu plano{" "}
                <strong className="text-white">{acesso.planoNome}</strong> abre{" "}
                {acesso.aulasLiberadas} de {acesso.totalAulas} aulas. O
                microcurso inteiro — em todas as ferramentas da seção — é do{" "}
                <strong className="text-white">Expert</strong>.
              </>
            )}
          </p>

          {/* A escada */}
          <ol className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {ORDEM.map((nivel) => {
              const atual = nivel === acesso.plano;
              const topo = nivel === "expert";
              const rotulo = ESCADA_ROTULOS[nivel];

              return (
                <li
                  key={nivel}
                  className={[
                    "flex items-center gap-3 rounded-xl border px-4 py-3",
                    topo
                      ? "border-[#f5c04e]/45 bg-[#f5c04e]/[0.08]"
                      : atual
                        ? "border-white/25 bg-white/[0.05]"
                        : "border-white/8 bg-white/[0.015]",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className={[
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      topo
                        ? "bg-[#f5c04e] text-[#0c0e1d]"
                        : atual
                          ? "bg-white/20 text-white"
                          : "bg-white/8 text-white/35",
                    ].join(" ")}
                  >
                    {topo ? <Crown className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                  </span>

                  <span className="flex-1 leading-tight">
                    <span
                      className={
                        topo
                          ? "block text-sm font-semibold text-[#f5c04e]"
                          : "block text-sm font-semibold text-white/75"
                      }
                    >
                      {rotulo.nome}
                      {atual && (
                        <span className="ml-2 rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-normal uppercase tracking-wide text-white/55">
                          seu plano
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-white/45">{rotulo.abre}</span>
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={destinoCta}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5c04e] px-5 py-3 text-sm font-semibold text-[#0c0e1d] transition-colors hover:bg-[#ffd071]"
            >
              {acesso.autenticado
                ? `Assinar o Expert — R$ ${PRECO_EXPERT}/mês`
                : "Criar conta e ver os planos"}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>

            {!acesso.autenticado && (
              <Link
                href={`/${locale}/login`}
                className="text-sm text-white/55 transition-colors hover:text-white"
              >
                Já tenho conta
              </Link>
            )}
          </div>

          {acesso.proximoPlano && acesso.proximoPlano !== "expert" && (
            <p className="mt-4 text-xs leading-relaxed text-white/40">
              O {acesso.proximoPlanoNome} (R$ {acesso.proximoPlanoPreco}/mês) abre{" "}
              {acesso.aulasNoProximoPlano} de {acesso.totalAulas} aulas. Só o Expert
              abre todas — e vale para todos os microcursos da seção.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/** Faixa fina no topo, para quem já é Expert. */
export function SeloExpert() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#f5c04e]/25 bg-[#f5c04e]/[0.07] px-4 py-2.5">
      <Crown aria-hidden className="h-4 w-4 shrink-0 text-[#f5c04e]" />
      <span className="text-sm text-white/75">
        <strong className="font-semibold text-[#f5c04e]">Expert</strong> — microcurso
        completo liberado.
      </span>
    </div>
  );
}
