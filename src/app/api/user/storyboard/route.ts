import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Storyboard from "@/models/Storyboard";
import { getAuthUser } from "@/lib/auth";
import { generate } from "@/lib/ai/provider";
import { debitar, saldoParaGastar, custoDe } from "@/lib/creditos";
import type { PersonaProfunda } from "@/lib/persona";
import {
  FORMATOS,
  SISTEMA,
  montarPedido,
  montarPrompt,
  normalizar,
  type IdFormato,
  type Quadro,
} from "@/lib/storyboard/motor";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

/**
 * O Ateliê de Storyboard — a engenharia do WorldForge no conteúdo do usuário.
 *
 * `GET`    lista as peças da pessoa (ou uma, com `?id=`)
 * `POST`   gera uma peça nova a partir da persona + tema (cobra crédito)
 * `PATCH`  edita um quadro — e recompõe o prompt quando a ação ou a câmera mudam
 * `DELETE` apaga uma peça da pessoa
 *
 * ⚠️ O crédito é debitado **depois** da geração dar certo. A regra da casa é a
 * do Ateliê: a caixa registradora cobra o que foi entregue, não o que foi
 * pedido — se o modelo falhar, ninguém paga.
 */

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await dbConnect();
  const id = new URL(request.url).searchParams.get("id");

  if (id) {
    const peca = await Storyboard.findOne({ _id: id, userId: authUser.id }).lean();
    if (!peca) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json({ peca });
  }

  const pecas = await Storyboard.find({ userId: authUser.id })
    .select("formato tema titulo quadros.numero quadros.arte criadoEm")
    .sort({ criadoEm: -1 })
    .limit(50)
    .lean();

  // o rosto da pessoa, quando existe: é o que dá continuidade de personagem
  // entre um quadro e o outro (o caderno vem do Estúdio da Persona)
  const user = await User.findById(authUser.id).select("socialPersona");
  const persona = (user?.socialPersona || {}) as unknown as PersonaProfunda;
  const rosto = persona.caderno?.imagens?.[0] || persona.fotos?.[0]?.url || "";

  return NextResponse.json({
    pecas: pecas.map((p) => {
      const doc = p as unknown as { quadros?: Array<{ arte?: string }> };
      return {
        ...p,
        quadros: undefined,
        totalQuadros: doc.quadros?.length || 0,
        comArte: doc.quadros?.filter((q) => q.arte).length || 0,
      };
    }),
    custo: await custoDe("storyboard_gerar", 1),
    rosto,
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
    const formato = FORMATOS[corpo.formato as IdFormato];
    const tema = String(corpo.tema || "").trim();

    if (!formato) return NextResponse.json({ error: "Formato desconhecido" }, { status: 400 });
    if (tema.length < 3) return NextResponse.json({ error: "Diga sobre o que é a peça" }, { status: 400 });

    const quadros = Math.max(1, Math.min(10, Number(corpo.quadros) || formato.quadros));

    await dbConnect();
    const user = await User.findById(authUser.id).select("socialPersona name");
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    // portaria: confere o saldo antes de acionar o modelo
    const custo = await custoDe("storyboard_gerar", 1);
    const saldo = await saldoParaGastar(authUser.id);
    if (saldo.total < custo) {
      return NextResponse.json(
        { error: "Créditos insuficientes", faltam: custo - saldo.total, custo, saldo: saldo.total },
        { status: 402 },
      );
    }

    const persona = (user.socialPersona || {}) as unknown as PersonaProfunda;
    const comRosto = !!(persona.caderno?.imagens?.length || persona.fotos?.length);

    const mensagens = [
      { role: "system" as const, content: SISTEMA },
      {
        role: "user" as const,
        content: montarPedido({
          persona,
          nome: user.name,
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
     * saem do mesmo orçamento da resposta, e a chamada leva minutos. Medido
     * aqui em 20/08/2026: com 3.000 tokens ele gastou 2.999 pensando e devolveu
     * `content` vazio; com 8.000, respondeu — em **3 minutos**. Isso não cabe
     * numa tela que a pessoa está olhando, e muito menos no teto de tempo de
     * uma função serverless. Ver `reference_deepseek_v4_raciocinio`.
     *
     * O Gemini 3 Flash responde o mesmo JSON em segundos. Se falhar, a cadeia
     * de fallback do provedor cobre — mas o caminho normal é o rápido.
     *
     * A segunda tentativa existe porque temperatura não é zero: quando o JSON
     * sai quebrado, a amostra seguinte costuma sair inteira.
     */
    let pronto: ReturnType<typeof normalizar> | null = null;
    let resposta: Awaited<ReturnType<typeof generate>> | null = null;
    for (let tentativa = 0; tentativa < 2 && !pronto; tentativa++) {
      resposta = await generate({ messages: mensagens, tier: "free", json: true, maxTokens: 4000 });
      try {
        const saiu = normalizar(resposta.content, { formato, persona, nome: user.name, comRosto });
        if (saiu.quadros.length) pronto = saiu;
      } catch {
        /* tenta de novo — e se a segunda também falhar, cai no 502 abaixo */
      }
    }

    if (!pronto || !resposta) {
      return NextResponse.json(
        { error: "O modelo não devolveu um storyboard legível. Tente de novo." },
        { status: 502 },
      );
    }

    const peca = await Storyboard.create({
      userId: authUser.id,
      formato: formato.id,
      tema,
      observacao: corpo.observacao || "",
      titulo: pronto.titulo,
      legenda: pronto.legenda,
      hashtags: pronto.hashtags,
      quadros: pronto.quadros,
      creditos: custo,
      modelo: resposta.model || "",
    });

    // caixa: só agora, com a peça no banco
    const cobranca = await debitar(
      authUser.id,
      "storyboard_gerar",
      1,
      `Storyboard — ${formato.titulo}: ${tema.slice(0, 60)}`,
    );

    return NextResponse.json({ peca, creditos: { gasto: cobranca.gasto, restante: cobranca.restante } });
  } catch (erro) {
    console.error("[storyboard POST]", erro);
    return NextResponse.json({ error: "Falha ao montar o storyboard" }, { status: 500 });
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
    const peca = await Storyboard.findOne({ _id: corpo.id, userId: authUser.id });
    if (!peca) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    if (corpo.peca) {
      if (corpo.peca.titulo !== undefined) peca.titulo = String(corpo.peca.titulo);
      if (corpo.peca.legenda !== undefined) peca.legenda = String(corpo.peca.legenda);
      if (Array.isArray(corpo.peca.hashtags)) {
        peca.hashtags = corpo.peca.hashtags.map((h) => String(h).replace(/^#/, "")).slice(0, 8);
      }
    }

    if (corpo.numero && corpo.quadro) {
      const user = await User.findById(authUser.id).select("socialPersona name");
      const persona = (user?.socialPersona || {}) as unknown as PersonaProfunda;
      const formato = FORMATOS[peca.formato as IdFormato];
      const alvo = peca.quadros.find((q: Quadro) => q.numero === corpo.numero);
      if (!alvo) return NextResponse.json({ error: "Quadro não encontrado" }, { status: 404 });

      const q = corpo.quadro;
      if (q.titulo !== undefined) alvo.titulo = String(q.titulo);
      if (q.acao !== undefined) alvo.acao = String(q.acao);
      if (q.acaoEn !== undefined) alvo.acaoEn = String(q.acaoEn);
      if (q.textoNaTela !== undefined) alvo.textoNaTela = String(q.textoNaTela);
      if (q.fala !== undefined) alvo.fala = String(q.fala);
      if (q.duracao !== undefined) alvo.duracao = Math.max(1, Math.min(60, Number(q.duracao) || 1));
      if (q.ajustes !== undefined) alvo.ajustes = q.ajustes;
      if (q.negativo !== undefined) alvo.negativo = String(q.negativo);
      if (q.estado !== undefined) alvo.estado = q.estado;
      if (q.arte !== undefined) {
        const url = String(q.arte);
        if (url && !/^https:\/\//.test(url)) {
          return NextResponse.json({ error: "A arte precisa ser uma URL https" }, { status: 400 });
        }
        alvo.arte = url;
        if (url && alvo.estado === "planejado") alvo.estado = "gerado";
      }

      // o prompt é derivado: se a ação ou a câmera mudaram, ele muda junto
      if (q.acao !== undefined || q.ajustes !== undefined) {
        const comRosto = !!(persona.caderno?.imagens?.length || persona.fotos?.length);
        alvo.prompt = montarPrompt(
          { acao: alvo.acao, acaoEn: alvo.acaoEn, ajustes: alvo.ajustes },
          { formato, persona, nome: user?.name, comRosto },
        );
      } else if (q.prompt !== undefined) {
        alvo.prompt = String(q.prompt);
      }

      peca.markModified("quadros");
    }

    await peca.save();
    return NextResponse.json({ peca });
  } catch (erro) {
    console.error("[storyboard PATCH]", erro);
    return NextResponse.json({ error: "Falha ao gravar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

  await dbConnect();
  const r = await Storyboard.deleteOne({ _id: id, userId: authUser.id });
  return NextResponse.json({ apagados: r.deletedCount });
}
