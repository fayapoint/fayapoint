import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';
import { getAuthUser } from '@/lib/auth';
import {
  TIER_CONFIGS,
  SubscriptionPlan,
  calculateEnrollmentSlots,
  resolvePlan,
} from '@/lib/course-tiers';
import { allCourses } from '@/data/courses';
import { getMongoClient } from '@/lib/products';

const FREE_CHAPTER_LIMIT = 3;

type AccessLevel = 'full' | 'limited' | 'none';
type AccessReason =
  | 'subscription'
  | 'purchase'
  | 'free_preview'
  | 'not_logged_in'
  | 'admin'
  | 'enrolled';

interface AccessResponse {
  access: AccessLevel;
  freeChapters: number;
  totalChapters: number | null;
  reason: AccessReason;
  plan: SubscriptionPlan | null;
  canUpgrade: boolean;
  coursePrice: number | null;
  courseTitle: string | null;
}

/**
 * GET /api/courses/access?slug=xxx
 *
 * Returns the access level for a specific course.
 * Works for both authenticated and unauthenticated users.
 *
 * Access rules:
 * - Not logged in: limited (first 3 chapters free)
 * - Admin/Instructor: full access always
 * - Pro/Business plan: full access to all courses
 * - Starter plan: full access to enrolled courses (up to 3)
 * - Free plan: limited (first 3 chapters)
 * - Individual purchase / active enrollment: full access
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    // Try to get user identity
    const authUser = await getAuthUser();

    // ── No slug provided → return general enrollment info (for portal dashboard) ──
    if (!slug) {
      if (!authUser) {
        return NextResponse.json({
          slots: { beginner: { used: 0, limit: 0, available: 0 }, intermediate: { used: 0, limit: 0, available: 0 }, advanced: { used: 0, limit: 0, available: 0 } },
          activeEnrollments: [],
          plan: null,
        });
      }

      await dbConnect();
      const user = await User.findById(authUser.id);
      if (!user) {
        return NextResponse.json({
          slots: { beginner: { used: 0, limit: 0, available: 0 }, intermediate: { used: 0, limit: 0, available: 0 }, advanced: { used: 0, limit: 0, available: 0 } },
          activeEnrollments: [],
          plan: null,
        });
      }

      const userPlan = resolvePlan(user.subscription?.plan || 'free');
      const enrolledCourses = user.enrolledCourses || [];
      const slots = calculateEnrollmentSlots(userPlan, enrolledCourses);
      const activeEnrollments = enrolledCourses.filter(
        (c: { isActive: boolean }) => c.isActive
      );

      return NextResponse.json({
        slots,
        activeEnrollments,
        plan: userPlan,
      });
    }

    // Find course metadata
    const courseData = allCourses.find((c) => c.slug === slug);
    const coursePrice = courseData?.price ?? null;
    const courseTitle = courseData?.title ?? null;

    // ── Not logged in → free preview ──
    if (!authUser) {
      const response: AccessResponse = {
        access: 'limited',
        freeChapters: FREE_CHAPTER_LIMIT,
        totalChapters: null,
        reason: 'not_logged_in',
        plan: null,
        canUpgrade: true,
        coursePrice,
        courseTitle,
      };
      return NextResponse.json(response);
    }

    // ── Logged in: fetch user ──
    await dbConnect();
    const user = await User.findById(authUser.id);

    if (!user) {
      const response: AccessResponse = {
        access: 'limited',
        freeChapters: FREE_CHAPTER_LIMIT,
        totalChapters: null,
        reason: 'not_logged_in',
        plan: null,
        canUpgrade: true,
        coursePrice,
        courseTitle,
      };
      return NextResponse.json(response);
    }

    const userPlan = resolvePlan(user.subscription?.plan || 'free');
    const tierConfig = TIER_CONFIGS[userPlan];
    const enrolledCourses = user.enrolledCourses || [];

    // ── Admin / Instructor → full access ──
    if (user.role === 'admin' || user.role === 'instructor') {
      const response: AccessResponse = {
        access: 'full',
        freeChapters: FREE_CHAPTER_LIMIT,
        totalChapters: null,
        reason: 'admin',
        plan: userPlan,
        canUpgrade: false,
        coursePrice,
        courseTitle,
      };
      return NextResponse.json(response);
    }

    // ── Expert / Profissional plan with unlimited → full access ──
    if (tierConfig.limits.unlimited) {
      const response: AccessResponse = {
        access: 'full',
        freeChapters: FREE_CHAPTER_LIMIT,
        totalChapters: null,
        reason: 'subscription',
        plan: userPlan,
        canUpgrade: userPlan !== 'expert',
        coursePrice,
        courseTitle,
      };
      return NextResponse.json(response);
    }

    // ── Check active enrollment ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isEnrolled = enrolledCourses.some(
      (c: { courseSlug: string; isActive: boolean }) =>
        c.courseSlug === slug && c.isActive
    );

    if (isEnrolled) {
      const response: AccessResponse = {
        access: 'full',
        freeChapters: FREE_CHAPTER_LIMIT,
        totalChapters: null,
        reason: 'enrolled',
        plan: userPlan,
        canUpgrade: userPlan !== 'expert',
        coursePrice,
        courseTitle,
      };
      return NextResponse.json(response);
    }

    // ── Check individual purchase via Order ──
    let hasPurchased = false;
    try {
      const order = await Order.findOne({
        userId: authUser.id,
        status: 'completed',
        'items.id': { $regex: new RegExp(slug, 'i') },
      });
      if (order) hasPurchased = true;
    } catch {
      // ignore
    }

    // ── Check external purchases (proposals) ──
    if (!hasPurchased) {
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
        if (proposals) hasPurchased = true;
      } catch {
        // ignore
      }
    }

    if (hasPurchased) {
      const response: AccessResponse = {
        access: 'full',
        freeChapters: FREE_CHAPTER_LIMIT,
        totalChapters: null,
        reason: 'purchase',
        plan: userPlan,
        canUpgrade: userPlan !== 'expert',
        coursePrice,
        courseTitle,
      };
      return NextResponse.json(response);
    }

    // ── Starter plan with available slots (not enrolled yet) → limited ──
    // ── Free plan → limited ──
    const response: AccessResponse = {
      access: 'limited',
      freeChapters: FREE_CHAPTER_LIMIT,
      totalChapters: null,
      reason: 'free_preview',
      plan: userPlan,
      canUpgrade: true,
      coursePrice,
      courseTitle,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Course access check error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
