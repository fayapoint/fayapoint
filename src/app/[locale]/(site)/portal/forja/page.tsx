"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Flame, ImagePlus, Layers, Users } from "lucide-react";
import { useT } from "@/i18n/dicionario";
import { getClientAuthHeaders } from "@/lib/client-auth";
import BarraDaFila, { useFila } from "@/components/portal/forja/BarraDaFila";
import Elenco from "@/components/portal/forja/Elenco";
import Pecas from "@/components/portal/forja/Pecas";
import ImagemAvulsa from "@/components/portal/forja/ImagemAvulsa";

/**
 * A FORJA — `/portal/forja`.
 *
 * ## O que é
 *
 * O WorldForge — o estúdio que planeja os planos de câmera da série *They Can
 * Hear* — apontado para o conteúdo do usuário, e ligado na GPU da casa. A
 * persona dele entra; sai um plano de filmagem quadro a quadro, as imagens de
 * cada quadro com o rosto dele, e o clipe de cada imagem com áudio.
 *
 * ## As três coisas que o Ateliê antigo não fazia
 *
 * 1. **Personagem que sobrevive.** O gerador esquece entre uma chamada e a
 *    outra; a ficha e o caderno são o que fazem o mesmo rosto atravessar os
 *    cinco quadros de um Reel.
 * 2. **Vídeo de verdade.** LTX 2.5, com áudio sincronizado, partindo da imagem
 *    que a pessoa aprovou — e não de uma que o modelo inventou.
 * 3. **De graça.** Roda na GPU da FayAI. O preço do caminho grátis é a fila, e
 *    é por isso que a fila fica visível o tempo todo em vez de escondida.
 *
 * ## Por que as três abas, nesta ordem
 *
 * Elenco vem primeiro porque é pré-requisito: sem rosto travado, todo quadro
 * com gente sai com uma pessoa diferente. Peças é o trabalho principal. "Só uma
 * imagem" é a porta de entrada de quem não quer planejar nada — e é o pedido
 * mais comum de quem chega.
 */

type Aba = "pecas" | "elenco" | "avulsa";

const ABAS: Array<{ id: Aba; rotulo: string; icone: typeof Layers }> = [
  { id: "pecas", rotulo: "Peças", icone: Layers },
  { id: "elenco", rotulo: "Elenco", icone: Users },
  { id: "avulsa", rotulo: "Só uma imagem", icone: ImagePlus },
];

interface PersonagemLeve {
  _id: string;
  nome: string;
  origem: string;
}

export default function AForja() {
  const T = useT();
  const { locale } = useParams<{ locale: string }>();
  const [aba, setAba] = useState<Aba>("pecas");
  const [personagens, setPersonagens] = useState<PersonagemLeve[]>([]);

  /**
   * O sinal de "algo ficou pronto".
   *
   * Um contador, e não um booleano: dois trabalhos que terminam em sondagens
   * seguidas precisam disparar duas recargas, e um booleano só dispararia uma.
   */
  const [sinal, setSinal] = useState(0);
  const aoConcluir = useCallback(() => setSinal((n) => n + 1), []);
  const { fila, recarregarFila } = useFila(aoConcluir);

  const carregarElenco = useCallback(async () => {
    try {
      const r = await fetch("/api/forja/personagens", { headers: getClientAuthHeaders() });
      if (!r.ok) return;
      const d = await r.json();
      setPersonagens(
        (d.personagens || []).map((p: PersonagemLeve) => ({ _id: p._id, nome: p.nome, origem: p.origem })),
      );
    } catch {
      /* a aba do elenco mostra o erro de verdade; aqui a lista vazia basta */
    }
  }, []);

  useEffect(() => {
    carregarElenco();
  }, [carregarElenco, sinal]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href={`/${locale}/portal`}
        className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 transition hover:text-slate-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {T("Voltar ao portal")}
      </Link>

      <header className="mt-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-indigo-500/30">
          <Flame className="h-5 w-5 text-indigo-300" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{T("A Forja")}</h1>
          <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-400">
            {T(
              "O seu perfil vira um plano de filmagem — e o plano vira imagem e vídeo, com o seu rosto, na GPU da FayAI. Sem crédito: a fila é o preço.",
            )}
          </p>
        </div>
      </header>

      <nav className="mt-6 flex gap-1 border-b border-slate-800">
        {ABAS.map((a) => {
          const Icone = a.icone;
          const ativa = aba === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-[11px] font-medium transition ${
                ativa
                  ? "border-indigo-500 text-indigo-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icone className="h-3.5 w-3.5" />
              {T(a.rotulo)}
            </button>
          );
        })}
      </nav>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          {aba === "pecas" && (
            <Pecas personagens={personagens} aoMudarFila={recarregarFila} recarregarSinal={sinal} />
          )}
          {aba === "elenco" && <Elenco aoMudarFila={recarregarFila} />}
          {aba === "avulsa" && (
            <ImagemAvulsa trabalhos={fila?.trabalhos || []} aoMudarFila={recarregarFila} />
          )}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <BarraDaFila fila={fila} aoMudar={recarregarFila} />

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {T("Onde o crédito entra")}
            </h3>
            <ul className="mt-2 space-y-2 text-[10px] leading-relaxed text-slate-500">
              <li>
                <span className="text-slate-300">{T("Montar o plano")}</span> —{" "}
                {T("usa um modelo de linguagem, e por isso custa.")}
              </li>
              <li>
                <span className="text-slate-300">{T("Imagem e vídeo")}</span> —{" "}
                {T("de graça, na GPU da casa. O preço é esperar.")}
              </li>
              <li>
                <span className="text-slate-300">{T("Passar na frente")}</span> —{" "}
                {T("compra a hora em que fica pronto, não a qualidade.")}
              </li>
              <li>
                <span className="text-slate-300">{T("Além do limite do dia")}</span> —{" "}
                {T("mesma GPU, mesma qualidade: o crédito compra a continuação.")}
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
