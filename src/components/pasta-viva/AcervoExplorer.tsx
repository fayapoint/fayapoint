"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Clock3, Search, Sparkles, WalletCards, X } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type MetodoParaExplorar = {
  slug: string;
  titulo: string;
  tldr: string;
  categoria: string;
  investimentoReais: number;
  tempoConclusaoHoras: number;
  dificuldade: "baixa" | "media" | "alta";
  revisadoEm: string;
  capa: string;
};

export function AcervoExplorer({ metodos }: { metodos: MetodoParaExplorar[] }) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [custoZero, setCustoZero] = useState(false);
  const [rapido, setRapido] = useState(false);
  const categorias = [...new Set(metodos.map((metodo) => metodo.categoria))];

  const resultados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return metodos.filter((metodo) => {
      const correspondeBusca =
        !termo ||
        `${metodo.titulo} ${metodo.tldr} ${metodo.categoria}`
          .toLocaleLowerCase("pt-BR")
          .includes(termo);
      return (
        correspondeBusca &&
        (categoria === "todas" || metodo.categoria === categoria) &&
        (!custoZero || metodo.investimentoReais === 0) &&
        (!rapido || metodo.tempoConclusaoHoras <= 2)
      );
    });
  }, [busca, categoria, custoZero, metodos, rapido]);

  const limpar = () => {
    setBusca("");
    setCategoria("todas");
    setCustoZero(false);
    setRapido(false);
  };

  return (
    <section aria-labelledby="acervo-heading" className="my-16 scroll-mt-8" id="acervo">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Acervo navegável</p>
          <h2 id="acervo-heading" className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Encontre o próximo método pela realidade do seu momento
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Filtre por etapa, custo de início ou tempo de trabalho. Retorno continua separado: ainda não medimos.
          </p>
        </div>
        <p aria-live="polite" className="shrink-0 text-sm text-muted-foreground">
          {resultados.length} {resultados.length === 1 ? "método" : "métodos"}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card/70 p-3 shadow-sm sm:p-4">
        <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="sr-only">Buscar método</span>
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por método, etapa ou assunto"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            type="search"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtros do acervo">
          <select
            aria-label="Filtrar por etapa"
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
            className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="todas">Todas as etapas</option>
            {categorias.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <FiltroAtivo ativo={custoZero} aoAlternar={() => setCustoZero((valor) => !valor)}>
            <WalletCards className="h-3.5 w-3.5" aria-hidden /> Começar com R$ 0
          </FiltroAtivo>
          <FiltroAtivo ativo={rapido} aoAlternar={() => setRapido((valor) => !valor)}>
            <Clock3 className="h-3.5 w-3.5" aria-hidden /> Até 2 horas
          </FiltroAtivo>
          {(busca || categoria !== "todas" || custoZero || rapido) && (
            <button
              onClick={limpar}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" aria-hidden /> Limpar
            </button>
          )}
        </div>
      </div>

      {resultados.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {resultados.map((metodo) => (
            <article key={metodo.slug} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  src={metodo.capa}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 320px, (min-width: 640px) 46vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                />
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/55 to-transparent" aria-hidden />
                <p className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {metodo.categoria}
                </p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{metodo.investimentoReais === 0 ? "Começar: R$ 0" : `Começar: R$ ${metodo.investimentoReais.toLocaleString("pt-BR")}`}</span>
                  <span>{metodo.tempoConclusaoHoras}h de trabalho</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground">
                  <Link href={`/pasta-viva/metodo/${metodo.slug}`} className="outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                    {metodo.titulo}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{metodo.tldr}</p>
                <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden /> Revisado em {metodo.revisadoEm}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
          <p className="font-medium text-foreground">Nenhum método combina com estes filtros.</p>
          <p className="mt-2 text-sm text-muted-foreground">Tente uma etapa diferente ou limpe os filtros para ver o acervo inteiro.</p>
          <button onClick={limpar} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Ver todos os métodos</button>
        </div>
      )}
    </section>
  );
}

function FiltroAtivo({ ativo, aoAlternar, children }: { ativo: boolean; aoAlternar: () => void; children: ReactNode }) {
  return (
    <button
      aria-pressed={ativo}
      onClick={aoAlternar}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${ativo ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}
