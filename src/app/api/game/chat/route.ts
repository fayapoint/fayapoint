import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { cobrar } from "@/lib/game/limite";
import GameChat from "@/models/GameChat";
import GamePlayer from "@/models/GamePlayer";
import User from "@/models/User";
import { ehFederacao } from "@/lib/game/gestao";

/**
 * GET   /api/game/chat — a sala, do mais novo para o mais velho
 * POST  /api/game/chat — fala
 * PATCH /api/game/chat — esconde uma fala (só federação)
 *
 * ## Ler é público; falar exige conta
 *
 * Mesmo desenho do saguão: quem chegou agora precisa VER a sala antes de
 * decidir entrar. Falar exige login, porque fala sem dono não tem a quem
 * responsabilizar — e o Estatuto inteiro se apoia em decisão com responsável.
 */
export const dynamic = "force-dynamic";

const LIMITE_TEXTO = 500;
const POR_PAGINA = 50;

/** Quantas falas uma pessoa pode mandar por minuto, contadas no banco. */
const FALAS_POR_MINUTO = 12;

export async function GET(req: Request) {
  const teto = await cobrar(req, "comunidade", "chat");
  if (!teto.ok) return teto.resposta!;

  const url = new URL(req.url);
  const canal = (url.searchParams.get("canal") ?? "geral").slice(0, 24);
  const desde = url.searchParams.get("desde");

  await dbConnect();

  /**
   * `desde` traz só o que chegou depois — é o que faz a sondagem ser barata.
   * Sem ele, cada leitura de 5 em 5 segundos traria as 50 mensagens de novo.
   */
  const filtro: Record<string, unknown> = { canal, oculta: { $ne: true } };
  if (desde && !Number.isNaN(Date.parse(desde))) {
    filtro.createdAt = { $gt: new Date(desde) };
  }

  const docs = await GameChat.find(filtro)
    .sort({ createdAt: -1 })
    .limit(POR_PAGINA)
    .select("nome avatarSeed federacao texto createdAt")
    .lean();

  return NextResponse.json(
    {
      // Devolve em ordem de leitura: a mais antiga primeiro.
      mensagens: docs.reverse().map((d) => ({
        id: String(d._id),
        nome: d.nome,
        avatarSeed: d.avatarSeed ?? null,
        federacao: !!d.federacao,
        texto: d.texto,
        em: d.createdAt,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "entre na sua conta para falar" }, { status: 401 });

  const teto = await cobrar(req, "comunidade", "chat-escrita");
  if (!teto.ok) return teto.resposta!;

  let body: { texto?: unknown; canal?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  /**
   * Normalização antes de qualquer coisa.
   *
   * O corte de quebras de linha repetidas não é estética: sem ele, uma pessoa
   * empurra a sala inteira para fora da tela com uma mensagem só, e isso é o
   * jeito mais barato de calar todo mundo sem escrever um palavrão.
   */
  const texto = String(body.texto ?? "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, LIMITE_TEXTO);

  if (texto.length < 1) return NextResponse.json({ error: "escreva alguma coisa" }, { status: 400 });

  const canal = String(body.canal ?? "geral").slice(0, 24);

  await dbConnect();

  /**
   * O teto por PESSOA, contado no banco, além do teto por IP do `cobrar`.
   *
   * O limitador por IP não protege a sala: uma casa inteira sai pelo mesmo IP,
   * e a mesma pessoa troca de rede em dois toques no celular. Quem inunda a
   * sala é uma conta, e é a conta que precisa ser segurada.
   */
  const umMinutoAtras = new Date(Date.now() - 60_000);
  const recentes = await GameChat.countDocuments({
    userId: new mongoose.Types.ObjectId(user.id),
    createdAt: { $gt: umMinutoAtras },
  });
  if (recentes >= FALAS_POR_MINUTO) {
    return NextResponse.json({ error: "devagar — espere um pouco para falar de novo" }, { status: 429 });
  }

  /**
   * O nome de quem fala: a gamertag, se a pessoa já vinculou um jogador.
   *
   * Numa sala de Pro Clubs, "Murriz10" identifica alguém e "Ricardo" não. Quem
   * ainda não vinculou aparece pelo nome da conta — e é mais um motivo para
   * vincular, que é o que a gente quer.
   */
  const [pro, conta] = await Promise.all([
    GamePlayer.findOne({ ownerUserId: user.id, isActive: true }).select("gamertag").lean() as Promise<{ gamertag?: string } | null>,
    User.findById(user.id).select("name role").lean() as Promise<{ name?: string; role?: string } | null>,
  ]);

  const nome = (pro?.gamertag || conta?.name || "jogador").slice(0, 40);

  const doc = await GameChat.create({
    canal,
    userId: new mongoose.Types.ObjectId(user.id),
    nome,
    avatarSeed: user.id,
    // Congelado no envio: se a pessoa deixar a federação, a fala antiga não
    // vira retroativamente fala de gente comum, nem o contrário.
    federacao: ehFederacao(conta?.role),
    texto,
  });

  return NextResponse.json({
    ok: true,
    mensagem: {
      id: String(doc._id),
      nome: doc.nome,
      avatarSeed: doc.avatarSeed ?? null,
      federacao: doc.federacao,
      texto: doc.texto,
      em: doc.createdAt,
    },
  });
}

export async function PATCH(req: Request) {
  const user = await getAuthUser();
  await dbConnect();
  const conta = user ? ((await User.findById(user.id).select("role").lean()) as { role?: string } | null) : null;
  if (!conta || !ehFederacao(conta.role)) {
    return NextResponse.json({ error: "reservado à federação" }, { status: 403 });
  }

  let body: { id?: unknown; motivo?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const id = String(body.id ?? "");
  const motivo = String(body.motivo ?? "").trim();
  if (!mongoose.isObjectIdOrHexString(id)) {
    return NextResponse.json({ error: "mensagem inválida" }, { status: 400 });
  }
  /**
   * Esconder EXIGE motivo, pela mesma razão que descartar candidato exige:
   * seis meses depois, ninguém entende uma decisão sem motivo — e o Estatuto
   * (art. 30) manda que toda decisão tenha responsável e razão escrita.
   */
  if (motivo.length < 3) {
    return NextResponse.json({ error: "esconder exige motivo escrito" }, { status: 400 });
  }

  // Esconde, nunca apaga: a prova sobrevive ao processo disciplinar.
  const doc = await GameChat.findByIdAndUpdate(
    id,
    { $set: { oculta: true, ocultaPor: new mongoose.Types.ObjectId(user!.id), ocultaMotivo: motivo, ocultaEm: new Date() } },
    { new: true }
  );
  if (!doc) return NextResponse.json({ error: "mensagem não encontrada" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
