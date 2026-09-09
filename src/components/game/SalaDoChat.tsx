"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getClientAuthHeaders } from "@/lib/client-auth";
import { Link } from "@/i18n/navigation";
import { MessageSquare, Send, Loader2, ShieldCheck, EyeOff } from "lucide-react";
import { LIMA, OURO, CINZA, bebas, superficie } from "@/lib/game/tema";
import { AvatarJogador } from "./AvatarJogador";

/**
 * A SALA — o chat aberto do Winners 22. 08/09/2026.
 *
 * ## Por que sondagem, e por que 6 segundos
 *
 * A produção é serverless: não há processo de pé para segurar WebSocket. A sala
 * lê periodicamente, mandando `?desde=` — o servidor devolve só o que chegou
 * depois da última que esta aba viu. Uma sala parada custa uma consulta vazia a
 * cada 6 segundos; uma sala movimentada custa a mesma consulta com conteúdo.
 *
 * 6 segundos é o ponto onde a conversa ainda parece conversa e o custo continua
 * desprezível. Abaixo disso a diferença some para quem lê, e o custo dobra.
 *
 * ## A aba escondida não sonda
 *
 * `document.hidden` para o laço. É o mesmo defeito que já congelou o progresso
 * do audiobook nesta casa, ao contrário: aqui, sem isso, vinte abas esquecidas
 * abertas viram vinte consultas a cada 6 segundos, para ninguém.
 *
 * ## A rolagem só desce sozinha se você estiver embaixo
 *
 * Quem está lendo mensagem antiga não pode ser arrastado para o fim porque
 * alguém falou. A regra é a de todo aplicativo de conversa que funciona, e a
 * ausência dela é a razão de tantos não funcionarem.
 */

interface Mensagem {
  id: string;
  nome: string;
  avatarSeed: string | null;
  federacao: boolean;
  texto: string;
  em: string;
}

const INTERVALO_MS = 6_000;
const LIMITE_TEXTO = 500;

export function SalaDoChat({ locale, ehFederacao = false }: { locale: string; ehFederacao?: boolean }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<"lendo" | "pronto" | "erro">("lendo");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const caixa = useRef<HTMLDivElement>(null);
  const ultima = useRef<string | null>(null);
  const grudadoNoFim = useRef(true);

  const buscar = useCallback(async () => {
    try {
      const q = ultima.current ? `?desde=${encodeURIComponent(ultima.current)}` : "";
      const r = await fetch(`/api/game/chat${q}`, { cache: "no-store" });
      if (!r.ok) throw new Error();
      const j = (await r.json()) as { mensagens: Mensagem[] };
      setEstado("pronto");
      if (j.mensagens.length === 0) return;
      ultima.current = j.mensagens[j.mensagens.length - 1].em;
      setMensagens((atual) => {
        // Chegar duas vezes é possível (envio otimista + sondagem). O id manda.
        const vistos = new Set(atual.map((m) => m.id));
        const novas = j.mensagens.filter((m) => !vistos.has(m.id));
        return novas.length ? [...atual, ...novas].slice(-200) : atual;
      });
    } catch {
      setEstado((e) => (e === "pronto" ? e : "erro"));
    }
  }, []);

  useEffect(() => {
    buscar();
    const t = setInterval(() => {
      if (!document.hidden) buscar();
    }, INTERVALO_MS);
    return () => clearInterval(t);
  }, [buscar]);

  // Desce sozinho só para quem já estava no fim.
  useEffect(() => {
    if (grudadoNoFim.current && caixa.current) {
      caixa.current.scrollTop = caixa.current.scrollHeight;
    }
  }, [mensagens]);

  const aoRolar = () => {
    const el = caixa.current;
    if (!el) return;
    grudadoNoFim.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  async function falar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setAviso(null);
    try {
      const r = await fetch("/api/game/chat", {
        method: "POST",
        headers: { "content-type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ texto: t }),
      });
      const j = await r.json();
      if (!r.ok) {
        setAviso(j.error ?? "não deu para enviar");
        return;
      }
      setTexto("");
      grudadoNoFim.current = true;
      setMensagens((atual) =>
        atual.some((m) => m.id === j.mensagem.id) ? atual : [...atual, j.mensagem]
      );
      ultima.current = j.mensagem.em;
    } catch {
      setAviso("não deu para enviar agora");
    } finally {
      setEnviando(false);
    }
  }

  async function esconder(id: string) {
    const motivo = window.prompt("Por que esconder esta mensagem?")?.trim() ?? "";
    if (motivo.length < 3) return;
    const r = await fetch("/api/game/chat", {
      method: "PATCH",
      headers: { "content-type": "application/json", ...getClientAuthHeaders() },
      body: JSON.stringify({ id, motivo }),
    });
    if (r.ok) setMensagens((atual) => atual.filter((m) => m.id !== id));
  }

  return (
    <section style={superficie(LIMA)} className="rounded-2xl border p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 style={bebas} className="flex items-center gap-2 text-2xl uppercase tracking-wide">
          <MessageSquare className="h-5 w-5" style={{ color: LIMA }} />
          A sala
        </h2>
        <p className="text-[11px] text-white/35">
          conversa aberta do Winners 22 · some sozinha em 30 dias
        </p>
      </div>

      <div
        ref={caixa}
        onScroll={aoRolar}
        className="mt-4 h-[340px] space-y-3 overflow-y-auto rounded-xl bg-black/25 p-4"
      >
        {estado === "lendo" && mensagens.length === 0 && (
          <p className="flex items-center gap-2 text-xs text-white/35">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> abrindo a sala…
          </p>
        )}

        {estado === "erro" && mensagens.length === 0 && (
          <p className="text-xs text-rose-200/80">Não deu para abrir a sala agora.</p>
        )}

        {estado === "pronto" && mensagens.length === 0 && (
          <p className="text-xs leading-relaxed text-white/40">
            Ninguém falou ainda. Puxe assunto — quem está procurando clube, quem está montando
            time, quem quer opinião sobre a rodada. A sala é o lugar.
          </p>
        )}

        {mensagens.map((m) => (
          <div key={m.id} className="group flex items-start gap-2.5">
            <AvatarJogador seed={m.avatarSeed ?? m.nome} size={28} anel={false} />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span
                  className="text-[12.5px] font-semibold"
                  style={{ color: m.federacao ? OURO : "rgba(255,255,255,.82)" }}
                >
                  {m.nome}
                </span>
                {m.federacao && (
                  <span
                    className="inline-flex items-center gap-1 rounded border px-1 py-px text-[8.5px] uppercase tracking-widest"
                    style={{ borderColor: `${OURO}55`, color: OURO }}
                  >
                    <ShieldCheck className="h-2.5 w-2.5" />
                    federação
                  </span>
                )}
                <span className="text-[10px] text-white/25">
                  {new Date(m.em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {ehFederacao && (
                  <button
                    type="button"
                    onClick={() => esconder(m.id)}
                    title="Esconder (exige motivo)"
                    className="ml-auto text-white/0 transition group-hover:text-white/30 hover:!text-rose-300"
                  >
                    <EyeOff className="h-3 w-3" />
                  </button>
                )}
              </p>
              <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-white/70">
                {m.texto}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={falar} className="mt-3 flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={LIMITE_TEXTO}
          placeholder="falar na sala…"
          aria-label="Sua mensagem"
          className="min-w-0 flex-1 rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none transition placeholder:text-white/25 focus:border-white/30"
        />
        <button
          type="submit"
          disabled={enviando || texto.trim().length === 0}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-35"
          style={{ background: LIMA, color: "#090e11" }}
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          falar
        </button>
      </form>

      {aviso && (
        <p style={superficie(CINZA)} className="mt-2 rounded-lg border px-3 py-2 text-xs text-white/60">
          {aviso}{" "}
          {aviso.includes("conta") && (
            <Link href="/login" locale={locale} className="underline" style={{ color: LIMA }}>
              entrar
            </Link>
          )}
        </p>
      )}

      <p className="mt-2 text-[10.5px] leading-relaxed text-white/25">
        Ler é aberto a todo mundo; falar exige conta. A federação pode esconder mensagem, sempre
        com motivo registrado — e esconder não apaga.
      </p>
    </section>
  );
}
