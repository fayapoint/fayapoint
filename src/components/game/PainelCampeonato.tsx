"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  Trophy,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Users,
  Wand2,
  Trash2,
  Crown,
  Target,
  ShieldCheck,
  ListOrdered,
  CalendarDays,
  GitBranch,
  Image as ImageIcon,
  X,
} from "lucide-react";
import type { CopyCampeonato } from "@/lib/game/copy-campeonato";
import type { LinhaClassificacao } from "@/lib/game/campeonato";
import { ORDEM_MATA_MATA } from "@/lib/game/campeonato";
import {
  LIMA,
  OURO,
  RUBRO,
  CINZA,
  CIANO,
  VIOLETA,
  bebas,
  corResultado,
  superficie,
  FUNDO,
} from "@/lib/game/tema";

/**
 * A PÁGINA DO CAMPEONATO.
 *
 * Uma tela só, com quatro leituras que um organizador e um jogador procuram em
 * ordem diferente: **classificação** (quem está ganhando), **calendário** (o
 * que eu jogo), **chaveamento** (quem eu pego se passar) e **artilharia**
 * (quem está decidindo). As abas existem para essas quatro perguntas — não
 * para dividir um formulário.
 *
 * O painel do organizador aparece só para quem organiza, e a checagem de
 * verdade está no servidor: `souOrganizador` aqui decide o que MOSTRAR, nunca
 * o que PERMITIR.
 */

interface TimeDoc {
  _id: string;
  nome: string;
  sigla?: string;
  origem: "ea" | "manual";
  eaClubId?: string;
  cor?: string;
  grupo?: string;
  sourceGrade: string;
  elenco: Array<{ gamertag: string; proName?: string; posicao?: string; overall?: number }>;
}

interface ConfrontoDoc {
  _id: string;
  fase: string;
  rodada: number;
  grupo?: string;
  chave?: number;
  perna?: number;
  mandanteId: string | null;
  visitanteId: string | null;
  golsMandante?: number | null;
  golsVisitante?: number | null;
  status: string;
  sourceGrade: string;
}

interface Payload {
  competicao: {
    _id: string;
    slug: string;
    nome: string;
    descricao?: string;
    formato: string;
    status: string;
    vagas: number;
    plataforma: string;
    regras: { vagasAcesso?: number; vagasRebaixamento?: number };
    campeaoTimeId?: string;
    viceTimeId?: string;
  };
  souOrganizador: boolean;
  times: TimeDoc[];
  confrontos: ConfrontoDoc[];
  classificacao: LinhaClassificacao[];
  grupos: Array<{ grupo: string; linhas: LinhaClassificacao[] }>;
  artilharia: Array<{
    gamertag: string;
    timeNome: string | null;
    gols: number;
    assistencias: number;
    participacoes: number;
    notaMedia: number | null;
  }>;
}

type Aba = "classificacao" | "calendario" | "chaveamento" | "artilharia";

export function PainelCampeonato({ slug, copy }: { slug: string; copy: CopyCampeonato }) {
  const [dado, setDado] = useState<Payload | null | "erro">(null);
  const [aba, setAba] = useState<Aba>("classificacao");

  const carregar = useCallback(() => {
    fetch(`/api/game/campeonato/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setDado)
      .catch(() => setDado("erro"));
  }, [slug]);

  useEffect(carregar, [carregar]);

  const p = copy.painel;

  if (dado === null) {
    return (
      <div className="flex flex-col items-center gap-3 py-32 text-white/55">
        <Loader2 size={26} className="animate-spin" style={{ color: LIMA }} />
        <p className="text-sm">{copy.hub.loading}</p>
      </div>
    );
  }

  if (dado === "erro") {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-dashed border-white/15 px-6 py-16 text-center">
        <AlertTriangle size={28} className="mx-auto" style={{ color: OURO }} />
        <p className="mt-4 text-sm leading-relaxed text-white/65">{copy.hub.error}</p>
        <Link
          href="/game/campeonatos"
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold"
          style={{ background: LIMA, color: FUNDO }}
        >
          <ArrowLeft size={14} />
          {copy.hub.title}
        </Link>
      </div>
    );
  }

  const { competicao: comp, times, confrontos } = dado;
  const temTabela = confrontos.length > 0;
  const ehMataMata = comp.formato !== "pontos-corridos";
  const campeao = comp.campeaoTimeId
    ? times.find((t) => t._id === String(comp.campeaoTimeId))
    : null;

  /**
   * As abas dependem do FORMATO.
   *
   * Num mata-mata puro não existe classificação — e a aba, se aparecesse,
   * mostraria oito times com tudo zerado. Mesa vazia lê como carregamento
   * quebrado, não como "aqui não se aplica" (é a lição da tabela da liga
   * piloto). Então ela simplesmente não existe nesse formato, e a aba inicial
   * passa a ser o chaveamento, que é o que aquele campeonato tem para mostrar.
   */
  const temClassificacao =
    comp.formato !== "mata-mata" ||
    dado.confrontos.some((c) => c.fase === "liga" || c.fase === "grupo");

  const abas: Array<[Aba, string, typeof ListOrdered]> = [
    ...(temClassificacao
      ? ([["classificacao", p.standings, ListOrdered]] as Array<[Aba, string, typeof ListOrdered]>)
      : []),
    ["calendario", p.calendar, CalendarDays],
    ...(ehMataMata
      ? ([["chaveamento", p.bracket, GitBranch]] as Array<[Aba, string, typeof ListOrdered]>)
      : []),
    ["artilharia", p.scorers, Target],
  ];
  const abaAtiva = abas.some(([v]) => v === aba) ? aba : abas[0][0];

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/game/campeonatos"
        className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft size={14} />
        {copy.hub.title}
      </Link>

      {/* ============================== CABEÇALHO ============================== */}
      <header
        className="relative mt-4 overflow-hidden rounded-3xl border p-5 sm:p-7"
        style={superficie(campeao ? OURO : LIMA, "forte")}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span
            className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16"
            style={{
              background: `${campeao ? OURO : LIMA}14`,
              border: `1px solid ${campeao ? OURO : LIMA}44`,
            }}
          >
            <Trophy className="h-7 w-7" style={{ color: campeao ? OURO : LIMA }} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl leading-none sm:text-4xl" style={bebas}>
              {comp.nome.toUpperCase()}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[11px] font-bold">
              <span
                className="rounded-full border px-2.5 py-0.5 uppercase tracking-widest"
                style={{
                  borderColor: `${campeao ? OURO : LIMA}55`,
                  color: campeao ? OURO : LIMA,
                  background: `${campeao ? OURO : LIMA}12`,
                }}
              >
                {copy.status[comp.status] ?? comp.status}
              </span>
              <span className="text-white/50">
                {copy.novo.formats[comp.formato] ?? comp.formato}
              </span>
              <span aria-hidden className="text-white/25">
                ·
              </span>
              <span className="inline-flex items-center gap-1 text-white/50">
                <Users size={11} />
                {times.length}/{comp.vagas}
              </span>
              {dado.souOrganizador && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ background: `${CIANO}1a`, color: CIANO }}
                >
                  <ShieldCheck size={11} />
                  {p.organizer}
                </span>
              )}
            </div>
            {comp.descricao && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
                {comp.descricao}
              </p>
            )}
          </div>
        </div>

        {/* O campeão, quando existe. É a única recompensa da página — e por
            isso o único ouro grande dela (§3 da identidade). */}
        {campeao && (
          <div
            className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3"
            style={{ borderColor: `${OURO}44`, background: `${OURO}10` }}
          >
            <Crown size={18} style={{ color: OURO }} />
            <span
              className="text-[10px] font-extrabold uppercase tracking-widest"
              style={{ color: `${OURO}c0` }}
            >
              {p.champion}
            </span>
            <span className="text-2xl leading-none" style={{ ...bebas, color: OURO }}>
              {campeao.nome.toUpperCase()}
            </span>
            <a
              href={`/api/game/campeonato/${slug}/premio`}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-bold transition-transform hover:-translate-y-0.5"
              style={{ background: OURO, color: FUNDO }}
            >
              <ImageIcon size={14} />
              {p.poster}
            </a>
          </div>
        )}
      </header>

      {/* ============================== PAINEL DO ORGANIZADOR ============================== */}
      {dado.souOrganizador && (
        <PainelOrganizador
          slug={slug}
          copy={copy}
          times={times}
          temTabela={temTabela}
          vagas={comp.vagas}
          aoMudar={carregar}
        />
      )}

      {/* ============================== ABAS ============================== */}
      <div className="mt-10 flex flex-wrap gap-2">
        {abas.map(([valor, rotulo, Icone]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setAba(valor)}
            aria-pressed={abaAtiva === valor}
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
            style={
              abaAtiva === valor
                ? { background: LIMA, color: FUNDO, borderColor: LIMA }
                : {
                    background: "rgba(255,255,255,.05)",
                    color: "rgba(255,255,255,.7)",
                    borderColor: "rgba(255,255,255,.12)",
                  }
            }
          >
            <Icone size={14} />
            {rotulo}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {abaAtiva === "classificacao" && <SecaoClassificacao dado={dado} copy={copy} />}
        {abaAtiva === "calendario" && (
          <SecaoCalendario dado={dado} copy={copy} slug={slug} aoMudar={carregar} />
        )}
        {abaAtiva === "chaveamento" && <SecaoChaveamento dado={dado} copy={copy} />}
        {abaAtiva === "artilharia" && <SecaoArtilharia dado={dado} copy={copy} />}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Painel do organizador                                              */
/* ================================================================== */

function PainelOrganizador({
  slug,
  copy,
  times,
  temTabela,
  vagas,
  aoMudar,
}: {
  slug: string;
  copy: CopyCampeonato;
  times: TimeDoc[];
  temTabela: boolean;
  vagas: number;
  aoMudar: () => void;
}) {
  const p = copy.painel;
  const [modo, setModo] = useState<"ea" | "manual">("ea");
  const [eaClubId, setEaClubId] = useState("");
  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [elencoTexto, setElencoTexto] = useState("");
  const [ocupado, setOcupado] = useState<"" | "inscrevendo" | "gerando" | "apagando">("");
  const [erro, setErro] = useState<string | null>(null);

  async function inscrever(e: React.FormEvent) {
    e.preventDefault();
    if (ocupado) return;
    setOcupado("inscrevendo");
    setErro(null);
    const corpo =
      modo === "ea"
        ? { eaClubId: eaClubId.trim(), sigla: sigla.trim() || undefined }
        : {
            nome: nome.trim(),
            sigla: sigla.trim() || undefined,
            elenco: elencoTexto
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean)
              .map((gamertag) => ({ gamertag })),
          };
    const res = await fetch(`/api/game/campeonato/${slug}/times`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    }).catch(() => null);
    setOcupado("");
    if (res?.ok) {
      setEaClubId("");
      setNome("");
      setSigla("");
      setElencoTexto("");
      aoMudar();
      return;
    }
    setErro((await res?.json().catch(() => null))?.error ?? "não deu para inscrever");
  }

  async function acao(caminho: string, metodo: "POST" | "DELETE", trabalho: typeof ocupado) {
    if (ocupado) return;
    setOcupado(trabalho);
    setErro(null);
    const res = await fetch(`/api/game/campeonato/${slug}/${caminho}`, { method: metodo }).catch(
      () => null
    );
    setOcupado("");
    if (res?.ok) return aoMudar();
    setErro((await res?.json().catch(() => null))?.error ?? "não deu");
  }

  async function removerTime(timeId: string) {
    if (ocupado) return;
    const res = await fetch(`/api/game/campeonato/${slug}/times`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeId }),
    }).catch(() => null);
    if (res?.ok) aoMudar();
  }

  return (
    <section className="mt-4 rounded-3xl border p-5 sm:p-6" style={superficie(CIANO)}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-xl sm:text-2xl" style={bebas}>
          {p.teams.toUpperCase()}
        </h2>
        <span className="text-[12px] font-bold text-white/45">
          {times.length}/{vagas}
        </span>
      </div>

      {/* Times já inscritos */}
      {times.length === 0 ? (
        <p className="mt-3 text-sm text-white/50">{p.teamsEmpty}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {times.map((t) => (
            <span
              key={t._id}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5"
              style={{
                borderColor: t.origem === "ea" ? `${LIMA}44` : "rgba(255,255,255,.14)",
                background: "rgba(255,255,255,.04)",
              }}
            >
              <span
                className="rounded px-1.5 py-px text-[9px] font-black"
                style={{
                  background: t.origem === "ea" ? `${LIMA}1f` : `${CINZA}22`,
                  color: t.origem === "ea" ? LIMA : CINZA,
                }}
                title={t.origem === "ea" ? p.measured : p.declaredWhy}
              >
                {t.sigla || t.nome.slice(0, 3).toUpperCase()}
              </span>
              <span className="text-[13px] font-semibold text-white/85">{t.nome}</span>
              {t.grupo && (
                <span className="text-[10px] font-black" style={{ color: VIOLETA }}>
                  {t.grupo}
                </span>
              )}
              {!temTabela && (
                <button
                  type="button"
                  onClick={() => removerTime(t._id)}
                  aria-label={p.remove}
                  className="text-white/35 transition-colors hover:text-rose-300"
                >
                  <X size={13} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Inscrição */}
      {!temTabela && times.length < vagas && (
        <form onSubmit={inscrever} className="mt-5">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["ea", p.addByEa],
                ["manual", p.addByHand],
              ] as const
            ).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setModo(valor)}
                aria-pressed={modo === valor}
                className="rounded-full border px-3 py-1 text-[11px] font-bold transition-colors"
                style={
                  modo === valor
                    ? { background: `${CIANO}1f`, color: CIANO, borderColor: `${CIANO}66` }
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

          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            {modo === "ea" ? (
              <input
                value={eaClubId}
                onChange={(e) => setEaClubId(e.target.value)}
                placeholder={p.eaIdOrName}
                inputMode="numeric"
                className="rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2.5 text-white outline-none placeholder:text-white/40 focus:border-white/30"
              />
            ) : (
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={p.teamName}
                maxLength={40}
                className="rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2.5 text-white outline-none placeholder:text-white/40 focus:border-white/30"
              />
            )}
            <input
              value={sigla}
              onChange={(e) => setSigla(e.target.value.toUpperCase())}
              placeholder={p.teamShort}
              maxLength={4}
              className="w-full rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2.5 text-center uppercase text-white outline-none placeholder:text-white/40 focus:border-white/30 sm:w-28"
            />
            <button
              type="submit"
              disabled={ocupado !== "" || (modo === "ea" ? !eaClubId.trim() : nome.trim().length < 2)}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-transform disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:-translate-y-0.5"
              style={{ background: CIANO, color: FUNDO }}
            >
              {ocupado === "inscrevendo" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              {ocupado === "inscrevendo" ? p.saving : p.save}
            </button>
          </div>

          {modo === "manual" && (
            <div className="mt-3">
              <textarea
                value={elencoTexto}
                onChange={(e) => setElencoTexto(e.target.value)}
                placeholder={p.squadPlaceholder}
                rows={4}
                className="w-full rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
              />
              <p className="mt-1.5 text-[11px] leading-relaxed text-white/40">{p.squadHelp}</p>
            </div>
          )}
        </form>
      )}

      {/* Gerar / apagar tabela */}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/[0.08] pt-4">
        {!temTabela ? (
          <button
            type="button"
            onClick={() => acao("gerar", "POST", "gerando")}
            disabled={times.length < 2 || ocupado !== ""}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-transform disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:-translate-y-0.5"
            style={{ background: LIMA, color: FUNDO }}
          >
            {ocupado === "gerando" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Wand2 size={14} />
            )}
            {ocupado === "gerando" ? p.generating : p.generate}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => acao("gerar", "DELETE", "apagando")}
            disabled={ocupado !== ""}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-40"
            style={{ borderColor: `${RUBRO}55`, color: RUBRO }}
          >
            {ocupado === "apagando" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            {p.dropTable}
          </button>
        )}
        <p className="max-w-md text-[11.5px] leading-relaxed text-white/45">{p.generateHelp}</p>
      </div>

      {erro && <p className="mt-3 text-[12.5px] font-semibold text-rose-300">{erro}</p>}
    </section>
  );
}

/* ================================================================== */
/* Classificação                                                      */
/* ================================================================== */

function SecaoClassificacao({ dado, copy }: { dado: Payload; copy: CopyCampeonato }) {
  const p = copy.painel;
  const tabelas =
    dado.grupos.length > 0
      ? dado.grupos.map((g) => ({ titulo: `${p.standings} — ${g.grupo}`, linhas: g.linhas }))
      : [{ titulo: p.standings, linhas: dado.classificacao }];

  if (tabelas.every((t) => t.linhas.length === 0)) {
    return (
      <p className="rounded-2xl border border-dashed border-white/12 px-5 py-12 text-center text-sm text-white/55">
        {p.standingsEmpty}
      </p>
    );
  }

  const acesso = dado.competicao.regras.vagasAcesso ?? 0;
  const queda = dado.competicao.regras.vagasRebaixamento ?? 0;

  return (
    <div className="space-y-6">
      {tabelas.map((t) => (
        <div key={t.titulo} className="overflow-hidden rounded-3xl border" style={superficie(LIMA)}>
          {dado.grupos.length > 0 && (
            <p
              className="border-b border-white/10 px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-widest"
              style={{ color: VIOLETA }}
            >
              {t.titulo}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04] text-[10px] font-extrabold uppercase tracking-widest text-white/55">
                  <th className="w-10 py-3 pl-4 text-center">{p.cols.pos}</th>
                  <th className="py-3 pl-2 pr-4 text-left">{p.cols.team}</th>
                  <th className="w-10 px-1 py-3 text-center">{p.cols.played}</th>
                  <th className="w-10 px-1 py-3 text-center">{p.cols.won}</th>
                  <th className="w-10 px-1 py-3 text-center">{p.cols.drawn}</th>
                  <th className="w-10 px-1 py-3 text-center">{p.cols.lost}</th>
                  <th className="w-11 px-1 py-3 text-center">{p.cols.gf}</th>
                  <th className="w-11 px-1 py-3 text-center">{p.cols.ga}</th>
                  <th className="w-11 px-1 py-3 text-center">{p.cols.gd}</th>
                  <th className="w-12 px-1 py-3 text-center" style={{ color: OURO }}>
                    {p.cols.points}
                  </th>
                  <th className="w-28 py-3 pl-2 pr-4 text-left">{p.cols.form}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {t.linhas.map((l) => {
                  const zona =
                    acesso > 0 && l.posicao <= acesso
                      ? OURO
                      : queda > 0 && l.posicao > t.linhas.length - queda
                        ? RUBRO
                        : null;
                  return (
                    <tr key={l.timeId} className="border-t border-white/[0.06]">
                      <td className="relative py-2.5 pl-4 text-center">
                        {zona && (
                          <span
                            aria-hidden
                            className="absolute inset-y-0 left-0 w-[3px]"
                            style={{ background: zona }}
                          />
                        )}
                        <span
                          className="text-xs font-black"
                          style={{ color: zona ?? "rgba(255,255,255,.45)" }}
                        >
                          {l.posicao}
                        </span>
                      </td>
                      <td className="py-2.5 pl-2 pr-4">
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block w-9 shrink-0 rounded px-1 text-center text-[9px] font-black"
                            style={{
                              background: `${l.cor ?? LIMA}1f`,
                              color: l.cor ?? LIMA,
                            }}
                          >
                            {l.sigla || l.nome.slice(0, 3).toUpperCase()}
                          </span>
                          <span className="truncate font-semibold text-white/90">{l.nome}</span>
                        </span>
                      </td>
                      <td className="px-1 py-2.5 text-center text-white/70">{l.jogos}</td>
                      <td className="px-1 py-2.5 text-center font-semibold" style={{ color: LIMA }}>
                        {l.vitorias}
                      </td>
                      <td className="px-1 py-2.5 text-center" style={{ color: CINZA }}>
                        {l.empates}
                      </td>
                      <td className="px-1 py-2.5 text-center" style={{ color: RUBRO }}>
                        {l.derrotas}
                      </td>
                      <td className="px-1 py-2.5 text-center text-white/70">{l.golsPro}</td>
                      <td className="px-1 py-2.5 text-center text-white/70">{l.golsContra}</td>
                      <td
                        className="px-1 py-2.5 text-center font-semibold"
                        style={{ color: l.saldo >= 0 ? LIMA : RUBRO }}
                      >
                        {l.saldo > 0 ? "+" : ""}
                        {l.saldo}
                      </td>
                      <td className="px-1 py-2.5 text-center font-black" style={{ color: OURO }}>
                        {l.pontos}
                      </td>
                      <td className="py-2.5 pl-2 pr-4">
                        <span className="flex gap-1">
                          {l.forma.map((r, i) => (
                            <span
                              key={i}
                              className="flex h-4 w-4 items-center justify-center rounded-[4px] text-[9px] font-black"
                              style={{
                                background: `${corResultado(r)}26`,
                                color: corResultado(r),
                              }}
                            >
                              {r === "win" ? p.cols.won : r === "loss" ? p.cols.lost : p.cols.drawn}
                            </span>
                          ))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/* Calendário                                                         */
/* ================================================================== */

function SecaoCalendario({
  dado,
  copy,
  slug,
  aoMudar,
}: {
  dado: Payload;
  copy: CopyCampeonato;
  slug: string;
  aoMudar: () => void;
}) {
  const p = copy.painel;
  const nomes = useMemo(
    () => new Map(dado.times.map((t) => [t._id, t])),
    [dado.times]
  );

  if (dado.confrontos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/12 px-5 py-12 text-center text-sm text-white/55">
        {p.calendarEmpty}
      </p>
    );
  }

  // Agrupa por fase e rodada — é como um calendário de campeonato se lê.
  const blocos = new Map<string, ConfrontoDoc[]>();
  for (const c of dado.confrontos) {
    const chave =
      c.fase === "liga" || c.fase === "grupo"
        ? `${c.fase}|${c.grupo ?? ""}|${c.rodada}`
        : `${c.fase}||0`;
    blocos.set(chave, [...(blocos.get(chave) ?? []), c]);
  }

  return (
    <div className="space-y-6">
      {[...blocos.entries()].map(([chave, jogos]) => {
        const [fase, grupo, rodada] = chave.split("|");
        const titulo =
          fase === "liga" || fase === "grupo"
            ? `${p.round} ${rodada}${grupo ? ` · ${grupo}` : ""}`
            : copy.fases[fase] ?? fase;
        return (
          <div key={chave}>
            <p className="mb-2 flex items-center gap-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/50">
                {titulo}
              </span>
              <span aria-hidden className="h-px flex-1 bg-white/[0.08]" />
            </p>
            <div className="space-y-2">
              {jogos.map((j) => (
                <LinhaConfronto
                  key={j._id}
                  confronto={j}
                  times={nomes}
                  copy={copy}
                  slug={slug}
                  podeEditar={dado.souOrganizador}
                  aoMudar={aoMudar}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LinhaConfronto({
  confronto: j,
  times,
  copy,
  slug,
  podeEditar,
  aoMudar,
}: {
  confronto: ConfrontoDoc;
  times: Map<string, TimeDoc>;
  copy: CopyCampeonato;
  slug: string;
  podeEditar: boolean;
  aoMudar: () => void;
}) {
  const p = copy.painel;
  const [editando, setEditando] = useState(false);
  const [gm, setGm] = useState(j.golsMandante ?? 0);
  const [gv, setGv] = useState(j.golsVisitante ?? 0);
  const [salvando, setSalvando] = useState(false);

  const casa = j.mandanteId ? times.get(j.mandanteId) : null;
  const fora = j.visitanteId ? times.get(j.visitanteId) : null;
  const decidido = j.golsMandante != null && j.golsVisitante != null;
  const cor = !decidido
    ? "rgba(255,255,255,.14)"
    : j.golsMandante! > j.golsVisitante!
      ? LIMA
      : j.golsMandante! < j.golsVisitante!
        ? RUBRO
        : CINZA;

  async function salvar() {
    if (salvando) return;
    setSalvando(true);
    const res = await fetch(`/api/game/campeonato/${slug}/resultado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confrontoId: j._id, golsMandante: gm, golsVisitante: gv }),
    }).catch(() => null);
    setSalvando(false);
    if (res?.ok) {
      setEditando(false);
      aoMudar();
    }
  }

  const semAdversario = !casa || !fora;

  return (
    <article className="overflow-hidden rounded-2xl border" style={superficie(cor)}>
      <div className="flex items-stretch">
        <span aria-hidden className="w-1 shrink-0" style={{ background: cor }} />
        <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <p className="min-w-0 flex-1 truncate text-right text-sm font-bold">
            {casa?.nome ?? <span className="text-white/35">{p.awaiting}</span>}
          </p>
          <p className="shrink-0 text-2xl leading-none tabular-nums" style={bebas}>
            {decidido ? (
              <>
                <span style={{ color: cor }}>{j.golsMandante}</span>
                <span className="mx-1.5 text-white/25">×</span>
                <span className="text-white/85">{j.golsVisitante}</span>
              </>
            ) : (
              <span className="text-white/25">— × —</span>
            )}
          </p>
          <p className="min-w-0 flex-1 truncate text-sm font-bold text-white/75">
            {fora?.nome ?? <span className="text-white/35">{p.awaiting}</span>}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/[0.07] bg-white/[0.02] px-4 py-2">
        {j.status === "wo" && semAdversario && (
          <span className="text-[11px] font-bold" style={{ color: CIANO }}>
            {p.bye}
          </span>
        )}
        {decidido && (
          <span
            className="rounded px-1.5 py-px text-[9.5px] font-black uppercase tracking-wider"
            style={
              j.sourceGrade === "B"
                ? { background: `${LIMA}1a`, color: LIMA }
                : { background: "rgba(255,255,255,.07)", color: "rgba(255,255,255,.55)" }
            }
            title={j.sourceGrade === "B" ? undefined : p.declaredWhy}
          >
            {j.sourceGrade === "B" ? p.measured : p.declared}
          </span>
        )}

        {podeEditar && !semAdversario && (
          editando ? (
            <span className="ml-auto flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={99}
                value={gm}
                onChange={(e) => setGm(Number(e.target.value))}
                className="w-14 rounded-lg border border-white/12 bg-white/[0.06] px-2 py-1 text-center tabular-nums text-white outline-none focus:border-white/30"
              />
              <span className="text-white/30">×</span>
              <input
                type="number"
                min={0}
                max={99}
                value={gv}
                onChange={(e) => setGv(Number(e.target.value))}
                className="w-14 rounded-lg border border-white/12 bg-white/[0.06] px-2 py-1 text-center tabular-nums text-white outline-none focus:border-white/30"
              />
              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold disabled:opacity-40"
                style={{ background: LIMA, color: FUNDO }}
              >
                {salvando && <Loader2 size={12} className="animate-spin" />}
                {p.save}
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="text-white/40 transition-colors hover:text-white"
              >
                <X size={14} />
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="ml-auto text-[11.5px] font-bold transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,.5)" }}
            >
              {p.setScore}
            </button>
          )
        )}
      </div>
    </article>
  );
}

/* ================================================================== */
/* Chaveamento                                                        */
/* ================================================================== */

function SecaoChaveamento({ dado, copy }: { dado: Payload; copy: CopyCampeonato }) {
  const nomes = new Map(dado.times.map((t) => [t._id, t]));
  const fases = ORDEM_MATA_MATA.filter((f) => dado.confrontos.some((c) => c.fase === f));

  if (fases.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/12 px-5 py-12 text-center text-sm text-white/55">
        {copy.painel.calendarEmpty}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Colunas lado a lado: é a forma que faz o olho ler "árvore" em vez de
          "lista". Em telas estreitas rola na horizontal, dentro do próprio
          contêiner — a página nunca rola de lado. */}
      <div className="flex min-w-max gap-4 pb-2">
        {fases.map((fase) => {
          const jogos = dado.confrontos
            .filter((c) => c.fase === fase && (c.perna ?? 1) === 1)
            .sort((a, b) => (a.chave ?? 0) - (b.chave ?? 0));
          return (
            <div key={fase} className="w-56 shrink-0">
              <p className="mb-2 text-center text-[11px] font-extrabold uppercase tracking-widest text-white/50">
                {copy.fases[fase] ?? fase}
              </p>
              <div className="flex h-full flex-col justify-around gap-3">
                {jogos.map((j) => {
                  const casa = j.mandanteId ? nomes.get(j.mandanteId) : null;
                  const fora = j.visitanteId ? nomes.get(j.visitanteId) : null;
                  const decidido = j.golsMandante != null && j.golsVisitante != null;
                  const venceuCasa = decidido && j.golsMandante! > j.golsVisitante!;
                  const venceuFora = decidido && j.golsVisitante! > j.golsMandante!;
                  return (
                    <div
                      key={j._id}
                      className="overflow-hidden rounded-xl border"
                      style={superficie(fase === "final" ? OURO : LIMA)}
                    >
                      {(
                        [
                          [casa, j.golsMandante, venceuCasa],
                          [fora, j.golsVisitante, venceuFora],
                        ] as const
                      ).map(([time, gols, venceu], i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-2"
                          style={{
                            borderTop: i === 1 ? "1px solid rgba(255,255,255,.07)" : undefined,
                            background: venceu ? `${fase === "final" ? OURO : LIMA}12` : undefined,
                          }}
                        >
                          <span
                            className="truncate text-[12.5px] font-semibold"
                            style={{
                              color: venceu
                                ? fase === "final"
                                  ? OURO
                                  : LIMA
                                : time
                                  ? "rgba(255,255,255,.85)"
                                  : "rgba(255,255,255,.3)",
                            }}
                          >
                            {time?.nome ?? copy.painel.awaiting}
                          </span>
                          <span className="ml-auto text-[13px] font-black tabular-nums text-white/70">
                            {gols ?? "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Artilharia                                                         */
/* ================================================================== */

function SecaoArtilharia({ dado, copy }: { dado: Payload; copy: CopyCampeonato }) {
  const p = copy.painel;
  if (dado.artilharia.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/12 px-5 py-12 text-center text-sm text-white/55">
        {p.scorersEmpty}
      </p>
    );
  }
  const maxPart = Math.max(1, ...dado.artilharia.map((a) => a.participacoes));

  return (
    <div className="overflow-hidden rounded-3xl border" style={superficie(OURO)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04] text-[10px] font-extrabold uppercase tracking-widest text-white/55">
              <th className="w-10 py-3 pl-4 text-center">{p.cols.pos}</th>
              <th className="py-3 pl-2 pr-3 text-left">{p.cols.player}</th>
              <th className="py-3 pr-3 text-left">{p.cols.team}</th>
              <th className="w-12 px-1 py-3 text-center" style={{ color: OURO }}>
                {p.cols.goals}
              </th>
              <th className="w-12 px-1 py-3 text-center">{p.cols.assists}</th>
              <th className="w-14 px-1 py-3 text-center">{p.cols.rating}</th>
              <th className="px-2 py-3 pr-4 text-left">{p.cols.contrib}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {dado.artilharia.map((a, i) => (
              <tr key={a.gamertag} className="border-t border-white/[0.06]">
                <td className="py-2.5 pl-4 text-center">
                  <span
                    className="text-xs font-black"
                    style={{ color: i === 0 ? OURO : "rgba(255,255,255,.4)" }}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="py-2.5 pl-2 pr-3">
                  <span className="flex items-center gap-1.5">
                    {i === 0 && <Crown size={12} style={{ color: OURO }} />}
                    <span className="truncate font-semibold text-white/90">{a.gamertag}</span>
                  </span>
                </td>
                <td className="truncate py-2.5 pr-3 text-[12.5px] text-white/55">
                  {a.timeNome ?? "—"}
                </td>
                <td className="px-1 py-2.5 text-center font-black" style={{ color: OURO }}>
                  {a.gols}
                </td>
                <td className="px-1 py-2.5 text-center" style={{ color: LIMA }}>
                  {a.assistencias}
                </td>
                <td className="px-1 py-2.5 text-center text-white/70">
                  {a.notaMedia != null ? a.notaMedia.toFixed(1) : "—"}
                </td>
                <td className="py-2.5 pl-2 pr-4">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]"
                    >
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${(a.participacoes / maxPart) * 100}%`,
                          background: OURO,
                        }}
                      />
                    </span>
                    <span className="w-7 text-right text-[12px] font-bold text-white/75">
                      {a.participacoes}
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
