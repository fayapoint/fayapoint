"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { GameCopy } from "@/lib/game/copy";
import { LIMA, OURO, RUBRO, FUNDO } from "@/lib/game/tema";

/** Formulário da fila da liga piloto — POST /api/game/liga/inscrever. */
export function FormInteresse({ copy, locale }: { copy: GameCopy; locale: string }) {
  const [estado, setEstado] = useState<"idle" | "sending" | "ok" | "erro">("idle");
  const [role, setRole] = useState("captain");

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (estado === "sending") return;
    const form = new FormData(e.currentTarget);
    setEstado("sending");
    try {
      const res = await fetch("/api/game/liga/inscrever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          role,
          clubName: form.get("clubName") || undefined,
          psnOrGamertag: form.get("gamertag") || undefined,
          message: form.get("message") || undefined,
          locale,
        }),
      });
      setEstado(res.ok ? "ok" : "erro");
    } catch {
      setEstado("erro");
    }
  }

  if (estado === "ok") {
    return (
      <div
        className="flex flex-col items-center rounded-2xl border p-8 text-center"
        style={{ borderColor: `${LIMA}55`, background: `${LIMA}12` }}
      >
        <CheckCircle2 size={30} style={{ color: LIMA }} />
        <p className="mt-3 text-lg font-bold" style={{ color: LIMA }}>
          {copy.join.success}
        </p>
      </div>
    );
  }

  const campo =
    "w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3 text-white outline-none transition-colors placeholder:text-white/45 focus:border-white/35 focus:bg-white/[0.08]";

  return (
    <form onSubmit={enviar} id="piloto" className="grid gap-4 sm:grid-cols-2 scroll-mt-28">
      <div className="sm:col-span-2 flex flex-wrap gap-2">
        {copy.join.roles.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            className="rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
            style={
              role === r.value
                ? { background: LIMA, color: FUNDO, borderColor: LIMA }
                : {
                    background: "rgba(255,255,255,.05)",
                    color: "rgba(255,255,255,.75)",
                    borderColor: "rgba(255,255,255,.14)",
                  }
            }
          >
            {r.label}
          </button>
        ))}
      </div>
      <input name="email" type="email" required placeholder={copy.join.email} className={campo} />
      <input name="gamertag" placeholder={copy.join.gamertag} className={campo} maxLength={60} />
      <input
        name="clubName"
        placeholder={copy.join.clubName}
        className={`${campo} sm:col-span-2`}
        maxLength={120}
      />
      <textarea
        name="message"
        placeholder={copy.join.message}
        rows={3}
        className={`${campo} sm:col-span-2 resize-none`}
        maxLength={2000}
      />
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={estado === "sending"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-10 py-4 font-bold transition-transform disabled:opacity-40 enabled:hover:-translate-y-0.5 sm:w-auto"
          style={{ background: OURO, color: "#241a05", boxShadow: `0 12px 34px -14px ${OURO}` }}
        >
          {estado === "sending" && <Loader2 size={16} className="animate-spin" />}
          {estado === "sending" ? copy.join.sending : copy.join.submit}
        </button>
        {estado === "erro" && (
          <p className="mt-2 text-sm font-semibold" style={{ color: RUBRO }}>
            {copy.join.error}
          </p>
        )}
      </div>
    </form>
  );
}
