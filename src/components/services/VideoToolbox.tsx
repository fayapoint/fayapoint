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
import { Clipboard, FileText, Sparkles, CalendarDays, Lightbulb, FileVideo2, Repeat } from "lucide-react";

type Locale = "pt-BR" | "en" | string;

function parseLines(v: string) {
  return v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function VideoToolbox({ locale }: { locale: Locale }) {
  const isEn = locale === "en";

  const [brand, setBrand] = useState("");
  const [niche, setNiche] = useState("");
  const [goal, setGoal] = useState(isEn ? "Generate demand" : "Gerar demanda");
  const [platforms, setPlatforms] = useState(isEn ? "Instagram\nTikTok\nYouTube" : "Instagram\nTikTok\nYouTube");

  const [pillars, setPillars] = useState(
    isEn
      ? "Behind the scenes\nTutorials\nCase studies\nMyth busting"
      : "Bastidores\nTutoriais\nCases\nQuebra de mitos"
  );

  const [postsPerWeek, setPostsPerWeek] = useState(5);

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

  const hookIdeas = useMemo(() => {
    const b = brand || (isEn ? "your brand" : "sua marca");
    const n = niche || (isEn ? "your niche" : "seu nicho");
    const p = parseLines(pillars);
    const base = p.length ? p : [isEn ? "Tutorials" : "Tutoriais"]; 

    const hooks = base.flatMap((pillar) => [
      isEn ? `Stop doing this in ${n} (we fixed it at ${b})` : `Pare de fazer isso em ${n} (a ${b} resolveu)` ,
      isEn ? `3 mistakes people make in ${pillar.toLowerCase()}` : `3 erros que as pessoas cometem em ${pillar.toLowerCase()}`,
      isEn ? `The fastest way to get results with ${pillar.toLowerCase()}` : `O jeito mais rápido de ter resultado com ${pillar.toLowerCase()}`,
    ]);

    return Array.from(new Set(hooks)).slice(0, 18);
  }, [brand, isEn, niche, pillars]);

  const calendar = useMemo(() => {
    const p = parseLines(pillars);
    const pl = parseLines(platforms);
    const days = isEn
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

    const picks = (i: number) => p[i % Math.max(1, p.length)] || (isEn ? "Content" : "Conteúdo");
    const platform = pl[0] || "Instagram";

    const entries = days.slice(0, Math.min(postsPerWeek, 7)).map((d, i) => {
      const pillar = picks(i);
      const hook = hookIdeas[i] || "";
      return `${d} — ${pillar} — ${platform} — ${hook}`;
    });

    return {
      entries,
      platform,
    };
  }, [hookIdeas, isEn, pillars, platforms, postsPerWeek]);

  const brief = useMemo(() => {
    const b = brand || (isEn ? "Brand" : "Marca");
    const n = niche || (isEn ? "Niche" : "Nicho");

    const lines = [
      isEn ? `Video Brief — ${b}` : `Brief de Vídeo — ${b}`,
      "",
      `${isEn ? "Niche" : "Nicho"}: ${n}`,
      `${isEn ? "Goal" : "Objetivo"}: ${goal}`,
      "",
      isEn ? "Hook:" : "Hook:",
      isEn ? "- 1 sentence that stops the scroll" : "- 1 frase que interrompe o scroll",
      "",
      isEn ? "Structure:" : "Estrutura:",
      isEn ? "1) Hook (0-2s)" : "1) Hook (0-2s)",
      isEn ? "2) Context (2-6s)" : "2) Contexto (2-6s)",
      isEn ? "3) Value (6-30s)" : "3) Valor (6-30s)",
      isEn ? "4) CTA (last 3s)" : "4) CTA (últimos 3s)",
      "",
      isEn ? "Shots:" : "Cenas:",
      isEn ? "- A-roll + B-roll + on-screen text" : "- A-roll + B-roll + texto na tela",
      "",
      isEn ? "Publishing:" : "Publicação:",
      isEn ? "- Title + caption + hashtags" : "- Título + legenda + hashtags",
    ];

    return lines.join("\n");
  }, [brand, goal, isEn, niche]);

  const repurpose = useMemo(() => {
    const pl = parseLines(platforms);
    const base = pl.length ? pl : ["Instagram"];

    const lines = base.flatMap((p) => [
      isEn ? `${p}: 1 long → 3 shorts → 5 clips` : `${p}: 1 longo → 3 shorts → 5 cortes`,
      isEn ? `${p}: clip → carousel (key points)` : `${p}: corte → carrossel (pontos-chave)`,
    ]);

    return lines.join("\n");
  }, [isEn, platforms]);

  const report = useMemo(() => {
    const header = isEn ? "Video Content Plan" : "Plano de Conteúdo em Vídeo";

    const lines = [
      header,
      "",
      `${isEn ? "Brand" : "Marca"}: ${brand || "-"}`,
      `${isEn ? "Niche" : "Nicho"}: ${niche || "-"}`,
      `${isEn ? "Goal" : "Objetivo"}: ${goal}`,
      "",
      `${isEn ? "Calendar" : "Calendário"}:\n${calendar.entries.join("\n")}`,
      "",
      `${isEn ? "Hook ideas" : "Ideias de hooks"}:\n${hookIdeas.map((h) => `- ${h}`).join("\n")}`,
      "",
      `${isEn ? "Brief template" : "Template de brief"}:\n${brief}`,
      "",
      `${isEn ? "Repurpose matrix" : "Matriz de reaproveitamento"}:\n${repurpose}`,
    ];

    return lines.join("\n");
  }, [brand, brief, calendar.entries, goal, hookIdeas, isEn, niche, repurpose]);

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
          source: "video-toolbox",
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
              {isEn ? "Video Toolbox" : "Video Toolbox"}
            </Badge>
            <Badge variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              {isEn ? "Calendar + hooks" : "Calendário + hooks"}
            </Badge>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mt-3">
            {isEn ? "Plan content like a studio" : "Planeje como um estúdio"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isEn
              ? "Generate a calendar, hook ideas and a repurposing system."
              : "Gere calendário, hooks e um sistema de reaproveitamento."}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 px-5 py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm">{isEn ? "Posts/week" : "Posts/sem"}</span>
          </div>
          <div className="mt-1 text-3xl font-bold">{postsPerWeek}</div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Brand" : "Marca"}</label>
              <Input className="mt-2" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={isEn ? "Example: VoltPay" : "Ex: VoltPay"} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Niche" : "Nicho"}</label>
              <Input className="mt-2" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder={isEn ? "Example: fintech" : "Ex: fintech"} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Goal" : "Objetivo"}</label>
              <Input className="mt-2" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Posts/week" : "Posts/sem"}</label>
              <Input type="number" min={1} max={7} className="mt-2" value={String(postsPerWeek)} onChange={(e) => setPostsPerWeek(Number(e.target.value) || 1)} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-muted-foreground">{isEn ? "Content pillars (one per line)" : "Pilares (um por linha)"}</label>
              <Textarea className="mt-2 min-h-[90px]" value={pillars} onChange={(e) => setPillars(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-muted-foreground">{isEn ? "Platforms (one per line)" : "Plataformas (um por linha)"}</label>
              <Textarea className="mt-2 min-h-[80px]" value={platforms} onChange={(e) => setPlatforms(e.target.value)} />
            </div>
          </div>

          <Tabs defaultValue="calendar" className="mt-6">
            <TabsList className="w-full flex flex-wrap">
              <TabsTrigger value="calendar" className="gap-2"><CalendarDays className="w-4 h-4" />{isEn ? "Calendar" : "Calendário"}</TabsTrigger>
              <TabsTrigger value="hooks" className="gap-2"><Lightbulb className="w-4 h-4" />{isEn ? "Hooks" : "Hooks"}</TabsTrigger>
              <TabsTrigger value="brief" className="gap-2"><FileVideo2 className="w-4 h-4" />{isEn ? "Brief" : "Brief"}</TabsTrigger>
              <TabsTrigger value="repurpose" className="gap-2"><Repeat className="w-4 h-4" />{isEn ? "Repurpose" : "Reaproveitar"}</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-4">
              <div className="rounded-2xl border border-border bg-background/50 p-5">
                <p className="font-semibold">{isEn ? "Weekly plan" : "Plano semanal"}</p>
                <Textarea className="mt-4 min-h-[220px]" readOnly value={calendar.entries.join("\n")} />
                <Button variant="outline" className="mt-3 gap-2" onClick={() => copyToClipboard(calendar.entries.join("\n"))}>
                  <Clipboard className="w-4 h-4" />
                  {isEn ? "Copy" : "Copiar"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="hooks" className="mt-4">
              <div className="rounded-2xl border border-border bg-background/50 p-5">
                <p className="font-semibold">{isEn ? "Hook ideas" : "Ideias de hooks"}</p>
                <Textarea className="mt-4 min-h-[220px]" readOnly value={hookIdeas.map((h) => `- ${h}`).join("\n")} />
                <Button variant="outline" className="mt-3 gap-2" onClick={() => copyToClipboard(hookIdeas.join("\n"))}>
                  <Clipboard className="w-4 h-4" />
                  {isEn ? "Copy hooks" : "Copiar hooks"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="brief" className="mt-4">
              <div className="rounded-2xl border border-border bg-background/50 p-5">
                <p className="font-semibold">{isEn ? "Brief template" : "Template de brief"}</p>
                <Textarea className="mt-4 min-h-[240px]" readOnly value={brief} />
                <Button variant="outline" className="mt-3 gap-2" onClick={() => copyToClipboard(brief)}>
                  <Clipboard className="w-4 h-4" />
                  {isEn ? "Copy" : "Copiar"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="repurpose" className="mt-4">
              <div className="rounded-2xl border border-border bg-background/50 p-5">
                <p className="font-semibold">{isEn ? "Repurposing matrix" : "Matriz de reaproveitamento"}</p>
                <Textarea className="mt-4 min-h-[220px]" readOnly value={repurpose} />
                <Button variant="outline" className="mt-3 gap-2" onClick={() => copyToClipboard(repurpose)}>
                  <Clipboard className="w-4 h-4" />
                  {isEn ? "Copy" : "Copiar"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="rounded-2xl border border-border bg-background/60 p-5">
          <p className="font-semibold">{isEn ? "Send me the plan" : "Me envia o plano"}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {isEn
              ? "Enter your email to save this calendar + next steps."
              : "Informe seu email para salvar o calendário + próximos passos."}
          </p>

          <div className="mt-4 grid gap-3">
            <Input type="email" autoComplete="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder={isEn ? "you@company.com" : "voce@empresa.com"} />
            <Button onClick={async () => {
              setSending(true);
              try {
                const res = await fetch("/api/leads", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: leadEmail,
                    source: "video-toolbox",
                    leadType: "toolbox",
                    details: report,
                    referrerUrl: typeof window !== "undefined" ? window.location.href : undefined,
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
            }} disabled={!leadEmail || sending} className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
              {sending ? (isEn ? "Sending..." : "Enviando...") : (isEn ? "Save + send" : "Salvar + enviar")}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(report)}>
              <Clipboard className="w-4 h-4" />
              {isEn ? "Copy plan" : "Copiar plano"}
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
