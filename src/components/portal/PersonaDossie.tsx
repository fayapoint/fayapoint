"use client";
import { useT } from "@/i18n/dicionario";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  User as UserIcon,
  Mic,
  Users,
  Layers,
  Target,
  BookOpen,
  Camera,
  ChevronDown,
  Check,
  Loader2,
  Plus,
  X,
  Sparkles,
  Upload,
  Trash2,
  Maximize2,
  Minimize2,
  Pencil,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { RITMOS, TEMPOS, ROTULO_FOTO, TIPOS_FOTO, type Dossie, type DimensaoDossie, type FotoPersona, type TipoFoto } from "@/lib/persona";
import { artePreset, presetsDe, type Preset } from "@/lib/persona-presets";
import { temArtePreset } from "@/lib/persona-arte";
import { cn } from "@/lib/utils";

/**
 * O dossiê — "o que eu sei de você", em placa angulada.
 *
 * ## A ideia
 *
 * O construtor de 5 passos pergunta e some. Isto faz o contrário: mostra o
 * RETRATO que temos da pessoa, com a confiança medida por dimensão, e deixa
 * cada lacuna a um clique de ser preenchida. A diferença de sensação é grande —
 * um formulário pede, um dossiê devolve. O usuário vê o que ganhou antes de
 * decidir dar mais.
 *
 * ## Por que angulado, e por que ele se endireita
 *
 * A linguagem é a do painel do Radar (`components/radar/ModalAssunto.tsx`):
 * `perspective` curta, `rotateY` negativo, canto chanfrado, trilhos de
 * varredura. Ali a placa mora no espaço 3D do mapa e nunca é preenchida.
 *
 * Aqui ela é FORMULÁRIO. Texto em perspectiva é bonito de olhar e ruim de
 * digitar: a linha de base inclina, o cursor cai fora do lugar que o olho
 * espera e campos longos ficam menores de um lado. Então a perspectiva é o
 * **estado de repouso** — e a placa se endireita (`rotateY(0)`) quando uma
 * dimensão abre para edição. Você olha uma peça inclinada; você escreve numa
 * peça reta.
 *
 * ## O que este componente NÃO faz
 *
 * Não calcula confiança. Quem calcula é `lib/persona.ts`, no servidor: duas
 * telas da mesma pessoa têm que dizer o mesmo número, e regra de negócio
 * duplicada no cliente é onde elas passam a discordar.
 */

const ICONES: Record<string, typeof UserIcon> = {
  user: UserIcon,
  mic: Mic,
  users: Users,
  layers: Layers,
  target: Target,
  book: BookOpen,
  camera: Camera,
};

/**
 * Como cada lacuna é respondida. Sem isto todo campo vira caixa de texto.
 *
 * ⚠️ Exportado desde 12/08 porque o Console da Persona
 * (`PersonaConsole.tsx`) responde as MESMAS lacunas numa tela só. Duas cópias
 * desta tabela é a receita para um campo ganhar editor num lugar e continuar
 * caixa de texto no outro.
 */
export type Editor =
  | { tipo: "texto"; dica?: string }
  | { tipo: "paragrafo"; dica?: string; linhas?: number }
  | { tipo: "itens"; dica?: string; max?: number }
  | { tipo: "escala"; esquerda: string; direita: string }
  | { tipo: "numero"; min: number; max: number; sufixo: string }
  | { tipo: "escolha"; opcoes: Record<string, string> }
  | { tipo: "foto"; vaga: TipoFoto };

export const EDITORES: Record<string, Editor> = {
  /**
   * ⚠️ Todo campo que aparece em `conhecido` com `campo` PRECISA de editor
   * aqui — sem editor, `Lacuna` devolve `null` e o botão "editar" da linha
   * abriria um vazio. Os cinco primeiros entraram em 10/08 justamente porque
   * nunca tinham sido perguntados: existiam no banco, apareciam na tela e não
   * tinham por onde ser mudados.
   */
  "identidade.marca": { tipo: "texto", dica: "O nome que aparece para o cliente — o seu ou o da empresa" },
  "identidade.cidade": { tipo: "texto", dica: "Ex.: Curitiba, PR" },
  "publico.lugares": { tipo: "itens", dica: "Onde o seu público está", max: 6 },
  "voz.vocabulario": { tipo: "texto", dica: "Como você escolhe as palavras" },
  "fotos.perfil": { tipo: "foto", vaga: "perfil" },

  "identidade.papel": { tipo: "texto", dica: "Ex.: ajudo dentistas a lotar a agenda sem depender de indicação" },
  "identidade.missao": { tipo: "paragrafo", dica: "O que te fez começar? O que te faz continuar?", linhas: 3 },
  "identidade.valores": { tipo: "itens", dica: "Ex.: honestidade no preço", max: 5 },
  "voz.amostra": {
    tipo: "paragrafo",
    dica: "Cole um post seu, um e-mail que você escreveu, ou transcreva um áudio. Quanto mais parecido com você falando, melhor.",
    linhas: 7,
  },
  "voz.bordoes": { tipo: "itens", dica: "Ex.: “bora que bora”, “te vejo no próximo”", max: 6 },
  "voz.formalidade": { tipo: "escala", esquerda: "Como com um amigo", direita: "Como num documento" },
  "voz.emoji": { tipo: "escala", esquerda: "Nenhum emoji", direita: "Emoji o tempo todo" },
  "publico.quemE": { tipo: "paragrafo", dica: "Uma pessoa real, não um segmento. Nome, idade, o que faz, o que a incomoda.", linhas: 4 },
  "publico.dores": { tipo: "itens", dica: "Ex.: perde 3h por dia respondendo a mesma pergunta", max: 5 },
  "publico.desejos": { tipo: "itens", dica: "Ex.: sair do celular às 18h sem culpa", max: 5 },
  "estrategia.pilares": { tipo: "itens", dica: "Ex.: bastidores da oficina", max: 5 },
  "estrategia.naoFalar": { tipo: "itens", dica: "Ex.: política, preço de concorrente", max: 6 },
  "estrategia.porSemana": { tipo: "numero", min: 1, max: 21, sufixo: "posts por semana" },
  "estrategia.assinatura": { tipo: "texto", dica: "Ex.: Me chama no direct que eu te mando o passo a passo" },
  "aprendizado.objetivo": { tipo: "paragrafo", dica: "Concreto e verificável — “fechar 5 clientes”, não “crescer”.", linhas: 3 },
  "aprendizado.ritmo": { tipo: "escolha", opcoes: RITMOS },
  "aprendizado.tempo": { tipo: "escolha", opcoes: TEMPOS },
  "aprendizado.ferramentas": { tipo: "itens", dica: "Ex.: ChatGPT, Canva, WhatsApp Business", max: 8 },
  "aprendizado.travando": { tipo: "paragrafo", dica: "O que você tentou e desistiu? Onde ficou confuso?", linhas: 3 },
  /**
   * O NEGÓCIO (03/08/2026) — a dimensão que faltava.
   *
   * As perguntas são propositalmente pequenas e concretas. "Qual seu ticket
   * médio?" é respondível em cinco segundos e muda TODO cálculo de retorno que
   * o curso faz para essa pessoa; "descreva seu posicionamento" seria mais
   * completo e ficaria em branco.
   */
  "negocio.oQueVende": {
    tipo: "texto",
    dica: "Concreto, como você diria no balcão. Ex.: banho e tosa para cães de porte pequeno",
  },
  "negocio.ticket": { tipo: "numero", min: 1, max: 100000, sufixo: "reais por venda, em média" },
  "negocio.canal": { tipo: "texto", dica: "Ex.: WhatsApp e Instagram; loja física na Rua X" },
  "negocio.objecao": {
    tipo: "texto",
    dica: 'A frase, com as palavras dela. Ex.: "vou pensar e te falo", "tá caro"',
  },
  "negocio.clientesPorMes": { tipo: "numero", min: 1, max: 100000, sufixo: "clientes por mês" },
  "negocio.orgulho": { tipo: "texto", dica: "O produto ou serviço que você faria de novo de graça" },
  "negocio.referencias": {
    tipo: "itens",
    dica: "Perfis ou marcas que você admira no seu ramo — servem de régua e de fonte de ideias",
    max: 4,
  },
  "fotos.profissional": { tipo: "foto", vaga: "profissional" },
  "fotos.casual": { tipo: "foto", vaga: "casual" },
  "fotos.pessoal": { tipo: "foto", vaga: "pessoal" },
};

const QUALIDADE_NOTA: Record<Dossie["qualidade"], string> = {
  esboço: "quase nada — o conteúdo ainda sai genérico",
  rascunho: "dá para começar, mas ainda escorrega no tom",
  retrato: "já dá para reconhecer você no texto",
  dossiê: "escreve como você escreveria",
};

function aninhar(campo: string, valor: unknown): Record<string, unknown> {
  const [bloco, chave] = campo.split(".");
  return { [bloco]: { [chave]: valor } };
}

// ─────────────────────────────────────────────────────────────────────

export default function PersonaDossie({
  dossie,
  fotos,
  onSalvo,
  aoRecarregarFotos,
  sempreReta,
}: {
  dossie: Dossie | null;
  fotos: FotoPersona[];
  onSalvo: (d: Dossie) => void;
  aoRecarregarFotos: () => void;
  /**
   * Fora da coluna lateral (o Estúdio da Persona, o Ateliê) a perspectiva só
   * atrapalha: ali a placa É a tela, não um enfeite ao lado dela. E o botão de
   * ampliar deixa de fazer sentido quando já se está na página inteira.
   */
  sempreReta?: boolean;
}) {
  const T = useT();
  const [aberta, setAberta] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<Record<string, unknown>>({});
  const [ampliada, setAmpliada] = useState(false);
  const editando = aberta !== null;

  // Ampliada, a placa fica reta e maior. A perspectiva é o charme da coluna
  // lateral; quem vai LER as sete dimensões de uma vez quer texto reto e
  // largura — foi o retorno que o Ricardo recebeu (28/07/2026). Por isso é um
  // botão e não uma troca: o repouso continua angulado.
  const reta = editando || ampliada || !!sempreReta;

  // Esc fecha e o fundo trava. Uma camada por cima da página que não responde a
  // Esc é armadilha de teclado, e página que rola atrás de overlay dá a
  // impressão de que o clique vazou.
  useEffect(() => {
    if (!ampliada) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAmpliada(false);
    };
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = antes;
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [ampliada]);

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
          toast.error(data?.error || "Não deu para salvar agora");
          return;
        }
        onSalvo(data.dossie);
        setRascunho((r) => {
          const n = { ...r };
          delete n[campo];
          return n;
        });
        toast.success(data.xpAwarded > 0 ? `Anotado — +${data.xpAwarded} XP ✨` : "Anotado ✨");
      } catch {
        toast.error(T("Erro de rede"));
      } finally {
        setSalvando(null);
      }
    },
    [token, onSalvo]
  );

  if (!dossie) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-400" />
      </div>
    );
  }

  const placa = (
    <div
      className="dossie-caixa"
      style={{ perspective: reta ? "none" : "1100px", perspectiveOrigin: "10% 40%" }}
    >
      <div
        className="dossie-placa relative"
        style={{
          // A perspectiva é o repouso. Ao editar — ou ao ampliar — a placa se
          // endireita, porque formulário inclinado é bonito de longe e ruim de
          // perto.
          transform: reta ? "none" : "rotateY(12deg) rotateX(3deg) translateZ(-18px)",
          transformOrigin: "0% 50%",
          transformStyle: "preserve-3d",
          transition: "transform .55s cubic-bezier(.2,.85,.3,1)",
        }}
      >
        <div
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(150deg, rgba(30,26,19,.96), rgba(18,15,11,.98))",
            border: "1px solid rgba(245,192,78,.28)",
            borderRight: "3px solid #f5c04e",
            // canto chanfrado — a assinatura de HUD que veio do Radar
            clipPath: "polygon(0 22px, 22px 0, 100% 0, 100% 100%, 0 100%)",
            boxShadow: "0 26px 60px -18px rgba(0,0,0,.85), 0 0 0 1px rgba(255,255,255,.04) inset, 14px 0 46px -26px #f5c04e",
          }}
        >
          {/* trilhos de varredura, bem discretos */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[.10]"
            style={{ backgroundImage: "repeating-linear-gradient(180deg, #f5c04e, #f5c04e 1px, transparent 1px, transparent 5px)" }}
          />

          <Cabecalho
            dossie={dossie}
            ampliada={ampliada}
            onAlternarTamanho={sempreReta ? null : () => setAmpliada((a) => !a)}
          />

          <div className="relative divide-y divide-white/[0.06] border-t border-white/[0.07]">
            {dossie.dimensoes.map((d) => (
              <Dimensao
                key={d.id}
                d={d}
                aberta={aberta === d.id}
                onToggle={() => setAberta((a) => (a === d.id ? null : d.id))}
                rascunho={rascunho}
                setRascunho={setRascunho}
                salvando={salvando}
                onSalvar={salvar}
                fotos={fotos}
                token={token}
                aoRecarregarFotos={aoRecarregarFotos}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          /* Fora da coluna lateral a placa ocupa a largura toda e a
             perspectiva só rouba espaço horizontal. */
          .dossie-caixa { perspective: none !important; }
          .dossie-placa { transform: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dossie-placa { transition: none !important; transform: none !important; }
        }
      `}</style>
    </div>
  );

  if (!ampliada) return placa;

  // Ampliada a placa sai da coluna lateral — de dentro dela não tem como ficar
  // maior, o `aside` é estreito por definição. Vira camada por cima da página.
  return (
    <>
      {/* o lugar dela na coluna não colapsa: sem isto a página inteira pula
          quando a placa sai e volta */}
      <div aria-hidden style={{ minHeight: 320 }} />

      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:p-6"
        style={{ background: "rgba(8,7,5,.72)", backdropFilter: "blur(6px)" }}
        onClick={() => setAmpliada(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={T("O que eu sei de você")}
          className="my-auto w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {placa}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────

function Cabecalho({
  dossie,
  ampliada,
  onAlternarTamanho,
}: {
  dossie: Dossie;
  ampliada: boolean;
  /** `null` quando a placa já ocupa a página — ver `sempreReta`. */
  onAlternarTamanho: (() => void) | null;
}) {
  const T = useT();
  const raio = 26;
  const circ = 2 * Math.PI * raio;

  return (
    <div className="relative p-4">
      <div className="flex items-start gap-2">
        <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-amber-400">
          <Sparkles size={10} />  {T("o que eu sei de você")}
        </p>

        {/* O botão fica no canto oposto ao chanfro — ali o canto é reto e o
            alvo não some sob o `clipPath`. */}
        {onAlternarTamanho && <button
          type="button"
          onClick={onAlternarTamanho}
          aria-pressed={ampliada}
          aria-label={ampliada ? T("Reduzir o dossiê") : T("Ampliar o dossiê")}
          title={ampliada ? T("Reduzir (Esc)") : T("Ampliar e deixar reto")}
          className="-mr-1 -mt-1 ml-auto shrink-0 cursor-pointer rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/[0.07] hover:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          {ampliada ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>}
      </div>

      <div className="mt-3 flex items-center gap-3.5">
        <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle cx="32" cy="32" r={raio} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="5" />
            <circle
              cx="32"
              cy="32"
              r={raio}
              fill="none"
              stroke="#f5c04e"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - dossie.confianca / 100)}
              style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.85,.3,1)" }}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-[17px] font-extrabold tabular-nums text-amber-300">
            {dossie.confianca}
            <span className="text-[9px]">%</span>
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-[13px] font-bold capitalize text-foreground">{T(dossie.qualidade)}</p>
          <p className="text-[11px] leading-snug text-white/50">{T(QUALIDADE_NOTA[dossie.qualidade])}</p>
        </div>
      </div>

      <p className="mt-3 rounded-lg border border-white/[0.07] bg-white/[0.03] p-2.5 text-[12px] leading-snug text-white/70">
        {T(dossie.resumo)}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────

function Dimensao({
  d,
  aberta,
  onToggle,
  rascunho,
  setRascunho,
  salvando,
  onSalvar,
  fotos,
  token,
  aoRecarregarFotos,
}: {
  d: DimensaoDossie;
  aberta: boolean;
  onToggle: () => void;
  rascunho: Record<string, unknown>;
  setRascunho: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  salvando: string | null;
  onSalvar: (campo: string, valor: unknown) => Promise<void>;
  fotos: FotoPersona[];
  token: string;
  aoRecarregarFotos: () => void;
}) {
  const T = useT();
  const Icone = ICONES[d.icone] || UserIcon;
  const [editandoConhecido, setEditandoConhecido] = useState<string | null>(null);

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.04] cursor-pointer"
        aria-expanded={aberta}
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ background: `${d.cor}1f`, color: d.cor }}>
          <Icone size={14} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-bold text-foreground">{T(d.titulo)}</span>
          {/* ⚠️ Zero tem textura própria. Uma barra vazia ao lado de barras
              cheias e coloridas lê como falha de carregamento, não como "ainda
              não respondido" — o estado vazio parecia defeito. */}
          <span
            className="mt-1 block h-[3px] w-full overflow-hidden rounded-full"
            style={
              d.confianca > 0
                ? { background: "rgba(255,255,255,.07)" }
                : {
                    backgroundImage:
                      "repeating-linear-gradient(90deg, rgba(255,255,255,.22) 0 3px, transparent 3px 7px)",
                  }
            }
          >
            <span
              className="block h-full rounded-full"
              style={{ width: `${d.confianca}%`, background: d.cor, transition: "width .7s cubic-bezier(.2,.85,.3,1)" }}
            />
          </span>
        </span>

        <span className="shrink-0 text-[11px] font-extrabold tabular-nums" style={{ color: d.confianca > 0 ? d.cor : "rgba(255,255,255,.45)" }}>
          {d.confianca > 0 ? `${d.confianca}%` : T("em branco")}
        </span>
        {/* O convite explícito. Sem ele, a única pista de que a placa é
            editável era o acordeão — e foi exatamente isso que passou
            despercebido por semanas. */}
        <span
          className="hidden shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide sm:inline-flex"
          style={{ borderColor: `${d.cor}40`, color: d.cor }}
        >
          <Pencil size={9} />
          {aberta ? T("editando") : T("editar")}
        </span>
        <ChevronDown size={13} className={`shrink-0 text-white/30 transition-transform ${aberta ? "rotate-180" : ""}`} />
      </button>

      {aberta && (
        <div className="px-4 pb-4">
          <p className="mb-2.5 text-[11px] leading-snug text-white/45">{T(d.paraQue)}</p>

          {d.conhecido.length > 0 && (
            <dl className="mb-3 space-y-1.5 rounded-lg border p-2.5" style={{ borderColor: `${d.cor}2e`, background: `${d.cor}0a` }}>
              {d.conhecido.map((c) => {
                const editavel = !!c.campo && !!EDITORES[c.campo];
                const emEdicao = editavel && editandoConhecido === c.campo;
                return (
                  <div key={c.rotulo}>
                    <div className="flex items-start gap-2 text-[11.5px]">
                      <dt className="w-[92px] shrink-0 font-bold uppercase tracking-wide text-white/35">{T(c.rotulo)}</dt>
                      <dd className="min-w-0 flex-1 text-white/75">{T(c.valor)}</dd>
                      {editavel && (
                        /* O botão que faltava. Preenchido, o campo saía de
                           `faltando` e virava rótulo morto — era preciso
                           adivinhar que dava para mudar. */
                        <button
                          type="button"
                          onClick={() => setEditandoConhecido((a) => (a === c.campo ? null : c.campo!))}
                          aria-expanded={emEdicao}
                          className="shrink-0 cursor-pointer rounded-md p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white"
                          title={T("Editar")}
                        >
                          {emEdicao ? <X size={11} /> : <Pencil size={11} />}
                        </button>
                      )}
                    </div>
                    {emEdicao && c.campo && (
                      <div className="mt-2">
                        <Lacuna
                          campo={c.campo}
                          pergunta={`Trocar: ${c.rotulo}`}
                          ganho={`Hoje está “${c.valor}”. O que você salvar aqui substitui isso.`}
                          cor={d.cor}
                          valor={rascunho[c.campo]}
                          setValor={(v) => setRascunho((r) => ({ ...r, [c.campo!]: v }))}
                          salvando={salvando === c.campo}
                          onSalvar={async (campo, valor) => {
                            await onSalvar(campo, valor);
                            setEditandoConhecido(null);
                          }}
                          fotos={fotos}
                          token={token}
                          aoRecarregarFotos={aoRecarregarFotos}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </dl>
          )}

          {d.faltando.length === 0 ? (
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-emerald-400">
              <Check size={13} />  {T("Nada faltando aqui — e tudo acima pode ser trocado no lápis.")}
            </p>
          ) : (
            <div className="space-y-2.5">
              {d.faltando.map((f) => (
                <Lacuna
                  key={f.campo}
                  campo={f.campo}
                  pergunta={f.pergunta}
                  ganho={f.ganho}
                  cor={d.cor}
                  valor={rascunho[f.campo]}
                  setValor={(v) => setRascunho((r) => ({ ...r, [f.campo]: v }))}
                  salvando={salvando === f.campo}
                  onSalvar={onSalvar}
                  fotos={fotos}
                  token={token}
                  aoRecarregarFotos={aoRecarregarFotos}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────

function Lacuna({
  campo,
  pergunta,
  ganho,
  cor,
  valor,
  setValor,
  salvando,
  onSalvar,
  fotos,
  token,
  aoRecarregarFotos,
}: {
  campo: string;
  pergunta: string;
  ganho: string;
  cor: string;
  valor: unknown;
  setValor: (v: unknown) => void;
  salvando: boolean;
  onSalvar: (campo: string, valor: unknown) => Promise<void>;
  fotos: FotoPersona[];
  token: string;
  aoRecarregarFotos: () => void;
}) {
  const T = useT();
  const editor = EDITORES[campo];
  if (!editor) return null;

  const rotulo = (
    <>
      <p className="text-[11.5px] font-bold leading-snug text-foreground">{T(pergunta)}</p>
      <p className="mt-0.5 text-[10.5px] leading-snug text-white/40">↳ {T(ganho)}</p>
    </>
  );

  if (editor.tipo === "foto") {
    return (
      <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-2.5">
        {rotulo}
        <VagaDeFoto vaga={editor.vaga} fotos={fotos} token={token} aoRecarregar={aoRecarregarFotos} cor={cor} />
      </div>
    );
  }

  const podeSalvar =
    editor.tipo === "itens"
      ? Array.isArray(valor) && valor.length > 0
      : editor.tipo === "escala" || editor.tipo === "numero"
        ? typeof valor === "number"
        : typeof valor === "string" && valor.trim().length > 1;

  /**
   * O toque no ladrilho.
   *
   * Lista ACUMULA (é assim que "escolha três" funciona), texto SUBSTITUI, e nos
   * dois casos o campo continua editável depois — o preset é ponto de partida,
   * não gaveta fechada. Ver o cabeçalho de `lib/persona-presets.ts`.
   */
  const escolherPreset = (op: Preset) => {
    if (editor.tipo === "itens") {
      const atual = Array.isArray(valor) ? (valor as string[]) : [];
      const texto = String(op.valor);
      const max = editor.max || 5;
      if (atual.includes(texto)) {
        setValor(atual.filter((x) => x !== texto));
      } else if (atual.length < max) {
        setValor([...atual, texto]);
      }
      return;
    }
    setValor(op.valor);
  };

  const marcado = (op: Preset) =>
    editor.tipo === "itens"
      ? Array.isArray(valor) && (valor as string[]).includes(String(op.valor))
      : valor === op.valor;

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-2.5">
      {rotulo}

      <Prateleira campo={campo} cor={cor} escolher={escolherPreset} marcado={marcado} />

      <div className="mt-2">
        {editor.tipo === "texto" && (
          <input
            value={(valor as string) || ""}
            onChange={(e) => setValor(e.target.value)}
            placeholder={T(editor.dica)}
            className="w-full rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-white/25 focus:border-amber-400/60 focus:outline-none"
          />
        )}

        {editor.tipo === "paragrafo" && (
          <textarea
            value={(valor as string) || ""}
            onChange={(e) => setValor(e.target.value)}
            rows={editor.linhas || 3}
            placeholder={T(editor.dica)}
            className="w-full resize-y rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 text-[12px] leading-relaxed text-foreground placeholder:text-white/25 focus:border-amber-400/60 focus:outline-none"
          />
        )}

        {editor.tipo === "itens" && (
          <ListaDeItens valor={(valor as string[]) || []} setValor={setValor} dica={editor.dica} max={editor.max || 5} cor={cor} />
        )}

        {editor.tipo === "escala" && (
          <div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={typeof valor === "number" ? valor : 50}
              onChange={(e) => setValor(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-white/35">
              <span>{T(editor.esquerda)}</span>
              <span>{T(editor.direita)}</span>
            </div>
          </div>
        )}

        {editor.tipo === "numero" && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={editor.min}
              max={editor.max}
              value={typeof valor === "number" ? valor : ""}
              onChange={(e) => setValor(Number(e.target.value))}
              className="w-20 rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 text-[12px] text-foreground focus:border-amber-400/60 focus:outline-none"
            />
            <span className="text-[11px] text-white/45">{T(editor.sufixo)}</span>
          </div>
        )}

        {/* ⚠️ Era `editor.tipo === T("escolha")`. Em pt-BR `T` devolve a mesma
            string e ninguém notou; em inglês devolveria a tradução e a
            comparação daria `false` — o editor de escolha simplesmente não
            apareceria. É a armadilha do codemod de i18n comparando valor
            traduzido com valor de dado. */}
        {editor.tipo === "escolha" && (
          <div className="flex flex-col gap-1.5">
            {Object.entries(editor.opcoes).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setValor(k)}
                className="rounded-md border px-2.5 py-1.5 text-left text-[11.5px] transition-colors cursor-pointer"
                style={
                  valor === k
                    ? { borderColor: cor, background: `${cor}1f`, color: "#fff" }
                    : { borderColor: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)" }
                }
              >
                {T(label)}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => onSalvar(campo, valor)}
        disabled={!podeSalvar || salvando}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-35"
        style={{ background: cor, color: "#161009" }}
      >
        {salvando ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
        
        {T("Salvar")}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────

/**
 * A prateleira de entradas prontas — o que transforma a caixa vazia em escolha.
 *
 * Some sozinha quando o campo não tem catálogo (`voz.amostra`, por exemplo:
 * amostra da SUA escrita não pode vir pronta, seria o contrário do objetivo).
 * O ladrilho tenta a arte de `/portal/persona/opts/` e, na falta dela, desenha
 * gradiente + emoji — visual de verdade, nunca quadrado quebrado, e arte nova
 * entra depois sem tocar em código.
 */
function Prateleira({
  campo,
  cor,
  escolher,
  marcado,
}: {
  campo: string;
  cor: string;
  escolher: (op: Preset) => void;
  marcado: (op: Preset) => boolean;
}) {
  const T = useT();
  const opcoes = presetsDe(campo);
  const [mostrarTudo, setMostrarTudo] = useState(false);
  if (!opcoes.length) return null;

  // Seis já preenchem duas linhas no painel estreito; o resto vem a um clique.
  const visiveis = mostrarTudo ? opcoes : opcoes.slice(0, 6);

  return (
    <div className="mt-2">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/35">
        {T("Toque para usar — depois é só editar")}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {visiveis.map((op) => (
          <Ladrilho key={String(op.valor)} campo={campo} op={op} cor={cor} marcado={marcado(op)} onClick={() => escolher(op)} />
        ))}
      </div>
      {opcoes.length > 6 && (
        <button
          type="button"
          onClick={() => setMostrarTudo((v) => !v)}
          className="mt-1.5 cursor-pointer text-[10.5px] font-bold text-white/45 underline-offset-2 hover:text-white/80 hover:underline"
        >
          {mostrarTudo ? T("mostrar menos") : `+ ${opcoes.length - 6} ${T("opções")}`}
        </button>
      )}
    </div>
  );
}

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
  // Só pede a imagem de quem já tem arte no disco — o manifesto é gerado por
  // `scripts/persona_arte_manifesto.mjs` e é por ARQUIVO, não por campo,
  // porque a arte chega em lotes e um campo atravessa vários.
  const [temArte, setTemArte] = useState(temArtePreset(campo, op.valor));

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={marcado}
      title={op.rotulo}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border text-left transition-all"
      style={{
        borderColor: marcado ? cor : "rgba(255,255,255,.09)",
        background: marcado ? `${cor}1a` : "rgba(255,255,255,.02)",
      }}
    >
      <span className="relative block aspect-[4/3] w-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${cor}33, rgba(0,0,0,.35))` }}>
        {temArte ? (
          /* eslint-disable-next-line @next/next/no-img-element -- `next/image`
             recusa caminho que pode não existir e desenha o buraco; aqui o 404
             é esperado e cai no gradiente. */
          <img
            src={artePreset(campo, op.valor)}
            alt=""
            aria-hidden
            onError={() => setTemArte(false)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        {/* A queda sem arte não é mais um emoji miúdo no meio do vazio: emoji
            grande o bastante para ser lido de relance. Ricardo, 11/08:
            "não quero emojis pequenos, quero letras mais visíveis". */}
        <span className="absolute inset-0 grid place-items-center text-[44px] leading-none" style={{ opacity: temArte ? 0 : 1 }}>
          {op.emoji}
        </span>
        {/* Véu que garante o contraste da legenda por cima da foto. */}
        {temArte && <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />}
        {marcado && (
          <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full" style={{ background: cor }}>
            <Check size={10} className="text-black" />
          </span>
        )}
      </span>
      <span className="block px-2 py-1.5 text-[12.5px] font-semibold leading-snug" style={{ color: marcado ? "#fff" : "rgba(255,255,255,.82)" }}>
        {T(op.rotulo)}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────

function ListaDeItens({
  valor,
  setValor,
  dica,
  max,
  cor,
}: {
  valor: string[];
  setValor: (v: string[]) => void;
  dica?: string;
  max: number;
  cor: string;
}) {
  const T = useT();
  const [texto, setTexto] = useState("");

  const adicionar = () => {
    const t = texto.trim();
    if (!t || valor.includes(t) || valor.length >= max) return;
    setValor([...valor, t]);
    setTexto("");
  };

  return (
    <div>
      {valor.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {valor.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: `${cor}22`, color: cor }}
            >
              {T(v)}
              <button onClick={() => setValor(valor.filter((x) => x !== v))} aria-label={`Remover ${v}`} className="cursor-pointer opacity-60 hover:opacity-100">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      {valor.length < max && (
        <div className="flex gap-1.5">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                adicionar();
              }
            }}
            placeholder={T(dica)}
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-white/25 focus:border-amber-400/60 focus:outline-none"
          />
          <button
            onClick={adicionar}
            aria-label={T("Adicionar")}
            className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-md border border-white/10 text-white/50 transition-colors hover:border-white/25 hover:text-white cursor-pointer"
          >
            <Plus size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────

function VagaDeFoto({
  vaga,
  fotos,
  token,
  aoRecarregar,
  cor,
  semMiniatura,
}: {
  vaga: TipoFoto;
  fotos: FotoPersona[];
  token: string;
  aoRecarregar: () => void;
  cor: string;
  /** Na galeria o cartão já mostra a foto grande — repetir a miniatura polui. */
  semMiniatura?: boolean;
}) {
  const T = useT();
  const [enviando, setEnviando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  const foto = fotos.find((f) => f.tipo === vaga);

  const enviar = async (arquivo: File) => {
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append("file", arquivo);
      fd.append("tipo", vaga);
      const res = await fetch("/api/user/persona-fotos", {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Não deu para enviar a foto");
        return;
      }
      toast.success(T("Foto guardada 📸"));
      aoRecarregar();
    } catch {
      toast.error(T("Erro de rede"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2.5">
      {!semMiniatura && (
        <div
          className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border"
          style={{ borderColor: foto ? cor : "rgba(255,255,255,.12)", background: "rgba(0,0,0,.3)" }}
        >
          {foto ? (
             
            <img src={foto.url} alt={`Foto ${vaga}`} className="h-full w-full object-cover" />
          ) : (
            <Camera size={16} className="text-white/25" />
          )}
        </div>
      )}

      <input
        ref={entrada}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) enviar(f);
          e.target.value = "";
        }}
      />

      <button
        onClick={() => entrada.current?.click()}
        disabled={enviando}
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
        style={{ borderColor: `${cor}55`, color: cor }}
      >
        {enviando ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
        {foto ? T("Trocar") : T("Enviar")}
      </button>

      {foto && foto.origem === "upload" && (
        <button
          onClick={async () => {
            await fetch(`/api/user/persona-fotos?tipo=${vaga}`, {
              method: "DELETE",
              credentials: "include",
              headers: { Authorization: `Bearer ${token}` },
            });
            aoRecarregar();
          }}
          aria-label={T("Remover foto")}
          className="text-white/30 transition-colors hover:text-red-400 cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

/** As quatro vagas em linha — usado na aba Persona, fora do dossiê. */
export function GaleriaDeFotos({ fotos, token, aoRecarregar }: { fotos: FotoPersona[]; token: string; aoRecarregar: () => void }) {
  const T = useT();
  const cores: Record<TipoFoto, string> = {
    perfil: "#f5c04e",
    profissional: "#38bdf8",
    casual: "#34d399",
    pessoal: "#f472b6",
  };

  const preenchidas = useMemo(() => fotos.filter((f) => TIPOS_FOTO.includes(f.tipo as TipoFoto)).length, [fotos]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <Camera size={14} className="text-pink-400" />  {T("Seu rosto")}
        </h4>
        <span className="text-[11px] text-white/40">{preenchidas}  {T("de 4")}</span>
      </div>
      <p className="mb-3 text-[11.5px] leading-snug text-white/45">
        
        {T("Cada vaga tem uma função. Sem foto sua, todo post nasce com banco de imagens — e banco de imagens não constrói marca pessoal.")}
      </p>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {TIPOS_FOTO.map((t) => {
          const foto = fotos.find((f) => f.tipo === t);
          return (
            <div key={t} className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-2">
              {/* ⚠️ Vaga vazia com borda TRACEJADA e chamada dentro do quadro.
                  Preta e lisa com uma câmera apagada no meio, ela lia como
                  imagem que falhou ao carregar — quatro delas em fila
                  pareciam quatro erros, não quatro convites. */}
              <div
                className={cn(
                  "mb-1.5 grid aspect-square w-full place-items-center overflow-hidden rounded-md border",
                  !foto && "border-dashed",
                )}
                style={{ borderColor: foto ? `${cores[t]}66` : "rgba(255,255,255,.28)", background: "rgba(0,0,0,.3)" }}
              >
                {foto ? (

                  <img src={foto.url} alt={T(ROTULO_FOTO[t].titulo)} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1 px-1 text-center">
                    <Camera size={18} className="text-white/45" />
                    <span className="text-[9px] font-semibold leading-tight text-white/45">{T("toque para enviar")}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold" style={{ color: foto ? cores[t] : "rgba(255,255,255,.5)" }}>
                {T(ROTULO_FOTO[t].titulo)}
              </p>
              <p className="mt-0.5 text-[10px] leading-tight text-white/35">
                {foto?.origem === "google" ? T("veio da sua conta Google") : ROTULO_FOTO[t].para}
              </p>
              <VagaDeFoto vaga={t} fotos={fotos} token={token} aoRecarregar={aoRecarregar} cor={cores[t]} semMiniatura />
            </div>
          );
        })}
      </div>
    </div>
  );
}
