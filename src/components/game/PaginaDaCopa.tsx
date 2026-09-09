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
  /** Quando a Federação auditou este vínculo. Null = ainda não auditado. */
  auditadoEm: string | null;
  /** Quando a auditoria procurou o clube deste time. Null = nunca procurou. */
  buscadoEm: string | null;
  /** Declarado pela organização. `indefinido` = ninguém declarou nada. */
  situacao: "classificado" | "eliminado" | "indefinido" | null;
  situacaoEm: string | null;
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


interface Noticia {
  titulo: string;
  fonte: string;
  url: string;
  em: string | null;
  resumo: string | null;
  /** Capa. Derivada do endereço quando é vídeo; null quando não há. */
  imagem: string | null;
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
    /** A fase que a organização anunciou, e quando anunciou. */
    faseAtual?: string | null;
    faseDeclaradaEm?: string | null;
    chaveamento?: Array<{
      fase: string;
      casa: string;
      fora: string;
      /** Null = sem resultado publicado. Nunca confundir com 0 × 0. */
      placar: { casa: number; fora: number } | null;
      quando: string | null;
      quandoTexto: string | null;
    }>;
  };
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

  const { copa, pelaEA, series, artilharia, goleiros, cobertura, noticias } = d;
  const grupos = [...new Set(copa.times.map((t) => t.grupo).filter(Boolean))].sort() as string[];

  return (
    <div style={{ background: FUNDO }} className="min-h-screen text-white">
      {/* ---- Capa ---- */}
      <header className="relative overflow-hidden border-b border-white/10">
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
        <FaseDaCopa copa={copa} />

        <div className="mt-6">
          <Cobertura c={cobertura} times={copa.times} />
        </div>

        {/* ---- Grupos ---- */}
        <section className="mt-12">
          <Titulo icone={Users} cor={LIMA}>
            Os grupos
          </Titulo>
          <p className="mt-1 max-w-2xl text-sm text-white/50">
            O que a <strong className="text-white/75">apuração da FayAI</strong> registrou dos
            confrontos entre times da copa{copa.faseAtual ? " na fase de classificação" : ""}.
            Contado por jogo — a copa pontua por confronto MD
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

        <FontesENoticias noticias={noticias} />

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
 * ONDE A COPA ESTÁ — a fase declarada pela organização.
 *
 * ## Por que esta faixa vem antes de tudo
 *
 * Sem ela, a página abria nas tabelas de grupo, e quem chegasse concluiria que
 * a copa está na fase de grupos. Ela saiu de lá em 03/09. Nenhuma frase da
 * página era falsa; o conjunto dizia uma coisa falsa — que é o jeito mais fácil
 * de mentir sem escrever mentira nenhuma.
 *
 * ## Três estados, e o terceiro é o que exige cuidado
 *
 * `classificado` e `eliminado` são anúncios da organização, com data.
 * `indefinido` NÃO quer dizer "ainda está no torneio": quer dizer que ninguém
 * declarou nada sobre aquele time no que a gente leu. Fechar a conta por
 * dedução — vinte times, seis classificados, seis eliminados, logo os outros
 * oito seguem vivos — seria publicar aritmética nossa como fato de terceiro.
 *
 * A distinção aparece na tela em vez de sumir: oito times sem declaração é
 * informação sobre a cobertura, não buraco a esconder.
 */
function FaseDaCopa({ copa }: { copa: Dados["copa"] }) {
  if (!copa.faseAtual) return null;

  const classificados = copa.times.filter((t) => t.situacao === "classificado");
  const eliminados = copa.times.filter((t) => t.situacao === "eliminado");
  const indefinidos = copa.times.filter((t) => !t.situacao || t.situacao === "indefinido");
  const chave = copa.chaveamento ?? [];

  return (
    <section style={superficie(OURO, "forte")} className="rounded-2xl border p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 style={bebas} className="flex items-center gap-2 text-2xl uppercase tracking-wide">
          <Trophy className="h-5 w-5" style={{ color: OURO }} />
          {copa.faseAtual}
        </h2>
        {copa.faseDeclaradaEm && (
          <span className="text-[11px] text-white/35">
            anunciado pela organização em{" "}
            {new Date(copa.faseDeclaradaEm).toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>

      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60">
        A fase de classificação terminou e oito times seguem. As tabelas mais abaixo continuam
        valendo como o retrato do que foi jogado até aqui — não como a posição atual da
        competição.
      </p>

      {chave.length > 0 && (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {chave.map((c) => (
            <div
              key={`${c.casa}-${c.fora}`}
              style={superficie(c.placar ? OURO : CINZA)}
              className="rounded-xl border p-3.5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 truncate text-[13px] text-white/80">{c.casa}</span>
                {c.placar ? (
                  <span style={bebas} className="shrink-0 text-lg tabular-nums" title="resultado publicado pela organização">
                    {c.placar.casa} <span className="text-white/25">×</span> {c.placar.fora}
                  </span>
                ) : (
                  /* ⛔ NUNCA "0 × 0" aqui. A organização usa 0 × 0 como estado
                     inicial do chaveamento; repetir isso publicaria um empate
                     que não aconteceu. Sem placar, o espaço diz que não há. */
                  <span className="shrink-0 text-[10px] uppercase tracking-widest text-white/25">
                    ×
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-right text-[13px] text-white/80">
                  {c.fora}
                </span>
              </div>
              <p className="mt-1.5 text-center text-[10px] uppercase tracking-wider text-white/30">
                {c.quando
                  ? new Date(c.quando).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                  : (c.quandoTexto ?? "sem data")}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ListaDeSituacao rotulo="Nas quartas" cor={LIMA} times={classificados} />
        <ListaDeSituacao
          rotulo="Fora da disputa"
          cor={RUBRO}
          times={eliminados}
          nota="não estão na lista de oito classificados que a organização publicou"
        />
      </div>
      {indefinidos.length > 0 && (
        <ListaDeSituacao
          rotulo="Sem declaração"
          cor={CINZA}
          times={indefinidos}
          nota="a organização não anunciou nada sobre estes — não quer dizer que sigam na disputa"
        />
      )}
    </section>
  );
}

function ListaDeSituacao({
  rotulo,
  cor,
  times,
  nota,
}: {
  rotulo: string;
  cor: string;
  times: TimeCopa[];
  nota?: string;
}) {
  return (
    <div style={superficie(cor)} className="rounded-xl border p-3.5">
      <p className="flex items-baseline gap-2 text-[10px] uppercase tracking-widest" style={{ color: cor }}>
        {rotulo}
        <strong className="text-sm tracking-normal">{times.length}</strong>
      </p>
      {times.length > 0 ? (
        <p className="mt-1.5 text-xs leading-relaxed text-white/60">
          {times.map((t) => t.nome).join(" · ")}
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-white/25">nenhum</p>
      )}
      {nota && <p className="mt-2 text-[10.5px] leading-relaxed text-white/30">{nota}</p>}
    </div>
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
              {/*
                ⛔ AQUI NÃO SE EXPLICA O MÉTODO.
                A versão anterior contava como a vinculação é feita, com exemplo
                de nome e o critério de confirmação. Isso é a receita de montar
                esta cobertura, e é ativo da Federação (Estatuto, art. 20).
                Fica o que a medida É — o grau do vínculo e a data —, não como
                se chega nela. A procedência completa continua na Federação.
              */}
              <p className="text-xs leading-relaxed text-white/50">
                O nome que a organização publica quase nunca é o nome de dentro do jogo. A
                correspondência abaixo é{" "}
                <strong className="text-white/75">auditada pelos sistemas proprietários da
                FayAI</strong>, e cada linha carrega o grau de certeza que a auditoria atribuiu.
              </p>
              <ul className="space-y-1.5 text-xs">
                {times
                  .filter((t) => t.eaClubName)
                  .map((t) => (
                    <li key={t.nome} className="flex flex-wrap items-baseline gap-x-2">
                      <SeloVinculo v={t.vinculo} />
                      <span className="text-white/75">{t.nome}</span>
                      <span className="text-white/35">→ {t.eaClubName}</span>
                      {t.auditadoEm && (
                        <span className="text-white/25">
                          · {new Date(t.auditadoEm).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
              {provaveis.length > 0 && (
                <p className="text-xs text-white/40">
                  <strong style={{ color: OURO }}>{provaveis.length} provável(is)</strong>: a
                  auditoria achou correspondência, mas ainda não no grau que a Federação exige
                  para dar o vínculo por confirmado.
                </p>
              )}
              {semVinculo.length > 0 && <SemVinculo times={semVinculo} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * OS TIMES SEM CLUBE — um vazio que se explica, sem entregar o método.
 *
 * "Sem clube (7)" sozinho lê como defeito nosso: parece que a página não
 * carregou, ou que ninguém terminou o trabalho. E não é nem uma coisa nem
 * outra — a auditoria rodou, olhou os candidatos e nenhum era o time.
 *
 * ⛔ O QUE ESTA PEÇA NÃO DIZ MAIS: como a auditoria decide. A versão anterior
 * explicava o critério inteiro e ainda listava, time a time, quantos candidatos
 * foram descartados e por quê. Era a receita (Estatuto, art. 20), e ela saiu.
 *
 * ⛔ O QUE ELA NÃO PODE DEIXAR DE DIZER: que a auditoria rodou, quando, e que
 * não achou. Sem isso o vazio volta a acusar a própria página, e sigilo de
 * método não autoriza calar um fato (art. 21).
 */
function SemVinculo({ times }: { times: TimeCopa[] }) {
  const buscados = times.filter((t) => t.buscadoEm);
  const maisNova = buscados
    .map((t) => t.buscadoEm!)
    .sort()
    .at(-1);

  return (
    <div className="text-xs leading-relaxed text-white/40">
      <p>
        <strong style={{ color: RUBRO }}>Sem clube na EA ({times.length})</strong>:{" "}
        {times.map((t) => t.nome).join(", ")}.
      </p>
      <p className="mt-1">
        {buscados.length === times.length ? (
          <>
            A auditoria da Federação já passou por todos
            {maisNova && <> (última em {new Date(maisNova).toLocaleDateString("pt-BR")})</>} e não
            encontrou correspondência com grau suficiente para publicar. Existem clubes de nome
            parecido; nenhum deles passou no critério.
          </>
        ) : (
          <>A auditoria ainda não passou por todos eles.</>
        )}{" "}
        Eles entram sozinhos assim que a correspondência atingir o grau exigido.
      </p>
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
                    {/* O selo é obrigatório aqui, não enfeite: uma tabela de
                        grupo que lista um time eliminado sem dizer que ele foi
                        eliminado é a mesma mentira por conjunto que a faixa de
                        fase corrige lá em cima. */}
                    {t.situacao === "classificado" && (
                      <span
                        title="classificado — anunciado pela organização"
                        style={{ borderColor: `${LIMA}55`, color: LIMA }}
                        className="shrink-0 rounded border px-1 py-px text-[8.5px] uppercase tracking-widest"
                      >
                        quartas
                      </span>
                    )}
                    {t.situacao === "eliminado" && (
                      <span
                        title="eliminado — anunciado pela organização"
                        style={{ borderColor: `${RUBRO}44`, color: `${RUBRO}cc` }}
                        className="shrink-0 rounded border px-1 py-px text-[8.5px] uppercase tracking-widest"
                      >
                        fora
                      </span>
                    )}
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
function FontesENoticias({ noticias }: { noticias: Noticia[] }) {

  return (
    <section className="mt-14">
      <Titulo icone={Scale} cor={CIANO}>
        Notícias e apuração
      </Titulo>
      <p className="mt-1 max-w-2xl text-sm text-white/50">
        O que saiu sobre esta copa, com crédito e data. Os números desta página são apuração
        própria.
      </p>

      {/*
        ⛔ O QUADRO "O QUE CADA FONTE AFIRMA" SAIU DAQUI.
        Ele listava, com link, todo site que publica tabela desta copa. Isso é
        mapa de origem — quem tem a lista monta a mesma cobertura (Estatuto,
        art. 20). Continua inteiro no painel da Federação, onde quem decide
        precisa dele.

        ⛔ O QUE FICOU, e não pode sair: o aviso de contradição logo abaixo.
        As fontes DISCORDAM entre si sobre número de times e de grupos. Quem lê
        um número nosso sem esse aviso conclui que ele é o consenso, e não é.
        Dizer que há divergência não entrega fonte nenhuma (art. 21).
      */}
      <div
        style={superficie(LIMA)}
        className="mt-6 flex items-start gap-2.5 rounded-2xl border p-4 text-xs leading-relaxed text-white/60"
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: LIMA }} />
        <span>
          Os números desta página — confrontos, séries, artilharia e desempenho — são{" "}
          <strong className="text-white/85">
            apurados e auditados pelos sistemas proprietários da FayAI
          </strong>
          , com data de leitura em cada bloco. Não reproduzimos tabela de terceiro como se fosse
          nossa, e não apresentamos como oficial o que é observação nossa.
        </span>
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
          <strong className="text-white/85">O que se publica por aí não bate entre si.</strong>{" "}
          Sobre esta mesma copa, e no mesmo mês, circulam duas versões do formato — uma com 16
          times e outra com 20. A Federação não escolhe entre elas: não organizamos esta
          competição e não falamos por ela. O que esta página apresenta é apuração própria do
          que foi efetivamente jogado, e não a tabela oficial de ninguém.
        </p>
      </div>

      {/* ---- Notícias ----
           COM CAPA, e a capa não é enfeite: uma lista de links azuis não diz
           nada a quem chegou querendo saber da copa, e era exatamente isso que
           esta seção era. A capa de vídeo vem derivada do endereço na rota —
           é a mesma que aparece quando qualquer pessoa compartilha o link.

           Notícia SEM capa continua entrando, com a área da imagem ocupada por
           uma faixa da própria seção. Cartão que encolhe quando falta imagem
           faz a grade parecer quebrada, e sumir com a notícia por falta de foto
           seria deixar de publicar o que interessa por causa do enfeite. */}
      {noticias.length > 0 && (
        <>
          <h3
            style={{ ...bebas, color: ROSA }}
            className="mt-10 flex items-center gap-2 text-xl uppercase tracking-wide"
          >
            <Newspaper className="h-5 w-5" />
            O que saiu por aí
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {noticias.map((n) => (
              <a
                key={n.url}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                style={superficie(CINZA)}
                className="group flex flex-col overflow-hidden rounded-2xl border transition hover:-translate-y-1"
              >
                <span className="relative block aspect-video overflow-hidden bg-black/40">
                  {n.imagem ? (
                    <img
                      src={n.imagem}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex h-full w-full items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${ROSA}22, transparent 70%)` }}
                    >
                      <Newspaper className="h-8 w-8" style={{ color: `${ROSA}66` }} />
                    </span>
                  )}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
                    style={{ background: "linear-gradient(to top, rgba(9,14,17,.9), transparent)" }}
                  />
                </span>

                <span className="flex flex-1 flex-col p-4">
                  <span className="flex flex-wrap items-center gap-x-2 text-[10px] uppercase tracking-wider text-white/35">
                    <span>{n.fonte}</span>
                    {n.em && (
                      <>
                        <span className="text-white/15">·</span>
                        <span className="font-mono normal-case tracking-normal">
                          {new Date(n.em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                        </span>
                      </>
                    )}
                    <ExternalLink className="ml-auto h-3 w-3 text-white/20" />
                  </span>

                  <span className="mt-2 text-sm font-medium leading-snug text-white/85 transition group-hover:text-white">
                    {n.titulo}
                  </span>

                  {n.resumo && (
                    <span className="mt-1.5 text-xs leading-relaxed text-white/45">{n.resumo}</span>
                  )}
                </span>
              </a>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
