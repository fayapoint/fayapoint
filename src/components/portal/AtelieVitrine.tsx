"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Coins, Sparkles, ArrowRight, Loader2, User2, Wand2, BookOpen, Check } from "lucide-react";
import { useT } from "@/i18n/dicionario";
import { getClientAuthHeaders } from "@/lib/client-auth";

/**
 * A vitrine do Ateliê — escolher QUAL curso ganha a sua cara.
 *
 * ## O problema que ela resolve
 *
 * Ricardo, 10/08/2026: *"um display bonito tipo shopping center para o usuário
 * trocar o curso para a persona dele, com imagens bonitas e significativas que
 * descrevam os passos, tipo um banner de verdade e bem desenhado com as
 * informações dele"*.
 *
 * O Ateliê existe e é bom, mas mora em `/curso/<slug>/meu` — **dentro** de um
 * curso. Para chegar lá é preciso já ter escolhido o curso, o que inverte a
 * ordem da decisão: a pessoa quer ver o que dá para transformar antes de
 * escolher o que transformar. Antes disso o produto era um `<select>` do
 * sistema operacional, que o Ricardo achou por acaso e chamou de "jogado, como
 * se não fosse nada".
 *
 * ## ⚠️ Por que o texto dos passos NÃO está dentro das imagens
 *
 * O pedido foi "imagens com texto nelas". Aqui o texto é HTML por cima da
 * imagem, e a diferença importa por três razões medidas nesta casa:
 *
 * 1. **Texto embutido não se traduz.** O site tem duas árvores de idioma; uma
 *    arte com "STEP 1" fica errada em português para sempre.
 * 2. **O gerador carimba em inglês sem pedir licença.** Já aconteceu: duas das
 *    três primeiras artes voltaram com rótulos em inglês num curso em
 *    português, e "no text" não segura o modelo.
 * 3. **Texto renderizado é nítido em qualquer tela** e legível por leitor de
 *    voz; texto rasterizado embaça no retina e some para quem usa acessibilidade.
 *
 * O resultado é o mesmo banner desenhado — imagem de verdade, tipografia de
 * verdade — sem herdar nenhum dos três problemas.
 *
 * ## ⚠️ `<img>` para o que vem de fora, `<Image>` para o que é nosso
 *
 * As capas dos cursos moram no Cloudinary e o `next.config.ts` **não declara
 * `images.remotePatterns`**. `next/image` recusa host não declarado, e o
 * sintoma é o pior possível: o card aparece com o buraco no lugar da capa, sem
 * erro no console e sem quebrar o build. Foi o que aconteceu na primeira
 * versão desta tela. A arte dos passos é servida por nós, do mesmo domínio, e
 * continua no `next/image` — que aí otimiza de verdade.
 */

interface CursoVitrine {
  slug: string;
  titulo: string;
  capa: string | null;
  nivel: string | null;
  capitulos: number | null;
  custo: number | null;
  /** Capítulos JÁ escritos. > 0 = existe livro, e o cartão muda de assunto. */
  escritos?: number;
}

interface Resposta {
  cursos: CursoVitrine[];
  saldo?: number;
  /**
   * ⚠️ `precoPorCapitulo` saiu em 11/08: o preço virou por CURSO, em degraus.
   * A vitrine mostra o degrau de entrada, que é o mesmo número para todos os
   * cursos — e é justamente isso que um preço de tabela compra.
   */
  pacotes?: Array<{ id: string; titulo: string; creditos: number; emBreve?: boolean }>;
}

/** As três etapas, com a arte aprovada da casa como fundo. */
const PASSOS = [
  {
    n: 1,
    titulo: "Sua persona",
    texto: "O site já sabe como você escreve e do que você vive. Quanto mais completo o dossiê, mais o curso soa como você.",
    arte: "/cursos/media/chatgpt-zero/inline/cap01-intencao.webp",
    icone: User2,
  },
  {
    n: 2,
    titulo: "Escolha o curso",
    texto: "Qualquer curso do seu acervo. O preço é do CURSO inteiro, pago uma vez — você vê o total antes de gastar um crédito.",
    arte: "/cursos/media/chatgpt-zero/inline/cap02-fluxo.webp",
    icone: BookOpen,
  },
  {
    n: 3,
    titulo: "Ele vira seu",
    texto: "Cada capítulo é reescrito com os seus exemplos, o seu setor e as suas palavras. O original continua lá, intacto.",
    arte: "/cursos/media/chatgpt-zero/inline/cap03-sistema.webp",
    icone: Wand2,
  },
];

export function AtelieVitrine({ nome, avatar }: { nome?: string; avatar?: string | null }) {
  const T = useT();
  const [d, setD] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await fetch("/api/user/curso-personalizado", {
          headers: getClientAuthHeaders(),
          credentials: "include",
          cache: "no-store",
        });
        if (r.ok && vivo) setD(await r.json());
      } catch {
        /* sem lista a vitrine some — ver abaixo */
      } finally {
        if (vivo) setCarregando(false);
      }
    })();
    return () => { vivo = false; };
  }, []);

  if (carregando) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 size={15} className="animate-spin" /> {T("Abrindo o Ateliê…")}
      </div>
    );
  }

  const cursos = d?.cursos || [];

  return (
    <div className="space-y-8">
      {/* ── O banner, com as informações DELE ────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/20">
        <Image
          src="/cursos/media/chatgpt-zero/cap-01.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* A cortina existe para o texto ter contraste garantido sobre
            QUALQUER arte — sem ela o título depende da sorte do enquadramento. */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/40" />

        <div className="relative flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
              <Sparkles size={12} /> {T("O Ateliê")}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl">
              {nome ? (
                <>
                  {T("O curso reescrito para")}{" "}
                  <span className="text-amber-300">{nome.split(" ")[0]}</span>
                </>
              ) : (
                T("O curso reescrito para você")
              )}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              {T("Mesmo conteúdo, seus exemplos. Cada capítulo passa a falar do seu trabalho, com as suas palavras — e o curso original continua intacto ao lado.")}
            </p>
          </div>

          {/* O saldo dele, no banner, porque é a informação que decide */}
          <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-border bg-background/70 p-4 backdrop-blur">
            {avatar && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatar}
                alt=""
                referrerPolicy="no-referrer"
                className="h-11 w-11 shrink-0 rounded-full object-cover"
              />
            )}
            <div>
              <div className="flex items-baseline gap-1.5">
                <Coins size={15} className="text-amber-400" />
                <span className="text-2xl font-extrabold tabular-nums text-amber-300">
                  {d?.saldo ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">{T("créditos")}</span>
              </div>
              <Link
                href="/portal/conta?tab=assinatura"
                className="text-[11px] text-muted-foreground underline-offset-2 hover:text-amber-300 hover:underline"
              >
                {T("comprar mais")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Os três passos, como banner ilustrado ────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        {PASSOS.map((p) => {
          const Icone = p.icone;
          return (
            <div
              key={p.n}
              className="group relative overflow-hidden rounded-2xl border border-border bg-secondary/20"
            >
              <div className="relative h-32 overflow-hidden">
                <Image
                  src={p.arte}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/95 via-secondary/40 to-transparent" />
                <span className="absolute left-4 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-sm font-extrabold text-black">
                  {p.n}
                </span>
              </div>
              <div className="p-4 pt-2">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <Icone size={14} className="text-amber-400" />
                  {T(p.titulo)}
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{T(p.texto)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── A prateleira ─────────────────────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold">{T("Escolha o que vai ganhar a sua cara")}</h2>
          {d?.pacotes?.[0] && (
            <span className="text-xs text-muted-foreground">
              {T("a partir de")} {d.pacotes[0].creditos} {T("créditos por curso")}
            </span>
          )}
        </div>

        {cursos.length === 0 ? (
          // ⚠️ Vitrine vazia é o caso mais comum de quem acabou de chegar. Dizer
          // "nenhum curso" e parar seria um beco: o passo seguinte é a
          // biblioteca, então o beco vira porta.
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {T("Você ainda não tem cursos no acervo — é deles que o Ateliê parte.")}
            </p>
            <Link
              href="/portal?tab=courses"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-200 transition-colors hover:bg-amber-500/20"
            >
              <BookOpen size={14} /> {T("Ver a biblioteca")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cursos.map((c) => {
              const podePagar = c.custo != null && (d?.saldo ?? 0) >= c.custo;
              /**
               * ⚠️ Curso com livro pronto NÃO é oferta.
               *
               * O cartão nasceu para vender a personalização, e continuou
               * mostrando preço e "dá para fazer" depois de o livro existir e
               * estar pago — o que fez o livro sumir justamente de quem o
               * comprou: *"entrei e não vi o livro no ateliê e nem na minha
               * seção de cursos"*. Quando há capítulo escrito, o cartão troca
               * de assunto: leva ao livro, não à compra.
               */
              const temLivro = (c.escritos || 0) > 0;
              return (
                <Link
                  key={c.slug}
                  href={temLivro ? `/curso/${c.slug}/meu/livro` : `/curso/${c.slug}/meu`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-secondary/20 transition-all hover:-translate-y-0.5 hover:border-amber-400/50"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                    {c.capa ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={c.capa}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen size={28} className="text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent" />
                    {c.nivel && !temLivro && (
                      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                        {T(c.nivel)}
                      </span>
                    )}
                    {temLivro && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black">
                        <BookOpen size={10} /> {T("o seu livro")}
                      </span>
                    )}
                    <h3 className="absolute inset-x-3 bottom-2.5 line-clamp-2 text-sm font-bold leading-tight text-white">
                      {T(c.titulo)}
                    </h3>
                  </div>

                  <div className="flex flex-1 items-center justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      {temLivro ? (
                        <>
                          <p className="text-lg font-extrabold tabular-nums text-amber-300">
                            {c.escritos}
                            {c.capitulos ? <span className="text-muted-foreground">/{c.capitulos}</span> : null}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {T("capítulos com a sua cara")}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1">
                            <Coins size={13} className="shrink-0 text-amber-400" />
                            <span className="text-lg font-extrabold tabular-nums text-amber-300">
                              {c.custo ?? "—"}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {c.capitulos ? `${c.capitulos} ${T("capítulos")}` : T("sob consulta")}
                          </p>
                        </>
                      )}
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                        temLivro
                          ? "bg-amber-400 text-black group-hover:opacity-90"
                          : podePagar
                            ? "bg-amber-500/15 text-amber-200 group-hover:bg-amber-500/25"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {temLivro ? <BookOpen size={12} /> : podePagar ? <Check size={12} /> : <Coins size={12} />}
                      {temLivro ? T("abrir o livro") : podePagar ? T("dá para fazer") : T("ver")}
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
