"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ROICalculatorPage() {
  const [investment, setInvestment] = useState(0);
  const [monthlyGain, setMonthlyGain] = useState(0);
  const [months, setMonths] = useState(12);

  const totalGain = monthlyGain * months;
  const roi = investment > 0 ? ((totalGain - investment) / investment) * 100 : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-4xl font-bold mb-6">Calculadora de ROI de IA</h1>
          <Card className="p-6 bg-secondary border-border space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Investimento inicial (R$)</label>
              <Input type="number" value={investment} onChange={e=>setInvestment(parseFloat(e.target.value||"0"))} className="bg-card border-border" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Ganho mensal estimado (R$)</label>
              <Input type="number" value={monthlyGain} onChange={e=>setMonthlyGain(parseFloat(e.target.value||"0"))} className="bg-card border-border" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Meses</label>
              <Input type="number" value={months} onChange={e=>setMonths(parseInt(e.target.value||"0"))} className="bg-card border-border" />
            </div>
            <div className="pt-2">
              <p className="text-muted-foreground">Ganho total: <span className="font-semibold">R$ {totalGain.toFixed(2)}</span></p>
              <p className="text-muted-foreground">ROI: <span className={`font-semibold ${roi>=0? 'text-green-400':'text-red-400'}`}>{roi.toFixed(2)}%</span></p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
