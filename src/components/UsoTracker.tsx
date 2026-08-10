"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * O medidor: banda consumida, área visitada e **tempo ativo** em cada uma.
 *
 * ## 1. A banda, medida onde ela acontece
 *
 * `PerformanceResourceTiming.transferSize` = bytes que **cruzaram a rede**.
 * Recurso servido do cache vem com 0 — que é a resposta certa para "quanto isso
 * custou de banda", e é impossível de obter no servidor, porque imagem e vídeo
 * do curso saem do CDN e nunca passam por uma rota nossa.
 *
 * ## 2. ⚠️ Tempo ATIVO, não tempo de relógio
 *
 * A pergunta é "quanto tempo passou em cada área". Contar do momento em que a
 * tela abriu até o momento em que fechou responde outra coisa: a aba esquecida
 * aberta a noite inteira marcaria **8 horas de leitura atenta**, e essa única
 * sessão afundaria a média de todas as outras.
 *
 * Aqui o cronômetro **para quando a aba fica oculta e recomeça quando volta**.
 * O número que sai é tempo com a tela à frente da pessoa — subestima quem
 * deixou o navegador aberto lendo, e é o erro certo a cometer: ninguém decide
 * preço com uma métrica inflada.
 *
 * ## 3. ⚠️ O portal troca de aba sem trocar de URL
 *
 * `/pt-BR/portal` é a mesma string para as 18 telas do portal — a aba vive em
 * estado do React. `usePathname()` nunca dispara, e toda a sessão viraria um
 * ponto só. Por isso o portal passou a publicar a aba na URL e a avisar por um
 * evento (`fayai:area`), que é o que este componente escuta.
 *
 * ## 4. ⚠️ `sendBeacon` no `visibilitychange`
 *
 * O envio final acontece quando a pessoa sai. `fetch` nesse instante é
 * cancelado junto com a página e o evento se perde — pior, se perde nas visitas
 * curtas, que são a maioria. E o gatilho é `visibilitychange`, não
 * `beforeunload`: no iOS/Safari o `beforeunload` frequentemente não dispara, e
 * todo o tráfego de celular sumiria do relatório sem ninguém notar a ausência.
 */

const TIPOS: Record<string, string> = {
  navigation: "document",
  script: "script",
  link: "style",
  css: "style",
  img: "image",
  image: "image",
  video: "media",
  audio: "media",
  font: "font",
  fetch: "fetch",
  xmlhttprequest: "fetch",
};

/** Nome do evento que o portal dispara ao trocar de aba. */
export const EVENTO_AREA = "fayai:area";

function idDeSessao(): string {
  try {
    const CHAVE = "fayai-uso-sessao";
    let id = sessionStorage.getItem(CHAVE);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(CHAVE, id);
    }
    return id;
  } catch {
    return "";
  }
}

function abaAtual(): string | null {
  try {
    return new URLSearchParams(window.location.search).get("tab");
  } catch {
    return null;
  }
}

export function UsoTracker() {
  const pathname = usePathname();

  // Quantos recursos já foram contabilizados. O App Router não recarrega a
  // página, então a lista de `PerformanceResourceTiming` não zera entre
  // navegações — sem este marcador, a segunda tela contaria os recursos da
  // primeira de novo.
  const jaContados = useRef(0);

  const rota = useRef("");
  const aba = useRef<string | null>(null);
  const sessao = useRef("");

  // O cronômetro de tempo ativo.
  const ativoAcumulado = useRef(0);
  const desdeQuandoVisivel = useRef<number | null>(null);

  useEffect(() => {
    sessao.current = idDeSessao();

    function coletarBytes() {
      const quebra: Record<string, number> = {};
      let total = 0;
      try {
        const entradas = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        for (let i = jaContados.current; i < entradas.length; i++) {
          const e = entradas[i];
          const bytes = e.transferSize || 0;
          if (bytes <= 0) continue; // veio do cache: não custou banda
          const tipo = TIPOS[e.initiatorType] || "other";
          quebra[tipo] = (quebra[tipo] || 0) + bytes;
          total += bytes;
        }
        jaContados.current = entradas.length;

        const nav = performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined;
        if (nav?.transferSize && !quebra.document) {
          quebra.document = nav.transferSize;
          total += nav.transferSize;
        }
      } catch {
        /* Performance API indisponível: não medir é melhor que quebrar a tela. */
      }
      return { total, quebra };
    }

    /** Fecha a contagem de tempo ativo e devolve o total em ms. */
    function pararCronometro(): number {
      if (desdeQuandoVisivel.current != null) {
        ativoAcumulado.current += Date.now() - desdeQuandoVisivel.current;
        desdeQuandoVisivel.current = null;
      }
      return ativoAcumulado.current;
    }

    function iniciarCronometro() {
      if (desdeQuandoVisivel.current == null && document.visibilityState === "visible") {
        desdeQuandoVisivel.current = Date.now();
      }
    }

    /** Fecha a medição da área atual e manda. */
    function fechar(usarBeacon: boolean) {
      if (!rota.current) return;
      const ativoMs = pararCronometro();
      const { total, quebra } = coletarBytes();

      // Passagem instantânea sem consumo nenhum não vira documento no banco.
      if (total <= 0 && ativoMs < 1000) return;

      const corpo = JSON.stringify({
        route: rota.current,
        // Manda a ABA, não o rótulo: quem nomeia a área é o servidor.
        tab: aba.current || undefined,
        bytes: total,
        breakdown: quebra,
        activeMs: ativoMs,
        sessionId: sessao.current,
        referer: document.referrer || undefined,
      });

      try {
        if (usarBeacon && navigator.sendBeacon) {
          navigator.sendBeacon("/api/uso", new Blob([corpo], { type: "application/json" }));
        } else {
          fetch("/api/uso", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: corpo,
            keepalive: true,
            credentials: "include",
          }).catch(() => {});
        }
      } catch {
        /* medir nunca derruba */
      }
    }

    /** Começa a medir uma área nova, fechando a anterior. */
    function abrir(novaRota: string, novaAba: string | null) {
      if (rota.current === novaRota && aba.current === novaAba) return;
      if (rota.current) fechar(false);
      rota.current = novaRota;
      aba.current = novaAba;
      ativoAcumulado.current = 0;
      desdeQuandoVisivel.current = null;
      iniciarCronometro();
    }

    function aoMudarVisibilidade() {
      if (document.visibilityState === "hidden") {
        // Manda o que já foi medido — pode ser a última coisa que acontece.
        fechar(true);
        // E rearma, porque a pessoa pode voltar para a mesma tela. O que já foi
        // mandado fica zerado para não ser contado duas vezes.
        ativoAcumulado.current = 0;
      } else {
        iniciarCronometro();
      }
    }

    function aoTrocarArea(e: Event) {
      const detalhe = (e as CustomEvent<{ tab?: string }>).detail;
      abrir(window.location.pathname, detalhe?.tab ?? abaAtual());
    }

    abrir(pathname, abaAtual());

    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    window.addEventListener(EVENTO_AREA, aoTrocarArea);
    return () => {
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      window.removeEventListener(EVENTO_AREA, aoTrocarArea);
    };
  }, [pathname]);

  return null;
}

/**
 * O que uma tela chama quando muda de área sem mudar de rota.
 *
 * Usada pelo portal ao trocar de aba. Também sincroniza a URL, para que o
 * deep-link `?tab=` que o portal já lia passe a ser produzido pela navegação —
 * link compartilhável de graça, e a aba sobrevive ao F5.
 *
 * ⚠️ `replaceState` e não `pushState`: com `pushState`, cada clique numa aba
 * entraria no histórico e o botão Voltar levaria a pessoa a passear pelas abas
 * do portal em vez de sair dele.
 */
export function marcarArea(tab: string) {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") !== tab) {
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", url.toString());
    }
    window.dispatchEvent(new CustomEvent(EVENTO_AREA, { detail: { tab } }));
  } catch {
    /* medir nunca derruba a navegação */
  }
}
