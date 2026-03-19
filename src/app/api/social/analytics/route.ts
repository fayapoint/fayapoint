import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import SocialAccount from '@/models/SocialAccount';
import SocialPost from '@/models/SocialPost';
import SocialAnalytics from '@/models/SocialAnalytics';

// =============================================================================
// GET - Social analytics overview
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const days = parseInt(searchParams.get('days') || '30');

    await dbConnect();
    const userId = authUser.id;

    // Get all connected accounts
    const accountFilter: Record<string, unknown> = { userId, isActive: true };
    if (platform) accountFilter.platform = platform;
    const accounts = await SocialAccount.find(accountFilter).lean();

    // Aggregate post metrics
    const since = new Date();
    since.setDate(since.getDate() - days);

    const postFilter: Record<string, unknown> = {
      userId,
      publishedAt: { $gte: since },
    };
    if (platform) postFilter.platform = platform;

    const [postStats, recentPosts, snapshots] = await Promise.all([
      SocialPost.aggregate([
        { $match: postFilter },
        {
          $group: {
            _id: '$platform',
            totalPosts: { $sum: 1 },
            totalLikes: { $sum: '$analytics.likes' },
            totalComments: { $sum: '$analytics.comments' },
            totalShares: { $sum: '$analytics.shares' },
            totalReach: { $sum: '$analytics.reach' },
            totalImpressions: { $sum: '$analytics.impressions' },
            avgEngagement: { $avg: '$analytics.engagementRate' },
          },
        },
      ]),
      SocialPost.find({ userId, status: 'published' })
        .sort({ 'analytics.engagementRate': -1 })
        .limit(5)
        .lean(),
      SocialAnalytics.find({
        userId,
        date: { $gte: since },
        ...(platform ? { platform } : {}),
      })
        .sort({ date: -1 })
        .limit(days)
        .lean(),
    ]);

    // Build summary
    const totals = {
      accounts: accounts.length,
      totalFollowers: accounts.reduce((sum, a) => sum + (a.metadata?.followerCount || 0), 0),
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalReach: 0,
      avgEngagement: 0,
    };

    for (const stat of postStats) {
      totals.totalPosts += stat.totalPosts;
      totals.totalLikes += stat.totalLikes;
      totals.totalComments += stat.totalComments;
      totals.totalShares += stat.totalShares;
      totals.totalReach += stat.totalReach;
      totals.avgEngagement += stat.avgEngagement;
    }
    if (postStats.length > 0) {
      totals.avgEngagement /= postStats.length;
    }

    return NextResponse.json({
      totals,
      byPlatform: postStats,
      accounts: accounts.map((a) => ({
        _id: a._id,
        platform: a.platform,
        username: a.username,
        followers: a.metadata?.followerCount || 0,
        status: a.status,
        lastSync: a.lastSync,
      })),
      topPosts: recentPosts,
      history: snapshots,
      period: { days, since: since.toISOString() },
    });
  } catch (error) {
    console.error('[Social Analytics] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
