"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Shield,
  Gamepad2,
  Star,
  ArrowRightLeft,
  Radio,
} from "lucide-react";
import type { CopyMercado } from "@/lib/game/copy-mercado";
import { getCopyCampeonato } from "@/lib/game/copy-campeonato";
import type { PerfilJogadorDados } from "@/lib/game/perfil-servidor";
import { AvatarJogador } from "./AvatarJogador";
import { CartaJogador } from "./CartaJogador";
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
} from "@/lib/game/tema";

/**
 * PÁGINA DE PERFIL DO JOGADOR — a casa de UMA pessoa no Winners 22.
 *
 * Junta o rosto (o bonequinho e a carta), a REPUTAÇÃO da comunidade com os
 * comentários, e a CARREIRA + TEMPORADA lidas do clube. É onde o "banco dos
 * bons jogadores" vira uma página que dá para mandar para alguém.
 */
export function PerfilJogador({
  perfil,
  copy,
  locale,
}: {
  perfil: PerfilJogadorDados;
  copy: CopyMercado;
  locale: string;
}) {
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
                  {perfil.reivindicado ? (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: `${LIMA}18`, color: LIMA }}>
                      <BadgeCheck size={12} />
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

        {perfil.capturedAt && perfil.fonteClube === "espelho" && (
          <p className="mt-8 text-center text-[11px] text-white/35">
            {locale === "en" ? "Club data from our archive" : "Dados do clube do nosso acervo"} · {new Date(perfil.capturedAt).toLocaleDateString(locale === "en" ? "en" : "pt-BR")}
          </p>
        )}
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
