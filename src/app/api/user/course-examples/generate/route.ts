import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserCourseExample from "@/models/UserCourseExample";
import { getAuthUser } from "@/lib/auth";
import { getMongoClient } from "@/lib/products";
import { resolvePlan } from "@/lib/course-tiers";
import { parseExampleSlots } from "@/lib/course-examples";
import { generate } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/user/course-examples/generate — motor Expert v1 (Fase 3.3).
 * Gera exemplos personalizados por persona para os slots do curso.
 * Body: { courseSlug: string, regenerate?: boolean }
 * Só Expert (ou admin). Free/pro seguem vendo o exemplo padrão.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const plan = resolvePlan(user.subscription?.plan || "free");
    if (plan !== "expert" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Exemplos personalizados são exclusivos do plano Expert" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const courseSlug = typeof body.courseSlug === "string" ? body.courseSlug.trim() : "";
    const regenerate = body.regenerate === true;
    if (!courseSlug) {
      return NextResponse.json({ error: "courseSlug é obrigatório" }, { status: 400 });
    }

    const client = await getMongoClient();
    const product = await client
      .db("fayapointProdutos")
      .collection("products")
      .findOne({ slug: courseSlug }, { projection: { courseContent: 1 } });
    if (!product?.courseContent) {
      return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
    }

    const slots = parseExampleSlots(product.courseContent as string);
    if (!slots.length) {
      return NextResponse.json({ generated: 0, skipped: 0, totalSlots: 0 });
    }

    const existing = await UserCourseExample.find({
      userId: String(user._id),
      courseSlug,
    }).select("exampleId");
    const existingIds = new Set(existing.map((e) => e.exampleId));

    const persona = user.socialPersona || ({} as typeof user.socialPersona);
    const personaResumo = [
      persona.industry?.length ? `Setor: ${persona.industry.join(", ")}` : "",
      persona.marketingGoals?.length ? `Objetivos: ${persona.marketingGoals.join(", ")}` : "",
      persona.toneOfVoice?.length ? `Tom de voz: ${persona.toneOfVoice.join(", ")}` : "",
      persona.contentTypes?.length ? `Produz: ${persona.contentTypes.join(", ")}` : "",
      persona.experienceLevel ? `Nível com IA: ${persona.experienceLevel}` : "",
      persona.contentThemes?.length ? `Temas do conteúdo dele: ${persona.contentThemes.slice(0, 5).join(", ")}` : "",
      persona.audienceInsights ? `Público dele: ${persona.audienceInsights}` : "",
      persona.writingStyle ? `Estilo de escrita dele: ${persona.writingStyle}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (!personaResumo) {
      return NextResponse.json(
        { error: "Complete sua persona no Meu Perfil antes de gerar exemplos" },
        { status: 400 }
      );
    }

    let generated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const slot of slots) {
      if (!regenerate && existingIds.has(slot.id)) {
        skipped++;
        continue;
      }
      try {
        const res = await generate({
          tier: "budget",
          maxTokens: 700,
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content:
                "Você reescreve exemplos de cursos de IA para o contexto REAL do aluno. " +
                "Regras: mesma função didática e comprimento similar ao exemplo original; " +
                "mesmo formato markdown (parágrafos/listas); português do Brasil; " +
                "cite o setor/negócio do aluno de forma concreta e específica, nunca genérica; " +
                "NÃO adicione títulos, saudações nem comentários — devolva SÓ o exemplo reescrito.",
            },
            {
              role: "user",
              content:
                `PERFIL DO ALUNO:\n${personaResumo}\n\n` +
                `TEMA DO SLOT: ${slot.tema || "exemplo aplicado"}\n\n` +
                `EXEMPLO ORIGINAL:\n${slot.body}\n\n` +
                "Reescreva o exemplo para o contexto deste aluno.",
            },
          ],
        });

        const content = res.content?.trim();
        if (!content) throw new Error("resposta vazia");

        await UserCourseExample.updateOne(
          { userId: String(user._id), courseSlug, exampleId: slot.id },
          {
            $set: {
              tema: slot.tema,
              content,
              personaVersion: persona.personaVersion || 0,
              modelUsed: res.model,
              generatedAt: new Date(),
            },
          },
          { upsert: true }
        );
        generated++;
      } catch (err) {
        errors.push(`${slot.id}: ${err instanceof Error ? err.message : "erro"}`);
      }
    }

    return NextResponse.json({
      generated,
      skipped,
      totalSlots: slots.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error("course-examples generate error:", error);
    return NextResponse.json({ error: "Erro ao gerar exemplos" }, { status: 500 });
  }
}
