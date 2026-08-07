"use client";
import { useT } from "@/i18n/dicionario";

import { useEffect, useState } from "react";
import { Radar, Loader2, Youtube, Search, ArrowRight, RefreshCw } from "lucide-react";

/**
 * "Sobre o que eu publico hoje?" — respondido com medição, não com palpite.
 *
 * A tela em branco é o gargalo real de quem gerencia rede social. As
 * ferramentas do mercado respondem com calendário de datas comemorativas: o
 * mesmo Dia do Cliente para todo mundo, decidido em janeiro. Aqui a resposta
 * vem do Radar — o que o brasileiro da PROFISSÃO dele está perguntando sobre
 * IA hoje, medido no autocomplete do Google e do YouTube.
 *
 * Clicar numa pauta não publica nada: joga o termo no campo de tema do
 * composer, onde o texto ainda passa pela persona e pela revisão dele. A pauta
 * diz o QUE; a persona diz COMO.
 */

interface Pauta {
  termo: string;
  nota: number;
  canais: "web+yt" | "web" | "yt";
  formato: string;
  so_video: boolean;
}

interface Resposta {
  nicho: { id: string; label: string; chamada: string; cor: string };
  personalizado: boolean;
  areaLabel: string | null;
  origem: string;
  pautas: Pauta[];
}

export default function PautasDoDia({ onEscolher }: { onEscolher: (termo: string) => void }) {
  const T = useT();
  const [dados, setDados] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(true);

  const buscar = async () => {
    setCarregando(true);
    try {
      const res = await fetch("/api/social/pautas", { credentials: "include", cache: "no-store" });
      if (res.ok) setDados(await res.json());
    } catch {
      /* sem pauta a tela continua utilizável — o campo de tema é livre */
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscar();
  }, []);

  if (carregando) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />  {T("Medindo o que o Brasil pergunta agora…")}
      </div>
    );
  }

  if (!dados || dados.pautas.length === 0) return null;

  const cor = dados.nicho.cor;

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: `${cor}33`, background: `${cor}0a` }}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: cor }}>
          <Radar className="h-3.5 w-3.5" />  {T("Pauta de hoje ·")} {T(dados.nicho.label)}
        </p>
        <button
          onClick={buscar}
          className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />  {T("Atualizar")}
        </button>
      </div>

      <p className="mb-3 text-[11.5px] leading-snug text-muted-foreground">
        {dados.personalizado ? (
          <>
            
            {T("O que quem trabalha com")} <strong className="text-foreground">{T(dados.areaLabel)}</strong>  {T("está procurando sobre IA agora —\r\n            medido no autocomplete do Google e do YouTube.")}
          </>
        ) : (
          <>
            
            {T("Recorte do Brasil inteiro.")}{" "}
            <strong className="text-foreground">{T("Escolha sua área na aba Persona")}</strong>  {T("e esta lista passa a ser a da sua profissão.")}
          </>
        )}
      </p>

      <div className="flex flex-col gap-1.5">
        {dados.pautas.map((p) => (
          <button
            key={p.termo}
            onClick={() => onEscolher(p.termo)}
            className="group flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2 text-left transition-colors hover:border-white/20 hover:bg-black/40 cursor-pointer"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-semibold capitalize text-foreground">{T(p.termo)}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1 rounded px-1.5 py-[1px] text-[9px] font-extrabold uppercase tracking-wider"
                  style={
                    p.so_video
                      ? { background: "#f472b626", color: "#f472b6" }
                      : p.canais === "web+yt"
                        ? { background: "#a3e63526", color: "#a3e635" }
                        : { background: "#38bdf826", color: "#38bdf8" }
                  }
                >
                  {p.so_video ? <Youtube size={8} /> : <Search size={8} />}
                  {p.so_video ? T("demanda de vídeo") : p.canais === "web+yt" ? T("nos dois canais") : T("busca")}
                </span>
                <span className="text-[10px] text-muted-foreground">{T(p.formato)}</span>
              </span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}
