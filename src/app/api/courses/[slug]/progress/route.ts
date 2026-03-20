import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import CourseProgress from '@/models/CourseProgress';
import Order from '@/models/Order';
import { getAuthUser } from '@/lib/auth';
import { getMongoClient } from '@/lib/products';
import { resolvePlan, TIER_CONFIGS } from '@/lib/course-tiers';

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function computeSectionProgressPercent(completedSections: string[], totalSections: number | null | undefined) {
  if (typeof totalSections !== 'number' || totalSections <= 0) return null;
  return Math.min(100, Math.max(0, Math.round((completedSections.length / totalSections) * 100)));
}

async function requireCourseAccess(userId: string, slug: string) {
  await dbConnect();

  const user = await User.findById(userId);
  if (!user) {
    return { error: NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 }) };
  }

  const userPlan = resolvePlan(user.subscription?.plan || 'free');
  const tierConfig = TIER_CONFIGS[userPlan];

  let hasAccess = false;

  if (user.role === 'admin' || user.role === 'instructor') hasAccess = true;
  if (tierConfig.limits.unlimited) hasAccess = true;

  if (!hasAccess) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isEnrolled = user.enrolledCourses?.some((c: any) => c.courseSlug === slug && c.isActive);
    if (isEnrolled) hasAccess = true;
  }

  if (!hasAccess) {
    const progress = await CourseProgress.findOne({ userId, courseId: slug });
    if (progress) hasAccess = true;
  }

  if (!hasAccess) {
    const order = await Order.findOne({
      userId,
      status: 'completed',
      'items.id': { $regex: new RegExp(slug, 'i') },
    });
    if (order) hasAccess = true;
  }

  if (!hasAccess) {
    try {
      const client = await getMongoClient();
      const productsDb = client.db('fayapointProdutos');
      const proposals = await productsDb.collection('service_proposals').findOne({
        email: user.email,
        status: { $in: ['converted', 'closed'] },
        'selections.serviceSlug': slug,
      });
      if (proposals) hasAccess = true;
    } catch (e) {
      console.error('Error checking external access', e);
    }
  }

  if (!hasAccess) {
    return {
      error: NextResponse.json(
        {
          error: 'Acesso negado. Matricule-se no curso ou faça upgrade do seu plano.',
          requiresEnrollment: true,
          courseSlug: slug,
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const access = await requireCourseAccess(authUser.id, slug);
    if (access.error) return access.error;

    let progress = await CourseProgress.findOne({ userId: authUser.id, courseId: slug });

    if (!progress) {
      progress = await CourseProgress.create({
        userId: authUser.id,
        courseId: slug,
        completedLessons: [],
        completedSections: [],
        progressPercent: 0,
        isCompleted: false,
        lastAccessedAt: new Date(),
      });
    }

    const normalizedCompletedSections = Array.isArray(progress.completedSections)
      ? progress.completedSections
      : [];
    const normalizedProgressPercent =
      computeSectionProgressPercent(normalizedCompletedSections, progress.totalSections) ?? (progress.progressPercent || 0);

    return NextResponse.json({
      progress: {
        courseId: progress.courseId,
        completedLessons: progress.completedLessons || [],
        completedSections: normalizedCompletedSections,
        lastAccessedLesson: progress.lastAccessedLesson || null,
        lastHeadingId: progress.lastHeadingId || null,
        progressPercent: normalizedProgressPercent,
        totalSections: progress.totalSections || null,
        lastScrollY: progress.lastScrollY ?? null,
        lastScrollPercent: progress.lastScrollPercent ?? null,
        isCompleted: progress.isCompleted || false,
        startedAt: progress.startedAt,
        lastAccessedAt: progress.lastAccessedAt,
      },
    });
  } catch (error) {
    console.error('Course progress GET error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

interface UpdateProgressBody {
  completedSections?: string[];
  replaceAllSections?: boolean;
  lastHeadingId?: string | null;
  lastScrollY?: number | null;
  lastScrollPercent?: number | null;
  totalSections?: number | null;
  progressPercent?: number | null;
  isCompleted?: boolean;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const access = await requireCourseAccess(authUser.id, slug);
    if (access.error) return access.error;

    const body = (await request.json()) as UpdateProgressBody;

    const progress = await CourseProgress.findOne({ userId: authUser.id, courseId: slug });

    const completedSections = body.replaceAllSections
      ? uniqueStrings(body.completedSections || [])
      : uniqueStrings([
          ...((progress?.completedSections as string[]) || []),
          ...(body.completedSections || []),
        ]);

    const totalSections = typeof body.totalSections === 'number' ? body.totalSections : progress?.totalSections;
    const computedPercentBySections = computeSectionProgressPercent(completedSections, totalSections);

    // If we know total sections, section completion is the source of truth.
    // Scroll-based % is for resume position only and should not inflate completion.
    const finalProgressPercent =
      typeof computedPercentBySections === 'number'
        ? computedPercentBySections
        : typeof body.progressPercent === 'number'
          ? Math.min(100, Math.max(0, Math.round(body.progressPercent)))
          : typeof body.lastScrollPercent === 'number'
            ? Math.min(100, Math.max(0, Math.round(body.lastScrollPercent)))
            : progress?.progressPercent || 0;

    const updated = await CourseProgress.findOneAndUpdate(
      { userId: authUser.id, courseId: slug },
      {
        $set: {
          completedSections,
          lastHeadingId: body.lastHeadingId ?? progress?.lastHeadingId,
          lastScrollY: typeof body.lastScrollY === 'number' ? body.lastScrollY : progress?.lastScrollY,
          lastScrollPercent:
            typeof body.lastScrollPercent === 'number' ? body.lastScrollPercent : progress?.lastScrollPercent,
          totalSections: typeof body.totalSections === 'number' ? body.totalSections : progress?.totalSections,
          progressPercent: finalProgressPercent,
          isCompleted: typeof body.isCompleted === 'boolean' ? body.isCompleted : progress?.isCompleted || false,
          lastAccessedAt: new Date(),
        },
        $setOnInsert: {
          completedLessons: [],
          startedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      progress: {
        courseId: updated.courseId,
        completedLessons: updated.completedLessons || [],
        completedSections: updated.completedSections || [],
        lastHeadingId: updated.lastHeadingId || null,
        lastScrollY: updated.lastScrollY ?? null,
        lastScrollPercent: updated.lastScrollPercent ?? null,
        totalSections: updated.totalSections || null,
        progressPercent: updated.progressPercent || 0,
        isCompleted: updated.isCompleted || false,
        lastAccessedAt: updated.lastAccessedAt,
      },
    });
  } catch (error) {
    console.error('Course progress PUT error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
