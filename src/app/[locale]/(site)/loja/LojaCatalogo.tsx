"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProdutoDaVitrine } from "@/lib/loja";

const formatadorBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function LojaCatalogo({ produtos }: { produtos: ProdutoDaVitrine[] }) {
  const t = useTranslations("Store");
  const [categoria, setCategoria] = useState<string | null>(null);

  const categorias = useMemo(() => {
    const vistas = new Map<string, string>();
    for (const p of produtos) {
      if (!vistas.has(p.category)) vistas.set(p.category, p.categoryName);
    }
    return [...vistas.entries()].map(([id, nome]) => ({ id, nome }));
  }, [produtos]);

  const visiveis = categoria
    ? produtos.filter((p) => p.category === categoria)
    : produtos;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
      <section className="container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-2xl mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("title")}</h1>
          <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>

        {categorias.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              type="button"
              onClick={() => setCategoria(null)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium border transition",
                categoria === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-foreground/80 hover:border-primary/50 hover:text-foreground"
              )}
            >
              {t("allCategories")}
            </button>
            {categorias.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoria(c.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium border transition",
                  categoria === c.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-foreground/80 hover:border-primary/50 hover:text-foreground"
                )}
              >
                {c.nome}
              </button>
            ))}
          </div>
        )}

        {visiveis.length === 0 ? (
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Package size={32} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("emptyTitle")}</h2>
            <p className="text-muted-foreground">{t("emptySubtitle")}</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">
            {visiveis.map((produto) => (
              <Link
                key={produto.id}
                href={`/loja/${produto.slug}`}
                className="group relative rounded-2xl border border-border bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl p-4 transition-all duration-300 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10"
              >
                <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/50 to-card/50">
                  {produto.thumbnail ? (
                    <img
                      src={produto.thumbnail}
                      alt={produto.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={48} className="text-gray-600" />
                    </div>
                  )}
                  {produto.discount > 0 && (
                    <Badge className="absolute top-2 left-2 bg-red-500/90 backdrop-blur text-white text-xs">
                      -{produto.discount}%
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className="mb-2 text-xs text-muted-foreground">
                  {produto.categoryName}
                </Badge>
                <h3 className="font-semibold leading-snug mb-2 group-hover:text-amber-400 transition-colors">
                  {produto.name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-amber-400">
                    {formatadorBRL.format(produto.price)}
                  </span>
                  {produto.originalPrice > produto.price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatadorBRL.format(produto.originalPrice)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
