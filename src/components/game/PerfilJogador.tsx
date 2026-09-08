"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Flag,
  Shield,
  Gamepad2,
  Star,
  ArrowRightLeft,
  Radio,
  UserCheck,
  Coins,
  Timer,
  Activity,
  AlertTriangle,
} from "lucide-react";
import type { CopyMercado } from "@/lib/game/copy-mercado";
import { getCopyCampeonato } from "@/lib/game/copy-campeonato";
import type { PerfilJogadorDados } from "@/lib/game/perfil-servidor";
import type { FichaJogadorDados, CopyFicha, ResumoPartidas, LinhaPartidaJogador, ExtrasElenco } from "@/lib/game/jogador-servidor";
import { AvatarJogador } from "./AvatarJogador";
import { CartaJogador } from "./CartaJogador";
import { FichaGoleiro } from "./FichaGoleiro";
import { Estrelas, AvaliarModal } from "./ReputacaoUI";
import { CATEGORIAS } from "@/lib/game/reputacao-meta";
import { posicaoPorCode } from "@/lib/game/posicoes";
import {
  LIMA,
  OURO,
  CIANO,
  RUBRO,
  FUNDO,
  bebas,
  superficie,
  corSetor,
  corNota,
  corResultado,
} from "@/lib/game/tema";

/**
 * A FICHA DO JOGADOR — a casa de UMA pessoa no Winners 22.
 *
 * Junta o rosto (o bonequinho e a carta), a REPUTAÇÃO da comunidade com os
 * comentários, a CARREIRA + TEMPORADA lidas do clube e, agora, a leitura
 * PARTIDA A PARTIDA do espelho (defesas, tempo em campo, passes e desarmes com
 * tentativas, arquétipo). É onde o "banco dos bons jogadores" vira uma página
 * que dá para mandar para alguém.
 *
 * Dois estados, os dois importam: o DONO do Pro vinculado vê a ficha como sua e
 * o atalho para a mesa de fichas; o VISITANTE vê o que dá para mostrar e dois
 * caminhos — "esse sou eu" (vincular) e "não jogo Pro Clubs" (entrar mesmo
 * assim). A ficha não é parede.
 */
export function PerfilJogador({
  ficha,
  copy,
  copyFicha,
  locale,
}: {
  ficha: FichaJogadorDados;
  copy: CopyMercado;
  copyFicha: CopyFicha;
  locale: string;
}) {
  const { perfil } = ficha;
  const c = copy.perfil;
  const copyCamp = getCopyCampeonato(locale);
  const [rep, setRep] = useState(perfil.reputacao);
  const [avaliando, setAvaliando] = useState(false);

  const setor = perfil.posicaoCode ? posicaoPorCode(perfil.posicaoCode)?.setor ?? "—" : "—";
  const posNome = perfil.posicaoCode ? posicaoPorCode(perfil.posicaoCode)?.nome : perfil.posicaoEA;
  const corPos = corSetor(setor);
  const status = perfil.vaga ? "procurando" : "online";

  return (
    <main className="min-h-dvh overflow-x-clip px-4 pb-20 pt-24 sm:px-8 sm:pt-28" style={{ background: FUNDO, color: "#f3f1ff" }}>
      <div className="mx-auto max-w-5xl">
        <Link href="/game" className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white">
          <ArrowLeft size={14} />
          {c.back}
        </Link>

        <div aria-hidden className="fx-orb" style={{ width: 380, height: 380, left: "6%", top: 30, background: `radial-gradient(circle, ${corPos}22, transparent 65%)`, animation: "fx-drift-a 15s ease-in-out infinite" }} />

        <FaixaVinculo ficha={ficha} copy={copyFicha} />

        {/* ---------------- Cabeçalho ---------------- */}
        <section className="relative mt-4 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-4">
              <span className="shrink-0">
                <AvatarJogador seed={perfil.gamertag} size={92} status={status} titulo={perfil.gamertag} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {posNome && (
                    <span className="rounded-md px-2 py-0.5 text-[11px] font-black uppercase tracking-wide" style={{ background: `${corPos}1e`, color: corPos, border: `1px solid ${corPos}44` }}>
                      {posNome}
                    </span>
                  )}
                  {/*
                    ⚠️ Ícone de BANDEIRA, não de selo de verificação — apontado
                    pelo codex-bets em 08/09. O TEXTO já estava certo ("Reivindicado"),
                    mas o <BadgeCheck/> é um selo com visto, e ninguém lê o texto
                    quando o ícone já disse. Reivindicar é apontar para si mesmo
                    dentro de um elenco público: é declaração, não prova (Art. 18
                    do regulamento). O visto fica reservado para quem passou pela
                    prova de acesso ao Pro, que a gestão implementa.
                  */}
                  {perfil.reivindicado ? (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: `${LIMA}18`, color: LIMA }}>
                      <Flag size={12} />
                      {c.verificado}
                    </span>
                  ) : (
                    <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-white/50">{c.naoVerificado}</span>
                  )}
                  {perfil.vaga && (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: `${LIMA}18`, color: LIMA }}>
                      <Radio size={11} />
                      {c.procurando}
                    </span>
                  )}
                </div>
                <h1 className="mt-1 truncate text-4xl leading-none sm:text-5xl" style={bebas}>{perfil.gamertag}</h1>
                {perfil.estilo && <p className="mt-1 text-sm font-bold" style={{ color: corPos }}>“{perfil.estilo}”</p>}
                {perfil.proName && <p className="mt-0.5 text-sm font-semibold text-white/55">{perfil.proName}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-white/60">
                  {perfil.overall != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <Star size={13} style={{ color: OURO }} />
                      <b className="text-white">OVR {perfil.overall}</b>
                    </span>
                  )}
                  {perfil.clube?.nome && (
                    <span className="inline-flex items-center gap-1.5">
                      <Shield size={13} className="text-white/40" />
                      {perfil.clube.id ? (
                        <Link href={`/game/clube/${perfil.clube.id}`} className="font-semibold text-white/80 hover:text-white">
                          {perfil.clube.nome}
                        </Link>
                      ) : (
                        <span className="font-semibold text-white/80">{perfil.clube.nome}</span>
                      )}
                      {perfil.clube.divisao != null && <span className="text-white/45">· {c.divisao} {perfil.clube.divisao}</span>}
                    </span>
                  )}
                  {perfil.plataforma && (
                    <span className="inline-flex items-center gap-1.5">
                      <Gamepad2 size={13} className="text-white/40" />
                      {perfil.plataforma === "common-gen4" ? "PS4 · Xbox One" : "PS5 · Series · PC"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Reputação */}
            <div className="mt-6 rounded-2xl border p-5" style={superficie(OURO)}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg" style={bebas}>{c.reputacaoTitulo.toUpperCase()}</h2>
                <button type="button" onClick={() => setAvaliando(true)} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12.5px] font-bold transition-transform hover:-translate-y-0.5" style={{ background: OURO, color: FUNDO }}>
                  <Star size={13} />
                  {c.avaliar}
                </button>
              </div>

              {rep && rep.total > 0 ? (
                <div className="mt-4 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
                  <div className="flex flex-col items-center rounded-xl bg-white/[0.04] px-6 py-3">
                    <span className="leading-none" style={{ ...bebas, fontSize: "3rem", color: OURO }}>{rep.media.toFixed(1)}</span>
                    <Estrelas nota={rep.media} tamanho={15} />
                    <span className="mt-1 text-[11px] font-semibold text-white/45">{rep.total} {copy.card.avaliacoesLabel}</span>
                  </div>
                  <div className="space-y-2">
                    {CATEGORIAS.map((cat) => {
                      const v = rep.categorias[cat.key] ?? 0;
                      return (
                        <div key={cat.key} className="flex items-center gap-3">
                          <span className="w-24 shrink-0 text-[12px] font-bold text-white/70">{locale === "en" ? cat.nomeEn : cat.nome}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                            <div className="h-full rounded-full" style={{ width: `${(v / 5) * 100}%`, background: corNota(v * 2) }} />
                          </div>
                          <span className="w-8 shrink-0 text-right text-[12px] font-black tabular-nums" style={{ color: OURO }}>{v.toFixed(1)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-white/50">{c.semReputacao}</p>
              )}
            </div>
          </div>

          {/* Carta do jogador */}
          <div className="flex shrink-0 justify-center lg:justify-end">
            <CartaJogador
              copy={copyCamp}
              largura={230}
              dados={{
                gamertag: perfil.gamertag,
                proName: perfil.proName,
                posicao: posNome,
                overall: perfil.overall,
                jogos: perfil.temporada?.jogos ?? null,
                gols: perfil.temporada?.gols ?? null,
                assistencias: perfil.temporada?.assist ?? null,
                nota: perfil.temporada?.nota ?? null,
                craques: perfil.temporada?.motm ?? null,
                vitorias: perfil.temporada?.aproveitamento ?? null,
                clube: perfil.clube?.nome ?? null,
                titulo: rep && rep.total >= 3 && rep.media >= 4.5 ? (locale === "en" ? "Community ace" : "Craque da comunidade") : null,
              }}
            />
          </div>
        </section>

        {/* ---------------- Temporada + Carreira ---------------- */}
        {(perfil.temporada || perfil.carreira) && (
          <section className="mt-8 grid gap-4 md:grid-cols-2">
            {perfil.temporada && <TabelaStats titulo={c.temporada} cor={LIMA} linha={perfil.temporada} c={c} />}
            {perfil.carreira && <TabelaStats titulo={c.carreira} cor={CIANO} linha={perfil.carreira} c={c} />}
          </section>
        )}
        {!perfil.temporada && !perfil.carreira && (
          <p className="mt-8 rounded-2xl border border-dashed border-white/12 px-5 py-8 text-center text-sm text-white/50">{c.semStats}</p>
        )}

        {/* ---------------- Temporada, pela EA (percentuais do elenco) ---------------- */}
        {ficha.elenco && <ExtrasTemporada extras={ficha.elenco} copy={copyFicha.elenco} />}

        {/* ---------------- Partida a partida (espelho) ---------------- */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-xl" style={bebas}>
            <Activity size={18} style={{ color: LIMA }} />
            {copyFicha.partidas.titulo.toUpperCase()}
          </h2>
          <p className="mt-1 text-[12.5px] text-white/55">{copyFicha.partidas.sub}</p>

          {ficha.resumo ? (
            <>
              <AvisoWalkover resumo={ficha.resumo} copy={copyFicha.partidas} />
              {ficha.resumo.jogos > 0 && <ResumoPartidasUI resumo={ficha.resumo} copy={copyFicha.partidas} />}
            </>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-white/12 px-5 py-8 text-center text-sm text-white/50">{copyFicha.partidas.vazio}</p>
          )}
        </section>

        {ficha.goleiro && (
          <div className="mt-6">
            <FichaGoleiro dados={ficha.goleiro} copy={copyFicha.goleiro} />
          </div>
        )}

        {ficha.recentes.length > 0 && (
          <UltimasPartidas linhas={ficha.recentes} copy={copyFicha.partidas} locale={locale} />
        )}

        {/* ---------------- No mercado ---------------- */}
        {perfil.vaga && (
          <section className="mt-6 flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center" style={superficie(LIMA)}>
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-2 text-lg" style={bebas}>
                <ArrowRightLeft size={16} style={{ color: LIMA }} />
                {c.noMercado.toUpperCase()}
              </h2>
              <p className="mt-1 text-sm text-white/60">{perfil.vaga.descricao || c.noMercadoSub}</p>
            </div>
            <Link href="/game/mercado" className="inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold" style={{ background: LIMA, color: FUNDO }}>
              {c.verVaga}
            </Link>
          </section>
        )}

        {/* ---------------- Comentários ---------------- */}
        <section className="mt-8">
          <h2 className="text-xl" style={bebas}>{c.comentarios.toUpperCase()}</h2>
          {perfil.comentarios.length === 0 ? (
            <p className="mt-3 text-sm text-white/45">{c.semComentarios}</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {perfil.comentarios.map((com, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2">
                    <Estrelas nota={com.media} tamanho={13} />
                    <span className="text-[12px] font-black tabular-nums" style={{ color: OURO }}>{com.media.toFixed(1)}</span>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/80">“{com.comentario}”</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Procedência: todo número do espelho vem com a idade dele. */}
        <div className="mt-8 space-y-1 text-center text-[11px] text-white/35">
          {perfil.capturedAt && perfil.fonteClube === "espelho" && (
            <p>{copyFicha.procedencia.espelho} · {dataCurta(perfil.capturedAt, locale)}</p>
          )}
          {ficha.partidasLidas > 0 && (
            <p>
              {copyFicha.procedencia.partidas} · {copyFicha.partidas.lidas.replace("{n}", String(ficha.partidasLidas))}
              {ficha.partidasCapturedAt && <> · {copyFicha.partidas.acervo} {dataCurta(ficha.partidasCapturedAt, locale)}</>}
            </p>
          )}
        </div>
      </div>

      {avaliando && (
        <AvaliarModal
          gamertag={perfil.gamertag}
          reputacao={rep ?? undefined}
          copy={copy}
          locale={locale}
          aoFechar={() => setAvaliando(false)}
          aoConcluir={(novo) => {
            if (novo) setRep(novo);
            setAvaliando(false);
          }}
        />
      )}
    </main>
  );
}

function TabelaStats({
  titulo,
  cor,
  linha,
  c,
}: {
  titulo: string;
  cor: string;
  linha: PerfilJogadorDados["temporada"];
  c: CopyMercado["perfil"];
}) {
  if (!linha) return null;
  const cels: Array<{ rot: string; val: number | null; suf?: string; destaque?: boolean }> = [
    { rot: c.cols.jogos, val: linha.jogos },
    { rot: c.cols.gols, val: linha.gols, destaque: true },
    { rot: c.cols.assist, val: linha.assist, destaque: true },
    { rot: c.cols.nota, val: linha.nota },
    { rot: c.cols.craques, val: linha.motm },
    { rot: c.cols.aproveitamento, val: linha.aproveitamento, suf: "%" },
  ];
  return (
    <div className="rounded-2xl border p-5" style={superficie(cor)}>
      <h3 className="text-lg" style={bebas}>{titulo.toUpperCase()}</h3>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {cels.map((cel) => (
          <div key={cel.rot} className="rounded-xl bg-white/[0.04] px-3 py-2.5">
            <div className="leading-none tabular-nums" style={{ ...bebas, fontSize: "1.8rem", color: cel.val == null ? "rgba(255,255,255,.25)" : cel.destaque ? cor : "#fff" }}>
              {cel.val == null ? "—" : cel.rot === c.cols.nota ? cel.val.toFixed(2) : `${Math.round(cel.val)}${cel.suf ?? ""}`}
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/45">{cel.rot}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function dataCurta(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "en" ? "en" : "pt-BR");
}

/** Segundos → "1h 32min" / "48min". A EA publica segundos; ninguém lê segundos. */
function tempo(seg: number): string {
  const min = Math.round(seg / 60);
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h}h ${r}min` : `${h}h`;
}

/**
 * A FAIXA DE VÍNCULO — o que muda entre os dois estados da ficha.
 *
 * Dono: a ficha é sua, e o atalho para a mesa de fichas é um LINK para
 * `/game/apostas` (texto e href — a integração com a biblioteca de apostas vem
 * depois, de outro lado).
 * Visitante: "esse sou eu" (só quando a gamertag está num elenco espelhado, que
 * é a única prova que a API de vínculo aceita) e "não jogo Pro Clubs".
 */
function FaixaVinculo({ ficha, copy }: { ficha: FichaJogadorDados; copy: CopyFicha }) {
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "login" | "erro">("idle");
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  if (ficha.visao === "dono") {
    return (
      <section className="mt-4 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center" style={superficie(LIMA, "forte")}>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-lg" style={bebas}>
            <UserCheck size={16} style={{ color: LIMA }} />
            {copy.dono.titulo.toUpperCase()}
          </h2>
          <p className="mt-1 text-[13px] text-white/60">{copy.dono.sub}</p>
        </div>
        {/*
          O botão leva a gamertag: sem ela, "apostar em mim" caía no saguão
          genérico e a pessoa tinha de abrir partida por partida para descobrir
          se estava escalada em alguma. Com o filtro, o saguão já responde — e
          quando não há nenhuma, ele diz isso em vez de mostrar lista vazia.
        */}
        <Link
          href={`/game/apostas?jogador=${encodeURIComponent(ficha.perfil.gamertag)}`}
          className="inline-flex shrink-0 flex-col items-start rounded-xl px-5 py-2.5 sm:items-center"
          style={{ background: LIMA, color: FUNDO }}
        >
          <span className="inline-flex items-center gap-2 text-sm font-bold">
            <Coins size={14} />
            {copy.dono.apostar}
          </span>
          <span className="text-[10.5px] font-semibold opacity-75">{copy.dono.apostarSub}</span>
        </Link>
      </section>
    );
  }

  const v = ficha.vinculoPossivel;

  async function vincular() {
    if (!v || estado === "enviando") return;
    setEstado("enviando");
    setErroMsg(null);
    const res = await fetch("/api/game/jogador/vincular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eaClubId: v.eaClubId, gamertag: ficha.perfil.gamertag, plataforma: v.plataforma }),
    }).catch(() => null);
    if (res?.ok) setEstado("ok");
    else if (res?.status === 401) setEstado("login");
    else {
      setErroMsg((await res?.json().catch(() => null))?.error ?? null);
      setEstado("erro");
    }
  }

  return (
    <section className="mt-4 grid gap-3 md:grid-cols-2">
      {/* Esse sou eu */}
      <div className="rounded-2xl border p-4" style={superficie(LIMA)}>
        <h2 className="flex items-center gap-2 text-lg" style={bebas}>
          <UserCheck size={16} style={{ color: LIMA }} />
          {copy.livre.titulo.toUpperCase()}
        </h2>
        <p className="mt-1 text-[13px] text-white/60">{copy.livre.sub}</p>

        {ficha.visao === "reivindicado-por-outro" ? (
          <p className="mt-3 text-[12.5px] font-semibold text-white/50">{copy.livre.outroDono}</p>
        ) : ficha.meuPro ? (
          <p className="mt-3 text-[12.5px] text-white/60">
            {copy.livre.jaTenhoPro} <b className="text-white">{ficha.meuPro.gamertag}</b>{" "}
            <Link href={`/game/jogador/${encodeURIComponent(ficha.meuPro.gamertag)}`} className="font-bold" style={{ color: LIMA }}>
              {copy.livre.verMinhaFicha}
            </Link>
          </p>
        ) : estado === "ok" ? (
          <p className="mt-3 inline-flex items-center gap-2 text-[12.5px] font-bold" style={{ color: LIMA }}>
            <BadgeCheck size={14} />
            {copy.livre.vinculado}
          </p>
        ) : !v ? (
          <p className="mt-3 text-[12.5px] text-white/50">{copy.livre.semElenco}</p>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {!ficha.logado || estado === "login" ? (
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold" style={{ background: LIMA, color: FUNDO }}>
                {copy.livre.entrarParaVincular}
              </Link>
            ) : (
              <button
                type="button"
                onClick={vincular}
                disabled={estado === "enviando"}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: LIMA, color: FUNDO }}
              >
                <BadgeCheck size={14} />
                {estado === "enviando" ? copy.livre.vinculando : copy.livre.souEu}
              </button>
            )}
            <span className="text-[12px] text-white/50">{copy.livre.souEuSub.replace("{clube}", v.clubeNome ?? v.eaClubId)}</span>
            {estado === "erro" && (
              <span className="text-[12px] font-semibold" style={{ color: RUBRO }}>{erroMsg ?? copy.livre.erro}</span>
            )}
          </div>
        )}
      </div>

      {/* Não jogo Pro Clubs */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
        <h2 className="text-lg" style={bebas}>{copy.livre.naoJogo.toUpperCase()}</h2>
        <p className="mt-1 text-[13px] text-white/60">{copy.livre.naoJogoSub}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/game/apostas" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold" style={{ borderColor: `${LIMA}55`, color: LIMA }}>
            <Coins size={14} />
            {copy.livre.irApostar}
          </Link>
          <Link href="/game/mercado" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white/80 hover:text-white">
            <ArrowRightLeft size={14} />
            {copy.livre.irMercado}
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * O aviso de W.O. é INFORMAÇÃO, não rodapé: se 26,5% das partidas do espelho
 * são abandono registrado como 3–0 (medido em 08/09/2026, 215 partidas), quem
 * lê a média precisa saber quantas ficaram de fora, e por quê.
 */
function AvisoWalkover({ resumo, copy }: { resumo: ResumoPartidas; copy: CopyFicha["partidas"] }) {
  if (resumo.walkoversExcluidos === 0) return null;
  const n = resumo.walkoversExcluidos;
  return (
    <div className="mt-4 flex items-start gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: `${RUBRO}44`, background: `${RUBRO}0d` }}>
      <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: RUBRO }} />
      <div className="min-w-0">
        <p className="text-sm font-bold text-white/90">
          {n === 1 ? copy.walkoverUm : copy.walkover.replace("{n}", String(n))}
          {resumo.golsEmWalkover > 0 && (
            <span className="font-semibold text-white/55"> · {copy.walkoverGols.replace("{n}", String(resumo.golsEmWalkover))}</span>
          )}
        </p>
        <p className="mt-0.5 text-[12px] text-white/50">{copy.walkoverSub}</p>
      </div>
    </div>
  );
}

function ResumoPartidasUI({ resumo, copy }: { resumo: ResumoPartidas; copy: CopyFicha["partidas"] }) {
  const cols = copy.cols;
  const fmtPct = (p: number | null) => (p == null ? "—" : `${p}%`);
  const principais: Array<{ rot: string; val: string; cor?: string }> = [
    { rot: cols.jogos, val: String(resumo.jogos) },
    { rot: cols.vitorias, val: String(resumo.vitorias), cor: corResultado("win") },
    { rot: cols.empates, val: String(resumo.empates), cor: corResultado("draw") },
    { rot: cols.derrotas, val: String(resumo.derrotas), cor: corResultado("loss") },
    { rot: cols.aproveitamento, val: fmtPct(resumo.aproveitamento) },
    { rot: cols.gols, val: String(resumo.gols), cor: LIMA },
    { rot: cols.assist, val: String(resumo.assist), cor: LIMA },
    { rot: cols.chutes, val: String(resumo.chutes) },
    { rot: cols.nota, val: resumo.notaMedia == null ? "—" : resumo.notaMedia.toFixed(2), cor: corNota(resumo.notaMedia) },
    // Ouro só aqui: craque do jogo é recompensa.
    { rot: cols.craques, val: String(resumo.craques), cor: resumo.craques > 0 ? OURO : undefined },
    { rot: cols.vermelhos, val: String(resumo.vermelhos), cor: resumo.vermelhos > 0 ? RUBRO : undefined },
  ];

  const setores = (Object.keys(resumo.setores) as Array<keyof typeof resumo.setores>)
    .filter((s) => resumo.setores[s] > 0)
    .sort((a, b) => resumo.setores[b] - resumo.setores[a]);

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {principais.map((cel) => (
          <div key={cel.rot} className="rounded-xl bg-white/[0.04] px-3 py-2.5">
            <div className="leading-none tabular-nums" style={{ ...bebas, fontSize: "1.8rem", color: cel.cor ?? "#fff" }}>{cel.val}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/45">{cel.rot}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {/* Volume E acerto: a EA publica feitos e tentados; a % é nossa, da soma. */}
        <div className="rounded-2xl border p-4" style={superficie(CIANO)}>
          <h3 className="text-base" style={bebas}>{cols.passes.toUpperCase()}</h3>
          {resumo.passes ? (
            <>
              <div className="mt-1 leading-none tabular-nums" style={{ ...bebas, fontSize: "2rem", color: CIANO }}>{fmtPct(resumo.passes.pct)}</div>
              <p className="text-[12px] text-white/55">{resumo.passes.feitos} / {resumo.passes.tentados} · {cols.acerto}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-white/40">—</p>
          )}
          <h3 className="mt-4 text-base" style={bebas}>{cols.desarmes.toUpperCase()}</h3>
          {resumo.desarmes ? (
            <>
              <div className="mt-1 leading-none tabular-nums" style={{ ...bebas, fontSize: "2rem", color: CIANO }}>{fmtPct(resumo.desarmes.pct)}</div>
              <p className="text-[12px] text-white/55">{resumo.desarmes.feitos} / {resumo.desarmes.tentados} · {cols.acerto}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-white/40">—</p>
          )}
        </div>

        {/* Tempo em campo e tempo parado — o que denuncia quem largou o controle. */}
        <div className="rounded-2xl border p-4" style={superficie(LIMA)}>
          <h3 className="flex items-center gap-2 text-base" style={bebas}>
            <Timer size={14} style={{ color: LIMA }} />
            {cols.emCampo.toUpperCase()}
          </h3>
          <div className="mt-1 leading-none tabular-nums" style={{ ...bebas, fontSize: "2rem" }}>{tempo(resumo.segundosJogados)}</div>
          <h3 className="mt-4 text-base" style={bebas}>{cols.parado.toUpperCase()}</h3>
          <div className="mt-1 leading-none tabular-nums" style={{ ...bebas, fontSize: "2rem", color: resumo.pctParado != null && resumo.pctParado >= 10 ? RUBRO : "#fff" }}>
            {tempo(resumo.segundosParado)}
          </div>
          {resumo.pctParado != null && <p className="text-[12px] text-white/55">{resumo.pctParado}% {cols.parado.toLowerCase()}</p>}
        </div>

        {/* Onde jogou + arquétipo (código cru, rotulado como não confirmado). */}
        <div className="rounded-2xl border p-4" style={superficie(corSetor(setores[0] ?? "—"))}>
          <h3 className="text-base" style={bebas}>{cols.setores.toUpperCase()}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {setores.map((s) => (
              <span key={s} className="rounded-md px-2 py-0.5 text-[11px] font-black" style={{ background: `${corSetor(s)}1c`, color: corSetor(s) }}>
                {copy.setor[s]} · {resumo.setores[s]}
              </span>
            ))}
          </div>
          {resumo.arquetipo && (
            <>
              <h3 className="mt-4 text-base" style={bebas}>{cols.arquetipo.toUpperCase()}</h3>
              <div className="mt-1 leading-none tabular-nums" style={{ ...bebas, fontSize: "1.6rem" }}>#{resumo.arquetipo.id}</div>
              <p className="text-[11px] text-white/45">{cols.arquetipoSub} · {resumo.arquetipo.vezes}× </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Os percentuais e a forma que a EA publica no elenco — mostrados, não recalculados. */
function ExtrasTemporada({ extras, copy }: { extras: ExtrasElenco; copy: CopyFicha["elenco"] }) {
  const fmtPct = (p: number | null) => (p == null ? "—" : `${Math.round(p)}%`);
  const cels: Array<{ rot: string; val: string; cor?: string }> = [
    { rot: copy.passe, val: fmtPct(extras.passSuccessRate), cor: CIANO },
    { rot: copy.chute, val: fmtPct(extras.shotSuccessRate), cor: LIMA },
    { rot: copy.desarme, val: fmtPct(extras.tackleSuccessRate), cor: CIANO },
    { rot: copy.passes, val: extras.passesMade == null ? "—" : String(extras.passesMade) },
    { rot: copy.desarmes, val: extras.tacklesMade == null ? "—" : String(extras.tacklesMade) },
    { rot: copy.semSofrerDef, val: extras.cleanSheetsDef == null ? "—" : String(extras.cleanSheetsDef) },
    { rot: copy.semSofrerGk, val: extras.cleanSheetsGk == null ? "—" : String(extras.cleanSheetsGk) },
    { rot: copy.vermelhos, val: extras.redCards == null ? "—" : String(extras.redCards), cor: extras.redCards ? RUBRO : undefined },
  ];
  const temAlgo = cels.some((c) => c.val !== "—") || extras.recentGoals.length > 0;
  if (!temAlgo) return null;
  const maxGols = Math.max(1, ...extras.recentGoals);

  return (
    <section className="mt-6 rounded-2xl border p-5" style={superficie(CIANO)}>
      <h2 className="text-lg" style={bebas}>{copy.titulo.toUpperCase()}</h2>
      <p className="mt-1 text-[12.5px] text-white/55">{copy.sub}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cels.map((cel) => (
          <div key={cel.rot} className="rounded-xl bg-white/[0.04] px-3 py-2.5">
            <div className="leading-none tabular-nums" style={{ ...bebas, fontSize: "1.8rem", color: cel.val === "—" ? "rgba(255,255,255,.25)" : cel.cor ?? "#fff" }}>{cel.val}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/45">{cel.rot}</div>
          </div>
        ))}
      </div>
      {extras.recentGoals.length > 0 && (
        <div className="mt-4">
          <h3 className="text-base" style={bebas}>{copy.forma.toUpperCase()}</h3>
          <p className="text-[11.5px] text-white/45">{copy.formaSub}</p>
          {/* A linha de forma sai de `recentGoals`, de graça, sem uma requisição a mais. */}
          <div className="mt-2 flex h-14 items-end gap-1">
            {extras.recentGoals.map((g, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1" title={`${g}`}>
                <div className="w-full rounded-t" style={{ height: `${Math.max(6, (g / maxGols) * 44)}px`, background: g > 0 ? LIMA : "rgba(255,255,255,.1)" }} />
                <span className="text-[10px] font-bold tabular-nums text-white/55">{g}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function UltimasPartidas({ linhas, copy, locale }: { linhas: LinhaPartidaJogador[]; copy: CopyFicha["partidas"]; locale: string }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg" style={bebas}>{copy.ultimas.toUpperCase()}</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-white/[0.08]">
        <table className="w-full min-w-[640px] text-left text-[12.5px]">
          <thead className="text-[10px] font-bold uppercase tracking-wide text-white/45">
            <tr className="border-b border-white/[0.08]">
              <th className="px-3 py-2">{copy.cols.partida}</th>
              <th className="px-3 py-2"> </th>
              <th className="px-3 py-2">{copy.cols.adversario}</th>
              <th className="px-3 py-2 text-right">{copy.cols.gols}</th>
              <th className="px-3 py-2 text-right">{copy.cols.assist}</th>
              <th className="px-3 py-2 text-right">{copy.cols.nota}</th>
              <th className="px-3 py-2 text-right">{copy.cols.emCampo}</th>
              <th className="px-3 py-2">{copy.cols.setores}</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.matchId} className="border-b border-white/[0.05] last:border-0">
                <td className="px-3 py-2">
                  <span className="inline-block w-6 rounded text-center text-[11px] font-black" style={{ background: `${corResultado(l.resultado)}22`, color: corResultado(l.resultado) }}>
                    {copy.resultado[l.resultado]}
                  </span>
                  <span className="ml-2 tabular-nums text-white/80">{l.placar.pro}–{l.placar.contra}</span>
                </td>
                <td className="px-3 py-2 text-white/60">
                  {copy.tipo[l.tipo]}{l.quando && <> · {dataCurta(l.quando, locale)}</>}
                </td>
                <td className="px-3 py-2 text-white/80">
                  {l.adversario ? (
                    <Link href={`/game/clube/${l.adversario.id}`} className="hover:text-white">{l.adversario.nome}</Link>
                  ) : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums" style={{ color: l.gols > 0 ? LIMA : undefined }}>{l.gols}</td>
                <td className="px-3 py-2 text-right tabular-nums">{l.assist}</td>
                <td className="px-3 py-2 text-right tabular-nums font-bold" style={{ color: corNota(l.nota) }}>
                  {l.nota == null ? "—" : l.nota.toFixed(1)}
                  {l.craque && <Star size={11} className="ml-1 inline" style={{ color: OURO }} />}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-white/70">
                  {l.segundosJogados == null ? "—" : tempo(l.segundosJogados)}
                  {l.setor === "GOL" && l.defesas != null && <span className="ml-1 text-white/45">· {l.defesas} {copy.cols.defesasCurto}</span>}
                </td>
                <td className="px-3 py-2">
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-black" style={{ background: `${corSetor(l.setor)}1c`, color: corSetor(l.setor) }}>
                    {copy.setor[l.setor]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
