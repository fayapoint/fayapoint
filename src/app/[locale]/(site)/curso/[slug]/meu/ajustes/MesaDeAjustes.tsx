"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Cpu,
  Eye,
  Loader2,
  PenLine,
  SlidersHorizontal,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/dicionario";
import { getClientAuthHeaders } from "@/lib/client-auth";
import type { GrupoDePrompt } from "@/lib/persona";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * A MESA DE AJUSTES — a área de customização do livro (16/08/2026)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ## Por que ela existe, sendo que o Ateliê já tinha ajustes
 *
 * Ricardo, 16/08/2026: *"o Ateliê precisa ser funcional no sentido de que
 * quando eu clico num livro para customizar, preciso ir para uma nova área de
 * customização. Onde teremos a opção de revisar o que vai ser utilizado, a
 * escolha do modelo utilizado entre outras opções (…) como a presença de emojis
 * e sobre profundidade das explicações"*.
 *
 * Os ajustes existiam — mas como a **seção 2 de 5** de uma página que também
 * vende o pacote, mostra a amostra grátis, escolhe o narrador e mede a persona.
 * Numa página que faz cinco coisas, a que decide COMO o livro é escrito
 * disputava atenção com a que decide SE ele vai ser comprado. E o livro pronto
 * levava a `/meu/livro`, que é uma tela de leitura: quem clicava no próprio
 * livro para mudar alguma coisa caía numa vitrine.
 *
 * Aqui a página faz uma coisa só, e ela tem três atos na ordem em que a dúvida
 * aparece:
 *
 *   1. **Com o que** — o que o escritor vai receber sobre você, literalmente.
 *   2. **Quem escreve** — o modelo, com ficha e custo.
 *   3. **Como escreve** — profundidade, tom, tamanho, emoji, foco.
 *
 * ## ⚠️ O ato 1 não é um resumo do prompt: é o prompt
 *
 * Os grupos vêm de `gruposDePrompt` (`lib/persona.ts`), a MESMA função que monta
 * o texto que vai para o modelo. Escrever aqui uma descrição paralela do que
 * "mais ou menos" é enviado seria pior do que não mostrar nada: a pessoa
 * revisaria e aprovaria um texto que não é o que vai ser usado, e descobriria a
 * diferença depois de gastar crédito.
 *
 * É também onde o defeito de 16/08 fica visível para sempre: o bloco do PÚBLICO
 * aparece separado, com o aviso de que aquilo é o cliente dela e não ela. Foi
 * essa mistura que fez o escritor chamar o Ricardo de *"mulher de aproximadamente
 * 35 anos"*.
 */

interface Opcao {
  id: string;
  rotulo: string;
  descricao: string;
  emoji?: string;
}

interface ModeloNaTela {
  id: string;
  nome: string;
  fabricante: string;
  oQueE: string;
  jeitoDeEscrever: string;
  velocidade: string;
  custo1M: number;
  cores: [string, string];
  imagem?: string;
}

interface Ajustes {
  tom: string;
  profundidade: string;
  extensao: string;
  foco: string[];
  narrador: string;
  emojis?: string;
  modelo?: string;
}

interface Dados {
  curso: { slug: string; titulo: string; capa: string | null; capitulos: number };
  persona: { confianca: number; qualidade: string };
  camada: { capitulos: number; completo: boolean };
  orcamento: { capitulos: number; pacotePago: string | null };
  ajustes: Ajustes;
  catalogo: {
    tons: Opcao[];
    profundidades: Opcao[];
    extensoes: Opcao[];
    focos: Opcao[];
    emojis: Opcao[];
    modelos: ModeloNaTela[];
  };
  oQueVaiSerUsado: { grupos: GrupoDePrompt[]; criticos: Record<string, string> };
  amostra: { abertura: string; exemplo: string; tarefa: string } | null;
}

/** O retrato do modelo: a arte quando existe, a identidade do catálogo quando não. */
function Retrato({ m, tamanho = 40 }: { m: ModeloNaTela; tamanho?: number }) {
  if (m.imagem) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={m.imagem}
        alt={m.nome}
        className="shrink-0 rounded-xl object-cover"
        style={{ width: tamanho, height: tamanho }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-xl font-black text-black/80"
      style={{
        width: tamanho,
        height: tamanho,
        fontSize: tamanho * 0.34,
        background: `linear-gradient(135deg, ${m.cores[0]}, ${m.cores[1]})`,
      }}
    >
      {m.nome.slice(0, 2).toUpperCase()}
    </span>
  );
}

function Titulo({ n, icone, titulo, sub }: { n: number; icone: React.ReactNode; titulo: string; sub: string }) {
  const T = useT();
  return (
    <div className="mb-3 flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-black">
        {icone}
      </span>
      <div className="min-w-0">
        <h2 className="text-[17px] font-black leading-tight text-white">
          <span className="text-amber-300">{n}.</span> {T(titulo)}
        </h2>
        <p className="mt-0.5 text-[13px] leading-snug text-white/55">{T(sub)}</p>
      </div>
    </div>
  );
}

/** Uma fileira de opções em ladrilho. A instrução de cada uma é o que muda o texto. */
function Escolha({
  titulo,
  sub,
  opcoes,
  marcado,
  aoEscolher,
}: {
  titulo: string;
  sub: string;
  opcoes: Opcao[];
  marcado: (o: Opcao) => boolean;
  aoEscolher: (o: Opcao) => void;
}) {
  const T = useT();
  return (
    <div>
      <p className="text-[13px] font-bold text-white">{T(titulo)}</p>
      <p className="mb-2 text-[12px] text-white/45">{T(sub)}</p>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => {
          const on = marcado(o);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => aoEscolher(o)}
              className={`min-w-[9rem] flex-1 rounded-xl border px-3 py-2 text-left transition-colors ${
                on
                  ? "border-amber-400/60 bg-amber-400/[0.13]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]"
              }`}
            >
              <span className={`block text-[13px] font-bold ${on ? "text-amber-100" : "text-white/85"}`}>
                {o.emoji ? `${o.emoji} ` : ""}
                {T(o.rotulo)}
              </span>
              <span className="mt-0.5 block text-[11.5px] leading-snug text-white/45">{T(o.descricao)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MesaDeAjustes({ slug, locale }: { slug: string; locale: string }) {
  const T = useT();
  const [d, setD] = useState<Dados | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [provando, setProvando] = useState(false);
  const [prova, setProva] = useState<{ abertura: string; exemplo: string; tarefa: string } | null>(null);
  /**
   * ⚠️ A prova envelhece no instante em que um ajuste muda.
   *
   * Sem esta marca, a pessoa trocaria "Só a resposta" por "O conceito inteiro" e
   * continuaria olhando o texto antigo — concluindo que o controle não faz nada.
   * Um controle que parece não funcionar é pior do que um controle ausente.
   */
  const [provaVelha, setProvaVelha] = useState(false);

  const buscar = useCallback(async () => {
    const r = await fetch(`/api/user/atelie?curso=${encodeURIComponent(slug)}`, {
      credentials: "include",
      headers: getClientAuthHeaders(),
      cache: "no-store",
    });
    if (!r.ok) return;
    const dados = (await r.json()) as Dados;
    setD(dados);
    if (dados.amostra) setProva(dados.amostra);
  }, [slug]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  /**
   * Grava otimista e volta atrás se o servidor recusar.
   *
   * A alternativa — esperar o PATCH para pintar o ladrilho — deixava um buraco
   * de meio segundo em que o clique parecia não ter acontecido, e a pessoa
   * clicava de novo em outro ladrilho.
   */
  const mudar = useCallback(
    async (mudanca: Partial<Ajustes>) => {
      if (!d) return;
      const antes = d.ajustes;
      const novos = { ...antes, ...mudanca };
      setD({ ...d, ajustes: novos });
      setProvaVelha(true);
      setSalvando(true);
      try {
        const r = await fetch("/api/user/atelie", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
          body: JSON.stringify({ curso: slug, ajustes: novos }),
        });
        if (!r.ok) {
          setD((v) => (v ? { ...v, ajustes: antes } : v));
          toast.error(T("Não deu para salvar o ajuste"));
        }
      } catch {
        setD((v) => (v ? { ...v, ajustes: antes } : v));
        toast.error(T("Erro de rede"));
      } finally {
        setSalvando(false);
      }
    },
    [d, slug, T],
  );

  const alternarFoco = (id: string) => {
    if (!d) return;
    const atual = d.ajustes.foco || [];
    const novo = atual.includes(id) ? atual.filter((f) => f !== id) : atual.length >= 3 ? atual : [...atual, id];
    mudar({ foco: novo });
  };

  /** A prova: um capítulo escrito com os ajustes de AGORA. Nunca cobra. */
  const provar = async () => {
    setProvando(true);
    try {
      const r = await fetch("/api/user/atelie", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ curso: slug, refazer: true }),
      });
      const j = await r.json();
      if (!r.ok) {
        toast.error(j?.error || T("Não deu para escrever a prova agora"));
        return;
      }
      // ⚠️ O POST devolve `{ amostra: <documento> }`, não as três peças soltas.
      const a = j?.amostra;
      if (!a?.abertura) {
        toast.error(T("O modelo não respondeu. Nada foi cobrado — tente de novo."));
        return;
      }
      setProva({ abertura: a.abertura, exemplo: a.exemplo, tarefa: a.tarefa });
      setProvaVelha(false);
    } catch {
      toast.error(T("Erro de rede"));
    } finally {
      setProvando(false);
    }
  };

  /**
   * Quantos campos críticos ainda estão sem resposta.
   *
   * ⚠️ `emBranco` é o que separa "a linha existe" de "a linha tem dado": a do
   * tratamento existe SEMPRE (é ela que manda o escritor não chutar gênero), e
   * contá-la como preenchida esconderia justamente o campo que originou o
   * "mulher de aproximadamente 35 anos".
   */
  const criticosEmBranco = useMemo(() => {
    if (!d) return [] as string[];
    const respondidos = new Set(
      d.oQueVaiSerUsado.grupos
        .flatMap((g) => g.linhas)
        .filter((l) => l.campo && !l.emBranco)
        .map((l) => l.campo as string),
    );
    return Object.keys(d.oQueVaiSerUsado.criticos).filter((c) => !respondidos.has(c));
  }, [d]);

  if (!d) {
    return (
      <div className="grid min-h-[70dvh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    );
  }

  const faltam = Math.max(0, d.orcamento.capitulos - d.camada.capitulos);
  const pago = !!d.orcamento.pacotePago;
  const modeloAtual = d.ajustes.modelo || "auto";

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-24">
      <Link
        href={`/${locale}/curso/${slug}/meu`}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-white/60 hover:text-white"
      >
        <ArrowLeft size={14} /> {T("Ateliê")}
      </Link>

      {/* ─── A CAPA ─── */}
      <div className="overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.12] via-white/[0.03] to-transparent p-6 sm:p-8">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-300">
          {T("A mesa de ajustes")}
        </p>
        <h1 className="mt-1.5 text-[26px] font-black leading-[1.1] text-white sm:text-[36px]">
          {T("Como escrever o seu")} {T(d.curso.titulo)}
        </h1>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-white/70">
          {T(
            "Tudo aqui muda o texto que sai — nenhuma opção nesta página é enfeite. Você pode conferir o efeito de cada escolha antes de gastar um crédito, quantas vezes quiser.",
          )}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-white/50">
          <span>
            {d.camada.capitulos}/{d.orcamento.capitulos} {T("capítulos escritos")}
          </span>
          <span aria-hidden>·</span>
          <span>
            {T("eu te conheço")} {d.persona.confianca}%
          </span>
          {salvando && (
            <span className="inline-flex items-center gap-1 text-amber-300">
              <Loader2 size={11} className="animate-spin" /> {T("salvando")}
            </span>
          )}
        </div>
      </div>

      {/* ═══ 1. COM O QUE ═══ */}
      <section className="mt-8">
        <Titulo
          n={1}
          icone={<Eye size={15} />}
          titulo="O que vai ser usado sobre você"
          sub="Isto não é um resumo do que mandamos ao escritor. É, palavra por palavra, o que ele vai receber."
        />

        {criticosEmBranco.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/45 bg-amber-400/[0.09] px-4 py-3">
            <AlertTriangle size={17} className="shrink-0 text-amber-300" />
            <p className="min-w-0 flex-1 text-[13px] leading-snug text-amber-100">
              <strong className="font-extrabold">
                {criticosEmBranco.length} {criticosEmBranco.length === 1 ? T("informação crítica em branco") : T("informações críticas em branco")}
              </strong>{" "}
              {T("— são as que mais mudam o texto. Em branco, o escritor preenche o buraco sozinho.")}
            </p>
            <Link
              href={`/${locale}/portal/persona`}
              className="shrink-0 rounded-xl bg-amber-400 px-3.5 py-2 text-[13px] font-extrabold text-black hover:opacity-90"
            >
              {T("Responder")}
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {d.oQueVaiSerUsado.grupos.map((g) => {
            /* O bloco do público ganha cor própria. É o que separa visualmente
               "isto é você" de "isto são os seus clientes" — a confusão que
               produziu o texto que chamou o Ricardo de mulher de 35 anos. */
            const dele = g.id === "publico";
            return (
              <div
                key={g.id}
                className={`rounded-2xl border p-4 ${
                  dele ? "border-sky-400/30 bg-sky-400/[0.05]" : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <p
                  className={`text-[11px] font-extrabold uppercase tracking-wider ${
                    dele ? "text-sky-300" : "text-amber-300/80"
                  }`}
                >
                  {g.titulo}
                </p>
                {g.aviso && (
                  <p className={`mt-1 text-[11.5px] leading-snug ${dele ? "text-sky-100/70" : "text-white/40"}`}>
                    {g.aviso}
                  </p>
                )}
                <dl className="mt-2.5 space-y-1.5">
                  {g.linhas.map((l, i) => (
                    <div key={`${l.rotulo}-${i}`} className="flex flex-wrap gap-x-2 text-[13px] leading-snug">
                      <dt className="shrink-0 font-bold text-white/55">
                        {l.rotulo}
                        {l.critico && <span className="ml-1 text-amber-400" title={T("informação crítica")}>*</span>}
                      </dt>
                      <dd
                        className={`min-w-0 flex-1 whitespace-pre-wrap ${
                          l.emBranco ? "text-amber-200/70" : "text-white/85"
                        }`}
                      >
                        {l.valor}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })}
        </div>

        <p className="mt-2 text-[12.5px] text-white/45">
          {T("Alguma coisa está errada ou faltando?")}{" "}
          <Link href={`/${locale}/portal/persona`} className="font-bold text-amber-300 hover:underline">
            {T("Corrigir no console da persona")}
          </Link>
        </p>
      </section>

      {/* ═══ 2. QUEM ESCREVE ═══ */}
      <section className="mt-10">
        <Titulo
          n={2}
          icone={<Cpu size={15} />}
          titulo="Quem escreve"
          sub="Cada modelo escreve de um jeito. Você fixa um, ou deixa a gente trocar sozinho quando um deles falha."
        />
        <div className="grid gap-2.5 sm:grid-cols-2">
          {d.catalogo.modelos.map((m) => {
            const on = modeloAtual === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => mudar({ modelo: m.id })}
                className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                  on
                    ? "border-amber-400/60 bg-amber-400/[0.11]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]"
                }`}
              >
                <Retrato m={m} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className={`text-[13.5px] font-bold ${on ? "text-amber-100" : "text-white"}`}>{m.nome}</span>
                    <span className="text-[11px] text-white/35">{m.fabricante}</span>
                    {on && <Check size={13} className="text-amber-300" />}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-white/60">{m.oQueE}</span>
                  <span className="mt-1 block text-[11.5px] leading-snug text-white/40">{m.jeitoDeEscrever}</span>
                  <span className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-white/35">
                    <span>{T(m.velocidade)}</span>
                    {m.custo1M > 0 && <span>US$ {m.custo1M}/1M {T("de saída")}</span>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {modeloAtual !== "auto" && (
          <p className="mt-2 text-[12px] leading-snug text-white/45">
            {T(
              "Fixado. Se ele estiver fora do ar ou devolver o capítulo vazio, outro assume no lugar em vez de o livro parar — e a ficha técnica do livro mostra quem escreveu cada capítulo.",
            )}
          </p>
        )}
      </section>

      {/* ═══ 3. COMO ESCREVE ═══ */}
      <section className="mt-10">
        <Titulo
          n={3}
          icone={<SlidersHorizontal size={15} />}
          titulo="Como escreve"
          sub="A persona diz quem você é. Aqui você diz como quer ESTE curso — as pontas da profundidade produzem cursos que ninguém diria que são o mesmo."
        />
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <Escolha
            titulo="A profundidade das explicações"
            sub="De “só me diga o que fazer” até “me ensine o conceito e onde ele falha”"
            opcoes={d.catalogo.profundidades}
            marcado={(o) => d.ajustes.profundidade === o.id}
            aoEscolher={(o) => mudar({ profundidade: o.id })}
          />
          <Escolha
            titulo="O tom"
            sub="Como o texto conversa com você"
            opcoes={d.catalogo.tons}
            marcado={(o) => d.ajustes.tom === o.id}
            aoEscolher={(o) => mudar({ tom: o.id })}
          />
          <Escolha
            titulo="Emoji"
            sub="Quanto emoji entra no texto que escrevemos para você"
            opcoes={d.catalogo.emojis}
            marcado={(o) => (d.ajustes.emojis || "espelho") === o.id}
            aoEscolher={(o) => mudar({ emojis: o.id })}
          />
          <Escolha
            titulo="O tamanho"
            sub="Quanto texto novo entra em cada capítulo"
            opcoes={d.catalogo.extensoes}
            marcado={(o) => d.ajustes.extensao === o.id}
            aoEscolher={(o) => mudar({ extensao: o.id })}
          />
          <Escolha
            titulo="O foco"
            sub={`Até 3 — para onde todo exemplo é puxado (${(d.ajustes.foco || []).length}/3)`}
            opcoes={d.catalogo.focos}
            marcado={(o) => (d.ajustes.foco || []).includes(o.id)}
            aoEscolher={(o) => alternarFoco(o.id)}
          />
        </div>
      </section>

      {/* ═══ 4. A PROVA ═══ */}
      <section className="mt-10">
        <Titulo
          n={4}
          icone={<Sparkles size={15} />}
          titulo="Veja o efeito antes de gastar"
          sub="Um capítulo escrito com os ajustes desta tela. Não custa crédito nenhum, e pode ser refeito quantas vezes você quiser."
        />

        {provaVelha && prova && (
          <p className="mb-2 rounded-xl border border-sky-400/30 bg-sky-400/[0.07] px-3 py-2 text-[12.5px] text-sky-100/85">
            {T("Você mudou um ajuste — o texto abaixo ainda é o anterior. Refazer é de graça.")}
          </p>
        )}

        <button
          type="button"
          onClick={provar}
          disabled={provando}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2.5 text-[14px] font-extrabold text-black hover:opacity-90 disabled:opacity-60"
        >
          {provando ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
          {provando ? T("Escrevendo…") : prova ? T("Refazer com estes ajustes") : T("Escrever um capítulo de prova")}
        </button>

        {prova && (
          <div className={`mt-3 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${provaVelha ? "opacity-55" : ""}`}>
            {[
              { r: T("A abertura"), t: prova.abertura },
              { r: T("O exemplo"), t: prova.exemplo },
              { r: T("A tarefa"), t: prova.tarefa },
            ]
              .filter((b) => b.t)
              .map((b) => (
                <div key={b.r}>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-amber-300/70">{b.r}</p>
                  <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-white/80">{b.t}</p>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* ═══ A SAÍDA ═══ */}
      <div className="mt-10 flex flex-wrap gap-2.5 border-t border-white/10 pt-6">
        {faltam > 0 && (
          <Link
            href={`/${locale}/curso/${slug}/meu/escrevendo?pacote=${d.orcamento.pacotePago || "escrito"}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2.5 text-[14px] font-extrabold text-black hover:opacity-90"
          >
            <PenLine size={15} />
            {pago
              ? `${T("Continuar — faltam")} ${faltam}, ${T("já pagos")}`
              : `${T("Escrever os")} ${faltam} ${T("que faltam")}`}
            <ArrowRight size={14} />
          </Link>
        )}
        {d.camada.capitulos > 0 && (
          <Link
            href={`/${locale}/curso/${slug}/meu/livro`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-[14px] font-bold text-white hover:bg-white/10"
          >
            <BookOpen size={15} /> {T("Abrir o livro")}
          </Link>
        )}
      </div>

      {/* ⚠️ A frase que evita a pergunta mais cara do suporte. Mudar um ajuste
          NÃO reescreve o que já existe — e sem dizer isso, a pessoa mexe em tudo
          e conclui que os controles não funcionam, quando o que ela precisa é
          apertar "regerar" no capítulo. */}
      {d.camada.capitulos > 0 && (
        <p className="mt-3 text-[12.5px] leading-snug text-white/45">
          {T("Os capítulos já escritos continuam como estão — mudar um ajuste não reescreve o passado. Para aplicar as mudanças a um capítulo pronto, use “regerar este capítulo” no")}{" "}
          <Link href={`/${locale}/curso/${slug}/meu/livro`} className="font-bold text-amber-300 hover:underline">
            {T("sumário do livro")}
          </Link>
          {T(" — em curso já pago, regerar não cobra de novo.")}
        </p>
      )}
    </div>
  );
}
