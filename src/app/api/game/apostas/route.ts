import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { cobrar } from "@/lib/game/limite";
import GameEvento from "@/models/GameEvento";
import GameMercadoAposta from "@/models/GameMercadoAposta";
import GameCompeticao from "@/models/GameCompeticao";
import GameAposta from "@/models/GameAposta";
import { registrarAposta } from "@/lib/game/apostas-servidor";
import { garantirCarteira, ErroCarteira } from "@/lib/game/carteira";

/**
 * GET  /api/game/apostas  — o saguão (eventos abertos) ou "minhas apostas"
 * POST /api/game/apostas  — registra um cupom
 *
 * O saguão é público de propósito: quem ainda não tem conta precisa VER o
 * cardápio antes de decidir entrar. É a resposta ao pedido de "um lugar para
 * começar mesmo sem ter jogador". A aposta, essa, exige login.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const teto = await cobrar(req, "aposta-leitura");
  if (!teto.ok) return teto.resposta!;

  const url = new URL(req.url);
  const modo = url.searchParams.get("modo") ?? "saguao";

  await dbConnect();

  if (modo === "minhas") {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });

    const cupons = await GameAposta.find({ userId: new mongoose.Types.ObjectId(user.id) })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(
      {
        apostas: cupons.map((c) => ({
          id: String(c._id),
          tipo: c.tipo,
          valor: c.valor,
          oddTotal: c.oddTotal,
          retornoPotencial: c.retornoPotencial,
          retorno: c.retorno,
          status: c.status,
          emSiMesmo: c.emSiMesmo,
          criadaEm: c.createdAt,
          liquidadaEm: c.liquidadaEm ?? null,
          pernas: c.pernas.map((p) => ({
            eventoSlug: p.eventoSlug,
            eventoNome: p.eventoNome,
            mercadoTitulo: p.mercadoTitulo,
            selecaoRotulo: p.selecaoRotulo,
            odd: p.odd,
            resultado: p.resultado ?? null,
          })),
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  /**
   * APOSTAR EM SI MESMO — o filtro por gamertag.
   *
   * O Ricardo pediu, em português claro, que o jogador pudesse "apostar em si
   * mesmo". O botão da ficha existia e levava para o saguão GENÉRICO: a pessoa
   * caía numa lista de oito partidas sem nenhuma relação visível com ela, e
   * tinha de abrir uma por uma para descobrir se estava escalada em alguma.
   *
   * Aqui o filtro é feito no banco, contra os dois elencos do evento. Ele NÃO
   * inventa mercado nenhum: se a pessoa não está escalada em partida aberta, a
   * lista volta vazia e a tela diz por quê. Prometer um mercado que não existe
   * seria pior do que o botão genérico.
   *
   * Insensível a maiúsculas porque a EA guarda a gamertag como o jogador
   * digitou, e quem chega pela ficha traz o que estava na URL.
   */
  const jogador = (url.searchParams.get("jogador") ?? "").trim().slice(0, 40);
  const filtroBase: Record<string, unknown> = { status: "aberto", comecaEm: { $gt: new Date() } };
  if (jogador) {
    const rx = new RegExp(`^${jogador.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    filtroBase.$or = [{ "mandante.elenco.gamertag": rx }, { "visitante.elenco.gamertag": rx }];
  }

  // O saguão: o que está aberto, do próximo a começar em diante, mais os
  // últimos liquidados — o resultado recente é o que dá confiança no cardápio.
  const abertos = await GameEvento.find(filtroBase)
    .sort({ comecaEm: 1 })
    .limit(24)
    .select("slug mandante visitante comecaEm equilibrio compromisso totalApostado totalCupons competicaoId rodada")
    .lean();

  const encerrados = await GameEvento.find({ status: "liquidado" })
    .sort({ liquidadoEm: -1 })
    .limit(6)
    .select("slug mandante.nome mandante.sigla visitante.nome visitante.sigla resultado.golsMandante resultado.golsVisitante liquidadoEm")
    .lean();

  /**
   * De que COMPETIÇÃO cada evento é prévia.
   *
   * Sem isto, a prévia de um confronto de campeonato aparece no saguão
   * idêntica a uma partida avulsa — e quem olha não tem como saber que aquele
   * jogo tem relação com um campeonato de verdade. O cabeçalho de
   * `previa-competicao.ts` prometia que "a tela pode dizer de que confronto ele
   * é prévia"; sem este trecho, a promessa vivia só no comentário.
   *
   * Uma consulta para todas, nunca uma por evento.
   */
  const idsCompeticao = [
    ...new Set(abertos.map((e) => e.competicaoId).filter(Boolean).map(String)),
  ];
  const competicoes = idsCompeticao.length
    ? await GameCompeticao.find({ _id: { $in: idsCompeticao } }).select("slug nome").lean()
    : [];
  const compPorId = new Map(competicoes.map((c) => [String(c._id), c]));

  const ids = abertos.map((e) => e._id);

  // O 1X2 de cada evento aberto, para o cartão do saguão mostrar preço sem
  // exigir um clique. Uma consulta agregada, nunca uma por evento.
  const principais = await GameMercadoAposta.find({
    eventoId: { $in: ids },
    chave: "1x2",
  })
    .select("eventoId selecoes")
    .lean();
  const porEvento = new Map(principais.map((m) => [String(m.eventoId), m]));

  return NextResponse.json(
    {
      eventos: abertos.map((e) => {
        const m = porEvento.get(String(e._id));
        return {
          slug: e.slug,
          comecaEm: e.comecaEm,
          equilibrio: e.equilibrio,
          compromisso: e.compromisso,
          totalApostado: e.totalApostado,
          totalCupons: e.totalCupons,
          competicao: e.competicaoId
            ? {
                slug: compPorId.get(String(e.competicaoId))?.slug ?? null,
                nome: compPorId.get(String(e.competicaoId))?.nome ?? null,
                rodada: e.rodada ?? null,
              }
            : null,
          mandante: resumoLado(e.mandante),
          visitante: resumoLado(e.visitante),
          principal: m
            ? {
                mercadoId: String(m._id),
                selecoes: m.selecoes.map((s) => ({
                  chave: s.chave,
                  rotulo: s.rotulo,
                  odd: s.odd,
                  probabilidade: s.probabilidade,
                })),
              }
            : null,
        };
      }),
      encerrados: encerrados.map((e) => ({
        slug: e.slug,
        mandante: e.mandante.nome,
        visitante: e.visitante.nome,
        placar: e.resultado ? `${e.resultado.golsMandante} × ${e.resultado.golsVisitante}` : null,
        liquidadoEm: e.liquidadoEm,
      })),
      /**
       * A tela precisa saber que a lista está FILTRADA, e por quem.
       *
       * Sem isto, uma lista vazia por filtro é indistinguível de um saguão sem
       * partida nenhuma — e o jogador concluiria que a casa está fechada,
       * quando o que aconteceu é que ele não foi escalado hoje.
       *
       * `abertosNoTotal` vem de uma contagem à parte de propósito: é o número
       * que permite à tela dizer "há 8 partidas abertas, nenhuma com você".
       */
      filtro: jogador
        ? {
            jogador,
            abertosNoTotal: await GameEvento.countDocuments({
              status: "aberto",
              comecaEm: { $gt: new Date() },
            }),
          }
        : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

function resumoLado(l: { nome: string; sigla?: string; cor?: string; nota: number; elenco?: unknown[] }) {
  return {
    nome: l.nome,
    sigla: l.sigla ?? null,
    cor: l.cor ?? null,
    nota: l.nota,
    elencoConhecido: (l.elenco ?? []).length,
  };
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });

  const teto = await cobrar(req, "aposta-escrita");
  if (!teto.ok) return teto.resposta!;

  let body: { selecoes?: Array<{ mercadoId: string; selecaoChave: string }>; valor?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!Array.isArray(body.selecoes) || typeof body.valor !== "number") {
    return NextResponse.json({ error: "informe as seleções e o valor" }, { status: 400 });
  }

  // Garante carteira (e o bônus) antes de tentar debitar: quem chega direto no
  // cupom, sem passar pela tela de saldo, tem de conseguir apostar do mesmo
  // jeito.
  await garantirCarteira(user.id);

  try {
    const r = await registrarAposta(user.id, {
      selecoes: body.selecoes,
      valor: body.valor,
    });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "não foi possível registrar a aposta";
    const status = e instanceof ErroCarteira ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
