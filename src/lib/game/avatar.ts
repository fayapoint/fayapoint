/**
 * AVATAR DO JOGADOR — o "bonequinho" da comunidade.
 *
 * Todo player do Winners 22 tem um rosto — um busto de jogador de camisa,
 * gerado DE FORMA DETERMINÍSTICA a partir de uma semente (o id do usuário ou a
 * gamertag). Mesma pessoa, sempre o mesmo boneco; nenhuma imagem hospedada,
 * nenhuma chamada externa (a CSP dos artefatos e da produção agradece) — é SVG
 * inline montado no cliente.
 *
 * Por que existe: a pesquisa nos grupos mostrou que o jogador HOJE se
 * representa com um cartão feito na mão ("MAESTRO", "MURALHA"). Dar a cada um um
 * avatar consistente é o que faz a comunidade "encher de gente" na tela — a
 * nuvem de bonecos na área principal, o rostinho no card do mercado, o ponto
 * verde de quem está online.
 *
 * Este módulo é PURO (sem React): devolve os atributos a partir da semente. O
 * componente `AvatarJogador.tsx` desenha; o cartaz do servidor pode reusar os
 * mesmos atributos no futuro.
 */

/** Hash estável (FNV-1a) para semear as escolhas. */
function hash(s: string): number {
  let h = 2166136261;
  const str = s || "winners22";
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const PELE = ["#f6d3b0", "#eebd94", "#d9a066", "#b97a4a", "#8a5a34", "#6b4327"];
const CABELO = ["#1c1512", "#2f2016", "#4a2f1b", "#6b4423", "#9a5a2b", "#c9962f", "#e6c667", "#2a2a30", "#7a3f9c"];
/** Camisas: as cores vivas da casa (§2 da identidade), sem depender do ouro. */
const CAMISA = ["#a3e635", "#38bdf8", "#a78bfa", "#f472b6", "#fb923c", "#34d399", "#fb7185", "#e2e8f0", "#f5c04e", "#22d3ee"];

export interface AtributosAvatar {
  pele: string;
  cabelo: string;
  /** 0 = curto, 1 = raspado, 2 = topete, 3 = coque. */
  penteado: number;
  camisa: string;
  camisa2: string;
  numero: number;
  /** true = tem faixa de capitão / testa. */
  faixa: boolean;
}

export function atributosAvatar(seed: string): AtributosAvatar {
  const h = hash(seed);
  const pele = PELE[h % PELE.length];
  const cabelo = CABELO[(h >> 3) % CABELO.length];
  const penteado = (h >> 6) % 4;
  const camisa = CAMISA[(h >> 8) % CAMISA.length];
  // A segunda cor da camisa é outra da paleta, para gola e listra.
  const camisa2 = CAMISA[(h >> 12) % CAMISA.length] === camisa
    ? "#0c0e1d"
    : CAMISA[(h >> 12) % CAMISA.length];
  const numero = 1 + ((h >> 16) % 30);
  const faixa = ((h >> 21) & 7) === 0;
  return { pele, cabelo, penteado, camisa, camisa2, numero, faixa };
}

/** Cor do anel de status ao redor do avatar. */
export type StatusPresenca = "online" | "procurando" | "jogando" | "offline";

export function corStatus(s: StatusPresenca): string {
  switch (s) {
    case "procurando":
      return "#a3e635"; // lima — quer jogo AGORA, é o estado que queremos destacar
    case "jogando":
      return "#f5c04e"; // ouro — em partida
    case "online":
      return "#38bdf8"; // ciano — por aqui
    default:
      return "#475569";
  }
}
