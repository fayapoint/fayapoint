import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserCourseLayer from "@/models/UserCourseLayer";
import { getAuthUser } from "@/lib/auth";
import { getMongoClient } from "@/lib/products";
import { resolvePlan } from "@/lib/course-tiers";
import { sanitizeCourseContent } from "@/lib/course-content-sanitizer";
import { dividirCapitulos } from "@/lib/curso-personalizado";
import { blocoDePersona, montarDossie, type PersonaProfunda } from "@/lib/persona";
import { generate } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * O curso reescrito para UMA pessoa — motor Expert v2 (27/07/2026).
 *
 * GET  ?curso=slug   → estado da camada (quantos capítulos, se envelheceu)
 * POST { curso, refazer? } → gera a camada capítulo a capítulo
 *
 * ## A trava de confiança, e por que ela existe
 *
 * Personalizar com persona rasa produz o pior resultado possível: um texto que
 * AFIRMA falar do negócio do aluno e fala de um negócio genérico. Isso é pior
 * do que não personalizar, porque quebra a promessa na cara dele. Então abaixo
 * de `MINIMA_CONFIANCA` a rota recusa e devolve o que falta preencher — o
 * painel do dossiê usa essa lista para pedir exatamente aquilo.
 */
const MINIMA_CONFIANCA = 35;

const SISTEMA =
  "Você adapta material didático de IA ao contexto REAL de um aluno brasileiro. " +
  "Responda SEMPRE em JSON válido com as chaves abertura, exemplo e tarefa. " +
  "Regras invioláveis: " +
  "(1) português do Brasil, segunda pessoa, falando COM o aluno; " +
  "(2) cite o ramo e a rotina dele de forma concreta — nada de 'sua empresa' genérico; " +
  "(3) não invente fatos sobre ferramentas nem números de mercado; números do exemplo devem ser plausíveis e declarados como exemplo; " +
  "(4) abertura em até 2 frases, exemplo em até 5 frases, tarefa em 1 frase executável hoje; " +
  "(5) nada de saudação, título ou markdown de cabeçalho — só o texto.";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const curso = new URL(request.url).searchParams.get("curso") || "";

    await dbConnect();
    const user = await User.findById(authUser.id).select("socialPersona name image subscription role enrolledCourses");
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    // Sem `curso`: devolve os cursos do aluno COM título. Nenhuma outra rota
    // faz isso — o progresso guarda só o slug, e "chatgpt-zero" num seletor é
    // pior que não ter seletor.
    if (!curso) {
      const slugs = [...new Set((user.enrolledCourses || []).filter((c) => c.isActive).map((c) => c.courseSlug))];
      if (!slugs.length) return NextResponse.json({ cursos: [] });

      const client = await getMongoClient();
      const produtos = await client
        .db("fayapointProdutos")
        .collection("products")
        .find({ slug: { $in: slugs } }, { projection: { slug: 1, name: 1 } })
        .toArray();

      const titulos = new Map(produtos.map((p) => [p.slug, p.name]));
      return NextResponse.json({
        cursos: slugs.map((s) => ({ slug: s, titulo: titulos.get(s) || s })),
      });
    }

    const persona = (user.socialPersona || {}) as unknown as PersonaProfunda;
    const dossie = montarDossie(persona, { nome: user.name, temFoto: !!user.image, avatar: user.image });
    const camadas = await UserCourseLayer.find({ userId: String(user._id), courseSlug: curso })
      .select("capitulo personaVersion generatedAt")
      .lean();

    const versaoAtual = persona.personaVersion || 0;
    return NextResponse.json({
      capitulosComCamada: camadas.length,
      confianca: dossie.confianca,
      minima: MINIMA_CONFIANCA,
      pronto: dossie.confianca >= MINIMA_CONFIANCA,
      // Envelheceu = a persona mudou desde que a camada foi escrita.
      desatualizada: camadas.some((c) => (c.personaVersion || 0) < versaoAtual),
      faltando: dossie.dimensoes
        .filter((d) => d.confianca < 50)
        .flatMap((d) => d.faltando.slice(0, 1).map((f) => ({ dimensao: d.titulo, ...f }))),
    });
  } catch (error) {
    console.error("[curso-personalizado] GET", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const plano = resolvePlan(user.subscription?.plan || "free");
    if (plano !== "expert" && user.role !== "admin") {
      return NextResponse.json(
        { error: "O curso personalizado é exclusivo do plano Expert" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const curso = typeof body.curso === "string" ? body.curso.trim() : "";
    const refazer = body.refazer === true;
    if (!curso) return NextResponse.json({ error: "curso é obrigatório" }, { status: 400 });

    const persona = (user.socialPersona || {}) as unknown as PersonaProfunda;
    const dossie = montarDossie(persona, { nome: user.name, temFoto: !!user.image, avatar: user.image });
    if (dossie.confianca < MINIMA_CONFIANCA) {
      return NextResponse.json(
        {
          error: `Ainda sei pouco sobre você (${dossie.confianca}%) para escrever no seu contexto sem inventar.`,
          confianca: dossie.confianca,
          minima: MINIMA_CONFIANCA,
          faltando: dossie.dimensoes
            .filter((d) => d.confianca < 50)
            .flatMap((d) => d.faltando.slice(0, 1).map((f) => ({ dimensao: d.titulo, ...f }))),
        },
        { status: 422 }
      );
    }

    const client = await getMongoClient();
    const produto = await client
      .db("fayapointProdutos")
      .collection("products")
      .findOne({ slug: curso }, { projection: { courseContent: 1, name: 1 } });
    if (!produto?.courseContent) {
      return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
    }

    const conteudo = sanitizeCourseContent(String(produto.courseContent)).content || "";
    const capitulos = dividirCapitulos(conteudo);
    if (!capitulos.length) {
      return NextResponse.json({ error: "Este curso ainda não tem capítulos" }, { status: 400 });
    }

    const existentes = await UserCourseLayer.find({ userId: String(user._id), courseSlug: curso })
      .select("capitulo personaVersion")
      .lean();
    const jaTem = new Map(existentes.map((e) => [e.capitulo, e.personaVersion || 0]));
    const versao = persona.personaVersion || 0;

    const contexto = blocoDePersona(persona, "curso");
    let geradas = 0;
    let puladas = 0;
    const erros: string[] = [];

    for (const cap of capitulos) {
      const anterior = jaTem.get(cap.indice);
      if (!refazer && anterior !== undefined && anterior >= versao) {
        puladas++;
        continue;
      }

      try {
        const res = await generate({
          tier: "budget",
          json: true,
          maxTokens: 700,
          temperature: 0.7,
          messages: [
            { role: "system", content: SISTEMA },
            {
              role: "user",
              content:
                `ALUNO:\n${contexto}\n\n` +
                `CURSO: ${produto.name || curso}\n` +
                `CAPÍTULO ${cap.indice + 1}: ${cap.titulo}\n\n` +
                // O capítulo inteiro estouraria o contexto num curso longo; o
                // começo carrega a tese, que é o que a camada precisa amarrar.
                `TRECHO DO CAPÍTULO:\n${cap.corpo.slice(0, 2600)}\n\n` +
                `Escreva as três peças para ESTE aluno neste capítulo.`,
            },
          ],
        });

        const dados = JSON.parse(res.content);
        const abertura = String(dados.abertura || "").trim();
        const exemplo = String(dados.exemplo || "").trim();
        const tarefa = String(dados.tarefa || "").trim();
        if (!abertura && !exemplo && !tarefa) throw new Error("resposta vazia");

        await UserCourseLayer.updateOne(
          { userId: String(user._id), courseSlug: curso, capitulo: cap.indice },
          {
            $set: {
              tituloCapitulo: cap.titulo,
              abertura,
              exemplo,
              tarefa,
              personaVersion: versao,
              modelUsed: res.model,
              generatedAt: new Date(),
            },
          },
          { upsert: true }
        );
        geradas++;
      } catch (err) {
        erros.push(`cap ${cap.indice + 1}: ${err instanceof Error ? err.message : "erro"}`);
      }
    }

    return NextResponse.json({
      geradas,
      puladas,
      capitulos: capitulos.length,
      confianca: dossie.confianca,
      erros: erros.length ? erros : undefined,
    });
  } catch (error) {
    console.error("[curso-personalizado] POST", error);
    return NextResponse.json({ error: "Erro ao personalizar o curso" }, { status: 500 });
  }
}
