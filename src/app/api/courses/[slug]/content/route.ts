import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import CourseProgress from '@/models/CourseProgress';
import Order from '@/models/Order';
import { getAuthUser } from '@/lib/auth';
import { getMongoClient } from '@/lib/products';
import { SubscriptionPlan, TIER_CONFIGS, resolvePlan } from '@/lib/course-tiers';
import Course from '@/models/Course';
import { isCourseFreeThisMonth } from '@/lib/monthly-course-offers';
import {
  computeLessonContentCoverage,
  normalizeEditorialVerification,
} from '@/lib/editorial-verification';

type CourseModule = {
  title?: string;
  description?: string;
  lessons?: Array<{
    title?: string;
    description?: string;
    duration?: number;
    order?: number;
    isFree?: boolean;
    content?: string;
  }>;
};

function buildDetailedCurriculumFallback(modules: CourseModule[]) {
  return modules.map((module) => ({
    title: module.title || '',
    description: module.description || '',
    lessons: (module.lessons || []).map((lesson, index) => ({
      title: String(lesson.title || ''),
      description: String(lesson.description || ''),
      duration: Number(lesson.duration || 0),
      order: typeof lesson.order === 'number' ? lesson.order : index,
      isFree: Boolean(lesson.isFree),
      hasContent:
        typeof lesson.content === 'string' && lesson.content.trim().length > 0,
      contentLength: typeof lesson.content === 'string' ? lesson.content.length : 0,
    })),
  }));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await dbConnect();

    const course = await Course.findOne({ slug })
      .select('title modules')
      .lean<{ title?: string; modules?: CourseModule[] } | null>();

    const courseModules = Array.isArray(course?.modules) ? course.modules : [];
    const lessonContentCoverage = computeLessonContentCoverage(courseModules);
    const fallbackDetailedCurriculum = buildDetailedCurriculumFallback(courseModules);

    const client = await getMongoClient();
    const product = await client
      .db('fayapointProdutos')
      .collection('products')
      .findOne(
        { slug },
        {
          projection: {
            courseContent: 1,
            name: 1,
            slug: 1,
            detailedCurriculum: 1,
            contentChapters: 1,
            contentUpdatedAt: 1,
            editorialVerification: 1,
          },
        }
      );

    if (!product) {
      return NextResponse.json(
        { error: 'Curso não encontrado' },
        { status: 404 }
      );
    }

    const payload = {
      content: product.courseContent || 'Conteúdo em breve...',
      title: product.name || course?.title || slug,
      modules: product.detailedCurriculum || fallbackDetailedCurriculum,
      slug: product.slug || slug,
      contentChapters:
        typeof product.contentChapters === 'number' ? product.contentChapters : 0,
      contentUpdatedAt: product.contentUpdatedAt || null,
      lessonContentCoverage,
      editorialVerification: normalizeEditorialVerification(
        product.editorialVerification as Record<string, unknown> | null | undefined
      ),
    };

    // ── Try to get authenticated user ──
    const authUser = await getAuthUser();

    // ── Unauthenticated user → return content for free preview ──
    // The access gating (which chapters are visible) is handled client-side
    // via the /api/courses/access endpoint.
    if (!authUser) {
      return NextResponse.json(payload);
    }

    const userId = authUser.id;

    // 1. Check Access
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userPlan = resolvePlan(user.subscription?.plan || 'free');
    const tierConfig = TIER_CONFIGS[userPlan];

    let hasAccess = false;

    // Check Role - Admin/Instructor always have access
    if (user.role === 'admin' || user.role === 'instructor') hasAccess = true;

    // Check if tier has unlimited access
    if (tierConfig.limits.unlimited) hasAccess = true;

    // Monthly free course is fully unlocked for any authenticated user
    if (isCourseFreeThisMonth(slug)) hasAccess = true;

    // Check enrolled courses (NEW TIER SYSTEM)
    if (!hasAccess) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isEnrolled = user.enrolledCourses?.some(
        (c: any) => c.courseSlug === slug && c.isActive
      );
      if (isEnrolled) hasAccess = true;
    }

    // Check Progress (backwards compatibility - if progress exists, they have access)
    if (!hasAccess) {
      const progress = await CourseProgress.findOne({
        userId,
        courseId: slug,
      });
      if (progress) hasAccess = true;
    }

    // Check Orders (purchased courses)
    if (!hasAccess) {
      const order = await Order.findOne({
        userId,
        status: 'completed',
        'items.id': { $regex: new RegExp(slug, 'i') },
      });
      if (order) hasAccess = true;
    }

    // Check External Orders (Proposals)
    if (!hasAccess) {
      try {
        const client = await getMongoClient();
        const productsDb = client.db('fayapointProdutos');
        const proposals = await productsDb
          .collection('service_proposals')
          .findOne({
            email: user.email,
            status: { $in: ['converted', 'closed'] },
            'selections.serviceSlug': slug,
          });
        if (proposals) hasAccess = true;
      } catch (e) {
        console.error('Error checking external access', e);
      }
    }

    // For free/starter users without explicit access: still return content
    // The chapter gating is enforced client-side via the access API.
    // This allows the free preview (first 3 chapters) to work.
    return NextResponse.json({
      ...payload,
      hasFullAccess: hasAccess,
    });
  } catch (error) {
    console.error('Course content error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
