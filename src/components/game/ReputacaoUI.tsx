"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Star, X, Loader2, CheckCircle2, Award } from "lucide-react";
import type { CopyMercado } from "@/lib/game/copy-mercado";
import { CATEGORIAS, type ResumoReputacao } from "@/lib/game/reputacao-meta";
import { OURO, LIMA, CIANO, FUNDO, bebas, superficie } from "@/lib/game/tema";

/**
 * As peças de REPUTAÇÃO reaproveitadas pelo mercado e pela comunidade: a nota em
 * estrelas, o selo compacto do card, e o modal de avaliação por categorias.
 */

/** Fileira de estrelas só de leitura, com meia-estrela por gradiente. */
export function Estrelas({ nota, tamanho = 14 }: { nota: number; tamanho?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${nota} de 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const preench = Math.max(0, Math.min(1, nota - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: tamanho, height: tamanho }}>
            <Star size={tamanho} className="absolute inset-0" style={{ color: "rgba(255,255,255,.18)" }} fill="currentColor" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${preench * 100}%` }}>
              <Star size={tamanho} style={{ color: OURO }} fill={OURO} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Selo compacto: "★ 4.6 · 12" ou "sem avaliação". */
export function SeloReputacao({
  reputacao,
  copy,
  compacto,
}: {
  reputacao?: ResumoReputacao;
  copy: CopyMercado;
  compacto?: boolean;
}) {
  if (!reputacao || reputacao.total === 0) {
    return <span className="text-[11px] font-semibold text-white/35">{copy.card.semAvaliacao}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <Estrelas nota={reputacao.media} />
      <span className="text-[12px] font-black tabular-nums" style={{ color: OURO }}>
        {reputacao.media.toFixed(1)}
      </span>
      {!compacto && (
        <span className="text-[11px] font-semibold text-white/45">
          · {reputacao.total} {copy.card.avaliacoesLabel}
        </span>
      )}
    </span>
  );
}

/**
 * O MODAL DE AVALIAÇÃO — cinco categorias, nota de 1 a 5 por estrelas, e um
 * comentário. Mostra a média atual da comunidade no topo, para o voto novo
 * entrar em contexto.
 */
export function AvaliarModal({
  gamertag,
  reputacao,
  copy,
  locale,
  aoFechar,
  aoConcluir,
}: {
  gamertag: string;
  reputacao?: ResumoReputacao;
  copy: CopyMercado;
  locale: string;
  aoFechar: () => void;
  aoConcluir: (novo: ResumoReputacao | null) => void;
}) {
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [comentario, setComentario] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "login" | "ok" | "erro">("idle");

  const completo = CATEGORIAS.every((c) => notas[c.key] >= 1);

  async function enviar() {
    if (!completo || estado === "enviando") return;
    setEstado("enviando");
    const res = await fetch(`/api/game/jogador/${encodeURIComponent(gamertag)}/avaliar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categorias: notas, comentario: comentario.trim() || undefined }),
    }).catch(() => null);
    if (res?.ok) {
      const d = await res.json();
      setEstado("ok");
      setTimeout(() => aoConcluir(d.reputacao ?? null), 900);
      return;
    }
    if (res?.status === 401) return setEstado("login");
    setEstado("erro");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4" onClick={aoFechar}>
      <div
        className="w-full max-w-md rounded-3xl border p-6"
        style={{ ...superficie(OURO, "forte"), background: "#141126" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-xl" style={bebas}>
              <Award size={20} style={{ color: OURO }} />
              {copy.avaliacao.titulo.toUpperCase()}
            </h3>
            <p className="mt-0.5 text-sm font-bold" style={{ color: LIMA }}>{gamertag}</p>
          </div>
          <button type="button" onClick={aoFechar} className="text-white/50 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <p className="mt-2 text-[12.5px] leading-relaxed text-white/60">{copy.avaliacao.subtitulo}</p>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">{copy.avaliacao.media}</span>
          <span className="ml-auto">
            {reputacao && reputacao.total > 0 ? (
              <SeloReputacao reputacao={reputacao} copy={copy} />
            ) : (
              <span className="text-[11.5px] text-white/40">{copy.avaliacao.semNota}</span>
            )}
          </span>
        </div>

        {estado === "ok" ? (
          <p className="mt-6 flex items-center justify-center gap-2 py-6 text-sm font-bold" style={{ color: LIMA }}>
            <CheckCircle2 size={16} />
            {copy.avaliacao.ok}
          </p>
        ) : (
          <>
            <div className="mt-4 space-y-2.5">
              {CATEGORIAS.map((c) => (
                <div key={c.key} className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-bold text-white/80">{locale === "en" ? c.nomeEn : c.nome}</span>
                  <SeletorEstrelas valor={notas[c.key] ?? 0} aoEscolher={(n) => setNotas((v) => ({ ...v, [c.key]: n }))} />
                </div>
              ))}
            </div>

            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder={copy.avaliacao.comentarioPlaceholder}
              maxLength={300}
              rows={2}
              className="mt-4 w-full resize-none rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
            />

            <button
              type="button"
              onClick={enviar}
              disabled={!completo || estado === "enviando"}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: OURO, color: FUNDO }}
            >
              {estado === "enviando" ? <Loader2 size={15} className="animate-spin" /> : <Star size={15} />}
              {estado === "enviando" ? copy.avaliacao.enviando : copy.avaliacao.enviar}
            </button>
            {estado === "login" && (
              <Link href="/login" className="mt-2 block text-center text-[12.5px] font-bold" style={{ color: CIANO }}>
                {copy.avaliacao.login}
              </Link>
            )}
            {estado === "erro" && <p className="mt-2 text-center text-[12.5px] text-rose-300">{copy.hub.error}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function SeletorEstrelas({ valor, aoEscolher }: { valor: number; aoEscolher: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const ativo = hover || valor;
  return (
    <span className="inline-flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onClick={() => aoEscolher(n)}
          className="p-0.5 transition-transform hover:scale-110"
          aria-label={`${n}`}
        >
          <Star size={18} style={{ color: n <= ativo ? OURO : "rgba(255,255,255,.2)" }} fill={n <= ativo ? OURO : "transparent"} />
        </button>
      ))}
    </span>
  );
}
