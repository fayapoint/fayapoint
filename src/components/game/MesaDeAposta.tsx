"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { getClientAuthHeaders } from "@/lib/client-auth";
import {
  ArrowLeft,
  Check,
  Coins,
  Copy,
  Loader2,
  Lock,
  ShieldCheck,
  Timer,
  Trash2,
  Trophy,
  X,
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
  setorDaPosicao,
  corSetor,
} from "@/lib/game/tema";
import { FaixaDeCena, FundoDeCena } from "./CenaW22";

/**
 * A MESA DE UMA PARTIDA — cardápio, cupom e súmula. 08/09/2026.
 *
 * ## O cupom é o produto, e ele tem uma regra que salva o apostador
 *
 * Duas seleções da MESMA partida não entram na mesma múltipla. O servidor
 * recusa (ver `apostas-servidor.ts`), e a tela recusa antes, trocando a
 * seleção em vez de acumular. Sem isso a pessoa montaria "casa vence" +
 * "mais de 4,5 gols" e veria uma odd de 6,00 que não corresponde a chance
 * nenhuma — os dois resultados são correlacionados, e o produto das odds só
 * vale para eventos independentes. É a armadilha clássica do apostador
 * iniciante, e aqui ela simplesmente não existe.
 *
 * ## A súmula depois do jogo
 *
 * Quando o evento liquida, a mesma tela vira laudo: placar, quem marcou, nota
 * de cada jogador e o veredito de CADA seleção de CADA mercado — inclusive
 * das que ninguém apostou. Publicar o cardápio inteiro liquidado é o que
 * permite a alguém conferir que a nossa liquidação não escolheu favoritos.
 */

interface Selecao {
  chave: string;
  rotulo: string;
  odd: number;
  probabilidade: number;
  resultado: string | null;
}

interface Mercado {
  id: string;
  chave: string;
  tipo: string;
  familia: string;
  titulo: string;
  margem: number;
  status: string;
  selecoes: Selecao[];
}

interface JogadorFicha {
  gamertag: string;
  posicao: string;
  golsPorJogo: number | null;
  temDono: boolean;
}

interface Lado {
  nome: string;
  sigla: string | null;
  cor: string | null;
  nota: number;
  eaClubId: string | null;
  forca: { ataque: number; defesa: number };
  elenco: JogadorFicha[];
}

interface Resultado {
  golsMandante: number;
  golsVisitante: number;
  lances: Array<{ minuto: number; tipo: string; timeId: string; gamertag: string; assistenteGamertag?: string }>;
  jogadores: Array<{
    gamertag: string;
    timeId: string;
    posicao: string;
    gols: number;
    assistencias: number;
    chutes: number;
    passes: number;
    desarmes: number;
    defesas: number;
    nota: number;
    craque: boolean;
  }>;
}

interface Ficha {
  evento: {
    slug: string;
    status: string;
    comecaEm: string;
    equilibrio: number;
    totalApostado: number;
    totalCupons: number;
    mandante: Lado;
    visitante: Lado;
    resultado: Resultado | null;
    liquidadoEm: string | null;
  };
  honestidade: {
    compromisso: string;
    sementeServidor: string | null;
    salPublico: string | null;
    sementeFinal: number | null;
    conferencia: { formula: string; recalculada: number | null };
  };
  mercados: Mercado[];
}

interface ItemCupom {
  mercadoId: string;
  mercadoTitulo: string;
  selecaoChave: string;
  selecaoRotulo: string;
  odd: number;
}

const ROTULO_FAMILIA: Record<string, string> = {
  resultado: "Resultado",
  gols: "Gols",
  handicap: "Handicap",
  placar: "Placar exato",
  jogador: "Jogadores",
};

const COR_FAMILIA: Record<string, string> = {
  resultado: LIMA,
  gols: CIANO,
  handicap: VIOLETA,
  placar: ROSA,
  jogador: OURO,
};

export function MesaDeAposta({ slug, locale }: { slug: string; locale: string }) {
  const [ficha, setFicha] = useState<Ficha | null | "erro">(null);
  const [cupom, setCupom] = useState<ItemCupom[]>([]);
  const [valor, setValor] = useState(10);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`/api/game/apostas/evento/${slug}`);
      if (!r.ok) throw new Error();
      setFicha(await r.json());
    } catch {
      setFicha("erro");
    }
  }, [slug]);

  const carregarSaldo = useCallback(() => {
    fetch("/api/game/carteira", { headers: getClientAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setSaldo(j.saldo))
      .catch(() => {});
  }, []);

  useEffect(() => {
    carregar();
    carregarSaldo();
  }, [carregar, carregarSaldo]);

  const escolher = (m: Mercado, s: Selecao) => {
    if (m.status !== "aberto") return;
    setAviso(null);
    setCupom((atual) => {
      const jaEsta = atual.find((i) => i.mercadoId === m.id && i.selecaoChave === s.chave);
      // Clicar de novo na mesma tira do cupom — o gesto que todo mundo tenta.
      if (jaEsta) return atual.filter((i) => i !== jaEsta);
      // Outra seleção do MESMO mercado substitui, nunca acumula.
      const semOMercado = atual.filter((i) => i.mercadoId !== m.id);
      return [
        ...semOMercado,
        {
          mercadoId: m.id,
          mercadoTitulo: m.titulo,
          selecaoChave: s.chave,
          selecaoRotulo: s.rotulo,
          odd: s.odd,
        },
      ];
    });
  };

  const oddTotal = useMemo(
    () => Math.round(cupom.reduce((f, i) => f * i.odd, 1) * 100) / 100,
    [cupom]
  );
  const retorno = Math.floor(valor * oddTotal);

  const apostar = async () => {
    if (cupom.length === 0) return;
    setEnviando(true);
    setAviso(null);
    try {
      const r = await fetch("/api/game/apostas", {
        method: "POST",
        headers: { "content-type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({
          selecoes: cupom.map((i) => ({ mercadoId: i.mercadoId, selecaoChave: i.selecaoChave })),
          valor,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setAviso({
          tipo: "erro",
          texto:
            r.status === 401
              ? "Entre na sua conta para apostar — você ganha 100 fichas ao criar."
              : j.error ?? "não foi possível registrar",
        });
        return;
      }
      setSaldo(j.saldo);
      setCupom([]);
      setAviso({
        tipo: "ok",
        texto: `Cupom registrado. Se der certo, voltam ${j.retornoPotencial} fichas.`,
      });
      carregar();
    } catch {
      setAviso({ tipo: "erro", texto: "falha de rede" });
    } finally {
      setEnviando(false);
    }
  };

  if (ficha === null) {
    return (
      <div style={{ background: FUNDO }} className="flex min-h-screen items-center justify-center text-white/50">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (ficha === "erro") {
    return (
      <div style={{ background: FUNDO }} className="min-h-screen p-10 text-white">
        <p>Partida não encontrada.</p>
        <Link href="/game/apostas" locale={locale} style={{ color: LIMA }} className="mt-3 inline-block">
          ← voltar ao saguão
        </Link>
      </div>
    );
  }

  const { evento, honestidade, mercados } = ficha;
  const liquidado = evento.status === "liquidado";
  const familias = [...new Set(mercados.map((m) => m.familia))];

  return (
    <div style={{ background: FUNDO }} className="min-h-screen text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/game/apostas"
          locale={locale}
          className="inline-flex items-center gap-1.5 text-sm text-white/45 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> saguão
        </Link>

        <div className="mt-5">
          <FaixaDeCena
            cena={liquidado ? "posJogo" : "duelo"}
            alt={liquidado ? "Campo vazio depois do jogo, refletor aceso" : "Duas equipes frente a frente no círculo central"}
            altura="h-40 sm:h-52"
            prioridade
          />
        </div>

        <Placar evento={evento} liquidado={liquidado} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <SeloHonestidade honestidade={honestidade} liquidado={liquidado} />

            {liquidado && evento.resultado && (
              <Sumula resultado={evento.resultado} evento={evento} />
            )}

            {familias.map((f) => (
              <section key={f} className="mt-8">
                <h3
                  style={{ ...bebas, color: COR_FAMILIA[f] ?? LIMA }}
                  className="text-xl uppercase tracking-wide"
                >
                  {ROTULO_FAMILIA[f] ?? f}
                </h3>
                <div className="mt-3 space-y-3">
                  {mercados
                    .filter((m) => m.familia === f)
                    .map((m) => (
                      <BlocoMercado
                        key={m.id}
                        mercado={m}
                        cupom={cupom}
                        onEscolher={escolher}
                        liquidado={liquidado}
                      />
                    ))}
                </div>
              </section>
            ))}
          </div>

          {!liquidado && (
            <Cupom
              itens={cupom}
              oddTotal={oddTotal}
              valor={valor}
              setValor={setValor}
              retorno={retorno}
              saldo={saldo}
              enviando={enviando}
              aviso={aviso}
              onRemover={(i) => setCupom((a) => a.filter((x) => x !== i))}
              onLimpar={() => setCupom([])}
              onApostar={apostar}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Placar({ evento, liquidado }: { evento: Ficha["evento"]; liquidado: boolean }) {
  const r = evento.resultado;
  return (
    <div style={superficie(LIMA, "forte")} className="mt-5 rounded-2xl border p-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <TimeNoPlacar lado={evento.mandante} alinhamento="right" />
        <div className="text-center">
          {liquidado && r ? (
            <p style={bebas} className="text-5xl leading-none">
              {r.golsMandante} <span className="text-white/25">×</span> {r.golsVisitante}
            </p>
          ) : (
            <p style={bebas} className="text-3xl leading-none text-white/30">
              ×
            </p>
          )}
          <p className="mt-2 text-[11px] uppercase tracking-widest text-white/40">
            {liquidado ? "encerrada" : <ContagemAteOApito ate={evento.comecaEm} />}
          </p>
        </div>
        <TimeNoPlacar lado={evento.visitante} alinhamento="left" />
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-xs text-white/45">
        <span>equilíbrio aplicado: {Math.round(evento.equilibrio * 100)}%</span>
        <span>{evento.totalCupons} cupons</span>
        <span>{evento.totalApostado} fichas na mesa</span>
      </div>
    </div>
  );
}

function TimeNoPlacar({ lado, alinhamento }: { lado: Lado; alinhamento: "left" | "right" }) {
  const cor = lado.cor ?? LIMA;
  return (
    <div className={alinhamento === "right" ? "text-right" : "text-left"}>
      <p style={bebas} className="text-2xl uppercase leading-tight sm:text-3xl">
        {lado.nome}
      </p>
      <div
        className={`mt-1.5 flex items-center gap-2 text-xs ${
          alinhamento === "right" ? "justify-end" : "justify-start"
        }`}
      >
        <span style={{ borderColor: `${cor}55`, color: cor }} className="rounded border px-1.5 py-0.5">
          força {lado.nota}
        </span>
        <span className="text-white/35" title="Multiplicadores de ataque e defesa usados no preço">
          atq {lado.forca.ataque.toFixed(2)} · def {lado.forca.defesa.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function ContagemAteOApito({ ate }: { ate: string }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const calc = () => {
      const f = new Date(ate).getTime() - Date.now();
      if (f <= 0) return setT("fechando");
      const min = Math.floor(f / 60_000);
      setT(min < 60 ? `apito em ${min} min` : `apito em ${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`);
    };
    calc();
    const id = setInterval(calc, 20_000);
    return () => clearInterval(id);
  }, [ate]);
  return <>{t}</>;
}

/**
 * O selo de honestidade — o painel que responde "vocês não escolheram o
 * resultado?" com uma conta que a pessoa pode refazer, e não com uma promessa.
 */
function SeloHonestidade({
  honestidade,
  liquidado,
}: {
  honestidade: Ficha["honestidade"];
  liquidado: boolean;
}) {
  const [copiado, setCopiado] = useState(false);
  const bate =
    liquidado &&
    honestidade.sementeFinal !== null &&
    honestidade.sementeFinal === honestidade.conferencia.recalculada;

  return (
    <div style={superficie(VIOLETA)} className="relative overflow-hidden rounded-2xl border p-5">
      <FundoDeCena cena="selo" opacidade={0.2} />
      <div className="relative">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4.5 w-4.5" style={{ color: VIOLETA }} />
        <p style={bebas} className="text-lg uppercase tracking-wide">
          Prova de honestidade
        </p>
        {liquidado && (
          <span
            style={{
              borderColor: bate ? `${LIMA}55` : `${RUBRO}55`,
              color: bate ? LIMA : RUBRO,
            }}
            className="ml-auto rounded border px-2 py-0.5 text-[10px] uppercase tracking-widest"
          >
            {bate ? "confere" : "divergente"}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm leading-relaxed text-white/55">
        {liquidado
          ? "A semente foi revelada. Rode o SHA-256 dela e compare com o compromisso publicado antes das apostas."
          : "A semente que vai decidir esta partida já foi sorteada e trancada. O que você vê abaixo é o cadeado — a chave só aparece depois do apito final."}
      </p>

      <div className="mt-3 space-y-2 font-mono text-[11px]">
        <Campo rotulo="compromisso (sha256 da semente)" valor={honestidade.compromisso} onCopiar={() => setCopiado(true)} />
        {liquidado && honestidade.sementeServidor && (
          <>
            <Campo rotulo="semente do servidor (revelada)" valor={honestidade.sementeServidor} />
            <Campo rotulo="sal público (cupons:fichas no fechamento)" valor={honestidade.salPublico ?? "—"} />
            <Campo rotulo="semente final" valor={String(honestidade.sementeFinal)} />
          </>
        )}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-white/35">
        {honestidade.conferencia.formula}. O sal sai do que os apostadores fizeram — nós
        não o controlamos; a semente é nossa e ninguém a conhecia. Nenhum dos dois lados
        escolhe o resultado sozinho.
      </p>
      {copiado && <p className="mt-1 text-[11px]" style={{ color: LIMA }}>copiado</p>}
      </div>
    </div>
  );
}

function Campo({ rotulo, valor, onCopiar }: { rotulo: string; valor: string; onCopiar?: () => void }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-white/30">{rotulo}</p>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(valor);
          onCopiar?.();
        }}
        className="flex w-full items-center gap-2 break-all text-left text-white/70 transition hover:text-white"
      >
        <Lock className="h-3 w-3 shrink-0 text-white/25" />
        <span className="break-all">{valor}</span>
        <Copy className="h-3 w-3 shrink-0 text-white/25" />
      </button>
    </div>
  );
}

function BlocoMercado({
  mercado,
  cupom,
  onEscolher,
  liquidado,
}: {
  mercado: Mercado;
  cupom: ItemCupom[];
  onEscolher: (m: Mercado, s: Selecao) => void;
  liquidado: boolean;
}) {
  const colunas =
    mercado.selecoes.length <= 2 ? "grid-cols-2" : mercado.selecoes.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4";

  return (
    <div style={superficie(CINZA)} className="rounded-xl border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-white/85">{mercado.titulo}</p>
        <span className="shrink-0 text-[10px] text-white/25" title="Margem da casa neste mercado">
          margem {(mercado.margem * 100).toFixed(1)}%
        </span>
      </div>

      <div className={`mt-3 grid gap-2 ${colunas}`}>
        {mercado.selecoes.map((s) => {
          const escolhida = cupom.some((i) => i.mercadoId === mercado.id && i.selecaoChave === s.chave);
          const ganhou = s.resultado === "ganha" || s.resultado === "meio-ganha";
          const perdeu = s.resultado === "perdida" || s.resultado === "meio-perdida";
          const cor = liquidado ? (ganhou ? LIMA : perdeu ? RUBRO : CINZA) : escolhida ? LIMA : CINZA;

          return (
            <button
              key={s.chave}
              type="button"
              disabled={liquidado}
              onClick={() => onEscolher(mercado, s)}
              style={{
                borderColor: escolhida || ganhou ? `${cor}88` : `${cor}33`,
                background: escolhida ? `${LIMA}18` : ganhou ? `${LIMA}12` : "rgba(255,255,255,.03)",
              }}
              className="rounded-lg border px-2.5 py-2 text-left transition disabled:cursor-default enabled:hover:border-white/40"
            >
              <p className="truncate text-[11px] text-white/55" title={s.rotulo}>
                {s.rotulo}
              </p>
              <div className="mt-0.5 flex items-baseline justify-between gap-1">
                <span style={{ ...bebas, color: liquidado && perdeu ? "rgba(255,255,255,.3)" : cor }} className="text-lg">
                  {s.odd.toFixed(2)}
                </span>
                <span className="text-[10px] text-white/30">{Math.round(s.probabilidade * 100)}%</span>
              </div>
              {liquidado && s.resultado && (
                <p className="mt-0.5 text-[9px] uppercase tracking-wider" style={{ color: cor }}>
                  {s.resultado}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Cupom(props: {
  itens: ItemCupom[];
  oddTotal: number;
  valor: number;
  setValor: (n: number) => void;
  retorno: number;
  saldo: number | null;
  enviando: boolean;
  aviso: { tipo: "ok" | "erro"; texto: string } | null;
  onRemover: (i: ItemCupom) => void;
  onLimpar: () => void;
  onApostar: () => void;
}) {
  const { itens, oddTotal, valor, setValor, retorno, saldo, enviando, aviso } = props;
  const semFichas = saldo !== null && valor > saldo;

  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div style={superficie(LIMA, "forte")} className="rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <p style={bebas} className="text-lg uppercase tracking-wide">
            Seu cupom
          </p>
          {itens.length > 0 && (
            <button
              type="button"
              onClick={props.onLimpar}
              className="text-white/35 transition hover:text-white"
              aria-label="limpar cupom"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {saldo !== null && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
            <Coins className="h-3.5 w-3.5" style={{ color: LIMA }} />
            {saldo.toLocaleString("pt-BR")} fichas
          </p>
        )}

        {itens.length === 0 ? (
          <p className="mt-4 text-sm text-white/40">
            Toque numa odd para montar o cupom. Você pode juntar seleções de partidas
            diferentes numa múltipla.
          </p>
        ) : (
          <>
            <ul className="mt-4 space-y-2">
              {itens.map((i) => (
                <li
                  key={i.mercadoId + i.selecaoChave}
                  className="flex items-start gap-2 rounded-lg bg-white/[.04] p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-white/40">{i.mercadoTitulo}</p>
                    <p className="truncate text-sm">{i.selecaoRotulo}</p>
                  </div>
                  <span style={{ ...bebas, color: LIMA }} className="text-base">
                    {i.odd.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => props.onRemover(i)}
                    className="text-white/25 transition hover:text-white"
                    aria-label="tirar do cupom"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <label className="text-[10px] uppercase tracking-widest text-white/40">
                Fichas na aposta
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={valor}
                  onChange={(e) => setValor(Math.max(1, Math.min(500, Math.floor(Number(e.target.value) || 1))))}
                  className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-lg outline-none focus:border-white/40"
                />
              </div>
              <div className="mt-2 flex gap-1.5">
                {[5, 10, 25, 50, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setValor(v)}
                    className="flex-1 rounded border border-white/10 py-1 text-xs text-white/50 transition hover:border-white/30 hover:text-white"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-1 border-t border-white/10 pt-3 text-sm">
              <div className="flex justify-between text-white/50">
                <span>{itens.length === 1 ? "Odd" : `Múltipla de ${itens.length}`}</span>
                <span>{oddTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Retorno possível</span>
                <span style={{ ...bebas, color: OURO }} className="text-xl">
                  {retorno.toLocaleString("pt-BR")}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={enviando || semFichas}
              onClick={props.onApostar}
              style={{ background: semFichas ? "rgba(255,255,255,.08)" : LIMA, color: semFichas ? "#fff8" : "#0b1005" }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition enabled:hover:brightness-110 disabled:cursor-not-allowed"
            >
              {enviando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : semFichas ? (
                "fichas insuficientes"
              ) : (
                <>
                  <Check className="h-4 w-4" /> Apostar {valor}
                </>
              )}
            </button>
          </>
        )}

        {aviso && (
          <p
            style={{
              borderColor: aviso.tipo === "ok" ? `${LIMA}44` : `${RUBRO}44`,
              color: aviso.tipo === "ok" ? LIMA : RUBRO,
            }}
            className="mt-3 rounded-lg border px-3 py-2 text-xs"
          >
            {aviso.texto}
          </p>
        )}
      </div>
    </aside>
  );
}

/** A súmula: o que aconteceu, jogador por jogador. */
function Sumula({ resultado, evento }: { resultado: Resultado; evento: Ficha["evento"] }) {
  const times = [...new Set(resultado.jogadores.map((j) => j.timeId))];
  const nomeDoTime = (id: string) => (id.endsWith(":M") ? evento.mandante.nome : evento.visitante.nome);

  return (
    <div className="mt-6">
      {resultado.lances.length > 0 && (
        <div style={superficie(OURO)} className="rounded-2xl border p-5">
          <p style={bebas} className="text-lg uppercase tracking-wide">
            <Trophy className="mr-1.5 inline h-4 w-4" style={{ color: OURO }} />
            Gols
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {resultado.lances
              .filter((l) => l.tipo === "gol")
              .map((l, i) => (
                <li key={i} className="flex items-baseline gap-2">
                  <span style={{ ...bebas, color: OURO }} className="w-10 shrink-0 text-base">
                    {l.minuto}&apos;
                  </span>
                  <span className="font-medium">{l.gamertag}</span>
                  {l.assistenteGamertag && (
                    <span className="text-xs text-white/40">assistência de {l.assistenteGamertag}</span>
                  )}
                  <span className="ml-auto shrink-0 text-xs text-white/35">{nomeDoTime(l.timeId)}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {times.map((t) => (
          <div key={t} style={superficie(CINZA)} className="rounded-2xl border p-4">
            <p className="text-sm font-medium text-white/80">{nomeDoTime(t)}</p>
            <table className="mt-2 w-full text-xs">
              <thead className="text-white/30">
                <tr>
                  <th className="pb-1 text-left font-normal">Jogador</th>
                  <th className="pb-1 text-right font-normal">G</th>
                  <th className="pb-1 text-right font-normal">A</th>
                  <th className="pb-1 text-right font-normal">Nota</th>
                </tr>
              </thead>
              <tbody>
                {resultado.jogadores
                  .filter((j) => j.timeId === t)
                  .sort((a, b) => b.nota - a.nota)
                  .map((j) => {
                    const setor = setorDaPosicao(j.posicao);
                    return (
                      <tr key={j.gamertag} className="border-t border-white/5">
                        <td className="py-1">
                          <span
                            style={{ color: corSetor(setor) }}
                            className="mr-1.5 text-[9px] uppercase"
                          >
                            {setor}
                          </span>
                          {j.gamertag}
                          {j.craque && (
                            <span style={{ color: OURO }} className="ml-1.5 text-[9px] uppercase">
                              craque
                            </span>
                          )}
                        </td>
                        <td className="py-1 text-right">{j.gols || ""}</td>
                        <td className="py-1 text-right">{j.assistencias || ""}</td>
                        <td className="py-1 text-right" style={{ color: corNota(j.nota) }}>
                          {j.nota.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
