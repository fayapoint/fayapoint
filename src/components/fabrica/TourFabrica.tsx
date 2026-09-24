"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward, X } from "lucide-react";
import "./tour-fabrica.css";

/**
 * O TOUR — a página passa sozinha, no ritmo certo.
 *
 * Rolar à mão estraga as sequências: a pessoa vai rápido demais (o filme vira
 * fotos soltas), ou os quadros ainda não chegaram e a cena anda "quase quadro a
 * quadro". O tour resolve os dois:
 *
 *  1. **Carrega antes de rolar.** Pede a carga inteira da sequência
 *     (`seq:carregar`) e só anda quando `data-feitos` alcança `data-total`.
 *  2. **A sequência anda a 24 quadros por segundo** (`FPS`; o piso é 20, o teto
 *     30). Duração do trecho = quadros ÷ FPS. Velocidade constante, sem ease: o
 *     ease criaria pontas em que o filme anda a 8 fps e lê como engasgo.
 *  3. **Para onde tem o que ler.** Cada frase da sequência (`data-de/ate`) vira
 *     uma parada; o tempo de parada é proporcional ao número de palavras.
 *  4. **Marca o que é para ler** (`foco`): o resto escurece, o pedaço fica claro.
 *  5. **Preço não para.** Passa devagar, com desaceleração, e segue.
 *
 * O tour não usa `scroll-behavior: smooth` (o site força `auto`): escreve
 * `scrollTo` a cada quadro de tela, com um relógio PRÓPRIO que congela na pausa.
 * Qualquer gesto da pessoa (roda, toque, tecla de navegação, barra de rolagem)
 * encerra o tour: ela nunca briga com ele.
 */

const EVENTO = "fabrica:tour";
/** Quadros por segundo das sequências. Entre 20 e 30; 24 é o ritmo de cinema. */
const FPS = 24;
/** Parada de leitura: base + por palavra (≈300 palavras/min, leitura dinâmica), com teto. */
const LEITURA = { base: 1500, porPalavra: 200, min: 2800, max: 9000 };
/** Velocidade da rolagem entre blocos parados, px/s. */
const VELOCIDADE = 520;
/** Velocidade da passagem sem pausa (preço), px/s. */
const VELOCIDADE_PRECO = 130;
const TOPO_LIVRE = 100;

const PARADO = Symbol("tour-parado");

type Modo = "carregando" | "animando" | "lendo" | "seguindo" | "passando";

const ROTULO: Record<Modo, string> = {
  carregando: "Carregando os quadros",
  animando: "Acompanhe a cena",
  lendo: "Hora de ler",
  seguindo: "Seguindo",
  passando: "Passando sem pausa",
};

const FASES = 11;

export function BotaoTour({ compacto = false }: { compacto?: boolean }) {
  const [pronto, setPronto] = useState(false);
  useEffect(() => setPronto(true), []);
  return (
    <button
      type="button"
      className={`fx-tour-btn${compacto ? " fx-tour-btn--nav" : ""}`}
      data-pronto={pronto ? "sim" : "nao"}
      onClick={() => window.dispatchEvent(new Event(EVENTO))}
    >
      <span className="fx-tour-play" aria-hidden="true">
        <Play size={compacto ? 12 : 16} fill="currentColor" />
      </span>
      <span>Fazer tour</span>
    </button>
  );
}

const suave = (u: number) => u * u * (3 - 2 * u);
/** Trapézio: acelera em `a`, cruza em velocidade constante, desacelera em `a`. Distância total = 1. */
const trapezio = (a: number) => (u: number) => {
  const v = 1 / (1 - a);
  if (u < a) return (v * u * u) / (2 * a);
  if (u > 1 - a) return 1 - (v * (1 - u) * (1 - u)) / (2 * a);
  return v * (a / 2 + (u - a));
};
const linear = (u: number) => u;

const topoAbs = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
const yDaSequencia = (el: HTMLElement, p: number) => topoAbs(el) + p * Math.max(1, el.offsetHeight - window.innerHeight);
const palavras = (el: Element) => ((el as HTMLElement).innerText || el.textContent || "").trim().split(/\s+/).filter(Boolean).length;
const tempoDeLeitura = (el: Element) =>
  Math.min(LEITURA.max, Math.max(LEITURA.min, LEITURA.base + palavras(el) * LEITURA.porPalavra));

export function TourFabrica() {
  const cartaoRef = useRef<HTMLDivElement>(null);
  const focoRef = useRef<HTMLDivElement>(null);
  const barraRef = useRef<HTMLSpanElement>(null);
  const [ativo, setAtivo] = useState(false);
  const [fim, setFim] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [fase, setFase] = useState({ n: 0, titulo: "", dica: "" });
  const [modo, setModo] = useState<Modo>("carregando");
  const [carga, setCarga] = useState(0);
  const controle = useRef<{ pausar: () => void; pular: () => void; sair: () => void; refazer: () => void } | null>(null);

  useEffect(() => {
    let executando = false;

    const iniciar = () => {
      if (executando) return;
      executando = true;

      // ── estado do motor ──────────────────────────────────────────────
      let parar = false;
      let pausa = false;
      let pularAgora = false;
      let tempo = 0;
      let ultimoY = window.scrollY;
      let gestosLiberadosEm = performance.now() + 1500;
      let focoEl: Element | null = null;
      let focoVisivel = false;
      let raf = 0;
      let ultimo = performance.now();
      const ticks = new Set<() => void>();

      const foco = focoRef.current;
      const paraFoco = () => {
        if (!foco) return;
        if (!focoEl) {
          foco.style.opacity = "0";
          focoVisivel = false;
          return;
        }
        const r = focoEl.getBoundingClientRect();
        const pad = 14;
        const top = Math.max(TOPO_LIVRE - 20, r.top - pad);
        const bottom = Math.min(window.innerHeight - 8, r.bottom + pad);
        const left = Math.max(8, r.left - pad);
        const right = Math.min(window.innerWidth - 8, r.right + pad);
        if (!focoVisivel) foco.style.transition = "none";
        foco.style.transform = `translate3d(${left}px, ${top}px, 0)`;
        foco.style.width = `${Math.max(0, right - left)}px`;
        foco.style.height = `${Math.max(0, bottom - top)}px`;
        if (!focoVisivel) {
          void foco.offsetWidth; // aplica sem animar da posição antiga
          foco.style.transition = "";
          foco.style.opacity = "1";
          focoVisivel = true;
        }
      };

      const laco = (agora: number) => {
        const dt = Math.min(64, agora - ultimo);
        ultimo = agora;
        if (!pausa) tempo += dt;
        for (const t of Array.from(ticks)) t();
        paraFoco();
        raf = requestAnimationFrame(laco);
      };

      const sair = () => {
        if (parar) return;
        parar = true;
        cancelAnimationFrame(raf);
        removerOuvintes();
        focoEl = null;
        paraFoco();
        executando = false;
        setAtivo(false);
        setFim(false);
        setPausado(false);
      };

      // ── primitivas ───────────────────────────────────────────────────
      /** Roda `fn(u)` por `ms` do relógio do tour (que congela na pausa). */
      const animar = (ms: number, fn: (u: number) => void) =>
        new Promise<void>((resolve, reject) => {
          const t0 = tempo;
          const tick = () => {
            if (parar) {
              ticks.delete(tick);
              return reject(PARADO);
            }
            const fim = pularAgora || tempo - t0 >= ms;
            if (pularAgora) pularAgora = false;
            fn(fim ? 1 : (tempo - t0) / ms);
            if (fim) {
              ticks.delete(tick);
              resolve();
            }
          };
          ticks.add(tick);
        });

      const esperar = (ms: number) => animar(ms, () => {});
      const barra = (u: number) => {
        if (barraRef.current) barraRef.current.style.transform = `scaleX(${u})`;
      };
      const estado = (m: Modo) => {
        setModo(m);
        barra(0);
      };

      const ir = (y: number) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const alvo = Math.max(0, Math.min(max, y));
        // Se a página não está onde o tour a deixou, a pessoa mexeu (barra de rolagem).
        if (Math.abs(window.scrollY - ultimoY) > 100) return sair();
        window.scrollTo({ top: alvo, behavior: "instant" as ScrollBehavior });
        ultimoY = alvo;
      };

      /** Rola de onde está até `yFn()`, com o perfil de velocidade dado. */
      const rolar = (yFn: () => number, ms: number, perfil: (u: number) => number) => {
        const y0 = window.scrollY;
        ultimoY = y0;
        return animar(ms, (u) => ir(y0 + (yFn() - y0) * perfil(u)));
      };
      const rolarAte = async (yFn: () => number, perfil = trapezio(0.3)) => {
        const dist = Math.abs(yFn() - window.scrollY);
        if (dist < 4) return;
        await rolar(yFn, Math.min(4200, Math.max(1000, (dist / VELOCIDADE) * 1000)), dist < 300 ? suave : perfil);
      };

      const visivel = (el: Element) => {
        const r = el.getBoundingClientRect();
        return r.top >= TOPO_LIVRE - 4 && r.bottom <= window.innerHeight - 20;
      };
      const alinhar = async (el: Element) => {
        // Dentro de um palco preso (sequência, mesa) a frase já está na tela: rolar mexeria no filme.
        if (el.closest(".seq-palco, .fx-mesa-palco") || visivel(el)) return;
        const h = el.getBoundingClientRect().height;
        const folga = window.innerHeight - TOPO_LIVRE - 24;
        const topoDesejado = h >= folga ? TOPO_LIVRE : TOPO_LIVRE + (folga - h) / 2;
        await rolarAte(() => topoAbs(el) - topoDesejado);
      };

      /** Para, marca `alvo` e dá o tempo de leitura. */
      const ler = async (alvo: string | Element | null, ms?: number) => {
        const el = typeof alvo === "string" ? document.querySelector(alvo) : alvo;
        if (!el) return;
        estado("seguindo");
        await alinhar(el);
        await esperar(350);
        focoEl = el;
        estado("lendo");
        await animar(ms ?? tempoDeLeitura(el), barra);
        focoEl = null;
        await esperar(180);
      };

      const sequenciaPronta = (sec: HTMLElement) => !sec.dataset.total || Number(sec.dataset.feitos) >= Number(sec.dataset.total);
      const pedirCarga = (sec: HTMLElement) => sec.dispatchEvent(new Event("seq:carregar"));
      const aguardarCarga = async (sec: HTMLElement, mostrar = true) => {
        if (sequenciaPronta(sec)) return;
        pedirCarga(sec);
        if (mostrar) setModo("carregando");
        const limite = performance.now() + 40000;
        while (!parar && !sequenciaPronta(sec) && performance.now() < limite) {
          setCarga(Math.round((Number(sec.dataset.feitos) / Number(sec.dataset.total)) * 100));
          await new Promise((r) => setTimeout(r, 120));
        }
        if (parar) throw PARADO;
      };

      /** O filme anda de `p0` a `p1` a `FPS` quadros por segundo, velocidade constante. */
      const tocar = async (sec: HTMLElement, p0: number, p1: number) => {
        if (p1 - p0 < 0.002) return;
        await aguardarCarga(sec);
        const quadros = Number(sec.dataset.quadros) || 144;
        estado("animando");
        const ms = ((p1 - p0) * (quadros - 1) * 1000) / FPS;
        await rolar(() => yDaSequencia(sec, p1), ms, linear);
      };

      /** Anda pela sequência inteira parando em cada frase. */
      const percorrer = async (sec: HTMLElement) => {
        const frases = Array.from(sec.querySelectorAll<HTMLElement>('[data-batida]:not([data-camada="atras"])'));
        let p = 0;
        await aguardarCarga(sec);
        estado("seguindo");
        await rolarAte(() => yDaSequencia(sec, 0));
        for (const f of frases) {
          const de = Number(f.dataset.de);
          const ate = Number(f.dataset.ate);
          const parada = de <= 0 ? 0 : ate >= 1 ? 1 : de + (ate - de) * 0.4;
          await tocar(sec, p, Math.max(p, parada));
          p = Math.max(p, parada);
          await ler(f.querySelector(".fx-batida") ?? f);
        }
        await tocar(sec, p, 1);
      };

      const nova = (n: number, titulo: string, dica: string) => {
        setFase({ n, titulo, dica });
        setFim(false);
      };

      // ── o roteiro ────────────────────────────────────────────────────
      const roteiro = async () => {
        const sec = (id: string) => document.getElementById(id) as HTMLElement;
        const ab = sec("abertura");
        const gi = sec("giro");
        const fe = sec("fechamento");
        const mesa = document.querySelector<HTMLElement>("#entregas .fx-mesa");
        const mesaAnimada = !!mesa && !window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 900px)").matches;

        nova(1, "A pasta abre", "Um estúdio inteiro se monta em volta da pasta. A cena roda em ritmo de filme.");
        await percorrer(ab);

        nova(2, "Dê a volta", "A câmera gira em torno do estúdio pronto, com o tempo parado.");
        estado("seguindo");
        await rolarAte(() => yDaSequencia(gi, 0), trapezio(0.25));
        await percorrer(gi);

        nova(3, "Por dentro", "Cada objeto do estúdio é uma parte da sua empresa funcionando.");
        await ler("#por-dentro .fx-giro-cabeca");
        await ler("#por-dentro .fx-giro-palco", 5200);

        nova(4, "A sua empresa", "Aqui você monta a fábrica da sua empresa, do seu jeito.");
        await ler("#sua-empresa .fx-monte-cabeca");

        nova(5, "A prova", "Não é um curso sobre automação: é a operação que escreveu esta página.");
        await ler(".fx-proof");

        nova(6, "Peças reais", "O que a fábrica produziu de verdade — nada de maquete.");
        if (mesa && mesaAnimada) {
          const yMesa = (p: number) => yDaSequencia(mesa, p);
          await rolarAte(() => yMesa(0));
          await ler(mesa.querySelector(".fx-mesa-texto h2"), 3000);
          for (const [i, ate] of [0.36, 0.64, 0.9].entries()) {
            const de = i === 0 ? 0 : [0.36, 0.64][i - 1];
            estado("animando");
            const y0 = window.scrollY;
            ultimoY = y0;
            await animar(2800, (u) => ir(y0 + (yMesa(de + (ate - de) * suave(u)) - y0)));
            await ler(mesa.querySelector(`[data-da-fase="${i + 1}"]`), 5200);
          }
        } else {
          for (const i of [1, 2, 3]) await ler(document.querySelector(`#entregas [data-da-fase="${i}"]`), 4200);
        }

        nova(7, "Um dia da máquina", "Cada etapa tem hora marcada. Quando algo precisa de você, ele espera na mesa.");
        await ler("#rotina .fx-day-copy");
        await ler("#rotina .fx-timeline", 9000);

        nova(8, "Um acordo claro", "Vendemos a operação, nunca o resultado. Está antes do preço de propósito.");
        await ler("#rotina ~ .fx-principle .fx-principle-inner > div:first-child");
        await ler("#rotina ~ .fx-principle .fx-principle-inner > div:last-child", 9000);

        nova(9, "Investimento", "As três formas de entrar, passando sem pausa — volte quando quiser.");
        const preco = document.querySelector<HTMLElement>("#faixas .fx-section-head");
        const fimPreco = document.querySelector<HTMLElement>("#faixas .fx-cost-summary");
        if (preco && fimPreco) {
          estado("seguindo");
          await rolarAte(() => topoAbs(preco) - TOPO_LIVRE);
          estado("passando");
          const y0 = window.scrollY;
          ultimoY = y0;
          const yFim = () => topoAbs(fimPreco) + fimPreco.offsetHeight - window.innerHeight + 40;
          const perfil = trapezio(0.12);
          await animar((Math.abs(yFim() - y0) / VELOCIDADE_PRECO) * 1000, (u) => ir(y0 + (yFim() - y0) * perfil(u)));
        }

        nova(10, "Engenharia que já existe", "Números contados no kit, e os três passos para começar.");
        await ler("#faixas ~ .fx-inventory .fx-inventory-grid", 5200);
        await ler(".fx-start .fx-start-grid");

        nova(11, "Fechamento", "Tudo isso cabe numa pasta.");
        await percorrer(fe);

        setFim(true);
        setModo("seguindo");
        barra(0);
      };

      // ── gestos da pessoa ─────────────────────────────────────────────
      const aoGesto = () => {
        if (performance.now() > gestosLiberadosEm) sair();
      };
      const aoTecla = (e: KeyboardEvent) => {
        if (e.key === "Escape") return sair();
        if (e.key === " " && !(e.target instanceof HTMLButtonElement)) {
          e.preventDefault();
          return alternarPausa();
        }
        if (e.key === "ArrowRight") return void (pularAgora = true);
        if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) aoGesto();
      };
      const alternarPausa = () => {
        pausa = !pausa;
        setPausado(pausa);
      };
      const removerOuvintes = () => {
        window.removeEventListener("wheel", aoGesto);
        window.removeEventListener("touchmove", aoGesto);
        window.removeEventListener("keydown", aoTecla);
      };
      window.addEventListener("wheel", aoGesto, { passive: true });
      window.addEventListener("touchmove", aoGesto, { passive: true });
      window.addEventListener("keydown", aoTecla);

      controle.current = {
        pausar: alternarPausa,
        pular: () => void (pularAgora = true),
        sair,
        refazer: () => {
          sair();
          window.setTimeout(() => window.dispatchEvent(new Event(EVENTO)), 60);
        },
      };

      // ── partida: carrega a abertura, depois solta as outras em segundo plano ──
      setAtivo(true);
      setFim(false);
      setPausado(false);
      setModo("carregando");
      setCarga(0);
      setFase({ n: 0, titulo: "Preparando o tour", dica: "Carregando os quadros para a cena andar sem engasgo." });
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      ultimoY = 0;
      raf = requestAnimationFrame(laco);

      void (async () => {
        try {
          const ab = document.getElementById("abertura") as HTMLElement | null;
          if (!ab) throw PARADO;
          await aguardarCarga(ab);
          for (const id of ["giro", "fechamento"]) {
            const s = document.getElementById(id) as HTMLElement | null;
            if (s) pedirCarga(s);
          }
          gestosLiberadosEm = performance.now() + 1200;
          await roteiro();
        } catch (e) {
          if (e !== PARADO) console.error("[tour]", e);
          if (e !== PARADO) sair();
        }
      })();
    };

    window.addEventListener(EVENTO, iniciar);
    return () => {
      window.removeEventListener(EVENTO, iniciar);
      controle.current?.sair();
    };
  }, []);

  const preparando = fase.n === 0;
  return (
    <>
      <div ref={focoRef} className="fx-tour-foco" aria-hidden="true" />
      {ativo && (
      <div ref={cartaoRef} className="fx-tour-cartao" role="region" aria-label="Tour da fábrica" data-fim={fim ? "sim" : "nao"}>
        <div className="fx-tour-texto" aria-live="polite">
          <p className="fx-tour-kicker">
            {fim ? "Fim do tour" : preparando ? "Tour" : `Tour · ${fase.n} de ${FASES}`}
            {!fim && <span> · {modo === "carregando" ? `${ROTULO[modo]} ${carga}%` : pausado ? "Em pausa" : ROTULO[modo]}</span>}
          </p>
          <p className="fx-tour-titulo">{fim ? "Era isso. Agora é com você." : fase.titulo}</p>
          <p className="fx-tour-dica">{fim ? "Role de volta para rever qualquer parte, ou refaça o tour." : fase.dica}</p>
        </div>
        <div className="fx-tour-controles">
          {fim ? (
            <button type="button" onClick={() => controle.current?.refazer()} aria-label="Refazer o tour">
              <RotateCcw size={16} aria-hidden="true" />
            </button>
          ) : (
            <>
              <button type="button" onClick={() => controle.current?.pausar()} aria-label={pausado ? "Continuar o tour" : "Pausar o tour"}>
                {pausado ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
              </button>
              <button type="button" onClick={() => controle.current?.pular()} aria-label="Pular este trecho">
                <SkipForward size={16} aria-hidden="true" />
              </button>
            </>
          )}
          <button type="button" onClick={() => controle.current?.sair()} aria-label="Sair do tour">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <span className="fx-tour-fase" style={{ transform: `scaleX(${fim ? 1 : Math.max(0, fase.n - 1) / FASES})` }} />
        {!fim && (
          <span className="fx-tour-leitura">
            <span ref={barraRef} data-modo={modo} />
          </span>
        )}
      </div>
      )}
    </>
  );
}
