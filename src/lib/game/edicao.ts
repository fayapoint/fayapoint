/**
 * A EDIÇÃO do EA SPORTS FC que o /game acompanha — 21/09/2026: FC 27.
 *
 * Medido na API viva no primeiro dia do acesso antecipado do FC 27: o endereço
 * `proclubs.ea.com/api/fc/*` é o mesmo, mas **a base por trás virou outra**.
 * O ranking recomeçou (o 1º colocado tinha 51 jogos), a numeração de clube
 * recomeçou do zero (ARKHAM = 4646) e a piscina `common-gen4` passou a devolver
 * HTTP 400 — o FC 27 não existe em PS4/Xbox One.
 *
 * Numeração recomeçada quer dizer que um `clubId` do FC 26 pode apontar, hoje,
 * para OUTRO clube do FC 27. Por isso o espelho de cada edição mora em coleção
 * própria: o do FC 26 ficou nas coleções sem sufixo, arquivado e intacto (a
 * Super Copa dos Streamers foi jogada nele e continua lendo de lá), e o FC 27
 * começa limpo.
 *
 * Quando o FC 28 sair: trocar `EDICAO_EA` aqui, remedir `ea-api.ts`, e o resto
 * segue sozinho.
 */
export type EdicaoEa = "fc26" | "fc27";

export const EDICAO_EA: EdicaoEa = "fc27";
export const JOGO_ATUAL = "EA SPORTS FC 27";

/** Coleção do espelho de uma edição. O FC 26 ficou nas coleções sem sufixo. */
export function colecaoEspelho(base: "game_ea_clubes" | "game_ea_partidas", edicao: EdicaoEa = EDICAO_EA): string {
  return edicao === "fc26" ? base : `${base}_${edicao}`;
}

/** Edição de uma competição a partir do nome do jogo gravado nela. */
export function edicaoDoJogo(jogo: string | null | undefined): EdicaoEa {
  return /\b26\b/.test(jogo ?? "") ? "fc26" : EDICAO_EA;
}
