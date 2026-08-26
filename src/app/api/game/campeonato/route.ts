import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import GameCompeticao from "@/models/GameCompeticao";
import GameTime from "@/models/GameTime";
import { cobrar } from "@/lib/game/limite";
import { gerarSlug } from "@/lib/game/competicao-servidor";
import { presetPorId, PRESETS, type FormatoCompeticao } from "@/lib/game/campeonato";

/**
 * GET  /api/game/campeonato        — a vitrine de campeonatos públicos
 * POST /api/game/campeonato        — cria um campeonato (auth)
 *
 * A criação aceita duas formas: **um preset** (o caminho de um clique) ou os
 * campos soltos, para quem quer um formato que nenhum preset cobre. O preset
 * não é uma cerca: ele preenche as regras e a pessoa muda o que quiser depois.
 */
export const dynamic = "force-dynamic";

const FORMATOS: FormatoCompeticao[] = ["pontos-corridos", "mata-mata", "grupos-mata-mata"];

export async function GET(req: Request) {
  const teto = await cobrar(req, "campeonato-leitura");
  if (!teto.ok) return teto.resposta!;

  const url = new URL(req.url);
  const limite = Math.min(50, Math.max(1, Number(url.searchParams.get("limite") ?? 24)));

  await dbConnect();
  const competicoes = await GameCompeticao.find({ publico: true })
    .select("slug nome descricao formato status vagas plataforma inicioEm arte createdAt")
    .sort({ createdAt: -1 })
    .limit(limite)
    .lean();

  // Contar times numa segunda consulta, agregada: N+1 aqui viraria 24 idas.
  const ids = competicoes.map((c) => c._id);
  const contagens = await GameTime.aggregate([
    { $match: { competicaoId: { $in: ids }, ativo: true } },
    { $group: { _id: "$competicaoId", total: { $sum: 1 } } },
  ]);
  const porId = new Map(contagens.map((c) => [String(c._id), c.total as number]));

  return NextResponse.json(
    {
      competicoes: competicoes.map((c) => ({
        ...c,
        _id: String(c._id),
        inscritos: porId.get(String(c._id)) ?? 0,
      })),
      presets: PRESETS,
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });

  const teto = await cobrar(req, "campeonato-escrita");
  if (!teto.ok) return teto.resposta!;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const nome = String(body.nome ?? "").trim();
  if (nome.length < 3 || nome.length > 80) {
    return NextResponse.json({ error: "nome deve ter de 3 a 80 caracteres" }, { status: 400 });
  }

  const preset = body.preset ? presetPorId(String(body.preset)) : null;
  const formatoPedido = String(body.formato ?? preset?.formato ?? "pontos-corridos");
  const formato = (FORMATOS.includes(formatoPedido as FormatoCompeticao)
    ? formatoPedido
    : "pontos-corridos") as FormatoCompeticao;

  const regrasBase = preset?.regras ?? {
    turnos: 1 as const,
    pontosVitoria: 3,
    pontosEmpate: 1,
    pontosDerrota: 0,
    criteriosDesempate: ["pontos", "vitorias", "saldo", "golsPro", "confrontoDireto"],
  };
  const regrasPedidas = (body.regras ?? {}) as Record<string, unknown>;

  await dbConnect();
  const competicao = await GameCompeticao.create({
    slug: gerarSlug(nome),
    nome,
    descricao: String(body.descricao ?? "").slice(0, 500) || undefined,
    organizadorUserId: user.id,
    formato,
    preset: preset?.id,
    plataforma: ["common-gen5", "common-gen4", "mista"].includes(String(body.plataforma))
      ? String(body.plataforma)
      : "common-gen5",
    status: "inscricoes",
    vagas: Math.min(64, Math.max(2, Number(body.vagas ?? preset?.vagas ?? 8))),
    regras: {
      ...regrasBase,
      // O que a pessoa mandou explicitamente vence o preset.
      ...Object.fromEntries(Object.entries(regrasPedidas).filter(([, v]) => v !== undefined)),
    },
    inicioEm: body.inicioEm ? new Date(String(body.inicioEm)) : undefined,
    publico: body.publico !== false,
  });

  return NextResponse.json(
    { ok: true, slug: competicao.slug, nome: competicao.nome },
    { status: 201 }
  );
}
