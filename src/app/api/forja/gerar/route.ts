import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ForjaPeca from "@/models/ForjaPeca";
import ForjaPersonagem from "@/models/ForjaPersonagem";
import { getAuthUser } from "@/lib/auth";
import { generate } from "@/lib/ai/provider";
import { contextoDoUsuario, enfileirar, usoDoDia } from "@/lib/forja/servidor";
import {
  acharFormato,
  acharModelo,
  padraoDe,
  montarPromptDeImagem,
  montarPromptDeVideo,
  planoDeVideo,
  quadrosParaCortar,
  resolverConflitos,
  grafoZImage,
  grafoQwen2512,
  grafoErnie,
  grafoQwenEdit,
  grafoLTX25,
  ANGULOS_DO_CADERNO,
  SISTEMA_IMAGEM_AVULSA,
  pedidoDeImagemAvulsa,
  TAMANHOS,
  descreverPersonagem,
  type ContextoDaPeca,
  type Onde,
  type PedidoDeTrabalho,
  type Personagem,
  type Quadro,
} from "@/lib/forja/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GERAR — o botão que enche a fila.
 *
 * ## O que esta rota faz e o que ela deliberadamente NÃO faz
 *
 * Ela COMPÕE (prompt final, grafo, parâmetros, referências) e ENFILEIRA. Ela
 * não fala com o ComfyUI, e não pode: o site roda na Netlify e a GPU está atrás
 * do roteador do Ricardo. Quem executa é o trabalhador local, que puxa daqui.
 *
 * Compor no site e não no trabalhador é a decisão que sustenta o resto: o
 * trabalhador vira um executor burro que não precisa saber o que é persona,
 * personagem ou crédito — e por isso pode ser reiniciado, movido de máquina ou
 * duplicado sem que nada do produto mude.
 *
 * ## Os quatro alvos
 *
 * - `quadro`  — a arte (ou o clipe) de um quadro de uma peça
 * - `peca`    — todos os quadros de uma vez
 * - `caderno` — os quatro ângulos de um personagem
 * - `avulso`  — "cria uma imagem de X", em texto livre
 */

type Alvo = "quadro" | "peca" | "caderno" | "avulso";

interface Corpo {
  alvo?: Alvo;
  pecaId?: string;
  numero?: number;
  personagemId?: string;
  midia?: "imagem" | "video";
  onde?: Onde;
  furarFila?: boolean;
  modelo?: string;
  /** para `avulso` */
  pedido?: string;
  aspecto?: string;
  /** manda a letra para DENTRO da arte (usa o modelo tipográfico) */
  textoNaArte?: boolean;
}

function limparJson(s: string): string {
  return s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
}

/**
 * As referências de rosto de um personagem, em ordem de utilidade.
 *
 * O caderno vem antes da foto crua: ele já é o rosto normalizado em luz e
 * enquadramento, e é por isso que ele existe. A foto crua é o fallback de quem
 * ainda não gerou o caderno.
 */
function referenciasDe(p?: Personagem): string[] {
  if (!p) return [];
  return [...(p.caderno?.imagens || []), ...(p.referencias || [])].filter((u) => /^https:\/\//.test(u)).slice(0, 2);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const corpo = (await request.json()) as Corpo;
    const alvo: Alvo = corpo.alvo || "quadro";
    const onde: Onde = corpo.onde === "nuvem" ? "nuvem" : "local";

    await dbConnect();
    const ctx = await contextoDoUsuario(authUser.id);
    const uso = await usoDoDia(authUser.id, ctx.plano);

    // ─────────────────────────────────────────────────────────────
    // AVULSO — "cria uma imagem de X"
    // ─────────────────────────────────────────────────────────────
    if (alvo === "avulso") {
      const pedido = String(corpo.pedido || "").trim();
      if (pedido.length < 4) return NextResponse.json({ error: "Diga o que você quer ver" }, { status: 400 });

      const aspecto = (["9:16", "4:5", "1:1", "16:9"].includes(String(corpo.aspecto)) ? corpo.aspecto : "4:5") as
        | "9:16"
        | "4:5"
        | "1:1"
        | "16:9";

      /**
       * O caminho ingênuo mandaria o texto do usuário direto para o gerador.
       * Funciona mal por três motivos: ele escreve em português (o gerador
       * entende pior), escreve o QUE quer e não o que se VÊ, e não diz nada de
       * câmera. Este passo faz a tradução — e devolve os ajustes em chave
       * fechada, para a composição continuar sendo de código.
       */
      let plano: Record<string, unknown> = {};
      try {
        const r = await generate({
          messages: [
            { role: "system", content: SISTEMA_IMAGEM_AVULSA },
            { role: "user", content: pedidoDeImagemAvulsa({ pedido, persona: ctx.persona, nome: ctx.nome, aspecto }) },
          ],
          tier: "free",
          json: true,
          maxTokens: 900,
        });
        plano = JSON.parse(limparJson(r.content)) as Record<string, unknown>;
      } catch {
        /**
         * Sem o plano, ainda dá para gerar: usa o pedido cru como ação e um
         * ajuste neutro. Recusar aqui faria a pessoa perder o pedido inteiro
         * por causa de uma chamada de modelo que às vezes tropeça.
         */
        plano = { acao: pedido, acaoEn: pedido, ajustes: { enquadramento: "medium", luz: "natural", estilo: "editorial" } };
      }

      const { ajustes } = resolverConflitos(plano.ajustes);
      const comPessoa = plano.temPessoa === true;
      const personagem = comPessoa ? ctx.criador : undefined;
      const refs = referenciasDe(personagem);
      const comTexto = plano.temTexto === true && !!corpo.textoNaArte;

      const modelo = corpo.modelo
        ? acharModelo(corpo.modelo)
        : padraoDe({ comPessoa, comReferencia: refs.length > 0, comTexto });

      const p = montarPromptDeImagem(
        {
          acao: String(plano.acao || pedido),
          acaoEn: plano.acaoEn ? String(plano.acaoEn) : undefined,
          cenarioEn: plano.cenarioEn ? String(plano.cenarioEn) : undefined,
          ajustes,
          textoNaTela: plano.textoNaTela ? String(plano.textoNaTela) : undefined,
        },
        {
          aspecto,
          personagens: personagem ? [{ personagem }] : undefined,
          coresDaMarca: ctx.coresDaMarca,
          textoNaArte: comTexto,
          modelo,
        },
      );

      const tam = TAMANHOS[aspecto];
      const usaEdit = p.modelo.id === "qwen-edit" && refs.length > 0;
      const montado = usaEdit
        ? grafoQwenEdit({ positivo: p.positivo, negativo: p.negativo, ...tam, prefixo: "forja/avulso", imagem: "ref0.png", rapido: true })
        : p.modelo.id === "ernie"
          ? grafoErnie({ positivo: p.positivo, negativo: p.negativo, ...tam, prefixo: "forja/avulso" })
          : p.modelo.id === "qwen-2512"
            ? grafoQwen2512({ positivo: p.positivo, negativo: p.negativo, ...tam, prefixo: "forja/avulso" })
            : grafoZImage({ positivo: p.positivo, negativo: p.negativo, ...tam, prefixo: "forja/avulso" });

      const pedidoDeTrabalho: PedidoDeTrabalho = {
        tipo: "imagem",
        onde,
        grafo: usaEdit ? "qwen-edit" : p.modelo.id,
        params: {
          positivo: p.positivo,
          negativo: p.negativo,
          ...tam,
          prefixo: "forja/avulso",
          ...(usaEdit ? { imagem: "ref0.png", rapido: true } : {}),
        },
        referencias: usaEdit ? [{ url: refs[0], comoNome: "ref0.png" }] : [],
        destino: { avulso: true },
        rotulo: String(plano.titulo || pedido).slice(0, 80),
      };

      const r = await enfileirar(authUser.id, pedidoDeTrabalho, {
        furarFila: corpo.furarFila,
        segundosEstimados: montado.segundosEstimados,
        plano: ctx.plano,
      });

      return NextResponse.json({ ...r, prompt: p.positivo, leitura: p.leitura, uso: { gasto: uso.gasto, teto: uso.teto } }, { status: r.ok ? 200 : 402 });
    }

    // ─────────────────────────────────────────────────────────────
    // CADERNO — os quatro ângulos de um personagem
    // ─────────────────────────────────────────────────────────────
    if (alvo === "caderno") {
      const personagem = ctx.elenco.get(String(corpo.personagemId));
      if (!personagem) return NextResponse.json({ error: "Personagem não encontrado" }, { status: 404 });

      const foto = (personagem.referencias || []).find((u) => /^https:\/\//.test(u));
      if (!foto) {
        /**
         * ⚠️ Sem foto real, o caderno não é caderno: é quatro retratos de uma
         * pessoa inventada. Recusar aqui é muito mais barato — e muito menos
         * frustrante — do que ocupar a GPU por dois minutos e entregar um rosto
         * que não é o dela.
         */
        return NextResponse.json(
          {
            error: "Para montar o caderno preciso de uma foto sua. Envie uma na ficha do personagem.",
            precisaFoto: true,
          },
          { status: 422 },
        );
      }

      const tam = TAMANHOS["4:5"];
      const enfileirados: string[] = [];
      let total = 0;
      const contas: unknown[] = [];

      for (const angulo of ANGULOS_DO_CADERNO) {
        const positivo = [
          "Keep the person's face, hair and body exactly as in the reference photo — same identity, same features.",
          `Render them as a ${angulo.en}.`,
          descreverPersonagem(personagem, { alvo: "imagem" }),
        ].join(" ");

        const montado = grafoQwenEdit({
          positivo,
          negativo: "",
          ...tam,
          prefixo: `forja/caderno_${angulo.id}`,
          imagem: "rosto.png",
          rapido: true,
          // a MESMA semente nos quatro ângulos: é o truque mais barato de
          // consistência que existe, e o que o WorldForge não tinha
          seed: personagem.semente,
        });

        const r = await enfileirar(
          authUser.id,
          {
            tipo: "caderno",
            onde,
            grafo: "qwen-edit",
            params: { positivo, negativo: "", ...tam, prefixo: `forja/caderno_${angulo.id}`, imagem: "rosto.png", rapido: true, seed: personagem.semente },
            referencias: [{ url: foto, comoNome: "rosto.png" }],
            destino: { personagemId: personagem._id, angulo: angulo.id },
            rotulo: `Caderno de ${personagem.nome} — ${angulo.rotulo}`,
          },
          { furarFila: corpo.furarFila, segundosEstimados: montado.segundosEstimados, plano: ctx.plano },
        );

        if (!r.ok) {
          return NextResponse.json({ ...r, enfileirados }, { status: 402 });
        }
        enfileirados.push(r.trabalhoId as string);
        total += r.total;
        contas.push(...r.conta);
      }

      await ForjaPersonagem.updateOne({ _id: personagem._id }, { $set: { "caderno.status": "pendente" } });

      return NextResponse.json({ ok: true, enfileirados, total, conta: contas });
    }

    // ─────────────────────────────────────────────────────────────
    // QUADRO e PEÇA
    // ─────────────────────────────────────────────────────────────
    const peca = await ForjaPeca.findOne({ _id: String(corpo.pecaId), userId: authUser.id });
    if (!peca) return NextResponse.json({ error: "Peça não encontrada" }, { status: 404 });

    const formato = acharFormato(peca.formato);
    const cp: ContextoDaPeca = { formato, elenco: ctx.elenco, coresDaMarca: ctx.coresDaMarca };
    const midia = corpo.midia === "video" ? "video" : "imagem";

    const alvos: Quadro[] =
      alvo === "peca"
        ? (peca.quadros as Quadro[]).filter((q) => (midia === "video" ? !!q.arte : true))
        : (peca.quadros as Quadro[]).filter((q) => q.numero === Number(corpo.numero));

    if (!alvos.length) {
      return NextResponse.json(
        {
          error:
            midia === "video"
              ? "Nenhum quadro tem arte ainda. Gere as imagens primeiro — o clipe parte delas."
              : "Quadro não encontrado",
        },
        { status: 400 },
      );
    }

    const enfileirados: string[] = [];
    const contas: unknown[] = [];
    let total = 0;

    for (const q of alvos) {
      const quadro = q as Quadro;
      const personagens = (quadro.quemAparece || [])
        .map((id) => ctx.elenco.get(id))
        .filter((p): p is Personagem => !!p);
      const refs = personagens.flatMap((p) => referenciasDe(p)).slice(0, 2);

      if (midia === "video") {
        if (!quadro.arte) continue;
        const v = planoDeVideo(quadro, cp, "partida.png");
        const cortar = quadrosParaCortar(v.forca, v.fps);
        const params = {
          positivo: v.positivo,
          negativo: v.negativo,
          largura: v.largura,
          altura: v.altura,
          fps: v.fps,
          comprimento: v.comprimento,
          prefixo: `forja/${peca._id}_q${quadro.numero}`,
          imagem: "partida.png",
          forca: v.forca,
          cortarInicio: cortar,
          seed: quadro.semente,
        };
        const montado = grafoLTX25(params);

        const r = await enfileirar(
          authUser.id,
          {
            tipo: "video",
            onde,
            grafo: "ltx25",
            params,
            referencias: [{ url: quadro.arte, comoNome: "partida.png" }],
            destino: { pecaId: String(peca._id), quadroNumero: quadro.numero },
            rotulo: `${peca.titulo || "Peça"} — clipe do quadro ${quadro.numero}`,
          },
          { furarFila: corpo.furarFila, segundosEstimados: montado.segundosEstimados, plano: ctx.plano },
        );
        if (!r.ok) return NextResponse.json({ ...r, enfileirados }, { status: 402 });
        enfileirados.push(r.trabalhoId as string);
        contas.push(...r.conta);
        total += r.total;
      } else {
        const modelo = corpo.modelo
          ? acharModelo(corpo.modelo)
          : padraoDe({
              comPessoa: personagens.length > 0,
              comReferencia: refs.length > 0,
              comTexto: !!(corpo.textoNaArte && quadro.textoNaTela),
            });

        const p = montarPromptDeImagem(
          {
            acao: quadro.acao,
            acaoEn: quadro.acaoEn,
            cenarioEn: quadro.cenarioEn,
            ajustes: quadro.ajustes,
            textoNaTela: quadro.textoNaTela,
          },
          {
            aspecto: formato.aspecto,
            personagens: personagens.map((personagem) => ({ personagem })),
            coresDaMarca: ctx.coresDaMarca,
            textoNaArte: corpo.textoNaArte,
            modelo,
          },
        );

        const tam = TAMANHOS[formato.aspecto];
        const usaEdit = p.modelo.id === "qwen-edit" && refs.length > 0;
        const prefixo = `forja/${peca._id}_q${quadro.numero}`;
        const params = {
          positivo: p.positivo,
          negativo: p.negativo,
          ...tam,
          prefixo,
          // a semente do PERSONAGEM, não do quadro: é ela que faz o rosto ser o
          // mesmo entre um quadro e o outro
          seed: personagens[0]?.semente,
          ...(usaEdit ? { imagem: "ref0.png", rapido: true } : {}),
        };

        const montado = usaEdit
          ? grafoQwenEdit(params as never)
          : p.modelo.id === "ernie"
            ? grafoErnie(params)
            : p.modelo.id === "qwen-2512"
              ? grafoQwen2512(params)
              : grafoZImage(params);

        const r = await enfileirar(
          authUser.id,
          {
            tipo: alvo === "peca" ? "peca" : "imagem",
            onde,
            grafo: usaEdit ? "qwen-edit" : p.modelo.id,
            params,
            referencias: usaEdit ? [{ url: refs[0], comoNome: "ref0.png" }] : [],
            destino: { pecaId: String(peca._id), quadroNumero: quadro.numero },
            rotulo: `${peca.titulo || "Peça"} — quadro ${quadro.numero}`,
          },
          { furarFila: corpo.furarFila, segundosEstimados: montado.segundosEstimados, plano: ctx.plano },
        );
        if (!r.ok) return NextResponse.json({ ...r, enfileirados }, { status: 402 });
        enfileirados.push(r.trabalhoId as string);
        contas.push(...r.conta);
        total += r.total;
      }

      quadro.estado = "na-fila";
      quadro.trabalhoId = enfileirados[enfileirados.length - 1];
    }

    peca.markModified("quadros");
    await peca.save();

    return NextResponse.json({ ok: true, enfileirados, total, conta: contas, uso: { gasto: uso.gasto, teto: uso.teto } });
  } catch (erro) {
    console.error("[forja gerar]", erro);
    return NextResponse.json({ error: "Falha ao enfileirar" }, { status: 500 });
  }
}
