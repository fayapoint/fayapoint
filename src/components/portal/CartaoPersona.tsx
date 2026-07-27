"use client";

import { useEffect, useState } from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Dossie } from "@/lib/persona";

/**
 * O cartão da persona no dashboard — com o número, não com a promessa.
 *
 * A versão anterior dizia "cada jogo e leitura ensina o site a te conhecer".
 * Verdade, e inútil: não dava para saber se o site já conhecia a pessoa ou se
 * ainda não sabia nada dela. O usuário só descobria abrindo — e, do jeito que
 * a persona estava (nunca salvava), abrindo também não descobria.
 *
 * Agora o cartão mostra a confiança medida e A PRÓXIMA PERGUNTA que mais
 * rende. Um cartão que pergunta é um cartão que avança; um cartão que anuncia
 * é decoração.
 */
export function CartaoPersona({ onAbrir }: { onAbrir: () => void }) {
  const [dossie, setDossie] = useState<Dossie | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/social-persona", { credentials: "include", cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setDossie(data.dossie || null);
        }
      } catch {
        /* sem dossiê o cartão cai no texto genérico, que continua verdadeiro */
      }
    })();
  }, []);

  // A pergunta mais valiosa: a primeira lacuna da dimensão MENOS conhecida
  // entre as que ainda têm o que perguntar.
  const proxima = dossie?.dimensoes
    .filter((d) => d.faltando.length > 0)
    .sort((a, b) => a.confianca - b.confianca)[0];

  const conf = dossie?.confianca ?? 0;
  const raio = 22;
  const circ = 2 * Math.PI * raio;

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border-violet-500/20 bg-card transition-all hover:border-violet-500/40"
      onClick={onAbrir}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="relative hidden h-20 w-32 shrink-0 overflow-hidden rounded-xl sm:block">
          <img
            src="/portal/persona/vidente-hero.webp"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {dossie && (
          <div className="relative shrink-0 sm:hidden" style={{ width: 56, height: 56 }}>
            <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
              <circle cx="28" cy="28" r={raio} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4" />
              <circle
                cx="28"
                cy="28"
                r={raio}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - conf / 100)}
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-[13px] font-extrabold tabular-nums text-violet-300">
              {conf}%
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="flex flex-wrap items-center gap-2 text-base font-bold">
            <Sparkles size={15} className="text-violet-400" /> Sua Persona
            {dossie && (
              <span className="rounded-full border border-violet-500/40 px-2 py-[1px] text-[10px] font-extrabold uppercase tracking-wider text-violet-300">
                te conheço {conf}% · {dossie.qualidade}
              </span>
            )}
          </h3>

          {proxima ? (
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              <strong className="text-foreground">{proxima.faltando[0].pergunta}</strong>
              <br />
              <span className="text-[12px] text-muted-foreground/80">↳ {proxima.faltando[0].ganho}</span>
            </p>
          ) : (
            <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
              {dossie
                ? "Seu retrato está completo — o conteúdo sai na sua voz."
                : "Cada jogo e leitura ensina o site a te conhecer — e molda o conteúdo para você."}
            </p>
          )}
        </div>

        <span
          className="hidden shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold text-[#241a05] transition-opacity group-hover:opacity-90 sm:inline-flex"
          style={{ background: "linear-gradient(135deg, #a78bfa, #c4b5fd)" }}
        >
          {proxima ? "Responder" : "Abrir"} <ChevronRight size={14} />
        </span>
      </div>

      {dossie && (
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-white/[0.06]">
          <span
            className="block h-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
            style={{ width: `${conf}%`, transition: "width .8s cubic-bezier(.2,.85,.3,1)" }}
          />
        </span>
      )}
    </Card>
  );
}
