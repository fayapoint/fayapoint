"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Sparkles, Table2, LineChart } from "lucide-react";
import type { LeituraRadar, SerieLeitura } from "@/lib/radar-leitura";

/**
 * A linha do tempo do Radar — o que subiu, o que caiu, o que estreou.
 *
 * O resto da página responde "o que o Brasil procura AGORA". Este painel é a
 * única parte que responde "e antes?", que é a pergunta que decide pauta: um
 * termo estável há três semanas é conteúdo perene; um termo que dobrou em dois
 * dias é matéria para hoje.
 *
 * ## Escolhas de leitura
 *
 * **Linha, não barra.** O trabalho do leitor é ver trajetória, não comparar
 * magnitude entre categorias.
 *
 * **Cinco séries no máximo.** Acima disso as linhas viram um novelo e a cor
 * deixa de identificar. O corte é pelo score do dia mais recente — o painel é
 * sobre o que está em alta agora, não sobre quem já foi grande.
 *
 * **A paleta não é a do site.** O dourado/violeta do HUD é lindo e reprova em
 * daltonismo quando vira cinco linhas sobrepostas (violeta × ciano dá ΔE 5,2 em
 * deuteranopia — indistinguíveis). Esta ordem foi validada contra a superfície
 * real do card (#181a28): pior par adjacente ΔE 8,4. O dourado continua sendo a
 * cor da seção; ele só não carrega dado.
 *
 * **Cor nunca sozinha.** Legenda sempre presente, rótulo direto na ponta de cada
 * linha e tabela como alternativa — quem não distingue as cores lê o mesmo dado.
 */

// Ordem validada com scripts/validate_palette.js contra #181a28 (dark):
// banda de luminosidade, piso de croma, separação CVD, piso de visão normal e
// contraste — todos passam. Não reordenar sem revalidar.
const SERIE_CORES = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"];

const TINTA = { principal: "#f3f1ff", secundaria: "#b9b6cc", apagada: "#8b88a0" };
const GRADE = "#2a2d42";
const SUPERFICIE = "#181a28";

const GRAF = { l: 8, r: 14, t: 14, b: 22, alt: 190 };

function rotuloDia(dia: string) {
  const [, m, d] = dia.split("-");
  return `${d}/${m}`;
}

export function HistoricoTendencia({ corNicho }: { corNicho: string }) {
  const [dado, setDado] = useState<LeituraRadar | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [tabela, setTabela] = useState(false);
  const [dias, setDias] = useState(30);
  const [foco, setFoco] = useState<number | null>(null);

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    fetch(`/api/radar/leitura?dias=${dias}`)
      .then((r) => r.json())
      .then((d: LeituraRadar) => vivo && setDado(d))
      .catch(() => vivo && setDado(null))
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [dias]);

  const temSerie = !!dado && dado.dias.length >= 2 && dado.series.length > 0;

  return (
    <section className="mt-10">
      <h2 className="text-xl tracking-wide" style={{ fontFamily: "var(--font-bebas), sans-serif" }}>
        A LINHA DO <span style={{ color: corNicho }}>TEMPO</span>
      </h2>
      <p className="mb-3 max-w-2xl text-sm text-white/50">
        Quantas pessoas abriram cada verbete de IA na{" "}
        <strong className="text-white/75">Wikipédia em português</strong>, dia a dia. O que
        interessa é a <strong className="text-white/75">inclinação</strong> — tema que sobe
        rápido tem janela curta e rende matéria hoje; linha estável é conteúdo que não perde
        a validade. É <em>leitura</em>, não busca: mede quem foi atrás de entender o assunto.
      </p>

      <div className="glass rounded-2xl p-4">
        {/* filtros numa linha só, acima do gráfico */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-1" role="group" aria-label="Janela de tempo">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDias(d)}
                aria-pressed={dias === d}
                className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  dias === d ? "text-black" : "text-white/55 hover:text-white/80"
                }`}
                style={{ background: dias === d ? corNicho : "rgba(255,255,255,.06)" }}
              >
                {d} dias
              </button>
            ))}
          </div>

          <button
            onClick={() => setTabela((t) => !t)}
            className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-white/55 transition-colors hover:text-white/85"
          >
            {tabela ? <LineChart size={12} /> : <Table2 size={12} />}
            {tabela ? "Ver gráfico" : "Ver tabela"}
          </button>
        </div>

        {carregando ? (
          <Esqueleto />
        ) : !temSerie ? (
          <SerieCurta dado={dado} />
        ) : tabela ? (
          <Tabela dado={dado!} />
        ) : (
          <>
            <Grafico dado={dado!} foco={foco} />
            <Legenda dado={dado!} foco={foco} setFoco={setFoco} />
            <Movimentos series={dado!.series} />
          </>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function Esqueleto() {
  return (
    <div className="animate-pulse" style={{ height: GRAF.alt }}>
      <div className="h-full w-full rounded-xl bg-white/[0.04]" />
    </div>
  );
}

/**
 * O estado honesto de quando ainda não há o que plotar.
 *
 * O histórico começou a ser gravado em 28/07/2026 — antes disso a medição vivia
 * num cache em memória e era descartada. Fingir um gráfico com um ponto só seria
 * pior que dizer a verdade: quem olha precisa saber que a série está enchendo,
 * não que o Radar quebrou.
 */
function SerieCurta({ dado }: { dado: LeituraRadar | null }) {
  const guardados = dado?.dias.length ?? 0;

  return (
    <div className="grid place-items-center px-4 py-10 text-center" style={{ minHeight: GRAF.alt }}>
      <div>
        <Sparkles className="mx-auto mb-3 h-6 w-6" style={{ color: "#c98500" }} />
        <p className="text-sm font-semibold text-white/80">
          {guardados === 0
            ? "A Wikipédia não respondeu agora"
            : `Só ${guardados} ${guardados === 1 ? "dia devolvido" : "dias devolvidos"}`}
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-relaxed text-white/45">
          Esta série vem da API de pageviews da Wikimedia, que é pública e gratuita.
          Quando ela não responde, o painel prefere dizer isso a desenhar uma linha
          no chão — linha zerada e “não medimos” são coisas diferentes.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * A largura real do contêiner, em pixels de tela.
 *
 * Importa mais do que parece: o `viewBox` é montado com este número, então se
 * ele divergir da largura renderizada o SVG inteiro entra em escala e TODO o
 * texto encolhe junto — foi o que aconteceu na primeira versão (viewBox 1118
 * dentro de 690px de caixa: fonte 10 virou 6 na tela, ilegível).
 *
 * Por isso lê do `getBoundingClientRect` a cada evento, e não do `contentRect`
 * da entrada: o `ResizeObserver` sozinho deixou passar um redimensionamento de
 * viewport e o valor ficou preso no antigo.
 */
function usarLargura() {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Largura 0 nunca vira estado: o observador dispara com 0 quando o nó sai
    // do fluxo, e aceitar esse valor derrubaria o gráfico de volta ao vazio.
    const medir = () => {
      const l = el.getBoundingClientRect().width;
      if (l > 0) setLargura(l);
    };
    medir();

    const ro = new ResizeObserver(medir);
    ro.observe(el);
    window.addEventListener("resize", medir);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, []);

  return { ref, largura };
}

function Grafico({ dado, foco }: { dado: LeituraRadar; foco: number | null }) {
  const { ref, largura } = usarLargura();
  const [sobre, setSobre] = useState<number | null>(null);

  const maximo = useMemo(() => {
    const v = dado.series.flatMap((s) => s.pontos.map((p) => p.leituras ?? 0));
    return Math.max(10, Math.ceil(Math.max(...v) / 10) * 10);
  }, [dado]);

  const y = (v: number) => GRAF.t + (1 - v / maximo) * (GRAF.alt - GRAF.t - GRAF.b);

  /**
   * Rótulo direto só quando as pontas se separam.
   *
   * O topo do Radar é quase sempre um pelotão: 36,7 · 36,7 · 35,1 · 34,2… Com
   * scores assim as cinco linhas chegam coladas na direita e os rótulos caem
   * uns sobre os outros — medido, 6 colisões na primeira versão. Empurrar o
   * texto para desempilhar desgruda o rótulo da sua linha e vira ruído, então
   * a saída é recuar: quando não cabe, a legenda e o balão carregam a
   * identidade, que é o papel deles. E a faixa reservada volta para o gráfico,
   * em vez de ficar como margem morta.
   */
  const rotulosCabem = useMemo(() => {
    if (largura <= 560) return false;
    const ys = dado.series
      .map((s) => [...s.pontos].reverse().find((p) => p.leituras !== null)?.leituras)
      .filter((v): v is number => v !== undefined)
      .map(y)
      .sort((a, b) => a - b);
    // 11px é a altura de linha da fonte 10 usada no rótulo
    return ys.every((v, i) => i === 0 || v - ys[i - 1] >= 11);
  }, [dado, largura, maximo]);

  // Sem piso mínimo: qualquer número aqui que não seja a largura medida coloca
  // o SVG em escala e encolhe todo o texto junto. Em tela estreita o gráfico
  // fica apertado — e legível —, que é melhor que grande e borrado.
  const faixaRotulo = rotulosCabem ? 116 : 0;
  const L = largura;
  const interno = L - GRAF.l - GRAF.r - faixaRotulo;

  const n = dado.dias.length;
  const x = (i: number) => GRAF.l + (n === 1 ? interno / 2 : (i / (n - 1)) * interno);

  // Uma linha pode ter buracos (termo sumiu do autocomplete naquele dia). Cada
  // trecho contínuo vira um `path` próprio — interpolar por cima do buraco
  // desenharia um dado que não foi medido.
  function trechos(s: SerieLeitura) {
    const out: string[] = [];
    let atual: string[] = [];
    s.pontos.forEach((p, i) => {
      if (p.leituras === null) {
        if (atual.length > 1) out.push(atual.join(" "));
        atual = [];
        return;
      }
      atual.push(`${atual.length ? "L" : "M"}${x(i).toFixed(1)} ${y(p.leituras).toFixed(1)}`);
    });
    if (atual.length > 1) out.push(atual.join(" "));
    return out;
  }

  const ticks = [0, maximo / 2, maximo];
  const passo = Math.max(1, Math.ceil(n / 6));

  // A caixa medida é SEMPRE o mesmo nó do DOM — o SVG entra e sai por dentro
  // dela. Trocar o nó observado pelo de conteúdo fazia o `ResizeObserver`
  // disparar com 0 na desmontagem, o que zerava a largura e trazia o
  // placeholder de volta: o gráfico piscava em laço.
  //
  // Antes da primeira medição não desenhamos nada: o `viewBox` sairia com uma
  // largura chutada e o SVG entraria em escala por um quadro, com todo o texto
  // encolhido.
  return (
    <div ref={ref} className="relative w-full" style={largura ? undefined : { height: GRAF.alt }}>
      {!largura ? null : (
      <>
      <svg
        width="100%"
        viewBox={`0 0 ${L} ${GRAF.alt}`}
        role="img"
        aria-label={`Leituras diárias na Wikipédia de ${dado.series.length} temas de IA ao longo de ${n} dias`}
        onMouseLeave={() => setSobre(null)}
      >
        {/* grade recessiva, 1px, sólida */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={GRAF.l} x2={GRAF.l + interno} y1={y(t)} y2={y(t)} stroke={GRADE} strokeWidth="1" />
            <text x={GRAF.l} y={y(t) - 4} fontSize="9" fill={TINTA.apagada} style={{ fontVariantNumeric: "tabular-nums" }}>
              {t}
            </text>
          </g>
        ))}

        {/* eixo do tempo */}
        {dado.dias.map((d, i) =>
          i % passo === 0 || i === n - 1 ? (
            <text
              key={d}
              x={x(i)}
              y={GRAF.alt - 6}
              fontSize="9"
              fill={TINTA.apagada}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {rotuloDia(d)}
            </text>
          ) : null
        )}

        {/* crosshair do dia sob o cursor */}
        {sobre !== null && (
          <line
            x1={x(sobre)}
            x2={x(sobre)}
            y1={GRAF.t}
            y2={GRAF.alt - GRAF.b}
            stroke="rgba(255,255,255,.22)"
            strokeWidth="1"
          />
        )}

        {dado.series.map((s, si) => {
          const cor = SERIE_CORES[si];
          const apagar = foco !== null && foco !== si;
          const ultimo = [...s.pontos].reverse().find((p) => p.leituras !== null);
          const iUlt = ultimo ? s.pontos.findIndex((p) => p.dia === ultimo.dia) : -1;

          return (
            <g key={s.rotulo} opacity={apagar ? 0.18 : 1} style={{ transition: "opacity .18s" }}>
              {trechos(s).map((d, i) => (
                <path key={i} d={d} fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              ))}

              {/* ponto do dia sob o cursor, com anel da superfície */}
              {sobre !== null && s.pontos[sobre]?.leituras !== null && (
                <circle cx={x(sobre)} cy={y(s.pontos[sobre].leituras!)} r="4.5" fill={cor} stroke={SUPERFICIE} strokeWidth="2" />
              )}

              {/* ponta + rótulo direto */}
              {iUlt >= 0 && (
                <>
                  <circle cx={x(iUlt)} cy={y(ultimo!.leituras!)} r="4" fill={cor} stroke={SUPERFICIE} strokeWidth="2" />
                  {rotulosCabem && (
                    <text
                      x={x(iUlt) + 9}
                      y={y(ultimo!.leituras!) + 3.5}
                      fontSize="10"
                      fill={TINTA.secundaria}
                      className="capitalize"
                    >
                      {s.rotulo.length > 17 ? `${s.rotulo.slice(0, 16)}…` : s.rotulo}
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}

        {/* faixas de acerto do cursor — bem mais largas que as linhas */}
        {dado.dias.map((d, i) => (
          <rect
            key={d}
            x={x(i) - interno / (n * 2 || 1) - 6}
            y={0}
            width={interno / (n || 1) + 12}
            height={GRAF.alt}
            fill="transparent"
            onMouseEnter={() => setSobre(i)}
          />
        ))}
      </svg>

      {sobre !== null && <Balao dado={dado} i={sobre} x={x(sobre)} largura={L} />}
      </>
      )}
    </div>
  );
}

function Balao({ dado, i, x, largura }: { dado: LeituraRadar; i: number; x: number; largura: number }) {
  const daDireita = x > largura * 0.55;
  const linhas = dado.series
    .map((s, si) => ({ s, si, v: s.pontos[i]?.leituras }))
    .filter((l) => l.v !== null && l.v !== undefined)
    .sort((a, b) => (b.v as number) - (a.v as number));

  return (
    <div
      className="pointer-events-none absolute top-2 z-10 rounded-lg border border-white/10 px-2.5 py-2 text-[11px] shadow-xl"
      style={{
        background: "rgba(12,14,29,.96)",
        [daDireita ? "right" : "left"]: daDireita ? `${largura - x + 10}px` : `${x + 10}px`,
        maxWidth: 210,
      }}
    >
      <p className="mb-1 font-bold" style={{ color: TINTA.apagada }}>
        {rotuloDia(dado.dias[i])}
      </p>
      {linhas.length === 0 ? (
        <p style={{ color: TINTA.apagada }}>sem medição</p>
      ) : (
        linhas.map(({ s, si, v }) => (
          <p key={s.rotulo} className="flex items-center gap-1.5 leading-snug">
            <span className="h-[2px] w-3 shrink-0 rounded-full" style={{ background: SERIE_CORES[si] }} />
            <span className="truncate capitalize" style={{ color: TINTA.secundaria }}>
              {s.rotulo}
            </span>
            <span className="ml-auto font-bold tabular-nums" style={{ color: TINTA.principal }}>
              {v}
            </span>
          </p>
        ))
      )}
    </div>
  );
}

function Legenda({
  dado,
  foco,
  setFoco,
}: {
  dado: LeituraRadar;
  foco: number | null;
  setFoco: (n: number | null) => void;
}) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {dado.series.map((s, i) => (
        <li key={s.rotulo}>
          <button
            onMouseEnter={() => setFoco(i)}
            onMouseLeave={() => setFoco(null)}
            onFocus={() => setFoco(i)}
            onBlur={() => setFoco(null)}
            className="flex cursor-pointer items-center gap-1.5 text-[11px] transition-opacity"
            style={{ opacity: foco !== null && foco !== i ? 0.4 : 1, color: TINTA.secundaria }}
          >
            <span className="h-[3px] w-4 shrink-0 rounded-full" style={{ background: SERIE_CORES[i] }} />
            <span className="capitalize">{s.rotulo}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Os deltas em texto — a leitura que o gráfico sugere, dita em número. */
function Movimentos({ series }: { series: SerieLeitura[] }) {
  return (
    <div className="mt-4 grid gap-1.5 border-t border-white/[0.07] pt-3 sm:grid-cols-2 lg:grid-cols-3">
      {series.map((s, i) => {
        const sobe = s.variacao > 0.5;
        const desce = s.variacao < -0.5;
        const Icone = sobe ? TrendingUp : desce ? TrendingDown : Minus;
        const cor = sobe ? "#0ca30c" : desce ? "#d03b3b" : TINTA.apagada;

        return (
          <div key={s.rotulo} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
            <span className="h-[3px] w-3 shrink-0 rounded-full" style={{ background: SERIE_CORES[i] }} />
            <span className="min-w-0 flex-1 truncate text-[11px] capitalize" style={{ color: TINTA.secundaria }}>
              {s.rotulo}
            </span>
            {/* Percentual, e o sinal explícito: "12" sozinho podia ser lido como
                doze leituras. É variação da última semana contra a anterior. */}
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold tabular-nums" style={{ color: cor }}>
              <Icone size={11} aria-hidden />
              {s.variacao > 0 ? "+" : ""}
              {s.variacao}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** A mesma série sem depender de cor nenhuma. */
function Tabela({ dado }: { dado: LeituraRadar }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <caption className="sr-only">Score de cada termo por dia medido</caption>
        <thead>
          <tr className="border-b border-white/10">
            <th scope="col" className="py-1.5 pr-3 text-left font-bold" style={{ color: TINTA.apagada }}>
              Termo
            </th>
            {dado.dias.map((d) => (
              <th key={d} scope="col" className="px-1.5 py-1.5 text-right font-bold tabular-nums" style={{ color: TINTA.apagada }}>
                {rotuloDia(d)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dado.series.map((s) => (
            <tr key={s.rotulo} className="border-b border-white/[0.05]">
              <th scope="row" className="max-w-[170px] truncate py-1.5 pr-3 text-left font-medium capitalize" style={{ color: TINTA.secundaria }}>
                {s.rotulo}
              </th>
              {s.pontos.map((p) => (
                <td key={p.dia} className="px-1.5 py-1.5 text-right tabular-nums" style={{ color: p.leituras === null ? TINTA.apagada : TINTA.principal }}>
                  {p.leituras ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
