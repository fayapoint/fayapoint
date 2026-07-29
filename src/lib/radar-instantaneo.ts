import type { Collection } from "mongodb";
import { getMongoClient } from "@/lib/products";

/**
 * O instantâneo do "em alta agora", compartilhado por todas as instâncias.
 *
 * ## O defeito que isto conserta
 *
 * `radar-mundo.ts` guardava a medição num `Map` em memória com 30 min de TTL.
 * Em processo único isso funciona; no Netlify, não — cada requisição pode cair
 * numa instância diferente, cada uma com o seu `Map` vazio. Resultado medido em
 * 29/07/2026: o Ricardo abriu a home e viu "#1 Semaglutida"; clicou em "abrir o
 * radar completo" e o #1 era "Glen Hansard", com a Semaglutida em 4º e com
 * outro número de buscas. Não era ordenação errada — eram **duas medições
 * diferentes**, tiradas com segundos de diferença de instâncias diferentes,
 * apresentadas como se fossem a mesma leitura.
 *
 * Para um painel que se vende como "dados reais, medidos agora", isso é pior do
 * que estar desatualizado: o número que a pessoa acabou de ler desaparece na
 * página seguinte, e não há como ela confiar no que viu.
 *
 * ## A escolha
 *
 * O instantâneo passa a morar no Mongo, com carimbo de hora. Todas as
 * instâncias leem o MESMO documento durante a janela; quando ele vence, a
 * primeira requisição que chegar mede de novo e regrava. O cache em memória
 * continua na frente como primeiro degrau — ele evita ida ao banco dentro da
 * mesma instância, e agora é só otimização, não é mais a fonte da verdade.
 *
 * Um documento por lugar, sobrescrito: ~30 lugares, não cresce com o tráfego.
 */

const DB = "fayapoint";
const COLECAO = "radar_instantaneo";

export interface InstantaneoGuardado<T> {
  lugar: string;
  /** Quando a medição foi tirada — é o que a interface mostra como "medido às". */
  em: Date;
  dado: T;
}

async function colecao<T>(): Promise<Collection<InstantaneoGuardado<T>>> {
  const client = await getMongoClient();
  return client.db(DB).collection<InstantaneoGuardado<T>>(COLECAO);
}

/**
 * Lê o instantâneo do lugar, se ainda estiver dentro da validade.
 *
 * Devolve `null` quando não há nada guardado, quando venceu, ou quando o banco
 * não responde — o chamador então mede ao vivo. Falhar aqui nunca pode derrubar
 * o painel: sem banco o site volta ao comportamento antigo, que é pior mas
 * funciona.
 */
export async function lerInstantaneo<T>(
  lugar: string,
  validadeMs: number
): Promise<{ dado: T; em: Date } | null> {
  try {
    const col = await colecao<T>();
    const doc = await col.findOne({ lugar });
    if (!doc) return null;
    if (Date.now() - doc.em.getTime() > validadeMs) return null;
    return { dado: doc.dado, em: doc.em };
  } catch (error) {
    console.error("[radar-instantaneo] leitura falhou:", error);
    return null;
  }
}

/** Grava (ou sobrescreve) o instantâneo do lugar. */
export async function gravarInstantaneo<T>(lugar: string, dado: T): Promise<void> {
  try {
    const col = await colecao<T>();
    await col.updateOne(
      { lugar },
      { $set: { lugar, em: new Date(), dado } },
      { upsert: true }
    );
  } catch (error) {
    // Não propaga: se o banco recusar a escrita, o visitante ainda recebe a
    // medição ao vivo que já está em mãos. Perde-se a estabilidade, não a página.
    console.error("[radar-instantaneo] escrita falhou:", error);
  }
}
