import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import { 
  calculateEnrollmentSlots, 
  TIER_CONFIGS,
  SubscriptionPlan,
  CourseLevel,
  canEnrollInCourse,
  normalizeCourseLevel
} from '@/lib/course-tiers';
import { allCourses, getNormalizedLevel } from '@/data/courses';

const JWT_SECRET = process.env.JWT_SECRET || '';

/**
 * GET /api/courses/access
 * Get user's course access status, slots, and enrollment info
 */
export async function GET(request: Request) {
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
    const courseSlug = searchParams.get('courseSlug'); // Optional: check specific course

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const userPlan = (user.subscription?.plan || 'free') as SubscriptionPlan;
    const tierConfig = TIER_CONFIGS[userPlan];
    const enrolledCourses = user.enrolledCourses || [];
    
    // Calculate current slots
    const slots = calculateEnrollmentSlots(
      userPlan, 
      enrolledCourses.map((c: { courseId: string; level: string; enrolledAt: Date; isActive: boolean }) => ({
        courseId: c.courseId,
        level: c.level as CourseLevel,
        enrolledAt: c.enrolledAt,
        isActive: c.isActive
      }))
    );

    // Get active enrollments with course details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeEnrollments = enrolledCourses.filter((c: any) => c.isActive).map((enrollment: any) => {
      const courseData = allCourses.find(c => c.slug === enrollment.courseSlug);
      return {
        ...enrollment,
        courseTitle: courseData?.title,
        courseCategory: courseData?.category,
        courseTool: courseData?.tool
      };
    });

    // If checking specific course
    let courseAccessInfo = null;
    if (courseSlug) {
      const courseData = allCourses.find(c => c.slug === courseSlug);
      if (courseData) {
        const courseLevel = getNormalizedLevel(courseData);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isEnrolled = enrolledCourses.some((c: any) => c.courseSlug === courseSlug && c.isActive);
        
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

        courseAccessInfo = {
          courseSlug,
          courseTitle: courseData.title,
          courseLevel,
          isEnrolled,
          canEnroll: enrollmentCheck.canEnroll,
          reason: enrollmentCheck.reason,
          upgradeRequired: enrollmentCheck.upgradeRequired
        };
      }
    }

    // Get all courses with access info
    const allCoursesAccess = allCourses.map(course => {
      const courseLevel = getNormalizedLevel(course);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isEnrolled = enrolledCourses.some((c: any) => c.courseSlug === course.slug && c.isActive);
      const canAccess = tierConfig.canAccessLevel(courseLevel);
      
      const enrollmentCheck = canEnrollInCourse(
        userPlan,
        courseLevel,
        enrolledCourses.map((c: { courseId: string; level: string; enrolledAt: Date; isActive: boolean }) => ({
          courseId: c.courseId,
          level: c.level as CourseLevel,
          enrolledAt: c.enrolledAt,
          isActive: c.isActive
        })),
        course.slug
      );

      return {
        slug: course.slug,
        title: course.title,
        level: courseLevel,
        isEnrolled,
        canAccessLevel: canAccess,
        canEnroll: enrollmentCheck.canEnroll,
        upgradeRequired: enrollmentCheck.upgradeRequired,
        price: course.price
      };
    });

    return NextResponse.json({
      plan: userPlan,
      planDisplayName: tierConfig.displayName,
      isUnlimited: tierConfig.limits.unlimited,
      slots,
      activeEnrollments,
      totalActiveEnrollments: activeEnrollments.length,
      courseAccessInfo,
      courses: allCoursesAccess
    });

  } catch (error) {
    console.error('Course access check error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
