"use client";

import { useCallback, useEffect, useState } from "react";
import { getClientAuthHeaders } from "@/lib/client-auth";
import { Radar, Loader2, Check, X, Search, AlertTriangle } from "lucide-react";
import { LIMA, OURO, CIANO, RUBRO, CINZA, FUNDO, bebas, superficie } from "@/lib/game/tema";

/**
 * A FILA DE CAMPEONATOS DESCOBERTOS — 08/09/2026.
 *
 * ## O que é um candidato, e o que ele não é
 *
 * O descobridor varre o espelho procurando grupos de clubes que jogam amistoso
 * 11 contra 11, em SÉRIE, entre si. Essa é a assinatura de um torneio
 * organizado, e ele a acha **sem depender de site nenhum** — o rastro aparece
 * na primeira rodada jogada, não quando o campeonato vira notícia.
 *
 * Mas ele não sabe o nome do campeonato, nem quem organiza, nem o formato. Ele
 * entrega "estes 14 clubes formam um torneio", e mais nada. O apelido que
 * aparece na lista é **palpite**, montado do que os nomes dos clubes têm em
 * comum — serve para reconhecer a linha, nunca para virar título de página.
 *
 * ## Por que esta tela é fechada
 *
 * Um candidato é uma suspeita NOSSA sobre clubes de pessoas reais. Publicá-la
 * seria dizer ao mundo "achamos que estes clubes estão num campeonato" sem ter
 * perguntado a ninguém. A fila é interna; o que vira público é a cobertura,
 * depois que alguém pôs nome e conferiu.
 *
 * ## A decisão é humana, e exige motivo
 *
 * Mesma separação do quadro de integridade: o automático levanta evidência, a
 * pessoa decide, e a decisão fica com quem decidiu e por quê. Descartar sem
 * motivo é a forma mais rápida de ninguém entender, seis meses depois, por que
 * aquele torneio nunca foi coberto.
 */

interface Candidato {
  chave: string;
  apelido: string;
  plataforma: string;
  estado: "novo" | "investigando" | "descartado" | "promovido";
  forca: number;
  densidade: number;
  confrontos: number;
  series: number;
  partidas: number;
  vezesVisto: number;
  clubes: Array<{ clubId: string; nome: string; jogos: number }>;
  primeiraEm: string | null;
  ultimaEm: string | null;
  motivo: string | null;
  copaSlug: string | null;
}

const COR_ESTADO: Record<Candidato["estado"], string> = {
  novo: LIMA,
  investigando: CIANO,
  descartado: CINZA,
  promovido: OURO,
};

export function FilaDeDescobertas() {
  const [dados, setDados] = useState<{ candidatos: Candidato[]; aviso: string } | null | "erro">(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const carregar = useCallback(() => {
    fetch("/api/game/descobertas", { headers: getClientAuthHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setDados)
      .catch(() => setDados("erro"));
  }, []);

  useEffect(carregar, [carregar]);

  const decidir = async (chave: string, estado: string) => {
    // Descartar sem motivo é recusado pelo servidor. Pedir aqui evita a ida
    // inútil e, mais importante, obriga quem decide a formular a razão antes
    // de clicar — que é o ponto da regra, não a validação em si.
    let motivo = "";
    if (estado === "descartado") {
      motivo = window.prompt("Por que este grupo não é um campeonato a cobrir?")?.trim() ?? "";
      if (motivo.length < 3) return;
    }
    let copaSlug = "";
    if (estado === "promovido") {
      copaSlug = window.prompt("Slug da copa que passou a cobri-lo:")?.trim() ?? "";
      if (!copaSlug) return;
    }

    setOcupado(chave);
    try {
      const r = await fetch("/api/game/descobertas", {
        method: "PATCH",
        headers: { "content-type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ chave, estado, motivo, copaSlug }),
      });
      if (r.ok) carregar();
    } finally {
      setOcupado(null);
    }
  };

  if (dados === "erro") {
    return (
      <div style={{ background: FUNDO }} className="min-h-screen p-10 text-white">
        <p className="text-white/70">Esta fila é só para a administração.</p>
      </div>
    );
  }

  return (
    <div style={{ background: FUNDO }} className="min-h-screen text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 style={bebas} className="flex items-center gap-2 text-4xl uppercase tracking-wide">
          <Radar className="h-8 w-8" style={{ color: LIMA }} />
          Campeonatos achados
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          Grupos de clubes que jogam amistoso 11 contra 11, em série, entre si — a
          assinatura de um torneio organizado. Achados no nosso próprio acervo, sem
          depender de site nenhum: o rastro aparece na primeira rodada jogada, não quando
          o campeonato vira notícia.
        </p>

        {dados === null && (
          <div className="mt-8 flex items-center gap-3 text-white/40">
            <Loader2 className="h-4 w-4 animate-spin" /> lendo a fila…
          </div>
        )}

        {dados && dados.aviso && (
          <p
            style={superficie(OURO)}
            className="mt-6 flex items-start gap-2 rounded-xl border p-3 text-xs leading-relaxed text-white/60"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: OURO }} />
            {dados.aviso}
          </p>
        )}

        {dados && dados.candidatos.length === 0 && (
          <div style={superficie(CINZA)} className="mt-6 rounded-2xl border p-6">
            <p className="text-sm text-white/65">
              Nenhum candidato na fila. Isso quer dizer que todo aglomerado com cara de
              torneio no acervo já é uma copa que a gente cobre.
            </p>
            <p className="mt-2 text-xs text-white/35">
              A varredura roda de hora em hora, junto do coletor. Quando um grupo novo
              aparecer, ele cai aqui sozinho.
            </p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {dados &&
            dados.candidatos.map((c) => (
              <div key={c.chave} style={superficie(COR_ESTADO[c.estado])} className="rounded-2xl border p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p style={bebas} className="text-xl uppercase tracking-wide">
                      {c.apelido}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/35">
                      visto {c.vezesVisto}× · {c.plataforma}
                      {c.primeiraEm && c.ultimaEm && (
                        <>
                          {" "}
                          · {new Date(c.primeiraEm).toLocaleDateString("pt-BR")} →{" "}
                          {new Date(c.ultimaEm).toLocaleDateString("pt-BR")}
                        </>
                      )}
                    </p>
                  </div>
                  <span
                    style={{ borderColor: `${COR_ESTADO[c.estado]}55`, color: COR_ESTADO[c.estado] }}
                    className="shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-widest"
                  >
                    {c.estado}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-white/50">
                  <span>
                    força <strong style={{ color: COR_ESTADO[c.estado] }}>{c.forca}</strong>
                  </span>
                  <span title="Séries por clube. Abaixo de 0,3 quase nunca é torneio — costuma ser um clube-polo jogando muito amistoso.">
                    densidade <strong className="text-white/80">{c.densidade}</strong>
                  </span>
                  <span>{c.clubes.length} clubes</span>
                  <span>{c.series} séries</span>
                  <span>{c.confrontos} confrontos</span>
                  <span>{c.partidas} partidas</span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-white/45">
                  {c.clubes.slice(0, 12).map((x) => x.nome).join(" · ")}
                  {c.clubes.length > 12 && ` +${c.clubes.length - 12}`}
                </p>

                {c.motivo && (
                  <p className="mt-2 text-xs text-white/40">
                    <strong className="text-white/60">motivo:</strong> {c.motivo}
                  </p>
                )}
                {c.copaSlug && (
                  <p className="mt-2 text-xs" style={{ color: OURO }}>
                    coberto por <strong>{c.copaSlug}</strong>
                  </p>
                )}

                {c.estado !== "promovido" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {c.estado !== "investigando" && (
                      <Botao
                        cor={CIANO}
                        icone={Search}
                        rotulo="investigar"
                        ocupado={ocupado === c.chave}
                        onClick={() => decidir(c.chave, "investigando")}
                      />
                    )}
                    <Botao
                      cor={OURO}
                      icone={Check}
                      rotulo="virou copa"
                      ocupado={ocupado === c.chave}
                      onClick={() => decidir(c.chave, "promovido")}
                    />
                    {c.estado !== "descartado" && (
                      <Botao
                        cor={RUBRO}
                        icone={X}
                        rotulo="descartar"
                        ocupado={ocupado === c.chave}
                        onClick={() => decidir(c.chave, "descartado")}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function Botao({
  cor,
  icone: Icone,
  rotulo,
  ocupado,
  onClick,
}: {
  cor: string;
  icone: typeof Check;
  rotulo: string;
  ocupado: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={ocupado}
      onClick={onClick}
      style={{ borderColor: `${cor}55`, color: cor }}
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition enabled:hover:brightness-125 disabled:opacity-40"
    >
      {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icone className="h-3.5 w-3.5" />}
      {rotulo}
    </button>
  );
}
