import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import GameVaga, { type IGameVaga } from "@/models/GameVaga";
import GameEaClube from "@/models/GameEaClube";
import { cobrar } from "@/lib/game/limite";
import { normalizarPosicoes } from "@/lib/game/posicoes";
import { CODIGOS_DIA } from "@/lib/game/copy-mercado";
import {
  serializarVaga,
  enriquecerComEspelho,
  enriquecerReputacao,
  type VagaSerializada,
} from "@/lib/game/mercado-servidor";

/**
 * GET  /api/game/mercado   — a vitrine do mercado, com filtros
 * POST /api/game/mercado   — publica uma vaga (auth)
 *
 * A vitrine é uma consulta agregada só (mais o enriquecimento em lote pelo
 * espelho), então ela pode ser servida com cache curto de borda. A publicação
 * é autenticada e, quando a vaga aponta um `eaClubId`, nasce com a divisão e a
 * campanha REAIS do espelho — é o que separa este mercado do cartaz do grupo.
 */
export const dynamic = "force-dynamic";

const PLATAFORMAS = ["common-gen5", "common-gen4", "mista"];
const ORDENS = ["recentes", "divisao", "overall"];

export async function GET(req: Request) {
  const teto = await cobrar(req, "mercado-leitura");
  if (!teto.ok) return teto.resposta!;

  const url = new URL(req.url);
  const tipo = url.searchParams.get("tipo");
  const posicao = url.searchParams.get("posicao");
  const plataforma = url.searchParams.get("plataforma");
  const ordenar = url.searchParams.get("ordenar") ?? "recentes";
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 60);
  const limite = Math.min(60, Math.max(1, Number(url.searchParams.get("limite") ?? 40)));

  await dbConnect();
  const filtro: Record<string, unknown> = {
    status: "ativa",
    expiraEm: { $gt: new Date() },
  };
  if (tipo === "clube" || tipo === "jogador") filtro.tipo = tipo;
  if (posicao) {
    const [p] = normalizarPosicoes([posicao]);
    // Uma vaga marcada "TODAS" responde a qualquer filtro de posição.
    if (p) filtro.posicoes = { $in: [p, "TODAS"] };
  }
  if (plataforma && PLATAFORMAS.includes(plataforma)) {
    // "mista" enxerga e é enxergada por todo mundo.
    filtro.plataforma =
      plataforma === "mista" ? plataforma : { $in: [plataforma, "mista"] };
  }
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filtro.$or = [
      { clubeNome: rx },
      { gamertag: rx },
      { proName: rx },
      { estilo: rx },
      { titulo: rx },
    ];
  }

  let ordem: Record<string, 1 | -1>;
  if (ordenar === "divisao" && ORDENS.includes(ordenar)) {
    ordem = { destaque: -1, "clubeSnapshot.currentDivision": 1, createdAt: -1 };
  } else if (ordenar === "overall") {
    ordem = { destaque: -1, overall: -1, createdAt: -1 };
  } else {
    ordem = { destaque: -1, createdAt: -1 };
  }

  const docs = (await GameVaga.find(filtro)
    .sort(ordem)
    .limit(limite)
    .lean()) as unknown as Array<IGameVaga & { _id: unknown }>;

  const user = await getAuthUser().catch(() => null);
  const vagas: VagaSerializada[] = docs.map((d) => serializarVaga(d, { userId: user?.id }));
  await Promise.all([enriquecerComEspelho(vagas), enriquecerReputacao(vagas)]);

  return NextResponse.json(
    { vagas },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } }
  );
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });

  const teto = await cobrar(req, "mercado-escrita");
  if (!teto.ok) return teto.resposta!;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const tipo = body.tipo === "jogador" ? "jogador" : "clube";
  const posicoes = normalizarPosicoes(body.posicoes);
  if (posicoes.length === 0) {
    return NextResponse.json({ error: "escolha ao menos uma posição" }, { status: 400 });
  }

  const plataforma = PLATAFORMAS.includes(String(body.plataforma))
    ? String(body.plataforma)
    : "common-gen5";
  const dias = Array.isArray(body.dias)
    ? [...new Set(body.dias.map((d) => String(d)).filter((d) => CODIGOS_DIA.includes(d)))]
    : [];
  const contatoTipo = ["plataforma", "discord", "whatsapp"].includes(String(body.contatoTipo))
    ? String(body.contatoTipo)
    : "plataforma";

  await dbConnect();

  const base: Partial<IGameVaga> = {
    tipo,
    ownerUserId: user.id as unknown as IGameVaga["ownerUserId"],
    posicoes,
    plataforma: plataforma as IGameVaga["plataforma"],
    dias,
    horario: String(body.horario ?? "").trim().slice(0, 40) || undefined,
    regiao: String(body.regiao ?? "").trim().slice(0, 40) || undefined,
    descricao: String(body.descricao ?? "").trim().slice(0, 600) || undefined,
    contatoTipo: contatoTipo as IGameVaga["contatoTipo"],
    contato: String(body.contato ?? "").trim().slice(0, 200) || undefined,
    status: "ativa",
    sourceGrade: "E",
  };

  if (tipo === "clube") {
    const clubeNome = String(body.clubeNome ?? "").trim().slice(0, 80);
    if (clubeNome.length < 2) {
      return NextResponse.json({ error: "informe o nome do clube" }, { status: 400 });
    }
    base.clubeNome = clubeNome;
    base.minOverall = numeroOuUndef(body.minOverall, 0, 99);

    const eaClubId = String(body.eaClubId ?? "").trim();
    if (eaClubId) {
      // A vaga ligada a um clube da EA nasce com a divisão e a campanha REAIS
      // do espelho — e sobe de "declarado" (E) para "fonte pública" (B).
      const doc = (await GameEaClube.findOne({ clubId: eaClubId })
        .select("clubId name currentDivision skillRating wins ties losses gamesPlayed crestAssetId")
        .lean()) as unknown as {
        clubId: string;
        name?: string;
        currentDivision?: number;
        skillRating?: number;
        wins?: number;
        ties?: number;
        losses?: number;
        gamesPlayed?: number;
        crestAssetId?: string;
      } | null;
      base.eaClubId = eaClubId;
      if (doc) {
        base.clubeNome = doc.name || clubeNome;
        base.crestAssetId = doc.crestAssetId;
        base.clubeSnapshot = {
          currentDivision: doc.currentDivision,
          skillRating: doc.skillRating,
          wins: doc.wins,
          ties: doc.ties,
          losses: doc.losses,
          gamesPlayed: doc.gamesPlayed,
        };
        base.sourceGrade = "B";
      }
    }
  } else {
    const gamertag = String(body.gamertag ?? "").trim().slice(0, 40);
    if (gamertag.length < 2) {
      return NextResponse.json({ error: "informe sua gamertag" }, { status: 400 });
    }
    base.gamertag = gamertag;
    base.proName = String(body.proName ?? "").trim().slice(0, 40) || undefined;
    base.estilo = String(body.estilo ?? "").trim().slice(0, 24) || undefined;
    base.overall = numeroOuUndef(body.overall, 0, 99);
  }

  const vaga = await GameVaga.create(base);
  return NextResponse.json(
    { ok: true, vaga: serializarVaga(vaga as unknown as IGameVaga & { _id: unknown }, { userId: user.id }) },
    { status: 201 }
  );
}

function numeroOuUndef(v: unknown, min: number, max: number): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) return undefined;
  return Math.round(n);
}
