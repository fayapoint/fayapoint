"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  Trophy,
  Loader2,
  ShieldCheck,
  Radio,
  Users,
  Target,
  Hand,
  AlertTriangle,
  ExternalLink,
  Coins,
  ChevronDown,
  Newspaper,
  Scale,
  Clock,
} from "lucide-react";
import {
  LIMA,
  OURO,
  CIANO,
  VIOLETA,
  ROSA,
  RUBRO,
  CINZA,
  FUNDO,
  bebas,
  superficie,
  corNota,
} from "@/lib/game/tema";
import { FaixaDeCena, FundoDeCena, CENAS } from "./CenaW22";
import { AcervoDoCampeonato } from "./AcervoDoCampeonato";

/**
 * A PÁGINA DA SUPER COPA DOS STREAMERS — 08/09/2026.
 *
 * ## A decisão que governa a tela inteira
 *
 * Existem cinco sites publicando esta copa. Nenhum deles PROVA nada — todos
 * republicam a tabela que a organização informa.
 *
 * ⚠️ Este comentário já disse que dois deles eram "o mesmo site" por
 * responderem dos mesmos IPs. Era erro meu: aqueles IPs são da **Cloudflare**,
 * compartilhados por milhões de domínios. Medição real, conclusão que ela não
 * sustenta — exatamente o defeito que este arquivo existe para evitar. O que
 * importa não era a independência deles, e sim que **nenhum observa a
 * partida**.
 *
 * O que temos e ninguém tem é a **fonte primária**: a API pública de Clubs da
 * EA, com placar e súmula por jogador. Então a tela não compete em "mostrar a
 * tabela" — ela compete em **mostrar de onde cada número veio**.
 *
 * Daí o selo em toda linha:
 *   🟢 EA           — placar observado na fonte, com súmula
 *   🟡 Organização  — declarado pelo site oficial, não observado
 *   🔴 Não confere  — os dois falam do mesmo jogo e discordam
 *
 * ## E a disciplina que o selo vermelho exige
 *
 * Divergência **não é acusação**. As causas prováveis, em ordem, são todas
 * nossas antes de serem da organização: de-para de clube errado, janela de 10
 * amistosos da EA cortando histórico, pontuação por série e não por jogo.
 * Por isso a tela mostra os dois números **lado a lado** e explica, em vez de
 * eleger um vencedor.
 *
 * ## O que a tela NÃO diz
 *
 * Nunca "jogos da copa". Sempre "confrontos entre times da copa registrados
 * pela EA". A API não distingue jogo oficial de treino entre dois times da
 * copa — a prova apareceu no primeiro teste, com um Equipe X (grupo C) contra
 * Botafofo (grupo A), que na fase de grupos não existe.
 */

interface TimeCopa {
  nome: string;
  presidente: string | null;
  grupo: string | null;
  eaClubName: string | null;
  eaClubId: string | null;
  vinculo: "confirmado" | "provavel" | "nao-encontrado";
  evidencia: string[];
}

interface LinhaEA {
  time: string;
  grupo?: string;
  series: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  pontos: number;
}

interface Serie {
  timeCasa: string;
  timeFora: string;
  vitoriasCasa: number;
  vitoriasFora: number;
  comecouEm: string;
  jogos: Array<{ matchId: string; em: string; golsCasa: number; golsFora: number; walkover: boolean }>;
}

interface Jogador {
  gamertag: string;
  time: string;
  gols: number;
  assistencias: number;
  jogos: number;
  nota: number;
  defesas: number;
}

interface Declaracao {
  fonte: string;
  url: string | null;
  afirma: Record<string, string | number>;
  lidoEm: string;
}

interface Noticia {
  titulo: string;
  fonte: string;
  url: string;
  em: string | null;
  resumo: string | null;
}

interface Dados {
  copa: {
    slug: string;
    nome: string;
    edicao?: string;
    jogo: string;
    descricao?: string;
    organizacao?: { nome?: string; presidentes: string[]; sites: string[] };
    formato: { times: number; grupos: number; jogosPorConfrontoGrupo: number };
    comecouEm?: string;
    times: TimeCopa[];
  };
  declaracoes: Declaracao[];
  noticias: Noticia[];
  pelaEA: LinhaEA[];
  series: Serie[];
  artilharia: Jogador[];
  goleiros: Jogador[];
  cobertura: { timesVinculados: number; timesTotal: number; confrontos: number; partidas: number; aviso: string };
}

const COR_GRUPO: Record<string, string> = { A: LIMA, B: CIANO, C: VIOLETA, D: ROSA };

export function PaginaDaCopa({ slug, locale }: { slug: string; locale: string }) {
  const [d, setD] = useState<Dados | null | "erro">(null);

  useEffect(() => {
    fetch(`/api/game/copa/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setD)
      .catch(() => setD("erro"));
  }, [slug]);

  if (d === null) {
    return (
      <div style={{ background: FUNDO }} className="flex min-h-screen items-center justify-center text-white/50">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (d === "erro") {
    return (
      <div style={{ background: FUNDO }} className="min-h-screen p-10 text-white">
        <p>Não encontramos esta copa.</p>
        <Link href="/game" locale={locale} style={{ color: LIMA }} className="mt-3 inline-block">
          ← Winners 22
        </Link>
      </div>
    );
  }

  const { copa, pelaEA, series, artilharia, goleiros, cobertura, declaracoes, noticias } = d;
  const grupos = [...new Set(copa.times.map((t) => t.grupo).filter(Boolean))].sort() as string[];

  return (
    <div style={{ background: FUNDO }} className="min-h-screen text-white">
      {/* ---- Capa ---- */}
      <header className="relative overflow-hidden border-b border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element -- arte local estática */}
        <img
          src={CENAS.estudio}
          alt=""
          aria-hidden
          fetchPriority="high"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[.30]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: `linear-gradient(to top, ${FUNDO} 6%, ${FUNDO}dd 45%, ${FUNDO}55 100%)` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[.16]"
          style={{
            background: `radial-gradient(60% 90% at 15% 0%, ${LIMA} 0%, transparent 60%), radial-gradient(50% 80% at 85% 10%, ${VIOLETA} 0%, transparent 60%)`,
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <Link
            href="/game"
            locale={locale}
            className="text-xs uppercase tracking-widest text-white/40 transition hover:text-white"
          >
            ← Winners 22
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest">
            <span style={{ borderColor: `${LIMA}44`, color: LIMA }} className="rounded-full border px-3 py-1">
              {copa.jogo} · Pro Clubs
            </span>
            {copa.edicao && <span className="text-white/40">{copa.edicao}</span>}
          </div>

          <h1 style={bebas} className="mt-4 max-w-3xl text-5xl uppercase leading-[0.95] sm:text-7xl">
            {copa.nome}
          </h1>
          {copa.descricao && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">{copa.descricao}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <Dado rotulo="Times" valor={String(copa.formato.times)} />
            <Dado rotulo="Grupos" valor={String(copa.formato.grupos)} />
            <Dado rotulo="Confronto" valor={`MD${copa.formato.jogosPorConfrontoGrupo}`} />
            {copa.organizacao?.presidentes?.length ? (
              <Dado rotulo="Presidentes" valor={copa.organizacao.presidentes.join(" · ")} />
            ) : null}
          </div>

          <p className="mt-6 max-w-2xl text-xs leading-relaxed text-white/35">
            Competição organizada por terceiros. O Winners 22 não a organiza, não a arbitra e
            não tem vínculo com ela — nós a <strong className="text-white/55">cobrimos</strong>,
            lendo a fonte pública da EA.
            {copa.organizacao?.sites?.length ? (
              <>
                {" "}Site oficial:{" "}
                {copa.organizacao.sites.slice(0, 2).map((s, i) => (
                  <a
                    key={s}
                    href={s}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="underline decoration-white/20 underline-offset-2 transition hover:text-white/70"
                  >
                    {i > 0 ? " · " : ""}
                    {new URL(s).hostname}
                  </a>
                ))}
              </>
            ) : null}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <Cobertura c={cobertura} times={copa.times} />

        {/* ---- Grupos ---- */}
        <section className="mt-12">
          <Titulo icone={Users} cor={LIMA}>
            Os grupos
          </Titulo>
          <p className="mt-1 max-w-2xl text-sm text-white/50">
            O que a <strong className="text-white/75">API da EA</strong> registrou dos confrontos
            entre times da copa. Contado por jogo — a copa pontua por confronto MD
            {copa.formato.jogosPorConfrontoGrupo}, então isto não é a tabela oficial: é o lado
            observável dela.
          </p>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {grupos.map((g) => (
              <TabelaGrupo
                key={g}
                grupo={g}
                times={copa.times.filter((t) => t.grupo === g)}
                linhas={pelaEA.filter((l) => l.grupo === g)}
              />
            ))}
          </div>
        </section>

        <div className="mt-12">
          <FaixaDeCena
            cena="tunel"
            alt="Jogadores entrando em campo pelo túnel do estádio"
            altura="h-40 sm:h-56"
            titulo="Cada confronto é uma série"
            linha="Medimos três jogos em quarenta minutos entre os mesmos dois clubes — é o MD5 anunciado, jogado de uma vez."
          />
        </div>

        {/* ---- Séries ---- */}
        <section className="mt-8">
          <Titulo icone={Trophy} cor={OURO}>
            Os confrontos
          </Titulo>
          <p className="mt-1 max-w-2xl text-sm text-white/50">
            Cada confronto é uma série jogada de uma vez — medimos três jogos em quarenta
            minutos. Placar a placar, direto da fonte.
          </p>
          <div className="mt-6 space-y-3">
            {series.length === 0 && (
              <p style={superficie(CINZA)} className="rounded-2xl border p-6 text-sm text-white/55">
                Nenhum confronto capturado ainda.
              </p>
            )}
            {series.map((s, i) => (
              <CartaoSerie key={i} s={s} />
            ))}
          </div>
        </section>

        {/* ---- Craques ---- */}
        <section className="mt-14 grid gap-6 lg:grid-cols-2">
          <div>
            <Titulo icone={Target} cor={OURO}>
              Artilharia
            </Titulo>
            <TabelaJogadores lista={artilharia} coluna="gols" />
          </div>
          <div>
            <Titulo icone={Hand} cor={CIANO}>
              Goleiros
            </Titulo>
            <p className="mt-1 text-xs text-white/40">
              Defesas por partida — dado que a EA publica e nenhum tracker mostra.
            </p>
            <TabelaJogadores lista={goleiros} coluna="defesas" />
          </div>
        </section>

        <AcervoDoCampeonato escopo="copa" refId={copa.slug} />

        <FontesENoticias declaracoes={declaracoes} noticias={noticias} />

        <PalcoDaCopa locale={locale} nome={copa.nome} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-white/35">{rotulo}</p>
      <p style={bebas} className="text-xl leading-tight">
        {valor}
      </p>
    </div>
  );
}

function Titulo({ icone: Icone, cor, children }: { icone: typeof Users; cor: string; children: React.ReactNode }) {
  return (
    <h2 style={bebas} className="flex items-center gap-2 text-3xl uppercase tracking-wide">
      <Icone className="h-6 w-6" style={{ color: cor }} />
      {children}
    </h2>
  );
}

/**
 * A faixa de cobertura — o que temos e o que não temos, antes de qualquer
 * número. Vem PRIMEIRO de propósito: quem lê a tabela precisa saber o que ela
 * é antes de acreditar nela.
 */
function Cobertura({ c, times }: { c: Dados["cobertura"]; times: TimeCopa[] }) {
  const [aberto, setAberto] = useState(false);
  const semVinculo = times.filter((t) => !t.eaClubId);
  const provaveis = times.filter((t) => t.vinculo === "provavel");

  return (
    <div style={superficie(VIOLETA)} className="relative overflow-hidden rounded-2xl border p-5">
      <FundoDeCena cena="constelacao" opacidade={0.18} />
      <div className="relative flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: VIOLETA }} />
        <div className="min-w-0 flex-1">
          <p style={bebas} className="text-lg uppercase tracking-wide">
            De onde vêm estes números
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/60">
            Lemos a <strong className="text-white/85">API pública de Clubs da EA</strong> — a
            mesma que o site oficial da EA consome — e guardamos o que ela mostra.{" "}
            <strong className="text-white/85">
              {c.timesVinculados} de {c.timesTotal}
            </strong>{" "}
            times já foram ligados ao clube deles no jogo, com{" "}
            <strong className="text-white/85">{c.confrontos}</strong> confrontos capturados.
          </p>

          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-white/45">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: OURO }} />
            <span>{c.aviso}</span>
          </p>

          <button
            type="button"
            onClick={() => setAberto((a) => !a)}
            className="mt-3 flex items-center gap-1 text-xs text-white/50 transition hover:text-white"
          >
            Como identificamos cada time
            <ChevronDown className={`h-3.5 w-3.5 transition ${aberto ? "rotate-180" : ""}`} />
          </button>

          {aberto && (
            <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
              <p className="text-xs leading-relaxed text-white/50">
                Os nomes que a organização publica <strong className="text-white/75">não são</strong>{" "}
                os nomes de dentro do jogo — &quot;Osempic do Marcelo&quot; é{" "}
                <code className="text-white/70">OsempicDMarcelo</code>, &quot;Ice Nuggets&quot; é{" "}
                <code className="text-white/70">ICE NUGETS OFC</code>. Ligamos os dois por
                semelhança de nome e confirmamos vendo o clube jogar contra outro já confirmado.
              </p>
              <ul className="space-y-1.5 text-xs">
                {times
                  .filter((t) => t.evidencia.length > 0)
                  .map((t) => (
                    <li key={t.nome} className="flex flex-wrap items-baseline gap-x-2">
                      <SeloVinculo v={t.vinculo} />
                      <span className="text-white/75">{t.nome}</span>
                      <span className="text-white/35">→ {t.eaClubName}</span>
                      <span className="text-white/30">· {t.evidencia[0]}</span>
                    </li>
                  ))}
              </ul>
              {provaveis.length > 0 && (
                <p className="text-xs text-white/40">
                  <strong style={{ color: OURO }}>{provaveis.length} provável(is)</strong>: nome e
                  assinatura batem, mas ainda não vimos jogar contra um time já confirmado.
                </p>
              )}
              {semVinculo.length > 0 && (
                <p className="text-xs text-white/40">
                  <strong style={{ color: RUBRO }}>Sem vínculo ({semVinculo.length})</strong>:{" "}
                  {semVinculo.map((t) => t.nome).join(", ")} — nenhum clube com a assinatura da copa
                  foi achado. Eles aparecem quando enfrentarem um time já mapeado.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SeloVinculo({ v }: { v: TimeCopa["vinculo"] }) {
  const cor = v === "confirmado" ? LIMA : v === "provavel" ? OURO : RUBRO;
  const texto = v === "confirmado" ? "confirmado" : v === "provavel" ? "provável" : "sem vínculo";
  return (
    <span
      style={{ borderColor: `${cor}55`, color: cor }}
      className="shrink-0 rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
    >
      {texto}
    </span>
  );
}

function TabelaGrupo({
  grupo,
  times,
  linhas,
}: {
  grupo: string;
  times: TimeCopa[];
  linhas: LinhaEA[];
}) {
  const cor = COR_GRUPO[grupo] ?? LIMA;
  const porNome = new Map(linhas.map((l) => [l.time, l]));
  // Ordena pelos que têm dado; os sem dado vão para o fim, sem inventar posição.
  const ordenados = [...times].sort((a, b) => {
    const la = porNome.get(a.nome);
    const lb = porNome.get(b.nome);
    if (!la && !lb) return a.nome.localeCompare(b.nome);
    if (!la) return 1;
    if (!lb) return -1;
    return lb.pontos - la.pontos || lb.golsPro - lb.golsContra - (la.golsPro - la.golsContra);
  });

  return (
    <div style={superficie(cor)} className="overflow-hidden rounded-2xl border">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span style={{ ...bebas, color: cor }} className="text-2xl leading-none">
          {grupo}
        </span>
        <span className="text-xs uppercase tracking-widest text-white/35">grupo</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-white/30">
            <th className="px-4 py-2 text-left font-normal">Time</th>
            <th className="px-1 py-2 text-right font-normal">P</th>
            <th className="px-1 py-2 text-right font-normal">J</th>
            <th className="px-1 py-2 text-right font-normal">V</th>
            <th className="px-1 py-2 text-right font-normal">D</th>
            <th className="px-3 py-2 text-right font-normal">Gols</th>
          </tr>
        </thead>
        <tbody>
          {ordenados.map((t) => {
            const l = porNome.get(t.nome);
            return (
              <tr key={t.nome} className="border-t border-white/5">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-1 shrink-0 rounded-full"
                      style={{ background: l ? cor : "rgba(255,255,255,.12)" }}
                    />
                    <span className={l ? "" : "text-white/35"}>{t.nome}</span>
                  </div>
                  {t.presidente && (
                    <span className="ml-3 text-[10px] uppercase tracking-wider text-white/30">
                      {t.presidente}
                    </span>
                  )}
                </td>
                {l ? (
                  <>
                    <td style={{ ...bebas, color: cor }} className="px-1 py-2.5 text-right text-base">
                      {l.pontos}
                    </td>
                    <td className="px-1 py-2.5 text-right text-white/60">{l.jogos}</td>
                    <td className="px-1 py-2.5 text-right text-white/60">{l.vitorias}</td>
                    <td className="px-1 py-2.5 text-right text-white/60">{l.derrotas}</td>
                    <td className="px-3 py-2.5 text-right text-white/45">
                      {l.golsPro}:{l.golsContra}
                    </td>
                  </>
                ) : (
                  <td colSpan={5} className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider text-white/25">
                    sem dado na EA
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CartaoSerie({ s }: { s: Serie }) {
  const casaVence = s.vitoriasCasa > s.vitoriasFora;
  const data = new Date(s.comecouEm).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div style={superficie(CINZA)} className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3 text-[11px] text-white/35">
        <span>{data}</span>
        <span>{s.jogos.length} jogo(s)</span>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <p className={`truncate text-right ${casaVence ? "text-white" : "text-white/50"}`}>
          {s.timeCasa}
        </p>
        <p style={bebas} className="text-2xl leading-none">
          <span style={{ color: casaVence ? LIMA : "rgba(255,255,255,.4)" }}>{s.vitoriasCasa}</span>
          <span className="text-white/20"> × </span>
          <span style={{ color: !casaVence ? LIMA : "rgba(255,255,255,.4)" }}>{s.vitoriasFora}</span>
        </p>
        <p className={`truncate ${!casaVence ? "text-white" : "text-white/50"}`}>{s.timeFora}</p>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {s.jogos.map((j) => (
          <span
            key={j.matchId}
            title={j.walkover ? "abandono (3–0 administrativo da EA) — fora do placar da série" : undefined}
            style={{
              borderColor: j.walkover ? `${OURO}44` : "rgba(255,255,255,.12)",
              color: j.walkover ? OURO : "rgba(255,255,255,.7)",
            }}
            className="rounded border px-2 py-0.5 font-mono text-[11px]"
          >
            {j.golsCasa}–{j.golsFora}
            {j.walkover && <span className="ml-1 text-[9px]">W.O.</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function TabelaJogadores({ lista, coluna }: { lista: Jogador[]; coluna: "gols" | "defesas" }) {
  if (lista.length === 0) {
    return (
      <p style={superficie(CINZA)} className="mt-4 rounded-2xl border p-5 text-sm text-white/50">
        Nada capturado ainda.
      </p>
    );
  }
  return (
    <div style={superficie(CINZA)} className="mt-4 overflow-hidden rounded-2xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-white/30">
            <th className="px-4 py-2 text-left font-normal">Jogador</th>
            <th className="px-2 py-2 text-right font-normal">{coluna === "gols" ? "G" : "Def"}</th>
            <th className="px-2 py-2 text-right font-normal">{coluna === "gols" ? "A" : "J"}</th>
            <th className="px-4 py-2 text-right font-normal">Nota</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((j) => (
            <tr key={j.time + j.gamertag} className="border-t border-white/5">
              <td className="px-4 py-2">
                <span className="text-white/85">{j.gamertag}</span>
                <span className="ml-2 text-[10px] uppercase tracking-wider text-white/30">{j.time}</span>
              </td>
              <td style={{ ...bebas, color: OURO }} className="px-2 py-2 text-right text-base">
                {coluna === "gols" ? j.gols : j.defesas}
              </td>
              <td className="px-2 py-2 text-right text-white/55">
                {coluna === "gols" ? j.assistencias : j.jogos}
              </td>
              <td className="px-4 py-2 text-right" style={{ color: corNota(j.nota) }}>
                {j.nota.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A ligação com a mesa de apostas.
 *
 * ⚠️ E o limite que ela respeita. Pelo Art. 11 do regulamento, aposta só em
 * partida SIMULADA; pelo Art. 18, aposta em partida real de gente não abre sem
 * identidade verificada. Esta copa é de terceiros: não temos identidade dos
 * jogadores, não temos consentimento deles e não temos como auditar a partida.
 *
 * Então **não abrimos mercado sobre a copa real**. O que abrimos é o Palco:
 * os times DELA, com a força calculada da campanha real, jogando partidas
 * simuladas pelo nosso motor. A tela diz isso em letra de tamanho normal, não
 * em rodapé — quem aposta tem de saber no que está apostando.
 */
function PalcoDaCopa({ locale, nome }: { locale: string; nome: string }) {
  return (
    <section style={superficie(LIMA, "forte")} className="mt-14 rounded-2xl border p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-xl">
          <Titulo icone={Coins} cor={LIMA}>
            O palco da copa
          </Titulo>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            Dá para apostar com fichas nos times da {nome} — mas em{" "}
            <strong className="text-white/90">partidas simuladas pelo nosso motor</strong>, com a
            força de cada time calculada da campanha real deles na EA.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/45">
            Não abrimos mercado sobre os jogos de verdade da copa, e não vamos abrir. É competição
            de terceiros: não temos identidade verificada dos jogadores, consentimento deles nem
            como auditar a partida — as três condições que o nosso regulamento exige antes de
            qualquer aposta sobre gente de carne e osso.
          </p>
        </div>
        <Link
          href="/game/apostas"
          locale={locale}
          style={{ background: LIMA, color: "#0b1005" }}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition hover:brightness-110"
        >
          Ir para a mesa
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

/**
 * FONTES E NOTÍCIAS — o que cada um diz, lado a lado.
 *
 * ## Por que esta seção é o produto, e não um apêndice
 *
 * Cinco sites publicam esta copa. Nenhum observa a partida: todos republicam o
 * que a organização informa. Nós observamos — lemos a API pública da EA, com
 * placar e súmula por jogador.
 *
 * Então a pergunta que a seção responde não é "qual é a tabela", é **"quem
 * está dizendo o quê, e com base em quê"**. É a única pergunta que a gente
 * consegue responder melhor que todo mundo.
 *
 * ## A divergência fica em pé, não é resolvida
 *
 * As fontes se contradizem: o anúncio original fala em **16 times**, os sites
 * de tabela publicam **20**. Medido em 08/09, e as duas afirmações estão vivas
 * no mesmo mês, sobre a mesma copa.
 *
 * A tentação é escolher a mais provável e publicar como fato. Isso seria
 * inventar uma autoridade que não temos — nós não organizamos esta competição
 * e não falamos por ela. O que a tela faz é mostrar as duas, com data e link,
 * e deixar quem lê decidir. Um leitor informado vale mais que um número
 * confiante e errado.
 *
 * A nossa linha entra na mesma lista, e não num pedestal: ela também é uma
 * fonte, com o que mede e — declarado no mesmo tamanho de letra — o que **não**
 * mede.
 */
function FontesENoticias({
  declaracoes,
  noticias,
}: {
  declaracoes: Declaracao[];
  noticias: Noticia[];
}) {
  if (declaracoes.length === 0 && noticias.length === 0) return null;

  return (
    <section className="mt-14">
      <Titulo icone={Scale} cor={CIANO}>
        Fontes e notícias
      </Titulo>
      <p className="mt-1 max-w-2xl text-sm text-white/50">
        Quem está dizendo o quê sobre esta copa — inclusive nós. Cada linha traz a data em
        que foi lida e o link para conferir.
      </p>

      {/* ---- O que cada fonte afirma ---- */}
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {declaracoes.map((d) => {
          const nossa = d.fonte.startsWith("Winners 22");
          const cor = nossa ? LIMA : CIANO;
          return (
            <div
              key={d.fonte}
              style={superficie(cor)}
              className="rounded-2xl border p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium" style={{ color: nossa ? LIMA : undefined }}>
                  {d.url ? (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="underline decoration-white/20 underline-offset-2 transition hover:text-white"
                    >
                      {d.fonte}
                    </a>
                  ) : (
                    d.fonte
                  )}
                </p>
                <span
                  style={{ borderColor: `${cor}44`, color: cor }}
                  className="rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-widest"
                >
                  {nossa ? "observado" : "declarado"}
                </span>
              </div>

              <dl className="mt-2.5 space-y-1 text-xs">
                {Object.entries(d.afirma).map(([chave, valor]) => (
                  <div key={chave} className="flex flex-wrap gap-x-2">
                    <dt className="text-white/35">{chave}</dt>
                    <dd className="text-white/75">{String(valor)}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-3 flex items-center gap-1 border-t border-white/10 pt-2 text-[10px] text-white/30">
                <Clock className="h-3 w-3" />
                lido em{" "}
                {new Date(d.lidoEm).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          );
        })}
      </div>

      {/* ---- O aviso sobre a contradição ----
           Ele é explícito e não um rodapé: quem lê duas fontes com números
           diferentes e não recebe o aviso conclui que UMA das nossas telas
           está com defeito. */}
      <div
        style={superficie(OURO)}
        className="mt-4 flex items-start gap-3 rounded-2xl border p-4"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: OURO }} />
        <p className="text-sm leading-relaxed text-white/65">
          <strong className="text-white/85">As fontes não concordam entre si.</strong> O
          anúncio original fala em 16 times; os sites que publicam tabela falam em 20. As
          duas afirmações estão no ar, no mesmo mês, sobre a mesma copa. Não escolhemos uma
          — nós não organizamos esta competição e não falamos por ela. Mostramos as duas e
          dizemos onde cada uma foi lida.
        </p>
      </div>

      {/* ---- Notícias ---- */}
      {noticias.length > 0 && (
        <>
          <h3
            style={{ ...bebas, color: ROSA }}
            className="mt-10 flex items-center gap-2 text-xl uppercase tracking-wide"
          >
            <Newspaper className="h-5 w-5" />
            O que saiu por aí
          </h3>
          <div className="mt-3 space-y-2">
            {noticias.map((n) => (
              <a
                key={n.url}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                style={superficie(CINZA)}
                className="group flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border p-3.5 transition hover:-translate-y-0.5"
              >
                {n.em && (
                  <span className="shrink-0 font-mono text-[11px] text-white/30">
                    {new Date(n.em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="text-sm text-white/85 transition group-hover:text-white">
                    {n.titulo}
                  </span>
                  {n.resumo && (
                    <span className="mt-0.5 block text-xs leading-relaxed text-white/45">
                      {n.resumo}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-white/30">
                  {n.fonte}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0 text-white/25" />
              </a>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
