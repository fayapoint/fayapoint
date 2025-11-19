"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Layers, ShoppingCart, Minus, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useServicePrices } from "@/hooks/useServicePrices";
import type { ServicePrice } from "@/types/pricing";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionDivider } from "@/components/ui/section-divider";
import { useServiceCart } from "@/contexts/ServiceCartContext";

const serviceLabels: Record<
  string,
  {
    name: string;
    description: string;
    color: string;
  }
> = {
  "website-full": {
    name: "Website completo",
    description: "Da descoberta ao deploy com UX, UI e código sob medida.",
    color: "from-blue-500/30 via-sky-500/10 to-transparent",
  },
  "social-management": {
    name: "Social media & growth",
    description: "Conteúdo, mídia e comunidade com consistência e insights.",
    color: "from-pink-500/30 via-fuchsia-500/10 to-transparent",
  },
  "local-seo": {
    name: "Google Maps & Local SEO",
    description: "Domine o pack local com reputação e páginas locais.",
    color: "from-emerald-500/30 via-emerald-500/10 to-transparent",
  },
  "video-production": {
    name: "Vídeo & conteúdo audiovisual",
    description: "Pré-produção, filmagem e pós completas em um só lugar.",
    color: "from-purple-500/30 via-purple-500/10 to-transparent",
  },
  "automation-ai": {
    name: "Automação & IA aplicada",
    description: "Mapeamento de processos, agentes e integrações inteligentes.",
    color: "from-amber-500/30 via-amber-500/10 to-transparent",
  },
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type TrackGroup = {
  name: string;
  items: ServicePrice[];
};

function makeKey(price: ServicePrice) {
  return `${price.serviceSlug}:${price.unitLabel}`;
}

export function ServiceBuilderSection() {
  const { prices, loading, error, groupedByService } = useServicePrices();
  const { items, setItemQuantity, clearCart } = useServiceCart();
  const [activeService, setActiveService] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const catalog = useMemo(() => {
    return Object.entries(groupedByService)
      .filter(([slug]) => slug !== "bundles")
      .map(([slug, items]) => ({
        slug,
        meta: serviceLabels[slug] ?? {
          name: slug,
          description: "Configure as etapas necessárias",
          color: "from-slate-500/30 via-slate-500/10 to-transparent",
        },
        tracks: items.reduce<Record<string, ServicePrice[]>>((acc, item) => {
          acc[item.track] = acc[item.track] ? [...acc[item.track], item] : [item];
          return acc;
        }, {}),
      }));
  }, [groupedByService]);

  useEffect(() => {
    if (!activeService && catalog.length > 0) {
      setActiveService(catalog[0].slug);
    }
  }, [catalog, activeService]);

  const priceIndex = useMemo(() => {
    const map = new Map<string, ServicePrice>();
    prices.forEach((price) => {
      map.set(makeKey(price), price);
    });
    return map;
  }, [prices]);

  const cartLines = useMemo(() => {
    return Object.entries(items)
      .filter(([, qty]) => qty > 0)
      .map(([key, qty]) => {
        const price = priceIndex.get(key);
        if (!price) return null;
        const unit = price.priceRange.recommended;
        return {
          key,
          price,
          quantity: qty,
          subtotal: unit * qty,
        };
      })
      .filter(Boolean) as Array<{
      key: string;
      price: ServicePrice;
      quantity: number;
      subtotal: number;
    }>;
  }, [items, priceIndex]);

  const total = cartLines.reduce((sum, line) => sum + line.subtotal, 0);

  function increment(price: ServicePrice) {
    const key = makeKey(price);
    const current = items[key] ?? 0;
    const next = current === 0 ? Math.max(price.defaultQuantity, price.minQuantity) : current + 1;
    setItemQuantity(key, next);
  }

  function decrement(price: ServicePrice) {
    const key = makeKey(price);
    const current = items[key] ?? 0;
    if (current === 0) {
      return;
    }
    const next = current - 1;
    if (next < price.minQuantity) {
      setItemQuantity(key, 0);
    } else {
      setItemQuantity(key, next);
    }
  }

  async function handleSubmitBundle() {
    if (cartLines.length === 0 || submitting) return;
    setSubmitting(true);
    setSubmitStatus("idle");
    try {
      const payload = {
        total,
        selections: cartLines.map((line) => ({
          serviceSlug: line.price.serviceSlug,
          unitLabel: line.price.unitLabel,
          track: line.price.track,
          quantity: line.quantity,
          unitPrice: line.price.priceRange.recommended,
          subtotal: line.subtotal,
        })),
      };

      const res = await fetch("/api/service-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Falha ao enviar proposta");
      }

      setSubmitStatus("success");
      toast.success("Bundle enviado! Entraremos em contato para validar escopo.");
      clearCart();
    } catch (err) {
      console.error(err);
      setSubmitStatus("error");
      toast.error("Não conseguimos enviar agora. Recarregue a página ou tente novamente em instantes.");
    } finally {
      setSubmitting(false);
    }
  }

  const activeCatalog = catalog.find((item) => item.slug === activeService);
  const trackGroups: TrackGroup[] = activeCatalog
    ? Object.entries(activeCatalog.tracks).map(([track, items]) => ({ name: track, items }))
    : [];

  return (
    <section className="py-24 bg-background" id="builder">
      <SectionDivider icon={Layers} />
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto mb-14">
          <Badge className="mb-4">Construtor de serviços</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Monte seu bundle ideal e veja o valor em tempo real
          </h2>
          <p className="text-muted-foreground text-lg">
            Combine etapas estratégicas, execução e suporte. Ajuste quantidades e receba uma estimativa de investimento instantânea para compartilhar com stakeholders ou seguir para a contratação.
          </p>
        </div>

        {loading && (
          <div className="text-center text-muted-foreground">Carregando itens...</div>
        )}
        {error && (<div className="text-center text-destructive">{error}</div>)}

        {!loading && !error && catalog.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <Card className="p-6 space-y-6">
              <div className="flex flex-wrap gap-3">
                {catalog.map((service) => (
                  <Button
                    key={service.slug}
                    variant={service.slug === activeService ? "default" : "outline"}
                    onClick={() => setActiveService(service.slug)}
                  >
                    {serviceLabels[service.slug]?.name ?? service.slug}
                  </Button>
                ))}
              </div>

              {activeCatalog && (
                <div className="rounded-2xl border border-border/60 p-5 relative overflow-hidden">
                  <div
                    className={`absolute inset-0 opacity-60 bg-gradient-to-br ${
                      activeCatalog.meta.color ?? "from-primary/30 via-primary/10 to-transparent"
                    }`}
                  />
                  <div className="relative z-10">
                    <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground mb-1">
                      Serviço selecionado
                    </p>
                    <h3 className="text-2xl font-semibold">{activeCatalog.meta.name}</h3>
                    <p className="text-muted-foreground max-w-2xl">
                      {activeCatalog.meta.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {trackGroups.map((group) => (
                  <div key={group.name} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <h4 className="text-lg font-semibold">{group.name}</h4>
                    </div>
                    <div className="grid gap-4">
                      {group.items.map((item) => {
                        const key = makeKey(item);
                        const quantity = items[key] ?? 0;
                        const unitPrice = item.priceRange.recommended;
                        const subtotal = quantity * unitPrice;
                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0.8, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="border border-border/60 rounded-2xl p-4 bg-card/70 backdrop-blur"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-base font-medium">{item.unitLabel}</p>
                                <p className="text-sm text-muted-foreground max-w-2xl">
                                  {item.description}
                                </p>
                                <div className="flex items-center gap-3 text-sm mt-2 text-muted-foreground">
                                  <span>
                                    {currencyFormatter.format(unitPrice)}
                                    <span className="text-xs"> / {item.unitType.replace("per_", "")}</span>
                                  </span>
                                  <span>Qtd min {item.minQuantity}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="icon" onClick={() => decrement(item)}>
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <div className="min-w-[48px] text-center font-semibold">{quantity}</div>
                                  <Button variant="outline" size="icon" onClick={() => increment(item)}>
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {subtotal > 0 ? currencyFormatter.format(subtotal) : "Não selecionado"}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 space-y-6 border border-border/70 bg-card/80 backdrop-blur">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Resumo</p>
                  <h3 className="text-2xl font-semibold">Seu bundle</h3>
                </div>
              </div>

              {cartLines.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Selecione etapas nos cards ao lado para começar a montar seu orçamento personalizado.
                </p>
              ) : (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
                  {cartLines.map((line) => (
                    <div key={line.key} className="border border-border/50 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{line.price.unitLabel}</p>
                          <p className="text-xs text-muted-foreground">
                            {line.quantity} × {currencyFormatter.format(line.price.priceRange.recommended)}
                          </p>
                        </div>
                        <p className="font-semibold text-sm">{currencyFormatter.format(line.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border/60 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-muted-foreground">Subtotal estimado</span>
                  <span className="text-2xl font-bold">{currencyFormatter.format(total)}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Valores base recomendados em USD. Após finalizar, compartilharemos um PDF detalhado e agenda para validar escopo.
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={cartLines.length === 0 || submitting}
                  onClick={handleSubmitBundle}
                >
                  {submitting ? "Enviando..." : "Solicitar proposta com este bundle"}
                </Button>
                {submitStatus === "success" && (
                  <p className="text-xs text-emerald-500">Recebemos seu bundle! Entraremos em contato.</p>
                )}
                {submitStatus === "error" && (
                  <p className="text-xs text-destructive">
                    Não foi possível enviar agora. Tente novamente ou fale com nosso time.
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Combos multi-serviço recebem condições personalizadas.
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
