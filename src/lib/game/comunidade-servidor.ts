import dbConnect from "@/lib/mongodb";
import Fundador from "@/models/Fundador";
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
  /** Número de fundador, quando houver — desenha o aro dourado no boneco. */
  fundador?: number;
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

  const brutos = docs as unknown as Array<{
    avatarSeed?: string;
    userId?: unknown;
    gamertag?: string;
    posicao?: string;
    overall?: number;
    status: JogadorOnline["status"];
  }>;

  const lista: JogadorOnline[] = brutos.map((d) => ({
    seed: d.avatarSeed || String(d.userId) || d.gamertag || "x",
    gamertag: d.gamertag ?? null,
    posicao: d.posicao ?? null,
    overall: d.overall ?? null,
    status: d.status,
  }));

  /**
   * O selo de fundador na nuvem da comunidade — 06/09/2026.
   *
   * Uma consulta em lote para todos os online, não uma por boneco: a nuvem
   * chega a 80 jogadores e o pulso roda a cada 20 segundos. Oitenta consultas
   * a cada pulso, por visitante, derrubariam o Mongo antes de a comunidade
   * ficar interessante.
   *
   * Falha em silêncio: sem o selo a nuvem continua funcionando, e presença é
   * dado de tela, não de dinheiro.
   */
  const ids = brutos.map((d) => d.userId).filter(Boolean);
  if (ids.length) {
    try {
      const fundadores = await Fundador.find({ userId: { $in: ids }, status: "ativo" })
        .select("userId numero")
        .lean();
      const porUsuario = new Map(fundadores.map((f) => [String(f.userId), f.numero]));
      brutos.forEach((d, i) => {
        const n = porUsuario.get(String(d.userId));
        if (n) lista[i].fundador = n;
      });
    } catch {
      // sem selo, e segue
    }
  }

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
