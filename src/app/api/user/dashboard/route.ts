import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import CourseProgress from '@/models/CourseProgress';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import { getMongoClient } from '@/lib/database';
import { ACHIEVEMENTS, DAILY_CHALLENGES, WEEKLY_MISSIONS } from '@/models/Achievement';
import { calculateEnrollmentSlots, SubscriptionPlan, CourseLevel } from '@/lib/course-tiers';
import { getOrSet, CACHE_TTL, CACHE_KEYS } from '@/lib/redis';

const JWT_SECRET = process.env.JWT_SECRET || '';

// XP required per level (exponential curve)
const getXpForLevel = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1));

// Get a daily challenge based on date (deterministic)
const getDailyChallenge = (date: Date) => {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
};

// Get weekly mission for Pro users
const getWeeklyMission = (date: Date) => {
  const weekOfYear = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
  return WEEKLY_MISSIONS[weekOfYear % WEEKLY_MISSIONS.length];
};

const RESOURCES_BY_PLAN = {
  free: [
    { name: 'Acesso à Comunidade', available: true },
    { name: 'Cursos Introdutórios', available: true },
    { name: 'Geração de Imagens AI', available: false, limit: '0/mês' },
    { name: 'Suporte Prioritário', available: false },
    { name: 'Download de Materiais', available: false },
  ],
  starter: [
    { name: 'Acesso à Comunidade', available: true },
    { name: 'Cursos Introdutórios', available: true },
    { name: 'Geração de Imagens AI', available: true, limit: '50/mês' },
    { name: 'Suporte Prioritário', available: false },
    { name: 'Download de Materiais', available: true },
  ],
  pro: [
    { name: 'Acesso à Comunidade', available: true },
    { name: 'Todos os Cursos', available: true },
    { name: 'Geração de Imagens AI', available: true, limit: 'Ilimitado' },
    { name: 'Suporte Prioritário', available: true },
    { name: 'Download de Materiais', available: true },
    { name: 'Mentoria Mensal', available: true },
  ],
  business: [
    { name: 'Acesso à Comunidade', available: true },
    { name: 'Todos os Cursos', available: true },
    { name: 'Geração de Imagens AI', available: true, limit: 'Ilimitado' },
    { name: 'Suporte Dedicado', available: true },
    { name: 'Download de Materiais', available: true },
    { name: 'Gestão de Equipe', available: true },
    { name: 'API Access', available: true },
  ],
};

interface ProposalSelection {
    serviceSlug: string;
    unitLabel?: string;
    quantity?: number;
    unitPrice?: number;
  }

interface ProposalDoc {
    _id: unknown;
    selections?: ProposalSelection[];
    total?: number;
    status?: string;
    createdAt: string | Date;
    updatedAt: string | Date;
}

interface MappedOrder {
    _id: unknown;
    userId: string;
    items: {
        id: string;
        type: string;
        name: string;
        quantity: number;
        price: number;
        details: ProposalSelection;
    }[];
    totalAmount: number;
    status: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    isExternal: boolean;
}

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

    let decoded: { id: string; iat: number; exp: number } | string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    if (typeof decoded === 'string' || !decoded.id) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // Fetch user details
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Fetch course progress
    const progress = await CourseProgress.find({ userId }).sort({ lastAccessedAt: -1 });

    // Fetch orders from main DB
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    // Fetch proposals/orders from fayapointProdutos
    let externalOrders: MappedOrder[] = [];
    try {
      const client = await getMongoClient();
      const productsDb = client.db('fayapointProdutos');
      
      // Search by email since userId might differ
      const proposals = await productsDb.collection('service_proposals')
        .find({ email: user.email })
        .sort({ createdAt: -1 })
        .toArray();

      externalOrders = (proposals as unknown as ProposalDoc[]).map(p => ({
        _id: p._id,
        userId: userId, // map to current user
        items: p.selections?.map((s) => ({
            id: s.serviceSlug,
            type: 'service',
            name: s.unitLabel || s.serviceSlug,
            quantity: s.quantity || 1,
            price: s.unitPrice || 0,
            details: s
        })) || [],
        totalAmount: p.total || 0,
        status: p.status === 'closed' || p.status === 'converted' ? 'completed' : 'pending',
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        isExternal: true // flag for frontend
      }));
    } catch (err) {
      console.error('Error fetching external orders:', err);
      // Don't fail the whole request if secondary DB fails
    }

    const allOrders = [...orders, ...externalOrders].sort((a, b) => {
      const dateA = new Date(a.createdAt as string | number | Date).getTime();
      const dateB = new Date(b.createdAt as string | number | Date).getTime();
      return dateB - dateA;
    });

    // Determine resources based on plan
    const plan = user.subscription?.plan || 'free';
    const resources = RESOURCES_BY_PLAN[plan as keyof typeof RESOURCES_BY_PLAN] || RESOURCES_BY_PLAN.free;

    // Calculate enrollment slots based on tier
    const enrolledCourses = (user.enrolledCourses || []).map((c: { courseId: string; level: string; enrolledAt: Date; isActive: boolean }) => ({
      courseId: c.courseId,
      level: c.level as CourseLevel,
      enrolledAt: c.enrolledAt,
      isActive: c.isActive
    }));
    const enrollmentSlots = calculateEnrollmentSlots(plan as SubscriptionPlan, enrolledCourses);

    // Get today's challenge
    const today = new Date();
    const dailyChallenge = getDailyChallenge(today);
    const userDailyChallenge = user.gamification?.dailyChallenge;
    const isSameDay = userDailyChallenge?.date && 
      new Date(userDailyChallenge.date).toDateString() === today.toDateString();
    
    // Weekly mission for Pro+ users
    const weeklyMission = ['pro', 'business'].includes(plan) ? getWeeklyMission(today) : null;

    // Calculate level progress
    const currentXp = user.progress?.xp || 0;
    const currentLevel = user.progress?.level || 1;
    const xpForCurrentLevel = getXpForLevel(currentLevel);
    const xpForNextLevel = getXpForLevel(currentLevel + 1);
    const levelProgress = Math.min(100, Math.floor(((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100));

    // REDIS CACHE: Leaderboard is shared across all users (5 min TTL)
    interface LeaderboardUser {
      _id: unknown;
      name: string;
      image?: string;
      progress?: { weeklyXp?: number; level?: number };
      subscription?: { plan?: string };
    }
    
    const leaderboard = await getOrSet<LeaderboardUser[]>(
      CACHE_KEYS.LEADERBOARD,
      async () => {
        return User.find({})
          .select('name image progress.weeklyXp progress.level subscription.plan')
          .sort({ 'progress.weeklyXp': -1 })
          .limit(10)
          .lean() as Promise<LeaderboardUser[]>;
      },
      CACHE_TTL.LEADERBOARD
    );

    // Find user's rank (quick count, not cached since it's user-specific)
    const userRank = await User.countDocuments({ 'progress.weeklyXp': { $gt: user.progress?.weeklyXp || 0 } }) + 1;

    // Map achievements with unlock status
    const allAchievements = Object.values(ACHIEVEMENTS).map(achievement => {
      const userAchievement = user.gamification?.achievements?.find(
        (a: { id: string }) => a.id === achievement.id
      );
      return {
        ...achievement,
        unlocked: !!userAchievement,
        unlockedAt: userAchievement?.unlockedAt,
        progress: userAchievement?.progress || 0,
      };
    });

    // Recent activity (last 7 days of study)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = await CourseProgress.find({
      userId,
      lastAccessedAt: { $gte: sevenDaysAgo }
    }).select('courseId lastAccessedAt progressPercent').lean();

    // Generate streak calendar (last 30 days)
    const streakCalendar = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const wasActive = recentActivity.some(a => 
        new Date(a.lastAccessedAt).toISOString().split('T')[0] === dateStr
      );
      streakCalendar.push({ date: dateStr, active: wasActive });
    }

    // OPTIMIZATION: Handle daily login checkin inline (saves 1 API call)
    let dailyXpEarned = 0;
    const lastActive = user.progress?.lastActiveDate 
      ? new Date(user.progress.lastActiveDate) 
      : null;
    if (lastActive) lastActive.setHours(0, 0, 0, 0);
    
    if (!lastActive || lastActive.getTime() !== today.getTime()) {
      // First login of the day - update streak and award XP
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let newStreak = user.progress?.currentStreak || 0;
      if (lastActive && lastActive.getTime() === yesterday.getTime()) {
        newStreak += 1; // Continuing streak
      } else {
        newStreak = 1; // Streak broken or first login
      }
      
      // Calculate XP: 10 base + streak bonus (max 50)
      const streakBonus = Math.min(newStreak * 5, 50);
      dailyXpEarned = 10 + streakBonus;
      
      // Update user in background (don't await to speed up response)
      User.findByIdAndUpdate(userId, {
        $set: {
          'progress.lastActiveDate': new Date(),
          'progress.currentStreak': newStreak,
          'progress.longestStreak': Math.max(newStreak, user.progress?.longestStreak || 0),
        },
        $inc: {
          'progress.xp': dailyXpEarned,
          'progress.weeklyXp': dailyXpEarned,
        }
      }).catch(err => console.error('Daily checkin update error:', err));
    }

    return NextResponse.json({
      user,
      courses: progress,
      orders: allOrders,
      resources,
      plan,
      dailyXpEarned, // OPTIMIZATION: Return XP earned from inline checkin
      enrollmentSlots,
      enrolledCourses: user.enrolledCourses || [],
      gamification: {
        dailyChallenge: {
          ...dailyChallenge,
          completed: isSameDay ? userDailyChallenge?.completed : false,
        },
        weeklyMission,
        weeklyGoal: user.gamification?.weeklyGoal || { target: 5, current: 0, type: 'lessons' },
        streakFreeze: user.gamification?.streakFreeze || 0,
        achievements: allAchievements,
        totalAchievements: allAchievements.filter(a => a.unlocked).length,
      },
      stats: {
        level: currentLevel,
        xp: currentXp,
        xpToNextLevel: xpForNextLevel,
        levelProgress,
        streak: user.progress?.currentStreak || 0,
        longestStreak: user.progress?.longestStreak || 0,
        imagesGenerated: user.gamification?.totalImagesGenerated || 0,
        aiChats: user.gamification?.totalAiChats || 0,
      },
      leaderboard: {
        users: leaderboard.map((u, idx) => ({
          rank: idx + 1,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          id: (u as any)._id,
          name: u.name,
          image: u.image,
          weeklyXp: u.progress?.weeklyXp || 0,
          level: u.progress?.level || 1,
          plan: u.subscription?.plan || 'free',
          isCurrentUser: u._id?.toString() === userId,
        })),
        userRank,
      },
      activity: {
        streakCalendar,
        recentCourses: recentActivity.slice(0, 5),
      },
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
