"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowRight, BookOpen, PenLine, SlidersHorizontal, Sparkles, Wand2 } from "lucide-react";
import { useT } from "@/i18n/dicionario";
import { getClientAuthHeaders } from "@/lib/client-auth";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * A FAIXA DO ATELIÊ — o topo do dashboard (16/08/2026)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Ricardo: *"precisamos dar destaque a essa funcionalidade, no início do
 * dashboard."*
 *
 * O Ateliê é a razão de existir do site e no dashboard ele era **uma aba na
 * barra lateral** — o mesmo destaque de "Recompensas" e menos destaque do que o
 * arcade. Quem entrava e não sabia que o produto existe continuava sem saber.
 *
 * ## ⚠️ Ela mostra ESTADO, não propaganda
 *
 * Uma faixa que dissesse sempre a mesma frase bonita ("transforme seus cursos!")
 * seria ignorada na segunda visita — e, pior, apareceria idêntica para quem já
 * pagou e tem um livro parado no meio. Então ela tem três formas, e a diferença
 * entre elas é a única coisa que justifica ocupar o lugar mais caro da tela:
 *
 *   - **interrompido** — há livro começado e não terminado. É o estado com
 *     dinheiro parado, e por isso ganha cor de alerta e vem antes de tudo.
 *   - **pronto** — há livro completo. A faixa vira a porta para lê-lo.
 *   - **convite** — não há nada escrito. Aí sim ela explica o que é.
 *
 * ## Por que ela mesma busca os dados
 *
 * `/api/user/curso-personalizado` (GET) é a mesma fonte da vitrine do Ateliê:
 * a lista dos cursos do acervo com quantos capítulos já foram escritos em cada
 * um. Passar isso pelo `page.tsx` do portal significaria mais uma prop
 * atravessando três componentes, e um número que precisa concordar com a
 * vitrine tem de vir da mesma rota que a vitrine usa — não de uma cópia que
 * envelhece.
 *
 * ⚠️ Enquanto carrega, ela não desenha NADA (nem esqueleto). Um bloco cinza de
 * 120px pulando no topo do dashboard a cada visita é pior que meio segundo de
 * ausência — e o conteúdo abaixo não depende dela para se posicionar.
 */

interface CursoVitrine {
  slug: string;
  titulo: string;
  capa: string | null;
  capitulos: number | null;
  custo: number | null;
  escritos?: number;
}

/**
 * ⚠️ `onAbrir` recebe o SLUG (16/08/2026).
 *
 * Ricardo, com a tela aberta: *"se eu clicar em editar livro, tenho que ir pro
 * ateliê com este livro aberto e com as opções para ele"*. Antes, "Abrir o
 * livro" e "Customizar" eram `<Link>` para fora do portal
 * (`/curso/<slug>/meu/livro` e `/meu/ajustes`) — o aluno saía do dashboard
 * para mexer no próprio livro. Agora abrem o Ateliê JÁ nesse livro.
 */
export function FaixaAtelie({ onAbrir }: { onAbrir: (slug?: string) => void }) {
  const T = useT();
  const [cursos, setCursos] = useState<CursoVitrine[] | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await fetch("/api/user/curso-personalizado", {
          headers: getClientAuthHeaders(),
          credentials: "include",
          cache: "no-store",
        });
        if (!r.ok || !vivo) return;
        const d = await r.json();
        if (vivo) setCursos(Array.isArray(d?.cursos) ? d.cursos : []);
      } catch {
        /* sem lista, a faixa some — ver a nota acima */
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  if (!cursos) return null;

  const comLivro = cursos.filter((c) => (c.escritos || 0) > 0);
  /**
   * O curso que a faixa aponta.
   *
   * ⚠️ A prioridade é do INTERROMPIDO, não do mais recente: é o único estado em
   * que a pessoa já pagou e não recebeu. Entre dois interrompidos, o que está
   * mais perto do fim — é o que custa menos para virar entrega.
   */
  const interrompidos = comLivro.filter((c) => (c.escritos || 0) < (c.capitulos || 0));
  const alvo =
    interrompidos.sort(
      (a, b) => (b.escritos || 0) / (b.capitulos || 1) - (a.escritos || 0) / (a.capitulos || 1),
    )[0] || comLivro[0];

  const estado: "interrompido" | "pronto" | "convite" = !alvo
    ? "convite"
    : (alvo.escritos || 0) < (alvo.capitulos || 0)
      ? "interrompido"
      : "pronto";

  const faltam = alvo ? Math.max(0, (alvo.capitulos || 0) - (alvo.escritos || 0)) : 0;

  const paleta =
    estado === "interrompido"
      ? "border-orange-400/45 from-orange-500/[0.14] via-orange-500/[0.04]"
      : "border-amber-400/35 from-amber-500/[0.14] via-amber-500/[0.03]";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-r to-transparent ${paleta}`}
    >
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-amber-500/[0.10] blur-[70px]" />

      <div className="relative flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 md:p-5">
        {/* A capa do curso alvo — quando existe, ela é a prova de que a faixa
            fala de algo DELE, e não de um produto genérico. */}
        {alvo?.capa ? (
          /* eslint-disable-next-line @next/next/no-img-element -- Cloudinary não está em `images.remotePatterns`; ver a nota em AtelieVitrine */
          <img
            src={alvo.capa}
            alt=""
            loading="lazy"
            className="hidden h-16 w-16 shrink-0 rounded-xl object-cover sm:block"
          />
        ) : (
          <span className="hidden h-16 w-16 shrink-0 place-items-center rounded-xl bg-amber-500/15 sm:grid">
            <Wand2 size={24} className="text-amber-300" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
            <Sparkles size={10} /> {T("O Ateliê")}
          </span>

          <p className="mt-1.5 text-[16px] font-black leading-tight text-white md:text-[18px]">
            {estado === "interrompido" && (
              <>
                {T("Seu livro parou em")} {alvo.escritos}
                {T(" de ")}
                {alvo.capitulos} — {T("faltam")} {faltam}
              </>
            )}
            {estado === "pronto" && (
              <>
                {T("O seu")} <span className="text-amber-300">{T(alvo.titulo)}</span> {T("está escrito")}
              </>
            )}
            {estado === "convite" && T("Transforme qualquer curso no SEU curso")}
          </p>

          <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
            {estado === "interrompido" &&
              T("A escrita foi interrompida. Continuar não cobra de novo — o pacote deste curso já é seu.")}
            {estado === "pronto" &&
              T("Cada capítulo com os seus exemplos e o seu setor. Dá para ler, compartilhar por link, e mudar como ele é escrito.")}
            {estado === "convite" &&
              T("Cada capítulo reescrito com o seu negócio, os seus números e as suas palavras. O curso original continua intacto ao lado.")}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {estado === "interrompido" && (
            <Link
              href={`/curso/${alvo.slug}/meu/escrevendo`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-400 px-3.5 py-2 text-[13px] font-extrabold text-black hover:opacity-90"
            >
              <PenLine size={14} /> {T("Continuar")} <ArrowRight size={13} />
            </Link>
          )}
          {estado === "pronto" && (
            <button
              type="button"
              onClick={() => onAbrir(alvo.slug)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-[13px] font-extrabold text-black hover:opacity-90"
            >
              <BookOpen size={14} /> {T("Abrir o livro")}
            </button>
          )}
          {alvo && (
            <button
              type="button"
              onClick={() => onAbrir(alvo.slug)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3.5 py-2 text-[13px] font-bold text-white hover:bg-white/10"
            >
              <SlidersHorizontal size={13} /> {T("Customizar")}
            </button>
          )}
          <button
            type="button"
            onClick={() => onAbrir()}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-extrabold ${
              estado === "convite"
                ? "bg-amber-400 text-black hover:opacity-90"
                : "border border-white/15 text-white hover:bg-white/10"
            }`}
          >
            {estado === "convite" ? (
              <>
                <Wand2 size={14} /> {T("Ver o Ateliê")} <ArrowRight size={13} />
              </>
            ) : (
              T("Todos os cursos")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
