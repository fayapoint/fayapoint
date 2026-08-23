import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import GameInteresse from "@/models/GameInteresse";

/**
 * POST /api/game/liga/inscrever
 * { email, role, clubName?, eaClubId?, plataforma?, psnOrGamertag?, message?, locale? }
 *
 * Fila de interesse da liga piloto (8–16 clubes, outubro/2026). Aceita
 * visitante sem conta; se houver sessão, amarra o userId. Upsert por
 * (email, role): reenviar o formulário atualiza em vez de duplicar.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "e-mail inválido" }, { status: 400 });
  }

  const roles = ["captain", "player", "organizer", "fan"];
  const role = roles.includes(String(body.role)) ? String(body.role) : "player";

  const user = await getAuthUser();

  await dbConnect();
  await GameInteresse.findOneAndUpdate(
    { email, role },
    {
      $set: {
        userId: user?.id ?? undefined,
        clubName: body.clubName ? String(body.clubName).slice(0, 120) : undefined,
        eaClubId: body.eaClubId ? String(body.eaClubId).slice(0, 12) : undefined,
        platform: body.plataforma ? String(body.plataforma).slice(0, 20) : undefined,
        psnOrGamertag: body.psnOrGamertag ? String(body.psnOrGamertag).slice(0, 60) : undefined,
        message: body.message ? String(body.message).slice(0, 2000) : undefined,
        locale: body.locale === "en" ? "en" : "pt-BR",
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  return NextResponse.json({ ok: true });
}
