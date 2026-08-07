"use client";
import { useT } from "@/i18n/dicionario";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Radar,
  Search,
  Youtube,
  Newspaper,
  ArrowUpRight,
  Loader2,
  Plus,
  Minus,
  Globe2,
  Sparkles,
  ChevronRight,
  BookOpenText,
} from "lucide-react";
import {
  COR_REGIAO,
  getLugar,
  filhosDe,
  trilhaDe,
  estadosDaRegiao,
  PAISES_COM_DADO,
  noLugar,
  type Lugar,
} from "@/data/landing/radar-lugares";
import { NICHOS, NICHO_PADRAO, type TermoRadar } from "@/data/landing/radar-nichos";
import { toposPorFonte, larguraBarra } from "@/data/landing/radar-barra";
import { rankearIa, assuntoDeIa, type LinhaIa, type FonteId } from "@/data/landing/radar-ia";
import seedBruto from "@/data/landing/radar-seed.json";
import { ModalAssunto, type AssuntoAberto } from "@/components/radar/ModalAssunto";
import { HistoricoTendencia } from "@/components/radar/HistoricoTendencia";
import { usePainelAssunto } from "@/components/radar/usePainelAssunto";
import { VideoAbertura } from "@/components/radar/VideoAbertura";

/**
 * RADAR FAYAI — a página inteira.
 *
 * A home mostra o suficiente para dar vontade; aqui cabe o que não coube lá:
 * o globo grande, o ranking completo, a comparação entre as cinco regiões do
 * Brasil e a leitura de canal do IA Trend (o que é procurado no Google, o que
 * é procurado em vídeo, e o que é procurado nos dois).
 *
 * Regra que vale para tudo nesta página: **nenhum número aqui é estimado.**
 * Todos vêm de medição — Google Trends, Wikipedia e autocomplete — e cada
 * assunto leva à fonte que o explica.
 */

const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;
const GOLD = "#f5c04e";

const RadarGlobo = dynamic(
  () => import("@/components/3d/RadarGlobo").then((m) => ({ default: m.RadarGlobo })),
  { ssr: false }
);

interface ItemTrend {
  titulo: string;
  fonte: "busca" | "leitura";
  volume: number;
  volumeRotulo: string;
  contexto: string | null;
  url: string | null;
  veiculo: string | null;
  temIa: boolean;
  /** Estados em que o assunto apareceu — acende o mapa no hover. */
  lugares?: string[];
}

interface RadarSeed {
  [nicho: string]: { geradoEm: string; termos: TermoRadar[] };
}
const SEED = seedBruto as unknown as RadarSeed;

const REGIOES_BR = ["N", "NE", "SE", "S", "CO"] as const;

export function RadarPagina() {
  const T = useT();
  const [lugarId, setLugarId] = useState("BR");
  const [zoom, setZoom] = useState(1);
  const [sobCursor, setSobCursor] = useState<string | null>(null);
  /** Estados do assunto sob o cursor — a ponte entre a lista e o mapa. */
  const [lugaresDoItem, setLugaresDoItem] = useState<string[]>([]);
  /** Mesmo comportamento da home: hover espia, clique fixa. */
  const painel = usePainelAssunto();
  const aberto = painel.assunto;
  const [parado, setParado] = useState(false);

  const [trends, setTrends] = useState<Record<string, ItemTrend[]>>({});
  const [medindo, setMedindo] = useState(false);
  const emVoo = useRef<Set<string>>(new Set());

  const [nichoId, setNichoId] = useState(NICHO_PADRAO);
  /**
   * A camada é ESTADO, não âncora.
   *
   * Antes, "IA Trend" aqui era um `<a href="#ia-trend">`: só rolava a página,
   * enquanto na home o mesmo botão troca o globo e o painel inteiro. Duas
   * implementações para o mesmo botão davam a impressão de que a página
   * dedicada tinha menos do que a home — e tinha mesmo.
   */
  const [camada, setCamada] = useState<"mundo" | "ia">("mundo");
  const [fontes, setFontes] = useState<Set<FonteId>>(new Set<FonteId>(["web", "yt"]));

  const alternarFonte = (id: FonteId) =>
    setFontes((f) => {
      const novo = new Set(f);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      // Sem Google nem YouTube não sobra medição nenhuma: religa o que saiu.
      if (!novo.has("web") && !novo.has("yt")) novo.add(id);
      return novo;
    });

  /**
   * A medição do nicho — ao vivo, com o arquivo estático só de piso.
   *
   * Até 29/07/2026 esta página **nunca chamava `/api/radar`**: todo o painel de
   * IA Trend saía de `radar-seed.json`, um arquivo congelado no repositório,
   * enquanto o rodapé da própria página afirmava *"Dados reais, medidos agora.
   * Nada aqui é estimado."* A home media ao vivo; a página completa, que é para
   * onde o botão "abrir o radar completo" manda, não.
   *
   * O seed continua como primeiro quadro — ele evita a página nascer vazia
   * enquanto a medição (~2s de autocomplete) não volta —, mas é substituído
   * assim que o dado real chega, e a interface diz qual dos dois está na tela.
   */
  const [termosIa, setTermosIa] = useState<TermoRadar[]>(SEED[nichoId]?.termos ?? []);
  const [medidoAoVivo, setMedidoAoVivo] = useState(false);

  useEffect(() => {
    let vivo = true;
    setTermosIa(SEED[nichoId]?.termos ?? []);
    setMedidoAoVivo(false);
    fetch(`/api/radar?nicho=${encodeURIComponent(nichoId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vivo || !d || !Array.isArray(d.termos) || !d.termos.length) return;
        setTermosIa(d.termos);
        setMedidoAoVivo(true);
      })
      .catch(() => {
        /* fica o seed; a etiqueta continua dizendo que não é medição de agora */
      });
    return () => {
      vivo = false;
    };
  }, [nichoId]);

  /** O ranking completo do nicho — na página cabe o dobro do que cabe na home. */
  const linhasIa: LinhaIa[] = useMemo(
    () => rankearIa(termosIa, fontes, new Set<string>(), 12),
    [termosIa, fontes]
  );
  const notaTopo = linhasIa[0]?.nota ?? 1;

  const lugar = getLugar(lugarId);
  const trilha = useMemo(() => trilhaDe(lugarId), [lugarId]);
  const nicho = useMemo(() => NICHOS.find((n) => n.id === nichoId) ?? NICHOS[0], [nichoId]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const aplica = () => setParado(mq.matches);
    aplica();
    mq.addEventListener("change", aplica);
    return () => mq.removeEventListener("change", aplica);
  }, []);

  const medir = useCallback(
    async (id: string) => {
      if (trends[id] || emVoo.current.has(id)) return;
      emVoo.current.add(id);
      setMedindo(true);
      try {
        const r = await fetch(`/api/radar/mundo?lugar=${encodeURIComponent(id)}`);
        if (r.ok) {
          const d = await r.json();
          if (Array.isArray(d.itens)) setTrends((t) => ({ ...t, [id]: d.itens }));
        }
      } catch {
        /* a página continua com o que já tem */
      } finally {
        emVoo.current.delete(id);
        if (emVoo.current.size === 0) setMedindo(false);
      }
    },
    [trends]
  );

  useEffect(() => {
    void medir(lugarId);
  }, [lugarId, medir]);

  // As cinco regiões, medidas em paralelo, para a comparação.
  useEffect(() => {
    REGIOES_BR.forEach((r) => void medir(`BR-r-${r}`));
  }, [medir]);

  // Os filhos do lugar atual, para os marcadores 3D saberem a altura.
  useEffect(() => {
    const base = lugar.degrau === "estado" ? (lugar.pai ?? lugar.id) : lugar.id;
    filhosDe(base).forEach((l) => void medir(l.id));
  }, [lugar, medir]);

  const itens = trends[lugarId] ?? [];
  const toposVolume = useMemo(() => toposPorFonte(itens), [itens]);

  /**
   * O que cada região está procurando — SEM ranquear as regiões entre si.
   *
   * A versão anterior somava o volume dos estados e desenhava uma barra por
   * região. Medição dos 27 estados em 26/07/2026 mostrou que essa barra media
   * outra coisa: o feed do Google devolve no máximo 10 assuntos por geo, então
   * a soma acompanha o NÚMERO DE ESTADOS, não a procura. Nordeste (9 estados)
   * somava 197.600 e Sul (3 estados) 44.400 — mas por estado os dois ficam na
   * mesma faixa (21.956 contra 14.800). Pior: São Paulo, com 44 milhões de
   * habitantes, reportava 19.500 enquanto Mato Grosso do Sul, com 2,8 milhões,
   * reportava 50.100. O `approx_traffic` do Google é relativo à linha de base
   * de cada geo — "está quente AQUI" —, e por isso não se soma nem se compara
   * entre lugares.
   *
   * O que É comparável e continua sendo informação: o alcance de um assunto
   * dentro da própria região, "aparece em 6 dos 9 estados". Isso é contagem de
   * estados, não volume estimado, e é a leitura que o mapa ao lado já mostra.
   */
  const porRegiao = useMemo(
    () =>
      REGIOES_BR.map((r) => {
        const l = getLugar(`BR-r-${r}`);
        const lista = trends[`BR-r-${r}`] ?? [];
        const primeiro = lista[0];
        return {
          sigla: r,
          nome: l.nome,
          cor: COR_REGIAO[r],
          topo: primeiro?.titulo ?? null,
          // Em quantos estados da região o assunto do topo apareceu.
          alcance: primeiro?.lugares?.length ?? 0,
          estados: estadosDaRegiao(r).length,
          comIa: lista.filter((i) => i.temIa).length,
          medindo: lista.length === 0,
        };
      }),
    [trends]
  );

  /**
   * Leitura de canal do IA Trend — agora do que foi medido, não do arquivo.
   *
   * Dois defeitos aqui, e o Ricardo pegou os dois olhando a tela em 29/07/2026:
   * *"temos número 0 individuais e a soma dos 2 dá 10"*.
   *
   * O primeiro é a fonte: lia `SEED`, congelado, e não a medição.
   *
   * O segundo é de leitura. Os três mostradores sempre somam o total, então
   * quando a medição confirma tudo nos dois canais o painel exibe `10 · 0 · 0`
   * — dois cartões grandes, zerados, cada um com uma legenda prometendo um
   * achado ("demanda de VÍDEO que a busca web não mostra") que não existe
   * naquele nicho. Zero legítimo apresentado com o mesmo peso visual de um
   * número que importa vira ruído, e ruído num painel de dado vira dúvida sobre
   * o dado todo. Agora um canal exclusivo só ganha cartão quando tem o que
   * mostrar; quando não tem, uma linha de texto explica que a confirmação foi
   * nos dois canais — que é a informação real.
   */
  const canais = useMemo(() => {
    const so = (c: string) => termosIa.filter((x) => x.canais === c).length;
    return {
      ambos: so("web+yt"),
      yt: so("yt"),
      web: so("web"),
      total: termosIa.length || 1,
    };
  }, [termosIa]);


  /**
   * Onde há sinal medido — vira o marcador 3D no globo. PRESENÇA, não
   * quantidade: até 26/07 a altura do marcador era proporcional ao volume
   * somado, o que fazia o Nordeste sobressair por ter 9 estados e São Paulo
   * afundar apesar dos 44 milhões de habitantes. O volume do Google é relativo
   * à linha de base de cada lugar e não se compara entre lugares (R6).
   */
  const comSinal = useMemo(() => {
    const filhos = filhosDe(lugar.degrau === "estado" ? (lugar.pai ?? lugar.id) : lugar.id);
    const out = new Set<string>();
    for (const l of filhos) {
      if ((trends[l.id] ?? []).length === 0) continue;
      out.add(l.degrau === "estado" ? l.id.replace("BR-", "") : l.id.replace("BR-r-", ""));
    }
    return out;
  }, [lugar, trends]);

  const irPara = (id: string) => {
    setZoom(1);
    setLugarId(id);
  };

  const escolherPoligono = useCallback((p: Record<string, string>) => {
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
  }, []);

  const baseFilhos = lugar.degrau === "estado" ? (lugar.pai ?? lugar.id) : lugar.id;
  const filhos = useMemo(() => filhosDe(baseFilhos), [baseFilhos]);

  return (
    <div
      // pt-24: o cabeçalho do site é fixo (64px) e comia o título. Isto passou
      // despercebido enquanto o orbe empurrava a página 449px para baixo —
      // consertado o vazio, a sobreposição apareceu.
      className="min-h-dvh px-4 sm:px-8 pt-24 pb-10"
      style={{ background: "#0c0e1d", color: "#f3f1ff" }}
    >
      <div className="relative max-w-6xl mx-auto">
        <div
          aria-hidden
          className="fx-orb"
          style={{
            width: 420,
            height: 420,
            left: "4%",
            top: -100,
            background: `radial-gradient(circle, ${lugar.cor}44, transparent 65%)`,
            animation: "fx-drift-a 14s ease-in-out infinite",
          }}
        />

        {/* -------------------------------- cabeçalho ------------------------------- */}
        <header className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h1 className="text-4xl sm:text-6xl tracking-wide" style={bebas}>
              
              {T("RADAR")} <span style={{ color: GOLD }}>{T("FAYAI")}</span>
            </h1>
            <p className="mt-1 text-sm sm:text-base text-white/60 max-w-2xl">
              
              {T("O que o mundo está procurando agora, lugar por lugar — e o recorte de inteligência\r\n              artificial dentro disso. Tudo medido: buscas em alta do Google, artigos mais lidos da\r\n              Wikipédia e o autocomplete do Google e do YouTube.")}{" "}
              <span className="text-white/40">{T("Nenhum número aqui é estimado.")}</span>
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-white/40">
              <Radar size={13} />
              {medindo ? (
                <>
                  <Loader2 size={11} className="animate-spin" />  {T("medindo")}
                </>
              ) : (
                T("em alta agora")
              )}
            </span>
          </div>
          <VideoAbertura />
        </header>

        {/* As duas leituras aparecem nomeadas, como na home — sem os rótulos a
            página parecia não ter World Trend nem IA Trend, só seções soltas. */}
        <div className="mt-5 flex items-center gap-2 flex-wrap" role="tablist">
          {([
            { id: "mundo" as const, label: "World Trend", icone: Globe2, cor: GOLD },
            { id: "ia" as const, label: "IA Trend", icone: Sparkles, cor: "#a78bfa" },
          ]).map(({ id, label, icone: Icone, cor }) => {
            const on = camada === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setCamada(id);
                  painel.fechar();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
                style={
                  on
                    ? { background: `${cor}22`, color: cor }
                    : { color: "rgba(255,255,255,.4)" }
                }
              >
                <Icone size={13} /> {T(label)}
              </button>
            );
          })}
        </div>

        {/* ---------------------------- globo + ranking ---------------------------- */}
        <div className="mt-4 grid lg:grid-cols-2 gap-5 items-start">
          <div className="glass rounded-3xl p-3">
            <div
              className="relative w-full mx-auto overflow-hidden rounded-2xl"
              style={{ aspectRatio: "1 / 1", maxWidth: 560, background: "#0a0d1c" }}
            >
              <RadarGlobo
                lugar={lugar}
                camada={camada}
                onEscolher={escolherPoligono}
                zoom={aberto ? zoom * 0.86 : zoom}
                desviado={!!aberto}
                parado={parado}
                comSinal={comSinal}
                destacado={lugaresDoItem.length ? lugaresDoItem : sobCursor}
                onDestacar={(p) =>
                  setSobCursor(p ? (p.uf ?? p.regiao ?? p.iso ?? null) : null)
                }
              />
              {aberto && (
                <ModalAssunto
                  assunto={aberto}
                  cor={aberto.fonte === "ia" ? nicho.cor : lugar.cor}
                  nomeDoLugar={lugar.nome}
                  estado={painel.estado}
                  fixado={painel.fixado}
                  variante={painel.variante}
                  onFechar={painel.fechar}
                  onPin={painel.alternarPin}
                />
              )}

              <div className="absolute right-2 top-2 flex flex-col gap-1">
                {[
                  { i: Plus, d: 0.72, t: "Aproximar" },
                  { i: Minus, d: 1.38, t: "Afastar" },
                ].map(({ i: Icone, d, t }) => (
                  <button
                    key={t}
                    title={T(t)}
                    aria-label={T(t)}
                    onClick={() => setZoom((z) => Math.min(2.6, Math.max(0.22, z * d)))}
                    className="grid place-items-center w-8 h-8 rounded-xl border border-white/15 bg-black/40 backdrop-blur-sm text-white/70 hover:text-white hover:border-white/35 transition-colors cursor-pointer"
                  >
                    <Icone size={15} />
                  </button>
                ))}
              </div>
            </div>

            {/* lugares em palavras — o outro lado da associação */}
            {filhos.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1">
                {filhos.map((l) => {
                  const k =
                    l.degrau === "estado" ? l.id.replace("BR-", "") : l.id.replace("BR-r-", "");
                  const aceso = sobCursor === k || lugar.id === l.id;
                  return (
                    <button
                      key={l.id}
                      onMouseEnter={() => setSobCursor(k)}
                      onMouseLeave={() => setSobCursor(null)}
                      onFocus={() => setSobCursor(k)}
                      onBlur={() => setSobCursor(null)}
                      onClick={() => irPara(l.id)}
                      className="rounded-lg px-2 py-0.5 text-[11px] font-bold border transition-colors cursor-pointer"
                      style={{
                        borderColor: aceso ? l.cor : "rgba(255,255,255,.12)",
                        background: aceso ? `${l.cor}26` : "transparent",
                        color: aceso ? l.cor : "rgba(255,255,255,.55)",
                      }}
                    >
                      {T(l.nome)}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-2 flex items-center gap-1 flex-wrap text-[11px]">
              {trilha.map((l, i) => (
                <span key={l.id} className="inline-flex items-center gap-1">
                  {i > 0 && <ChevronRight size={11} className="text-white/25" />}
                  <button
                    onClick={() => irPara(l.id)}
                    className="font-bold hover:underline cursor-pointer"
                    style={{ color: l.id === lugarId ? l.cor : "rgba(255,255,255,.45)" }}
                  >
                    {T(l.nome)}
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* ranking completo — troca com a camada, como na home */}
          <div>
            {camada === "ia" ? (
              <RankingIa
                nichoId={nichoId}
                setNichoId={setNichoId}
                fontes={fontes}
                alternarFonte={alternarFonte}
                linhas={linhasIa}
                notaTopo={notaTopo}
                onAbrir={(l) => painel.abrir(assuntoDeIa(l, nicho))}
                onEspiar={(l) => painel.espiar(assuntoDeIa(l, nicho))}
                onLargar={painel.largar}
              />
            ) : (
            <>
            <h2 className="text-lg tracking-wide mb-2" style={bebas}>
              
              {T("WORLD TREND — EM ALTA")}{" "}
              <span style={{ color: lugar.cor }}>{noLugar(lugar).toUpperCase()}</span>
            </h2>
            {itens.length === 0 ? (
              <div className="glass rounded-2xl p-5 text-sm text-white/55">
                {medindo ? T("Medindo…") : T("Sem sinal para este lugar agora.")}
              </div>
            ) : (
              <ol className="space-y-1">
                {itens.slice(0, 12).map((it, i) => {
                  const daqui = !sobCursor || !it.lugares?.length || it.lugares.includes(sobCursor);
                  return (
                  <li key={`${it.titulo}-${i}`}>
                    <div
                      onClick={() => painel.abrir(it)}
                      onMouseEnter={() => {
                        setLugaresDoItem(it.lugares ?? []);
                        painel.espiar(it);
                      }}
                      onMouseLeave={() => {
                        setLugaresDoItem([]);
                        painel.largar();
                      }}
                      className="glass glass-hover rounded-xl px-3 py-2 flex items-start gap-2.5 relative overflow-hidden group transition-opacity cursor-pointer"
                      style={{ opacity: daqui ? 1 : 0.32 }}
                    >
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0"
                        style={{
                          width: `${larguraBarra(it, toposVolume, 4)}%`,
                          background: `linear-gradient(90deg, ${lugar.cor}1c, transparent)`,
                        }}
                      />
                      <span className="relative shrink-0 text-xs font-extrabold tabular-nums text-white/25 w-5 text-right pt-0.5">
                        {i + 1}
                      </span>
                      <span className="relative min-w-0 flex-1">
                        <span className="block text-sm font-bold leading-snug capitalize">
                          {T(it.titulo)}
                        </span>
                        {it.contexto && (
                          <span className="block text-[11px] text-white/50 leading-snug line-clamp-1">
                            {T(it.contexto)}
                          </span>
                        )}
                        <span className="block text-[10px] text-white/35 mt-0.5">
                          {it.fonte === "leitura" ? T("lido na Wikipédia") : T("buscado no Google")} ·{" "}
                          {T(it.volumeRotulo)}
                          {it.lugares?.length ? ` · ${it.lugares.join(" ")}` : it.veiculo ? ` · ${it.veiculo}` : ""}
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
                      <a
                        href={it.url ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Abrir em ${it.veiculo ?? T("fonte")}`}
                        className="relative shrink-0 grid place-items-center w-6 h-6 rounded-lg text-white/20 hover:text-white hover:bg-white/10 transition-colors mt-0.5"
                      >
                        <ArrowUpRight size={12} />
                      </a>
                    </div>
                  </li>
                  );
                })}
              </ol>
            )}
            </>
            )}
          </div>
        </div>

        {/* --------------------------- comparação regional -------------------------- */}
        <section className="mt-10">
          <h2 className="text-xl tracking-wide" style={bebas}>
            
            {T("O BRASIL POR")} <span style={{ color: GOLD }}>{T("REGIÃO")}</span>
          </h2>
          <p className="text-sm text-white/50 mb-3 max-w-2xl">
            
            {T("O assunto do momento em cada região, e em quantos estados dela ele aparece — que é\r\n            contagem de estados, não volume. As regiões estão em ordem geográfica de propósito:")}{" "}
            <strong className="text-white/75">{T("não dá para dizer qual procura mais")}</strong>{T(", porque o\r\n            Google reporta o volume relativo à linha de base de cada lugar, não em escala comum.")}
          </p>
          <div className="glass rounded-2xl p-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {porRegiao.map((r) => (
              <button
                key={r.sigla}
                onMouseEnter={() => setSobCursor(r.sigla)}
                onMouseLeave={() => setSobCursor(null)}
                onClick={() => irPara(`BR-r-${r.sigla}`)}
                className="text-left cursor-pointer rounded-xl p-3 transition-colors bg-white/[0.03] hover:bg-white/[0.06]"
                style={{
                  border: `1px solid ${r.cor}${sobCursor === r.sigla ? "88" : "33"}`,
                  boxShadow: sobCursor === r.sigla ? `0 0 14px ${r.cor}44` : undefined,
                }}
              >
                <span className="block text-[11px] font-bold" style={{ color: r.cor }}>
                  {T(r.nome)}
                </span>
                {r.medindo ? (
                  <span className="block mt-1 text-[11px] text-white/35">{T("medindo…")}</span>
                ) : (
                  <>
                    <span className="block mt-1 text-sm font-semibold leading-snug capitalize line-clamp-2">
                      {T(r.topo)}
                    </span>
                    <span className="block mt-1 text-[10px] text-white/35">
                      {r.alcance > 0
                        ? `aparece em ${r.alcance} ${r.alcance === 1 ? T("estado") : T("estados")} de ${r.estados}`
                        : `medido nos ${r.estados} estados da região`}
                      {r.comIa > 0 && (
                        <span className="text-violet-300/70"> · {r.comIa}  {T("sobre IA")}</span>
                      )}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* -------------------------------- IA Trend -------------------------------- */}
        <section id="ia-trend" className="mt-10 scroll-mt-6">
          <h2 className="text-xl tracking-wide">
            <span style={bebas}>
              
              {T("IA TREND — O RECORTE DE")} <span style={{ color: "#a78bfa" }}>IA</span>
            </span>
          </h2>
          <p className="text-sm text-white/50 mb-2 max-w-2xl">
            
            {T("O que o Brasil digita sobre inteligência artificial, por profissão. A leitura que\r\n            importa é o")} <strong className="text-white/75">{T("canal")}</strong>{T(": termo que só aparece no\r\n            YouTube é demanda de vídeo — onde um canal ganha antes de o site ranquear.")}
          </p>

          {/* Qual dos dois está na tela. A página afirma no rodapé que nada aqui
              é estimado; enquanto a medição não volta, quem está no ar é o
              último retrato guardado, e isso precisa estar escrito. */}
          <p className="mb-3 flex items-center gap-1.5 text-[11px] text-white/40">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: medidoAoVivo ? "#a3e635" : "#f5c04e" }}
              aria-hidden
            />
            {medidoAoVivo
              ? T("Medido agora, neste carregamento.")
              : T("Medindo… no ar, o último retrato guardado.")}
          </p>

          <div className="flex gap-1.5 flex-wrap mb-3">
            {NICHOS.map((n) => {
              const on = n.id === nichoId;
              return (
                <button
                  key={n.id}
                  onClick={() => setNichoId(n.id)}
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold border-2 transition-colors cursor-pointer"
                  style={
                    on
                      ? { borderColor: n.cor, background: `${n.cor}1f`, color: n.cor }
                      : { borderColor: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.5)" }
                  }
                >
                  {T(n.label)}
                </button>
              );
            })}
          </div>

          <div className="grid sm:grid-cols-3 gap-2.5">
            {[
              {
                rotulo: "Google e YouTube",
                n: canais.ambos,
                cor: "#a3e635",
                icone: Sparkles,
                nota: T("confirmado nos dois canais — o sinal mais confiável"),
              },
              {
                rotulo: T("Só YouTube"),
                n: canais.yt,
                cor: "#f472b6",
                icone: Youtube,
                nota: T("demanda de VÍDEO que a busca web não mostra"),
              },
              {
                rotulo: T("Só Google"),
                n: canais.web,
                cor: "#38bdf8",
                icone: Search,
                nota: T("intenção de leitura — matéria e página"),
              },
            ]
              // Canal exclusivo com zero termos não ganha cartão. Ver a nota em
              // `canais`: dois mostradores zerados do tamanho do que importa
              // faziam o painel parecer quebrado — e a legenda deles prometia um
              // achado que, naquele nicho, não existe. "Google e YouTube" fica
              // sempre, porque é a leitura principal e o seu zero é informação.
              .filter(({ rotulo, n }) => n > 0 || rotulo === "Google e YouTube")
              .map(({ rotulo, n, cor, icone: Icone, nota }) => (
              <div key={rotulo} className="glass rounded-2xl p-3.5">
                <p
                  className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest"
                  style={{ color: cor }}
                >
                  <Icone size={12} /> {T(rotulo)}
                </p>
                <p className="mt-1 text-3xl tabular-nums" style={{ ...bebas, color: cor }}>
                  {n}
                </p>
                <div className="mt-1 h-1.5 rounded-full overflow-hidden bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((n / canais.total) * 100)}%`,
                      background: cor,
                    }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-white/45 leading-snug">{T(nota)}</p>
              </div>
            ))}
          </div>

          {/* O que os cartões escondidos diriam — em uma linha, sem ocupar o
              espaço de um número que não existe. */}
          {canais.yt === 0 && canais.web === 0 && (
            <p className="mt-2 text-[12px] leading-snug text-white/40">
              
              {T("Nenhum termo exclusivo de um canal só neste recorte: os")} {canais.ambos}  {T("apareceram\r\n              no Google")} <em>e</em>  {T("no YouTube, que é a confirmação mais forte que este método dá.")}
            </p>
          )}

          {/* a ponte honesta com o catálogo */}
          <div
            className="mt-3 rounded-2xl p-4"
            style={{ border: `1px solid ${nicho.cor}44`, background: `${nicho.cor}0d` }}
          >
            <p
              className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest mb-1"
              style={{ color: nicho.cor }}
            >
              <BookOpenText size={12} />  {T("Como a FayAI ajuda quem é")} {nicho.label.toLowerCase()}
            </p>
            <p className="text-sm text-white/70 leading-relaxed">{T(nicho.ponte.texto)}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {nicho.ponte.cursos.map((c) => (
                <Link
                  key={c.slug}
                  href={`/curso/${c.slug}`}
                  className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold border transition-colors hover:bg-white/10"
                  style={{ borderColor: `${nicho.cor}55`, color: "#f3f1ff" }}
                >
                  {T(c.nome)} <ArrowUpRight size={11} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------- linha do tempo ----------------------------- */}
        {/* Vem logo depois do IA Trend de propósito: o leitor acabou de ver o
            ranking de HOJE daquele nicho, e a pergunta seguinte é sempre "isso
            é novo?". O painel responde para o mesmo nicho já selecionado. */}
        <HistoricoTendencia corNicho={nicho.cor} />

        {/* ------------------------------- metodologia ------------------------------ */}
        {/* Uma linha. A metodologia detalhada ocupava meia tela e competia com
            o próprio dado — dizer que é real, e mostrar de onde vem, basta.
            A ressalva sobre volume NÃO sumiu: ela mora agora ao lado dos
            números que a exigem, na comparação por região, que é onde alguém
            poderia ler "o Sudeste procura menos" e estar errado. */}
        <section className="mt-10 glass rounded-2xl p-4">
          <p className="text-[12px] text-white/55 leading-relaxed">
            <strong className="text-white/75">{T("Dados reais, medidos agora.")}</strong>  {T("Nada aqui é\r\n            estimado, e cada assunto leva à fonte que o publicou —")}{" "}
            <a
              href="https://trends.google.com/trending?geo=BR"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-white/25 hover:text-white transition-colors"
            >
              
              {T("Google Trends")}
            </a>
            ,{" "}
            <a
              href="https://pt.wikipedia.org/wiki/Wikip%C3%A9dia:P%C3%A1gina_principal"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-white/25 hover:text-white transition-colors"
            >
              
              {T("Wikipédia")}
            </a>{" "}
            
            {T("e o autocomplete do Google e do YouTube.")}
          </p>
          <Link
            href="/"
            className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/45 hover:text-white transition-colors"
          >
            <Globe2 size={13} />  {T("voltar para a home")}
          </Link>
        </section>

        <p className="mt-6 text-center text-[11px] text-white/25">
          <Newspaper size={11} className="inline mr-1" />
          
          {T("Cada assunto leva ao veículo que o publicou. A FayAI não hospeda a notícia — aponta para\r\n          ela.")}
        </p>
      </div>
    </div>
  );
}

/**
 * O ranking do IA Trend na coluna do mapa — o que a home tem e a página não
 * tinha. Mesmas linhas clicáveis, mesmo painel: o gesto não muda entre as duas
 * leituras nem entre as duas telas.
 */
function RankingIa({
  nichoId,
  setNichoId,
  fontes,
  alternarFonte,
  linhas,
  notaTopo,
  onAbrir,
  onEspiar,
  onLargar,
}: {
  nichoId: string;
  setNichoId: (id: string) => void;
  fontes: Set<FonteId>;
  alternarFonte: (id: FonteId) => void;
  linhas: LinhaIa[];
  notaTopo: number;
  onAbrir: (l: LinhaIa) => void;
  onEspiar: (l: LinhaIa) => void;
  onLargar: () => void;
}) {
  const T = useT();
  const nicho = NICHOS.find((n) => n.id === nichoId) ?? NICHOS[0];
  const FONTES: { id: FonteId; label: string; icone: typeof Search; desc: string }[] = [
    { id: "web", label: "Google", icone: Search, desc: "demanda de busca" },
    { id: "yt", label: "YouTube", icone: Youtube, desc: "demanda de vídeo" },
  ];

  return (
    <div>
      <h2 className="text-lg tracking-wide mb-2" style={bebas}>
        
        {T("IA TREND —")} <span style={{ color: nicho.cor }}>{nicho.label.toUpperCase()}</span>
      </h2>

      <div className="flex gap-1.5 flex-wrap mb-2" role="tablist">
        {NICHOS.map((n) => {
          const on = n.id === nichoId;
          return (
            <button
              key={n.id}
              role="tab"
              aria-selected={on}
              onClick={() => setNichoId(n.id)}
              className="rounded-full px-2.5 py-1 text-[11px] font-bold border-2 transition-colors cursor-pointer"
              style={
                on
                  ? { borderColor: n.cor, background: `${n.cor}1f`, color: n.cor }
                  : { borderColor: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.5)" }
              }
            >
              {T(n.label)}
            </button>
          );
        })}
      </div>

      {/* Desligar uma fonte recalcula a NOTA — não é um filtro de lista. É o
          radar consultando um canal só, que é o controle na mão do visitante. */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/30 mr-1">
          
          {T("Fontes")}
        </span>
        {FONTES.map(({ id, label, icone: Icone, desc }) => {
          const on = fontes.has(id);
          return (
            <button
              key={id}
              onClick={() => alternarFonte(id)}
              aria-pressed={on}
              title={T(desc)}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold border transition-colors cursor-pointer"
              style={
                on
                  ? { borderColor: "rgba(255,255,255,.3)", background: "rgba(255,255,255,.07)", color: "#f3f1ff" }
                  : { borderColor: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.32)" }
              }
            >
              <Icone size={11} />
              {T(label)}
            </button>
          );
        })}
      </div>

      {linhas.length === 0 ? (
        <div className="glass rounded-2xl p-5 text-sm text-white/55">
          
          {T("Nenhum termo sobrevive a essa combinação. Religue o Google ou o YouTube.")}
        </div>
      ) : (
        <ol className="space-y-1">
          {linhas.map((l, i) => (
            <li key={l.termo}>
              <button
                type="button"
                onClick={() => onAbrir(l)}
                onMouseEnter={() => onEspiar(l)}
                onMouseLeave={onLargar}
                onFocus={() => onEspiar(l)}
                onBlur={onLargar}
                aria-label={`Ver detalhe de ${l.termo}`}
                className="glass glass-hover w-full text-left rounded-xl px-3 py-2 relative overflow-hidden cursor-pointer"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${Math.min(100, Math.max(6, Math.round((l.nota / notaTopo) * 100)))}%`,
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
                    <p className="text-[13px] font-bold leading-snug break-words">{T(l.termo)}</p>
                    <p className="text-[10px] text-white/35">
                      {l.canais === "web+yt"
                        ? T("Google e YouTube")
                        : l.canais === "yt"
                          ? T("só YouTube — demanda de vídeo")
                          : T("só Google")}{" "}
                      · {T(l.formato)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-extrabold tabular-nums" style={{ color: nicho.cor }}>
                    {l.nota.toFixed(1)}
                  </span>
                  <ArrowUpRight size={12} className="shrink-0 text-white/20" />
                </div>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
