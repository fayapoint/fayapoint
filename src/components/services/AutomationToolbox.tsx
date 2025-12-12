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
import { Clipboard, FileText, Sparkles, Workflow, DollarSign, ShieldCheck, FileCode2 } from "lucide-react";

type Locale = "pt-BR" | "en" | string;

function moneyBR(n: number) {
  return `R$ ${Math.round(n)}`;
}

export function AutomationToolbox({ locale }: { locale: Locale }) {
  const isEn = locale === "en";

  const [processName, setProcessName] = useState(isEn ? "Lead routing" : "Roteamento de leads");
  const [trigger, setTrigger] = useState(isEn ? "New form submission" : "Novo envio de formulário");
  const [systems, setSystems] = useState("HubSpot\nSlack\nGoogle Sheets");

  const [hoursSavedPerWeek, setHoursSavedPerWeek] = useState(6);
  const [hourlyCost, setHourlyCost] = useState(80);
  const [errorRate, setErrorRate] = useState(0.12);

  const [eventsPerDay, setEventsPerDay] = useState(80);
  const [slaMinutes, setSlaMinutes] = useState(15);

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

  const roi = useMemo(() => {
    const monthlyHours = hoursSavedPerWeek * 4.33;
    const monthlySavings = monthlyHours * hourlyCost;
    const errorSavings = monthlySavings * errorRate;
    return {
      monthlyHours: Math.round(monthlyHours),
      monthlySavings: Math.round(monthlySavings),
      errorSavings: Math.round(errorSavings),
      total: Math.round(monthlySavings + errorSavings),
    };
  }, [errorRate, hourlyCost, hoursSavedPerWeek]);

  const blueprint = useMemo(() => {
    const sys = systems
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const title = isEn ? "Automation Blueprint" : "Blueprint de Automação";

    const steps = [
      isEn ? `Trigger: ${trigger}` : `Gatilho: ${trigger}`,
      isEn ? "Normalize + validate payload" : "Normalizar + validar payload",
      isEn ? "Enrich data (UTMs, geo, dedupe)" : "Enriquecer dados (UTMs, geo, dedupe)",
      isEn ? "Route to owner (rules + fallback)" : "Roteamento (regras + fallback)",
      isEn ? "Notify (Slack/Email/WhatsApp)" : "Notificações (Slack/Email/WhatsApp)",
      isEn ? "Write to CRM + Sheet" : "Gravar em CRM + Planilha",
      isEn ? "Create tasks + follow-up sequence" : "Criar tarefas + sequência de follow-up",
      isEn ? "Monitoring (SLO, logs, alerts)" : "Monitoramento (SLO, logs, alertas)",
    ];

    const stack = [
      "n8n / Make / Zapier",
      "Webhooks + REST",
      "Queue + retries",
      "Idempotency keys",
      "Audit logs",
    ];

    return {
      title,
      sys,
      steps,
      stack,
    };
  }, [isEn, systems, trigger]);

  const spec = useMemo(() => {
    const sys = systems
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const json = {
      process: processName,
      trigger,
      volume: {
        eventsPerDay,
        slaMinutes,
      },
      systems: sys,
      requirements: {
        idempotency: true,
        retries: true,
        alerts: true,
        piiHandling: true,
      },
    };

    return JSON.stringify(json, null, 2);
  }, [eventsPerDay, processName, slaMinutes, systems, trigger]);

  const checklist = useMemo(() => {
    const lines = [
      isEn ? "[ ] Define success metric (time saved, SLA)" : "[ ] Definir métrica (tempo, SLA)",
      isEn ? "[ ] Map all data sources + owners" : "[ ] Mapear fontes + responsáveis",
      isEn ? "[ ] Add dedupe + idempotency" : "[ ] Dedupe + idempotência",
      isEn ? "[ ] Add retries + dead-letter" : "[ ] Retentativas + dead-letter",
      isEn ? "[ ] Log every step" : "[ ] Logar cada etapa",
      isEn ? "[ ] Alerts for failures + latency" : "[ ] Alertas de falha + latência",
      isEn ? "[ ] Security review (PII, tokens)" : "[ ] Revisão de segurança (PII, tokens)",
    ];

    return lines.join("\n");
  }, [isEn]);

  const report = useMemo(() => {
    const header = isEn ? "Automation Diagnosis" : "Diagnóstico de Automação";
    const lines = [
      header,
      "",
      `${isEn ? "Process" : "Processo"}: ${processName}`,
      `${isEn ? "Trigger" : "Gatilho"}: ${trigger}`,
      "",
      `${isEn ? "ROI (month)" : "ROI (mês)"}:\n${isEn ? "Hours" : "Horas"}: ${roi.monthlyHours}\n${isEn ? "Savings" : "Economia"}: ${moneyBR(roi.monthlySavings)}\n${isEn ? "Error savings" : "Economia por erros"}: ${moneyBR(roi.errorSavings)}\n${isEn ? "Total" : "Total"}: ${moneyBR(roi.total)}`,
      "",
      `${blueprint.title}:\n${blueprint.steps.map((s) => `- ${s}`).join("\n")}`,
      "",
      `Spec:\n${spec}`,
    ];

    return lines.join("\n");
  }, [blueprint, isEn, processName, roi, spec, trigger]);

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
          source: "automation-toolbox",
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
              {isEn ? "Automation Toolbox" : "Automation Toolbox"}
            </Badge>
            <Badge variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              {isEn ? "Blueprint + ROI" : "Blueprint + ROI"}
            </Badge>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mt-3">
            {isEn ? "Scope, ROI and spec" : "Escopo, ROI e spec"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isEn
              ? "Generate an automation blueprint, ROI model and a spec to align your team fast."
              : "Gere blueprint, modelo de ROI e uma spec para alinhar o time rápido."}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 px-5 py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">{isEn ? "ROI/mo" : "ROI/mês"}</span>
          </div>
          <div className="mt-1 text-3xl font-bold">{moneyBR(roi.total)}</div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Process" : "Processo"}</label>
              <Input className="mt-2" value={processName} onChange={(e) => setProcessName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Trigger" : "Gatilho"}</label>
              <Input className="mt-2" value={trigger} onChange={(e) => setTrigger(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-muted-foreground">{isEn ? "Systems (one per line)" : "Sistemas (um por linha)"}</label>
              <Textarea className="mt-2 min-h-[90px]" value={systems} onChange={(e) => setSystems(e.target.value)} />
            </div>
          </div>

          <Tabs defaultValue="roi" className="mt-6">
            <TabsList className="w-full flex flex-wrap">
              <TabsTrigger value="roi" className="gap-2"><DollarSign className="w-4 h-4" />{isEn ? "ROI" : "ROI"}</TabsTrigger>
              <TabsTrigger value="blueprint" className="gap-2"><Workflow className="w-4 h-4" />{isEn ? "Blueprint" : "Blueprint"}</TabsTrigger>
              <TabsTrigger value="spec" className="gap-2"><FileCode2 className="w-4 h-4" />{isEn ? "Spec" : "Spec"}</TabsTrigger>
              <TabsTrigger value="checklist" className="gap-2"><ShieldCheck className="w-4 h-4" />{isEn ? "Checklist" : "Checklist"}</TabsTrigger>
            </TabsList>

            <TabsContent value="roi" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Inputs" : "Entradas"}</p>
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Hours saved / week" : "Horas salvas / semana"}</label>
                      <Input type="number" min={0} value={String(hoursSavedPerWeek)} onChange={(e) => setHoursSavedPerWeek(Number(e.target.value) || 0)} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Hourly cost (R$)" : "Custo hora (R$)"}</label>
                      <Input type="number" min={0} value={String(hourlyCost)} onChange={(e) => setHourlyCost(Number(e.target.value) || 0)} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Error rate (0-1)" : "Taxa de erro (0-1)"}</label>
                      <Input type="number" step="0.01" min={0} max={1} value={String(errorRate)} onChange={(e) => setErrorRate(Number(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Result" : "Resultado"}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-background/60 p-4">
                      <p className="text-xs text-muted-foreground">{isEn ? "Hours/mo" : "Horas/mês"}</p>
                      <p className="text-2xl font-bold mt-1">{roi.monthlyHours}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/60 p-4">
                      <p className="text-xs text-muted-foreground">{isEn ? "Savings" : "Economia"}</p>
                      <p className="text-2xl font-bold mt-1">{moneyBR(roi.monthlySavings)}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/60 p-4 col-span-2">
                      <p className="text-xs text-muted-foreground">{isEn ? "Total" : "Total"}</p>
                      <p className="text-2xl font-bold mt-1">{moneyBR(roi.total)}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-4 gap-2" onClick={() => copyToClipboard(`${roi.monthlyHours}h/mo\n${moneyBR(roi.total)}`)}>
                    <Clipboard className="w-4 h-4" />
                    {isEn ? "Copy" : "Copiar"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="blueprint" className="mt-4">
              <div className="rounded-2xl border border-border bg-background/50 p-5">
                <p className="font-semibold">{blueprint.title}</p>
                <Textarea className="mt-4 min-h-[220px]" readOnly value={blueprint.steps.map((s) => `- ${s}`).join("\n")} />
                <Button variant="outline" className="mt-3 gap-2" onClick={() => copyToClipboard(blueprint.steps.join("\n"))}>
                  <Clipboard className="w-4 h-4" />
                  {isEn ? "Copy blueprint" : "Copiar blueprint"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="spec" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Volume" : "Volume"}</p>
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Events/day" : "Eventos/dia"}</label>
                      <Input type="number" min={0} value={String(eventsPerDay)} onChange={(e) => setEventsPerDay(Number(e.target.value) || 0)} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "SLA (minutes)" : "SLA (minutos)"}</label>
                      <Input type="number" min={1} value={String(slaMinutes)} onChange={(e) => setSlaMinutes(Number(e.target.value) || 1)} />
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(spec)}>
                      <Clipboard className="w-4 h-4" />
                      {isEn ? "Copy spec" : "Copiar spec"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">Spec JSON</p>
                  <Textarea className="mt-4 min-h-[220px]" readOnly value={spec} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="checklist" className="mt-4">
              <div className="rounded-2xl border border-border bg-background/50 p-5">
                <p className="font-semibold">{isEn ? "Production checklist" : "Checklist de produção"}</p>
                <Textarea className="mt-4 min-h-[220px]" readOnly value={checklist} />
                <Button variant="outline" className="mt-3 gap-2" onClick={() => copyToClipboard(checklist)}>
                  <Clipboard className="w-4 h-4" />
                  {isEn ? "Copy checklist" : "Copiar checklist"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="rounded-2xl border border-border bg-background/60 p-5">
          <p className="font-semibold">{isEn ? "Send me the report" : "Me envia o relatório"}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {isEn
              ? "Enter your email to save the blueprint + next steps."
              : "Informe seu email para salvar o blueprint + próximos passos."}
          </p>

          <div className="mt-4 grid gap-3">
            <Input type="email" autoComplete="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder={isEn ? "you@company.com" : "voce@empresa.com"} />
            <Button onClick={sendLead} disabled={!leadEmail || sending} className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600">
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
