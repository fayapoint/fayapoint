import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import GameTime from "@/models/GameTime";
import { cobrar } from "@/lib/game/limite";
import { carregarCompeticao, ehOrganizador, paraObjectId } from "@/lib/game/competicao-servidor";
import { clubeComEspelho } from "@/lib/game/espelho";
import type { EaPlatform } from "@/lib/game/ea-api";

/**
 * POST   /api/game/campeonato/[slug]/times   — inscreve um time
 * DELETE /api/game/campeonato/[slug]/times   — remove um time (body: { timeId })
 *
 * **As duas portas de entrada, de propósito:**
 *
 * 1. `eaClubId` — o time é um clube real do Clubs. Puxamos nome, cores e
 *    elenco do espelho, e o time nasce com `sourceGrade: 'B'` (fonte pública).
 * 2. `nome` + `elenco` na mão — para quem não acha o clube na EA. Clube novo,
 *    plataforma errada ou fonte fora do ar não podem impedir alguém de entrar
 *    no campeonato. Esse time nasce com `sourceGrade: 'E'` (declarado), e a
 *    diferença aparece na tela: dado declarado nunca se disfarça de medido.
 *
 * Só o organizador inscreve. A checagem é aqui, não na interface.
 */
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });

  const teto = await cobrar(req, "campeonato-escrita", slug);
  if (!teto.ok) return teto.resposta!;

  const dados = await carregarCompeticao(slug);
  if (!dados) return NextResponse.json({ error: "campeonato não encontrado" }, { status: 404 });
  if (!ehOrganizador(dados.competicao, user.id)) {
    return NextResponse.json({ error: "só o organizador inscreve times" }, { status: 403 });
  }
  if (dados.confrontos.length > 0) {
    return NextResponse.json(
      { error: "a tabela já foi gerada — remova a tabela antes de mexer nos times" },
      { status: 409 }
    );
  }
  if (dados.times.length >= dados.competicao.vagas) {
    return NextResponse.json({ error: "as vagas acabaram" }, { status: 409 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const eaClubId = String(body.eaClubId ?? "").trim();
  const plataforma = (
    body.plataforma === "common-gen4" ? "common-gen4" : "common-gen5"
  ) as EaPlatform;

  let nome = String(body.nome ?? "").trim();
  let cor: string | undefined;
  let elenco: Array<{ gamertag: string; proName?: string; posicao?: string; overall?: number }> = [];
  let origem: "ea" | "manual" = "manual";
  let sourceGrade: "B" | "E" = "E";

  if (/^\d{1,12}$/.test(eaClubId)) {
    const r = await clubeComEspelho(eaClubId, plataforma);
    if (!r.dados?.info) {
      return NextResponse.json(
        { error: "clube não encontrado na fonte nem no nosso acervo" },
        { status: 404 }
      );
    }
    origem = "ea";
    sourceGrade = "B";
    nome = nome || r.dados.info.name;
    const membros = (r.dados.members ?? []) as Array<Record<string, unknown>>;
    elenco = membros.slice(0, 30).map((m) => ({
      gamertag: String(m.name ?? "?"),
      proName: m.proName ? String(m.proName) : undefined,
      posicao: m.favoritePosition ? String(m.favoritePosition) : undefined,
      overall: typeof m.proOverall === "number" ? m.proOverall : undefined,
    }));
  } else {
    if (nome.length < 2 || nome.length > 40) {
      return NextResponse.json(
        { error: "informe o ID do clube na EA ou um nome de 2 a 40 caracteres" },
        { status: 400 }
      );
    }
    const cru = Array.isArray(body.elenco) ? body.elenco : [];
    elenco = cru
      .slice(0, 30)
      .map((j) => {
        const o = (j ?? {}) as Record<string, unknown>;
        return {
          gamertag: String(o.gamertag ?? "").trim().slice(0, 40),
          proName: o.proName ? String(o.proName).slice(0, 40) : undefined,
          posicao: o.posicao ? String(o.posicao).slice(0, 20) : undefined,
          overall: Number.isFinite(Number(o.overall)) ? Number(o.overall) : undefined,
        };
      })
      .filter((j) => j.gamertag.length >= 2);
    cor = typeof body.cor === "string" ? body.cor.slice(0, 9) : undefined;
  }

  const sigla =
    String(body.sigla ?? "")
      .trim()
      .slice(0, 4)
      .toUpperCase() ||
    nome
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .split(/\s+/)
      .map((p) => p[0] ?? "")
      .join("")
      .slice(0, 3)
      .toUpperCase();

  try {
    const time = await GameTime.create({
      competicaoId: dados.competicao._id,
      nome,
      sigla,
      origem,
      eaClubId: origem === "ea" ? eaClubId : undefined,
      plataforma: origem === "ea" ? plataforma : undefined,
      cor,
      semente: dados.times.length + 1,
      capitaoUserId: paraObjectId(body.capitaoUserId) ?? undefined,
      elenco,
      sourceGrade,
    });
    return NextResponse.json(
      { ok: true, timeId: String(time._id), nome: time.nome, origem, sourceGrade },
      { status: 201 }
    );
  } catch (err) {
    // O índice único de (competição, nome) e o de (competição, clube da EA).
    if ((err as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "esse time já está inscrito" }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });

  const teto = await cobrar(req, "campeonato-escrita", slug);
  if (!teto.ok) return teto.resposta!;

  const dados = await carregarCompeticao(slug);
  if (!dados) return NextResponse.json({ error: "campeonato não encontrado" }, { status: 404 });
  if (!ehOrganizador(dados.competicao, user.id)) {
    return NextResponse.json({ error: "só o organizador remove times" }, { status: 403 });
  }
  if (dados.confrontos.length > 0) {
    return NextResponse.json(
      { error: "a tabela já foi gerada — remova a tabela antes de mexer nos times" },
      { status: 409 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { timeId?: string };
  const id = paraObjectId(body.timeId);
  if (!id) return NextResponse.json({ error: "timeId inválido" }, { status: 400 });

  // Desativa em vez de apagar: se este time já apareceu em alguma súmula, o
  // documento continua sendo a chave que dá nome àquele registro.
  await GameTime.updateOne({ _id: id, competicaoId: dados.competicao._id }, { $set: { ativo: false } });
  return NextResponse.json({ ok: true });
}
