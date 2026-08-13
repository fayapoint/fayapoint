import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserCourseLayer from "@/models/UserCourseLayer";
import LivroCompartilhado from "@/models/LivroCompartilhado";
import { getAuthUser } from "@/lib/auth";
import { getMongoClient } from "@/lib/products";
import { dividirCapitulos } from "@/lib/curso-personalizado";
import { getOrSet, CACHE_TTL } from "@/lib/redis";
import AtelieConfig from "@/models/AtelieConfig";
import {
  AJUSTES_PADRAO,
  EXTENSOES,
  FOCOS,
  PROFUNDIDADES,
  TONS_AJUSTE,
  acharOpcao,
  normalizarAjustes,
  type Ajustes,
} from "@/lib/atelie";
import { contarPorModelo } from "@/lib/modelos-do-atelie";
import { NARRADORES } from "@/data/narradores";

export const dynamic = "force-dynamic";

/**
 * O LIVRO DO ALUNO — `/api/user/livro` (12/08/2026).
 *
 * ## O buraco que ela fecha
 *
 * O Ateliê escrevia os capítulos e devolvia um `toast`. Não havia página, nem
 * link, nem sumário: o que a pessoa comprou não existia em lugar nenhum.
 *
 * - `GET  ?curso=slug` — o livro montado: capa, autor, sumário com o que já foi
 *   escrito e o que falta, e o estado do compartilhamento.
 * - `POST { curso, acao: "compartilhar" | "parar" }` — liga e desliga o
 *   endereço público.
 *
 * ⚠️ O endereço público carrega **token aleatório**, nunca id de usuário nem
 * slug: link montável à mão é convite a ler o livro do vizinho trocando um
 * número. Desligar revoga o acesso sem apagar nada — religar devolve o MESMO
 * link, senão quem já tinha recebido ficaria com um endereço morto.
 */

/**
 * A parte do livro que é IGUAL PARA TODO MUNDO, em cache.
 *
 * ⚠️ Esta rota é chamada A CADA 4 SEGUNDOS pelo estúdio de escrita, enquanto o
 * laço de geração roda (ver `meu/escrevendo/page.tsx`). Sem cache, cada uma
 * dessas batidas puxava do Mongo os **92 KB de `courseContent`** e picava o
 * markdown em capítulos de novo — para devolver exatamente o mesmo resultado,
 * quinze vezes por minuto, enquanto o usuário assiste.
 *
 * Medido em produção em 13/08/2026, antes: 12,6s na instância fria e **2,5s em
 * regime**. Era esse laço que enchia as conexões do Atlas que estouraram o
 * alerta de "nearing the connection limit" — e era ele que fazia o estúdio
 * mostrar "0 de 0", porque a tela desenhava antes de a resposta chegar.
 *
 * O conteúdo do curso muda quando alguém edita o curso, não a cada 4 segundos.
 * `COURSE_CONTENT` já existia com uma hora de validade e ninguém usava aqui.
 *
 * ⚠️ Só o que é do CURSO entra no cache. A camada do aluno (`UserCourseLayer`)
 * fica de fora de propósito: ela muda a cada capítulo escrito, e é justamente a
 * parte que o estúdio está esperando ver mudar.
 */
async function capitulosDoCurso(courseSlug: string) {
  return getOrSet(
    `livro:capitulos:${courseSlug}`,
    async () => {
      const client = await getMongoClient();
      const produto = await client
        .db("fayapointProdutos")
        .collection("products")
        .findOne(
          { slug: courseSlug },
          { projection: { courseContent: 1, name: 1, shortName: 1, thumbnail: 1, level: 1 } }
        );
      if (!produto?.courseContent) return null;

      return {
        capitulos: dividirCapitulos(produto.courseContent as string),
        produto: {
          name: produto.name as string | undefined,
          shortName: produto.shortName as string | undefined,
          thumbnail: produto.thumbnail as string | undefined,
          level: produto.level as string | undefined,
        },
      };
    },
    CACHE_TTL.COURSE_CONTENT,
  );
}

async function montar(userId: string, courseSlug: string) {
  const doCurso = await capitulosDoCurso(courseSlug);
  if (!doCurso) return null;

  const { capitulos } = doCurso;
  const produto = doCurso.produto;
  /**
   * ⚠️ `modelUsed` e `personaVersion` entram aqui porque a tela precisa deles.
   *
   * Ricardo, 13/08/2026: *"deveria ter inclusive quando clicamos no livro, o
   * controle do que foi feito e o que podemos mudar, exibindo os modelos a
   * serem utilizados"*. O dado já existia — `usercourselayers.modelUsed` — e
   * nunca tinha saído desta rota, então nenhuma tela podia mostrá-lo.
   *
   * E ele não é detalhe de bastidor. Os 16 capítulos do `chatgpt-masterclass`
   * dele foram escritos por **três modelos diferentes** numa mesma sessão
   * (`~deepseek/deepseek-v4-flash-latest`, `deepseek-v4-flash-0731` e
   * `deepseek-v4-pro`), porque o provedor escalona sozinho quando um falha.
   * Isso muda o texto que a pessoa lê. Esconder é decidir por ela.
   */
  const camadas = await UserCourseLayer.find({ userId, courseSlug }).select(
    "capitulo tituloCapitulo abertura exemplo tarefa generatedAt modelUsed personaVersion"
  );
  const porIndice = new Map(camadas.map((c) => [c.capitulo, c]));

  const sumario = capitulos
    // O primeiro `# ` costuma ser o título do curso, não a aula 1 — ele não é
    // capítulo e não pode virar linha do sumário.
    .filter((c) => c.numero !== null)
    .map((c) => {
      const camada = porIndice.get(c.indice);
      return {
        indice: c.indice,
        numero: c.numero,
        titulo: c.titulo,
        escrito: !!camada,
        abertura: camada?.abertura || "",
        exemplo: camada?.exemplo || "",
        tarefa: camada?.tarefa || "",
        escritoEm: camada?.generatedAt ? new Date(camada.generatedAt).toISOString() : null,
        modelo: camada?.modelUsed || null,
        personaVersion: camada?.personaVersion ?? null,
        // Quantos caracteres tem cada peça — é o que deixa "capítulo curto"
        // visível sem abrir os dezesseis um por um.
        tamanho: camada
          ? (camada.abertura || "").length + (camada.exemplo || "").length + (camada.tarefa || "").length
          : 0,
      };
    });

  return {
    curso: {
      slug: courseSlug,
      nome: (produto.name as string) || courseSlug,
      capa: (produto.thumbnail as string) || "",
      nivel: (produto.level as string) || "",
    },
    sumario,
    escritos: sumario.filter((s) => s.escrito).length,
    total: sumario.length,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const courseSlug = new URL(request.url).searchParams.get("curso")?.trim() || "";
    if (!courseSlug) return NextResponse.json({ error: "curso é obrigatório" }, { status: 400 });

    await dbConnect();
    const user = await User.findById(authUser.id).select("name");
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const livro = await montar(String(user._id), courseSlug);
    if (!livro) return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });

    const [share, config] = await Promise.all([
      LivroCompartilhado.findOne({ userId: String(user._id), courseSlug }),
      AtelieConfig.findOne({ userId: String(user._id), courseSlug }).lean(),
    ]);

    /**
     * A FICHA TÉCNICA DO LIVRO — o "controle do que foi feito" que faltava.
     *
     * Três coisas que a tela não tinha como mostrar porque a rota não mandava:
     *
     *  1. **Com que ajustes** ele foi escrito (tom, profundidade, tamanho,
     *     foco). Estavam gravados em `AtelieConfig` e só a rota de escrita
     *     lia. A pessoa mudava o tom no Ateliê e não tinha onde conferir com
     *     qual tom o livro que ela já tem foi feito.
     *  2. **Quem escreveu** cada capítulo — ver `lib/modelos-do-atelie.ts`.
     *  3. **O que já foi pago**, para a tela poder dizer "continuar" sem
     *     insinuar cobrança nova.
     */
    const ajustes = normalizarAjustes(config as Partial<Ajustes> | null);

    return NextResponse.json({
      ...livro,
      autor: user.name || "",
      compartilhado: share ? { ativo: share.ativo, token: share.token, visitas: share.visitas } : null,
      ajustes: {
        ...ajustes,
        // Os rótulos junto do id: a tela não deve ter que reimplementar a
        // tradução de "espelho" para "Do meu jeito" — e se reimplementasse,
        // um dia os dois textos discordariam.
        rotulos: {
          tom: acharOpcao(TONS_AJUSTE, ajustes.tom, AJUSTES_PADRAO.tom),
          profundidade: acharOpcao(PROFUNDIDADES, ajustes.profundidade, AJUSTES_PADRAO.profundidade),
          extensao: acharOpcao(EXTENSOES, ajustes.extensao, AJUSTES_PADRAO.extensao),
          /**
           * ⚠️ `foco` é LISTA (até 3), não escolha única — ver `Ajustes`.
           * Tratá-lo como string mostrava "undefined" na ficha, e um livro sem
           * foco escolhido (o caso do Ricardo) ficava com um campo vazio sem
           * explicação. Sem foco tem significado: o livro seguiu só a persona.
           */
          foco: (ajustes.foco || []).map((f) => acharOpcao(FOCOS, f, FOCOS[0].id)),
          narrador: NARRADORES.find((n) => n.id === ajustes.narrador) || null,
        },
      },
      opcoes: { tons: TONS_AJUSTE, profundidades: PROFUNDIDADES, extensoes: EXTENSOES, focos: FOCOS },
      pacote: config?.pacotePago
        ? {
            id: config.pacotePago.id,
            creditos: config.pacotePago.creditos,
            pagoEm: config.pacotePago.pagoEm,
          }
        : null,
      /** Quem escreveu, e quantos capítulos cada um. */
      modelos: contarPorModelo(livro.sumario.map((c) => c.modelo)).map((m) => ({
        ...m.ficha,
        capitulos: m.capitulos,
      })),
    });
  } catch (error) {
    console.error("livro GET error:", error);
    return NextResponse.json({ error: "Erro ao montar o livro" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const courseSlug = typeof body.curso === "string" ? body.curso.trim() : "";
    const acao = body.acao === "parar" ? "parar" : "compartilhar";
    if (!courseSlug) return NextResponse.json({ error: "curso é obrigatório" }, { status: 400 });

    await dbConnect();
    const user = await User.findById(authUser.id).select("name");
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    // Compartilhar um livro vazio manda a pessoa mostrar aos amigos uma capa e
    // um sumário apagado. Exigir um capítulo escrito é o mínimo para o link
    // valer a pena existir.
    const escritos = await UserCourseLayer.countDocuments({ userId: String(user._id), courseSlug });
    if (acao === "compartilhar" && escritos === 0) {
      return NextResponse.json(
        { error: "Escreva pelo menos um capítulo antes de compartilhar" },
        { status: 400 }
      );
    }

    const existente = await LivroCompartilhado.findOne({ userId: String(user._id), courseSlug });
    if (existente) {
      existente.ativo = acao === "compartilhar";
      if (user.name) existente.autor = user.name;
      await existente.save();
      return NextResponse.json({ ativo: existente.ativo, token: existente.token });
    }

    if (acao === "parar") return NextResponse.json({ ativo: false, token: null });

    const criado = await LivroCompartilhado.create({
      userId: String(user._id),
      courseSlug,
      // 24 bytes em base64url: espaço de busca grande o bastante para que
      // adivinhar um link não seja um caminho.
      token: randomBytes(24).toString("base64url"),
      autor: user.name || "",
      ativo: true,
    });

    return NextResponse.json({ ativo: true, token: criado.token });
  } catch (error) {
    console.error("livro POST error:", error);
    return NextResponse.json({ error: "Erro ao compartilhar" }, { status: 500 });
  }
}
