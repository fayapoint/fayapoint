"use client";
import { useT } from "@/i18n/dicionario";

/**
 * A galeria da comunidade, dentro do dashboard.
 *
 * ── Por que existe ─────────────────────────────────────────────────────────
 *
 * Ricardo, 03/08/2026: *"De dentro do dashboard, não temos acesso a galeria,
 * que deve ser feita utilizando o projeto que lhe passei"* — o pen
 * `codepen.io/ol-ivier/pen/QwKZVGK`, "Infinite Drift – 8 Horizontal Bands".
 * A API já existia (`/api/public/gallery`) e alimentava `/comunidade` e a
 * home; faltava a porta no portal.
 *
 * ── O que foi copiado do pen, e o que foi trocado ──────────────────────────
 *
 * COPIADO — é a ideia inteira:
 *   · faixas horizontais, cada uma deslizando numa velocidade diferente;
 *   · direção alternada entre as faixas, que é o que cria a sensação de
 *     profundidade sem nenhum efeito 3D;
 *   · o conteúdo de cada faixa é clonado, e o deslocamento volta ao início
 *     quando passa de uma largura — o laço nunca tem começo nem fim visível.
 *
 * TROCADO, e o motivo importa:
 *   · **Não é WebGL.** O pen desenha as imagens de cada faixa num `<canvas>`
 *     único, que vira uma textura no three.js. É rápido — uma chamada de
 *     desenho por faixa — mas assa as imagens num bitmap: nenhuma delas é
 *     clicável, focável ou legível por leitor de tela. Numa galeria em que se
 *     clica para ver a obra e o prompt, isso não é detalhe, é o produto.
 *     Aqui cada imagem é um elemento de verdade, e o movimento é um
 *     `transform` numa faixa só — o navegador compõe na GPU do mesmo jeito.
 *   · **O movimento para no hover e no foco.** Perseguir com o mouse uma
 *     imagem que foge é frustrante. Quem chega perto de escolher, escolhe.
 *   · **`prefers-reduced-motion` congela tudo** e a galeria vira uma grade
 *     rolável comum, que continua completa.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Images, Loader2, X } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Criacao {
  _id: string;
  userName: string;
  imageUrl: string;
  prompt: string;
  createdAt: string;
  category?: string;
}

const FAIXAS = 4;
/** px/s por faixa. Ímpares vão para o outro lado — ver o comentário do laço. */
const VELOCIDADES = [14, 20, 11, 17];

export function GaleriaPanel() {
  const T = useT();
  const [criacoes, setCriacoes] = useState<Criacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberta, setAberta] = useState<Criacao | null>(null);
  const [pausada, setPausada] = useState(false);

  useEffect(() => {
    let vivo = true;
    fetch("/api/public/gallery?limit=60", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (vivo && Array.isArray(d?.creations)) setCriacoes(d.creations);
      })
      .catch(() => {})
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, []);

  /** Distribui as criações entre as faixas, em ordem alternada. */
  const faixas = useMemo(() => {
    const saida: Criacao[][] = Array.from({ length: FAIXAS }, () => []);
    criacoes.forEach((c, i) => saida[i % FAIXAS].push(c));
    return saida.filter((f) => f.length > 0);
  }, [criacoes]);

  if (carregando) {
    return (
      <Card className="border-border bg-card p-10 text-center">
        <Loader2 className="mx-auto animate-spin text-amber-400" size={22} />
        <p className="mt-3 text-xs text-muted-foreground">{T("Carregando a galeria…")}</p>
      </Card>
    );
  }

  if (criacoes.length === 0) {
    return (
      <Card className="border-border bg-card p-10 text-center">
        <Images className="mx-auto text-muted-foreground" size={22} />
        <p className="mt-3 text-sm font-semibold">{T("A galeria ainda está vazia")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          
          {T("Gere a primeira imagem no Studio AI e ela aparece aqui.")}
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border bg-card p-4 md:p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600">
          <Images size={15} className="text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold">Galeria da comunidade</h3>
          <p className="text-xs text-muted-foreground">
            {criacoes.length}  {T("criações · passe o cursor para parar, clique para ver o prompt")}
          </p>
        </div>
      </div>

      <div
        className="-mx-4 space-y-3 md:-mx-5"
        onMouseEnter={() => setPausada(true)}
        onMouseLeave={() => setPausada(false)}
        onFocusCapture={() => setPausada(true)}
        onBlurCapture={() => setPausada(false)}
      >
        {faixas.map((faixa, i) => (
          <Faixa
            key={i}
            itens={faixa}
            velocidade={VELOCIDADES[i % VELOCIDADES.length]}
            paraEsquerda={i % 2 === 0}
            pausada={pausada}
            aoEscolher={setAberta}
          />
        ))}
      </div>

      {aberta && <Lightbox criacao={aberta} aoFechar={() => setAberta(null)} />}
    </Card>
  );
}

/**
 * Uma faixa que desliza sozinha.
 *
 * O deslocamento é acumulado num `ref` e escrito direto no `style.transform`,
 * fora do React: um `setState` por quadro em quatro faixas re-renderizaria o
 * painel inteiro 240 vezes por segundo para mover pixels que a GPU já sabe
 * mover.
 */
function Faixa({
  itens,
  velocidade,
  paraEsquerda,
  pausada,
  aoEscolher,
}: {
  itens: Criacao[];
  velocidade: number;
  paraEsquerda: boolean;
  pausada: boolean;
  aoEscolher: (c: Criacao) => void;
}) {
  const T = useT();
  const trilho = useRef<HTMLDivElement>(null);
  const deslocamento = useRef(0);

  // O laço de animação lê a pausa por `ref`, não pela variável capturada: o
  // `requestAnimationFrame` é montado uma vez e viveria para sempre com o
  // valor do primeiro render. A escrita vai num efeito — escrever em `ref`
  // durante o render é justamente o que o React proíbe.
  const pausadaRef = useRef(pausada);
  useEffect(() => {
    pausadaRef.current = pausada;
  }, [pausada]);

  // Duas cópias: quando a primeira sai inteira de cena, o deslocamento volta a
  // zero e a segunda já está exatamente onde a primeira estava. O salto é
  // invisível porque o conteúdo nas duas posições é o mesmo.
  const duplicada = useMemo(() => [...itens, ...itens], [itens]);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let quadro = 0;
    let anterior = performance.now();

    const animar = (agora: number) => {
      const dt = Math.min(64, agora - anterior) / 1000;
      anterior = agora;

      if (!pausadaRef.current) {
        const metade = el.scrollWidth / 2;
        deslocamento.current += velocidade * dt;
        if (metade > 0 && deslocamento.current >= metade) deslocamento.current -= metade;
        const x = paraEsquerda ? -deslocamento.current : deslocamento.current - metade;
        el.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      }

      quadro = requestAnimationFrame(animar);
    };

    quadro = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(quadro);
  }, [velocidade, paraEsquerda]);

  return (
    <div className="overflow-hidden">
      <div ref={trilho} className="flex w-max gap-3 will-change-transform">
        {duplicada.map((c, i) => (
          <button
            key={`${c._id}-${i}`}
            type="button"
            onClick={() => aoEscolher(c)}
            // Só a primeira cópia entra na navegação por teclado e para o
            // leitor de tela — a segunda é adorno, e tabular pela mesma
            // imagem duas vezes é ruído.
            tabIndex={i < itens.length ? 0 : -1}
            aria-hidden={i >= itens.length}
            className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40 transition-transform hover:scale-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 sm:h-32 sm:w-32"
          >
            { }
            <img
              src={c.imageUrl}
              alt={c.prompt?.slice(0, 80) || T("Criação da comunidade")}
              loading="lazy"
              draggable={false}
              className="h-full w-full object-cover"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 to-transparent px-2 pb-1.5 pt-4 text-left text-[9px] text-white/70 opacity-0 transition-opacity group-hover:opacity-100">
              {T(c.userName)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Lightbox({ criacao, aoFechar }: { criacao: Criacao; aoFechar: () => void }) {
  const T = useT();
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={aoFechar}
      role="dialog"
      aria-modal="true"
      aria-label={T("Criação da comunidade")}
    >
      <div
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0d16]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-3">
          <p className="truncate text-sm font-semibold text-white">{T(criacao.userName)}</p>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        { }
        <img src={criacao.imageUrl} alt={T(criacao.prompt)} className="w-full" />
        {criacao.prompt && (
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Prompt</p>
            <p className="mt-1.5 text-sm leading-relaxed text-white/70">{T(criacao.prompt)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
