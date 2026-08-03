import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserCourseLayer from "@/models/UserCourseLayer";
import { getAuthUser } from "@/lib/auth";
import { getMongoClient } from "@/lib/products";
import { resolvePlan } from "@/lib/course-tiers";
import { sanitizeCourseContent } from "@/lib/course-content-sanitizer";
import { dividirCapitulos } from "@/lib/curso-personalizado";
import { applyContentFacts, getContentFacts } from "@/lib/content-facts";
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

/**
 * Impressão curta do trecho que gerou a camada.
 *
 * Não precisa ser criptográfica — só precisa mudar quando o capítulo muda, e
 * caber num campo indexável. `createHash` do Node serve e não traz dependência.
 */
function impressao(texto: string): string {
  return createHash("sha1").update(texto).digest("hex").slice(0, 16);
}

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
      .select("capitulo personaVersion hashCapitulo generatedAt")
      .lean();

    // Para saber se o CURSO mudou desde a camada, é preciso reler o conteúdo e
    // comparar as impressões — é a mesma conta do POST, feita só para relatar.
    let hashAtual = new Map<number, string>();
    try {
      const client = await getMongoClient();
      const prod = await client
        .db("fayapointProdutos")
        .collection("products")
        .findOne({ slug: curso }, { projection: { courseContent: 1 } });
      if (prod?.courseContent) {
        const texto = sanitizeCourseContent(String(prod.courseContent)).content || "";
        hashAtual = new Map(
          dividirCapitulos(texto).map((c) => [c.indice, impressao(c.corpo.slice(0, 2600))])
        );
      }
    } catch {
      // Sem o conteúdo, só não dá para afirmar que envelheceu por curso.
    }

    const versaoAtual = persona.personaVersion || 0;
    return NextResponse.json({
      capitulosComCamada: camadas.length,
      confianca: dossie.confianca,
      minima: MINIMA_CONFIANCA,
      pronto: dossie.confianca >= MINIMA_CONFIANCA,
      // Envelheceu por qualquer um dos dois lados: a persona mudou, ou o
      // capítulo foi reescrito debaixo da camada.
      desatualizada: camadas.some(
        (c) =>
          (c.personaVersion || 0) < versaoAtual ||
          (hashAtual.size > 0 && hashAtual.get(c.capitulo) !== undefined && hashAtual.get(c.capitulo) !== (c.hashCapitulo || ""))
      ),
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
      .select("capitulo personaVersion hashCapitulo")
      .lean();
    const jaTem = new Map(
      existentes.map((e) => [e.capitulo, { versao: e.personaVersion || 0, hash: e.hashCapitulo || "" }])
    );
    const versao = persona.personaVersion || 0;

    const contexto = blocoDePersona(persona, "curso");
    // Uma leitura do registry para o laço inteiro — ele já tem cache de 5 min,
    // mas buscar por capítulo seria pedir a mesma coisa 30 vezes.
    const fatos = await getContentFacts();
    let geradas = 0;
    let puladas = 0;
    const erros: string[] = [];

    for (const cap of capitulos) {
      // Bloco sem número é a capa do curso, não uma aula. Gerar camada para ele
      // gastava uma chamada e escrevia "por que ESTE capítulo importa" em cima
      // do título do curso.
      if (cap.numero === null) continue;

      const trecho = cap.corpo.slice(0, 2600);
      // O hash fica sobre o texto CRU, com os `{{fact:…}}` no lugar. Se
      // resolvesse antes de hashear, cada atualização do registry mudaria a
      // impressão de todos os capítulos e mandaria regerar a camada de todos
      // os alunos — uma conta de LLM por trocar o nome de um modelo.
      const hash = impressao(trecho);
      // Já o que vai para o modelo é resolvido: ele não deve ver token, e
      // muito menos copiar um para dentro do texto que o aluno lê.
      const trechoResolvido = applyContentFacts(trecho, fatos);
      const anterior = jaTem.get(cap.indice);
      if (!refazer && anterior !== undefined && anterior.versao >= versao && anterior.hash === hash) {
        puladas++;
        continue;
      }

      try {
        const pedir = async (reforco: boolean) => {
          const res = await generate({
            // Barato primeiro, caro só quando o barato falha — a mesma ordem
            // que o curso ensina. O tier budget entrega JSON com uma chave
            // vazia em ~13% dos capítulos mesmo com o reforço no prompt;
            // escalar só nesses casos custa quase nada e fecha o buraco.
            tier: reforco ? "premium" : "budget",
            json: true,
            // 700 apertava quando o exemplo vinha completo; o modelo entregava
            // JSON válido com `exemplo` vazio em ~1 de cada 4 capítulos.
            // 02/08: subiu de 1000 para 3000 junto com a troca para o DeepSeek
            // V4 — ele raciocina antes de responder e o pensamento sai do
            // mesmo orçamento, então 1000 devolveria `content` vazio.
            maxTokens: 3000,
            temperature: 0.7,
            messages: [
              { role: "system", content: SISTEMA },
              {
                role: "user",
                content:
                  `ALUNO:\n${contexto}\n\n` +
                  `CURSO: ${produto.name || curso}\n` +
                  `CAPÍTULO ${cap.numero}: ${cap.titulo}\n\n` +
                  // O capítulo inteiro estouraria o contexto num curso longo; o
                  // começo carrega a tese, que é o que a camada precisa amarrar.
                  `TRECHO DO CAPÍTULO:\n${trechoResolvido}\n\n` +
                  `Escreva as três peças para ESTE aluno neste capítulo.` +
                  (reforco
                    ? `\n\nATENÇÃO: a tentativa anterior veio com alguma das três chaves vazia. ` +
                      `As três — abertura, exemplo e tarefa — precisam vir preenchidas.`
                    : ""),
              },
            ],
          });
          // ⚠️ Nem todo modelo honra `response_format: json_object` do mesmo
          // jeito. O tier premium devolve o JSON dentro de ```json … ```, e o
          // `JSON.parse` cru recusa — o que transformou o escalonamento numa
          // regressão: 4 falhas viraram 12. A cerca sai antes de interpretar.
          const cru = String(res.content || "")
            .trim()
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/```\s*$/, "");
          const d = JSON.parse(cru);
          return {
            abertura: String(d.abertura || "").trim(),
            exemplo: String(d.exemplo || "").trim(),
            tarefa: String(d.tarefa || "").trim(),
            model: res.model,
          };
        };

        let dados = await pedir(false);
        // A checagem antiga só reprovava se as TRÊS viessem vazias, então uma
        // camada sem `exemplo` — a peça mais valiosa — passava direto e era
        // gravada. Medido em 02/08: 8 de 31 capítulos sem exemplo.
        if (!dados.abertura || !dados.exemplo || !dados.tarefa) {
          dados = await pedir(true);
        }
        const { abertura, exemplo, tarefa } = dados;
        if (!abertura || !exemplo || !tarefa) throw new Error("camada incompleta após 2 tentativas");
        const res = { model: dados.model };

        await UserCourseLayer.updateOne(
          { userId: String(user._id), courseSlug: curso, capitulo: cap.indice },
          {
            $set: {
              tituloCapitulo: cap.titulo,
              abertura,
              exemplo,
              tarefa,
              personaVersion: versao,
              hashCapitulo: hash,
              modelUsed: res.model,
              generatedAt: new Date(),
            },
          },
          { upsert: true }
        );
        geradas++;
      } catch (err) {
        // `cap.numero` e não `indice + 1`: com o preâmbulo pulado, o índice
        // deixou de casar com o número que o aluno vê.
        erros.push(`cap ${cap.numero}: ${err instanceof Error ? err.message : "erro"}`);
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
