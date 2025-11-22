"use client";

import { motion } from "framer-motion";
import { Sparkles, Package, ArrowRight } from "lucide-react";
import { useServicePrices } from "@/hooks/useServicePrices";
import { SectionDivider } from "@/components/ui/section-divider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "next-intl";
import { getPricingTranslation, getPricingDescriptionTranslation } from "@/data/pricing-translations";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const packageEmojis: Record<string, string> = {
  "Local Authority Launch": "📍",
  "Content Engine Pro": "📣",
  "Conversion Website Sprint": "💻",
  "Video Growth Kit": "🎬",
  "AI Automation Jumpstart": "🤖",
};

const packageUrls: Record<string, string> = {
  "Local Authority Launch": "/servicos/seo-local#builder",
  "Content Engine Pro": "/servicos/edicao-de-video#builder", 
  "Conversion Website Sprint": "/servicos/construcao-de-sites#builder",
  "Video Growth Kit": "/servicos/edicao-de-video#builder",
  "AI Automation Jumpstart": "/servicos/automacao-e-integracao#builder",
};

function splitDescription(description: string): string[] {
  if (!description) return [];
  return description
    .split(/,|•|\n|\u2022/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

export function ServicePackagesSection() {
  const { prices, loading, error } = useServicePrices("bundles");
  const locale = useLocale();

  return (
    <section className="py-24 bg-muted/30" id="packages">
      <SectionDivider icon={Package} />
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="mb-4">Pacotes Inteligentes</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Escolha um pacote pronto ou personalize o seu bundle
          </h2>
          <p className="text-muted-foreground text-lg">
            Cada pacote combina etapas estratégicas + execução para acelerar resultados. Use-os como ponto de partida e ajuste tudo no configurador abaixo.
          </p>
        </div>

        {loading && (
          <div className="text-center text-muted-foreground">Carregando pacotes...</div>
        )}

        {error && (
          <div className="text-center text-destructive">{error}</div>
        )}

        {!loading && prices.length === 0 && !error && (
          <div className="text-center text-muted-foreground">
            Nenhum pacote cadastrado no momento.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {prices.map((pkg, index) => (
            <motion.div
              key={pkg.unitLabel}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative h-full border-border/60 bg-background/80 backdrop-blur">
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">
                      {packageEmojis[pkg.unitLabel] ?? "✨"}
                    </span>
                    <Badge variant="secondary" className="uppercase tracking-widest text-xs">
                      {pkg.category === "packages" ? "Bundle" : pkg.category}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-[0.35em] mb-2">
                      Passo sugerido
                    </p>
                    <h3 className="text-2xl font-semibold leading-tight">
                      {getPricingTranslation(pkg.unitLabel, locale)}
                    </h3>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-primary">
                      {currencyFormatter.format(pkg.priceRange.recommended)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Valor estimado. Ajuste itens no configurador para montar seu orçamento final.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {splitDescription(getPricingDescriptionTranslation(pkg.description, pkg.unitLabel, locale)).map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button asChild className="w-full" variant="secondary">
                    <a href={`${packageUrls[pkg.unitLabel] ?? "#builder"}?bundle=${encodeURIComponent(pkg.unitLabel)}`} className="flex items-center justify-center gap-2">
                      Personalizar pacote
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
