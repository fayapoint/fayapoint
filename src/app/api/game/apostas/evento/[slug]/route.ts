import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { cobrar } from "@/lib/game/limite";
import GameEvento from "@/models/GameEvento";
import GameCompeticao from "@/models/GameCompeticao";
import GameMercadoAposta from "@/models/GameMercadoAposta";
import { derivarSemente } from "@/lib/game/apostas-servidor";

/**
 * GET /api/game/apostas/evento/[slug] — a ficha do evento: cardápio completo,
 * a prova de honestidade e, depois de liquidado, a súmula.
 *
 * ## O que NUNCA sai daqui antes da hora
 *
 * `sementeServidor` só aparece na resposta quando o evento está liquidado.
 * Enquanto há aposta aberta, o público vê apenas o `compromisso` (o hash).
 * Vazar a semente antes seria entregar o resultado — e é exatamente o tipo de
 * campo que sai por acidente num `.lean()` sem `select`. Por isso o `select`
 * abaixo é explícito e a semente entra por atribuição, num `if`.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const teto = await cobrar(req, "aposta-leitura", slug);
  if (!teto.ok) return teto.resposta!;

  await dbConnect();
  const evento = await GameEvento.findOne({ slug }).lean();
  if (!evento) return NextResponse.json({ error: "evento não encontrado" }, { status: 404 });

  /**
   * De que confronto de campeonato este evento é PRÉVIA, quando é.
   *
   * A tela precisa dizer isso em letra grande, e não como curiosidade: uma
   * prévia é a NOSSA simulação de um confronto real que ainda vai ser jogado
   * por pessoas. Sem o rótulo, ela é indistinguível de uma partida avulsa — e
   * alguém pode achar que apostou no jogo de verdade, que é exatamente o que
   * os Arts. 11 e 18 proíbem.
   */
  const competicao = evento.competicaoId
    ? await GameCompeticao.findById(evento.competicaoId).select("slug nome").lean()
    : null;

  const mercados = await GameMercadoAposta.find({ eventoId: evento._id })
    .sort({ ordem: 1 })
    .lean();

  const liquidado = evento.status === "liquidado";

  return NextResponse.json(
    {
      evento: {
        slug: evento.slug,
        status: evento.status,
        comecaEm: evento.comecaEm,
        equilibrio: evento.equilibrio,
        competicao: competicao
          ? { slug: competicao.slug, nome: competicao.nome, rodada: evento.rodada ?? null }
          : null,
        totalApostado: evento.totalApostado,
        totalCupons: evento.totalCupons,
        mandante: lado(evento.mandante),
        visitante: lado(evento.visitante),
        resultado: liquidado ? evento.resultado : null,
        liquidadoEm: evento.liquidadoEm ?? null,
      },
      // A prova, do jeito que dá para conferir de fora com `sha256sum`.
      honestidade: {
        compromisso: evento.compromisso,
        sementeServidor: liquidado ? evento.sementeServidor : null,
        salPublico: liquidado ? evento.salPublico : null,
        sementeFinal: liquidado ? evento.sementeFinal : null,
        conferencia: liquidado
          ? {
              formula: "semente = primeiros 8 hex de sha256(sementeServidor + '|' + salPublico)",
              // Recalculado na resposta, e não lido do banco: se algum dia o
              // gravado divergir da fórmula, a tela mostra os dois e a
              // divergência aparece em vez de ficar escondida.
              recalculada: derivarSemente(evento.sementeServidor, evento.salPublico ?? ""),
            }
          : {
              formula: "sha256(sementeServidor) já está publicado como 'compromisso'",
              recalculada: null,
            },
      },
      mercados: mercados.map((m) => ({
        id: String(m._id),
        chave: m.chave,
        tipo: m.tipo,
        familia: m.familia,
        titulo: m.titulo,
        margem: m.margem,
        status: m.status,
        selecoes: m.selecoes.map((s) => ({
          chave: s.chave,
          rotulo: s.rotulo,
          odd: s.odd,
          probabilidade: s.probabilidade,
          resultado: s.resultado ?? null,
        })),
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

function lado(l: {
  nome: string;
  sigla?: string;
  cor?: string;
  nota: number;
  eaClubId?: string;
  forca: { ataque: number; defesa: number };
  elenco: Array<{ gamertag: string; posicao: string; golsPorJogo?: number; userId?: unknown }>;
}) {
  return {
    nome: l.nome,
    sigla: l.sigla ?? null,
    cor: l.cor ?? null,
    nota: l.nota,
    eaClubId: l.eaClubId ?? null,
    // A força vai a público: quem quiser refazer a conta do preço precisa dela.
    forca: { ataque: Math.round(l.forca.ataque * 1000) / 1000, defesa: Math.round(l.forca.defesa * 1000) / 1000 },
    elenco: l.elenco.map((j) => ({
      gamertag: j.gamertag,
      posicao: j.posicao,
      golsPorJogo: j.golsPorJogo ? Math.round(j.golsPorJogo * 100) / 100 : null,
      // Só o SINAL de que a gamertag tem dono no site. O id do dono não é
      // assunto de quem está lendo a ficha de um jogo.
      temDono: Boolean(j.userId),
    })),
  };
}
