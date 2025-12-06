import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import { ACHIEVEMENTS } from '@/models/Achievement';

const JWT_SECRET = process.env.JWT_SECRET || '';

// XP rewards
const XP_REWARDS = {
  dailyLogin: 10,
  lessonComplete: 25,
  courseComplete: 200,
  achievementUnlock: 50,
  dailyChallengeComplete: 0, // Uses challenge reward
  streakBonus: (streak: number) => Math.min(streak * 5, 50), // Max 50 XP bonus
};

// Calculate level from XP
const getLevelFromXp = (xp: number): number => {
  let level = 1;
  let xpRequired = 100;
  while (xp >= xpRequired) {
    level++;
    xpRequired = Math.floor(100 * Math.pow(1.5, level - 1));
  }
  return level;
};

// Check and unlock achievements
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const checkAchievements = (user: any): { id: string; xpReward: number }[] => {
  const newAchievements: { id: string; xpReward: number }[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingIds = user.gamification?.achievements?.map((a: any) => a.id) || [];

  for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
    if (existingIds.includes(id)) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { requirement, xpReward } = achievement as any;
    let unlocked = false;

    switch (requirement.type) {
      case 'current_streak':
        unlocked = (user.progress?.currentStreak || 0) >= requirement.value;
        break;
      case 'courses_completed':
        unlocked = (user.progress?.coursesCompleted || 0) >= requirement.value;
        break;
      case 'total_hours':
        unlocked = (user.progress?.totalHours || 0) >= requirement.value;
        break;
      case 'images_generated':
        unlocked = (user.gamification?.totalImagesGenerated || 0) >= requirement.value;
        break;
      case 'ai_chats':
        unlocked = (user.gamification?.totalAiChats || 0) >= requirement.value;
        break;
      case 'level':
        unlocked = (user.progress?.level || 1) >= requirement.value;
        break;
      case 'total_xp':
        unlocked = (user.progress?.xp || 0) >= requirement.value;
        break;
      case 'referrals':
        unlocked = (user.gamification?.referrals || 0) >= requirement.value;
        break;
    }

    if (unlocked) {
      newAchievements.push({ id, xpReward });
    }
  }

  return newAchievements;
};

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Verify authentication
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
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

    // Get action type from body
    const body = await request.json();
    const { action, data } = body;

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActive = user.progress?.lastActiveDate 
      ? new Date(user.progress.lastActiveDate) 
      : null;
    lastActive?.setHours(0, 0, 0, 0);

    let xpEarned = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {};
    const newAchievements: { id: string; xpReward: number }[] = [];

    switch (action) {
      case 'daily_login': {
        // Check if already logged in today
        if (!lastActive || lastActive.getTime() !== today.getTime()) {
          // Update streak
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          let newStreak = user.progress?.currentStreak || 0;
          
          if (lastActive && lastActive.getTime() === yesterday.getTime()) {
            // Continuing streak
            newStreak += 1;
          } else if (!lastActive || lastActive.getTime() < yesterday.getTime()) {
            // Streak broken or first login
            if (user.gamification?.streakFreeze > 0 && lastActive) {
              // Use streak freeze
              updates['$inc'] = { ...updates['$inc'], 'gamification.streakFreeze': -1 };
            } else {
              newStreak = 1;
            }
          }

          // Calculate streak bonus
          const streakBonus = XP_REWARDS.streakBonus(newStreak);
          xpEarned = XP_REWARDS.dailyLogin + streakBonus;

          updates['$set'] = {
            ...updates['$set'],
            'progress.lastActiveDate': new Date(),
            'progress.currentStreak': newStreak,
            'progress.longestStreak': Math.max(newStreak, user.progress?.longestStreak || 0),
          };
        }
        break;
      }

      case 'lesson_complete': {
        xpEarned = XP_REWARDS.lessonComplete;
        updates['$inc'] = {
          ...updates['$inc'],
          'gamification.weeklyGoal.current': 1,
        };
        break;
      }

      case 'course_complete': {
        xpEarned = XP_REWARDS.courseComplete;
        updates['$inc'] = {
          ...updates['$inc'],
          'progress.coursesCompleted': 1,
        };
        break;
      }

      case 'challenge_complete': {
        const reward = data?.reward || 25;
        xpEarned = reward;
        updates['$set'] = {
          ...updates['$set'],
          'gamification.dailyChallenge.completed': true,
        };
        break;
      }

      case 'image_generated': {
        updates['$inc'] = {
          ...updates['$inc'],
          'gamification.totalImagesGenerated': 1,
        };
        break;
      }

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    // Add XP
    if (xpEarned > 0) {
      const newXp = (user.progress?.xp || 0) + xpEarned;
      const newLevel = getLevelFromXp(newXp);
      const currentLevel = user.progress?.level || 1;

      updates['$inc'] = {
        ...updates['$inc'],
        'progress.xp': xpEarned,
        'progress.points': xpEarned,
        'progress.weeklyXp': xpEarned,
        'progress.monthlyXp': xpEarned,
      };

      // Level up
      if (newLevel > currentLevel) {
        updates['$set'] = {
          ...updates['$set'],
          'progress.level': newLevel,
          'progress.xpToNextLevel': Math.floor(100 * Math.pow(1.5, newLevel)),
        };
      }
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(userId, updates);
    }

    // Check for new achievements after update
    const updatedUser = await User.findById(userId);
    const unlockedAchievements = checkAchievements(updatedUser);

    // Unlock achievements
    if (unlockedAchievements.length > 0) {
      const achievementUpdates = unlockedAchievements.map(a => ({
        id: a.id,
        unlockedAt: new Date(),
      }));

      const achievementXp = unlockedAchievements.reduce((sum, a) => sum + a.xpReward, 0);

      await User.findByIdAndUpdate(userId, {
        $push: { 'gamification.achievements': { $each: achievementUpdates } },
        $inc: { 
          'progress.xp': achievementXp,
          'progress.points': achievementXp,
          'progress.weeklyXp': achievementXp,
          'progress.monthlyXp': achievementXp,
        },
      });

      xpEarned += achievementXp;
      newAchievements.push(...unlockedAchievements);
    }

    return NextResponse.json({
      success: true,
      xpEarned,
      newAchievements,
      streak: updates['$set']?.['progress.currentStreak'] || user.progress?.currentStreak,
    });

  } catch (error) {
    console.error('Checkin error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
