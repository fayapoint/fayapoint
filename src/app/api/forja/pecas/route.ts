import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ForjaPeca from "@/models/ForjaPeca";
import Storyboard from "@/models/Storyboard";
import { getAuthUser } from "@/lib/auth";
import { generate } from "@/lib/ai/provider";
import { debitar, saldoParaGastar, custoDe } from "@/lib/creditos";
import { contextoDoUsuario, garantirCriador } from "@/lib/forja/servidor";
import {
  SISTEMA_PECA,
  pedidoDePeca,
  normalizar,
  recomporQuadro,
  acharFormato,
  LISTA_DE_FORMATOS,
  resolverConflitos,
  type ContextoDaPeca,
  type Quadro,
} from "@/lib/forja/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

/**
 * AS PEÇAS DA FORJA — o plano de filmagem do conteúdo do usuário.
 *
 * `GET`    lista as peças (e migra as antigas do Ateliê, uma vez cada)
 * `POST`   monta uma peça nova a partir da persona + elenco + tema
 * `PATCH`  edita a peça ou um quadro — e recompõe o prompt quando é preciso
 * `DELETE` apaga
 *
 * ⚠️ O crédito do PLANO é debitado depois da geração dar certo. A regra da casa
 * é a do Ateliê: a caixa cobra o que foi entregue. Se o modelo falhar, ninguém
 * paga. A geração das ARTES é outra conta, e ela mora na fila.
 */

function contextoDaPeca(ctx: Awaited<ReturnType<typeof contextoDoUsuario>>, formatoId: string): ContextoDaPeca {
  return {
    formato: acharFormato(formatoId),
    elenco: ctx.elenco,
    coresDaMarca: ctx.coresDaMarca,
  };
}

/**
 * Traz uma peça do Ateliê antigo para a Forja.
 *
 * ## Por que migrar em vez de apagar
 *
 * O `Storyboard` guarda trabalho que a pessoa já fez, e às vezes já gerou arte.
 * Apagar a coleção para "limpar" seria tirar dela o que ela construiu. Então a
 * migração acontece na LEITURA, uma peça por vez, e é idempotente: `migradaDe`
 * guarda o id de origem e o índice esparso impede a segunda cópia.
 *
 * Os campos que a Forja tem a mais ficam vazios — e ficar vazio é honesto: a
 * peça antiga não sabia quem aparecia no quadro, e inventar um personagem para
 * ela produziria um rosto que nunca esteve lá.
 */
async function migrarAntigas(userId: string): Promise<number> {
  const antigas = (await Storyboard.find({ userId }).lean()) as unknown as Array<Record<string, unknown>>;
  if (!antigas.length) return 0;

  const jaMigradas = new Set(
    ((await ForjaPeca.find({ userId, migradaDe: { $ne: "" } }).select("migradaDe").lean()) as unknown as Array<{
      migradaDe: string;
    }>).map((p) => p.migradaDe),
  );

  const novas = antigas
    .filter((a) => !jaMigradas.has(String(a._id)))
    .map((a) => ({
      userId,
      formato: a.formato,
      tema: a.tema,
      observacao: a.observacao || "",
      titulo: a.titulo || "",
      legenda: a.legenda || "",
      hashtags: a.hashtags || [],
      quadros: ((a.quadros || []) as Array<Record<string, unknown>>).map((q) => ({
        ...q,
        quemAparece: [],
        correcoes: [],
      })),
      personagens: [],
      creditos: a.creditos || 0,
      modelo: a.modelo || "",
      migradaDe: String(a._id),
      criadoEm: a.criadoEm,
    }));

  if (!novas.length) return 0;
  await ForjaPeca.insertMany(novas, { ordered: false }).catch(() => {});
  return novas.length;
}

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await dbConnect();
  const id = new URL(request.url).searchParams.get("id");

  if (id) {
    const peca = await ForjaPeca.findOne({ _id: id, userId: authUser.id }).lean();
    if (!peca) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json({ peca });
  }

  const migradas = await migrarAntigas(authUser.id);

  const pecas = (await ForjaPeca.find({ userId: authUser.id })
    .select("formato tema titulo quadros.numero quadros.arte quadros.video quadros.estado personagens criadoEm")
    .sort({ criadoEm: -1 })
    .limit(60)
    .lean()) as unknown as Array<Record<string, unknown>>;

  return NextResponse.json({
    pecas: pecas.map((p) => {
      const q = (p.quadros || []) as Array<{ arte?: string; video?: string }>;
      return {
        ...p,
        quadros: undefined,
        totalQuadros: q.length,
        comArte: q.filter((x) => x.arte).length,
        comVideo: q.filter((x) => x.video).length,
      };
    }),
    formatos: LISTA_DE_FORMATOS,
    custoDoPlano: await custoDe("storyboard_gerar", 1),
    migradas,
  });
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const corpo = (await request.json()) as {
      formato?: string;
      tema?: string;
      observacao?: string;
      quadros?: number;
    };
    const formato = acharFormato(corpo.formato);
    const tema = String(corpo.tema || "").trim();
    if (!corpo.formato || !LISTA_DE_FORMATOS.some((f) => f.id === corpo.formato)) {
      return NextResponse.json({ error: "Formato desconhecido" }, { status: 400 });
    }
    if (tema.length < 3) return NextResponse.json({ error: "Diga sobre o que é a peça" }, { status: 400 });

    const quadros = Math.max(1, Math.min(10, Number(corpo.quadros) || formato.quadros));

    await dbConnect();
    const ctx = await contextoDoUsuario(authUser.id);
    await garantirCriador(authUser.id, ctx);

    // portaria: confere o saldo antes de acionar o modelo
    const custo = await custoDe("storyboard_gerar", 1);
    const saldo = await saldoParaGastar(authUser.id);
    if (saldo.total < custo) {
      return NextResponse.json(
        { error: "Créditos insuficientes", faltam: custo - saldo.total, custo, saldo: saldo.total },
        { status: 402 },
      );
    }

    /**
     * O elenco que entra no pedido depende do PROTAGONISTA do formato.
     *
     * Mandar o elenco inteiro em toda peça faria o modelo espalhar personagens
     * por quadros que não pedem gente — e cada personagem a mais num quadro é
     * uma trava de identidade a mais no prompt, o que empurra a ação para o fim
     * e é justamente o que o gerador trunca.
     */
    const elencoDoPedido = [...ctx.elenco.values()].filter((p) => {
      if (formato.protagonista === "nenhum") return false;
      if (formato.protagonista === "publico") return p.origem !== "criador";
      return p.origem !== "publico";
    });

    const mensagens = [
      { role: "system" as const, content: SISTEMA_PECA },
      {
        role: "user" as const,
        content: pedidoDePeca({
          persona: ctx.persona,
          nome: ctx.nome,
          elenco: elencoDoPedido,
          formato,
          tema,
          observacao: corpo.observacao,
          quadros,
        }),
      },
    ];

    /**
     * ⚠️ Tier `free` (Gemini 3 Flash) de propósito, e não o `budget`.
     *
     * O `budget` é o DeepSeek V4, modelo de RACIOCÍNIO: os tokens de pensamento
     * saem do mesmo orçamento da resposta. Medido em 20/08/2026: com 3.000
     * tokens ele gastou 2.999 pensando e devolveu `content` vazio; com 8.000,
     * respondeu em três minutos. Isso não cabe numa tela que a pessoa está
     * olhando, nem no teto de tempo de uma função serverless.
     *
     * A segunda tentativa existe porque temperatura não é zero: quando o JSON
     * sai quebrado, a amostra seguinte costuma sair inteira.
     */
    const cp = contextoDaPeca(ctx, formato.id);
    let pronto: ReturnType<typeof normalizar> | null = null;
    let resposta: Awaited<ReturnType<typeof generate>> | null = null;

    for (let tentativa = 0; tentativa < 2 && !pronto; tentativa++) {
      resposta = await generate({ messages: mensagens, tier: "free", json: true, maxTokens: 5000 });
      try {
        const saiu = normalizar(resposta.content, cp);
        if (saiu.quadros.length) pronto = saiu;
      } catch {
        /* tenta de novo — e se a segunda também falhar, cai no 502 abaixo */
      }
    }

    if (!pronto || !resposta) {
      return NextResponse.json(
        { error: "O modelo não devolveu um plano legível. Tente de novo — costuma sair na segunda." },
        { status: 502 },
      );
    }

    const peca = await ForjaPeca.create({
      userId: authUser.id,
      formato: formato.id,
      tema,
      observacao: corpo.observacao || "",
      titulo: pronto.titulo,
      legenda: pronto.legenda,
      hashtags: pronto.hashtags,
      quadros: pronto.quadros,
      personagens: pronto.personagens,
      creditos: custo,
      modelo: resposta.model || "",
    });

    const cobranca = await debitar(
      authUser.id,
      "storyboard_gerar",
      1,
      `Forja — ${formato.titulo}: ${tema.slice(0, 60)}`,
    );

    return NextResponse.json({ peca, creditos: { gasto: cobranca.gasto, restante: cobranca.restante } });
  } catch (erro) {
    console.error("[forja pecas POST]", erro);
    return NextResponse.json({ error: "Falha ao montar a peça" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const corpo = (await request.json()) as {
      id?: string;
      numero?: number;
      quadro?: Partial<Quadro>;
      peca?: { titulo?: string; legenda?: string; hashtags?: string[] };
    };
    if (!corpo.id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

    await dbConnect();
    const peca = await ForjaPeca.findOne({ _id: corpo.id, userId: authUser.id });
    if (!peca) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    if (corpo.peca) {
      if (corpo.peca.titulo !== undefined) peca.titulo = String(corpo.peca.titulo).slice(0, 200);
      if (corpo.peca.legenda !== undefined) peca.legenda = String(corpo.peca.legenda).slice(0, 4000);
      if (Array.isArray(corpo.peca.hashtags)) {
        peca.hashtags = corpo.peca.hashtags.map((h) => String(h).replace(/^#/, "")).slice(0, 8);
      }
    }

    if (corpo.numero && corpo.quadro) {
      const ctx = await contextoDoUsuario(authUser.id);
      const alvo = peca.quadros.find((q: Quadro) => q.numero === corpo.numero);
      if (!alvo) return NextResponse.json({ error: "Quadro não encontrado" }, { status: 404 });

      const q = corpo.quadro;
      if (q.titulo !== undefined) alvo.titulo = String(q.titulo).slice(0, 120);
      if (q.acao !== undefined) alvo.acao = String(q.acao).slice(0, 600);
      if (q.acaoEn !== undefined) alvo.acaoEn = String(q.acaoEn).slice(0, 600);
      if (q.cenarioEn !== undefined) alvo.cenarioEn = String(q.cenarioEn).slice(0, 400);
      if (q.textoNaTela !== undefined) alvo.textoNaTela = String(q.textoNaTela).split(/\s+/).slice(0, 7).join(" ");
      if (q.fala !== undefined) alvo.fala = String(q.fala).slice(0, 500);
      if (q.duracao !== undefined) alvo.duracao = Math.max(1, Math.min(15, Number(q.duracao) || 1));
      if (q.estado !== undefined) alvo.estado = q.estado;

      if (q.quemAparece !== undefined) {
        alvo.quemAparece = (q.quemAparece || []).map(String).filter((id) => ctx.elenco.has(id)).slice(0, 3);
      }

      if (q.ajustes !== undefined) {
        // passa pelo mesmo portão que a geração: opção inválida sai, câmera
        // impossível é consertada, e a correção volta para a tela
        const { ajustes, correcoes } = resolverConflitos(q.ajustes);
        alvo.ajustes = ajustes;
        alvo.correcoes = correcoes;
      }

      /**
       * ⚠️ `arte` e `video` NÃO são graváveis por aqui.
       *
       * Quem escreve o resultado é a fila, na conclusão do trabalho. Deixar o
       * navegador gravar uma URL de mídia seria deixar qualquer usuário apontar
       * o quadro dele para qualquer endereço da internet — e essa URL depois
       * aparece na tela de outras pessoas quando a peça é compartilhada.
       */

      // o prompt é derivado: mudou a ação, a câmera ou quem aparece, ele muda junto
      if (q.acao !== undefined || q.acaoEn !== undefined || q.ajustes !== undefined || q.quemAparece !== undefined) {
        const recomposto = recomporQuadro(alvo.toObject ? alvo.toObject() : alvo, contextoDaPeca(ctx, peca.formato));
        alvo.prompt = recomposto.prompt;
        alvo.negativo = recomposto.negativo;
        alvo.leitura = recomposto.leitura;
      }

      peca.markModified("quadros");
    }

    await peca.save();
    return NextResponse.json({ peca });
  } catch (erro) {
    console.error("[forja pecas PATCH]", erro);
    return NextResponse.json({ error: "Falha ao gravar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

  await dbConnect();
  const r = await ForjaPeca.deleteOne({ _id: id, userId: authUser.id });
  return NextResponse.json({ apagados: r.deletedCount });
}
