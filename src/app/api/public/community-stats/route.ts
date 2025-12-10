import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ImageCreation from '@/models/ImageCreation';
import { getOrSet, CACHE_TTL, CACHE_KEYS } from '@/lib/redis';

// OPTIMIZATION: Force dynamic to avoid build-time static generation containing secrets (Cloudinary URLs)
export const dynamic = "force-dynamic";

interface CommunityStats {
  totalCreations: number;
  uniqueCreators: number;
  todayCreations: number;
  topCreators: Array<{
    _id: string;
    userName: string;
    count: number;
    latestImage: string;
  }>;
}

async function fetchCommunityStats(): Promise<CommunityStats> {
  await dbConnect();
  
  // Get total creations
  const totalCreations = await ImageCreation.countDocuments();
  
  // Get unique creators count
  const uniqueCreators = await ImageCreation.distinct('userId');
  
  // Get today's creations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCreations = await ImageCreation.countDocuments({
    createdAt: { $gte: today }
  });

  // Get top creators (most creations)
  const topCreators = await ImageCreation.aggregate([
    {
      $group: {
        _id: '$userId',
        userName: { $first: '$userName' },
        count: { $sum: 1 },
        latestImage: { $last: '$imageUrl' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 6 }
  ]);

  return {
    totalCreations,
    uniqueCreators: uniqueCreators.length,
    todayCreations,
    topCreators
  };
}

export async function GET() {
  try {
    // REDIS CACHE: 5 minutes TTL
    const stats = await getOrSet<CommunityStats>(
      CACHE_KEYS.COMMUNITY_STATS,
      fetchCommunityStats,
      CACHE_TTL.COMMUNITY_STATS
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching community stats:', error);
    return NextResponse.json({ error: 'Error loading stats' }, { status: 500 });
  }
}
