"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Radar,
  Youtube,
  Search,
  Newspaper,
  ArrowUpRight,
  Loader2,
  Plus,
  Minus,
  Globe2,
  Sparkles,
  BookOpenText,
  ChevronRight,
} from "lucide-react";
import { NICHOS, NICHO_PADRAO, type TermoRadar } from "@/data/landing/radar-nichos";
import {
  COR_REGIAO,
  getLugar,
  filhosDe,
  trilhaDe,
  PAISES_COM_DADO,
  noLugar,
  type Lugar,
} from "@/data/landing/radar-lugares";
import type { AiNewsItem } from "@/data/landing/seed-news";
import seedBruto from "@/data/landing/radar-seed.json";
import { ModalAssunto, type AssuntoAberto } from "@/components/radar/ModalAssunto";
import { usePainelAssunto } from "@/components/radar/usePainelAssunto";

/**
 * RADAR FAYAI — uma ferramenta de trending de verdade, com a Terra como controle.
 *
 * Duas leituras do mesmo planeta:
 *   WORLD TREND  o que está em alta naquele lugar, agora, sobre qualquer assunto
 *                (Google Trends + Wikipedia, sempre com link para a origem)
 *   IA TREND     o recorte de IA, medido no autocomplete do Google e do YouTube
 *
 * A ordem é essa de propósito. Quem chega vê o mundo real primeiro; o recorte
 * de IA é o passo natural de quem já está num site de IA — não uma imposição
 * logo na entrada.
 *
 * O que este componente NÃO faz: prometer curso que não existe. A ponte com o
 * catálogo é escrita à mão por nicho (`radar-nichos.ts`), dizendo o que temos e
 * o que não temos.
 */

const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;
const GOLD = "#f5c04e";

const RadarGlobo = dynamic(
  () => import("@/components/3d/RadarGlobo").then((m) => ({ default: m.RadarGlobo })),
  { ssr: false }
);

// ---------------------------------------------------------------------------
// Tipos das duas fontes
// ---------------------------------------------------------------------------

interface ItemTrend {
  titulo: string;
  fonte: "busca" | "leitura";
  volume: number;
  volumeRotulo: string;
  contexto: string | null;
  url: string | null;
  veiculo: string | null;
  temIa: boolean;
  /** Estados em que este assunto apareceu — acende o mapa no hover. */
  lugares?: string[];
}

type Camada = "mundo" | "ia";
type FonteId = "web" | "yt" | "noticias";

const FONTES: { id: FonteId; label: string; icon: typeof Search; desc: string }[] = [
  { id: "web", label: "Google", icon: Search, desc: "demanda de busca" },
  { id: "yt", label: "YouTube", icon: Youtube, desc: "demanda de vídeo" },
  { id: "noticias", label: "Notícias de hoje", icon: Newspaper, desc: "o tema está no noticiário" },
];

const PESO_NOTICIA = 1.35;
const TERMOS_VISIVEIS = 6;
const TRENDS_VISIVEIS = 6;

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

function semAcento(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const VAZIAS = new Set([
  "para", "como", "mais", "sobre", "voce", "seus", "isso", "esse", "essa", "pelo",
  "pela", "uma", "dos", "das", "que", "nao", "com", "sem", "ainda", "agora", "hoje",
  "melhor", "melhores", "novo", "nova", "sao", "pode", "todo", "toda", "gratis",
  "inteligencia", "artificial", "generativa",
]);

function palavrasUteis(texto: string): string[] {
  return semAcento(texto.toLowerCase())
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 5 && !VAZIAS.has(p));
}

function recalcular(t: TermoRadar, fontes: Set<FonteId>, naNoticia: boolean): number | null {
  const usaWeb = fontes.has("web") && t.web > 0;
  const usaYt = fontes.has("yt") && t.yt > 0;
  if (!usaWeb && !usaYt) return null;
  const pWeb = usaWeb && t.posWeb !== null ? Math.max(0, 10 - t.posWeb) : 0;
  const pYt = usaYt && t.posYt !== null ? Math.max(0, 10 - t.posYt) * 1.2 : 0;
  const ambos = usaWeb && usaYt ? 1.6 : 1;
  let score = (pWeb + pYt) * ambos + t.sementes.length * 1.5;
  if (fontes.has("noticias") && naNoticia) score *= PESO_NOTICIA;
  return Math.round(score * 10) / 10;
}

interface Linha extends TermoRadar {
  nota: number;
  naNoticia: boolean;
}

export interface RadarSeed {
  [nicho: string]: { geradoEm: string; termos: TermoRadar[] };
}

const SEED = seedBruto as unknown as RadarSeed;

// ---------------------------------------------------------------------------

export function RadarSection({ news = [] }: { news?: AiNewsItem[] }) {
  const [camada, setCamada] = useState<Camada>("mundo");
  const [lugarId, setLugarId] = useState("BR");
  const [zoom, setZoom] = useState(1);
  /** Lugar sob o cursor — mora aqui, e não dentro do globo, porque é o que
   *  liga o mapa às palavras: passar no globo acende o nome, passar no nome
   *  acende o mapa. */
  const [sobCursor, setSobCursor] = useState<string | null>(null);
  /** Estados do assunto sob o cursor — é o que acende o mapa a partir da lista. */
  const [lugaresDoItem, setLugaresDoItem] = useState<string[]>([]);
  /** O painel de detalhe: hover espia, clique fixa. Os tempos e o aviso de
   *  troca moram no hook, não espalhados pela tela. */
  const painel = usePainelAssunto();
  const aberto = painel.assunto;
  const [parado, setParado] = useState(false);

  // World Trend
  const [trends, setTrends] = useState<Record<string, { geradoEm: string; itens: ItemTrend[] }>>({});
  const [medindoMundo, setMedindoMundo] = useState(false);

  // IA Trend
  const [nichoId, setNichoId] = useState(NICHO_PADRAO);
  const [fontes, setFontes] = useState<Set<FonteId>>(new Set<FonteId>(["web", "yt"]));
  const [dadosIa, setDadosIa] = useState<RadarSeed>(SEED);
  const [medindoIa, setMedindoIa] = useState(false);
  const [aoVivo, setAoVivo] = useState<Record<string, boolean>>({});

  const secao = useRef<HTMLElement>(null);
  const emVoo = useRef<Set<string>>(new Set());

  const lugar = getLugar(lugarId);
  const nicho = useMemo(() => NICHOS.find((n) => n.id === nichoId) ?? NICHOS[0], [nichoId]);
  const trilha = useMemo(() => trilhaDe(lugarId), [lugarId]);

  // O carregamento tardio já vem do `next/dynamic` com `ssr: false`: o chunk do
  // globo (three + r3f) só é baixado no cliente. Um IntersectionObserver por
  // cima disso adiava o download de quem nunca rolasse até aqui, mas custou
  // caro em depuração e o ganho era marginal — a seção fica na primeira dobra
  // de scroll da home.

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const aplica = () => setParado(mq.matches);
    aplica();
    mq.addEventListener("change", aplica);
    return () => mq.removeEventListener("change", aplica);
  }, []);


  // ---- medições ------------------------------------------------------------
  const medirMundo = useCallback(
    async (id: string) => {
      if (trends[id] || emVoo.current.has(`m:${id}`)) return;
      emVoo.current.add(`m:${id}`);
      setMedindoMundo(true);
      try {
        const r = await fetch(`/api/radar/mundo?lugar=${encodeURIComponent(id)}`);
        if (r.ok) {
          const d = await r.json();
          if (Array.isArray(d.itens) && d.itens.length) {
            setTrends((t) => ({ ...t, [id]: { geradoEm: d.geradoEm, itens: d.itens } }));
          }
        }
      } catch {
        /* silêncio: a tela mantém o que já tem */
      } finally {
        emVoo.current.delete(`m:${id}`);
        if (![...emVoo.current].some((k) => k.startsWith("m:"))) setMedindoMundo(false);
      }
    },
    [trends]
  );

  const medirIa = useCallback(
    async (id: string) => {
      if (aoVivo[id] || emVoo.current.has(`i:${id}`)) return;
      emVoo.current.add(`i:${id}`);
      setMedindoIa(true);
      try {
        const r = await fetch(`/api/radar?nicho=${encodeURIComponent(id)}`);
        if (r.ok) {
          const d = await r.json();
          if (Array.isArray(d.termos) && d.termos.length) {
            setDadosIa((x) => ({ ...x, [id]: { geradoEm: d.geradoEm, termos: d.termos } }));
            setAoVivo((v) => ({ ...v, [id]: true }));
          }
        }
      } catch {
        /* idem */
      } finally {
        emVoo.current.delete(`i:${id}`);
        if (![...emVoo.current].some((k) => k.startsWith("i:"))) setMedindoIa(false);
      }
    },
    [aoVivo]
  );

  useEffect(() => {
    if (camada === "mundo") void medirMundo(lugarId);
    else void medirIa(nichoId);
  }, [camada, lugarId, nichoId, medirMundo, medirIa]);

  // Os filhos do lugar atual, medidos em segundo plano: é o que dá altura aos
  // marcadores 3D e deixa ver de relance onde está acontecendo.
  useEffect(() => {
    if (camada !== "mundo") return;
    const base = lugar.degrau === "estado" ? (lugar.pai ?? lugar.id) : lugar.id;
    filhosDe(base).forEach((l) => void medirMundo(l.id));
  }, [camada, lugar, medirMundo]);


  const escolherPoligono = useCallback(
    (p: Record<string, string>) => {
      setZoom(1);
      if (p.iso) {
        if (PAISES_COM_DADO.has(p.iso)) setLugarId(p.iso);
        return;
      }
      if (p.uf) {
        setLugarId(`BR-${p.uf}`);
        return;
      }
      if (p.regiao) setLugarId(`BR-r-${p.regiao}`);
    },
    []
  );

  const irPara = (id: string) => {
    setZoom(1);
    setLugarId(id);
  };

  // ---- dados de tela: World -----------------------------------------------

  /**
   * Intensidade por lugar (0..1) — vira a altura do marcador 3D no globo.
   * Mede-se em silêncio os filhos do lugar atual: é o que permite ver de
   * relance ONDE está acontecendo, sem precisar clicar em cada um.
   */
  const intensidade = useMemo(() => {
    const filhos = filhosDe(lugar.degrau === "estado" ? (lugar.pai ?? lugar.id) : lugar.id);
    const brutos = filhos.map((l) => ({
      chave: l.degrau === "estado" ? l.id.replace("BR-", "") : l.id.replace("BR-r-", ""),
      total: (trends[l.id]?.itens ?? []).reduce((a, i) => a + i.volume, 0),
    }));
    const teto = Math.max(1, ...brutos.map((b) => b.total));
    const out: Record<string, number> = {};
    for (const b of brutos) if (b.total > 0) out[b.chave] = Math.min(1, b.total / teto);
    return out;
  }, [lugar, trends]);

  const itensMundo = useMemo(() => {
    const brutos = trends[lugarId]?.itens ?? [];
    return brutos.slice(0, TRENDS_VISIVEIS);
  }, [trends, lugarId]);

  const comIa = useMemo(() => (trends[lugarId]?.itens ?? []).filter((i) => i.temIa).length, [trends, lugarId]);

  // ---- dados de tela: IA ---------------------------------------------------
  const vocabularioNoticias = useMemo(() => {
    const v = new Set<string>();
    for (const n of news) for (const p of palavrasUteis(`${n.title} ${n.summary ?? ""}`)) v.add(p);
    return v;
  }, [news]);

  const linhasIa: Linha[] = useMemo(() => {
    const bruto = dadosIa[nichoId]?.termos ?? [];
    const saida: Linha[] = [];
    for (const t of bruto) {
      const naNoticia = palavrasUteis(t.termo).some((p) => vocabularioNoticias.has(p));
      const nota = recalcular(t, fontes, naNoticia);
      if (nota === null) continue;
      saida.push({ ...t, nota, naNoticia });
    }
    saida.sort((a, b) => b.nota - a.nota);
    return saida.slice(0, TERMOS_VISIVEIS);
  }, [dadosIa, nichoId, fontes, vocabularioNoticias]);

  const notaTopo = linhasIa[0]?.nota ?? 1;
  const volumeTopo = itensMundo[0]?.volume || 1;

  const alternarFonte = (id: FonteId) => {
    setFontes((f) => {
      const novo = new Set(f);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      if (!novo.has("web") && !novo.has("yt")) return f;
      return novo;
    });
  };

  const corAtiva = camada === "ia" ? nicho.cor : lugar.cor;
  const medindo = camada === "mundo" ? medindoMundo : medindoIa;

  return (
    <section ref={secao} className="relative px-4 sm:px-8 pb-3 shrink-0">
      <div
        aria-hidden
        className="fx-orb"
        style={{
          width: 340,
          height: 340,
          left: "8%",
          top: -70,
          background: `radial-gradient(circle, ${corAtiva}4d, transparent 65%)`,
          animation: "fx-drift-a 13s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="fx-orb"
        style={{
          width: 270,
          height: 270,
          right: "7%",
          top: 30,
          background: "radial-gradient(circle, rgba(167,139,250,.35), transparent 65%)",
          animation: "fx-drift-b 16s ease-in-out infinite",
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* ------------------------------ cabeçalho ------------------------------ */}
        <div className="flex items-baseline gap-3 flex-wrap">
          <h3 className="text-xl sm:text-2xl tracking-wide" style={bebas}>
            RADAR <span style={{ color: GOLD }}>FAYAI</span>
          </h3>
          <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-white/40">
            <Radar size={13} />
            {medindo ? (
              <>
                <Loader2 size={11} className="animate-spin" /> medindo
              </>
            ) : camada === "mundo" ? (
              "em alta agora"
            ) : (
              "demanda de busca"
            )}
          </span>
        </div>

        {/* --------------------------------- abas -------------------------------- */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
        <div className="inline-flex rounded-2xl p-1 gap-1 border border-white/10 bg-white/[0.04]">
          {(
            [
              { id: "mundo" as const, label: "World Trend", icon: Globe2 },
              { id: "ia" as const, label: "IA Trend", icon: Sparkles },
            ]
          ).map(({ id, label, icon: Icon }) => {
            const on = camada === id;
            return (
              <button
                key={id}
                onClick={() => setCamada(id)}
                aria-pressed={on}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
                style={
                  on
                    ? { background: id === "ia" ? "#a78bfa22" : `${GOLD}22`, color: id === "ia" ? "#a78bfa" : GOLD }
                    : { color: "rgba(255,255,255,.45)" }
                }
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>

        <Link
          href="/radar"
          className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-white/45 hover:text-white transition-colors"
        >
          Abrir o radar completo <ArrowUpRight size={12} />
        </Link>
        </div>

        <p className="mt-2 mb-3 text-sm text-white/55 max-w-2xl">
          {camada === "mundo" ? (
            <>
              O que o mundo está procurando <strong className="text-white/80">agora</strong>, lugar
              por lugar. Gire o planeta, clique numa região e desça até o estado — cada assunto vem
              com o link da fonte que o explica.
            </>
          ) : (
            <>
              O recorte de <strong className="text-white/80">inteligência artificial</strong>: o que
              o Brasil digita no Google e no YouTube, por profissão. Medido, não opinado.
            </>
          )}
        </p>

        {/* -------------------------- globo + painel ----------------------------- */}
        {/* `lg:grid-cols-2` em vez de trilhos arbitrários: valor arbitrário com
            vírgula depende do JIT gerar a classe, e quando ele não gera o grid
            silenciosamente vira uma coluna só. Aqui a proporção vem do
            `max-w` do globo, que não depende de compilação. */}
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          {/* ---------------------------- globo ---------------------------- */}
          <div className="glass rounded-3xl p-2.5 order-2 lg:order-1">
            <div
              className="relative w-full mx-auto overflow-hidden rounded-2xl"
              style={{ aspectRatio: "1 / 1", maxWidth: 420, background: "#0a0d1c" }}
            >
              {/* Sem porteiro: `next/dynamic` com `ssr:false` já garante que o
                  chunk do globo (three + r3f) só carregue no cliente. Um
                  ternário a mais aqui só cria estado para errar. */}
              <RadarGlobo
                lugar={lugar}
                camada={camada}
                onEscolher={escolherPoligono}
                zoom={aberto ? zoom * 0.86 : zoom}
                desviado={!!aberto}
                parado={parado}
                intensidade={intensidade}
                destacado={lugaresDoItem.length ? lugaresDoItem : sobCursor}
                onDestacar={(p) => setSobCursor(p ? (p.uf ?? p.regiao ?? p.iso ?? null) : null)}
              />

              {aberto && (
                <ModalAssunto
                  assunto={aberto}
                  cor={lugar.cor}
                  nomeDoLugar={lugar.nome}
                  estado={painel.estado}
                  fixado={painel.fixado}
                  variante={painel.variante}
                  onFechar={painel.fechar}
                  onPin={painel.alternarPin}
                />
              )}

              {/* zoom */}
              <div className="absolute right-2 top-2 flex flex-col gap-1">
                {[
                  { i: Plus, d: 0.72, t: "Aproximar" },
                  { i: Minus, d: 1.38, t: "Afastar" },
                ].map(({ i: Icone, d, t }) => (
                  <button
                    key={t}
                    title={t}
                    aria-label={t}
                    onClick={() => setZoom((z) => Math.min(2.6, Math.max(0.22, z * d)))}
                    className="grid place-items-center w-8 h-8 rounded-xl border border-white/15 bg-black/40 backdrop-blur-sm text-white/70 hover:text-white hover:border-white/35 transition-colors cursor-pointer"
                  >
                    <Icone size={15} />
                  </button>
                ))}
              </div>
            </div>

            {/* Os lugares do degrau atual, em palavras. É o outro lado da
                associação que faltava: o mapa tem forma, isto tem nome. */}
            <FaixaDeLugares
              lugar={lugar}
              sobCursor={sobCursor}
              onSobCursor={setSobCursor}
              onIr={irPara}
            />

            {/* trilha de navegação */}
            <div className="mt-2 flex items-center gap-1 flex-wrap text-[11px]">
              {trilha.map((l, i) => (
                <span key={l.id} className="inline-flex items-center gap-1">
                  {i > 0 && <ChevronRight size={11} className="text-white/25" />}
                  <button
                    onClick={() => irPara(l.id)}
                    className="font-bold hover:underline cursor-pointer"
                    style={{ color: l.id === lugarId ? l.cor : "rgba(255,255,255,.45)" }}
                  >
                    {l.nome}
                  </button>
                </span>
              ))}
              <span className="ml-auto text-white/25">
                {lugar.degrau === "mundo"
                  ? "clique num país"
                  : lugar.id === "BR"
                    ? "clique numa região"
                    : lugar.degrau === "regiao"
                      ? "clique num estado"
                      : "arraste para girar"}
              </span>
            </div>
          </div>

          {/* --------------------------- painel ---------------------------- */}
          <div className="order-1 lg:order-2">
            {camada === "mundo" ? (
              <PainelMundo
                lugar={lugar}
                onAbrir={painel.abrir}
                onEspiar={painel.espiar}
                onLargar={painel.largar}
                sobCursor={sobCursor}
                onItemSobCursor={setLugaresDoItem}
                itens={itensMundo}
                volumeTopo={volumeTopo}
                comIa={comIa}
                medindo={medindoMundo}
                onVerIa={() => setCamada("ia")}
              />
            ) : (
              <PainelIa
                nichoId={nichoId}
                setNichoId={setNichoId}
                fontes={fontes}
                alternarFonte={alternarFonte}
                linhas={linhasIa}
                notaTopo={notaTopo}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Os filhos do lugar atual como palavras clicáveis, sincronizados com o globo.
 * Serve de legenda, de navegação por teclado e de acessibilidade — quem não
 * consegue mirar um estado no globo consegue clicar no nome.
 */
function FaixaDeLugares({
  lugar,
  sobCursor,
  onSobCursor,
  onIr,
}: {
  lugar: Lugar;
  sobCursor: string | null;
  onSobCursor: (id: string | null) => void;
  onIr: (id: string) => void;
}) {
  // No degrau de estado mostramos os irmãos, não os filhos (estado não tem).
  const base = lugar.degrau === "estado" ? (lugar.pai ?? lugar.id) : lugar.id;
  const filhos = useMemo(() => filhosDe(base), [base]);
  if (!filhos.length) return null;

  /** A chave que o globo usa para o mesmo lugar: sigla da UF ou da região. */
  const chaveDe = (l: Lugar) =>
    l.degrau === "estado" ? l.id.replace("BR-", "") : l.id.replace("BR-r-", "");

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {filhos.map((l) => {
        const k = chaveDe(l);
        const aceso = sobCursor === k || lugar.id === l.id;
        return (
          <button
            key={l.id}
            onMouseEnter={() => onSobCursor(k)}
            onMouseLeave={() => onSobCursor(null)}
            onFocus={() => onSobCursor(k)}
            onBlur={() => onSobCursor(null)}
            onClick={() => onIr(l.id)}
            className="rounded-lg px-2 py-0.5 text-[11px] font-bold border transition-colors cursor-pointer"
            style={{
              borderColor: aceso ? l.cor : "rgba(255,255,255,.12)",
              background: aceso ? `${l.cor}26` : "transparent",
              color: aceso ? l.cor : "rgba(255,255,255,.55)",
            }}
          >
            {l.nome}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Painel World Trend
// ---------------------------------------------------------------------------

function PainelMundo({
  lugar,
  onAbrir,
  onEspiar,
  onLargar,
  sobCursor,
  onItemSobCursor,
  itens,
  volumeTopo,
  comIa,
  medindo,
  onVerIa,
}: {
  lugar: Lugar;
  onAbrir: (a: AssuntoAberto) => void;
  onEspiar: (a: AssuntoAberto) => void;
  onLargar: () => void;
  sobCursor: string | null;
  onItemSobCursor: (lugares: string[]) => void;
  itens: ItemTrend[];
  volumeTopo: number;
  comIa: number;
  medindo: boolean;
  onVerIa: () => void;
}) {
  if (!itens.length) {
    return (
      <div className="glass rounded-2xl p-5 text-sm text-white/55">
        {medindo ? "Medindo o que está em alta aqui…" : "Sem sinal para este lugar agora."}
      </div>
    );
  }

  const [primeiro, ...resto] = itens;

  return (
    <div>
      {/* destaque */}
      <button
        onClick={() => onAbrir(primeiro)}
        onMouseEnter={() => {
          onItemSobCursor(primeiro.lugares ?? []);
          onEspiar(primeiro);
        }}
        onMouseLeave={() => {
          onItemSobCursor([]);
          onLargar();
        }}
        className="glass glass-hover block w-full text-left rounded-2xl p-4 relative overflow-hidden group cursor-pointer"
        style={{ border: `1.5px solid ${lugar.cor}55` }}
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0"
          style={{ width: "100%", background: `linear-gradient(90deg, ${lugar.cor}1f, transparent 70%)` }}
        />
        <span className="relative block">
          <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest">
            <span style={{ color: lugar.cor }}>#1 {noLugar(lugar)}</span>
            <span className="text-white/35">{primeiro.volumeRotulo}</span>
          </span>
          <span className="block mt-1 text-lg sm:text-xl font-bold leading-snug capitalize">
            {primeiro.titulo}
          </span>
          {primeiro.contexto && (
            <span className="block mt-1.5 text-xs text-white/60 leading-relaxed line-clamp-2">
              {primeiro.contexto}
            </span>
          )}
          {primeiro.veiculo && (
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-white/40 group-hover:text-white/70 transition-colors">
              {primeiro.veiculo} · ver detalhes
            </span>
          )}
        </span>
      </button>

      {/* demais */}
      <ol className="mt-1.5 space-y-1">
        {resto.map((it, i) => {
          const daqui = !sobCursor || !it.lugares?.length || it.lugares.includes(sobCursor);
          return (
          <li key={`${it.titulo}-${i}`}>
            <div
              onClick={() => onAbrir(it)}
              onMouseEnter={() => {
                onItemSobCursor(it.lugares ?? []);
                onEspiar(it);
              }}
              onMouseLeave={() => {
                onItemSobCursor([]);
                onLargar();
              }}
              className="glass glass-hover rounded-xl px-3 py-2 flex items-center gap-2.5 relative overflow-hidden group transition-opacity cursor-pointer"
              style={{ opacity: daqui ? 1 : 0.32 }}
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${Math.max(5, Math.round((it.volume / volumeTopo) * 100))}%`,
                  background: `linear-gradient(90deg, ${lugar.cor}18, transparent)`,
                }}
              />
              <span className="relative shrink-0 text-xs font-extrabold tabular-nums text-white/25 w-4 text-right">
                {i + 2}
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="block text-[13px] font-bold leading-snug truncate capitalize">
                  {it.titulo}
                </span>
                <span className="block text-[10px] text-white/35">
                  {it.fonte === "leitura" ? "lido na Wikipédia" : "buscado no Google"} ·{" "}
                  {it.volumeRotulo}
                  {it.lugares?.length ? ` · ${it.lugares.join(" ")}` : ""}
                </span>
              </span>
              {it.temIa && (
                <span
                  className="relative shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                  style={{ background: "#a78bfa22", color: "#a78bfa" }}
                >
                  IA
                </span>
              )}
              {/* a setinha continua sendo o atalho para a fonte */}
              <a
                href={it.url ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Abrir em ${it.veiculo ?? "fonte"}`}
                className="relative shrink-0 grid place-items-center w-6 h-6 rounded-lg text-white/20 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ArrowUpRight size={12} />
              </a>
            </div>
          </li>
          );
        })}
      </ol>

      <div className="mt-2.5 flex items-start gap-2 text-[11px] leading-relaxed text-white/35">
        <span>
          Buscas em alta do Google Trends e artigos mais lidos da Wikipédia, medidos{" "}
          <span style={{ color: lugar.cor }}>{noLugar(lugar)}</span>. Cada linha leva à fonte.
        </span>
      </div>

      <button
        onClick={onVerIa}
        className="mt-3 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold transition-opacity hover:opacity-90 cursor-pointer"
        style={{ background: "linear-gradient(135deg, #a78bfa, #7c6bf0)", color: "#0c0e1d" }}
      >
        <Sparkles size={15} />
        {comIa > 0
          ? `${comIa} destes assuntos falam de IA — ver o mundo em IA`
          : "Ver o que o mundo consome de IA"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Painel IA Trend
// ---------------------------------------------------------------------------

function PainelIa({
  nichoId,
  setNichoId,
  fontes,
  alternarFonte,
  linhas,
  notaTopo,
}: {
  nichoId: string;
  setNichoId: (id: string) => void;
  fontes: Set<FonteId>;
  alternarFonte: (id: FonteId) => void;
  linhas: Linha[];
  notaTopo: number;
}) {
  const nicho = NICHOS.find((n) => n.id === nichoId) ?? NICHOS[0];

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto sm:flex-wrap sm:overflow-visible pb-2 -mx-1 px-1" role="tablist">
        {NICHOS.map((n) => {
          const on = n.id === nichoId;
          return (
            <button
              key={n.id}
              role="tab"
              aria-selected={on}
              onClick={() => setNichoId(n.id)}
              className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold border-2 transition-colors cursor-pointer"
              style={
                on
                  ? { borderColor: n.cor, background: `${n.cor}1f`, color: n.cor }
                  : { borderColor: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.5)" }
              }
            >
              {n.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/30 mr-1">
          Fontes
        </span>
        {FONTES.map(({ id, label, icon: Icon, desc }) => {
          const on = fontes.has(id);
          return (
            <button
              key={id}
              onClick={() => alternarFonte(id)}
              aria-pressed={on}
              title={desc}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold border transition-colors cursor-pointer"
              style={
                on
                  ? { borderColor: "rgba(255,255,255,.3)", background: "rgba(255,255,255,.07)", color: "#f3f1ff" }
                  : { borderColor: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.32)" }
              }
            >
              <Icon size={11} />
              {label}
            </button>
          );
        })}
      </div>

      {linhas.length === 0 ? (
        <div className="glass rounded-2xl p-5 text-sm text-white/55">
          Nenhum termo sobrevive a essa combinação. Religue o Google ou o YouTube.
        </div>
      ) : (
        <ol className="space-y-1">
          {linhas.map((l, i) => (
            <li key={l.termo}>
              <div className="glass rounded-xl px-3 py-2 relative overflow-hidden">
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${Math.max(6, Math.round((l.nota / notaTopo) * 100))}%`,
                    background: `linear-gradient(90deg, ${nicho.cor}1f, transparent)`,
                  }}
                />
                <div className="relative flex items-center gap-2.5">
                  <span
                    className="shrink-0 text-xs font-extrabold tabular-nums w-4 text-right"
                    style={{ color: i === 0 ? nicho.cor : "rgba(255,255,255,.28)" }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold leading-snug break-words">{l.termo}</p>
                    <p className="text-[10px] text-white/35">
                      {l.canais === "web+yt"
                        ? "Google e YouTube"
                        : l.canais === "yt"
                          ? "só YouTube — demanda de vídeo"
                          : "só Google"}
                      {l.naNoticia && fontes.has("noticias") ? " · nas notícias de hoje" : ""} ·{" "}
                      {l.formato}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-xs font-extrabold tabular-nums"
                    style={{ color: nicho.cor }}
                  >
                    {l.nota.toFixed(1)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* A ponte honesta com o catálogo — sem prometer curso que não existe. */}
      <div
        className="mt-2.5 rounded-2xl p-3.5"
        style={{ border: `1px solid ${nicho.cor}44`, background: `${nicho.cor}0d` }}
      >
        <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: nicho.cor }}>
          <BookOpenText size={12} /> Como a FayAI ajuda quem é {nicho.label.toLowerCase()}
        </p>
        <p className="text-xs text-white/65 leading-relaxed">{nicho.ponte.texto}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {nicho.ponte.cursos.map((c) => (
            <Link
              key={c.slug}
              href={`/curso/${c.slug}`}
              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold border transition-colors hover:bg-white/10"
              style={{ borderColor: `${nicho.cor}55`, color: "#f3f1ff" }}
            >
              {c.nome} <ArrowUpRight size={11} />
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-white/30">
        Nota = posição no autocomplete + amplitude + confirmação entre canais (Google <em>e</em>{" "}
        YouTube vale 1,6×). As consultas que fizemos ficam fora do ranking, e termos que voltam em
        espanhol ou inglês são descartados.
      </p>
    </div>
  );
}
