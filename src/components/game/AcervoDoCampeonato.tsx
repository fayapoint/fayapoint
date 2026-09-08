"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, History, Loader2, Minus } from "lucide-react";
import { LIMA, OURO, RUBRO, CINZA, bebas, superficie } from "@/lib/game/tema";

/**
 * O ACERVO NA TELA — quem subiu e quem caiu. 08/09/2026.
 *
 * ## Por que este componente existe (e por que quase não existiu)
 *
 * O acervo foi construído hoje: fotografia diária de cada time e cada jogador,
 * gravada porque a EA guarda só 10 amistosos por clube e o acumulado ENCOLHE
 * quando a fonte descarta o resto. A API de leitura ficou pronta em seguida.
 *
 * E aí parou. Dado gravado, rota funcionando, **nenhuma tela consumindo**.
 *
 * É exatamente o erro que custou caro hoje de manhã, quando o Ricardo abriu o
 * `/game` e disse "não vejo nada do que fizemos": rota nova sem entrada é rota
 * que não existe. A diferença é que dessa vez eu peguei antes dele.
 *
 * ## O estado que mais importa é o VAZIO
 *
 * Com menos de dois dias de fotografia não há movimento para mostrar — e a
 * tela precisa dizer isso, não desenhar zeros. "Onze times parados" lê como
 * observação ("ninguém pontuou") quando é ausência de medida ("ainda não temos
 * com o que comparar"). A API já se recusa a declarar movimento nesse caso; a
 * tela repete a recusa em português.
 *
 * Hoje é o primeiro dia, então é justamente esse o estado que vai aparecer.
 * Ele não é um placeholder: é a promessa do que a tela vira amanhã.
 */

interface Movimento {
  chave: string;
  de: number;
  para: number;
  delta: number;
}

interface Resposta {
  campo: string;
  dias: number;
  diasComFotografia: number;
  subiram: Movimento[];
  cairam: Movimento[];
  parados: number | null;
  aviso: string | null;
}

export function AcervoDoCampeonato({
  escopo,
  refId,
  titulo = "O que mudou",
}: {
  escopo: "copa" | "competicao";
  refId: string;
  titulo?: string;
}) {
  const [d, setD] = useState<Resposta | null | "erro">(null);

  useEffect(() => {
    fetch(`/api/game/acervo/${escopo}/${encodeURIComponent(refId)}?dias=7`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setD)
      .catch(() => setD("erro"));
  }, [escopo, refId]);

  // Erro de rede aqui não merece bloco vermelho na página: o acervo é um
  // extra, e uma falha nele não pode parecer que a copa quebrou.
  if (d === "erro") return null;

  return (
    <section className="mt-14">
      <h2 style={bebas} className="flex items-center gap-2 text-3xl uppercase tracking-wide">
        <History className="h-6 w-6" style={{ color: OURO }} />
        {titulo}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-white/50">
        Guardamos uma fotografia por dia de cada time. É o único lugar onde o histórico
        deste campeonato dura — a EA guarda só as 10 últimas partidas amistosas de cada
        clube e descarta o resto.
      </p>

      {d === null && (
        <div className="mt-6 flex items-center gap-3 text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" />
          lendo o acervo…
        </div>
      )}

      {d && d.aviso && (
        <div
          style={superficie(CINZA)}
          className="mt-6 flex items-start gap-3 rounded-2xl border p-5"
        >
          <Minus className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
          <div>
            <p className="text-sm leading-relaxed text-white/65">{d.aviso}</p>
            <p className="mt-2 text-xs text-white/35">
              O acervo começou hoje. A partir da segunda fotografia esta seção passa a
              mostrar quem subiu e quem caiu na semana.
            </p>
          </div>
        </div>
      )}

      {d && !d.aviso && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Coluna
            titulo="Em alta"
            icone={TrendingUp}
            cor={LIMA}
            linhas={d.subiram}
            vazio="Ninguém somou ponto no período."
          />
          <Coluna
            titulo="Em baixa"
            icone={TrendingDown}
            cor={RUBRO}
            linhas={d.cairam}
            vazio="Ninguém perdeu posição no período."
          />
        </div>
      )}

      {d && (
        <p className="mt-3 text-[11px] text-white/30">
          {d.diasComFotografia} dia(s) de fotografia nos últimos {d.dias} · comparando por{" "}
          {d.campo}
        </p>
      )}
    </section>
  );
}

function Coluna({
  titulo,
  icone: Icone,
  cor,
  linhas,
  vazio,
}: {
  titulo: string;
  icone: typeof TrendingUp;
  cor: string;
  linhas: Movimento[];
  vazio: string;
}) {
  return (
    <div style={superficie(cor)} className="rounded-2xl border p-4">
      <p className="flex items-center gap-2 text-sm font-medium" style={{ color: cor }}>
        <Icone className="h-4 w-4" />
        {titulo}
      </p>
      {linhas.length === 0 ? (
        <p className="mt-3 text-sm text-white/40">{vazio}</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {linhas.map((l) => (
            <li key={l.chave} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-white/80">{l.chave}</span>
              <span className="shrink-0 text-xs text-white/35">
                {l.de} → {l.para}
              </span>
              <span style={{ ...bebas, color: cor }} className="w-10 shrink-0 text-right text-base">
                {l.delta > 0 ? "+" : ""}
                {l.delta}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
