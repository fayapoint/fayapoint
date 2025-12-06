import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import CourseProgress from '@/models/CourseProgress';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import { 
  canEnrollInCourse, 
  normalizeCourseLevel, 
  CourseLevel,
  SubscriptionPlan,
  calculateEnrollmentSlots,
  getUpgradeSuggestion
} from '@/lib/course-tiers';
import { getCourseBySlug, allCourses } from '@/data/courses';

const JWT_SECRET = process.env.JWT_SECRET || '';

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
    await dbConnect();

    // Authenticate user
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded: { id: string } | string | jwt.JwtPayload;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    if (typeof decoded === 'string' || !decoded.id) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const userId = decoded.id;
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
    const userPlan = (user.subscription?.plan || 'free') as SubscriptionPlan;
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

    // Check if can enroll based on tier limits
    const enrollmentCheck = canEnrollInCourse(
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

    // Create enrollment
    const newEnrollment = {
      courseId: String(courseData.id),
      courseSlug: courseSlug,
      level: courseLevel,
      enrolledAt: new Date(),
      isActive: true,
      source: 'subscription' as const
    };

    // Add enrollment to user
    await User.findByIdAndUpdate(userId, {
      $push: { enrolledCourses: newEnrollment },
      $inc: { 'progress.coursesInProgress': 1 }
    });

    // Create course progress record
    const progress = await CourseProgress.create({
      userId,
      courseId: courseSlug,
      completedLessons: [],
      progressPercent: 0,
      isCompleted: false
    });

    // Get updated slots
    const updatedEnrollments = [...enrolledCourses, newEnrollment];
    const updatedSlots = calculateEnrollmentSlots(userPlan, updatedEnrollments);

    return NextResponse.json({
      success: true,
      message: 'Matrícula realizada com sucesso!',
      enrollment: newEnrollment,
      progress,
      slots: updatedSlots
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
    await dbConnect();

    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded: { id: string } | string | jwt.JwtPayload;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    if (typeof decoded === 'string' || !decoded.id) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const userId = decoded.id;
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
