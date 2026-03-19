import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CourseProgress from '@/models/CourseProgress';
import { getAuthUser } from '@/lib/auth';

/**
 * GET /api/courses/progress?slug=xxx
 *
 * Returns progress for a course.
 * - Authenticated users: returns DB-persisted progress
 * - Unauthenticated users: returns empty (they use localStorage)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'O parâmetro slug é obrigatório' },
        { status: 400 }
      );
    }

    const authUser = await getAuthUser();
    const userId = authUser?.id || null;

    // Unauthenticated → return empty progress (client uses localStorage)
    if (!userId) {
      return NextResponse.json({
        progress: {
          courseId: slug,
          completedLessons: [],
          completedSections: [],
          lastHeadingId: null,
          progressPercent: 0,
          isCompleted: false,
          source: 'local',
        },
      });
    }

    // Authenticated → fetch from DB
    await dbConnect();
    const progress = await CourseProgress.findOne({ userId, courseId: slug });

    if (!progress) {
      return NextResponse.json({
        progress: {
          courseId: slug,
          completedLessons: [],
          completedSections: [],
          lastHeadingId: null,
          progressPercent: 0,
          isCompleted: false,
          source: 'db',
        },
      });
    }

    return NextResponse.json({
      progress: {
        courseId: progress.courseId,
        completedLessons: progress.completedLessons || [],
        completedSections: progress.completedSections || [],
        lastAccessedLesson: progress.lastAccessedLesson || null,
        lastHeadingId: progress.lastHeadingId || null,
        progressPercent: progress.progressPercent || 0,
        totalSections: progress.totalSections || null,
        lastScrollY: progress.lastScrollY ?? null,
        lastScrollPercent: progress.lastScrollPercent ?? null,
        isCompleted: progress.isCompleted || false,
        startedAt: progress.startedAt,
        lastAccessedAt: progress.lastAccessedAt,
        source: 'db',
      },
    });
  } catch (error) {
    console.error('Course progress GET error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses/progress
 *
 * Record chapter completion.
 * Body: { slug: string, chapterIndex: number, chapterId?: string }
 *
 * - Authenticated users: persists to DB
 * - Unauthenticated users: returns success (they persist in localStorage)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, chapterIndex, chapterId } = body;

    if (!slug || typeof chapterIndex !== 'number') {
      return NextResponse.json(
        { error: 'slug e chapterIndex são obrigatórios' },
        { status: 400 }
      );
    }

    const authUser = await getAuthUser();
    const userId = authUser?.id || null;

    // Unauthenticated → acknowledge but don't persist
    if (!userId) {
      return NextResponse.json({
        success: true,
        message: 'Progresso salvo localmente',
        source: 'local',
      });
    }

    // Authenticated → persist to DB
    await dbConnect();

    const sectionId = chapterId || `chapter-${chapterIndex}`;

    const progress = await CourseProgress.findOneAndUpdate(
      { userId, courseId: slug },
      {
        $addToSet: { completedSections: sectionId },
        $set: {
          lastHeadingId: sectionId,
          lastAccessedAt: new Date(),
        },
        $setOnInsert: {
          completedLessons: [],
          startedAt: new Date(),
          isCompleted: false,
          progressPercent: 0,
        },
      },
      { upsert: true, new: true }
    );

    // Recompute progress percent
    const totalSections = progress.totalSections;
    if (typeof totalSections === 'number' && totalSections > 0) {
      const completedCount = (progress.completedSections as string[]).length;
      const percent = Math.min(
        100,
        Math.floor((completedCount / totalSections) * 100)
      );
      progress.progressPercent = percent;
      progress.isCompleted = completedCount >= totalSections;
      await progress.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Progresso salvo',
      source: 'db',
      progress: {
        courseId: progress.courseId,
        completedSections: progress.completedSections || [],
        progressPercent: progress.progressPercent || 0,
        isCompleted: progress.isCompleted || false,
      },
    });
  } catch (error) {
    console.error('Course progress POST error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
