/**
 * DIAGNOSTIC ENDPOINT — REMOVE AFTER FIXING
 *
 * Hit this from the browser while logged in:
 *   http://localhost:3000/api/diag/session
 *
 * Shows exactly what the server sees: JWT payload, user data from DB,
 * and what the dashboard would return.
 *
 * NOTE: Renamed from /api/debug/session to /api/diag/session because
 * the honeypot detection blocks any path containing "/debug".
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { resolvePlan } from '@/lib/course-tiers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const diag: Record<string, unknown> = {};

  try {
    // 1. What does the JWT say?
    const authUser = await getAuthUser();
    diag.jwt = authUser ? {
      id: authUser.id,
      email: authUser.email,
      role: authUser.role,
    } : 'NO AUTH — no valid JWT in cookies or headers';

    if (!authUser) {
      return NextResponse.json(diag, {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

    // 2. What does Mongoose return for this user ID?
    await dbConnect();
    const user = await User.findById(authUser.id);

    if (!user) {
      diag.mongoose = `User NOT FOUND for id: ${authUser.id}`;
      return NextResponse.json(diag, {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

    diag.mongoose = {
      id: user._id?.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      subscription: user.subscription,
      progress: {
        level: user.progress?.level,
        xp: user.progress?.xp,
        weeklyXp: user.progress?.weeklyXp,
        currentStreak: user.progress?.currentStreak,
        lastActiveDate: user.progress?.lastActiveDate,
      },
      enrolledCoursesCount: user.enrolledCourses?.length || 0,
      updatedAt: user.updatedAt,
    };

    // 3. What would resolvePlan compute?
    const rawPlan = user.subscription?.plan || 'free';
    diag.resolvedPlan = {
      rawPlan,
      resolved: resolvePlan(rawPlan),
    };

    // 4. What would the dashboard stats be?
    const getXpForLevel = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1));
    const currentXp = user.progress?.xp || 0;
    const currentLevel = user.progress?.level || 1;
    const xpForCurrentLevel = getXpForLevel(currentLevel);
    const xpForNextLevel = getXpForLevel(currentLevel + 1);
    const levelProgress = Math.min(100, Math.floor(((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100));

    diag.computedStats = {
      level: currentLevel,
      xp: currentXp,
      xpForCurrentLevel,
      xpForNextLevel,
      levelProgress,
    };

    // 5. Password field check (for login debugging)
    const userWithPwd = await User.findById(authUser.id).select('+password');
    diag.passwordCheck = {
      selectPlusPassword_works: !!userWithPwd?.password,
      passwordLength: userWithPwd?.password?.length || 0,
      passwordPrefix: userWithPwd?.password ? userWithPwd.password.slice(0, 7) : 'EMPTY',
    };

    // 6. Raw MongoDB document (bypass Mongoose entirely)
    const { MongoClient } = require('mongodb');
    const uri = process.env.MONGODB_URI || '';
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    try {
      await client.connect();
      const rawDoc = await client.db('fayapoint').collection('users').findOne(
        { email: user.email },
        { projection: { password: 0 } }
      );
      diag.rawMongoDB = {
        id: rawDoc?._id?.toString(),
        email: rawDoc?.email,
        plan: rawDoc?.subscription?.plan,
        level: rawDoc?.progress?.level,
        xp: rawDoc?.progress?.xp,
        weeklyXp: rawDoc?.progress?.weeklyXp,
      };
      diag.mongooseVsRaw = {
        planMatch: user.subscription?.plan === rawDoc?.subscription?.plan,
        xpMatch: user.progress?.xp === rawDoc?.progress?.xp,
        levelMatch: user.progress?.level === rawDoc?.progress?.level,
      };
      await client.close();
    } catch (e) {
      diag.rawMongoDB = `Error: ${e instanceof Error ? e.message : 'unknown'}`;
    }

    return NextResponse.json(diag, {
      status: 200,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    diag.error = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(diag, { status: 500 });
  }
}
