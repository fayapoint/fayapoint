"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  Users,
  UserPlus,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Clock,
  Gamepad2,
  MapPin,
  Image as ImageIcon,
  Send,
  X,
  CheckCircle2,
  TrendingUp,
  Star,
} from "lucide-react";
import type { CopyMercado } from "@/lib/game/copy-mercado";
import { CODIGOS_DIA } from "@/lib/game/copy-mercado";
import { POSICOES, posicaoPorCode } from "@/lib/game/posicoes";
import type { VagaSerializada, EstatisticasMercado } from "@/lib/game/mercado-servidor";
import { AvatarJogador } from "./AvatarJogador";
import { SeloReputacao, AvaliarModal } from "./ReputacaoUI";
import {
  LIMA,
  OURO,
  CIANO,
  VIOLETA,
  FUNDO,
  bebas,
  superficie,
  corSetor,
} from "@/lib/game/tema";

/**
 * O MERCADO — a vitrine de transferências do Winners 22.
 *
 * É a resposta direta à pesquisa nos grupos: lá, achar time ou jogador é rolar
 * dezenas de posts-imagem sem filtro. Aqui, o mesmo mercado é dado — filtra por
 * posição, plataforma e horário num clique, mostra a divisão REAL do clube
 * (puxada do espelho da EA), e gera o cartaz de recrutamento sozinho.
 *
 * A tela tem três camadas: os DADOS DO MERCADO no topo (o que o Ricardo pediu
 * para orientar quem vai se anunciar), o FILTRO + as duas abas, e os CARDS.
 */

const PLAT_ROTULO: Record<string, string> = {
  "common-gen5": "PS5 · Series · PC",
  "common-gen4": "PS4 · Xbox One",
  mista: "Cross-gen",
};

type Aba = "clube" | "jogador";

interface Prefill {
  eaClubId?: string;
  clubeNome?: string;
  plataforma?: string;
}

export function Mercado({ copy, locale }: { copy: CopyMercado; locale: string }) {
  const [aba, setAba] = useState<Aba>("clube");
  const [posicao, setPosicao] = useState<string>("");
  const [plataforma, setPlataforma] = useState<string>("");
  const [ordenar, setOrdenar] = useState<string>("recentes");
  const [busca, setBusca] = useState<string>("");
  const [buscaAtiva, setBuscaAtiva] = useState<string>("");
  const [lista, setLista] = useState<VagaSerializada[] | null | "erro">(null);
  const [stats, setStats] = useState<EstatisticasMercado | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [prefill, setPrefill] = useState<Prefill | null>(null);

  // "Recrutar" vindo da central do clube: /game/mercado?recrutar=<clubId>&nome=&plat=
  // Abre o formulário já preenchido, como clube — a vaga nasce verificada.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const clubId = p.get("recrutar");
    if (clubId) {
      setPrefill({
        eaClubId: clubId,
        clubeNome: p.get("nome") ?? "",
        plataforma: p.get("plat") ?? "common-gen5",
      });
      setAba("clube");
      setPublicando(true);
    }
  }, []);

  const carregar = useCallback(() => {
    setLista(null);
    const p = new URLSearchParams({ tipo: aba, ordenar });
    if (posicao) p.set("posicao", posicao);
    if (plataforma) p.set("plataforma", plataforma);
    if (buscaAtiva) p.set("q", buscaAtiva);
    fetch(`/api/game/mercado?${p.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setLista(Array.isArray(d.vagas) ? d.vagas : []))
      .catch(() => setLista("erro"));
  }, [aba, posicao, plataforma, ordenar, buscaAtiva]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    fetch("/api/game/mercado/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d))
      .catch(() => {});
  }, []);

  const temFiltro = !!(posicao || plataforma || buscaAtiva);
  function limpar() {
    setPosicao("");
    setPlataforma("");
    setBusca("");
    setBuscaAtiva("");
    setOrdenar("recentes");
  }

  return (
    <section>
      {/* -------------------- DADOS DO MERCADO -------------------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <NumeroGrande
          cor={LIMA}
          icone={Users}
          valor={stats?.clubesRecrutando}
          rotulo={copy.stats.clubesRecrutando}
        />
        <NumeroGrande
          cor={CIANO}
          icone={UserPlus}
          valor={stats?.jogadoresLivres}
          rotulo={copy.stats.jogadoresLivres}
        />
        <NumeroGrande
          cor={VIOLETA}
          icone={TrendingUp}
          valor={stats?.posicaoMaisPedida?.sigla}
          textoValor
          rotulo={copy.stats.posicaoMaisPedida}
          sub={stats?.posicaoMaisPedida ? `${stats.posicaoMaisPedida.total}×` : undefined}
        />
        <NumeroGrande
          cor={OURO}
          icone={Plus}
          valor={stats?.novasNaSemana}
          rotulo={copy.stats.novasNaSemana}
        />
      </div>

      {/* Demanda por posição — a barra que orienta quem vai se anunciar */}
      {stats && stats.demandaPosicoes.length > 0 && (
        <BarraDemanda demanda={stats.demandaPosicoes} />
      )}

      {/* -------------------- Abas + publicar -------------------- */}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <div className="flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          {(["clube", "jogador"] as Aba[]).map((t) => {
            const ativo = aba === t;
            const cor = t === "clube" ? LIMA : CIANO;
            const Icone = t === "clube" ? Users : UserPlus;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setAba(t)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors"
                style={{
                  background: ativo ? `${cor}1c` : "transparent",
                  color: ativo ? cor : "rgba(255,255,255,.55)",
                }}
              >
                <Icone size={15} />
                {t === "clube" ? copy.abas.clubes : copy.abas.jogadores}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setPublicando((v) => !v)}
          className="ml-auto inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5"
          style={{ background: OURO, color: FUNDO }}
        >
          <Plus size={16} />
          {copy.publicar.abrir}
        </button>
      </div>

      {publicando && (
        <FormPublicar
          copy={copy}
          abaInicial={aba}
          prefill={prefill}
          aoFechar={() => {
            setPublicando(false);
            setPrefill(null);
          }}
          aoPublicar={() => {
            setPublicando(false);
            setPrefill(null);
            carregar();
          }}
        />
      )}

      {/* -------------------- Filtros -------------------- */}
      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
            {copy.filtros.posicao}
          </span>
          <FiltroPosicao valor={posicao} aoMudar={setPosicao} copy={copy} />
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
              {copy.filtros.plataforma}
            </span>
            <select
              value={plataforma}
              onChange={(e) => setPlataforma(e.target.value)}
              className="mt-1 block rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-white/30"
            >
              <option value="" style={{ color: "#000" }}>{copy.filtros.todasPlat}</option>
              <option value="common-gen5" style={{ color: "#000" }}>{copy.filtros.gen5}</option>
              <option value="common-gen4" style={{ color: "#000" }}>{copy.filtros.gen4}</option>
              <option value="mista" style={{ color: "#000" }}>{copy.filtros.mista}</option>
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
              {copy.filtros.ordenar}
            </span>
            <select
              value={ordenar}
              onChange={(e) => setOrdenar(e.target.value)}
              className="mt-1 block rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-white/30"
            >
              <option value="recentes" style={{ color: "#000" }}>{copy.filtros.ordRecentes}</option>
              {aba === "clube" && <option value="divisao" style={{ color: "#000" }}>{copy.filtros.ordDivisao}</option>}
              {aba === "jogador" && <option value="overall" style={{ color: "#000" }}>{copy.filtros.ordOverall}</option>}
            </select>
          </label>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setBuscaAtiva(busca.trim());
            }}
            className="flex min-w-[220px] flex-1 items-end gap-2"
          >
            <label className="block flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
                {copy.filtros.busca}
              </span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-3 focus-within:border-white/30">
                <Search size={15} className="text-white/40" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder={copy.filtros.buscaPlaceholder}
                  className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/40"
                />
              </div>
            </label>
          </form>

          {temFiltro && (
            <button
              type="button"
              onClick={limpar}
              className="rounded-xl px-3 py-2.5 text-xs font-bold text-white/55 transition-colors hover:text-white"
            >
              {copy.filtros.limpar}
            </button>
          )}
        </div>
      </div>

      {/* -------------------- Cards -------------------- */}
      <div className="mt-6">
        {lista === null && (
          <p className="flex items-center gap-2 py-12 text-sm text-white/50">
            <Loader2 size={15} className="animate-spin" />
            {copy.hub.loading}
          </p>
        )}
        {lista === "erro" && <p className="py-12 text-sm text-white/55">{copy.hub.error}</p>}
        {Array.isArray(lista) && lista.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/12 px-5 py-16 text-center text-sm text-white/55">
            {temFiltro
              ? copy.vazio.filtro
              : aba === "clube"
              ? copy.vazio.clubes
              : copy.vazio.jogadores}
          </div>
        )}
        {Array.isArray(lista) && lista.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {lista.map((v) => (
              <CardVaga key={v._id} vaga={v} copy={copy} locale={locale} aoMudar={carregar} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ================================================================== */
/* Dados do mercado                                                    */
/* ================================================================== */

function NumeroGrande({
  cor,
  icone: Icone,
  valor,
  rotulo,
  sub,
  textoValor,
}: {
  cor: string;
  icone: typeof Users;
  valor: number | string | undefined;
  rotulo: string;
  sub?: string;
  textoValor?: boolean;
}) {
  return (
    <div className="rounded-2xl border p-4" style={superficie(cor)}>
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${cor}1a`, border: `1px solid ${cor}3a` }}
        >
          <Icone size={15} style={{ color: cor }} />
        </span>
        {sub && (
          <span className="ml-auto rounded px-1.5 py-px text-[11px] font-black" style={{ background: `${cor}1f`, color: cor }}>
            {sub}
          </span>
        )}
      </div>
      <div
        className="mt-3 leading-none"
        style={{ ...bebas, fontSize: textoValor ? "2.2rem" : "2.6rem", color: valor == null ? "rgba(255,255,255,.25)" : "#fff" }}
      >
        {valor == null ? "—" : valor}
      </div>
      <div className="mt-1 text-[11.5px] font-semibold uppercase tracking-wide text-white/50">{rotulo}</div>
    </div>
  );
}

function BarraDemanda({ demanda }: { demanda: EstatisticasMercado["demandaPosicoes"] }) {
  const max = Math.max(...demanda.map((d) => d.total), 1);
  return (
    <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        {demanda.map((d) => {
          const setor = posicaoPorCode(d.code)?.setor ?? "—";
          const cor = corSetor(setor);
          return (
            <div key={d.code} className="flex min-w-[54px] flex-1 flex-col items-center gap-1">
              <span className="text-[12px] font-black tabular-nums" style={{ color: cor }}>{d.total}</span>
              <div className="flex h-16 w-full items-end justify-center">
                <div
                  className="w-6 rounded-t"
                  style={{ height: `${Math.max(8, (d.total / max) * 100)}%`, background: cor, opacity: 0.85 }}
                />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/55">{d.sigla}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Filtro de posição                                                   */
/* ================================================================== */

function FiltroPosicao({
  valor,
  aoMudar,
  copy,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  copy: CopyMercado;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <ChipFiltro ativo={valor === ""} cor="#94a3b8" onClick={() => aoMudar("")}>
        {copy.filtros.todas}
      </ChipFiltro>
      {POSICOES.filter((p) => p.code !== "TODAS").map((p) => {
        const cor = corSetor(p.setor);
        return (
          <ChipFiltro key={p.code} ativo={valor === p.code} cor={cor} onClick={() => aoMudar(p.code)}>
            {p.sigla}
          </ChipFiltro>
        );
      })}
    </div>
  );
}

function ChipFiltro({
  ativo,
  cor,
  onClick,
  children,
}: {
  ativo: boolean;
  cor: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-2.5 py-1.5 text-[12px] font-extrabold uppercase tracking-wide transition-colors"
      style={{
        background: ativo ? cor : `${cor}14`,
        color: ativo ? FUNDO : cor,
        border: `1px solid ${cor}${ativo ? "" : "33"}`,
      }}
    >
      {children}
    </button>
  );
}

/* ================================================================== */
/* Card da vaga                                                        */
/* ================================================================== */

function CardVaga({
  vaga,
  copy,
  locale,
  aoMudar,
}: {
  vaga: VagaSerializada;
  copy: CopyMercado;
  locale: string;
  aoMudar: () => void;
}) {
  const ehClube = vaga.tipo === "clube";
  const cor = ehClube ? LIMA : CIANO;
  const verificado = vaga.sourceGrade === "B";
  const [candidatando, setCandidatando] = useState(false);
  const [feito, setFeito] = useState(false);
  const [avaliando, setAvaliando] = useState(false);
  const [rep, setRep] = useState(vaga.reputacao);
  const nome = ehClube ? vaga.clubeNome : vaga.proName || vaga.gamertag;
  const div = vaga.clubeSnapshot?.currentDivision;

  const cartazUrl = `/api/game/mercado/${vaga._id}/cartaz${locale === "en" ? "?lang=en" : ""}`;

  async function alterarStatus(status: "preenchida" | "ativa") {
    await fetch(`/api/game/mercado/${vaga._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    aoMudar();
  }

  return (
    <div className="flex flex-col rounded-2xl border p-5" style={superficie(cor)}>
      {/* topo: identidade + selo */}
      <div className="flex items-start gap-3">
        {ehClube ? (
          <span
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${cor}1a`, border: `1px solid ${cor}3a` }}
          >
            <ShieldCheck size={22} style={{ color: cor }} />
          </span>
        ) : (
          <span className="shrink-0">
            <AvatarJogador seed={vaga.avatarSeed} size={48} status="online" titulo={nome} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-1.5 py-px text-[10px] font-black uppercase tracking-wide"
              style={{ background: `${cor}1f`, color: cor }}
            >
              {ehClube ? copy.card.recrutando : copy.card.livre}
            </span>
            {vaga.demo && (
              <span className="rounded bg-white/10 px-1.5 py-px text-[10px] font-bold text-white/55">
                {copy.card.demo}
              </span>
            )}
            {vaga.ehDono && (
              <span className="rounded px-1.5 py-px text-[10px] font-bold" style={{ background: `${OURO}1f`, color: OURO }}>
                {copy.card.ownerBadge}
              </span>
            )}
          </div>
          <h3 className="mt-1 truncate text-lg font-black text-white">{nome}</h3>
          {!ehClube && vaga.estilo && (
            <p className="text-[12px] font-semibold" style={{ color: cor }}>“{vaga.estilo}”</p>
          )}
          {!ehClube && <div className="mt-1"><SeloReputacao reputacao={rep} copy={copy} /></div>}
        </div>

        {/* número forte: divisão (clube) ou overall (jogador) */}
        {ehClube && div != null ? (
          <div className="shrink-0 text-right">
            <div className="leading-none" style={{ ...bebas, fontSize: "2rem", color: OURO }}>{div}</div>
            <div className="flex items-center justify-end gap-1 text-[9.5px] font-bold uppercase tracking-wide" style={{ color: verificado ? LIMA : "rgba(255,255,255,.4)" }}>
              {verificado && <ShieldCheck size={10} />}
              {copy.card.divisao}
            </div>
          </div>
        ) : !ehClube && vaga.overall != null ? (
          <div className="shrink-0 text-right">
            <div className="leading-none" style={{ ...bebas, fontSize: "2rem", color: OURO }}>{vaga.overall}</div>
            <div className="text-[9.5px] font-bold uppercase tracking-wide text-white/45">{copy.card.overall}</div>
          </div>
        ) : null}
      </div>

      {/* posições */}
      <div className="mt-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
          {ehClube ? copy.card.precisa : copy.card.joga}
        </span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {(vaga.posicoes.length ? vaga.posicoes : ["TODAS"]).map((c) => {
            const p = posicaoPorCode(c);
            const pcor = p ? corSetor(p.setor) : "#94a3b8";
            return (
              <span
                key={c}
                className="rounded-lg px-2.5 py-1 text-[12px] font-extrabold uppercase tracking-wide"
                style={{ background: `${pcor}1c`, color: pcor, border: `1px solid ${pcor}3a` }}
              >
                {p?.sigla ?? c}
              </span>
            );
          })}
          {ehClube && vaga.minOverall != null && (
            <span className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-[12px] font-bold text-white/70">
              OVR ≥ {vaga.minOverall}
            </span>
          )}
        </div>
      </div>

      {/* meta: plataforma / horário / região / campanha */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-white/60">
        <span className="inline-flex items-center gap-1.5">
          <Gamepad2 size={13} className="text-white/40" />
          {PLAT_ROTULO[vaga.plataforma] ?? vaga.plataforma}
        </span>
        {(vaga.horario || vaga.dias.length > 0) && (
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} className="text-white/40" />
            {[vaga.horario, vaga.dias.map((d) => copy.dias[CODIGOS_DIA.indexOf(d)] ?? d).join(" ")]
              .filter(Boolean)
              .join(" · ") || copy.card.naoInformado}
          </span>
        )}
        {vaga.regiao && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} className="text-white/40" />
            {vaga.regiao}
          </span>
        )}
        {ehClube && vaga.clubeSnapshot?.gamesPlayed ? (
          <span className="tabular-nums text-white/50">
            {vaga.clubeSnapshot.wins ?? 0}V {vaga.clubeSnapshot.ties ?? 0}E {vaga.clubeSnapshot.losses ?? 0}D
          </span>
        ) : null}
      </div>

      {vaga.descricao && (
        <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-white/70">{vaga.descricao}</p>
      )}

      {/* ações */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4">
        {vaga.status === "preenchida" ? (
          <span className="text-[12px] font-bold text-white/50">{copy.card.preenchida}</span>
        ) : vaga.ehDono ? (
          <>
            <span className="text-[12px] font-semibold text-white/55">
              {vaga.candidaturas} {copy.card.candidatos}
            </span>
            <button
              type="button"
              onClick={() => alterarStatus("preenchida")}
              className="rounded-lg border border-white/12 px-3 py-2 text-[12px] font-bold text-white/70 transition-colors hover:text-white"
            >
              {copy.card.fechar}
            </button>
          </>
        ) : feito ? (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold" style={{ color: LIMA }}>
            <CheckCircle2 size={14} />
            {copy.card.candidatou}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setCandidatando(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12.5px] font-bold transition-transform hover:-translate-y-0.5"
            style={{ background: cor, color: FUNDO }}
          >
            <Send size={13} />
            {copy.card.candidatar}
          </button>
        )}

        {!ehClube && vaga.gamertag && (
          <button
            type="button"
            onClick={() => setAvaliando(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-[12px] font-bold text-white/70 transition-colors hover:text-white"
            title={copy.card.avaliar}
          >
            <Star size={13} />
            {copy.card.avaliar}
          </button>
        )}

        <a
          href={cartazUrl}
          target="_blank"
          rel="noreferrer"
          className={`${ehClube ? "ml-auto" : ""} inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-[12px] font-bold text-white/70 transition-colors hover:text-white`}
          title={copy.card.cartaz}
        >
          <ImageIcon size={13} />
          {copy.card.cartaz}
        </a>
      </div>

      {candidatando && (
        <ModalCandidatura
          vaga={vaga}
          copy={copy}
          aoFechar={() => setCandidatando(false)}
          aoConcluir={() => {
            setFeito(true);
            setCandidatando(false);
          }}
        />
      )}

      {avaliando && vaga.gamertag && (
        <AvaliarModal
          gamertag={vaga.gamertag}
          reputacao={rep}
          copy={copy}
          locale={locale}
          aoFechar={() => setAvaliando(false)}
          aoConcluir={(novo) => {
            if (novo) setRep(novo);
            setAvaliando(false);
          }}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/* Candidatura                                                         */
/* ================================================================== */

function ModalCandidatura({
  vaga,
  copy,
  aoFechar,
  aoConcluir,
}: {
  vaga: VagaSerializada;
  copy: CopyMercado;
  aoFechar: () => void;
  aoConcluir: () => void;
}) {
  const [mensagem, setMensagem] = useState("");
  const [contato, setContato] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "login" | "ok" | "erro">("idle");
  const [contatoDeles, setContatoDeles] = useState<{ tipo: string; contato: string | null } | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (estado === "enviando") return;
    setEstado("enviando");
    const res = await fetch(`/api/game/mercado/${vaga._id}/candidatura`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: mensagem.trim() || undefined, contato: contato.trim() || undefined }),
    }).catch(() => null);
    if (res?.ok) {
      const d = await res.json();
      setContatoDeles({ tipo: d.contatoTipo, contato: d.contato });
      setEstado("ok");
      return;
    }
    if (res?.status === 401) return setEstado("login");
    setEstado("erro");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={aoFechar}>
      <div
        className="w-full max-w-md rounded-3xl border p-6"
        style={{ ...superficie(CIANO, "forte"), background: "#12142a" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl" style={bebas}>{copy.candidatura.titulo.toUpperCase()}</h3>
          <button type="button" onClick={aoFechar} className="text-white/50 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {estado === "ok" ? (
          <div className="mt-4">
            <p className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: LIMA }}>
              <CheckCircle2 size={16} />
              {copy.candidatura.ok}
            </p>
            <div className="mt-4 rounded-xl border border-white/12 bg-white/[0.04] p-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
                {copy.candidatura.contatoDeles}
              </span>
              <p className="mt-1 break-words text-sm font-semibold text-white">
                {contatoDeles?.contato
                  ? contatoDeles.contato
                  : copy.publicar.contatoTipo[(contatoDeles?.tipo as "plataforma") ?? "plataforma"]}
              </p>
            </div>
            <button
              type="button"
              onClick={aoConcluir}
              className="mt-5 w-full rounded-xl py-3 text-sm font-bold"
              style={{ background: LIMA, color: FUNDO }}
            >
              OK
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
                {copy.candidatura.mensagem}
              </span>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder={copy.candidatura.mensagemPlaceholder}
                maxLength={500}
                rows={3}
                className="mt-1 w-full resize-none rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
                {copy.candidatura.contato}
              </span>
              <input
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                placeholder={copy.candidatura.contatoPlaceholder}
                maxLength={200}
                className="mt-1 w-full rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
              />
            </label>
            <button
              type="submit"
              disabled={estado === "enviando"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold disabled:opacity-40"
              style={{ background: CIANO, color: FUNDO }}
            >
              {estado === "enviando" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {estado === "enviando" ? copy.candidatura.enviando : copy.candidatura.enviar}
            </button>
            {estado === "login" && (
              <Link href="/login" className="block text-center text-[12.5px] font-bold" style={{ color: OURO }}>
                {copy.publicar.login}
              </Link>
            )}
            {estado === "erro" && (
              <p className="text-center text-[12.5px] font-semibold text-rose-300">{copy.hub.error}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Publicar vaga                                                       */
/* ================================================================== */

function FormPublicar({
  copy,
  abaInicial,
  prefill,
  aoFechar,
  aoPublicar,
}: {
  copy: CopyMercado;
  abaInicial: Aba;
  prefill?: Prefill | null;
  aoFechar: () => void;
  aoPublicar: () => void;
}) {
  const [tipo, setTipo] = useState<Aba>(prefill ? "clube" : abaInicial);
  const [posicoes, setPosicoes] = useState<string[]>([]);
  const [plataforma, setPlataforma] = useState(prefill?.plataforma ?? "common-gen5");
  const [dias, setDias] = useState<string[]>([]);
  const [horario, setHorario] = useState("");
  const [regiao, setRegiao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [contatoTipo, setContatoTipo] = useState<"plataforma" | "discord" | "whatsapp">("plataforma");
  const [contato, setContato] = useState("");
  // clube
  const [clubeNome, setClubeNome] = useState(prefill?.clubeNome ?? "");
  const [eaClubId, setEaClubId] = useState(prefill?.eaClubId ?? "");
  const [minOverall, setMinOverall] = useState("");
  // jogador
  const [gamertag, setGamertag] = useState("");
  const [estilo, setEstilo] = useState("");
  const [overall, setOverall] = useState("");

  const [estado, setEstado] = useState<"idle" | "enviando" | "login" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);

  function alternarPosicao(code: string) {
    setPosicoes((atual) => {
      if (code === "TODAS") return atual.includes("TODAS") ? [] : ["TODAS"];
      const semTodas = atual.filter((c) => c !== "TODAS");
      return semTodas.includes(code)
        ? semTodas.filter((c) => c !== code)
        : [...semTodas, code].slice(0, 6);
    });
  }
  function alternarDia(code: string) {
    setDias((atual) => (atual.includes(code) ? atual.filter((d) => d !== code) : [...atual, code]));
  }

  const podeEnviar = useMemo(() => {
    if (posicoes.length === 0) return false;
    if (tipo === "clube") return clubeNome.trim().length >= 2;
    return gamertag.trim().length >= 2;
  }, [posicoes, tipo, clubeNome, gamertag]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (estado === "enviando") return;
    if (posicoes.length === 0) {
      setErro(copy.publicar.erroPosicao);
      setEstado("erro");
      return;
    }
    setEstado("enviando");
    setErro(null);
    const body =
      tipo === "clube"
        ? {
            tipo,
            posicoes,
            plataforma,
            dias,
            horario,
            regiao,
            descricao,
            contatoTipo,
            contato,
            clubeNome,
            eaClubId: eaClubId.trim() || undefined,
            minOverall: minOverall ? Number(minOverall) : undefined,
          }
        : {
            tipo,
            posicoes,
            plataforma,
            dias,
            horario,
            regiao,
            descricao,
            contatoTipo,
            contato,
            gamertag,
            estilo,
            overall: overall ? Number(overall) : undefined,
          };
    const res = await fetch("/api/game/mercado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    if (res?.ok) {
      aoPublicar();
      return;
    }
    if (res?.status === 401) return setEstado("login");
    setErro((await res?.json().catch(() => null))?.error ?? null);
    setEstado("erro");
  }

  const corTipo = tipo === "clube" ? LIMA : CIANO;

  return (
    <form onSubmit={enviar} className="mt-4 rounded-3xl border p-5 sm:p-6" style={superficie(OURO, "forte")}>
      <h3 className="text-xl sm:text-2xl" style={bebas}>
        {(tipo === "clube" ? copy.publicar.tituloClube : copy.publicar.tituloJogador).toUpperCase()}
      </h3>

      {/* tipo */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(["clube", "jogador"] as Aba[]).map((t) => {
          const ativo = tipo === t;
          const cor = t === "clube" ? LIMA : CIANO;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className="rounded-xl px-4 py-2.5 text-sm font-bold transition-colors"
              style={{
                background: ativo ? `${cor}1c` : "rgba(255,255,255,.04)",
                color: ativo ? cor : "rgba(255,255,255,.55)",
                border: `1px solid ${ativo ? cor + "55" : "rgba(255,255,255,.1)"}`,
              }}
            >
              {t === "clube" ? copy.publicar.souClube : copy.publicar.souJogador}
            </button>
          );
        })}
      </div>

      {/* identidade */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {tipo === "clube" ? (
          <>
            <Campo rotulo={copy.publicar.nomeClube}>
              <input
                value={clubeNome}
                onChange={(e) => setClubeNome(e.target.value)}
                placeholder={copy.publicar.nomeClubePlaceholder}
                maxLength={80}
                className={INPUT}
              />
            </Campo>
            <Campo rotulo={copy.publicar.ligarClube} dica={copy.publicar.ligarClubeDica}>
              <input
                value={eaClubId}
                onChange={(e) => setEaClubId(e.target.value.replace(/\D/g, ""))}
                placeholder="EA club ID"
                inputMode="numeric"
                className={INPUT}
              />
            </Campo>
          </>
        ) : (
          <>
            <Campo rotulo={copy.publicar.gamertag}>
              <input
                value={gamertag}
                onChange={(e) => setGamertag(e.target.value)}
                placeholder={copy.publicar.gamertagPlaceholder}
                maxLength={40}
                className={INPUT}
              />
            </Campo>
            <Campo rotulo={copy.publicar.estilo}>
              <input
                value={estilo}
                onChange={(e) => setEstilo(e.target.value)}
                placeholder={copy.publicar.estiloPlaceholder}
                maxLength={24}
                className={INPUT}
              />
            </Campo>
          </>
        )}
      </div>

      {/* posições */}
      <div className="mt-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
          {tipo === "clube" ? copy.publicar.posicoesClube : copy.publicar.posicoesJogador}
        </span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {POSICOES.map((p) => {
            const cor = p.code === "TODAS" ? "#94a3b8" : corSetor(p.setor);
            const ativo = posicoes.includes(p.code);
            return (
              <ChipFiltro key={p.code} ativo={ativo} cor={cor} onClick={() => alternarPosicao(p.code)}>
                {p.code === "TODAS" ? p.nome : p.sigla}
              </ChipFiltro>
            );
          })}
        </div>
      </div>

      {/* plataforma + overall */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Campo rotulo={copy.publicar.plataforma}>
          <select value={plataforma} onChange={(e) => setPlataforma(e.target.value)} className={INPUT}>
            <option value="common-gen5" style={{ color: "#000" }}>{copy.filtros.gen5}</option>
            <option value="common-gen4" style={{ color: "#000" }}>{copy.filtros.gen4}</option>
            <option value="mista" style={{ color: "#000" }}>{copy.filtros.mista}</option>
          </select>
        </Campo>
        {tipo === "jogador" ? (
          <Campo rotulo={copy.publicar.overall}>
            <input type="number" min={0} max={99} value={overall} onChange={(e) => setOverall(e.target.value)} className={INPUT} />
          </Campo>
        ) : (
          <Campo rotulo={copy.publicar.minOverall}>
            <input type="number" min={0} max={99} value={minOverall} onChange={(e) => setMinOverall(e.target.value)} className={INPUT} />
          </Campo>
        )}
        <Campo rotulo={copy.publicar.horario}>
          <input value={horario} onChange={(e) => setHorario(e.target.value)} placeholder={copy.publicar.horarioPlaceholder} maxLength={40} className={INPUT} />
        </Campo>
      </div>

      {/* dias */}
      <div className="mt-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">{copy.publicar.dias}</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CODIGOS_DIA.map((code, i) => (
            <ChipFiltro key={code} ativo={dias.includes(code)} cor={corTipo} onClick={() => alternarDia(code)}>
              {copy.dias[i]}
            </ChipFiltro>
          ))}
        </div>
      </div>

      {/* região + descrição */}
      <div className="mt-4 grid gap-3">
        <Campo rotulo={copy.publicar.regiao}>
          <input value={regiao} onChange={(e) => setRegiao(e.target.value)} placeholder={copy.publicar.regiaoPlaceholder} maxLength={40} className={INPUT} />
        </Campo>
        <Campo rotulo={copy.publicar.descricao}>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={tipo === "clube" ? copy.publicar.descricaoClubePlaceholder : copy.publicar.descricaoJogadorPlaceholder}
            maxLength={600}
            rows={3}
            className={`${INPUT} resize-none`}
          />
        </Campo>
      </div>

      {/* contato */}
      <div className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr]">
        <Campo rotulo={copy.publicar.contato}>
          <select value={contatoTipo} onChange={(e) => setContatoTipo(e.target.value as "plataforma")} className={INPUT}>
            <option value="plataforma" style={{ color: "#000" }}>{copy.publicar.contatoTipo.plataforma}</option>
            <option value="discord" style={{ color: "#000" }}>{copy.publicar.contatoTipo.discord}</option>
            <option value="whatsapp" style={{ color: "#000" }}>{copy.publicar.contatoTipo.whatsapp}</option>
          </select>
        </Campo>
        {contatoTipo !== "plataforma" && (
          <Campo rotulo="" dica={copy.publicar.contatoDica}>
            <input value={contato} onChange={(e) => setContato(e.target.value)} placeholder={copy.publicar.contatoPlaceholder} maxLength={200} className={INPUT} />
          </Campo>
        )}
      </div>

      {/* ações */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!podeEnviar || estado === "enviando"}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-transform disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:-translate-y-0.5"
          style={{ background: OURO, color: FUNDO }}
        >
          {estado === "enviando" ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          {estado === "enviando" ? copy.publicar.enviando : copy.publicar.enviar}
        </button>
        <button type="button" onClick={aoFechar} className="text-sm font-semibold text-white/50 transition-colors hover:text-white">
          {copy.publicar.cancelar}
        </button>
        {estado === "login" && (
          <Link href="/login" className="text-[12.5px] font-bold" style={{ color: OURO }}>
            {copy.publicar.login}
          </Link>
        )}
        {estado === "erro" && erro && <span className="text-[12.5px] font-semibold text-rose-300">{erro}</span>}
      </div>
    </form>
  );
}

const INPUT =
  "mt-1 w-full rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/30";

function Campo({
  rotulo,
  dica,
  children,
}: {
  rotulo: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      {rotulo && <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">{rotulo}</span>}
      {children}
      {dica && <span className="mt-1 block text-[11px] leading-snug text-white/40">{dica}</span>}
    </label>
  );
}
