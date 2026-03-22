/**
 * DEBUG ENDPOINT — REMOVE AFTER FIXING
 *
 * Hit this from the browser while logged in:
 *   http://localhost:3000/api/debug/session
 *
 * Shows exactly what the server sees: JWT payload, user data from DB,
 * and what the dashboard would return.
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { resolvePlan } from '@/lib/course-tiers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const debug: Record<string, unknown> = {};

  try {
    // 1. What does the JWT say?
    const authUser = await getAuthUser();
    debug.jwt = authUser ? {
      id: authUser.id,
      email: authUser.email,
      role: authUser.role,
    } : 'NO AUTH — no valid JWT in cookies or headers';

    if (!authUser) {
      return NextResponse.json(debug, {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

    // 2. What does Mongoose return for this user ID?
    await dbConnect();
    const user = await User.findById(authUser.id);

    if (!user) {
      debug.mongoose = `User NOT FOUND for id: ${authUser.id}`;
      return NextResponse.json(debug, {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

    debug.mongoose = {
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
    debug.resolvedPlan = {
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

    debug.computedStats = {
      level: currentLevel,
      xp: currentXp,
      xpForCurrentLevel,
      xpForNextLevel,
      levelProgress,
    };

    // 5. Raw MongoDB document (bypass Mongoose entirely)
    const { MongoClient } = require('mongodb');
    const uri = process.env.MONGODB_URI || '';
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    try {
      await client.connect();
      const rawDoc = await client.db('fayapoint').collection('users').findOne(
        { email: user.email },
        { projection: { password: 0 } }
      );
      debug.rawMongoDB = {
        id: rawDoc?._id?.toString(),
        email: rawDoc?.email,
        plan: rawDoc?.subscription?.plan,
        level: rawDoc?.progress?.level,
        xp: rawDoc?.progress?.xp,
        weeklyXp: rawDoc?.progress?.weeklyXp,
      };
      debug.mongooseVsRaw = {
        planMatch: user.subscription?.plan === rawDoc?.subscription?.plan,
        xpMatch: user.progress?.xp === rawDoc?.progress?.xp,
        levelMatch: user.progress?.level === rawDoc?.progress?.level,
      };
      await client.close();
    } catch (e) {
      debug.rawMongoDB = `Error: ${e instanceof Error ? e.message : 'unknown'}`;
    }

    return NextResponse.json(debug, {
      status: 200,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    debug.error = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(debug, { status: 500 });
  }
}
