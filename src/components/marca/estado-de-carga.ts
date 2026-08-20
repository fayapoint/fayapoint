"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Quem está carregando agora — um contador, não um booleano.
 *
 * ── Para que serve ─────────────────────────────────────────────────────────
 *
 * O favicon anima enquanto o site carrega ([[FaviconVivo]]). Para isso alguém
 * precisa dizer "comecei" e "terminei", e mais de uma coisa pode estar
 * carregando ao mesmo tempo — a rota, um painel do portal, uma compra. Com um
 * booleano, o primeiro a terminar apagaria a animação dos outros. Contador
 * resolve: só zera quando o último fecha.
 *
 * ── Quem registra ───────────────────────────────────────────────────────────
 *
 * Todo componente de carregamento da marca (`TelaDeCarga`, `LoaderFayai`,
 * `SeloCarregando`) se inscreve sozinho enquanto está montado. O efeito é
 * exato: **o favicon anima quando, e só quando, existe um loader da marca na
 * tela**. Não há lista de rotas para manter, nem heurística de "parece lento".
 *
 * A primeira carga da página é o outro gatilho, e vem do próprio navegador
 * (`document.readyState`), tratado no `FaviconVivo`.
 */

let abertos = 0;
const ouvintes = new Set<() => void>();

function avisar() {
  for (const f of ouvintes) f();
}

/** Abre uma carga. Devolve a função que a fecha — chame-a uma vez só. */
export function abrirCarga(): () => void {
  abertos += 1;
  avisar();
  let fechada = false;
  return () => {
    if (fechada) return;
    fechada = true;
    abertos = Math.max(0, abertos - 1);
    avisar();
  };
}

function assinar(f: () => void) {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
}

const lerCliente = () => abertos > 0;
// No servidor nada carrega — e um snapshot instável aqui quebraria a
// hidratação com "Text content did not match".
const lerServidor = () => false;

/** `true` enquanto houver qualquer carregamento da marca em cena. */
export function useCarregando(): boolean {
  return useSyncExternalStore(assinar, lerCliente, lerServidor);
}

/** Mantém uma carga aberta enquanto o componente estiver montado. */
export function useRegistrarCarga(ativo = true) {
  useEffect(() => {
    if (!ativo) return;
    return abrirCarga();
  }, [ativo]);
}
