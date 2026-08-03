import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import CourseProgress from '@/models/CourseProgress';
import { getAuthUser } from '@/lib/auth';
import {
  canEnrollInCourse,
  normalizeCourseLevel,
  CourseLevel,
  calculateEnrollmentSlots,
  getUpgradeSuggestion,
  resolvePlan,
  limiteSimultaneo,
  TIER_CONFIGS,
} from '@/lib/course-tiers';
import { getCourseBySlug, allCourses } from '@/data/courses';
import { canPlanAccessMonthlyOffer, getMonthlyCourseOfferSetAsync } from '@/lib/monthly-course-offers';

interface EnrollmentRequest {
  courseSlug: string;
  courseId?: string;
}

/**
 * POST /api/courses/enroll
 * Enroll user in a course based on their subscription tier
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const userId = authUser.id;

    await dbConnect();

    const body: EnrollmentRequest = await request.json();
    const { courseSlug } = body;

    if (!courseSlug) {
      return NextResponse.json(
        { error: 'courseSlug é obrigatório' },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Get course info
    const courseData = getCourseBySlug(courseSlug);
    if (!courseData) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 });
    }

    const courseLevel = courseData.normalizedLevel || normalizeCourseLevel(courseData.level);
    const userPlan = resolvePlan(user.subscription?.plan || 'free');
    const enrolledCourses = user.enrolledCourses || [];

    // Check if already enrolled
    const existingEnrollment = enrolledCourses.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => c.courseSlug === courseSlug && c.isActive
    );

    if (existingEnrollment) {
      // Already enrolled - just return success and ensure progress exists
      let progress = await CourseProgress.findOne({ userId, courseId: courseSlug });
      if (!progress) {
        progress = await CourseProgress.create({
          userId,
          courseId: courseSlug,
          completedLessons: [],
          completedSections: [],
          progressPercent: 0,
          isCompleted: false
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Você já está matriculado neste curso',
        enrollment: existingEnrollment,
        progress
      });
    }

    // ── Limite de cursos ABERTOS ao mesmo tempo ──────────────────────────
    //
    // Vem antes das outras checagens de propósito: negar por vaga é uma
    // conversa diferente de negar por plano. Aqui a pessoa não precisa pagar
    // mais nada — precisa terminar o que começou —, e a mensagem tem que dizer
    // isso, senão ela lê "compre um upgrade" e desiste.
    //
    // Curso concluído não ocupa vaga. A conta é feita contra o CourseProgress
    // e não contra `progress.coursesInProgress` do usuário, porque aquele
    // contador é incrementado/decrementado à mão em vários pontos do código e
    // dessincroniza — um número aproximado não pode governar um portão.
    // Só matrícula de ASSINATURA ocupa vaga.
    //
    // Curso comprado avulso (`source: 'purchase'`), ganho ou de promoção é
    // propriedade da pessoa — ela pagou por aquele curso, não por uma vaga.
    // Contá-los faria o cliente que mais gasta perder acesso ao que a
    // assinatura promete, que é o oposto do que este limite existe para fazer.
    // A compra, aliás, nem passa por aqui: ela é cumprida pelo webhook.
    const ativos = enrolledCourses.filter(
      (c: { isActive: boolean; source?: string }) =>
        c.isActive && (c.source ?? 'subscription') === 'subscription',
    );
    const slugsAtivos = ativos.map((c: { courseSlug: string }) => c.courseSlug);
    const concluidos = await CourseProgress.find({
      userId,
      courseId: { $in: slugsAtivos },
      isCompleted: true,
    })
      .select('courseId')
      .lean<Array<{ courseId: string }>>();
    const slugsConcluidos = new Set(concluidos.map((p) => p.courseId));
    const emAndamento = slugsAtivos.filter((s: string) => !slugsConcluidos.has(s));
    const limite = limiteSimultaneo(userPlan);

    if (emAndamento.length >= limite) {
      return NextResponse.json(
        {
          error:
            `Seu plano ${TIER_CONFIGS[userPlan].displayName} mantém ${limite} ` +
            `${limite === 1 ? 'curso aberto' : 'cursos abertos'} ao mesmo tempo, e você já ` +
            `${emAndamento.length === 1 ? 'tem 1 em andamento' : `tem ${emAndamento.length} em andamento`}. ` +
            `Conclua um deles — ou saia de um — para liberar a vaga.`,
          limiteSimultaneo: limite,
          emAndamento: emAndamento.length,
          cursosEmAndamento: emAndamento,
          // Não é "upgradeRequired": a saída barata é terminar um curso. O
          // upgrade fica como alternativa, não como única porta.
          upgradeRequired: false,
          podeFazerUpgrade: userPlan !== 'expert',
        },
        { status: 409 },
      );
    }

    // Use async version to get Mission Control override from MongoDB
    const offerSet = await getMonthlyCourseOfferSetAsync();
    const isFreeByMissionControl = offerSet.freeCourseSlug === courseSlug;
    const isFreeEnrollment =
      isFreeByMissionControl || courseLevel === 'free' || courseData.price === 0;

    // Check if can enroll based on tier limits
    const enrollmentCheck = isFreeEnrollment
      ? { canEnroll: true }
      : canEnrollInCourse(
          userPlan,
          courseLevel,
          enrolledCourses.map((c: { courseId: string; level: string; enrolledAt: Date; isActive: boolean }) => ({
            courseId: c.courseId,
            level: c.level as CourseLevel,
            enrolledAt: c.enrolledAt,
            isActive: c.isActive
          })),
          courseSlug
        );

    if (!enrollmentCheck.canEnroll) {
      const upgradeInfo = getUpgradeSuggestion(userPlan, courseLevel);
      
      return NextResponse.json({
        error: enrollmentCheck.reason,
        upgradeRequired: enrollmentCheck.upgradeRequired,
        suggestedPlan: upgradeInfo?.suggestedPlan,
        benefits: upgradeInfo?.benefits,
        currentSlots: calculateEnrollmentSlots(userPlan, enrolledCourses)
      }, { status: 403 });
    }

    if (!isFreeEnrollment && !canPlanAccessMonthlyOffer(userPlan, courseSlug)) {
      return NextResponse.json({
        error: 'Este curso não faz parte do catálogo liberado neste mês para o seu plano. Você pode aguardar a próxima rotação, fazer upgrade ou comprar individualmente.',
        upgradeRequired: false,
        canPurchase: true,
        monthlyOffer: { isFreeCourseOfMonth: isFreeByMissionControl, freeCourseSlug: offerSet.freeCourseSlug },
        currentSlots: calculateEnrollmentSlots(userPlan, enrolledCourses),
      }, { status: 403 });
    }

    // Create enrollment
    const newEnrollment = {
      courseId: String(courseData.id),
      courseSlug: courseSlug,
      level: courseLevel,
      enrolledAt: new Date(),
      isActive: true,
      source: isFreeEnrollment ? 'promotion' as const : 'subscription' as const
    };

    // Add enrollment to user
    await User.findByIdAndUpdate(userId, {
      $push: { enrolledCourses: newEnrollment },
      $inc: { 'progress.coursesInProgress': 1 }
    });

    // Reuse any preview progress already created for this course instead of
    // violating the unique progress index when a user upgrades to full enrollment.
    const progress = await CourseProgress.findOneAndUpdate(
      { userId, courseId: courseSlug },
      {
        $setOnInsert: {
          completedLessons: [],
          completedSections: [],
          progressPercent: 0,
          isCompleted: false,
          startedAt: new Date(),
          lastAccessedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    // Get updated slots
    const updatedEnrollments = [...enrolledCourses, newEnrollment];
    const updatedSlots = calculateEnrollmentSlots(userPlan, updatedEnrollments);

    return NextResponse.json({
      success: true,
      message: isFreeEnrollment ? 'Curso liberado com sucesso!' : 'Matrícula realizada com sucesso!',
      enrollment: newEnrollment,
      progress,
      slots: updatedSlots,
      monthlyOffer: { isFreeCourseOfMonth: isFreeByMissionControl, freeCourseSlug: offerSet.freeCourseSlug }
    });

  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courses/enroll
 * Unenroll user from a course (deactivate enrollment)
 */
export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const userId = authUser.id;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const courseSlug = searchParams.get('courseSlug');

    if (!courseSlug) {
      return NextResponse.json(
        { error: 'courseSlug é obrigatório' },
        { status: 400 }
      );
    }

    // Deactivate enrollment
    await User.findByIdAndUpdate(userId, {
      $set: { 'enrolledCourses.$[elem].isActive': false },
      $inc: { 'progress.coursesInProgress': -1 }
    }, {
      arrayFilters: [{ 'elem.courseSlug': courseSlug }]
    });

    return NextResponse.json({
      success: true,
      message: 'Matrícula cancelada'
    });

  } catch (error) {
    console.error('Unenroll error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
