import { NextResponse } from "next/server";
import { rateLimit, getClientIpFromRequest } from "@/lib/rate-limit";

/**
 * TETO DE CONSULTAS da seção /game.
 *
 * Por que existe: as rotas de `/api/game/*` são caras de um jeito que não
 * aparece na conta. Uma busca em leque pode disparar **oito** consultas à EA;
 * a ficha de um clube, cinco; e o que não vai à EA vai ao Mongo. Um botão que
 * aceita clique repetido vira, sem má intenção nenhuma, uma metralhadora
 * contra a fonte de terceiro que já nos recusa por origem — e contra o nosso
 * próprio banco.
 *
 * A mecânica é a do `lib/rate-limit.ts` que o site já usa (Upstash Redis, com
 * teto de tempo para nunca segurar a borda). Duas consequências herdadas, e as
 * duas são o comportamento certo:
 *
 *  - **Sem Redis configurado, LIBERA.** No desenvolvimento não há Upstash, e
 *    um teto que barrasse o desenvolvimento seria desligado no primeiro dia.
 *  - **Se o Redis demorar, LIBERA.** Um teto de consulta não pode ser o motivo
 *    de a página não abrir.
 *
 * Os orçamentos abaixo são por IP e por minuto, calibrados pelo custo de cada
 * rota — não por um número redondo qualquer.
 */

export type OrcamentoGame =
  | "busca"
  | "clube"
  | "partidas"
  | "ranking"
  | "vincular"
  | "campeonato-leitura"
  | "campeonato-escrita";

/** Teto por IP, por minuto. O custo real de cada rota está no comentário. */
const ORCAMENTOS: Record<OrcamentoGame, number> = {
  // Até 8 idas à EA por chamada. É a rota mais cara que existe aqui.
  busca: 20,
  // 5 idas à EA (ficha, campanha, elenco, carreira, índice) ou 1 ao Mongo.
  clube: 40,
  // 3 idas à EA (uma por tipo de partida) ou 1 ao Mongo.
  partidas: 40,
  // 1 ida, mas devolve 100 linhas. Cache de borda de 1h já segura a maioria.
  ranking: 30,
  // Escrita autenticada. Ninguém vincula clube 20 vezes por minuto.
  vincular: 10,
  "campeonato-leitura": 60,
  // Criar competição, gerar tabela, registrar resultado.
  "campeonato-escrita": 20,
};

export interface Veredito {
  ok: boolean;
  /** Resposta 429 pronta, quando `ok` é falso. */
  resposta?: NextResponse;
}

/**
 * Cobra uma consulta do orçamento. Devolve `{ ok: false, resposta }` quando o
 * teto estourou — e a resposta já vem com `Retry-After`, que é o que faz um
 * cliente educado esperar em vez de insistir.
 *
 * `sufixo` separa orçamentos que deveriam ser independentes (por exemplo, o
 * clube A e o clube B), para um clube movimentado não gastar o teto de outro.
 */
export async function cobrar(
  req: Request,
  orcamento: OrcamentoGame,
  sufixo?: string
): Promise<Veredito> {
  const ip = getClientIpFromRequest(req);
  const limite = ORCAMENTOS[orcamento];
  const chave = `game:${orcamento}${sufixo ? `:${sufixo}` : ""}:${ip}`;

  const r = await rateLimit({ key: chave, limit: limite, windowSeconds: 60 });
  if (r.allowed) return { ok: true };

  return {
    ok: false,
    resposta: NextResponse.json(
      {
        error: "muitas consultas",
        detalhe:
          "Você passou do teto de consultas por minuto desta seção. Espere um instante e tente de novo.",
        limite: r.limit,
        resetEm: r.resetSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(r.resetSeconds),
          "Cache-Control": "no-store",
        },
      }
    ),
  };
}
