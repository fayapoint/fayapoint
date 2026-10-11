"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, PointerEvent as PonteiroReact } from "react";
import { createPortal, flushSync } from "react-dom";
import { ArrowDown, Check, ChevronLeft, ChevronRight, Copy, Heart, Link2, Search, Shuffle, X } from "lucide-react";
import { montarPrompt, type Estilo } from "@/lib/estilos";

/**
 * O Atlas de Estilos, do lado do navegador.
 *
 * ## O que o visitante faz, em ordem
 *
 * 1. Escreve o assunto UMA vez, no topo. Todo prompt da página passa a sair com
 *    ele na frente.
 * 2. Copia. O botão dourado de cada cartão resolve sem abrir nada.
 * 3. Se quiser olhar de perto, o cartão abre a ficha: a imagem cresce do lugar
 *    onde estava (View Transitions), e o prompt aparece inteiro.
 *
 * ## Copiar é curtir
 *
 * A cópia dispara o coração (o gesto do Instagram) e soma um no contador do
 * estilo. Só a PRIMEIRA cópia de cada estilo neste navegador conta — a lista
 * mora em `localStorage`. O número é de verdade e começa em zero; ver
 * `api/estilos/route.ts`.
 *
 * ⚠️ O cartão é `memo` e recebe funções estáveis de propósito: sem isso, cada
 * tecla no campo de assunto redesenharia os 182 cartões.
 */

type Origem = "g" | "t";
type Props = { estilos: Estilo[]; familias: [string, string][]; modelo: string };

const CHAVE = "atlas:copiados";
const limpo = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const curto = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",")} mil` : String(n));
const foto = (id: string, pequena = false) => `/estilos/${pequena ? "p/" : ""}${id}.webp`;

function inclinar(ev: PonteiroReact<HTMLElement>) {
  if (ev.pointerType !== "mouse") return;
  const el = ev.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (ev.clientX - r.left) / r.width;
  const y = (ev.clientY - r.top) / r.height;
  el.style.setProperty("--rx", `${(0.5 - y) * 7}deg`);
  el.style.setProperty("--ry", `${(x - 0.5) * 9}deg`);
  el.style.setProperty("--mx", `${x * 100}%`);
  el.style.setProperty("--my", `${y * 100}%`);
}
function soltar(ev: PonteiroReact<HTMLElement>) {
  ev.currentTarget.style.removeProperty("--rx");
  ev.currentTarget.style.removeProperty("--ry");
}

const Cartao = memo(function Cartao({
  e, familia, n, meu, pulso, vt, origem, posto, onAbrir, onCopiar,
}: {
  e: Estilo;
  familia: string;
  n: number;
  meu: boolean;
  /** 0 = parado; outro valor = acabou de ser copiado (serve de `key` do coração). */
  pulso: number;
  vt: boolean;
  origem: Origem;
  posto?: number;
  onAbrir: (id: string, origem: Origem) => void;
  onCopiar: (id: string) => void;
}) {
  return (
    <article className={`atlas-card${posto ? " no-trilho" : ""}`} onPointerMove={inclinar} onPointerLeave={soltar}>
      <button type="button" className="atlas-card-abrir" onClick={() => onAbrir(e.id, origem)} aria-label={`Abrir o estilo ${e.n}`}>
        <img
          src={foto(e.id)}
          srcSet={`${foto(e.id, true)} 320w, ${foto(e.id)} 800w`}
          sizes={posto ? "270px" : "(min-width:1400px) 19vw, (min-width:1000px) 24vw, (min-width:700px) 32vw, 48vw"}
          alt={`Exemplo do estilo ${e.n}`}
          width={800}
          height={1000}
          loading="lazy"
          decoding="async"
          className={e.mov ? `atlas-mov-${e.mov}` : undefined}
          data-vt={vt ? "1" : undefined}
        />
        <span className="atlas-card-pe">
          <span className="atlas-card-fam">{familia}</span>
          <span className="atlas-card-nome">{e.n}</span>
        </span>
      </button>
      {posto ? <span className={`atlas-posto${posto <= 3 ? " podio" : ""}`} aria-hidden="true">{posto}</span> : null}
      <span className={`atlas-like${meu ? " meu" : ""}`} aria-label={n ? `${n} ${n === 1 ? "cópia" : "cópias"}` : "Ainda sem cópias"}>
        <Heart size={15} fill={meu ? "currentColor" : "none"} aria-hidden="true" />
        {n > 0 ? <b>{curto(n)}</b> : null}
      </span>
      <button type="button" className={`atlas-copiar${pulso ? " feito" : ""}`} onClick={() => onCopiar(e.id)} aria-label={`Copiar o prompt de ${e.n}`}>
        {pulso ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
        <span>{pulso ? "Copiado" : "Copiar"}</span>
      </button>
      {pulso ? (
        <span key={pulso} className="atlas-coracao" aria-hidden="true">
          <Heart size={84} fill="currentColor" strokeWidth={0} />
        </span>
      ) : null}
    </article>
  );
});

export function AtlasEstilos({ estilos, familias, modelo }: Props) {
  const [assunto, setAssunto] = useState("");
  const [busca, setBusca] = useState("");
  const [familia, setFamilia] = useState("todos");
  const [semLetras, setSemLetras] = useState(false);
  const [usos, setUsos] = useState<Record<string, number>>({});
  const [meus, setMeus] = useState<Set<string>>(() => new Set());
  const [aberto, setAberto] = useState<string | null>(null);
  /** Quem carrega o nome da transição: "g:<id>" (grade) ou "t:<id>" (trilho). */
  const [foco, setFoco] = useState<string | null>(null);
  const [pulso, setPulso] = useState<{ id: string; k: number } | null>(null);
  const [aviso, setAviso] = useState("");

  const gradeRef = useRef<HTMLElement>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);
  const voltaRef = useRef<HTMLElement | null>(null);

  const nomeFam = useMemo(() => Object.fromEntries(familias) as Record<string, string>, [familias]);
  const porId = useMemo(() => new Map(estilos.map((e) => [e.id, e])), [estilos]);
  const indice = useMemo(
    () => new Map(estilos.map((e) => [e.id, limpo(`${e.n} ${nomeFam[e.f]} ${e.d} ${e.al ?? ""} ${e.p}`)])),
    [estilos, nomeFam],
  );
  const contagem = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of estilos) c[e.f] = (c[e.f] ?? 0) + 1;
    return c;
  }, [estilos]);

  // Os números de verdade. Sem resposta, a galeria segue sem contador.
  useEffect(() => {
    let vivo = true;
    fetch("/api/estilos")
      .then((r) => r.json())
      .then((j: { usos?: Record<string, number> }) => {
        if (!vivo || !j.usos) return;
        setUsos((local) => {
          const junto = { ...j.usos };
          for (const [id, n] of Object.entries(local)) junto[id] = Math.max(junto[id] ?? 0, n);
          return junto;
        });
      })
      .catch(() => {});
    try {
      const guardado = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
      if (Array.isArray(guardado)) setMeus(new Set(guardado.filter((v) => typeof v === "string")));
    } catch {
      /* navegação privada: a página funciona, só não lembra o que foi copiado */
    }
    // Link direto para um estilo (`/estilos#estudio-ghibli`), na chegada e ao trocar a âncora.
    const pelaAncora = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (h && porId.has(h)) {
        setFoco(`g:${h}`);
        setAberto(h);
      }
    };
    pelaAncora();
    window.addEventListener("hashchange", pelaAncora);
    return () => {
      vivo = false;
      window.removeEventListener("hashchange", pelaAncora);
    };
  }, [porId]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 2800);
    return () => clearTimeout(t);
  }, [aviso]);

  useEffect(() => {
    if (!pulso) return;
    const t = setTimeout(() => setPulso(null), 1500);
    return () => clearTimeout(t);
  }, [pulso]);

  /** "Todos" intercala as famílias: 26 fotografias seguidas esconderiam a variedade, que é o que a página mostra. */
  const misturados = useMemo(() => {
    const filas = familias.map(([k]) => estilos.filter((e) => e.f === k));
    const saida: Estilo[] = [];
    for (let i = 0; i < estilos.length; i++) for (const fila of filas) if (fila[i]) saida.push(fila[i]);
    return saida;
  }, [estilos, familias]);

  const visiveis = useMemo(() => {
    const q = limpo(busca.trim());
    return (familia === "todos" ? misturados : estilos).filter(
      (e) => (familia === "todos" || e.f === familia) && (!q || indice.get(e.id)!.includes(q)),
    );
  }, [estilos, misturados, familia, busca, indice]);

  const total = useMemo(() => Object.values(usos).reduce((s, n) => s + n, 0), [usos]);
  const ranking = useMemo(
    () => [...estilos].sort((a, b) => (usos[b.id] ?? 0) - (usos[a.id] ?? 0) || (a.top ?? 99) - (b.top ?? 99)).slice(0, 10),
    [estilos, usos],
  );
  /** Só vira "mais copiados" quando há cópia de verdade em pelo menos três. */
  const temRanking = ranking.filter((e) => (usos[e.id] ?? 0) > 0).length >= 3;

  const parede = useMemo(() => {
    const escolhidos = estilos.filter((e, i) => i % 6 === 2 && !e.mov).slice(0, 30);
    return [0, 1, 2, 3, 4].map((c) => escolhidos.filter((_, i) => i % 5 === c));
  }, [estilos]);

  const copiar = async (e: Estilo) => {
    const texto = montarPrompt(e, assunto, semLetras);
    let ok = false;
    try {
      await navigator.clipboard.writeText(texto);
      ok = true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = texto;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      ta.remove();
    }
    if (!ok) {
      setAviso("O navegador bloqueou a cópia. Abra o estilo e selecione o texto do prompt.");
      return;
    }
    setPulso({ id: e.id, k: Date.now() });
    setAviso(assunto.trim() ? `Copiado: ${e.n}. É só colar no seu gerador.` : `Copiado: ${e.n}. Cole depois do seu assunto.`);
    if (meus.has(e.id)) return;
    const novo = new Set(meus).add(e.id);
    setMeus(novo);
    setUsos((u) => ({ ...u, [e.id]: (u[e.id] ?? 0) + 1 }));
    try {
      localStorage.setItem(CHAVE, JSON.stringify([...novo]));
    } catch {
      /* sem armazenamento: a cópia já foi feita, só não fica lembrada */
    }
    fetch("/api/estilos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: e.id }),
      keepalive: true,
    }).catch(() => {});
  };

  /** Troca de estado com a imagem viajando do cartão para a ficha, onde o navegador souber. */
  const transicao = (muda: () => void) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    // Aba em segundo plano não desenha quadro: a transição seguraria a ficha
    // fechada até a aba voltar. Animação é enfeite, nunca portão.
    if (doc.startViewTransition && document.visibilityState === "visible" && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doc.startViewTransition(() => flushSync(muda));
    } else muda();
  };
  const abrir = (id: string, origem: Origem) => {
    voltaRef.current = document.activeElement as HTMLElement | null;
    flushSync(() => setFoco(`${origem}:${id}`));
    transicao(() => setAberto(id));
  };
  const fechar = () => transicao(() => setAberto(null));
  const sortear = () => {
    const e = visiveis[Math.floor(Math.random() * visiveis.length)] ?? estilos[0];
    abrir(e.id, "g");
  };
  const vizinho = (passo: number) => {
    if (!aberto) return;
    const fila = visiveis.some((e) => e.id === aberto) ? visiveis : estilos;
    const i = fila.findIndex((e) => e.id === aberto);
    const prox = fila[(i + passo + fila.length) % fila.length];
    setFoco(`g:${prox.id}`);
    setAberto(prox.id);
  };

  // O cartão é `memo`: ele recebe estas duas funções, que nunca mudam de
  // identidade e sempre chamam a versão mais nova das de cima.
  const atual = useRef({ copiar, abrir, fechar, vizinho });
  atual.current = { copiar, abrir, fechar, vizinho };
  const aoCopiar = useCallback((id: string) => {
    const e = porId.get(id);
    if (e) void atual.current.copiar(e);
  }, [porId]);
  const aoAbrir = useCallback((id: string, origem: Origem) => atual.current.abrir(id, origem), []);

  // Ficha aberta: teclado, rolagem do fundo travada, foco no fechar, endereço com âncora.
  const montado = useRef(false);
  useEffect(() => {
    if (montado.current) history.replaceState(history.state, "", aberto ? `#${aberto}` : location.pathname + location.search);
    montado.current = true;
    if (!aberto) return;
    const tecla = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") atual.current.fechar();
      else if (ev.key === "ArrowRight") atual.current.vizinho(1);
      else if (ev.key === "ArrowLeft") atual.current.vizinho(-1);
    };
    const antes = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", tecla);
    fecharRef.current?.focus();
    return () => {
      document.documentElement.style.overflow = antes;
      window.removeEventListener("keydown", tecla);
    };
  }, [aberto]);
  useEffect(() => {
    if (!aberto) voltaRef.current?.focus?.();
  }, [aberto]);

  const irParaGrade = (ev: FormEvent) => {
    ev.preventDefault();
    gradeRef.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}#${aberto}`);
      setAviso("Link deste estilo copiado.");
    } catch {
      setAviso("O navegador bloqueou a cópia do link.");
    }
  };

  const sel = aberto ? porId.get(aberto) ?? null : null;
  const assuntoLimpo = assunto.trim().replace(/[.,;\s]+$/, "");
  const promptSel = sel ? montarPrompt(sel, assunto, semLetras) : "";
  const pulsoDe = (id: string) => (pulso?.id === id ? pulso.k : 0);

  return (
    <div className="atlas">
      <header className="atlas-topo">
        <div className="atlas-parede" aria-hidden="true">
          <div className="atlas-parede-plano">
            {parede.map((coluna, c) => (
              <div className="atlas-col" key={c}>
                {[...coluna, ...coluna].map((e, i) => (
                  <img key={`${e.id}-${i}`} src={foto(e.id, true)} alt="" width={320} height={400} decoding="async" />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="atlas-env">
          <div className="atlas-topo-txt">
            <p className="atlas-rotulo">Atlas de estilos · biblioteca aberta</p>
            <h1 className="atlas-titulo">
              O mesmo pedido, <span>{estilos.length} olhares</span>
            </h1>
            <p className="atlas-lead">
              Diga o que você quer criar. Cada estilo devolve o prompt pronto para colar no seu gerador de imagem, com um
              exemplo real ao lado.
            </p>
            <form className="atlas-pedido" onSubmit={irParaGrade}>
              <label htmlFor="atlas-assunto">O que você quer criar?</label>
              <div className="atlas-pedido-linha">
                <input
                  id="atlas-assunto"
                  type="text"
                  autoComplete="off"
                  value={assunto}
                  onChange={(ev) => setAssunto(ev.target.value)}
                  placeholder="uma médica lendo um exame no corredor do hospital"
                />
                <button type="submit">
                  Ver nos estilos <ArrowDown size={18} aria-hidden="true" />
                </button>
              </div>
            </form>
            <label className="atlas-chave">
              <input type="checkbox" checked={semLetras} onChange={(ev) => setSemLetras(ev.target.checked)} />
              <span>Proibir letras na imagem</span>
            </label>
            <ul className="atlas-fatos">
              <li><b>{estilos.length}</b> estilos</li>
              <li>exemplos gerados com <b>{modelo}</b></li>
              <li>{total > 0 ? <><b>{curto(total)}</b> {total === 1 ? "cópia" : "cópias"} até agora</> : "contador zerado: a primeira cópia pode ser a sua"}</li>
            </ul>
          </div>
        </div>
      </header>

      <section className="atlas-sec atlas-env" aria-labelledby="atlas-frente">
        <div className="atlas-sec-cab">
          <div>
            <p className="atlas-rotulo rosa">A frente da galeria</p>
            <h2 className="atlas-h2" id="atlas-frente">
              {temRanking ? <>Mais <span>copiados</span></> : <>Para <span>começar</span></>}
            </h2>
            <p className="atlas-sub">
              {temRanking
                ? "Os dez estilos que mais gente levou. A ordem muda sozinha conforme as cópias chegam."
                : "Dez escolhas da casa. Assim que as cópias chegarem, quem manda nesta fila é quem usa."}
            </p>
          </div>
        </div>
        <div className="atlas-trilho">
          {ranking.map((e, i) => (
            <Cartao
              key={e.id}
              e={e}
              familia={nomeFam[e.f]}
              n={usos[e.id] ?? 0}
              meu={meus.has(e.id)}
              pulso={pulsoDe(e.id)}
              vt={foco === `t:${e.id}` && !aberto}
              origem="t"
              posto={i + 1}
              onAbrir={aoAbrir}
              onCopiar={aoCopiar}
            />
          ))}
        </div>
      </section>

      <section className="atlas-sec atlas-env" ref={gradeRef} id="atlas-grade" aria-labelledby="atlas-todos">
        <div className="atlas-sec-cab">
          <div>
            <p className="atlas-rotulo">O atlas inteiro</p>
            <h2 className="atlas-h2 arco" id="atlas-todos">
              Todos os <span>estilos</span>
            </h2>
          </div>
          <p className="atlas-conta" aria-live="polite">
            {visiveis.length} {visiveis.length === 1 ? "estilo" : "estilos"}
            {familia === "todos" ? "" : ` em ${nomeFam[familia]}`}
          </p>
        </div>

        <div className="atlas-barra">
          <div className="atlas-busca-linha">
            <label className="atlas-busca">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={busca}
                onChange={(ev) => setBusca(ev.target.value)}
                placeholder="Buscar: ghibli, noir, aquarela…"
                aria-label="Buscar estilo"
              />
            </label>
            <button type="button" className="atlas-sortear" onClick={sortear} disabled={!visiveis.length}>
              <Shuffle size={17} aria-hidden="true" /> Sortear
            </button>
          </div>
          <div className="atlas-fams" role="group" aria-label="Famílias de estilo">
            <button type="button" aria-pressed={familia === "todos"} onClick={() => setFamilia("todos")}>
              Todos <i>{estilos.length}</i>
            </button>
            {familias.map(([k, nome]) => (
              <button type="button" key={k} aria-pressed={familia === k} onClick={() => setFamilia(k)}>
                {nome} <i>{contagem[k] ?? 0}</i>
              </button>
            ))}
          </div>
        </div>

        {visiveis.length ? (
          <div className="atlas-grade">
            {visiveis.map((e) => (
              <Cartao
                key={e.id}
                e={e}
                familia={nomeFam[e.f]}
                n={usos[e.id] ?? 0}
                meu={meus.has(e.id)}
                pulso={pulsoDe(e.id)}
                vt={foco === `g:${e.id}` && !aberto}
                origem="g"
                onAbrir={aoAbrir}
                onCopiar={aoCopiar}
              />
            ))}
          </div>
        ) : (
          <p className="atlas-vazio">
            Nenhum estilo com «{busca.trim()}». Tente «anime», «foto» ou «3D».{" "}
            <button type="button" onClick={() => { setBusca(""); setFamilia("todos"); }}>
              Limpar a busca
            </button>
          </p>
        )}

        <footer className="atlas-nota">
          <p>Cada exemplo saiu do mesmo prompt que você copia, no {modelo}, rodando na GPU da FayAI.</p>
          <p>O número ao lado do coração é quantas pessoas copiaram o estilo. Ele começa em zero e só conta uma vez por navegador.</p>
          <p>Os prompts estão em inglês, a língua que os geradores leem melhor. O seu assunto pode ir em português.</p>
        </footer>
      </section>

      {/* Ficha e aviso saem para o <body>: dentro de `.atlas` (que isola o empilhamento)
          o cabeçalho do site, z 999, ficaria por cima da ficha. */}
      {(sel || aviso) && typeof document !== "undefined" ? createPortal(
      <div className="atlas atlas-flutua">
      {sel ? (
        <div className="atlas-ficha" role="dialog" aria-modal="true" aria-label={sel.n} onClick={(ev) => { if (ev.target === ev.currentTarget) fechar(); }}>
          <div className="atlas-ficha-caixa">
            <figure className="atlas-ficha-img" onDoubleClick={() => void copiar(sel)}>
              <div className="atlas-ficha-quadro">
                <img src={foto(sel.id)} alt={`Exemplo do estilo ${sel.n}`} width={800} height={1000} className={sel.mov ? `atlas-mov-${sel.mov}` : undefined} data-vt="1" />
                {pulsoDe(sel.id) ? (
                  <span key={pulsoDe(sel.id)} className="atlas-coracao" aria-hidden="true">
                    <Heart size={140} fill="currentColor" strokeWidth={0} />
                  </span>
                ) : null}
              </div>
              <figcaption>
                {sel.mov
                  ? `Quadro gerado com ${modelo}; o movimento é encenado pela página.`
                  : `Gerado com ${modelo} a partir deste prompt.`}{" "}
                Assunto do exemplo: «{sel.ex}».
              </figcaption>
            </figure>

            <div className="atlas-ficha-painel">
              <button type="button" className="atlas-fechar" ref={fecharRef} onClick={fechar} aria-label="Fechar">
                <X size={20} aria-hidden="true" />
              </button>
              <p className="atlas-rotulo">{nomeFam[sel.f]}</p>
              <h2 className="atlas-ficha-nome">{sel.n}</h2>
              <p className="atlas-ficha-desc">{sel.d}</p>
              <label className="atlas-campo">
                <span>Seu assunto</span>
                <input type="text" autoComplete="off" value={assunto} onChange={(ev) => setAssunto(ev.target.value)} placeholder="o que você quer criar" />
              </label>
              <pre className="atlas-prompt" tabIndex={0}>
                {assuntoLimpo && promptSel.startsWith(assuntoLimpo) ? (
                  <>
                    <mark>{assuntoLimpo}</mark>
                    {promptSel.slice(assuntoLimpo.length)}
                  </>
                ) : (
                  promptSel
                )}
              </pre>
              <label className="atlas-chave">
                <input type="checkbox" checked={semLetras} onChange={(ev) => setSemLetras(ev.target.checked)} />
                <span>Proibir letras na imagem</span>
              </label>
              <div className="atlas-ficha-acoes">
                <button type="button" className={`atlas-magico${pulsoDe(sel.id) ? " feito" : ""}`} onClick={() => void copiar(sel)}>
                  {pulsoDe(sel.id) ? <Check size={19} aria-hidden="true" /> : <Copy size={19} aria-hidden="true" />}
                  {pulsoDe(sel.id) ? "Copiado" : "Copiar prompt"}
                </button>
                <span className={`atlas-like solto${meus.has(sel.id) ? " meu" : ""}`}>
                  <Heart size={18} fill={meus.has(sel.id) ? "currentColor" : "none"} aria-hidden="true" />
                  <b>{curto(usos[sel.id] ?? 0)}</b> {(usos[sel.id] ?? 0) === 1 ? "cópia" : "cópias"}
                </span>
                <button type="button" className="atlas-fantasma" onClick={() => void copiarLink()}>
                  <Link2 size={17} aria-hidden="true" /> Link
                </button>
              </div>
              <div className="atlas-ficha-nav">
                <button type="button" onClick={() => vizinho(-1)}>
                  <ChevronLeft size={18} aria-hidden="true" /> Anterior
                </button>
                <button type="button" onClick={() => vizinho(1)}>
                  Próximo <ChevronRight size={18} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {aviso ? (
        <div className="atlas-aviso" role="status" aria-live="polite">
          {aviso}
        </div>
      ) : null}
      </div>,
      document.body,
      ) : null}
    </div>
  );
}
