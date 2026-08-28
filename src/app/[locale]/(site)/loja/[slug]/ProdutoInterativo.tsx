"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useServiceCart } from "@/contexts/ServiceCartContext";
import type { ProdutoDaLoja } from "@/lib/loja";

const formatadorBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Preço, seletor de variante e "Adicionar ao carrinho" — o mesmo carrinho do
 * portal (`useServiceCart`), com a mesma convenção de id `store-<_id>` do
 * `StorePanel`, para o item não duplicar entre a loja pública e o painel.
 */
export default function ProdutoInterativo({ produto }: { produto: ProdutoDaLoja }) {
  const t = useTranslations("Store");
  const { addItem } = useServiceCart();
  const [varianteId, setVarianteId] = useState<string | null>(
    produto.variants[0]?.id ?? null
  );

  const variante = produto.variants.find((v) => v.id === varianteId) ?? null;
  const preco = variante?.price ?? produto.price;
  const esgotado = produto.variants.length === 0 && produto.stock <= 0;

  const adicionar = () => {
    const nome = variante ? `${produto.name} — ${variante.name}` : produto.name;
    addItem({
      id: variante ? `store-${produto.id}-${variante.id}` : `store-${produto.id}`,
      type: "service" as const,
      name: nome,
      quantity: 1,
      price: preco,
      image: produto.thumbnail,
    });
    toast.success(t("addedToCart", { name: nome }));
  };

  return (
    <div className="mt-6">
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-3xl font-bold text-amber-400">
          {formatadorBRL.format(preco)}
        </span>
        {!variante && produto.originalPrice > produto.price && (
          <span className="text-lg text-muted-foreground line-through">
            {formatadorBRL.format(produto.originalPrice)}
          </span>
        )}
      </div>

      {produto.variants.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {t("variantLabel")}
          </p>
          <div className="flex flex-wrap gap-2">
            {produto.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVarianteId(v.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium border transition",
                  v.id === varianteId
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-foreground/80 hover:border-primary/50 hover:text-foreground"
                )}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        size="lg"
        onClick={adicionar}
        disabled={esgotado}
        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <ShoppingCart size={18} className="mr-2" />
        {esgotado ? t("outOfStock") : t("addToCart")}
      </Button>
    </div>
  );
}
