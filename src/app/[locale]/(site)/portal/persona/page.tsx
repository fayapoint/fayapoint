"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, BookOpen, ImageIcon, Loader2, MessageSquare, Sparkles, Wand2 } from "lucide-react";
import { useT } from "@/i18n/dicionario";
import PersonaDossie, { GaleriaDeFotos } from "@/components/portal/PersonaDossie";
import { PersonaSection } from "@/components/portal/PersonaSection";
import { getClientAuthHeaders, getClientBearerToken } from "@/lib/client-auth";
import type { Dossie, FotoPersona } from "@/lib/persona";

/**
 * O Estúdio da Persona — `/portal/persona` (10/08/2026).
 *
 * ## Por que uma página inteira para isto
 *
 * A persona é o insumo de TUDO que o site entrega com a cara da pessoa: o curso
 * personalizado, as imagens do contexto dela, os posts. E morava numa placa
 * angulada de 320px na coluna lateral de uma aba chamada "Perfil Social", com
 * acordeões fechados. Ricardo, em 10/08:
 *
 * > *"o que devia ser a parte mais importante do site fica escondida, eu só vi
 * > agora quando cliquei que podia editar"*
 *
 * É a segunda vez que o mesmo diagnóstico aparece — em 03/08 foi o Ateliê, que
 * morava num `<select>` dentro de uma aba. O padrão é sempre o mesmo: a coisa
 * que dá valor ao produto nasce como detalhe de outra tela. A correção também é
 * sempre a mesma: **endereço próprio, largura inteira, e a ação visível sem
 * clique de descoberta.**
 *
 * ## O que esta página faz que a placa não fazia
 *
 * 1. **URL própria** — dá para mandar link, dá para o menu apontar, dá para o
 *    Ateliê trazer a pessoa para cá e devolver.
 * 2. **Largura** — as oito dimensões cabem abertas, com a prateleira de
 *    entradas prontas em ladrilhos ilustrados (`lib/persona-presets.ts`).
 * 3. **Consequência à vista** — o topo diz, em três blocos, o que cada ponto de
 *    confiança muda no que a pessoa recebe. Perfil sem consequência visível é
 *    formulário; com ela, é investimento.
 */
export default function EstudioDaPersonaPage() {
  const T = useT();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "pt-BR";

  const [dossie, setDossie] = useState<Dossie | null>(null);
  const [fotos, setFotos] = useState<FotoPersona[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(getClientBearerToken() || "");
  }, []);

  const carregarFotos = useCallback(async () => {
    try {
      const r = await fetch("/api/user/persona-fotos", {
        credentials: "include",
        headers: getClientAuthHeaders(),
      });
      if (!r.ok) return;
      const d = await r.json();
      setFotos(Array.isArray(d.fotos) ? d.fotos : []);
    } catch {
      /* rede — a galeria mostra as vagas vazias, que é o estado anterior */
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await fetch("/api/user/social-persona", {
          credentials: "include",
          headers: getClientAuthHeaders(),
          cache: "no-store",
        });
        if (r.status === 401) {
          router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/portal/persona`)}`);
          return;
        }
        const d = await r.json();
        if (vivo && r.ok) setDossie(d.dossie);
      } catch {
        /* rede */
      } finally {
        if (vivo) setCarregando(false);
      }
    })();
    void carregarFotos();
    return () => {
      vivo = false;
    };
  }, [locale, router, carregarFotos]);

  const confianca = dossie?.confianca ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6">
      {/* ═══ O QUE ISTO É, E O QUE MUDA ═══ */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 p-5 sm:p-7">
        {/* eslint-disable-next-line @next/next/no-img-element -- arte de fundo, sem next/image por política do projeto */}
        <img
          src="/portal/persona/vidente-hero.webp"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />

        <div className="relative">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-400">
            <Sparkles size={11} /> {T("Estúdio da persona")}
          </p>
          <h1 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">
            {T("O que a FayAI sabe")} <span className="text-amber-400">{T("sobre você")}</span>
          </h1>
          {/* Parágrafo longo em `text-white/75`, não em `muted`: cinza médio
              sobre marrom quase preto passa o mínimo de contraste por pouco e
              cansa em texto corrido. `muted` fica para metadado de uma linha. */}
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
            {T(
              "Este é o insumo de tudo que sai com a sua cara. Cada resposta aqui muda o texto dos seus cursos, os exemplos das aulas e as imagens que a gente gera para você. Toque em qualquer dimensão para editar — e use as opções prontas quando não quiser digitar.",
            )}
          </p>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
            <Consequencia
              icone={<BookOpen size={15} />}
              titulo="Nos seus cursos"
              texto="Abertura, exemplo e tarefa reescritos com o seu ramo, o seu ticket e a sua objeção"
            />
            <Consequencia
              icone={<ImageIcon size={15} />}
              titulo="Nas suas imagens"
              texto="Cenas do seu contexto e do seu público — e, com as fotos, do seu rosto"
            />
            <Consequencia
              icone={<MessageSquare size={15} />}
              titulo="No que você publica"
              texto="Seu tom, seus bordões, sua chamada no fim de cada peça"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2">
              <p className="text-[10px] uppercase tracking-wider text-amber-200/70">{T("Confiança")}</p>
              <p className="text-2xl font-black tabular-nums text-amber-300">
                {carregando ? "—" : `${confianca}%`}
              </p>
            </div>
            <Link href={`/${locale}/cursos`}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-[12.5px] font-extrabold text-black transition-opacity hover:opacity-90">
                <Wand2 size={14} />
                {T("Usar isto num curso")}
                <ArrowRight size={14} />
              </span>
            </Link>
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="mt-10 flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
        </div>
      ) : (
        /**
         * Uma coluna só, empilhada.
         *
         * ⚠️ Duas colunas foram tentadas e reprovadas duas vezes pelo mesmo
         * motivo: as peças têm alturas MUITO diferentes (o dossiê aberto passa
         * de 3000px; a galeria de fotos tem 200px), então qualquer arranjo
         * lado a lado deixa metade da tela vazia ao lado de uma coluna cheia.
         * E o construtor visual, espremido em 360px, cortava cada rótulo no
         * meio da palavra: "Tec", "Ven", "Edu".
         */
        <div className="mt-8 space-y-8">
          {/* Sem título fora do cartão: a placa já traz o próprio cabeçalho
              ("o que eu sei de você" + a nota de confiança). Dois títulos
              empilhados criavam duas hierarquias competindo no mesmo bloco. */}
          <div className="min-w-0">
            <PersonaDossie
              dossie={dossie}
              fotos={fotos}
              onSalvo={(d) => setDossie(d)}
              aoRecarregarFotos={carregarFotos}
              sempreReta
            />
          </div>

          <GaleriaDeFotos fotos={fotos} token={token} aoRecarregar={carregarFotos} />

          <PersonaSection />
        </div>
      )}
    </div>
  );
}

function Consequencia({ icone, titulo, texto }: { icone: React.ReactNode; titulo: string; texto: string }) {
  const T = useT();
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="flex items-center gap-1.5 text-[12px] font-bold text-white">
        <span className="text-amber-400">{icone}</span>
        {T(titulo)}
      </p>
      <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{T(texto)}</p>
    </div>
  );
}
