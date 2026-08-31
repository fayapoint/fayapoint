import dbConnect from "@/lib/mongodb";
import GameAvaliacao from "@/models/GameAvaliacao";
import { normalizar } from "./ea-api";
import { type ResumoReputacao } from "./reputacao-meta";

/**
 * REPUTAÇÃO — a leitura agregada das avaliações (`GameAvaliacao`).
 *
 * O banco dos bons jogadores nasce daqui: a média por categoria e a média geral
 * de cada gamertag, calculadas a partir dos votos de avaliadores distintos. O
 * mercado, a comunidade e o perfil leem por este módulo, sempre em LOTE (uma
 * consulta para todas as gamertags da tela), para não haver N+1.
 *
 * As categorias e os tipos puros ficam em `reputacao-meta.ts` (seguro no
 * cliente); aqui mora só o que toca o banco.
 */

export { CATEGORIAS, type CategoriaMeta, type ResumoReputacao } from "./reputacao-meta";

/** Normaliza a gamertag do mesmo jeito que o alvo é gravado. */
export function chaveGamertag(g: string): string {
  return normalizar(g);
}

/**
 * Reputação de um conjunto de gamertags, em uma consulta. Devolve um mapa
 * chaveado pela gamertag normalizada; quem não tem voto simplesmente não
 * aparece no mapa (a tela mostra "sem avaliação", não zero — zero seria uma
 * nota, e ninguém tirou zero: ninguém votou).
 */
export async function reputacaoDe(gamertags: string[]): Promise<Map<string, ResumoReputacao>> {
  const chaves = [...new Set(gamertags.map(chaveGamertag).filter(Boolean))];
  if (chaves.length === 0) return new Map();
  await dbConnect();
  const linhas = await GameAvaliacao.aggregate<{
    _id: string;
    total: number;
    media: number;
    ataque: number;
    defesa: number;
    passe: number;
    coletivo: number;
    fairplay: number;
  }>([
    { $match: { alvoGamertag: { $in: chaves } } },
    {
      $group: {
        _id: "$alvoGamertag",
        total: { $sum: 1 },
        media: { $avg: "$media" },
        ataque: { $avg: "$categorias.ataque" },
        defesa: { $avg: "$categorias.defesa" },
        passe: { $avg: "$categorias.passe" },
        coletivo: { $avg: "$categorias.coletivo" },
        fairplay: { $avg: "$categorias.fairplay" },
      },
    },
  ]);

  const arred = (n: number) => Math.round(n * 10) / 10;
  const mapa = new Map<string, ResumoReputacao>();
  for (const l of linhas) {
    mapa.set(l._id, {
      media: arred(l.media),
      total: l.total,
      categorias: {
        ataque: arred(l.ataque),
        defesa: arred(l.defesa),
        passe: arred(l.passe),
        coletivo: arred(l.coletivo),
        fairplay: arred(l.fairplay),
      },
    });
  }
  return mapa;
}
