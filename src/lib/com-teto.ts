/**
 * Correr uma promessa contra um cronômetro — a mecânica, num lugar só.
 *
 * Existiam três cópias disto (`rate-limit.ts`, `redis.ts` e um trecho colado
 * dentro de `welcome-email.ts`), com a mesma estrutura e nomes parecidos. Três
 * cópias de um cronômetro é como um deles ganha um `clearTimeout` a menos e
 * ninguém percebe: o `finally` daqui é o que evita o temporizador pendurado
 * segurando o event loop depois de a promessa já ter respondido.
 *
 * Os PRAZOS continuam em quem chama — 800ms na borda, teto de leitura e teto de
 * escrita no cache, 2,5s no e-mail. Prazo é decisão de quem conhece o trabalho;
 * só a mecânica é comum.
 *
 * ## ⚠️ O que isto NÃO faz: cancelar
 *
 * `Promise.race` só deixa de ESPERAR. A operação perdedora continua correndo.
 * Isso importa em função serverless: se a resposta HTTP sai e a instância é
 * congelada, uma escrita "abandonada pelo teto" tem o mesmo destino de uma
 * escrita que ninguém esperou — pode simplesmente não acontecer.
 *
 * Daí a regra:
 *
 * - **LEITURA** pode ter teto curto: desistir de ler o cache é inofensivo, e o
 *   pedido segue para a fonte.
 * - **ESCRITA** precisa de teto FOLGADO, muito acima do tempo medido. Teto curto
 *   em escrita não protege nada — ele só transforma "escrita lenta" em "escrita
 *   perdida", que é exatamente o defeito que se estava consertando.
 */
export async function comTeto<T>(promessa: Promise<T>, ms: number, oQue: string): Promise<T> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promessa,
      new Promise<never>((_, rejeita) => {
        temporizador = setTimeout(() => rejeita(new Error(`teto estourado (${ms}ms): ${oQue}`)), ms);
      }),
    ]);
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
}
