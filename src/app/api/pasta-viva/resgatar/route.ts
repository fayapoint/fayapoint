import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import PastaVivaCodigo from "@/models/PastaVivaCodigo";
import { montarMatricula } from "@/lib/matricula";
import { CURSO_DA_PASTA } from "@/lib/pasta-viva/acesso";

export const dynamic = "force-dynamic";

/**
 * Resgate do código impresso no PDF: transforma "comprei na Hotmart" em
 * matrícula aqui.
 *
 * ⚠️ A matrícula sai de `montarMatricula`, nunca de objeto literal. O schema
 * exige `level`, e foi exatamente o objeto literal sem `level` que fez a única
 * venda real do site falhar na entrega ([[reference_matricula_level_obrigatorio]]).
 *
 * ## A ordem das operações não é arbitrária
 *
 * Marcamos o código como usado ANTES de gravar a matrícula, com um
 * `findOneAndUpdate` condicional que só passa se ele ainda estiver livre. Se a
 * matrícula falhar depois disso, devolvemos o código. O contrário — matricular
 * primeiro — deixaria dois cliques rápidos resgatarem o mesmo código em duas
 * contas.
 */
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json(
      { erro: "Entre na sua conta para resgatar o código." },
      { status: 401 },
    );
  }

  let codigo = "";
  try {
    const corpo = await req.json();
    codigo = String(corpo?.codigo || "").trim().toUpperCase();
  } catch {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }

  if (!codigo) {
    return NextResponse.json({ erro: "Digite o código que veio no PDF." }, { status: 400 });
  }

  await dbConnect();

  const jaTem = await User.findOne({
    _id: authUser.id,
    "enrolledCourses.courseSlug": CURSO_DA_PASTA,
  }).select("_id").lean();
  if (jaTem) {
    return NextResponse.json({ ok: true, jaTinha: true });
  }

  // Só reserva se estiver livre e não revogado — a condição é a trava.
  const reservado = await PastaVivaCodigo.findOneAndUpdate(
    { codigo, revogado: false, usadoPor: null },
    { $set: { usadoPor: authUser.id, usadoEm: new Date() } },
    { new: true },
  );

  if (!reservado) {
    const existe = await PastaVivaCodigo.findOne({ codigo }).select("usadoPor revogado").lean();
    if (!existe) {
      return NextResponse.json(
        { erro: "Código não encontrado. Confira as letras — ele está na primeira página do PDF." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { erro: "Este código já foi resgatado. Cada código vale para uma conta só." },
      { status: 409 },
    );
  }

  try {
    const matricula = await montarMatricula({
      courseId: CURSO_DA_PASTA,
      courseSlug: CURSO_DA_PASTA,
      source: "purchase",
    });
    await User.updateOne(
      { _id: authUser.id },
      { $push: { enrolledCourses: matricula } },
    );
  } catch (erro) {
    // Devolve o código: sem isto a pessoa paga, falha e fica sem nada e sem
    // segunda chance.
    await PastaVivaCodigo.updateOne(
      { codigo },
      { $set: { usadoPor: null, usadoEm: null } },
    );
    console.error("[pasta-viva] resgate falhou depois de reservar", codigo, erro);
    return NextResponse.json(
      { erro: "Não consegui liberar o acesso agora. Tente de novo em um minuto." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
