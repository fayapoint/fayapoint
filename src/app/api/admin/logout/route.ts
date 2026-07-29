import { NextResponse } from "next/server";

/**
 * Encerra a sessão do painel.
 *
 * Existe porque o `logout` do `AdminContext` só limpava o `localStorage`, e o
 * cookie `fayai_admin_token` — que é o que o portão do proxy lê — é `httpOnly`:
 * JS não consegue apagá-lo. Sem esta rota, "sair" deixava a pessoa fora da
 * interface mas com o cookie ainda valendo por até 24h, e o portão continuaria
 * deixando entrar quem digitasse a URL.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set("fayai_admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
