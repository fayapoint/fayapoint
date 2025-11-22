"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Layers, ShoppingCart, Minus, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useServicePrices } from "@/hooks/useServicePrices";
import type { ServicePrice } from "@/types/pricing";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionDivider } from "@/components/ui/section-divider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useServiceCart } from "@/contexts/ServiceCartContext";
import { useLocale } from "next-intl";
import { getPricingTranslation, getPricingDescriptionTranslation } from "@/data/pricing-translations";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

interface ServiceBuilderSectionProps {
  serviceSlug?: string;
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  showServiceTabs?: boolean;
  restrictToServiceSlug?: boolean;
  sectionId?: string;
  source?: string;
}

import { useUser } from "@/contexts/UserContext";

// ... existing imports ...

const bundleDefinitions: Record<string, Record<string, number>> = {
  "Local Authority Launch": {
    "GMB Optimization": 1,
    "Review Management System": 1,
    "Local Citation Pack": 1
  },
  "Content Engine Pro": {
    "Static Post Design": 12,
    "Reel/Short Editing": 4,
    "Community Management": 10
  },
  "Conversion Website Sprint": {
    "Discovery Workshop": 1,
    "UX/UI Design Screen": 8,
    "Frontend Dev Hour": 40,
    "CMS Integration Block": 1,
    "SEO & Performance Pack": 1
  },
  "Video Growth Kit": {
    "Scriptwriting": 4,
    "Video Editing": 4,
    "Motion Graphics": 4
  },
  "AI Automation Jumpstart": {
    "Process Mapping": 1,
    "Simple Automation Workflow": 3,
    "CRM/Database Integration": 1
  }
};

export function ServiceBuilderSection({
  serviceSlug,
  title,
  subtitle,
  badgeLabel = "Construtor de serviços",
  showServiceTabs,
  restrictToServiceSlug = false,
  sectionId = "builder",
  source,
}: ServiceBuilderSectionProps) {
  const { user, setUser, isLoggedIn } = useUser();
  const searchParams = useSearchParams();
  const { prices, loading, error, groupedByService } = useServicePrices(
    restrictToServiceSlug && serviceSlug ? serviceSlug : undefined,
  );
  
  // ... existing imports ...

  const [unlockName, setUnlockName] = useState("");
  const [unlockEmail, setUnlockEmail] = useState("");

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockName && unlockEmail) {
      setUser({ name: unlockName, email: unlockEmail });
      toast.success("Acesso liberado! Personalize seu pacote.");
    }
  };

  const locale = useLocale();
  const { items, setItemQuantity, addItem, clearCart } = useServiceCart();
  const [activeService, setActiveService] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [contact, setContact] = useState({ name: "", email: "", company: "", notes: "" });

  // Auto-fill contact if user is logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      setContact(prev => ({
        ...prev,
        name: user.name,
        email: user.email
      }));
    }
  }, [isLoggedIn, user]);

  // Handle bundle pre-fill from URL
  useEffect(() => {
    const bundleParam = searchParams.get("bundle");
    if (bundleParam && !loading && prices.length > 0) {
      const definition = bundleDefinitions[bundleParam];
      if (definition) {
        // We only load if the cart is empty to avoid overwriting user work
        // Or we can force it. Let's force it but maybe show a toast.
        // Actually, if the user just arrived, the cart might be empty or persisted.
        // Let's clear and add.
        
        // Check if we already have these items to avoid infinite loop if we don't remove param
        // Simple check: if cart has items matching the bundle, assume loaded?
        // Better: use a ref to track if we processed this bundle param?
        // For simplicity, we'll just run it once when prices load.
        
        // But React Strict Mode runs effects twice.
        // We can check if the cart is already populated with THIS bundle?
        // No, let's just do it. clearCart() + addItems.
        
        // To avoid constant re-adding, we might want to check if searchParams changed.
        // But we need prices to be loaded.
        
        clearCart();
        let addedCount = 0;
        
        Object.entries(definition).forEach(([unitLabel, qty]) => {
          const priceItem = prices.find(p => p.unitLabel === unitLabel);
          if (priceItem) {
            addItem({
              id: makeKey(priceItem),
              type: "service",
              name: getPricingTranslation(priceItem.unitLabel, locale),
              quantity: qty,
              price: priceItem.priceRange.recommended,
              serviceSlug: priceItem.serviceSlug,
              unitLabel: priceItem.unitLabel,
              track: priceItem.track,
            });
            addedCount++;
          }
        });

        if (addedCount > 0) {
            toast.success(`Pacote "${bundleParam}" carregado!`);
            // Scroll to builder
            const element = document.getElementById(sectionId);
            if (element) element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, prices]); // Only run when prices load. relying on bundle param being there initially.

  const catalog = useMemo(() => {
    const entries = Object.entries(groupedByService)
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

    if (restrictToServiceSlug && serviceSlug) {
      return entries.filter((entry) => entry.slug === serviceSlug);
    }
    return entries;
  }, [groupedByService, restrictToServiceSlug, serviceSlug]);

  useEffect(() => {
    if (serviceSlug && restrictToServiceSlug) {
      setActiveService(serviceSlug);
      return;
    }

    if (!activeService && catalog.length > 0) {
      setActiveService(serviceSlug ?? catalog[0].slug);
    }
  }, [catalog, activeService, serviceSlug, restrictToServiceSlug]);

  const priceIndex = useMemo(() => {
    const map = new Map<string, ServicePrice>();
    prices.forEach((price) => {
      map.set(makeKey(price), price);
    });
    return map;
  }, [prices]);

  const cartLines = useMemo(() => {
    return Object.values(items)
      .filter((item) => item.type === "service" && item.quantity > 0)
      .map((item) => {
        const price = priceIndex.get(item.id);
        if (!price) return null;
        return {
          key: item.id,
          price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
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
    const currentItem = items[key];
    const currentQty = currentItem?.quantity ?? 0;
    
    if (currentQty === 0) {
      const next = Math.max(price.defaultQuantity, price.minQuantity);
      addItem({
        id: key,
        type: "service",
        name: getPricingTranslation(price.unitLabel, locale),
        quantity: next,
        price: price.priceRange.recommended,
        serviceSlug: price.serviceSlug,
        unitLabel: price.unitLabel,
        track: price.track,
      });
    } else {
      const next = currentQty + 1;
      setItemQuantity(key, next);
    }
  }

  function decrement(price: ServicePrice) {
    const key = makeKey(price);
    const currentItem = items[key];
    const currentQty = currentItem?.quantity ?? 0;
    
    if (currentQty === 0) {
      return;
    }
    const next = currentQty - 1;
    if (next < price.minQuantity) {
      setItemQuantity(key, 0); // 0 usually removes it in setItemQuantity logic if handled, or we should call removeItem
      // checking setItemQuantity logic: if (quantity <= 0) { const { [key]: _removed, ...rest } = prev; return rest; }
      // So 0 removes it. Correct.
    } else {
      setItemQuantity(key, next);
    }
  }

  async function handleSubmitBundle() {
    if (cartLines.length === 0 || submitting) return;
    if (!contact.name.trim() || !contact.email.trim()) {
      toast.error("Informe seu nome e email para prosseguir.");
      return;
    }
    setSubmitting(true);
    setSubmitStatus("idle");
    try {
      const payload = {
        name: contact.name.trim(),
        email: contact.email.trim(),
        company: contact.company.trim() || undefined,
        notes: contact.notes.trim() || undefined,
        source: source ?? `${activeService || "multi"}-builder`,
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
      setContact({ name: "", email: "", company: "", notes: "" });
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
    <section className="py-24 bg-background" id={sectionId}>
      <SectionDivider icon={Layers} />
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto mb-14">
          <Badge className="mb-4">{badgeLabel}</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {title ?? "Monte seu bundle ideal e veja o valor em tempo real"}
          </h2>
          <p className="text-muted-foreground text-lg">
            {subtitle ??
              "Combine etapas estratégicas, execução e suporte. Ajuste quantidades e receba uma estimativa de investimento instantânea para compartilhar com stakeholders ou seguir para a contratação."}
          </p>
        </div>

        {loading && (
          <div className="text-center text-muted-foreground">Carregando itens...</div>
        )}
        {error && (<div className="text-center text-destructive">{error}</div>)}

        {!loading && !error && catalog.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <Card className="p-6 space-y-6">
              {catalog.length > 1 && (showServiceTabs ?? !restrictToServiceSlug) && (
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
              )}


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

              {!isLoggedIn ? (
                <Card className="p-8 text-center border-dashed border-2">
                  <h3 className="text-2xl font-bold mb-4">Desbloqueie o configurador</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Para acessar os preços granulares e montar seu bundle personalizado, precisamos apenas saber quem você é.
                  </p>
                  <form onSubmit={handleUnlock} className="max-w-sm mx-auto space-y-4">
                    <Input
                      placeholder="Seu nome"
                      required
                      value={unlockName}
                      onChange={(e) => setUnlockName(e.target.value)}
                    />
                    <Input
                      placeholder="Seu email profissional"
                      type="email"
                      required
                      value={unlockEmail}
                      onChange={(e) => setUnlockEmail(e.target.value)}
                    />
                    <Button type="submit" className="w-full">
                      Ver preços e personalizar
                    </Button>
                  </form>
                </Card>
              ) : (
                <Accordion type="multiple" defaultValue={trackGroups.map(g => g.name)} className="space-y-6">
                  {trackGroups.map((group) => (
                    <AccordionItem key={group.name} value={group.name} className="border-none">
                      <AccordionTrigger className="hover:no-underline py-0 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <h4 className="text-lg font-semibold">{group.name}</h4>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-4">
                          {group.items.map((item) => {
                            const key = makeKey(item);
                            const cartItem = items[key];
                            const quantity = cartItem?.quantity ?? 0;
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
                                    <p className="text-base font-medium">
                                      {getPricingTranslation(item.unitLabel, locale)}
                                    </p>
                                    <p className="text-sm text-muted-foreground max-w-2xl">
                                      {getPricingDescriptionTranslation(item.description, item.unitLabel, locale)}
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
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
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
                          <p className="font-medium text-sm">{getPricingTranslation(line.price.unitLabel, locale)}</p>
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

              <div className="space-y-3">
                <Input
                  placeholder="Seu nome completo"
                  value={contact.name}
                  onChange={(e) => setContact((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={isLoggedIn} // Lock if logged in to ensure consistency
                  className={isLoggedIn ? "bg-muted" : ""}
                />
                <Input
                  type="email"
                  placeholder="Email de contato"
                  value={contact.email}
                  onChange={(e) => setContact((prev) => ({ ...prev, email: e.target.value }))}
                  disabled={isLoggedIn} // Lock if logged in
                  className={isLoggedIn ? "bg-muted" : ""}
                />
                <Input
                  placeholder="Empresa (opcional)"
                  value={contact.company}
                  onChange={(e) => setContact((prev) => ({ ...prev, company: e.target.value }))}
                />
                <Textarea
                  placeholder="Observações sobre escopo, prazos ou integrações"
                  value={contact.notes}
                  onChange={(e) => setContact((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

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

        {!loading && !error && catalog.length === 0 && (
          <div className="text-center text-muted-foreground">Nenhum item disponível para este serviço.</div>
        )}
      </div>
    </section>
  );
}
