"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Cpu, Loader2, PowerOff, X } from "lucide-react";
import { useT } from "@/i18n/dicionario";
import { getClientAuthHeaders } from "@/lib/client-auth";

/**
 * A BARRA DA FILA — o visor da GPU da casa.
 *
 * ## O que ela existe para impedir
 *
 * Uma fila sem visor é indistinguível de um sistema quebrado. A pessoa clica em
 * "gerar", nada aparece, e em trinta segundos ela clica de novo — agora com
 * dois trabalhos na frente dela mesma. Esta barra é o que transforma a espera
 * em informação: quantos estão na frente, quanto falta, e se a máquina está
 * ligada.
 *
 * ## As três decisões
 *
 * 1. **A previsão vem em texto, e nunca diz "alguns instantes".** A GPU atende
 *    um por vez; um vídeo à frente significa doze minutos. Prometer errado é o
 *    jeito mais rápido de a pessoa recarregar vinte vezes.
 * 2. **"Máquina desligada" só aparece quando há trabalho esperando.** Alarmar
 *    numa tela sem fila treina a pessoa a ignorar o aviso quando ele importar.
 * 3. **A sondagem desacelera sozinha.** De 3 em 3 segundos enquanto há coisa
 *    andando; de 30 em 30 quando está tudo parado. Uma aba esquecida aberta a
 *    noite inteira não pode custar 28 mil requisições ao banco.
 */

export interface TrabalhoNaFila {
  _id: string;
  tipo: string;
  onde: string;
  rotulo: string;
  estado: string;
  espera: string;
  esperaSegundos: number;
  resultado?: { url?: string };
  ultimoErro?: string;
}

export interface EstadoDaFila {
  trabalhos: TrabalhoNaFila[];
  totalNaFila: number;
  trabalhadorVivo: boolean;
  aviso: string;
  uso: { gasto: number; teto: number; restante: number; cabemImagens: number; cabemVideos: number };
}

const RAPIDO_MS = 3000;
const LENTO_MS = 30000;

export function useFila(aoConcluir?: () => void) {
  const [fila, setFila] = useState<EstadoDaFila | null>(null);
  const anteriores = useRef<Map<string, string>>(new Map());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const buscar = useCallback(async () => {
    try {
      const r = await fetch("/api/forja/fila", { headers: getClientAuthHeaders() });
      if (!r.ok) return null;
      const d = (await r.json()) as EstadoDaFila;

      /**
       * Um trabalho que saiu de "rodando" para "pronto" é a única coisa que
       * obriga o resto da tela a recarregar. Avisar em TODA sondagem faria a
       * peça inteira ser buscada de três em três segundos.
       */
      let mudou = false;
      for (const t of d.trabalhos) {
        const antes = anteriores.current.get(t._id);
        if (antes && antes !== t.estado && (t.estado === "pronto" || t.estado === "falhou")) mudou = true;
        anteriores.current.set(t._id, t.estado);
      }
      setFila(d);
      if (mudou) aoConcluir?.();
      return d;
    } catch {
      return null;
    }
  }, [aoConcluir]);

  useEffect(() => {
    let vivo = true;
    const rodar = async () => {
      const d = await buscar();
      if (!vivo) return;
      const andando = (d?.trabalhos || []).some((t) => ["esperando", "reservado", "rodando"].includes(t.estado));
      timer.current = setTimeout(rodar, andando ? RAPIDO_MS : LENTO_MS);
    };
    rodar();
    return () => {
      vivo = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [buscar]);

  return { fila, recarregarFila: buscar };
}

export default function BarraDaFila({ fila, aoMudar }: { fila: EstadoDaFila | null; aoMudar: () => void }) {
  const T = useT();
  if (!fila) return null;

  const ativos = fila.trabalhos.filter((t) => ["esperando", "reservado", "rodando"].includes(t.estado));
  const recentes = fila.trabalhos.filter((t) => t.estado === "pronto" || t.estado === "falhou").slice(0, 3);

  async function cancelar(id: string) {
    await fetch(`/api/forja/fila?id=${id}`, { method: "DELETE", headers: getClientAuthHeaders() });
    aoMudar();
  }

  const nada = !ativos.length && !fila.aviso;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {fila.trabalhadorVivo ? (
            <Cpu className="h-4 w-4 text-emerald-400" />
          ) : (
            <PowerOff className="h-4 w-4 text-amber-400" />
          )}
          <h2 className="text-sm font-semibold">{T("A fila")}</h2>
          {ativos.length > 0 && (
            <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
              {ativos.length} {ativos.length === 1 ? T("seu") : T("seus")}
              {fila.totalNaFila > ativos.length ? ` · ${fila.totalNaFila} ${T("no total")}` : ""}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          {T("Hoje")}: {fila.uso.gasto}/{fila.uso.teto}
        </p>
      </div>

      {fila.aviso && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-2.5 text-[11px] leading-relaxed text-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {T(fila.aviso)}
        </p>
      )}

      {nada && (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          {T("Nada na fila. Gerar imagem e vídeo aqui não custa crédito — roda na GPU da FayAI, e a espera é o preço.")}
        </p>
      )}

      {ativos.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {ativos.map((t) => (
            <li key={t._id} className="flex items-center gap-2 rounded-lg bg-slate-950/50 px-2.5 py-2 text-[11px]">
              <Loader2
                className={`h-3.5 w-3.5 shrink-0 text-indigo-400 ${t.estado === "rodando" ? "animate-spin" : "opacity-40"}`}
              />
              <span className="min-w-0 flex-1 truncate text-slate-300">{t.rotulo}</span>
              <span className="shrink-0 tabular-nums text-slate-500">
                {t.estado === "rodando" ? T("gerando…") : t.espera}
              </span>
              {t.estado === "esperando" && (
                <button
                  onClick={() => cancelar(t._id)}
                  className="shrink-0 rounded p-1 text-slate-600 transition hover:bg-slate-800 hover:text-slate-300"
                  title={T("Tirar da fila")}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {recentes.length > 0 && (
        <ul className="mt-2 space-y-1">
          {recentes.map((t) => (
            <li key={t._id} className="flex items-center gap-2 px-2.5 text-[10px] text-slate-600">
              {t.estado === "pronto" ? (
                <Check className="h-3 w-3 shrink-0 text-emerald-500" />
              ) : (
                <X className="h-3 w-3 shrink-0 text-rose-500" />
              )}
              <span className="min-w-0 flex-1 truncate">{t.rotulo}</span>
              {t.estado === "falhou" && t.ultimoErro && (
                <span className="shrink-0 max-w-[40%] truncate text-rose-400/70" title={t.ultimoErro}>
                  {t.ultimoErro}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
