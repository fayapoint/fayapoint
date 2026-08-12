"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Wand2 } from "lucide-react";
import { useT } from "@/i18n/dicionario";

/**
 * As camadas decorativas do cartão-holograma, sob controle de quem olha.
 *
 * ## Por que virou opção
 *
 * A versão anterior tinha UMA atmosfera, e era a mais agressiva possível:
 * rastreio de 3px somado a uma barra de varredura cruzando o cartão a cada 5,5
 * segundos, sempre, em toda pergunta. Ricardo, em 12/08:
 *
 * > *"as linhas scanline decorativas podem ficar cansativas (…) a maioria dos
 * > templates é algo mais suave e lento do que o que tem agora, e claro uma
 * > opção de ser aleatório. ou claro, até nenhum."*
 *
 * Movimento repetido no campo de visão de quem está LENDO uma pergunta e
 * decidindo uma resposta compete com a tarefa. O padrão passou a ser `bruma`
 * — respiração de 22s, sem linha nenhuma — e a varredura antiga virou
 * `intensa`, para quem quiser.
 *
 * ⚠️ **`motion-safe:` em tudo que anda.** Com `prefers-reduced-motion` a
 * camada estática fica e o movimento para: efeito de ambiente não vale enjoo
 * em quem tem sensibilidade a movimento.
 *
 * ⚠️ As classes de animação são **literais**, nunca montadas por interpolação.
 * O Tailwind varre o código como texto: `animate-[varre_${x}s...]` não existe
 * no CSS gerado e falha em silêncio — o efeito simplesmente não aparece.
 */
export type Atmo =
  | "nenhuma"
  | "bruma"
  | "linhas"
  | "varredura"
  | "pulso"
  | "grade"
  | "intensa"
  | "aleatoria";

export const ATMOSFERAS: Array<{ id: Atmo; nome: string; nota: string }> = [
  { id: "bruma", nome: "Bruma", nota: "respiração lenta, sem linhas" },
  { id: "linhas", nome: "Linhas", nota: "rastreio fino, parado" },
  { id: "grade", nome: "Grade", nota: "malha discreta, parada" },
  { id: "pulso", nome: "Pulso", nota: "halo que bate devagar" },
  { id: "varredura", nome: "Varredura", nota: "uma passagem a cada 14s" },
  { id: "intensa", nome: "Intensa", nota: "linhas + varredura rápida" },
  { id: "aleatoria", nome: "Aleatória", nota: "sorteia a cada pergunta" },
  { id: "nenhuma", nome: "Nenhuma", nota: "cartão limpo" },
];

const CHAVE = "fayai:persona:atmosfera";
const EVENTO = "fayai:atmosfera";

/** Sorteio estável: a mesma pergunta devolve sempre o mesmo efeito. */
function sorteia(semente: string): Atmo {
  const pool: Atmo[] = ["bruma", "linhas", "grade", "pulso", "varredura", "intensa"];
  let h = 0;
  for (let i = 0; i < semente.length; i++) h = (h * 31 + semente.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

/**
 * O estado vive no localStorage e é sincronizado por evento de janela — o
 * seletor está no cabeçalho e a atmosfera dentro do cartão; sem o evento, a
 * troca só valeria na próxima pergunta.
 */
export function useAtmosfera(): [Atmo, (a: Atmo) => void] {
  const [modo, setModo] = useState<Atmo>("bruma");

  useEffect(() => {
    const ler = () => {
      const salvo = localStorage.getItem(CHAVE) as Atmo | null;
      if (salvo && ATMOSFERAS.some((a) => a.id === salvo)) setModo(salvo);
    };
    ler();
    window.addEventListener(EVENTO, ler);
    return () => window.removeEventListener(EVENTO, ler);
  }, []);

  const trocar = useCallback((a: Atmo) => {
    localStorage.setItem(CHAVE, a);
    setModo(a);
    window.dispatchEvent(new CustomEvent(EVENTO));
  }, []);

  return [modo, trocar];
}

export function Atmosfera({ cor, semente }: { cor: string; semente: string }) {
  const [modo] = useAtmosfera();
  const efetivo = useMemo(() => (modo === "aleatoria" ? sorteia(semente) : modo), [modo, semente]);

  if (efetivo === "nenhuma") return null;

  const linhas = efetivo === "linhas" || efetivo === "intensa";
  const forte = efetivo === "intensa";

  return (
    <>
      {linhas && (
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${forte ? "opacity-[0.055]" : "opacity-[0.028]"}`}
          style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 4px)" }}
        />
      )}

      {efetivo === "grade" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 34px), repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 34px)",
          }}
        />
      )}

      {efetivo === "bruma" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 motion-safe:animate-[respira_22s_ease-in-out_infinite]"
          style={{ background: `radial-gradient(120% 80% at 50% 0%, ${cor}16, transparent 70%)` }}
        />
      )}

      {efetivo === "pulso" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 motion-safe:animate-[pulsa_9s_ease-in-out_infinite]"
          style={{ boxShadow: `inset 0 0 90px -30px ${cor}` }}
        />
      )}

      {efetivo === "varredura" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-24 motion-safe:animate-[varre_14s_linear_infinite]"
          style={{ background: `linear-gradient(180deg, transparent, ${cor}14, transparent)` }}
        />
      )}

      {forte && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-24 motion-safe:animate-[varre_5500ms_linear_infinite]"
          style={{ background: `linear-gradient(180deg, transparent, ${cor}1f, transparent)` }}
        />
      )}

      <style>{`
        @keyframes varre{0%{top:-6rem}100%{top:100%}}
        @keyframes respira{0%,100%{opacity:.4}50%{opacity:1}}
        @keyframes pulsa{0%,100%{opacity:.2}50%{opacity:.8}}
      `}</style>
    </>
  );
}

/** O controle, no cabeçalho do palco: um clique abre a lista, vale na hora. */
export function SeletorAtmosfera() {
  const T = useT();
  const [modo, trocar] = useAtmosfera();
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const atual = ATMOSFERAS.find((a) => a.id === modo) || ATMOSFERAS[0];

  return (
    <div ref={caixa} className="relative ml-auto">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        title={T("Efeito visual do cartão")}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[12px] font-semibold text-white/70 transition-colors hover:bg-white/[0.1] hover:text-white"
      >
        <Wand2 size={12} />
        {T(atual.nome)}
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-40 w-60 overflow-hidden rounded-xl border border-white/12 bg-[#14110c] shadow-2xl"
        >
          {ATMOSFERAS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="menuitemradio"
              aria-checked={modo === a.id}
              onClick={() => {
                trocar(a.id);
                setAberto(false);
              }}
              className={`flex w-full cursor-pointer flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors hover:bg-white/[0.07] ${
                modo === a.id ? "bg-amber-400/10" : ""
              }`}
            >
              <span className="flex w-full items-center gap-2 text-[13px] font-bold text-white">
                {T(a.nome)}
                {modo === a.id && <Check size={13} className="ml-auto text-amber-300" />}
              </span>
              <span className="text-[11.5px] text-white/45">{T(a.nota)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
