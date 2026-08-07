"use client";
import { useT } from "@/i18n/dicionario";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, Loader2, Wand2 } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/client-auth";

/**
 * O extrato curto dos créditos, dentro da aba Assinatura.
 *
 * Ricardo, 05/08/2026: *"não vejo meus créditos, e deveríamos já ter o sistema
 * de créditos completamente funcional"*. O selo do cabeçalho
 * (`SaldoDeCreditos`) responde "quanto eu tenho"; este cartão responde as duas
 * perguntas seguintes, que são as que fazem o número significar alguma coisa:
 * **de onde ele vem** e **o que ele compra**.
 *
 * ⚠️ Os preços saem de `costs` na resposta da API, nunca de uma tabela copiada
 * para cá. Uma segunda tabela de preços é uma tabela que vai divergir da
 * primeira, e divergir num número que a pessoa usa para decidir gastar.
 */

interface Resposta {
  balance: number;
  monthlyBalance: number;
  purchasedBalance: number;
  monthlyAllocation: number;
  lastRefillDate?: string;
  totalSpent: number;
  costs?: Record<string, number>;
}

/**
 * Os gastos que valem a pena explicar aqui. O resto vive na tela de cada ação.
 *
 * ⚠️ As CHAVES têm de existir em `CREDIT_COSTS` (src/lib/course-tiers.ts) —
 * o filtro abaixo descarta silenciosamente qualquer chave que não venha na
 * resposta, então um nome errado aqui não quebra nada: some. Por isso vale
 * conferir contra o arquivo, e não contra a memória.
 *
 * `ai_chat_message` fica de fora de propósito: custa zero, e listar um item
 * grátis numa lista de preços faz a pessoa procurar a pegadinha.
 */
const ROTULOS: Record<string, string> = {
  custom_course_chapter: "Reescrever um capítulo com a sua cara",
  custom_course_generation: "Gerar um curso inteiro sob medida",
  certificate_generation: "Emitir um certificado verificável",
  quiz_attempt: "Uma tentativa no quiz do certificado",
};

export function CartaoDeCreditos() {
  const T = useT();
  const [d, setD] = useState<Resposta | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await fetch("/api/credits", { headers: getClientAuthHeaders() });
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        if (vivo) setD(j);
      } catch {
        if (vivo) setErro(true);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  if (erro) return null;

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.07] via-transparent to-transparent p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-semibold md:text-lg">
          <Coins size={17} className="text-amber-400" />
          
          {T("Seus créditos")}
        </h3>
        {d && (
          <span className="text-3xl font-extrabold tabular-nums text-amber-300 md:text-4xl">
            {d.balance}
          </span>
        )}
      </div>

      {!d ? (
        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" />  {T("Carregando saldo…")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <div className="text-lg font-bold tabular-nums">{d.monthlyBalance}</div>
              <div className="text-[11px] text-muted-foreground">{T("do plano")}</div>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <div className="text-lg font-bold tabular-nums">{d.purchasedBalance}</div>
              <div className="text-[11px] text-muted-foreground">{T("comprados")}</div>
            </div>
            <div className="col-span-2 rounded-lg border border-border bg-secondary/40 p-3 sm:col-span-1">
              <div className="text-lg font-bold tabular-nums">{d.monthlyAllocation}</div>
              <div className="text-[11px] text-muted-foreground">{T("renovam por mês")}</div>
            </div>
          </div>

          {/* ⚠️ O refill NÃO é um cron: ele acontece na LEITURA do saldo (ver
              `garantirRefillMensal`). Dizer "renovam por mês" e mostrar a data
              da última renovação é o que torna esse mecanismo visível — sem
              isso, quem passa um mês sem entrar acha que perdeu o crédito. */}
          {d.lastRefillDate && (
            <p className="mt-3 text-xs text-muted-foreground">
              
              {T("Última renovação em")}{" "}
              {new Date(d.lastRefillDate).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
              
              {T(". Os créditos do plano voltam ao teto todo mês; os comprados não vencem junto.")}
            </p>
          )}

          {d.costs && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                
                {T("O que eles compram")}
              </p>
              <ul className="space-y-1.5">
                {Object.entries(ROTULOS)
                  .filter(([k]) => typeof d.costs?.[k] === "number")
                  .map(([k, rotulo]) => (
                    <li key={k} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-muted-foreground">{T(rotulo)}</span>
                      <span className="shrink-0 font-bold tabular-nums text-amber-300">
                        {d.costs![k]}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <Link
            href="/portal?tab=courses"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm font-bold text-amber-200 transition-colors hover:bg-amber-500/20"
          >
            <Wand2 size={14} />  {T("Usar no Ateliê")}
          </Link>
        </>
      )}
    </div>
  );
}
