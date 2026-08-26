"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  Search,
  Shield,
  ChevronRight,
  Loader2,
  HelpCircle,
  Hash,
  Gamepad2,
  Radar,
} from "lucide-react";
import type { GameCopy } from "@/lib/game/copy";
import type { ClubSearchResult, EaPlatform } from "@/lib/game/ea-api";
import { SeloProcedencia, type FonteDado } from "./SeloProcedencia";
import { LIMA, OURO, RUBRO, CINZA, CIANO, superficie, FUNDO, bebas } from "@/lib/game/tema";

type Piscina = "todas" | EaPlatform;

interface Resposta {
  clubs: ClubSearchResult[];
  varridos: number;
  aproximado: boolean;
  porId: boolean;
  /** De onde veio o resultado: fonte viva da EA ou o nosso acervo. */
  fonte: FonteDado;
  capturedAt: string | null;
}

/**
 * BUSCA DE CLUBE — reescrita em 25/08/2026.
 *
 * A v1 mandava o termo cru para uma consulta só, numa piscina só. Com isso ela
 * herdava, sem avisar, os três limites da busca da EA:
 *
 *  - o casamento é de PREFIXO da string inteira ("Sul" não acha "Leões do Sul");
 *  - o espaço é LITERAL, e o jogo guarda nomes com espaço duplo
 *    ("Flamengo     00" tem cinco espaços — nenhuma digitação humana acerta);
 *  - sem `maxResultCount` a EA devolve ~14 linhas.
 *
 * Resultado prático: clube existente aparecia como inexistente. O motor novo
 * (`buscarClubes`) varre prefixos nas duas piscinas e filtra do nosso lado;
 * aqui em cima ficaram as três coisas que só a interface resolve — escolher a
 * geração de console, aceitar o ID do clube, e DIZER por que não achou quando
 * não achar, em vez de um "nenhum resultado" mudo.
 */
export function BuscaClube({ copy }: { copy: GameCopy }) {
  const [nome, setNome] = useState("");
  const [piscina, setPiscina] = useState<Piscina>("todas");
  const [resposta, setResposta] = useState<Resposta | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [ajuda, setAjuda] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const c = copy.search;
  const ehId = /^\d{4,12}$/.test(nome.trim());

  // Quando a busca volta vazia, o painel de ajuda abre sozinho: é exatamente
  // o momento em que a pessoa precisa dele, e esperar que ela clique num
  // "por quê?" discreto foi o que custou dois dias de procura.
  useEffect(() => {
    if (resposta && resposta.clubs.length === 0) setAjuda(true);
  }, [resposta]);

  async function buscar(e?: React.FormEvent) {
    e?.preventDefault();
    const termo = nome.trim();
    if (termo.length < 2) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setBuscando(true);
    try {
      const res = await fetch(
        `/api/game/ea/busca?nome=${encodeURIComponent(termo)}&plataforma=${piscina}`,
        { signal: ctrl.signal }
      );
      const data = await res.json();
      setResposta({
        clubs: Array.isArray(data.clubs) ? data.clubs : [],
        varridos: Number(data.varridos ?? 0),
        aproximado: Boolean(data.aproximado),
        fonte: (data.fonte ?? "vazio") as FonteDado,
        capturedAt: data.capturedAt ?? null,
        porId: Boolean(data.porId),
      });
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setResposta({
          clubs: [],
          varridos: 0,
          aproximado: false,
          porId: false,
          fonte: "vazio",
          capturedAt: null,
        });
      }
    } finally {
      if (!ctrl.signal.aborted) setBuscando(false);
    }
  }

  return (
    <div id="buscar" className="scroll-mt-28">
      {/* ---------------- Seletor de geração ---------------- */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-white/45">
          <Gamepad2 size={12} />
          {c.platformLabel}
        </span>
        {(
          [
            ["todas", c.platformAll],
            ["common-gen5", c.platformGen5],
            ["common-gen4", c.platformGen4],
          ] as const
        ).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setPiscina(valor)}
            aria-pressed={piscina === valor}
            className="rounded-full border px-3 py-1 text-[11px] font-bold transition-colors"
            style={
              piscina === valor
                ? { background: `${LIMA}1f`, color: LIMA, borderColor: `${LIMA}66` }
                : {
                    background: "rgba(255,255,255,.04)",
                    color: "rgba(255,255,255,.6)",
                    borderColor: "rgba(255,255,255,.12)",
                  }
            }
          >
            {rotulo}
          </button>
        ))}
      </div>

      <form onSubmit={buscar} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          {ehId ? (
            <Hash className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: LIMA }} />
          ) : (
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
          )}
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder={c.placeholder}
            className="w-full rounded-xl border border-white/12 bg-white/[0.06] py-4 pl-12 pr-4 text-white outline-none transition-colors placeholder:text-white/45 focus:border-[color:var(--lima)] focus:bg-white/[0.08]"
            style={{ ["--lima" as string]: `${LIMA}99` }}
            maxLength={60}
          />
        </div>
        <button
          type="submit"
          disabled={buscando || nome.trim().length < 2}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 font-bold transition-transform disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:-translate-y-0.5"
          style={{ background: LIMA, color: FUNDO }}
        >
          {buscando && <Loader2 size={16} className="animate-spin" />}
          {buscando ? c.searching : c.button}
        </button>
      </form>

      <p className="mt-2 text-[11px] text-white/40">{c.idHint}</p>

      {/* ---------------- Resultados ---------------- */}
      {resposta && (
        <div className="mt-4">
          {/* Linha de procedência: quantos clubes foram varridos de verdade. */}
          {resposta.varridos > 0 && (
            <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/45">
                <Radar size={12} style={{ color: CIANO }} />
                {c.scanned.replace("{n}", String(resposta.varridos))}
              </span>
              <SeloProcedencia
                fonte={resposta.fonte}
                capturedAt={resposta.capturedAt}
                copy={copy}
              />
            </p>
          )}

          {resposta.aproximado && resposta.clubs.length > 0 && (
            <p
              className="mb-2 rounded-xl border px-3 py-2 text-[12px] font-semibold"
              style={{ borderColor: `${OURO}44`, background: `${OURO}12`, color: `${OURO}e6` }}
            >
              {c.approxTitle}
            </p>
          )}

          <div className="space-y-2">
            {resposta.clubs.length === 0 && (
              <p className="rounded-xl border border-dashed border-white/12 px-4 py-6 text-center text-sm leading-relaxed text-white/60">
                {c.empty}
              </p>
            )}
            {resposta.clubs.map((clube) => (
              <CartaoResultado key={`${clube.platform}-${clube.clubId}`} clube={clube} copy={copy} />
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Painel de ajuda ---------------- */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setAjuda((v) => !v)}
          aria-expanded={ajuda}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold transition-colors hover:text-white"
          style={{ color: ajuda ? LIMA : "rgba(255,255,255,.55)" }}
        >
          <HelpCircle size={13} />
          {c.helpTitle}
        </button>
        {ajuda && (
          <ul className="mt-3 space-y-2 rounded-2xl border border-white/[0.09] bg-white/[0.02] p-4">
            {c.helpItems.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-white/65">
                <span
                  className="mt-[3px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-black"
                  style={{ background: `${LIMA}1f`, color: LIMA }}
                >
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Uma linha de resultado. A v1 mostrava nome + "ID · região 5456205" — e o
 * número da região não ajuda ninguém a reconhecer o próprio time. Aqui a linha
 * carrega o que de fato distingue dois clubes de nome parecido: a divisão em
 * que estão, a campanha, o estádio escolhido e em qual console vivem.
 */
function CartaoResultado({ clube, copy }: { clube: ClubSearchResult; copy: GameCopy }) {
  const c = copy.search;
  const jogou = clube.gamesPlayed > 0;
  const gen4 = clube.platform === "common-gen4";

  return (
    <Link
      href={`/game/clube/${clube.clubId}?p=${clube.platform}`}
      className="group flex items-center gap-4 rounded-xl border px-4 py-3 transition-transform hover:-translate-y-0.5"
      style={superficie(LIMA)}
    >
      <span
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${LIMA}1a`, border: `1px solid ${LIMA}3a` }}
      >
        <Shield className="h-5 w-5" style={{ color: LIMA }} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate font-bold text-white">{clube.name}</span>
          {clube.currentDivision != null && clube.currentDivision > 0 && (
            <span
              className="rounded px-1.5 py-px text-[10px] font-black uppercase tracking-wider"
              style={{ background: `${CIANO}1f`, color: CIANO }}
            >
              {c.divisionShort} {clube.currentDivision}
            </span>
          )}
          {gen4 && (
            <span
              className="rounded px-1.5 py-px text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "rgba(255,255,255,.07)", color: "rgba(255,255,255,.6)" }}
            >
              {c.platformGen4}
            </span>
          )}
        </p>

        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-white/45">
          <span className="tabular-nums">ID {clube.clubId}</span>
          {jogou && (
            <>
              <span aria-hidden>·</span>
              <span className="tabular-nums">
                <span style={{ color: LIMA }}>{clube.wins}</span>
                <span className="mx-px text-white/30">/</span>
                <span style={{ color: CINZA }}>{clube.ties}</span>
                <span className="mx-px text-white/30">/</span>
                <span style={{ color: RUBRO }}>{clube.losses}</span>
              </span>
              <span aria-hidden>·</span>
              <span className="tabular-nums">{clube.gamesPlayed} J</span>
            </>
          )}
          {clube.stadName && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{clube.stadName}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <span className="italic opacity-80">{c.foundBy[clube.match]}</span>
        </p>
      </div>

      {clube.skillRating != null && clube.skillRating > 0 && (
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-xl leading-none tabular-nums" style={{ ...bebas, color: OURO }}>
            {clube.skillRating}
          </span>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-white/40">
            skill
          </span>
        </span>
      )}

      <ChevronRight
        className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
        style={{ color: LIMA }}
      />
    </Link>
  );
}
