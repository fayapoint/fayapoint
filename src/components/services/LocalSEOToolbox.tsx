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
import {
  Clipboard,
  FileText,
  Sparkles,
  Star,
  MapPin,
  Search,
  MessageSquareText,
  DollarSign,
} from "lucide-react";

type Locale = "pt-BR" | "en" | string;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function makeScore(params: {
  hasGbp: boolean;
  reviewsCount: number;
  rating: number;
  hasPhotos: boolean;
  hasWebsite: boolean;
  hasServicePages: boolean;
  respondsReviews: boolean;
}) {
  const { hasGbp, reviewsCount, rating, hasPhotos, hasWebsite, hasServicePages, respondsReviews } = params;

  let score = 0;
  score += hasGbp ? 18 : 0;
  score += clamp(Math.round((reviewsCount / 50) * 18), 0, 18);
  score += clamp(Math.round(((rating - 3.5) / 1.5) * 16), 0, 16);
  score += hasPhotos ? 10 : 0;
  score += hasWebsite ? 12 : 0;
  score += hasServicePages ? 14 : 0;
  score += respondsReviews ? 12 : 0;

  score = clamp(score, 0, 100);

  const level =
    score >= 85 ? "A" :
    score >= 70 ? "B" :
    score >= 55 ? "C" :
    score >= 40 ? "D" : "E";

  return { score, level };
}

function formatChecklist(locale: Locale, items: Array<{ title: string; done: boolean; hint: string }>) {
  const header = locale === "en" ? "Local SEO Checklist" : "Checklist de SEO Local";
  const lines = items.map((i) => `${i.done ? "[x]" : "[ ]"} ${i.title} — ${i.hint}`);
  return [header, "", ...lines].join("\n");
}

export function LocalSEOToolbox({ locale }: { locale: Locale }) {
  const isEn = locale === "en";

  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [primaryService, setPrimaryService] = useState("");

  const [hasGbp, setHasGbp] = useState(true);
  const [reviewsCount, setReviewsCount] = useState(12);
  const [rating, setRating] = useState(4.6);
  const [hasPhotos, setHasPhotos] = useState(true);
  const [hasWebsite, setHasWebsite] = useState(true);
  const [hasServicePages, setHasServicePages] = useState(false);
  const [respondsReviews, setRespondsReviews] = useState(false);

  const [reviewContactName, setReviewContactName] = useState("");
  const [reviewChannel, setReviewChannel] = useState<"whatsapp" | "sms" | "email">("whatsapp");

  const [gbpOffer, setGbpOffer] = useState("");
  const [gbpCta, setGbpCta] = useState(isEn ? "Book now" : "Agendar" );

  const [keywordsService, setKeywordsService] = useState("");
  const [keywordsCity, setKeywordsCity] = useState("");
  const [keywordsNeighborhoods, setKeywordsNeighborhoods] = useState("");

  const [avgTicket, setAvgTicket] = useState(350);
  const [monthlySearches, setMonthlySearches] = useState(1200);
  const [ctr, setCtr] = useState(0.08);
  const [conversionRate, setConversionRate] = useState(0.12);
  const [closeRate, setCloseRate] = useState(0.35);

  const [leadEmail, setLeadEmail] = useState("");
  const [sending, setSending] = useState(false);

  const { score, level } = useMemo(
    () =>
      makeScore({
        hasGbp,
        reviewsCount,
        rating,
        hasPhotos,
        hasWebsite,
        hasServicePages,
        respondsReviews,
      }),
    [hasGbp, reviewsCount, rating, hasPhotos, hasWebsite, hasServicePages, respondsReviews]
  );

  const checklist = useMemo(() => {
    const items = [
      {
        title: isEn ? "Google Business Profile verified" : "Perfil do Google verificado",
        done: hasGbp,
        hint: isEn ? "Claim + verify" : "Reivindicar + verificar",
      },
      {
        title: isEn ? "50+ reviews target" : "Meta de 50+ avaliações",
        done: reviewsCount >= 50,
        hint: isEn ? "Automate review requests" : "Automatize pedidos de review",
      },
      {
        title: isEn ? "Rating 4.6+" : "Nota 4.6+",
        done: rating >= 4.6,
        hint: isEn ? "Fix service issues + respond" : "Melhore serviço + responda",
      },
      {
        title: isEn ? "Fresh photos every month" : "Fotos novas todo mês",
        done: hasPhotos,
        hint: isEn ? "Add team/work examples" : "Mostre equipe/antes-depois",
      },
      {
        title: isEn ? "Fast website with service pages" : "Site rápido com páginas de serviço",
        done: hasWebsite && hasServicePages,
        hint: isEn ? "Create location/service pages" : "Crie páginas por serviço/bairro",
      },
      {
        title: isEn ? "Respond to reviews" : "Responder avaliações",
        done: respondsReviews,
        hint: isEn ? "Reply within 48h" : "Responder em até 48h",
      },
    ];

    return formatChecklist(locale, items);
  }, [hasGbp, hasWebsite, hasServicePages, hasPhotos, isEn, locale, rating, respondsReviews, reviewsCount]);

  const reviewMessage = useMemo(() => {
    const bn = businessName || (isEn ? "our team" : "nossa equipe");
    const cn = reviewContactName ? ` ${reviewContactName}` : "";

    if (isEn) {
      if (reviewChannel === "email") {
        return `Subject: Quick favor? Your review helps a lot\n\nHi${cn},\n\nThank you for choosing ${bn}. If you have 30 seconds, could you leave us a Google review? It helps local customers find us.\n\nReply here and I'll send you the link — or just search for “${bn}” on Google Maps.\n\nThanks again!`;
      }

      return `Hi${cn}! Thanks for choosing ${bn}. If you have 30 seconds, could you leave us a Google review? It helps a lot.\n\nJust search “${bn}” on Google Maps and tap Reviews. Thank you!`;
    }

    if (reviewChannel === "email") {
      return `Assunto: Pode me ajudar com uma avaliação rápida?\n\nOi${cn},\n\nObrigado por escolher a ${bn}. Se você tiver 30 segundos, pode deixar uma avaliação no Google? Isso ajuda clientes da região a encontrarem a gente.\n\nSe preferir, responda esta mensagem que eu te mando o link — ou pesquise “${bn}” no Google Maps.\n\nMuito obrigado!`;
    }

    return `Oi${cn}! Obrigado por escolher a ${bn}. Se você tiver 30 segundos, pode deixar uma avaliação no Google? Ajuda muito.\n\nÉ só pesquisar “${bn}” no Google Maps e tocar em Avaliações. Valeu!`;
  }, [businessName, isEn, reviewChannel, reviewContactName]);

  const gbpPost = useMemo(() => {
    const bn = businessName || (isEn ? "your business" : "sua empresa");
    const s = primaryService || (isEn ? "our service" : "nosso serviço");
    const c = city || (isEn ? "your city" : "sua cidade");
    const offer = gbpOffer || (isEn ? "Limited slots this week" : "Vagas limitadas esta semana");
    const cta = gbpCta || (isEn ? "Book now" : "Agendar");

    if (isEn) {
      return `📍 ${c}\n\n✨ ${s} — ${offer}\n\nIf you’re searching for ${s} near you, ${bn} is ready to help.\n\n✅ Fast response\n✅ Trusted locally\n✅ Clear pricing\n\nCTA: ${cta}`;
    }

    return `📍 ${c}\n\n✨ ${s} — ${offer}\n\nSe você está buscando ${s} perto de você, a ${bn} pode te atender agora.\n\n✅ Resposta rápida\n✅ Confiança local\n✅ Preço claro\n\nCTA: ${cta}`;
  }, [businessName, city, gbpCta, gbpOffer, isEn, primaryService]);

  const keywordList = useMemo(() => {
    const service = (keywordsService || primaryService || "").trim();
    const c = (keywordsCity || city || "").trim();
    const neighborhoods = keywordsNeighborhoods
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);

    if (!service || !c) return "";

    const base = [
      `${service} em ${c}`,
      `${service} perto de mim`,
      `${service} ${c} preço`,
      `${service} ${c} urgente`,
      `${service} ${c} 24 horas`,
      `melhor ${service} em ${c}`,
      `${service} ${c} avaliação`,
    ];

    const byNeighborhood = neighborhoods.flatMap((n) => [
      `${service} ${n}`,
      `${service} em ${n}`,
      `melhor ${service} em ${n}`,
    ]);

    const all = [...base, ...byNeighborhood]
      .map((k) => k.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    return Array.from(new Set(all)).join("\n");
  }, [city, keywordsCity, keywordsNeighborhoods, keywordsService, primaryService]);

  const roi = useMemo(() => {
    const clicks = monthlySearches * ctr;
    const leads = clicks * conversionRate;
    const customers = leads * closeRate;
    const revenue = customers * avgTicket;
    return {
      clicks: Math.round(clicks),
      leads: Math.round(leads),
      customers: Math.round(customers),
      revenue: Math.round(revenue),
    };
  }, [avgTicket, closeRate, conversionRate, ctr, monthlySearches]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(isEn ? "Copied" : "Copiado");
    } catch {
      toast.error(isEn ? "Copy failed" : "Falha ao copiar");
    }
  };

  const buildReport = () => {
    const title = isEn ? "Local SEO Mini Audit" : "Mini Auditoria de SEO Local";

    const lines = [
      `${title}`,
      "",
      `${isEn ? "Business" : "Negócio"}: ${businessName || "-"}`,
      `${isEn ? "Service" : "Serviço"}: ${primaryService || "-"}`,
      `${isEn ? "City" : "Cidade"}: ${city || "-"}`,
      "",
      `${isEn ? "Score" : "Pontuação"}: ${score}/100 (${level})`,
      "",
      checklist,
      "",
      `${isEn ? "Review request message" : "Mensagem para pedir review"}:\n${reviewMessage}`,
      "",
      `${isEn ? "Google post draft" : "Rascunho de post no Google"}:\n${gbpPost}`,
      "",
      keywordList ? `${isEn ? "Keyword ideas" : "Ideias de palavras-chave"}:\n${keywordList}` : "",
      "",
      `${isEn ? "ROI estimate (per month)" : "Estimativa de ROI (por mês)"}:\n${isEn ? "Clicks" : "Cliques"}: ${roi.clicks}\n${isEn ? "Leads" : "Leads"}: ${roi.leads}\n${isEn ? "Customers" : "Clientes"}: ${roi.customers}\n${isEn ? "Revenue" : "Receita"}: R$ ${roi.revenue}`,
    ].filter(Boolean);

    return lines.join("\n");
  };

  const sendLead = async (details: string) => {
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
          source: "local-seo-toolbox",
          leadType: "toolbox",
          details,
          referrerUrl: typeof window !== "undefined" ? window.location.href : undefined,
          utm: getAttributionUtmPayload(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || (isEn ? "Failed" : "Falhou"));
      }

      toast.success(isEn ? "Sent! We'll reach out." : "Enviado! Vamos falar com você.");
    } catch (error) {
      const message = error instanceof Error ? error.message : (isEn ? "Failed" : "Falhou");
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const report = useMemo(() => buildReport(), [businessName, checklist, city, gbpPost, isEn, keywordList, level, primaryService, reviewMessage, score]);

  return (
    <Card className="border-border bg-card/60 backdrop-blur p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-2">
              <Sparkles className="w-4 h-4" />
              {isEn ? "Local SEO Toolbox" : "Local SEO Toolbox"}
            </Badge>
            <Badge variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              {isEn ? "Free tools" : "Ferramentas grátis"}
            </Badge>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mt-3">
            {isEn ? "Instant audit + generators" : "Auditoria instantânea + geradores"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isEn
              ? "Generate copy, keywords and a mini audit report in under 2 minutes."
              : "Gere copy, palavras-chave e um mini relatório em menos de 2 minutos."}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 px-5 py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">{isEn ? "Mini score" : "Mini score"}</span>
          </div>
          <div className="mt-1 text-3xl font-bold">
            {score}/100 <span className="text-base font-semibold text-muted-foreground">({level})</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Business" : "Negócio"}</label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={isEn ? "Example: Faya Clinic" : "Ex: Clínica Faya"} className="mt-2" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "City" : "Cidade"}</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={isEn ? "Example: Rio de Janeiro" : "Ex: Rio de Janeiro"} className="mt-2" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Service" : "Serviço"}</label>
              <Input value={primaryService} onChange={(e) => setPrimaryService(e.target.value)} placeholder={isEn ? "Example: Dental" : "Ex: Dentista"} className="mt-2" />
            </div>
          </div>

          <Tabs defaultValue="audit" className="mt-2">
            <TabsList className="w-full flex flex-wrap">
              <TabsTrigger value="audit" className="gap-2"><MapPin className="w-4 h-4" />{isEn ? "Audit" : "Auditoria"}</TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2"><MessageSquareText className="w-4 h-4" />{isEn ? "Reviews" : "Reviews"}</TabsTrigger>
              <TabsTrigger value="post" className="gap-2"><Search className="w-4 h-4" />{isEn ? "Google Post" : "Post Google"}</TabsTrigger>
              <TabsTrigger value="keywords" className="gap-2"><Search className="w-4 h-4" />{isEn ? "Keywords" : "Keywords"}</TabsTrigger>
              <TabsTrigger value="roi" className="gap-2"><DollarSign className="w-4 h-4" />{isEn ? "ROI" : "ROI"}</TabsTrigger>
            </TabsList>

            <TabsContent value="audit" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Signals" : "Sinais"}</p>
                  <div className="mt-4 grid gap-3">
                    <label className="flex items-center justify-between gap-4 text-sm">
                      <span>{isEn ? "Google Business Profile" : "Google Business Profile"}</span>
                      <input type="checkbox" checked={hasGbp} onChange={(e) => setHasGbp(e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-4 text-sm">
                      <span>{isEn ? "Photos updated" : "Fotos atualizadas"}</span>
                      <input type="checkbox" checked={hasPhotos} onChange={(e) => setHasPhotos(e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-4 text-sm">
                      <span>{isEn ? "Website" : "Site"}</span>
                      <input type="checkbox" checked={hasWebsite} onChange={(e) => setHasWebsite(e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-4 text-sm">
                      <span>{isEn ? "Service/location pages" : "Páginas de serviço/bairro"}</span>
                      <input type="checkbox" checked={hasServicePages} onChange={(e) => setHasServicePages(e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-4 text-sm">
                      <span>{isEn ? "Responds to reviews" : "Responde avaliações"}</span>
                      <input type="checkbox" checked={respondsReviews} onChange={(e) => setRespondsReviews(e.target.checked)} />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Ratings" : "Avaliações"}</p>
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Reviews count" : "Qtd. reviews"}</label>
                      <Input
                        type="number"
                        value={Number.isFinite(reviewsCount) ? String(reviewsCount) : ""}
                        onChange={(e) => setReviewsCount(Number(e.target.value) || 0)}
                        min={0}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Average rating" : "Nota média"}</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={Number.isFinite(rating) ? String(rating) : ""}
                        onChange={(e) => setRating(Number(e.target.value) || 0)}
                        min={0}
                        max={5}
                      />
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(checklist)}>
                        <Clipboard className="w-4 h-4" />
                        {isEn ? "Copy checklist" : "Copiar checklist"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Review request generator" : "Gerador de pedido de review"}</p>
                  <div className="mt-4 grid gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground">{isEn ? "Customer name (optional)" : "Nome do cliente (opcional)"}</label>
                      <Input value={reviewContactName} onChange={(e) => setReviewContactName(e.target.value)} className="mt-2" />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant={reviewChannel === "whatsapp" ? "default" : "outline"} onClick={() => setReviewChannel("whatsapp")}>WhatsApp</Button>
                      <Button type="button" variant={reviewChannel === "sms" ? "default" : "outline"} onClick={() => setReviewChannel("sms")}>SMS</Button>
                      <Button type="button" variant={reviewChannel === "email" ? "default" : "outline"} onClick={() => setReviewChannel("email")}>Email</Button>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(reviewMessage)}>
                      <Clipboard className="w-4 h-4" />
                      {isEn ? "Copy message" : "Copiar mensagem"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Message preview" : "Prévia"}</p>
                  <Textarea value={reviewMessage} readOnly className="mt-4 min-h-[220px]" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="post" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Google Business Post generator" : "Gerador de Post no Google"}</p>
                  <div className="mt-4 grid gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground">{isEn ? "Offer" : "Oferta"}</label>
                      <Input value={gbpOffer} onChange={(e) => setGbpOffer(e.target.value)} className="mt-2" placeholder={isEn ? "Example: Free diagnosis" : "Ex: Diagnóstico grátis"} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">{isEn ? "CTA" : "CTA"}</label>
                      <Input value={gbpCta} onChange={(e) => setGbpCta(e.target.value)} className="mt-2" />
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(gbpPost)}>
                      <Clipboard className="w-4 h-4" />
                      {isEn ? "Copy post" : "Copiar post"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Draft" : "Rascunho"}</p>
                  <Textarea value={gbpPost} readOnly className="mt-4 min-h-[220px]" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="keywords" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Keyword ideas generator" : "Gerador de palavras-chave"}</p>
                  <div className="mt-4 grid gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground">{isEn ? "Service" : "Serviço"}</label>
                      <Input value={keywordsService} onChange={(e) => setKeywordsService(e.target.value)} className="mt-2" placeholder={isEn ? "Example: plumber" : "Ex: encanador"} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">{isEn ? "City" : "Cidade"}</label>
                      <Input value={keywordsCity} onChange={(e) => setKeywordsCity(e.target.value)} className="mt-2" placeholder={isEn ? "Example: São Paulo" : "Ex: São Paulo"} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">{isEn ? "Neighborhoods (one per line)" : "Bairros (um por linha)"}</label>
                      <Textarea value={keywordsNeighborhoods} onChange={(e) => setKeywordsNeighborhoods(e.target.value)} className="mt-2 min-h-[90px]" placeholder={isEn ? "Copacabana\nIpanema" : "Copacabana\nIpanema"} />
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => (keywordList ? copyToClipboard(keywordList) : toast.error(isEn ? "Fill service + city" : "Preencha serviço + cidade"))}>
                      <Clipboard className="w-4 h-4" />
                      {isEn ? "Copy keywords" : "Copiar keywords"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Keywords" : "Keywords"}</p>
                  <Textarea value={keywordList} readOnly className="mt-4 min-h-[280px]" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="roi" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "ROI Estimator" : "Estimador de ROI"}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isEn
                      ? "Quick model to estimate extra revenue from improved local rankings. Adjust inputs to your reality."
                      : "Modelo rápido para estimar receita extra com melhor posicionamento local. Ajuste para sua realidade."}
                  </p>
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Monthly local searches" : "Buscas locais/mês"}</label>
                      <Input type="number" min={0} value={String(monthlySearches)} onChange={(e) => setMonthlySearches(Number(e.target.value) || 0)} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "CTR (0-1)" : "CTR (0-1)"}</label>
                      <Input type="number" step="0.01" min={0} max={1} value={String(ctr)} onChange={(e) => setCtr(Number(e.target.value) || 0)} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Lead conversion (0-1)" : "Conversão em lead (0-1)"}</label>
                      <Input type="number" step="0.01" min={0} max={1} value={String(conversionRate)} onChange={(e) => setConversionRate(Number(e.target.value) || 0)} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Close rate (0-1)" : "Taxa de fechamento (0-1)"}</label>
                      <Input type="number" step="0.01" min={0} max={1} value={String(closeRate)} onChange={(e) => setCloseRate(Number(e.target.value) || 0)} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Average ticket (R$)" : "Ticket médio (R$)"}</label>
                      <Input type="number" step="10" min={0} value={String(avgTicket)} onChange={(e) => setAvgTicket(Number(e.target.value) || 0)} />
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(`${roi.clicks} clicks\n${roi.leads} leads\n${roi.customers} customers\nR$ ${roi.revenue}`)}>
                      <Clipboard className="w-4 h-4" />
                      {isEn ? "Copy estimate" : "Copiar estimativa"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Result" : "Resultado"}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-background/60 p-4">
                      <p className="text-xs text-muted-foreground">{isEn ? "Clicks" : "Cliques"}</p>
                      <p className="text-2xl font-bold mt-1">{roi.clicks}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/60 p-4">
                      <p className="text-xs text-muted-foreground">{isEn ? "Leads" : "Leads"}</p>
                      <p className="text-2xl font-bold mt-1">{roi.leads}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/60 p-4">
                      <p className="text-xs text-muted-foreground">{isEn ? "Customers" : "Clientes"}</p>
                      <p className="text-2xl font-bold mt-1">{roi.customers}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/60 p-4">
                      <p className="text-xs text-muted-foreground">{isEn ? "Revenue" : "Receita"}</p>
                      <p className="text-2xl font-bold mt-1">R$ {roi.revenue}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    {isEn
                      ? "This is an estimate. Use it to decide priority and next actions."
                      : "Isso é uma estimativa. Use para decidir prioridade e próximos passos."}
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
              ? "Enter your email to save the audit + we can follow up with the exact next steps."
              : "Informe seu email para salvar a auditoria + seguimos com os próximos passos exatos."}
          </p>

          <div className="mt-4 grid gap-3">
            <Input
              type="email"
              autoComplete="email"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              placeholder={isEn ? "you@company.com" : "voce@empresa.com"}
            />

            <Button
              onClick={() => sendLead(report)}
              disabled={!leadEmail || sending}
              className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600"
            >
              {sending ? (isEn ? "Sending..." : "Enviando...") : (isEn ? "Save + send" : "Salvar + enviar")}
            </Button>

            <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(report)}>
              <Clipboard className="w-4 h-4" />
              {isEn ? "Copy full report" : "Copiar relatório"}
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
