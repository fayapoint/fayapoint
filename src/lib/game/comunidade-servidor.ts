import dbConnect from "@/lib/mongodb";
import GamePresenca from "@/models/GamePresenca";
import GameCompeticao from "@/models/GameCompeticao";
import GameVaga from "@/models/GameVaga";
import GamePlayer from "@/models/GamePlayer";
import GameAvaliacao from "@/models/GameAvaliacao";
import { reputacaoDe, chaveGamertag, type ResumoReputacao } from "./reputacao";

/**
 * A CAMADA DE SERVIDOR da comunidade — o que a área principal do Winners 22 lê.
 *
 * Duas coisas: o RETRATO DE AGORA (quem está online, quantos, com que status) e
 * os NÚMEROS que dão a sensação de lugar movimentado (campeonatos, vagas,
 * jogadores no banco, avaliações). Uma consulta agregada por coisa, nada de N+1.
 */

/** "Online agora" = pulso nos últimos 45s. O TTL (120s) é só a faxina. */
export const JANELA_ONLINE_MS = 45_000;

export interface JogadorOnline {
  seed: string;
  gamertag: string | null;
  posicao: string | null;
  overall: number | null;
  status: "online" | "procurando" | "jogando";
  reputacao?: ResumoReputacao;
}

export interface RetratoOnline {
  total: number;
  jogadores: number;
  visitantes: number;
  procurando: number;
  lista: JogadorOnline[];
}

export async function snapshotOnline(limite = 80): Promise<RetratoOnline> {
  await dbConnect();
  const desde = new Date(Date.now() - JANELA_ONLINE_MS);

  const [jogadores, visitantes, procurando, docs] = await Promise.all([
    GamePresenca.countDocuments({ tipo: "jogador", lastSeen: { $gt: desde } }),
    GamePresenca.countDocuments({ tipo: "visitante", lastSeen: { $gt: desde } }),
    GamePresenca.countDocuments({ tipo: "jogador", status: "procurando", lastSeen: { $gt: desde } }),
    GamePresenca.find({ tipo: "jogador", lastSeen: { $gt: desde } })
      // Quem procura jogo primeiro — é o estado que a comunidade quer ver.
      .sort({ status: 1, lastSeen: -1 })
      .limit(limite)
      .lean(),
  ]);

  const lista: JogadorOnline[] = (docs as unknown as Array<{
    avatarSeed?: string;
    userId?: unknown;
    gamertag?: string;
    posicao?: string;
    overall?: number;
    status: JogadorOnline["status"];
  }>).map((d) => ({
    seed: d.avatarSeed || String(d.userId) || d.gamertag || "x",
    gamertag: d.gamertag ?? null,
    posicao: d.posicao ?? null,
    overall: d.overall ?? null,
    status: d.status,
  }));

  // Reputação em lote para quem tem gamertag.
  const gts = lista.map((j) => j.gamertag).filter(Boolean) as string[];
  if (gts.length) {
    const rep = await reputacaoDe(gts);
    for (const j of lista) {
      if (j.gamertag) {
        const r = rep.get(chaveGamertag(j.gamertag));
        if (r) j.reputacao = r;
      }
    }
  }

  return { total: jogadores + visitantes, jogadores, visitantes, procurando, lista };
}

export interface NumerosComunidade {
  online: RetratoOnline;
  campeonatos: number;
  campeonatosAtivos: number;
  vagasClubes: number;
  vagasJogadores: number;
  jogadoresBanco: number;
  avaliacoes: number;
}

export async function numerosComunidade(): Promise<NumerosComunidade> {
  await dbConnect();
  const agora = new Date();
  const ativo = { status: "ativa", expiraEm: { $gt: agora } };

  const [online, campeonatos, campeonatosAtivos, vagasClubes, vagasJogadores, jogadoresBanco, avaliacoes] =
    await Promise.all([
      snapshotOnline(),
      GameCompeticao.countDocuments({ publico: true }),
      GameCompeticao.countDocuments({ publico: true, status: { $in: ["inscricoes", "em-andamento"] } }),
      GameVaga.countDocuments({ ...ativo, tipo: "clube" }),
      GameVaga.countDocuments({ ...ativo, tipo: "jogador" }),
      GamePlayer.countDocuments({ isActive: true }),
      GameAvaliacao.estimatedDocumentCount(),
    ]);

  return {
    online,
    campeonatos,
    campeonatosAtivos,
    vagasClubes,
    vagasJogadores,
    jogadoresBanco,
    avaliacoes,
  };
}

export interface MembroComunidade {
  seed: string;
  nome: string;
  posicao: string | null;
  tipo: "jogador" | "clube";
  reputacao?: ResumoReputacao;
}

/**
 * Uma AMOSTRA da comunidade para encher a nuvem quando há pouca gente online.
 * Sai das vagas ativas e dos jogadores reivindicados — rostos reais do acervo,
 * não bonecos inventados. Rotulada na tela como "na comunidade", distinta de
 * "online agora": ninguém é apresentado como conectado sem estar.
 */
export async function amostraComunidade(limite = 48): Promise<MembroComunidade[]> {
  await dbConnect();
  const vagas = (await GameVaga.find({ tipo: "jogador", status: "ativa" })
    .select("gamertag posicoes")
    .sort({ createdAt: -1 })
    .limit(limite)
    .lean()) as unknown as Array<{ gamertag?: string; posicoes?: string[] }>;

  const membros: MembroComunidade[] = vagas
    .filter((v) => v.gamertag)
    .map((v) => ({
      seed: v.gamertag!,
      nome: v.gamertag!,
      posicao: v.posicoes?.[0] ?? null,
      tipo: "jogador" as const,
    }));

  const gts = membros.map((m) => m.seed);
  if (gts.length) {
    const rep = await reputacaoDe(gts);
    for (const m of membros) {
      const r = rep.get(chaveGamertag(m.seed));
      if (r) m.reputacao = r;
    }
  }
  return membros;
}
