"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  Users,
  Trophy,
  ArrowRightLeft,
  Star,
  Radio,
  ChevronDown,
} from "lucide-react";
import type { CopyMercado } from "@/lib/game/copy-mercado";
import { AvatarJogador } from "./AvatarJogador";
import { SeloReputacao, AvaliarModal } from "./ReputacaoUI";
import type { ResumoReputacao } from "@/lib/game/reputacao-meta";
import type { StatusPresenca } from "@/lib/game/avatar";
import { POSICOES, posicaoPorCode } from "@/lib/game/posicoes";
import { LIMA, OURO, CIANO, VIOLETA, FUNDO, bebas, superficie, corSetor } from "@/lib/game/tema";

/**
 * A ÁREA PRINCIPAL DA COMUNIDADE — o coração do Winners 22.
 *
 * O pedido do Ricardo: "só de entrar você vê a quantidade de pessoas usando".
 * Aqui isso é literal — um contador ao vivo de quem está online e uma NUVEM DE
 * BONEQUINHOS, um por jogador. Quem está logado manda um pulso a cada 20s e
 * aparece com o rosto; quem procura jogo ganha o anel lima e flutua na frente.
 *
 * A nuvem nunca fica vazia: quando há pouca gente online, ela se completa com
 * rostos REAIS do acervo (rotulados "na comunidade", nunca como conectados).
 */

interface JogadorOnline {
  seed: string;
  gamertag: string | null;
  posicao: string | null;
  overall: number | null;
  status: StatusPresenca;
  reputacao?: ResumoReputacao;
}
interface MembroComunidade {
  seed: string;
  nome: string;
  posicao: string | null;
  reputacao?: ResumoReputacao;
}
interface DadosComunidade {
  online: { total: number; jogadores: number; visitantes: number; procurando: number; lista: JogadorOnline[] };
  campeonatosAtivos: number;
  vagasClubes: number;
  vagasJogadores: number;
  jogadoresBanco: number;
  avaliacoes: number;
  comunidade: MembroComunidade[];
}

/** Só os status que o usuário pode ESCOLHER (offline não é uma escolha). */
type StatusAtivo = "online" | "procurando" | "jogando";
const STATUS_ORDEM: StatusAtivo[] = ["procurando", "online", "jogando"];

function clientId(): string {
  try {
    let id = localStorage.getItem("w22_cid");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      localStorage.setItem("w22_cid", id);
    }
    return id;
  } catch {
    return "anon0000" + Math.random().toString(36).slice(2, 10);
  }
}

export function ComunidadeAoVivo({ copy, locale }: { copy: CopyMercado; locale: string }) {
  const [dados, setDados] = useState<DadosComunidade | null>(null);
  const [online, setOnline] = useState<DadosComunidade["online"] | null>(null);
  const [logado, setLogado] = useState(false);
  const [status, setStatus] = useState<StatusAtivo>("online");
  const [posicao, setPosicao] = useState<string>("");
  const [avaliando, setAvaliando] = useState<{ gamertag: string; rep?: ResumoReputacao } | null>(null);
  const statusRef = useRef(status);
  const posRef = useRef(posicao);
  statusRef.current = status;
  posRef.current = posicao;

  // Pulso de presença — devolve o retrato de quem está online agora.
  // `forcar` ignora a aba oculta: o PRIMEIRO pulso tem de rodar sempre (é ele
  // que descobre se você está logado e mostra o painel certo). Os pulsos do
  // intervalo respeitam a visibilidade para não contar aba de fundo eterna.
  const pulsar = useCallback(async (forcar = false) => {
    if (!forcar && typeof document !== "undefined" && document.visibilityState === "hidden") return;
    const res = await fetch("/api/game/presenca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusRef.current, posicao: posRef.current || undefined, clientId: clientId() }),
    }).catch(() => null);
    if (res?.ok) {
      const d = await res.json();
      setLogado(!!d.logado);
      if (d.online) setOnline(d.online);
    }
  }, []);

  useEffect(() => {
    fetch("/api/game/comunidade")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setDados(d);
          setOnline(d.online);
        }
      })
      .catch(() => {});
    pulsar(true);
    const t = setInterval(() => pulsar(), 20_000);
    // Ao voltar para a aba, pulsa na hora — não espera o próximo ciclo de 20s.
    const onVis = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") pulsar(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pulsar]);

  // Ao trocar status/posição, pulsa na hora para refletir sem esperar 20s.
  useEffect(() => {
    if (logado) pulsar(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, posicao]);

  const onlineNum = online ?? dados?.online ?? null;

  // A nuvem: online (com rosto vivo) + amostra da comunidade, sem repetir.
  const nuvem = useMemo(() => {
    const vistos = new Set<string>();
    const arr: Array<{ seed: string; nome: string | null; posicao: string | null; status: StatusPresenca | null; overall: number | null; reputacao?: ResumoReputacao; vivo: boolean }> = [];
    for (const j of onlineNum?.lista ?? []) {
      if (vistos.has(j.seed)) continue;
      vistos.add(j.seed);
      arr.push({ seed: j.seed, nome: j.gamertag, posicao: j.posicao, status: j.status, overall: j.overall, reputacao: j.reputacao, vivo: true });
    }
    for (const m of dados?.comunidade ?? []) {
      if (vistos.has(m.seed)) continue;
      vistos.add(m.seed);
      arr.push({ seed: m.seed, nome: m.nome, posicao: m.posicao, status: null, overall: null, reputacao: m.reputacao, vivo: false });
    }
    // procurando > online > jogando > comunidade
    const peso = (s: StatusPresenca | null) => (s === "procurando" ? 0 : s === "online" ? 1 : s === "jogando" ? 2 : 3);
    return arr.sort((a, b) => peso(a.status) - peso(b.status)).slice(0, 60);
  }, [onlineNum, dados]);

  return (
    <div className="relative overflow-hidden rounded-[28px] border p-6 sm:p-9" style={superficie(CIANO, "forte")}>
      <style>{`
        @keyframes w22bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes w22pulse { 0%{box-shadow:0 0 0 0 var(--w22c)} 70%{box-shadow:0 0 0 8px transparent} 100%{box-shadow:0 0 0 0 transparent} }
      `}</style>
      <div aria-hidden className="fx-orb" style={{ width: 360, height: 360, left: "-6%", top: "-20%", background: `radial-gradient(circle, ${CIANO}22, transparent 65%)`, animation: "fx-drift-a 16s ease-in-out infinite" }} />
      <div aria-hidden className="fx-orb" style={{ width: 300, height: 300, right: "-4%", bottom: "-24%", background: `radial-gradient(circle, ${LIMA}1f, transparent 65%)`, animation: "fx-drift-b 18s ease-in-out infinite" }} />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: `${CIANO}16`, color: CIANO, border: `1px solid ${CIANO}33` }}>
          <Radio size={12} />
          {copy.comunidade.title}
        </span>

        {/* Contador ao vivo */}
        <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: LIMA }} />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full" style={{ background: LIMA }} />
            </span>
            <span className="leading-none" style={{ ...bebas, fontSize: "3.4rem" }}>
              {onlineNum ? onlineNum.total : "—"}
            </span>
            <span className="mb-1 text-sm font-bold uppercase tracking-wide text-white/55">{copy.comunidade.onlineAgora}</span>
          </div>
          {onlineNum && (
            <div className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] font-semibold text-white/55">
              <span><b className="text-white">{onlineNum.jogadores}</b> {copy.comunidade.jogadores}</span>
              {onlineNum.procurando > 0 && (
                <span style={{ color: LIMA }}><b>{onlineNum.procurando}</b> {copy.comunidade.procurandoJogo}</span>
              )}
              {onlineNum.visitantes > 0 && (
                <span><b className="text-white">{onlineNum.visitantes}</b> {copy.comunidade.visitantes}</span>
              )}
            </div>
          )}
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{copy.comunidade.subtitle}</p>

        {/* Nuvem de bonequinhos */}
        <div className="mt-6 min-h-[96px]">
          {nuvem.length === 0 ? (
            <p className="py-8 text-sm text-white/45">{copy.comunidade.ninguemOnline}</p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {nuvem.map((m) => (
                <BonecoNaNuvem key={m.seed} membro={m} copy={copy} locale={locale} aoAvaliar={(g, rep) => setAvaliando({ gamertag: g, rep })} />
              ))}
              {onlineNum && onlineNum.jogadores > nuvem.filter((m) => m.vivo).length && (
                <span className="inline-flex items-center rounded-full bg-white/[0.06] px-3 text-xs font-bold text-white/60">
                  +{onlineNum.jogadores - nuvem.filter((m) => m.vivo).length}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Painel do próprio usuário */}
        <div className="mt-6 rounded-2xl border border-white/[0.09] bg-white/[0.03] p-4">
          {logado ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/45">{copy.comunidade.voceEsta}</span>
              <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
                {STATUS_ORDEM.map((s) => {
                  const ativo = status === s;
                  const cor = s === "procurando" ? LIMA : s === "jogando" ? OURO : CIANO;
                  return (
                    <button key={s} type="button" onClick={() => setStatus(s)}
                      className="rounded-lg px-3 py-2 text-[12.5px] font-bold transition-colors"
                      style={{ background: ativo ? `${cor}1e` : "transparent", color: ativo ? cor : "rgba(255,255,255,.55)" }}>
                      {copy.comunidade.statusRotulo[s]}
                    </button>
                  );
                })}
              </div>
              <div className="relative">
                <select value={posicao} onChange={(e) => setPosicao(e.target.value)}
                  className="appearance-none rounded-xl border border-white/12 bg-white/[0.06] py-2 pl-3 pr-8 text-[12.5px] font-semibold text-white outline-none focus:border-white/30">
                  <option value="" style={{ color: "#000" }}>{copy.comunidade.semPosicao}</option>
                  {POSICOES.filter((p) => p.code !== "TODAS").map((p) => (
                    <option key={p.code} value={p.code} style={{ color: "#000" }}>{p.nome}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40" />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-white/60">{copy.comunidade.entrarParaAparecer}</span>
              <Link href="/login" className="rounded-xl px-4 py-2 text-[12.5px] font-bold" style={{ background: CIANO, color: FUNDO }}>
                {copy.comunidade.login}
              </Link>
            </div>
          )}
        </div>

        {/* Números da comunidade */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TileNumero cor={OURO} icone={Trophy} valor={dados?.campeonatosAtivos} rotulo={copy.comunidade.stats.campeonatos} />
          <TileNumero cor={LIMA} icone={ArrowRightLeft} valor={dados ? dados.vagasClubes + dados.vagasJogadores : undefined} rotulo={copy.comunidade.stats.vagas} />
          <TileNumero cor={CIANO} icone={Users} valor={dados?.jogadoresBanco} rotulo={copy.comunidade.stats.jogadores} />
          <TileNumero cor={VIOLETA} icone={Star} valor={dados?.avaliacoes} rotulo={copy.comunidade.stats.avaliacoes} />
        </div>

        {/* CTAs */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/game/mercado" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold transition-transform hover:-translate-y-0.5" style={{ background: LIMA, color: FUNDO, boxShadow: `0 12px 34px -14px ${LIMA}` }}>
            <ArrowRightLeft size={16} />
            {copy.comunidade.verMercado}
          </Link>
          <Link href="/game/campeonatos" className="inline-flex items-center gap-2 rounded-xl border border-white/18 px-5 py-3 font-semibold text-white/90 transition-colors hover:border-white/40 hover:bg-white/[0.04]">
            <Trophy size={16} />
            {copy.comunidade.criarCampeonato}
          </Link>
        </div>
      </div>

      {avaliando && (
        <AvaliarModal
          gamertag={avaliando.gamertag}
          reputacao={avaliando.rep}
          copy={copy}
          locale={locale}
          aoFechar={() => setAvaliando(null)}
          aoConcluir={() => setAvaliando(null)}
        />
      )}
    </div>
  );
}

function BonecoNaNuvem({
  membro,
  copy,
  locale,
  aoAvaliar,
}: {
  membro: { seed: string; nome: string | null; posicao: string | null; status: StatusPresenca | null; overall: number | null; reputacao?: ResumoReputacao; vivo: boolean };
  copy: CopyMercado;
  locale: string;
  aoAvaliar: (gamertag: string, rep?: ResumoReputacao) => void;
}) {
  const status = membro.status ?? "offline";
  const posNome = membro.posicao ? posicaoPorCode(membro.posicao)?.sigla : null;
  const podeAvaliar = !!membro.nome;
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => podeAvaliar && aoAvaliar(membro.nome!, membro.reputacao)}
        className="block transition-transform hover:-translate-y-1"
        style={membro.status === "procurando" ? { animation: "w22bob 2.6s ease-in-out infinite" } : undefined}
        aria-label={membro.nome ?? "jogador"}
      >
        <span style={{ opacity: membro.vivo ? 1 : 0.62, display: "block" }}>
          <AvatarJogador seed={membro.seed} size={46} status={status} titulo={membro.nome ?? undefined} />
        </span>
      </button>

      {/* tooltip */}
      <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-max max-w-[220px] -translate-x-1/2 rounded-xl border border-white/12 bg-[#12142a] p-3 text-left shadow-xl group-hover:block">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-black text-white">{membro.nome ?? "—"}</span>
          {posNome && (
            <span className="rounded px-1.5 py-px text-[10px] font-extrabold" style={{ background: `${corSetor(posicaoPorCode(membro.posicao!)?.setor ?? "—")}22`, color: corSetor(posicaoPorCode(membro.posicao!)?.setor ?? "—") }}>
              {posNome}
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] font-semibold text-white/50">
          {membro.status && membro.status !== "offline"
            ? copy.comunidade.statusRotulo[membro.status]
            : copy.comunidade.naComunidade}
          {membro.overall != null && <> · OVR {membro.overall}</>}
        </div>
        <div className="mt-1.5"><SeloReputacao reputacao={membro.reputacao} copy={copy} /></div>
        {podeAvaliar && (
          <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: OURO }}>
            <Star size={11} /> {copy.card.avaliar}
          </div>
        )}
      </div>
    </div>
  );
}

function TileNumero({ cor, icone: Icone, valor, rotulo }: { cor: string; icone: typeof Users; valor: number | undefined; rotulo: string }) {
  return (
    <div className="rounded-2xl border p-4" style={superficie(cor)}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${cor}1a`, border: `1px solid ${cor}3a` }}>
        <Icone size={15} style={{ color: cor }} />
      </span>
      <div className="mt-3 leading-none" style={{ ...bebas, fontSize: "2.4rem", color: valor == null ? "rgba(255,255,255,.25)" : "#fff" }}>
        {valor == null ? "—" : valor}
      </div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">{rotulo}</div>
    </div>
  );
}
