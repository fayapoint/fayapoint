import dbConnect from "@/lib/mongodb";
import GameVaga, { type IGameVaga } from "@/models/GameVaga";
import GameEaClube from "@/models/GameEaClube";
import { POSICOES } from "./posicoes";
import { reputacaoDe, chaveGamertag, type ResumoReputacao } from "./reputacao";

/**
 * A CAMADA DE SERVIDOR do Mercado — o que a página e as APIs compartilham.
 *
 * Duas responsabilidades:
 *
 * 1. **Serializar** uma vaga para o cliente SEM vazar o contato. O contato do
 *    anunciante é o ativo que a comunidade hoje joga na vitrine (o link de
 *    WhatsApp na legenda), e é justamente o que faz o grupo virar lista de
 *    número para robô. Aqui ele só sai para o dono da vaga e para quem já se
 *    candidatou.
 *
 * 2. **Enriquecer** as vagas de clube com o dado VIVO do espelho da EA. O
 *    snapshot gravado na publicação envelhece; o clube sobe de divisão e o
 *    cartaz de duas semanas atrás mente. Uma consulta em lote ao espelho
 *    (`game_ea_clubes`) para todos os `eaClubId` da página corrige isso sem
 *    N+1 — e sem tocar na EA (o espelho já é o que a produção enxerga).
 */

export interface VagaSerializada {
  _id: string;
  tipo: "clube" | "jogador";
  posicoes: string[];
  plataforma: string;
  dias: string[];
  horario?: string;
  regiao?: string;
  eaClubId?: string;
  clubeNome?: string;
  clubeSnapshot?: IGameVaga["clubeSnapshot"];
  minOverall?: number;
  gamertag?: string;
  proName?: string;
  overall?: number;
  estilo?: string;
  titulo?: string;
  descricao?: string;
  contatoTipo: string;
  /** Só presente quando o pedinte é o dono ou já se candidatou. */
  contato?: string;
  status: string;
  candidaturas: number;
  destaque: boolean;
  demo: boolean;
  sourceGrade: string;
  ehDono: boolean;
  createdAt: string;
  /** Semente do bonequinho — gamertag (jogador) ou nome do clube. */
  avatarSeed: string;
  /** Reputação agregada, quando o jogador já recebeu voto. */
  reputacao?: ResumoReputacao;
}

type DocVaga = IGameVaga & { _id: unknown };

export function serializarVaga(
  v: DocVaga,
  opts: { userId?: string | null; revelarContato?: boolean } = {}
): VagaSerializada {
  const ehDono = !!opts.userId && String(v.ownerUserId) === String(opts.userId);
  const podeVerContato = ehDono || !!opts.revelarContato;
  return {
    _id: String(v._id),
    tipo: v.tipo,
    posicoes: v.posicoes ?? [],
    plataforma: v.plataforma,
    dias: v.dias ?? [],
    horario: v.horario || undefined,
    regiao: v.regiao || undefined,
    eaClubId: v.eaClubId || undefined,
    clubeNome: v.clubeNome || undefined,
    clubeSnapshot: v.clubeSnapshot || undefined,
    minOverall: v.minOverall ?? undefined,
    gamertag: v.gamertag || undefined,
    proName: v.proName || undefined,
    overall: v.overall ?? undefined,
    estilo: v.estilo || undefined,
    titulo: v.titulo || undefined,
    descricao: v.descricao || undefined,
    contatoTipo: v.contatoTipo,
    contato: podeVerContato ? v.contato || undefined : undefined,
    status: v.status,
    candidaturas: v.candidaturas ?? 0,
    destaque: !!v.destaque,
    demo: !!v.demo,
    sourceGrade: v.sourceGrade,
    ehDono,
    createdAt: (v.createdAt instanceof Date ? v.createdAt : new Date()).toISOString(),
    avatarSeed: (v.tipo === "jogador" ? v.gamertag : v.clubeNome) || String(v._id),
  };
}

/**
 * Cola a reputação nas vagas de JOGADOR, em lote (uma consulta para todas as
 * gamertags da página). A vaga de clube não tem reputação — reputação é de
 * gente, não de escudo.
 */
export async function enriquecerReputacao(vagas: VagaSerializada[]): Promise<void> {
  const gts = vagas.filter((v) => v.tipo === "jogador" && v.gamertag).map((v) => v.gamertag!);
  if (gts.length === 0) return;
  const mapa = await reputacaoDe(gts);
  for (const v of vagas) {
    if (v.tipo !== "jogador" || !v.gamertag) continue;
    const r = mapa.get(chaveGamertag(v.gamertag));
    if (r) v.reputacao = r;
  }
}

/**
 * Mescla, em lote, a divisão e a campanha VIVAS do espelho sobre o snapshot
 * gravado na publicação. Sem isso, o card mostra a divisão de quando a vaga
 * nasceu — que é exatamente o defeito do cartaz estático do grupo.
 */
export async function enriquecerComEspelho(vagas: VagaSerializada[]): Promise<void> {
  const ids = [...new Set(vagas.filter((v) => v.eaClubId).map((v) => v.eaClubId!))];
  if (ids.length === 0) return;
  await dbConnect();
  const docs = (await GameEaClube.find({ clubId: { $in: ids } })
    .select("clubId currentDivision skillRating wins ties losses gamesPlayed name crestAssetId")
    .lean()) as unknown as Array<{
    clubId: string;
    currentDivision?: number;
    skillRating?: number;
    wins?: number;
    ties?: number;
    losses?: number;
    gamesPlayed?: number;
    name?: string;
    crestAssetId?: string;
  }>;
  const porId = new Map(docs.map((d) => [d.clubId, d]));
  for (const v of vagas) {
    if (!v.eaClubId) continue;
    const d = porId.get(v.eaClubId);
    if (!d) continue;
    v.clubeSnapshot = {
      currentDivision: d.currentDivision ?? v.clubeSnapshot?.currentDivision,
      skillRating: d.skillRating ?? v.clubeSnapshot?.skillRating,
      wins: d.wins ?? v.clubeSnapshot?.wins,
      ties: d.ties ?? v.clubeSnapshot?.ties,
      losses: d.losses ?? v.clubeSnapshot?.losses,
      gamesPlayed: d.gamesPlayed ?? v.clubeSnapshot?.gamesPlayed,
      memberCount: v.clubeSnapshot?.memberCount,
    };
    if (d.name && !v.clubeNome) v.clubeNome = d.name;
  }
}

export interface EstatisticasMercado {
  clubesRecrutando: number;
  jogadoresLivres: number;
  novasNaSemana: number;
  /** Posições por demanda (contagem de vagas de clube que pedem cada uma). */
  demandaPosicoes: Array<{ code: string; sigla: string; nome: string; total: number }>;
  /** A posição mais pedida, pronta para o número grande. */
  posicaoMaisPedida: { code: string; sigla: string; nome: string; total: number } | null;
}

/**
 * Os DADOS DO MERCADO que o Ricardo pediu ("dados do mercado" para managers e
 * players): quantos clubes recrutam, quantos jogadores estão livres, o que
 * apareceu na semana e — o número que orienta quem vai se anunciar — qual
 * posição os clubes mais procuram.
 */
export async function estatisticasMercado(): Promise<EstatisticasMercado> {
  await dbConnect();
  const agora = new Date();
  const seteDias = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ativo = { status: "ativa", expiraEm: { $gt: agora } };

  const [clubesRecrutando, jogadoresLivres, novasNaSemana, demanda] = await Promise.all([
    GameVaga.countDocuments({ ...ativo, tipo: "clube" }),
    GameVaga.countDocuments({ ...ativo, tipo: "jogador" }),
    GameVaga.countDocuments({ ...ativo, createdAt: { $gt: seteDias } }),
    GameVaga.aggregate<{ _id: string; total: number }>([
      { $match: { ...ativo, tipo: "clube" } },
      { $unwind: "$posicoes" },
      { $group: { _id: "$posicoes", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
  ]);

  const nomePorCode = new Map(POSICOES.map((p) => [p.code, p]));
  const demandaPosicoes = demanda
    .filter((d) => d._id && d._id !== "TODAS")
    .map((d) => {
      const p = nomePorCode.get(d._id);
      return { code: d._id, sigla: p?.sigla ?? d._id, nome: p?.nome ?? d._id, total: d.total };
    });

  return {
    clubesRecrutando,
    jogadoresLivres,
    novasNaSemana,
    demandaPosicoes,
    posicaoMaisPedida: demandaPosicoes[0] ?? null,
  };
}
