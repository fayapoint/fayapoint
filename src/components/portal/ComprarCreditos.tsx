"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Loader2, Check } from "lucide-react";
import { useT } from "@/i18n/dicionario";
import { useServiceCart } from "@/contexts/ServiceCartContext";
import { CREDIT_PACKS } from "@/lib/course-tiers";

/**
 * Comprar créditos — o botão que faltava.
 *
 * ## O que existia antes (nada) e o que isso custava
 *
 * `CREDIT_PACKS` está no código desde sempre, `POST /api/credits/purchase`
 * existia, e a resposta da API `/api/credits` já devolvia os pacotes. **Só não
 * havia tela.** Nenhum `.tsx` do projeto renderizava um pacote, e a rota de
 * compra apontava para `/checkout/credits/<id>`, que dá 404.
 *
 * Medido no banco em 10/08/2026: `totalPurchased` = **0** somando os 23
 * usuários, zero pacotes em zero contas. Não era falta de demanda — era falta
 * de porta.
 *
 * ## Por que carrinho e não um checkout próprio
 *
 * O pacote entra no carrinho como `type: 'credits'` e vai para `/checkout/cart`,
 * o mesmo checkout de curso e serviço: PIX, boleto, cartão parcelado,
 * MercadoPago, recibo, webhook, estorno. Um checkout separado só para crédito
 * seria reescrever tudo isso — e um segundo lugar para o dinheiro dar defeito.
 *
 * ⚠️ **O preço aqui é só o que a pessoa LÊ.** Quem cobra é o servidor, que
 * resolve o pacote em `resolveCreditPack` e ignora qualquer preço vindo do
 * cliente. O valor viaja junto apenas para o checkout parar se o catálogo tiver
 * mudado com a aba aberta.
 */
export function ComprarCreditos({ compacto = false }: { compacto?: boolean }) {
  const T = useT();
  const router = useRouter();
  const { addItem } = useServiceCart();
  const [indo, setIndo] = useState<string | null>(null);

  function comprar(pack: (typeof CREDIT_PACKS)[number]) {
    setIndo(pack.id);
    addItem({
      id: pack.id,
      slug: pack.id,
      type: "credits",
      name: `${pack.credits} ${T("créditos")}`,
      quantity: 1,
      price: pack.priceReais,
    });
    router.push("/checkout/cart");
  }

  return (
    <div className={compacto ? "" : "rounded-xl border border-border bg-secondary/20 p-4 md:p-6"}>
      <div className="mb-1 flex items-center gap-2">
        <Coins size={16} className="text-amber-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {T("Comprar créditos")}
        </h3>
      </div>
      {/* A paridade é a única coisa que faz a tabela abaixo ser legível.
          Dizer isso uma vez, aqui, evita repetir "= R$" em cada linha. */}
      <p className="mb-4 text-xs text-muted-foreground">
        {T("1 crédito = R$1. Os créditos comprados valem 90 dias e não vencem junto com os do plano.")}
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CREDIT_PACKS.map((pack) => {
          const bonus = pack.credits - pack.priceReais;
          return (
            <button
              key={pack.id}
              onClick={() => comprar(pack)}
              disabled={indo !== null}
              className="group relative flex flex-col items-start gap-1 rounded-lg border border-border bg-background/60 p-3 text-left transition-colors hover:border-amber-400/60 hover:bg-amber-500/[0.06] disabled:opacity-60"
            >
              {bonus > 0 && (
                <span className="absolute -top-2 right-2 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold text-black">
                  +{bonus}
                </span>
              )}
              <span className="text-xl font-extrabold tabular-nums text-amber-300">
                {pack.credits}
              </span>
              <span className="text-[11px] text-muted-foreground">{T("créditos")}</span>
              <span className="mt-1 flex items-center gap-1 text-sm font-bold">
                {indo === pack.id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} className="opacity-0 transition-opacity group-hover:opacity-100 text-amber-400" />
                )}
                R${pack.priceReais}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
