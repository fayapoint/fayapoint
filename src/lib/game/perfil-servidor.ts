import dbConnect from "@/lib/mongodb";
import GamePlayer from "@/models/GamePlayer";
import GameVaga from "@/models/GameVaga";
import GameAvaliacao from "@/models/GameAvaliacao";
import { clubeComEspelho } from "./espelho";
import { reputacaoDe, chaveGamertag, type ResumoReputacao } from "./reputacao";
import { codeDaPosicaoEA } from "./posicoes";
import type { EaPlatform } from "./ea-api";

/**
 * MONTA O PERFIL de um jogador, pela gamertag — a página `/game/jogador/[gt]`.
 *
 * Junta o que a plataforma sabe de UMA pessoa: a ficha (reivindicada ou não), a
 * TEMPORADA e a CARREIRA (do clube dela, lidas pelo espelho — nunca da EA
 * direto, que dá 403 em produção), a REPUTAÇÃO agregada com os comentários, e a
 * vaga no mercado, se houver. Degrada com elegância: uma gamertag que só tem
 * votos e um anúncio (sem clube conhecido) ainda rende um perfil útil.
 */

interface StatsLinha {
  jogos: number | null;
  gols: number | null;
  assist: number | null;
  nota: number | null;
  motm: number | null;
  aproveitamento: number | null;
}

export interface PerfilJogadorDados {
  gamertag: string;
  proName: string | null;
  overall: number | null;
  /** Posição favorita da EA, crua (para exibir) + código nosso (para a cor). */
  posicaoEA: string | null;
  posicaoCode: string | null;
  estilo: string | null;
  verificado: boolean;
  reivindicado: boolean;
  plataforma: string | null;
  clube: { id: string; nome: string | null; divisao: number | null } | null;
  reputacao: ResumoReputacao | null;
  comentarios: Array<{ media: number; comentario: string; quando: string }>;
  temporada: StatsLinha | null;
  carreira: StatsLinha | null;
  vaga: {
    _id: string;
    posicoes: string[];
    horario: string | null;
    dias: string[];
    regiao: string | null;
    descricao: string | null;
  } | null;
  /** Idade do dado do clube (espelho), quando veio de lá. */
  fonteClube: string | null;
  capturedAt: string | null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function txt(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function escapar(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function montarPerfil(gamertagBruta: string): Promise<PerfilJogadorDados | null> {
  const gamertag = gamertagBruta.trim().slice(0, 40);
  if (gamertag.length < 2) return null;
  const chave = chaveGamertag(gamertag);
  await dbConnect();

  const rxExata = new RegExp(`^${escapar(gamertag)}$`, "i");

  const [player, vagaDoc, reputMapa, comentDocs] = await Promise.all([
    GamePlayer.findOne({ gamertag: rxExata })
      .select("gamertag platform eaClubId clubName proName proOverall favoritePosition snapshot verified")
      .lean() as Promise<Record<string, unknown> | null>,
    GameVaga.findOne({ tipo: "jogador", gamertag: rxExata, status: "ativa", expiraEm: { $gt: new Date() } })
      .select("_id posicoes horario dias regiao descricao estilo overall")
      .lean() as Promise<Record<string, unknown> | null>,
    reputacaoDe([gamertag]),
    GameAvaliacao.find({ alvoGamertag: chave, comentario: { $exists: true, $ne: "" } })
      .select("media comentario createdAt alvoGamertagDisplay")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean() as Promise<Array<Record<string, unknown>>>,
  ]);

  const reputacao = reputMapa.get(chave) ?? null;

  // Nome de exibição preferido: o que a fonte mais confiável tiver.
  const displayGamertag =
    txt(player?.gamertag) ||
    (comentDocs[0] && txt(comentDocs[0].alvoGamertagDisplay)) ||
    gamertag;

  // Existe algo sobre essa pessoa? Se não há player, vaga, reputação nem
  // comentário, não há perfil — 404 honesto em vez de página fantasma.
  if (!player && !vagaDoc && !reputacao && comentDocs.length === 0) return null;

  const eaClubId = txt(player?.eaClubId);
  const plataforma = txt(player?.platform);

  let clube: PerfilJogadorDados["clube"] = null;
  let temporada: StatsLinha | null = null;
  let carreira: StatsLinha | null = null;
  let fonteClube: string | null = null;
  let capturedAt: string | null = null;

  if (eaClubId) {
    const ficha = await clubeComEspelho(eaClubId, (plataforma as EaPlatform) || undefined);
    fonteClube = ficha.fonte;
    capturedAt = ficha.capturedAt;
    if (ficha.dados) {
      clube = {
        id: eaClubId,
        nome: ficha.dados.info?.name ?? txt(player?.clubName) ?? null,
        divisao: ficha.dados.info?.currentDivision ?? null,
      };
      const membros = (ficha.dados.members ?? []) as Array<Record<string, unknown>>;
      const carreiras = (ficha.dados.career ?? []) as Array<Record<string, unknown>>;
      const m = membros.find((x) => chaveGamertag(String(x.name ?? "")) === chave);
      const cc = carreiras.find((x) => chaveGamertag(String(x.name ?? "")) === chave);
      if (m) {
        temporada = {
          jogos: num(m.gamesPlayed),
          gols: num(m.goals),
          assist: num(m.assists),
          nota: num(m.ratingAve),
          motm: num(m.manOfTheMatch),
          aproveitamento: num(m.winRate),
        };
      }
      if (cc) {
        carreira = {
          jogos: num(cc.gamesPlayed),
          gols: num(cc.goals),
          assist: num(cc.assists),
          nota: num(cc.ratingAve),
          motm: num(cc.manOfTheMatch),
          aproveitamento: null,
        };
      }
    }
  }

  // Sem clube (ou sem membro no clube): cai para o snapshot do claim.
  if (!temporada && player?.snapshot) {
    const s = player.snapshot as Record<string, unknown>;
    temporada = {
      jogos: num(s.gamesPlayed),
      gols: num(s.goals),
      assist: num(s.assists),
      nota: num(s.ratingAve),
      motm: num(s.manOfTheMatch),
      aproveitamento: num(s.winRate),
    };
  }
  if (clube === null && txt(player?.clubName)) {
    clube = { id: eaClubId ?? "", nome: txt(player?.clubName), divisao: null };
  }

  const posicaoEA = txt(player?.favoritePosition);
  const posicaoCode =
    codeDaPosicaoEA(posicaoEA) ?? (Array.isArray(vagaDoc?.posicoes) ? (vagaDoc!.posicoes as string[])[0] ?? null : null);

  return {
    gamertag: displayGamertag,
    proName: txt(player?.proName),
    // OVR do jogador reivindicado; senão o que ele declarou no anúncio.
    overall: num(player?.proOverall) ?? num(vagaDoc?.overall),
    posicaoEA,
    posicaoCode,
    estilo: txt(vagaDoc?.estilo),
    verificado: player?.verified === true,
    reivindicado: !!player,
    plataforma,
    clube,
    reputacao,
    comentarios: comentDocs.map((c) => ({
      media: num(c.media) ?? 0,
      comentario: txt(c.comentario) ?? "",
      quando: (c.createdAt instanceof Date ? c.createdAt : new Date()).toISOString(),
    })),
    temporada,
    carreira,
    vaga: vagaDoc
      ? {
          _id: String(vagaDoc._id),
          posicoes: Array.isArray(vagaDoc.posicoes) ? (vagaDoc.posicoes as string[]) : [],
          horario: txt(vagaDoc.horario),
          dias: Array.isArray(vagaDoc.dias) ? (vagaDoc.dias as string[]) : [],
          regiao: txt(vagaDoc.regiao),
          descricao: txt(vagaDoc.descricao),
        }
      : null,
    fonteClube,
    capturedAt,
  };
}
