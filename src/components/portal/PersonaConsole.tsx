"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  Layers,
  Loader2,
  Mic,
  Pencil,
  Sparkles,
  Store,
  Target,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useT } from "@/i18n/dicionario";
import { EDITORES, type Editor } from "@/components/portal/PersonaDossie";
import { artePreset, presetsDe, type Preset } from "@/lib/persona-presets";
import { temArtePreset } from "@/lib/persona-arte";
import type { Dossie, DimensaoDossie } from "@/lib/persona";

/**
 * O Console da Persona — `/portal/persona` (12/08/2026).
 *
 * ## O defeito que ele corrige
 *
 * A versão anterior era um ROLO. Sete acordeões, cada um com as suas lacunas,
 * empilhados: aberto, o dossiê passava de 3000px. Ricardo, em 12/08:
 *
 * > *"a interface fica muito longa, temos que pensar nos cards como hologramas
 * > em cards lindos e bem desenhados com a imagem a pergunta tudo em caracteres
 * > bem visíveis (…) uma tree que relaciona os conhecimentos que temos de forma
 * > gráfica, e a página não fica gigante para baixo"*
 *
 * Rolo tem dois problemas que nenhum ajuste de espaçamento resolve. O primeiro
 * é que **a pessoa nunca sabe onde está**: não há "3 de 24", há só mais tela
 * abaixo. O segundo é que **tudo compete com tudo** — vinte e quatro perguntas
 * visíveis ao mesmo tempo é a mesma coisa que nenhuma em destaque, e a que está
 * em foco fica do mesmo tamanho da que não está.
 *
 * ## A troca: uma pergunta por vez, e um mapa ao lado
 *
 * - **Palco** (centro): UMA pergunta, grande, com a arte da resposta. É o único
 *   lugar da tela que pede decisão.
 * - **Árvore** (esquerda): o desenho de todo o conhecimento — espinha das sete
 *   dimensões, e de cada uma saem os seus campos como folhas ligadas por
 *   arestas curvas. Folha acesa = respondido. É mapa E navegação: a ordem não é
 *   imposta, dá para saltar para qualquer folha ("montamos conforme achamos
 *   conveniente").
 * - **Personagem** (direita): o progresso deixa de ser só um número. Um busto
 *   holográfico ganha uma camada por dimensão fechada — plinto, tronco, cabeça,
 *   halo, os dois braços, a aura. Vazio é fantasma; cheio, acende.
 *
 * ## O que ele NÃO faz
 *
 * Não calcula confiança — quem calcula é `lib/persona.ts` no servidor, e é de
 * lá que vem o número depois de cada gravação. Não duplica a tabela de
 * editores: importa `EDITORES` de `PersonaDossie`, senão um campo ganharia
 * editor num lugar e continuaria caixa de texto no outro.
 *
 * ⚠️ A rota de gravação é **PUT** `/api/user/social-persona` com o valor
 * aninhado (`{ bloco: { chave: valor } }`) — não PATCH, e não o campo plano.
 */

const ICONES: Record<string, typeof UserIcon> = {
  user: UserIcon,
  mic: Mic,
  users: Users,
  layers: Layers,
  target: Target,
  book: BookOpen,
  camera: Camera,
  /** ⚠️ `negocio` usa `store`; sem esta linha ele caía no ícone de pessoa. */
  store: Store,
};

/** `identidade.papel` → `{ identidade: { papel: valor } }`. */
function aninhar(campo: string, valor: unknown): Record<string, unknown> {
  const [bloco, chave] = campo.split(".");
  return { [bloco]: { [chave]: valor } };
}

/** Uma folha da árvore: uma pergunta, respondida ou não. */
interface Folha {
  campo: string;
  pergunta: string;
  ganho: string;
  /** O que já está gravado, em texto legível. Vazio = folha apagada. */
  valor: string;
  dimId: string;
  dimTitulo: string;
  cor: string;
  icone: string;
}

/**
 * Achata o dossiê em folhas, na ordem das dimensões.
 *
 * ⚠️ `conhecido` sem `campo` (as fotos, o que vem de fora) NÃO vira folha: ele
 * não tem editor, e uma folha que não abre nada é um nó morto no mapa.
 */
function folhasDe(dossie: Dossie): Folha[] {
  const out: Folha[] = [];
  for (const d of dossie.dimensoes) {
    const base = { dimId: d.id, dimTitulo: d.titulo, cor: d.cor, icone: d.icone };
    for (const c of d.conhecido) {
      if (!c.campo || !EDITORES[c.campo]) continue;
      out.push({
        campo: c.campo,
        pergunta: c.rotulo,
        ganho: d.paraQue,
        valor: c.valor,
        ...base,
      });
    }
    for (const f of d.faltando) {
      if (!EDITORES[f.campo]) continue;
      if (out.some((o) => o.campo === f.campo)) continue;
      out.push({ campo: f.campo, pergunta: f.pergunta, ganho: f.ganho, valor: "", ...base });
    }
  }
  return out;
}

// ═════════════════════════════════════════════════════════════════════

export default function PersonaConsole({
  dossie,
  onSalvo,
}: {
  dossie: Dossie | null;
  onSalvo: (d: Dossie) => void;
}) {
  const T = useT();
  const [atual, setAtual] = useState(0);
  const [salvando, setSalvando] = useState<string | null>(null);

  const folhas = useMemo(() => (dossie ? folhasDe(dossie) : []), [dossie]);
  const folha = folhas[Math.min(atual, Math.max(0, folhas.length - 1))];

  const token = typeof window !== "undefined" ? localStorage.getItem("fayai_token") || "" : "";

  const salvar = useCallback(
    async (campo: string, valor: unknown) => {
      setSalvando(campo);
      try {
        const res = await fetch("/api/user/social-persona", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(aninhar(campo, valor)),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data?.error || T("Não deu para salvar agora"));
          return;
        }
        onSalvo(data.dossie);
        toast.success(data.xpAwarded > 0 ? `${T("Anotado")} — +${data.xpAwarded} XP ✨` : `${T("Anotado")} ✨`);
      } catch {
        toast.error(T("Erro de rede"));
      } finally {
        setSalvando(null);
      }
    },
    [token, onSalvo, T],
  );

  // Setas do teclado andam pelas perguntas. Numa tela que existe para não
  // rolar, o teclado é o caminho mais rápido — e sem ele o console só é
  // navegável pelo mouse, que é regressão em relação à página que rolava.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && /^(INPUT|TEXTAREA)$/.test(alvo.tagName)) return;
      if (e.key === "ArrowRight") setAtual((i) => Math.min(i + 1, folhas.length - 1));
      if (e.key === "ArrowLeft") setAtual((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [folhas.length]);

  if (!dossie || !folha) {
    return (
      <div className="grid h-[70vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    );
  }

  const respondidas = folhas.filter((f) => f.valor).length;
  const indiceNaDimensao = folhas.filter((f) => f.dimId === folha.dimId).findIndex((f) => f.campo === folha.campo);
  const totalNaDimensao = folhas.filter((f) => f.dimId === folha.dimId).length;

  return (
    /* `min-h-0` em toda a cadeia: sem ele o filho que rola estica o pai e a
       página volta a crescer — é o erro clássico de flexbox em altura. */
    <div className="flex h-[calc(100dvh-4.5rem)] min-h-0 flex-col gap-3 px-3 pb-3 sm:px-4 lg:flex-row">
      {/* ─── A ÁRVORE ─── */}
      <Arvore
        dimensoes={dossie.dimensoes}
        folhas={folhas}
        atual={folha}
        onIr={(campo) => setAtual(folhas.findIndex((f) => f.campo === campo))}
      />

      {/* ─── O PALCO ─── */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Migalha
          folha={folha}
          posicaoNaDimensao={indiceNaDimensao + 1}
          totalNaDimensao={totalNaDimensao}
          indice={atual + 1}
          total={folhas.length}
        />

        <Palco
          key={folha.campo}
          folha={folha}
          salvando={salvando === folha.campo}
          onSalvar={(v) => salvar(folha.campo, v)}
        />

        <nav className="mt-3 flex shrink-0 items-center justify-between gap-3">
          <Passo
            direcao="atras"
            rotulo={T("Anterior")}
            desabilitado={atual === 0}
            onClick={() => setAtual((i) => Math.max(0, i - 1))}
          />
          <p className="text-[13px] font-semibold tabular-nums text-white/70">
            {respondidas}/{folhas.length} {T("respondidas")}
          </p>
          <Passo
            direcao="frente"
            rotulo={T("Próxima")}
            desabilitado={atual >= folhas.length - 1}
            onClick={() => setAtual((i) => Math.min(folhas.length - 1, i + 1))}
          />
        </nav>
      </section>

      {/* ─── O PERSONAGEM ─── */}
      <Personagem dimensoes={dossie.dimensoes} confianca={dossie.confianca} qualidade={dossie.qualidade} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// A ÁRVORE
// ═════════════════════════════════════════════════════════════════════

/**
 * O mapa do conhecimento, desenhado.
 *
 * Não é lista com bolinha: é uma ESPINHA vertical com as sete dimensões, e de
 * cada dimensão saem arestas curvas até as suas folhas. A aresta é o que
 * transforma "itens numerados" em "árvore" — é ela que mostra que o campo
 * pertence à dimensão, e não à anterior.
 *
 * No mobile a espinha não cabe; ali a árvore vira uma faixa horizontal de
 * dimensões com o contador de folhas acesas, e a navegação fina fica com as
 * setas do palco.
 */
function Arvore({
  dimensoes,
  folhas,
  atual,
  onIr,
}: {
  dimensoes: DimensaoDossie[];
  folhas: Folha[];
  atual: Folha;
  onIr: (campo: string) => void;
}) {
  const T = useT();
  const ref = useRef<HTMLDivElement>(null);

  // A folha da vez tem que estar VISÍVEL no mapa. Sem isto, saltar de uma
  // dimensão para outra pelas setas deixa o marcador fora da área rolável e o
  // mapa passa a mentir sobre onde a pessoa está.
  useEffect(() => {
    ref.current?.querySelector('[data-atual="1"]')?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [atual.campo]);

  return (
    <aside className="flex shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] lg:w-[272px]">
      <p className="flex shrink-0 items-center gap-1.5 border-b border-white/10 px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-300">
        <Sparkles size={12} /> {T("Mapa do que eu sei")}
      </p>

      {/* Mobile: faixa horizontal. Desktop: a espinha. */}
      <div ref={ref} className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden lg:overflow-x-hidden lg:overflow-y-auto">
        <ul className="flex gap-2 p-2 lg:block lg:space-y-1 lg:p-0">
          {dimensoes.map((d, iDim) => {
            const suas = folhas.filter((f) => f.dimId === d.id);
            if (!suas.length) return null;
            const acesas = suas.filter((f) => f.valor).length;
            const Icone = ICONES[d.icone] || UserIcon;
            const aqui = atual.dimId === d.id;

            return (
              <li key={d.id} className="relative shrink-0 lg:shrink">
                {/* A espinha: o traço vertical que liga uma dimensão à seguinte.
                    Só no desktop, e não desce depois da última. */}
                {iDim < dimensoes.length - 1 && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-[27px] top-9 hidden w-px lg:block"
                    style={{ height: "calc(100% - 1rem)", background: "rgba(255,255,255,.10)" }}
                  />
                )}

                <div className="flex items-center gap-2 px-3 py-1.5">
                  <span
                    className="relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-lg"
                    style={{
                      background: aqui ? d.cor : `${d.cor}22`,
                      color: aqui ? "#000" : d.cor,
                      boxShadow: aqui ? `0 0 0 3px ${d.cor}33` : "none",
                    }}
                  >
                    <Icone size={13} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-white">{T(d.titulo)}</span>
                  <span className="shrink-0 text-[12px] font-bold tabular-nums" style={{ color: d.cor }}>
                    {acesas}/{suas.length}
                  </span>
                </div>

                {/* As folhas. Escondidas no mobile — ali a faixa é só o índice
                    das dimensões, e quem anda entre perguntas são as setas. */}
                <ul className="hidden lg:block">
                  {suas.map((f) => {
                    const eu = f.campo === atual.campo;
                    return (
                      <li key={f.campo} className="relative">
                        {/* A aresta curva: desce da espinha e entra na folha. */}
                        <svg
                          aria-hidden
                          className="pointer-events-none absolute left-[27px] top-0 h-full w-4 overflow-visible"
                          viewBox="0 0 16 32"
                          preserveAspectRatio="none"
                        >
                          <path
                            d="M0.5 0 L0.5 16 Q0.5 24 8 24 L15 24"
                            fill="none"
                            stroke={f.valor ? `${f.cor}99` : "rgba(255,255,255,.13)"}
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>

                        <button
                          type="button"
                          data-atual={eu ? "1" : undefined}
                          onClick={() => onIr(f.campo)}
                          aria-current={eu ? "step" : undefined}
                          className="flex min-h-[44px] w-full cursor-pointer items-center gap-2 rounded-lg py-1 pl-[52px] pr-2 text-left transition-colors hover:bg-white/[0.06]"
                          style={{ background: eu ? `${f.cor}1f` : undefined }}
                        >
                          <span
                            aria-hidden
                            className="grid h-[13px] w-[13px] shrink-0 place-items-center rounded-full border"
                            style={{
                              borderColor: f.valor ? f.cor : "rgba(255,255,255,.28)",
                              background: f.valor ? f.cor : "transparent",
                            }}
                          >
                            {f.valor && <Check size={8} className="text-black" strokeWidth={4} />}
                          </span>
                          {/* Duas linhas, não `truncate`: rótulo cortado no
                              meio da palavra já foi reprovado nesta tela
                              ("Tec", "Ven", "Edu"). Quem lê o mapa precisa
                              reconhecer a pergunta, não adivinhá-la. */}
                          <span
                            className="min-w-0 flex-1 text-[13px] leading-tight [display:-webkit-box] [overflow:hidden] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                            style={{
                              color: eu ? "#fff" : f.valor ? "rgba(255,255,255,.86)" : "rgba(255,255,255,.62)",
                              fontWeight: eu ? 700 : 500,
                            }}
                            title={f.pergunta}
                          >
                            {T(f.pergunta)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

// ═════════════════════════════════════════════════════════════════════
// O PALCO
// ═════════════════════════════════════════════════════════════════════

function Migalha({
  folha,
  posicaoNaDimensao,
  totalNaDimensao,
  indice,
  total,
}: {
  folha: Folha;
  posicaoNaDimensao: number;
  totalNaDimensao: number;
  indice: number;
  total: number;
}) {
  const T = useT();
  const Icone = ICONES[folha.icone] || UserIcon;
  return (
    <div className="mb-2 flex shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1">
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-extrabold"
        style={{ background: `${folha.cor}26`, color: folha.cor }}
      >
        <Icone size={13} /> {T(folha.dimTitulo)}
      </span>
      <span className="text-[12.5px] font-semibold tabular-nums text-white/60">
        {T("pergunta")} {posicaoNaDimensao} {T("de")} {totalNaDimensao}
      </span>
      <span aria-hidden className="text-white/25">
        ·
      </span>
      <span className="text-[12.5px] font-semibold tabular-nums text-white/60">
        {indice}/{total} {T("no total")}
      </span>
    </div>
  );
}

/**
 * O cartão-holograma.
 *
 * O que faz um retângulo parecer holograma, e não cartão com borda azul:
 * 1. **borda que EMITE** — anel duplo com a cor da dimensão e sombra externa
 *    difusa, em vez de `1px solid`;
 * 2. **varredura** — uma faixa de luz que desce devagar (`--varre`), a marca
 *    registrada da projeção;
 * 3. **linhas de rastreio** — listras horizontais de 3px, opacidade baixíssima;
 * 4. **cantos cortados** — quatro marcas de canto, que dizem "projetado" sem
 *    precisar de moldura.
 *
 * ⚠️ Tudo isso mora ATRÁS do texto (`pointer-events-none`, `z` abaixo) e nada
 * fica por cima do rótulo. Efeito que rouba contraste da legenda é defeito, não
 * estilo — a barra reprova em C4.
 */
function Palco({
  folha,
  salvando,
  onSalvar,
}: {
  folha: Folha;
  salvando: boolean;
  onSalvar: (valor: unknown) => void;
}) {
  const T = useT();
  const editor: Editor = EDITORES[folha.campo] ?? { tipo: "texto" };

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl"
      style={{
        background: `linear-gradient(155deg, ${folha.cor}1c 0%, rgba(255,255,255,.028) 42%, rgba(0,0,0,.30) 100%)`,
        boxShadow: `0 0 0 1px ${folha.cor}59, 0 0 0 4px ${folha.cor}12, 0 22px 60px -28px ${folha.cor}aa`,
      }}
    >
      {/* rastreio + varredura */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 3px)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 h-24 animate-[varre_5.5s_linear_infinite]"
        style={{ background: `linear-gradient(180deg, transparent, ${folha.cor}1f, transparent)` }}
      />
      <Cantos cor={folha.cor} />

      <style>{`@keyframes varre{0%{top:-6rem}100%{top:100%}}`}</style>

      {/* ─── A pergunta ─── */}
      <div className="relative shrink-0 px-5 pb-3 pt-5 sm:px-7 sm:pt-6">
        <h2 className="text-[21px] font-black leading-[1.15] text-white sm:text-[28px] lg:text-[31px]">
          {T(folha.pergunta)}
        </h2>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-snug text-white/70 sm:text-[15px]">{T(folha.ganho)}</p>
        {folha.valor && (
          <p
            className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[14px] font-semibold text-white"
            style={{ background: `${folha.cor}26` }}
          >
            <Check size={14} style={{ color: folha.cor }} />
            <span className="truncate">{folha.valor}</span>
          </p>
        )}
      </div>

      {/* ─── A resposta ─── */}
      <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-7">
        <Resposta editor={editor} folha={folha} salvando={salvando} onSalvar={onSalvar} />
      </div>
    </div>
  );
}

function Cantos({ cor }: { cor: string }) {
  const c = { borderColor: cor };
  return (
    <>
      <span aria-hidden className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 rounded-tl" style={c} />
      <span aria-hidden className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 rounded-tr" style={c} />
      <span aria-hidden className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 rounded-bl" style={c} />
      <span aria-hidden className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 rounded-br" style={c} />
    </>
  );
}

function Passo({
  direcao,
  rotulo,
  desabilitado,
  onClick,
}: {
  direcao: "atras" | "frente";
  rotulo: string;
  desabilitado: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-4 text-[14px] font-bold text-white transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-35"
    >
      {direcao === "atras" && <ArrowLeft size={16} />}
      {rotulo}
      {direcao === "frente" && <ArrowRight size={16} />}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════
// AS RESPOSTAS
// ═════════════════════════════════════════════════════════════════════

function Resposta({
  editor,
  folha,
  salvando,
  onSalvar,
}: {
  editor: Editor;
  folha: Folha;
  salvando: boolean;
  onSalvar: (valor: unknown) => void;
}) {
  const T = useT();
  const opcoes = presetsDe(folha.campo);
  const [escrevendo, setEscrevendo] = useState(false);
  const [texto, setTexto] = useState(folha.valor);
  const [itens, setItens] = useState<string[]>(
    editor.tipo === "itens" ? folha.valor.split(/,\s*/).filter(Boolean) : [],
  );

  if (editor.tipo === "foto") {
    return (
      <p className="rounded-xl border border-white/12 bg-white/[0.04] p-4 text-[14px] text-white/75">
        {T("As fotos ficam na galeria, logo abaixo do console.")}
      </p>
    );
  }

  if (editor.tipo === "escala") {
    const v = Number(folha.valor) || 50;
    return <Escala esquerda={editor.esquerda} direita={editor.direita} valor={v} cor={folha.cor} onSalvar={onSalvar} />;
  }

  if (editor.tipo === "numero" && !opcoes.length) {
    return <Numero editor={editor} valor={folha.valor} cor={folha.cor} salvando={salvando} onSalvar={onSalvar} />;
  }

  if (editor.tipo === "escolha") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(editor.opcoes).map(([k, rotulo]) => (
          <button
            key={k}
            type="button"
            onClick={() => onSalvar(k)}
            className="min-h-[44px] cursor-pointer rounded-xl border px-4 py-3 text-left text-[15px] font-semibold text-white transition-colors hover:bg-white/[0.08]"
            style={{ borderColor: folha.valor === rotulo ? folha.cor : "rgba(255,255,255,.14)" }}
          >
            {T(rotulo)}
          </button>
        ))}
      </div>
    );
  }

  const multipla = editor.tipo === "itens";
  const marcado = (op: Preset) =>
    multipla ? itens.includes(String(op.valor)) : folha.valor === String(op.valor);

  const escolher = (op: Preset) => {
    if (!multipla) {
      onSalvar(op.valor);
      return;
    }
    const s = String(op.valor);
    const proximo = itens.includes(s) ? itens.filter((i) => i !== s) : [...itens, s];
    setItens(proximo);
    onSalvar(proximo);
  };

  return (
    <div>
      {opcoes.length > 0 && (
        <>
          <p className="mb-2 text-[13px] font-bold uppercase tracking-wider text-white/55">
            {multipla ? T("Toque em quantas quiser") : T("Toque na que for a sua")}
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            {opcoes.map((op) => (
              <Ladrilho
                key={String(op.valor)}
                campo={folha.campo}
                op={op}
                cor={folha.cor}
                marcado={marcado(op)}
                onClick={() => escolher(op)}
              />
            ))}
          </div>
        </>
      )}

      {/* O texto livre nunca sai de cena: o preset PREENCHE, não tranca. */}
      <div className="mt-3">
        {escrevendo ? (
          <div>
            <textarea
              autoFocus
              rows={editor.tipo === "paragrafo" ? (editor.linhas ?? 3) : 2}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={"dica" in editor ? T(editor.dica ?? "") : ""}
              className="w-full rounded-xl border border-white/15 bg-black/40 p-3 text-[15px] leading-snug text-white outline-none placeholder:text-white/40 focus:border-amber-400"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => onSalvar(multipla ? texto.split(/,\s*/).filter(Boolean) : texto)}
                disabled={salvando}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl bg-amber-400 px-4 text-[14px] font-extrabold text-black disabled:opacity-60"
              >
                {salvando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {T("Guardar")}
              </button>
              <button
                type="button"
                onClick={() => setEscrevendo(false)}
                className="min-h-[44px] cursor-pointer rounded-xl border border-white/15 px-4 text-[14px] font-bold text-white/80"
              >
                {T("Cancelar")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEscrevendo(true)}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-white/25 px-4 text-[14px] font-bold text-white/80 transition-colors hover:border-amber-400 hover:text-white"
          >
            <Pencil size={15} /> {T("Escrever do meu jeito")}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * O ladrilho de opção.
 *
 * Proporção 4:3 — a MESMA em que a arte foi gerada no Higgsfield. Qualquer
 * outra recorta o enquadramento, e foi por isso que o lote de 16:9 dos cursos
 * não serve aqui (ver o handoff da arte da persona).
 */
function Ladrilho({
  campo,
  op,
  cor,
  marcado,
  onClick,
}: {
  campo: string;
  op: Preset;
  cor: string;
  marcado: boolean;
  onClick: () => void;
}) {
  const T = useT();
  const [temArte, setTemArte] = useState(temArtePreset(campo, op.valor));

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={marcado}
      title={op.rotulo}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl text-left transition-transform hover:-translate-y-0.5"
      style={{
        boxShadow: marcado ? `0 0 0 2px ${cor}, 0 10px 30px -14px ${cor}` : "0 0 0 1px rgba(255,255,255,.10)",
        background: marcado ? `${cor}1f` : "rgba(255,255,255,.03)",
      }}
    >
      <span
        className="relative block aspect-[4/3] w-full overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${cor}3d, rgba(0,0,0,.4))` }}
      >
        {temArte && (
          /* eslint-disable-next-line @next/next/no-img-element -- caminho que
             pode não existir: `next/image` desenha o buraco calado, o `<img>`
             cai no gradiente pelo `onError`. */
          <img
            src={artePreset(campo, op.valor)}
            alt=""
            aria-hidden
            onError={() => setTemArte(false)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <span
          className="absolute inset-0 grid place-items-center text-[46px] leading-none"
          style={{ opacity: temArte ? 0 : 1 }}
        >
          {op.emoji}
        </span>
        {temArte && (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
        )}
        {marcado && (
          <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full" style={{ background: cor }}>
            <Check size={12} className="text-black" strokeWidth={3} />
          </span>
        )}
      </span>
      {/* ≥14px: é texto que se lê para DECIDIR, não metadado. */}
      <span className="block px-2.5 py-2 text-[14px] font-semibold leading-snug text-white">{T(op.rotulo)}</span>
    </button>
  );
}

function Escala({
  esquerda,
  direita,
  valor,
  cor,
  onSalvar,
}: {
  esquerda: string;
  direita: string;
  valor: number;
  cor: string;
  onSalvar: (v: number) => void;
}) {
  const T = useT();
  const [v, setV] = useState(valor);
  return (
    <div className="rounded-xl border border-white/12 bg-white/[0.03] p-4">
      <input
        type="range"
        min={0}
        max={100}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        onPointerUp={() => onSalvar(v)}
        onKeyUp={() => onSalvar(v)}
        className="w-full cursor-pointer accent-amber-400"
        style={{ accentColor: cor }}
        aria-label={`${esquerda} — ${direita}`}
      />
      <div className="mt-2 flex justify-between text-[13.5px] font-semibold text-white/75">
        <span>{T(esquerda)}</span>
        <span>{T(direita)}</span>
      </div>
    </div>
  );
}

function Numero({
  editor,
  valor,
  cor,
  salvando,
  onSalvar,
}: {
  editor: Extract<Editor, { tipo: "numero" }>;
  valor: string;
  cor: string;
  salvando: boolean;
  onSalvar: (v: number) => void;
}) {
  const T = useT();
  const [v, setV] = useState(valor.replace(/\D/g, "") || "");
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] p-4">
      <input
        type="number"
        min={editor.min}
        max={editor.max}
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="w-32 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-[19px] font-bold tabular-nums text-white outline-none focus:border-amber-400"
      />
      <span className="text-[14.5px] font-semibold text-white/75">{T(editor.sufixo)}</span>
      <button
        type="button"
        onClick={() => onSalvar(Number(v))}
        disabled={salvando || !v}
        className="ml-auto inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl px-4 text-[14px] font-extrabold text-black disabled:opacity-50"
        style={{ background: cor }}
      >
        {salvando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
        {T("Guardar")}
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// O PERSONAGEM
// ═════════════════════════════════════════════════════════════════════

/**
 * O busto holográfico que se completa.
 *
 * Uma camada por dimensão, na ordem em que o servidor as devolve. A camada
 * acesa usa a cor da própria dimensão; a apagada fica em traço fantasma. Assim
 * o desenho responde, de relance, a pergunta que o número de confiança não
 * responde: **o que ainda falta de mim aqui dentro.**
 *
 * ⚠️ O gatilho é `d.confianca >= 60` — o mesmo limiar que `lib/persona.ts` usa
 * para contar dimensão "boa" na qualidade do dossiê. Inventar outro corte aqui
 * faria o desenho discordar do texto ao lado dele.
 */
/**
 * As oito peças do busto, na ordem das dimensões.
 *
 * ⚠️ **O contorno inteiro é desenhado SEMPRE**, em traço fantasma, e as peças
 * acesas são pintadas por cima. A primeira tentativa acendia peça por peça sem
 * o fantasma por baixo, e com duas dimensões fechadas o desenho não parecia
 * gente: parecia uma cúpula de abajur solta no escuro. Figura que só existe
 * depois de completa não serve de medidor de progresso.
 *
 * `preenche` marca o que é volume (cabeça, tronco) — sem preenchimento a peça
 * acesa fica um aro vazio e some contra o fundo.
 */
const CAMADAS: Array<{ d: string; nome: string; preenche?: boolean }> = [
  { d: "M100 58 m-24 0 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0", nome: "cabeça", preenche: true },
  { d: "M78 30 Q100 18 122 30 M70 20 Q100 4 130 20", nome: "voz" },
  { d: "M53 152 Q30 140 28 112", nome: "braço esquerdo" },
  { d: "M147 152 Q170 140 172 112", nome: "braço direito" },
  { d: "M100 132 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0", nome: "núcleo", preenche: true },
  { d: "M52 170 Q52 106 100 106 Q148 106 148 170 Z", nome: "tronco", preenche: true },
  { d: "M100 178 m-56 0 a56 8 0 1 0 112 0 a56 8 0 1 0 -112 0", nome: "plinto" },
  { d: "M100 104 m-84 0 a84 84 0 1 0 168 0 a84 84 0 1 0 -168 0", nome: "aura" },
];

function Personagem({
  dimensoes,
  confianca,
  qualidade,
}: {
  dimensoes: DimensaoDossie[];
  confianca: number;
  qualidade: Dossie["qualidade"];
}) {
  const T = useT();
  const fechadas = dimensoes.filter((d) => d.confianca >= 60).length;

  return (
    <aside className="flex shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] lg:w-[clamp(236px,17vw,300px)]">
      <p className="shrink-0 border-b border-white/10 px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-300">
        {T("Você, montado")}
      </p>

      {/* ⚠️ Esticar o SVG NÃO aumenta o busto: com `meet` num viewBox quadrado
          quem manda é a LARGURA da coluna. Medido: caixa de 218×928 desenhou o
          mesmo busto de 218 e só empurrou o vazio para cima. Por isso o desenho
          fica centralizado, e o que cresce em tela grande é a própria coluna. */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-2">
        <svg
          viewBox="0 0 200 200"
          className="h-[132px] w-full lg:h-auto"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`${T("Progresso da persona")}: ${fechadas}/${dimensoes.length}`}
        >
          <defs>
            <radialGradient id="pl" cx="50%" cy="55%">
              <stop offset="0%" stopColor="#f5c04e" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#f5c04e" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="200" height="200" fill="url(#pl)" />

          {/* 1) O fantasma: a figura inteira, sempre. */}
          {CAMADAS.map((c) => (
            <path
              key={`g-${c.nome}`}
              d={c.d}
              fill={c.preenche ? "rgba(255,255,255,.035)" : "none"}
              stroke="rgba(255,255,255,.16)"
              strokeWidth={1.1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* 2) O que já está aceso, por cima. */}
          {CAMADAS.map((c, i) => {
            const dim = dimensoes[i];
            if (!dim || dim.confianca < 60) return null;
            return (
              <path
                key={`a-${c.nome}`}
                d={c.d}
                fill={c.preenche ? `${dim.cor}2e` : "none"}
                stroke={dim.cor}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 6px ${dim.cor})`, transition: "opacity .6s ease" }}
              >
                <title>{T(dim.titulo)}</title>
              </path>
            );
          })}
        </svg>

        <p className="shrink-0 text-center text-[13px] font-bold leading-snug text-white">
          <span className="tabular-nums" style={{ color: "#f5c04e" }}>
            {fechadas}
          </span>
          <span className="text-white/70">
            {" "}
            {T("de")} {dimensoes.length} {T("partes acesas")}
          </span>
        </p>
      </div>

      <div className="shrink-0 border-t border-white/10 px-3 py-2.5 text-center">
        <p className="text-[26px] font-black leading-none tabular-nums text-amber-300">
          {confianca}
          <span className="text-[13px]">%</span>
        </p>
        <p className="mt-0.5 text-[12px] font-semibold capitalize text-white/70">{T(qualidade)}</p>
      </div>
    </aside>
  );
}
