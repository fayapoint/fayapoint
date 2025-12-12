"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import { getAttributionUtmPayload } from "@/lib/attribution";
import { Clipboard, FileText, Sparkles, Gauge, Search, MousePointerClick, Calculator } from "lucide-react";

type Locale = "pt-BR" | "en" | string;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function titleCase(input: string) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function WebsiteToolbox({ locale }: { locale: Locale }) {
  const isEn = locale === "en";

  const [businessName, setBusinessName] = useState("");
  const [niche, setNiche] = useState("");
  const [primaryOffer, setPrimaryOffer] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState(isEn ? "Get more leads" : "Gerar mais leads");
  const [domain, setDomain] = useState("");

  const [pagesCount, setPagesCount] = useState(6);
  const [languagesCount, setLanguagesCount] = useState(1);
  const [integrationsCount, setIntegrationsCount] = useState(2);
  const [monthlyTraffic, setMonthlyTraffic] = useState(3000);
  const [conversionRate, setConversionRate] = useState(0.02);
  const [leadValue, setLeadValue] = useState(350);

  const [leadEmail, setLeadEmail] = useState("");
  const [sending, setSending] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(isEn ? "Copied" : "Copiado");
    } catch {
      toast.error(isEn ? "Copy failed" : "Falha ao copiar");
    }
  };

  const copyPack = useMemo(() => {
    const bn = businessName ? titleCase(businessName) : (isEn ? "Your Business" : "Seu Negócio");
    const ni = niche ? niche.trim() : (isEn ? "your market" : "seu mercado");
    const offer = primaryOffer ? primaryOffer.trim() : (isEn ? "your offer" : "sua oferta");
    const goal = primaryGoal || (isEn ? "Get more leads" : "Gerar mais leads");

    const headline = isEn
      ? `${bn}: a website built to ${goal.toLowerCase()}`
      : `${bn}: um site feito para ${goal.toLowerCase()}`;

    const sub = isEn
      ? `Fast, SEO-ready and conversion-focused. Built for ${ni} with a clear path to ${offer}.`
      : `Rápido, pronto para SEO e focado em conversão. Feito para ${ni} com caminho claro para ${offer}.`;

    const bullets = isEn
      ? [
          "Performance-first (Core Web Vitals)",
          "Clear IA + copy structure for conversion",
          "Tracking + attribution from day one",
        ]
      : [
          "Performance primeiro (Core Web Vitals)",
          "Arquitetura + copy claros para conversão",
          "Tracking + atribuição desde o dia 1",
        ];

    const ctas = isEn
      ? ["Book a diagnosis", "Get an estimate", "See a plan", "Talk to an expert"]
      : ["Agendar diagnóstico", "Receber estimativa", "Ver plano", "Falar com especialista"];

    const outline = isEn
      ? [
          "Hero (promise + proof + CTA)",
          "Problem → Why now", 
          "Solution (how it works)",
          "Proof (cases, metrics)",
          "Offer (packages)",
          "FAQ + objections",
          "Final CTA + booking",
        ]
      : [
          "Hero (promessa + prova + CTA)",
          "Dor → Por que agora",
          "Solução (como funciona)",
          "Prova (cases, métricas)",
          "Oferta (pacotes)",
          "FAQ + objeções",
          "CTA final + agendamento",
        ];

    return {
      headline,
      sub,
      bullets,
      ctas,
      outline,
    };
  }, [businessName, isEn, niche, primaryGoal, primaryOffer]);

  const seoPack = useMemo(() => {
    const bn = businessName ? titleCase(businessName) : (isEn ? "Your Business" : "Seu Negócio");
    const offer = primaryOffer ? primaryOffer.trim() : (isEn ? "services" : "serviços");
    const ni = niche ? niche.trim() : (isEn ? "your market" : "seu mercado");

    const metaTitle = isEn
      ? `${bn} | ${offer} that convert`
      : `${bn} | ${offer} que convertem`;

    const metaDescription = isEn
      ? `High-performance website for ${ni}. SEO-ready, fast, with clear conversion paths. Book a free diagnosis.`
      : `Site de alta performance para ${ni}. Pronto para SEO, rápido e com caminho claro de conversão. Agende um diagnóstico grátis.`;

    const slugIdeas = isEn
      ? ["/services", "/pricing", "/case-studies", "/about", "/contact"]
      : ["/servicos", "/precos", "/casos", "/sobre", "/contato"];

    const schemaSnippet = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: bn,
      url: domain ? `https://${domain.replace(/^https?:\/\//, "")}` : "https://example.com",
      inLanguage: locale,
    };

    return {
      metaTitle,
      metaDescription,
      slugIdeas,
      schemaSnippet: JSON.stringify(schemaSnippet, null, 2),
    };
  }, [businessName, domain, isEn, locale, niche, primaryOffer]);

  const trackingPlan = useMemo(() => {
    const events = isEn
      ? [
          "page_view",
          "cta_click (hero / pricing / sticky)",
          "lead_submit (newsletter / toolbox / contact)",
          "book_consultation",
          "purchase (if ecommerce)",
          "scroll_depth (25/50/75/90)",
        ]
      : [
          "page_view",
          "cta_click (hero / precos / sticky)",
          "lead_submit (newsletter / toolbox / contato)",
          "book_consultation",
          "purchase (se ecommerce)",
          "scroll_depth (25/50/75/90)",
        ];

    const utmNotes = isEn
      ? [
          "Store UTMs on first visit (session + cookie)",
          "Attach UTMs to every lead", 
          "Track source attribution per CTA",
        ]
      : [
          "Salvar UTMs na primeira visita (sessão + cookie)",
          "Anexar UTMs em todo lead",
          "Rastrear atribuição por CTA",
        ];

    return {
      events,
      utmNotes,
    };
  }, [isEn]);

  const estimate = useMemo(() => {
    const complexity = pagesCount + integrationsCount * 2 + (languagesCount - 1) * 3;
    const weeks = clamp(Math.round(complexity / 6), 1, 10);

    const leads = monthlyTraffic * conversionRate;
    const revenue = leads * leadValue;

    return {
      complexity,
      weeks,
      leads: Math.round(leads),
      revenue: Math.round(revenue),
    };
  }, [conversionRate, integrationsCount, languagesCount, leadValue, monthlyTraffic, pagesCount]);

  const report = useMemo(() => {
    const header = isEn ? "Website Blueprint Report" : "Relatório de Blueprint do Site";

    const lines = [
      header,
      "",
      `${isEn ? "Business" : "Negócio"}: ${businessName || "-"}`,
      `${isEn ? "Niche" : "Nicho"}: ${niche || "-"}`,
      `${isEn ? "Offer" : "Oferta"}: ${primaryOffer || "-"}`,
      `${isEn ? "Goal" : "Objetivo"}: ${primaryGoal || "-"}`,
      `${isEn ? "Domain" : "Domínio"}: ${domain || "-"}`,
      "",
      `${isEn ? "Hero copy" : "Copy do hero"}:\n${copyPack.headline}\n${copyPack.sub}`,
      "",
      `${isEn ? "SEO" : "SEO"}:\nTitle: ${seoPack.metaTitle}\nDescription: ${seoPack.metaDescription}`,
      "",
      `${isEn ? "Tracking" : "Tracking"}:\n${trackingPlan.events.join("\n")}`,
      "",
      `${isEn ? "Estimate" : "Estimativa"}:\n${isEn ? "Weeks" : "Semanas"}: ${estimate.weeks}\n${isEn ? "Leads/month" : "Leads/mês"}: ${estimate.leads}\n${isEn ? "Revenue/month" : "Receita/mês"}: R$ ${estimate.revenue}`,
    ];

    return lines.join("\n");
  }, [businessName, copyPack, domain, estimate, isEn, niche, primaryGoal, primaryOffer, seoPack, trackingPlan]);

  const sendLead = async () => {
    if (!leadEmail) {
      toast.error(isEn ? "Enter your email" : "Informe seu email");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: leadEmail,
          source: "website-toolbox",
          leadType: "toolbox",
          details: report,
          referrerUrl: typeof window !== "undefined" ? window.location.href : undefined,
          utm: getAttributionUtmPayload(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || (isEn ? "Failed" : "Falhou"));

      toast.success(isEn ? "Sent! We'll reach out." : "Enviado! Vamos falar com você.");
    } catch (error) {
      const message = error instanceof Error ? error.message : (isEn ? "Failed" : "Falhou");
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-border bg-card/60 backdrop-blur p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-2">
              <Sparkles className="w-4 h-4" />
              {isEn ? "Website Toolbox" : "Website Toolbox"}
            </Badge>
            <Badge variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              {isEn ? "Blueprint" : "Blueprint"}
            </Badge>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mt-3">
            {isEn ? "Copy + SEO + tracking in minutes" : "Copy + SEO + tracking em minutos"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isEn
              ? "Generate a conversion-focused homepage blueprint and capture leads with attribution."
              : "Gere um blueprint de homepage focada em conversão e capture leads com atribuição."}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 px-5 py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gauge className="w-4 h-4" />
            <span className="text-sm">{isEn ? "Complexity" : "Complexidade"}</span>
          </div>
          <div className="mt-1 text-3xl font-bold">{estimate.complexity}</div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Business" : "Negócio"}</label>
              <Input className="mt-2" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={isEn ? "Example: VoltPay" : "Ex: VoltPay"} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Niche" : "Nicho"}</label>
              <Input className="mt-2" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder={isEn ? "Example: local clinic" : "Ex: clínica local"} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Offer" : "Oferta"}</label>
              <Input className="mt-2" value={primaryOffer} onChange={(e) => setPrimaryOffer(e.target.value)} placeholder={isEn ? "Example: free diagnosis" : "Ex: diagnóstico grátis"} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Goal" : "Objetivo"}</label>
              <Input className="mt-2" value={primaryGoal} onChange={(e) => setPrimaryGoal(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-muted-foreground">{isEn ? "Domain (optional)" : "Domínio (opcional)"}</label>
              <Input className="mt-2" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder={isEn ? "example.com" : "exemplo.com"} />
            </div>
          </div>

          <Tabs defaultValue="copy" className="mt-6">
            <TabsList className="w-full flex flex-wrap">
              <TabsTrigger value="copy" className="gap-2"><Sparkles className="w-4 h-4" />{isEn ? "Copy" : "Copy"}</TabsTrigger>
              <TabsTrigger value="seo" className="gap-2"><Search className="w-4 h-4" />{isEn ? "SEO" : "SEO"}</TabsTrigger>
              <TabsTrigger value="tracking" className="gap-2"><MousePointerClick className="w-4 h-4" />{isEn ? "Tracking" : "Tracking"}</TabsTrigger>
              <TabsTrigger value="estimate" className="gap-2"><Calculator className="w-4 h-4" />{isEn ? "Estimate" : "Estimativa"}</TabsTrigger>
            </TabsList>

            <TabsContent value="copy" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Hero" : "Hero"}</p>
                  <Textarea className="mt-4 min-h-[220px]" readOnly value={`${copyPack.headline}\n\n${copyPack.sub}\n\n${copyPack.bullets.map((b) => `- ${b}`).join("\n")}`} />
                  <Button variant="outline" className="mt-3 gap-2" onClick={() => copyToClipboard(`${copyPack.headline}\n\n${copyPack.sub}`)}>
                    <Clipboard className="w-4 h-4" />
                    {isEn ? "Copy" : "Copiar"}
                  </Button>
                </div>
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "CTA variants + outline" : "CTAs + outline"}</p>
                  <Textarea className="mt-4 min-h-[220px]" readOnly value={`${copyPack.ctas.map((c) => `- ${c}`).join("\n")}\n\n${copyPack.outline.map((o) => `- ${o}`).join("\n")}`} />
                  <Button variant="outline" className="mt-3 gap-2" onClick={() => copyToClipboard(copyPack.ctas.join("\n"))}>
                    <Clipboard className="w-4 h-4" />
                    {isEn ? "Copy CTAs" : "Copiar CTAs"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Meta" : "Meta"}</p>
                  <Textarea className="mt-4 min-h-[220px]" readOnly value={`Title: ${seoPack.metaTitle}\n\nDescription: ${seoPack.metaDescription}\n\nSlugs:\n${seoPack.slugIdeas.join("\n")}`} />
                  <Button variant="outline" className="mt-3 gap-2" onClick={() => copyToClipboard(`${seoPack.metaTitle}\n${seoPack.metaDescription}`)}>
                    <Clipboard className="w-4 h-4" />
                    {isEn ? "Copy meta" : "Copiar meta"}
                  </Button>
                </div>
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Schema snippet" : "Snippet de schema"}</p>
                  <Textarea className="mt-4 min-h-[220px]" readOnly value={seoPack.schemaSnippet} />
                  <Button variant="outline" className="mt-3 gap-2" onClick={() => copyToClipboard(seoPack.schemaSnippet)}>
                    <Clipboard className="w-4 h-4" />
                    {isEn ? "Copy schema" : "Copiar schema"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tracking" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Events" : "Eventos"}</p>
                  <Textarea className="mt-4 min-h-[220px]" readOnly value={trackingPlan.events.join("\n")} />
                  <Button variant="outline" className="mt-3 gap-2" onClick={() => copyToClipboard(trackingPlan.events.join("\n"))}>
                    <Clipboard className="w-4 h-4" />
                    {isEn ? "Copy events" : "Copiar eventos"}
                  </Button>
                </div>
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "UTM rules" : "Regras de UTM"}</p>
                  <Textarea className="mt-4 min-h-[220px]" readOnly value={trackingPlan.utmNotes.join("\n")} />
                  <Button variant="outline" className="mt-3 gap-2" onClick={() => copyToClipboard(trackingPlan.utmNotes.join("\n"))}>
                    <Clipboard className="w-4 h-4" />
                    {isEn ? "Copy rules" : "Copiar regras"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="estimate" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Inputs" : "Entradas"}</p>
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Pages" : "Páginas"}</label>
                      <Input type="number" min={1} value={String(pagesCount)} onChange={(e) => setPagesCount(Number(e.target.value) || 1)} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Languages" : "Idiomas"}</label>
                      <Input type="number" min={1} value={String(languagesCount)} onChange={(e) => setLanguagesCount(Number(e.target.value) || 1)} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Integrations" : "Integrações"}</label>
                      <Input type="number" min={0} value={String(integrationsCount)} onChange={(e) => setIntegrationsCount(Number(e.target.value) || 0)} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Traffic/month" : "Tráfego/mês"}</label>
                      <Input type="number" min={0} value={String(monthlyTraffic)} onChange={(e) => setMonthlyTraffic(Number(e.target.value) || 0)} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Conversion (0-1)" : "Conversão (0-1)"}</label>
                      <Input type="number" step="0.01" min={0} max={1} value={String(conversionRate)} onChange={(e) => setConversionRate(Number(e.target.value) || 0)} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Lead value (R$)" : "Valor do lead (R$)"}</label>
                      <Input type="number" min={0} value={String(leadValue)} onChange={(e) => setLeadValue(Number(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Result" : "Resultado"}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-background/60 p-4">
                      <p className="text-xs text-muted-foreground">{isEn ? "Weeks" : "Semanas"}</p>
                      <p className="text-2xl font-bold mt-1">{estimate.weeks}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/60 p-4">
                      <p className="text-xs text-muted-foreground">{isEn ? "Leads/mo" : "Leads/mês"}</p>
                      <p className="text-2xl font-bold mt-1">{estimate.leads}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/60 p-4 col-span-2">
                      <p className="text-xs text-muted-foreground">{isEn ? "Revenue/mo" : "Receita/mês"}</p>
                      <p className="text-2xl font-bold mt-1">R$ {estimate.revenue}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    {isEn
                      ? "Estimate for decision-making only. We'll validate in the diagnosis call."
                      : "Estimativa para decisão. Validamos no diagnóstico."}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="rounded-2xl border border-border bg-background/60 p-5">
          <p className="font-semibold">{isEn ? "Send me the report" : "Me envia o relatório"}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {isEn
              ? "Enter your email to save this blueprint + next steps."
              : "Informe seu email para salvar este blueprint + próximos passos."}
          </p>

          <div className="mt-4 grid gap-3">
            <Input type="email" autoComplete="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder={isEn ? "you@company.com" : "voce@empresa.com"} />
            <Button onClick={sendLead} disabled={!leadEmail || sending} className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
              {sending ? (isEn ? "Sending..." : "Enviando...") : (isEn ? "Save + send" : "Salvar + enviar")}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(report)}>
              <Clipboard className="w-4 h-4" />
              {isEn ? "Copy report" : "Copiar relatório"}
            </Button>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-background/50 p-4">
            <p className="text-sm font-medium">{isEn ? "Preview" : "Prévia"}</p>
            <Textarea value={report} readOnly className="mt-3 min-h-[220px]" />
          </div>
        </div>
      </div>
    </Card>
  );
}
