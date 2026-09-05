/**
 * Quem rola esta página — medido, não deduzido do CSS.
 *
 * ## Por que este arquivo existe
 *
 * O leitor de curso põe o texto num `<main className="flex-1 overflow-y-auto">`
 * dentro de um `min-h-screen flex flex-col`. Olhando o CSS, a conclusão óbvia é
 * que o `<main>` rola sozinho. Ele não rola: como a raiz é `min-h-screen` e não
 * `h-screen`, ela cresce com o conteúdo, o `<main>` cresce junto, e
 * `scrollHeight` acaba igual a `clientHeight`. **Quem rola é a janela.**
 *
 * Foi assim que dois defeitos opostos conviveram na mesma página:
 *
 *  • a lente perseguia a narração mexendo em `main.scrollTop` — um número que
 *    nunca sai de zero. O realce andava e a página ficava parada, e era isso
 *    que o Ricardo via como *"ela não acompanha o texto direito"*;
 *  • e eu, ao investigar isso, li o CSS em vez de medir, concluí o contrário, e
 *    troquei seis `window.scrollTo` que FUNCIONAVAM por chamadas no `<main>`
 *    que não fariam nada.
 *
 * Ninguém acerta isso de cabeça, e o layout pode mudar de novo. Então a
 * resposta passa a ser medida a cada uso: se o candidato tem mais conteúdo do
 * que altura, ele rola; senão, quem rola é a janela.
 */

export type Rolador =
  | { tipo: "elemento"; el: HTMLElement }
  | { tipo: "janela" };

/** Decide, no momento da chamada, quem de fato rola. */
export function quemRola(candidato: HTMLElement | null | undefined): Rolador {
  if (candidato && candidato.scrollHeight > candidato.clientHeight + 1) {
    return { tipo: "elemento", el: candidato };
  }
  return { tipo: "janela" };
}

export function topoDe(r: Rolador): number {
  return r.tipo === "elemento" ? r.el.scrollTop : window.scrollY;
}

export function porTopo(r: Rolador, v: number, suave = false) {
  const top = Math.max(0, v);
  if (r.tipo === "elemento") r.el.scrollTo({ top, behavior: suave ? "smooth" : "auto" });
  else window.scrollTo({ top, behavior: suave ? "smooth" : "auto" });
}

/** Anda uma quantidade — usado pela perseguição amortecida, quadro a quadro. */
export function andar(r: Rolador, delta: number) {
  if (r.tipo === "elemento") r.el.scrollTop += delta;
  else window.scrollBy(0, delta);
}

/**
 * A janela visível do rolador: onde ela começa na tela e que altura tem.
 * Para a janela, começa em 0 e tem `innerHeight` — é o que faz a mesma conta de
 * posicionamento valer nos dois casos.
 */
export function moldura(r: Rolador): { topo: number; altura: number } {
  if (r.tipo === "elemento") {
    return { topo: r.el.getBoundingClientRect().top, altura: r.el.clientHeight };
  }
  return { topo: 0, altura: window.innerHeight };
}

/** O evento de rolagem da janela não sai do `document.scrollingElement`. */
export function ouvirRolagem(r: Rolador, fn: () => void): () => void {
  const alvo: EventTarget = r.tipo === "elemento" ? r.el : window;
  alvo.addEventListener("scroll", fn, { passive: true });
  return () => alvo.removeEventListener("scroll", fn);
}
