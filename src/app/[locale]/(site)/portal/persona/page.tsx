"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader2, Wand2, X } from "lucide-react";
import { useT } from "@/i18n/dicionario";
import PersonaConsole from "@/components/portal/PersonaConsole";
import { GaleriaDeFotos } from "@/components/portal/PersonaDossie";
import { PersonaSection } from "@/components/portal/PersonaSection";
import { getClientAuthHeaders, getClientBearerToken } from "@/lib/client-auth";
import type { Dossie, FotoPersona } from "@/lib/persona";

/**
 * O Estúdio da Persona — `/portal/persona`.
 *
 * ## 12/08/2026 — de rolo para console
 *
 * A primeira versão (10/08) já tinha resolvido o problema certo: a persona
 * ganhou endereço próprio em vez de morar numa placa de 320px dentro de uma
 * aba. Mas resolveu criando outro: **a página virou um rolo.** Herói alto,
 * sete acordeões, dossiê aberto passando de 3000px, galeria e construtor visual
 * embaixo. Ricardo, em 12/08:
 *
 * > *"a interface (…) fica muito longa (…) e a página não fica gigante para
 * > baixo, temos marcadores claros de onde estamos"*
 *
 * A troca: a página **não rola**. Ela é uma tela só — árvore à esquerda,
 * pergunta no centro, personagem à direita (`PersonaConsole`). O que rola, rola
 * dentro do seu painel.
 *
 * ## Onde foram parar a galeria e o construtor visual
 *
 * Para dentro de uma camada, aberta pelo botão "Fotos e visual". Não foram
 * removidos — eles continuam sendo o insumo do rosto nas imagens geradas — mas
 * empilhados abaixo do console faziam a página voltar a crescer, que é
 * exatamente o defeito que esta versão existe para consertar.
 *
 * ⚠️ O herói explicativo saiu. A consequência ("isto muda os seus cursos, as
 * suas imagens, o que você publica") virou uma linha no topo do console: quem
 * chega aqui já clicou para chegar, e três cartões de explicação custavam a
 * altura de duas perguntas.
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
  const [visual, setVisual] = useState(false);

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

  // Esc fecha a camada, e o corpo trava enquanto ela está aberta. Camada que
  // ignora Esc é armadilha de teclado; página que rola atrás dá a impressão de
  // que o clique vazou.
  useEffect(() => {
    if (!visual) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisual(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [visual]);

  return (
    /* `overflow-hidden` aqui é o que cumpre "a página não desce". A rolagem
       existe, mas dentro dos painéis do console. */
    <div className="flex h-[100dvh] flex-col overflow-hidden pt-16">
      <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 sm:px-4">
        {/* ⚠️ SAÍDA. A página ocupa 100dvh com `overflow-hidden` e some com a
            barra do site — sem este botão não há como voltar sem o botão do
            navegador. Ricardo, em 12/08: *"não conseguimos sair dessa página,
            não tem menu algum, ficamos presos"*. Tela cheia sem porta é
            armadilha, por mais bonita que seja. */}
        <Link
          href={`/${locale}/portal`}
          aria-label={T("Voltar ao portal")}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-2.5 text-[13px] font-bold text-white transition-colors hover:bg-white/[0.12]"
        >
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">{T("Portal")}</span>
        </Link>
        <h1 className="text-[17px] font-black leading-none text-white sm:text-[19px]">
          {T("O que a FayAI sabe")} <span className="text-amber-400">{T("sobre você")}</span>
        </h1>
        <p className="hidden text-[13px] text-white/65 md:block">
          {T("Cada resposta muda o texto dos seus cursos, os exemplos das aulas e as imagens que geramos.")}
        </p>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVisual(true)}
            className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 text-[13px] font-bold text-white transition-colors hover:bg-white/[0.12]"
          >
            <Camera size={15} /> {T("Fotos e visual")}
          </button>
          <Link href={`/${locale}/cursos`}>
            <span className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-3.5 text-[13px] font-extrabold text-black transition-opacity hover:opacity-90">
              <Wand2 size={15} /> {T("Usar num curso")}
            </span>
          </Link>
        </div>
      </header>

      {carregando ? (
        <div className="grid flex-1 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
        </div>
      ) : (
        <PersonaConsole dossie={dossie} onSalvo={(d) => setDossie(d)} />
      )}

      {visual && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="flex shrink-0 items-center gap-3 px-4 py-3">
            <h2 className="text-[16px] font-black text-white">{T("Fotos e visual")}</h2>
            <button
              type="button"
              onClick={() => setVisual(false)}
              aria-label={T("Fechar")}
              className="ml-auto grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-white/15 text-white hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-10">
            <GaleriaDeFotos fotos={fotos} token={token} aoRecarregar={carregarFotos} />
            <PersonaSection />
          </div>
        </div>
      )}
    </div>
  );
}
