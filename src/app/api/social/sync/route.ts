import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import SocialAccount from '@/models/SocialAccount';
import SocialAnalytics from '@/models/SocialAnalytics';
import SocialPost from '@/models/SocialPost';
import { SocialPlatformFactory, type PlatformAccount } from '@/lib/platforms';

// =============================================================================
// POST - Sync metrics and posts from connected platform accounts
// Accepts optional { platform?: string, accountId?: string } to sync specific account
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { platform, accountId } = body as { platform?: string; accountId?: string };

    await dbConnect();
    const userId = authUser.id;

    // Build query for accounts to sync
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { userId, status: 'active' };
    if (accountId) query._id = accountId;
    if (platform) query.platform = platform;

    // Need accessToken to actually call the API
    const accounts = await SocialAccount.find(query).select('+accessToken +refreshToken');

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'No active accounts found to sync' }, { status: 404 });
    }

    const results: Array<{
      platform: string;
      username: string;
      success: boolean;
      metrics?: Record<string, number>;
      postsCount?: number;
      error?: string;
    }> = [];

    for (const account of accounts) {
      try {
        if (!account.accessToken) {
          results.push({
            platform: account.platform,
            username: account.username,
            success: false,
            error: 'No access token configured',
          });
          continue;
        }

        // Build PlatformAccount for the factory
        const platformAccount: PlatformAccount = {
          platform: account.platform,
          platformUserId: account.platformUserId,
          username: account.username,
          accessToken: account.accessToken,
          refreshToken: account.refreshToken,
          tokenExpiresAt: account.tokenExpiresAt,
        };

        const api = SocialPlatformFactory.create(platformAccount);

        // Fetch metrics
        const metrics = await api.getMetrics();

        // Update account metadata
        account.metadata = {
          ...account.metadata,
          followerCount: metrics.followers,
          followingCount: metrics.following,
          postCount: metrics.posts,
          averageEngagement: metrics.engagementRate,
        };
        account.lastSync = new Date();
        await account.save();

        // Store daily analytics snapshot
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await SocialAnalytics.findOneAndUpdate(
          { userId, accountId: account._id, platform: account.platform, date: today },
          {
            $set: {
              metrics: {
                followers: metrics.followers,
                following: metrics.following,
                posts: metrics.posts,
                likes: 0,
                comments: 0,
                shares: 0,
                views: 0,
                reach: metrics.reach,
                impressions: metrics.impressions,
                engagementRate: metrics.engagementRate,
              },
            },
          },
          { upsert: true }
        );

        // Fetch and store recent posts
        const posts = await api.getRecentPosts(20);
        let newPostsCount = 0;

        for (const post of posts) {
          const existing = await SocialPost.findOne({
            userId,
            platform: account.platform,
            platformPostId: post.id,
          });

          if (existing) {
            // Update analytics on existing posts
            existing.analytics = {
              likes: post.likes,
              comments: post.comments,
              shares: post.shares || 0,
              reach: post.reach || 0,
              impressions: 0,
              clicks: 0,
              saves: 0,
              engagementRate:
                post.likes + post.comments > 0 && metrics.followers > 0
                  ? ((post.likes + post.comments) / metrics.followers) * 100
                  : 0,
            };
            await existing.save();
          } else {
            await SocialPost.create({
              userId,
              accountId: account._id,
              platform: account.platform,
              content: post.caption || '',
              mediaUrls: post.url ? [post.url] : [],
              mediaType: post.type === 'video' ? 'video' : post.type === 'carousel' ? 'carousel' : 'image',
              status: 'published',
              publishedAt: post.timestamp ? new Date(post.timestamp) : new Date(),
              platformPostId: post.id,
              analytics: {
                likes: post.likes,
                comments: post.comments,
                shares: post.shares || 0,
                reach: post.reach || 0,
                impressions: 0,
                clicks: 0,
                saves: 0,
                engagementRate:
                  post.likes + post.comments > 0 && metrics.followers > 0
                    ? ((post.likes + post.comments) / metrics.followers) * 100
                    : 0,
              },
            });
            newPostsCount++;
          }
        }

        results.push({
          platform: account.platform,
          username: account.username,
          success: true,
          metrics: {
            followers: metrics.followers,
            following: metrics.following,
            posts: metrics.posts,
          },
          postsCount: newPostsCount,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Social Sync] Error syncing ${account.platform}/${account.username}:`, message);

        // Mark account as errored
        account.status = 'error';
        await account.save();

        results.push({
          platform: account.platform,
          username: account.username,
          success: false,
          error: message,
        });
      }
    }

    const synced = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: { total: results.length, synced, failed },
      results,
    });
  } catch (error) {
    console.error('[Social Sync] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
