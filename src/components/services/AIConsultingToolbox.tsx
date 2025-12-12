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
import { Clipboard, FileText, Sparkles, Brain, Shield, Bot, ListChecks, Target } from "lucide-react";

type Locale = "pt-BR" | "en" | string;

function parseLines(v: string) {
  return v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function AIConsultingToolbox({ locale }: { locale: Locale }) {
  const isEn = locale === "en";

  const [company, setCompany] = useState("");
  const [team, setTeam] = useState(isEn ? "Sales + Ops" : "Vendas + Ops");
  const [objective, setObjective] = useState(isEn ? "Increase revenue" : "Aumentar receita");
  const [useCases, setUseCases] = useState(
    isEn
      ? "Lead qualification\nSupport automation\nInternal knowledge base"
      : "Qualificação de leads\nAutomação de suporte\nBase de conhecimento interna"
  );

  const [dataSensitivity, setDataSensitivity] = useState(isEn ? "Medium" : "Média");
  const [effortWeeks, setEffortWeeks] = useState(6);

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

  const prioritization = useMemo(() => {
    const cases = parseLines(useCases);

    const rows = cases.map((c, idx) => {
      const impact = 5 - (idx % 3);
      const effort = 2 + (idx % 4);
      const risk = dataSensitivity.toLowerCase().includes("high") ? 4 : 2;
      const score = impact * 2 - effort - risk;
      return { c, impact, effort, risk, score };
    });

    rows.sort((a, b) => b.score - a.score);
    return rows;
  }, [dataSensitivity, useCases]);

  const policy = useMemo(() => {
    const name = company || (isEn ? "Company" : "Empresa");

    const lines = [
      isEn ? `AI Policy — ${name}` : `Política de IA — ${name}`,
      "",
      isEn ? "1) Allowed use" : "1) Uso permitido",
      isEn ? "- Assist with drafting, summarization, planning" : "- Apoio em rascunhos, resumo, planejamento",
      isEn ? "- Automations with human review for sensitive decisions" : "- Automações com revisão humana em decisões sensíveis",
      "",
      isEn ? "2) Restricted data" : "2) Dados restritos",
      isEn ? "- No secrets, passwords, tokens" : "- Sem segredos, senhas, tokens",
      isEn ? "- PII only with approved tools + logging" : "- PII apenas com ferramentas aprovadas + logs",
      "",
      isEn ? "3) Governance" : "3) Governança",
      isEn ? "- Owner per workflow" : "- Responsável por workflow",
      isEn ? "- Prompt/version control" : "- Controle de versão de prompts",
      isEn ? "- Monitoring + incident response" : "- Monitoramento + resposta a incidentes",
      "",
      isEn ? "4) Quality" : "4) Qualidade",
      isEn ? "- Evaluations before production" : "- Avaliações antes de produção",
      isEn ? "- Human-in-the-loop for edge cases" : "- Humano no loop para casos limite",
    ];

    return lines.join("\n");
  }, [company, isEn]);

  const agentSpec = useMemo(() => {
    const name = company || (isEn ? "Company" : "Empresa");
    const cases = parseLines(useCases);
    const primary = cases[0] ?? (isEn ? "Lead qualification" : "Qualificação de leads");

    const json = {
      agentName: `${name} Assistant`,
      primaryUseCase: primary,
      audienceTeam: team,
      objective,
      tools: ["CRM", "Docs", "Ticketing", "Email"],
      guardrails: {
        pii: dataSensitivity,
        logging: true,
        humanReview: true,
      },
      eval: {
        offline: true,
        goldenSetSize: 50,
        metrics: ["accuracy", "latency", "hallucination_rate"],
      },
      rollout: {
        weeks: effortWeeks,
        phases: ["pilot", "shadow", "limited", "full"],
      },
    };

    return JSON.stringify(json, null, 2);
  }, [company, dataSensitivity, effortWeeks, isEn, objective, team, useCases]);

  const report = useMemo(() => {
    const header = isEn ? "AI Consulting Diagnosis" : "Diagnóstico de Consultoria em IA";
    const rows = prioritization
      .map((r) => `${r.c} | impact ${r.impact} | effort ${r.effort} | risk ${r.risk} | score ${r.score}`)
      .join("\n");

    const lines = [
      header,
      "",
      `${isEn ? "Company" : "Empresa"}: ${company || "-"}`,
      `${isEn ? "Team" : "Time"}: ${team}`,
      `${isEn ? "Objective" : "Objetivo"}: ${objective}`,
      `${isEn ? "Data sensitivity" : "Sensibilidade de dados"}: ${dataSensitivity}`,
      "",
      `${isEn ? "Prioritization" : "Priorização"}:\n${rows}`,
      "",
      `Policy:\n${policy}`,
      "",
      `Agent spec:\n${agentSpec}`,
    ];

    return lines.join("\n");
  }, [agentSpec, company, dataSensitivity, isEn, objective, policy, prioritization, team]);

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
          source: "ai-consulting-toolbox",
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
              {isEn ? "AI Consulting Toolbox" : "AI Consulting Toolbox"}
            </Badge>
            <Badge variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              {isEn ? "Use cases + policy" : "Use cases + policy"}
            </Badge>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mt-3">
            {isEn ? "Prioritize, govern and ship" : "Priorize, governe e entregue"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isEn
              ? "Generate a roadmap, governance policy and agent spec without external tools."
              : "Gere roadmap, política de governança e spec de agente sem ferramentas externas."}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 px-5 py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="w-4 h-4" />
            <span className="text-sm">{isEn ? "Top use case" : "Use case #1"}</span>
          </div>
          <div className="mt-1 text-base font-semibold">{prioritization[0]?.c ?? "-"}</div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Company" : "Empresa"}</label>
              <Input className="mt-2" value={company} onChange={(e) => setCompany(e.target.value)} placeholder={isEn ? "Example: VoltPay" : "Ex: VoltPay"} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Team" : "Time"}</label>
              <Input className="mt-2" value={team} onChange={(e) => setTeam(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Objective" : "Objetivo"}</label>
              <Input className="mt-2" value={objective} onChange={(e) => setObjective(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{isEn ? "Data sensitivity" : "Sensibilidade de dados"}</label>
              <Input className="mt-2" value={dataSensitivity} onChange={(e) => setDataSensitivity(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-muted-foreground">{isEn ? "Use cases (one per line)" : "Use cases (um por linha)"}</label>
              <Textarea className="mt-2 min-h-[100px]" value={useCases} onChange={(e) => setUseCases(e.target.value)} />
            </div>
          </div>

          <Tabs defaultValue="prioritize" className="mt-6">
            <TabsList className="w-full flex flex-wrap">
              <TabsTrigger value="prioritize" className="gap-2"><ListChecks className="w-4 h-4" />{isEn ? "Prioritize" : "Priorizar"}</TabsTrigger>
              <TabsTrigger value="policy" className="gap-2"><Shield className="w-4 h-4" />{isEn ? "Policy" : "Política"}</TabsTrigger>
              <TabsTrigger value="agent" className="gap-2"><Bot className="w-4 h-4" />{isEn ? "Agent spec" : "Spec de agente"}</TabsTrigger>
            </TabsList>

            <TabsContent value="prioritize" className="mt-4">
              <div className="rounded-2xl border border-border bg-background/50 p-5">
                <p className="font-semibold">{isEn ? "Use case ranking" : "Ranking de use cases"}</p>
                <Textarea className="mt-4 min-h-[240px]" readOnly value={prioritization.map((r) => `${r.c} | impact ${r.impact} | effort ${r.effort} | risk ${r.risk} | score ${r.score}`).join("\n")} />
                <Button variant="outline" className="mt-3 gap-2" onClick={() => copyToClipboard(prioritization.map((r) => r.c).join("\n"))}>
                  <Clipboard className="w-4 h-4" />
                  {isEn ? "Copy list" : "Copiar lista"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="policy" className="mt-4">
              <div className="rounded-2xl border border-border bg-background/50 p-5">
                <p className="font-semibold">{isEn ? "Governance policy" : "Política de governança"}</p>
                <Textarea className="mt-4 min-h-[240px]" readOnly value={policy} />
                <Button variant="outline" className="mt-3 gap-2" onClick={() => copyToClipboard(policy)}>
                  <Clipboard className="w-4 h-4" />
                  {isEn ? "Copy" : "Copiar"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="agent" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">{isEn ? "Rollout" : "Rollout"}</p>
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-2">
                      <label className="text-sm text-muted-foreground">{isEn ? "Weeks" : "Semanas"}</label>
                      <Input type="number" min={1} value={String(effortWeeks)} onChange={(e) => setEffortWeeks(Number(e.target.value) || 1)} />
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(agentSpec)}>
                      <Clipboard className="w-4 h-4" />
                      {isEn ? "Copy spec" : "Copiar spec"}
                    </Button>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <p className="font-semibold">JSON</p>
                  <Textarea className="mt-4 min-h-[240px]" readOnly value={agentSpec} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="rounded-2xl border border-border bg-background/60 p-5">
          <p className="font-semibold">{isEn ? "Send me the report" : "Me envia o relatório"}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {isEn
              ? "Enter your email to save this diagnosis + next steps."
              : "Informe seu email para salvar o diagnóstico + próximos passos."}
          </p>

          <div className="mt-4 grid gap-3">
            <Input type="email" autoComplete="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder={isEn ? "you@company.com" : "voce@empresa.com"} />
            <Button onClick={sendLead} disabled={!leadEmail || sending} className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600">
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
