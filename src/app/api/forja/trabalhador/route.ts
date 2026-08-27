import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  reservar,
  marcarRodando,
  renovarAluguel,
  concluir,
  resgatarVencidos,
} from "@/lib/forja/servidor";
import type { PedidoDeReserva } from "@/lib/forja/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * A PORTA DO TRABALHADOR — por onde a GPU de casa puxa serviço.
 *
 * ## Por que uma rota e não um webhook
 *
 * O site roda na Netlify e a GPU está atrás do roteador do Ricardo. Não há rota
 * de entrada para a máquina dele, e abrir uma seria expor um PC doméstico à
 * internet por causa de um botão de gerar imagem. Então a seta é invertida: o
 * site publica pedidos, o trabalhador bate aqui e leva.
 *
 * ## A autenticação, e por que não é o login normal
 *
 * O trabalhador não é uma pessoa. Ele carrega um segredo (`FORJA_WORKER_SECRET`)
 * e nada mais — sem cookie, sem sessão, sem usuário. A comparação é
 * `timingSafeEqual` porque `===` em segredo vaza o comprimento do prefixo certo
 * na diferença de tempo, e esta rota aceita requisição de qualquer lugar da
 * internet: é exatamente o alvo em que um ataque de tempo compensa.
 *
 * ⚠️ **Sem o segredo no ambiente, a rota devolve 503 e não 401.** Um 401 diria
 * "seu segredo está errado" para um deploy onde o segredo simplesmente não foi
 * configurado, e o Ricardo procuraria no lugar errado por uma hora.
 */

function autorizado(req: NextRequest): { ok: boolean; resposta?: NextResponse } {
  const esperado = process.env.FORJA_WORKER_SECRET;
  if (!esperado || esperado.length < 16) {
    return {
      ok: false,
      resposta: NextResponse.json(
        { error: "A Forja não tem trabalhador configurado neste ambiente (FORJA_WORKER_SECRET ausente ou curto demais)." },
        { status: 503 },
      ),
    };
  }

  const veio = req.headers.get("x-forja-segredo") || "";
  const a = Buffer.from(veio);
  const b = Buffer.from(esperado);
  // `timingSafeEqual` estoura se os comprimentos diferirem — conferir antes é
  // obrigatório, e o comprimento por si só não é segredo útil.
  const igual = a.length === b.length && timingSafeEqual(a, b);
  if (!igual) return { ok: false, resposta: NextResponse.json({ error: "não autorizado" }, { status: 401 }) };

  return { ok: true };
}

export async function POST(request: NextRequest) {
  const guarda = autorizado(request);
  if (!guarda.ok) return guarda.resposta as NextResponse;

  let corpo: Record<string, unknown>;
  try {
    corpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "corpo inválido" }, { status: 400 });
  }

  const acao = String(corpo.acao || "");
  const trabalhador = String(corpo.trabalhador || "").slice(0, 80);
  if (!trabalhador) return NextResponse.json({ error: "diga quem é o trabalhador" }, { status: 400 });

  try {
    switch (acao) {
      /**
       * Pede serviço. Devolve os trabalhos já reservados em nome deste
       * trabalhador, com um prazo curto — o prazo real só começa a valer quando
       * ele confirma que COMEÇOU (`comecei`). Assim, um trabalhador que morre
       * entre pegar e começar devolve o trabalho em um minuto, e não em vinte.
       */
      case "reservar": {
        const p: PedidoDeReserva = {
          trabalhador,
          quantos: Number(corpo.quantos) || 1,
          tipos: Array.isArray(corpo.tipos) ? (corpo.tipos as PedidoDeReserva["tipos"]) : undefined,
          vramLivre: typeof corpo.vramLivre === "number" ? corpo.vramLivre : undefined,
        };
        const r = await reservar(p);
        return NextResponse.json(r);
      }

      case "comecei": {
        const ok = await marcarRodando(String(corpo.trabalhoId), trabalhador);
        return NextResponse.json({ ok });
      }

      /** O batimento. Enquanto ele chega, o aluguel não vence. */
      case "vivo": {
        const ok = await renovarAluguel(String(corpo.trabalhoId), trabalhador);
        return NextResponse.json({ ok });
      }

      case "concluir": {
        const r = await concluir({
          trabalhoId: String(corpo.trabalhoId),
          trabalhador,
          ok: corpo.ok === true,
          resultado: corpo.resultado as never,
          erro: corpo.erro ? String(corpo.erro) : undefined,
          segundosReais: typeof corpo.segundosReais === "number" ? corpo.segundosReais : undefined,
        });
        return NextResponse.json(r);
      }

      /**
       * O trabalhador diz que está vivo e sem nada para fazer.
       *
       * Aproveita para resgatar aluguel vencido: é o momento mais barato de
       * fazer isso, porque a GPU está parada de qualquer jeito.
       */
      case "ocioso": {
        const devolvidos = await resgatarVencidos();
        return NextResponse.json({ ok: true, devolvidos });
      }

      default:
        return NextResponse.json({ error: `ação desconhecida: ${acao}` }, { status: 400 });
    }
  } catch (erro) {
    console.error("[forja trabalhador]", acao, erro);
    return NextResponse.json({ error: "falha no servidor" }, { status: 500 });
  }
}
