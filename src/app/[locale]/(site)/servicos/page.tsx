import Link from "next/link";
import Script from "next/script";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScheduleConsultationButton } from "@/components/consultation/ScheduleConsultationButton";
import {
  ArrowRight,
  Bot,
  Clapperboard,
  Globe,
  MapPin,
  Workflow,
} from "lucide-react";

/**
 * Hub de serviços.
 *
 * Esta rota tinha `layout.tsx` (com canônica e título próprios, e entrada no
 * sitemap) mas nenhuma `page.tsx` — respondia 404 desde sempre. E não era um
 * 404 escondido: `CubeHomepage.tsx` linka `/servicos` no menu do topo e no
 * menu mobile, então toda visita à home oferecia um link quebrado, e o
 * Googlebot o seguia a cada rastreamento. É a origem mais provável do
 * "Não encontrado (404)" no Search Console.
 *
 * A página é o índice real dos cinco serviços que já existem — o texto de cada
 * cartão é o mesmo `description` que a página filha declara ao Google, para
 * não haver duas promessas diferentes do mesmo serviço.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://fayai.com.br";

/**
 * Só o que não é texto mora aqui: o slug (que é a URL), o ícone e a cor.
 * Rótulo, título e descrição vêm de `ServicesHub.items.<slug>` — a ordem dos
 * cards é a ordem deste array, e é ela que o JSON-LD anuncia.
 */
const services = [
  { slug: "consultoria-ai", icon: Bot, accent: "text-purple-500", tint: "bg-purple-500/10" },
  { slug: "automacao-e-integracao", icon: Workflow, accent: "text-emerald-500", tint: "bg-emerald-500/10" },
  { slug: "construcao-de-sites", icon: Globe, accent: "text-blue-500", tint: "bg-blue-500/10" },
  { slug: "seo-local", icon: MapPin, accent: "text-amber-500", tint: "bg-amber-500/10" },
  { slug: "edicao-de-video", icon: Clapperboard, accent: "text-rose-500", tint: "bg-rose-500/10" },
] as const;

export default async function ServicosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ServicesHub" });

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("listName"),
    description: t("listDescription"),
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t(`items.${s.slug}.title`),
      description: t(`items.${s.slug}.description`),
      url: `${SITE_URL}/${locale}/servicos/${s.slug}`,
    })),
  };

  return (
    <>
      <Script id="ld-servicos-hub" type="application/ld+json">
        {JSON.stringify(itemListLd)}
      </Script>

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <p className="text-sm uppercase tracking-[0.3em] text-purple-400 mb-4">
              {t("eyebrow")}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("title")}</h1>
            <p className="text-lg md:text-xl text-muted-foreground">{t("subtitle")}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card
                  key={service.slug}
                  className="p-6 flex flex-col h-full transition-colors hover:border-purple-500/40"
                >
                  <div
                    className={`inline-flex items-center justify-center p-3 rounded-xl ${service.tint} mb-5 self-start`}
                  >
                    <Icon className={`w-7 h-7 ${service.accent}`} />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                    {t(`items.${service.slug}.eyebrow`)}
                  </p>
                  <h2 className="text-xl font-semibold mb-3">
                    {t(`items.${service.slug}.title`)}
                  </h2>
                  <p className="text-muted-foreground mb-6 flex-1">
                    {t(`items.${service.slug}.description`)}
                  </p>
                  <Button asChild variant="ghost" className="justify-start px-0">
                    <Link href={`/${locale}/servicos/${service.slug}`}>
                      {t("seeService")}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </Card>
              );
            })}
          </div>

          <div className="max-w-3xl mx-auto text-center mt-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {t("ctaTitle")}
            </h2>
            <p className="text-muted-foreground mb-8">{t("ctaBody")}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <ScheduleConsultationButton
                size="lg"
                className="px-8 py-6 text-lg"
                source="servicos-hub"
                showCompanyRole
              />
              <Button asChild size="lg" variant="outline" className="px-8 py-6 text-lg">
                <Link href={`/${locale}/casos`}>{t("seeCases")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
