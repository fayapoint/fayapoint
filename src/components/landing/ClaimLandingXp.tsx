"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

/**
 * Resgata na conta o XP ganho no minigame da landing (uma vez só).
 * Montado no portal: ao entrar logado, lê a jornada do localStorage,
 * credita via /api/gate/claim-xp e celebra com um banner discreto.
 */
export function ClaimLandingXp() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fayai_landing");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || data.claimed || !Number(data.xp)) return;

      fetch("/api/gate/claim-xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xp: data.xp, categories: data.cats || [] }),
      })
        .then((r) => r.json())
        .then((res) => {
          localStorage.setItem("fayai_landing", JSON.stringify({ ...data, claimed: true }));
          if (res?.claimed) {
            setMsg(`+${res.xp} XP da sua jornada na página inicial foram creditados! Você está no nível ${res.level}.`);
          }
        })
        .catch(() => { /* rede indisponível — tenta na próxima visita */ });
    } catch { /* storage indisponível */ }
  }, []);

  if (!msg) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl"
      style={{
        background: "linear-gradient(135deg, #f5c04e, #ffd97a)",
        color: "#241a05",
        boxShadow: "0 14px 40px rgba(245,192,78,.45)",
        maxWidth: "min(92vw, 480px)",
      }}
      role="status"
    >
      <Sparkles size={20} className="shrink-0" />
      <p className="text-sm font-bold leading-snug">🏆 {msg}</p>
      <button
        onClick={() => setMsg(null)}
        aria-label="Fechar"
        className="shrink-0 rounded-full p-1 hover:bg-black/10 transition-colors cursor-pointer"
      >
        <X size={16} />
      </button>
    </div>
  );
}
