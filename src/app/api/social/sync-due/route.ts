import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import SocialAccount from '@/models/SocialAccount';
import SocialAnalytics from '@/models/SocialAnalytics';
import SocialPost from '@/models/SocialPost';
import { SocialPlatformFactory, type PlatformAccount } from '@/lib/platforms';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * POST /api/social/sync-due — Fase 7.1 (feedback loop do USS).
 * Cron (VPS, mesmo padrão do publish-due): sincroniza métricas das contas
 * ativas de TODOS os usuários (lastSync > 20h) e refina a persona com o
 * engajamento real — hashtags dos posts que performam viram topHashtags.
 * Auth: header x-social-secret === SOCIAL_CRON_SECRET (fallback AINEWS_SECRET).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SOCIAL_CRON_SECRET || process.env.AINEWS_SECRET;
  if (!secret || request.headers.get('x-social-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const staleBefore = new Date(Date.now() - 20 * 3600 * 1000);
    const accounts = await SocialAccount.find({
      status: 'active',
      $or: [{ lastSync: { $lt: staleBefore } }, { lastSync: { $exists: false } }],
    })
      .select('+accessToken +refreshToken')
      .limit(25); // lote por execução — cron roda de novo na próxima hora

    let synced = 0;
    let failed = 0;
    const touchedUsers = new Set<string>();

    for (const account of accounts) {
      try {
        if (!account.accessToken) { failed++; continue; }

        const platformAccount: PlatformAccount = {
          platform: account.platform,
          platformUserId: account.platformUserId,
          username: account.username,
          accessToken: account.accessToken,
          refreshToken: account.refreshToken,
          tokenExpiresAt: account.tokenExpiresAt,
        };
        const api = SocialPlatformFactory.create(platformAccount);
        const metrics = await api.getMetrics();

        account.metadata = {
          ...account.metadata,
          followerCount: metrics.followers,
          followingCount: metrics.following,
          postCount: metrics.posts,
          averageEngagement: metrics.engagementRate,
        };
        account.lastSync = new Date();
        await account.save();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await SocialAnalytics.findOneAndUpdate(
          { userId: account.userId, accountId: account._id, platform: account.platform, date: today },
          {
            $set: {
              metrics: {
                followers: metrics.followers,
                following: metrics.following,
                posts: metrics.posts,
                likes: 0, comments: 0, shares: 0, views: 0,
                reach: metrics.reach,
                impressions: metrics.impressions,
                engagementRate: metrics.engagementRate,
              },
            },
          },
          { upsert: true }
        );

        // Atualiza analytics dos posts recentes já conhecidos
        const posts = await api.getRecentPosts(20);
        for (const post of posts) {
          const engagementRate =
            post.likes + post.comments > 0 && metrics.followers > 0
              ? ((post.likes + post.comments) / metrics.followers) * 100
              : 0;
          await SocialPost.updateOne(
            { userId: account.userId, platform: account.platform, platformPostId: post.id },
            {
              $set: {
                'analytics.likes': post.likes,
                'analytics.comments': post.comments,
                'analytics.shares': post.shares || 0,
                'analytics.reach': post.reach || 0,
                'analytics.engagementRate': engagementRate,
              },
            }
          );
        }

        touchedUsers.add(String(account.userId));
        synced++;
      } catch (e) {
        console.error(`[sync-due] ${account.platform}/${account.username}:`, e instanceof Error ? e.message : e);
        failed++;
      }
    }

    // ── Refino de persona pelo engajamento (o "loop" do feedback loop) ──
    let refined = 0;
    for (const userId of touchedUsers) {
      try {
        const topPosts = await SocialPost.find({
          userId,
          status: 'published',
          publishedAt: { $gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
          'analytics.engagementRate': { $gt: 0 },
        })
          .sort({ 'analytics.engagementRate': -1 })
          .limit(10)
          .select('hashtags analytics.engagementRate');

        if (!topPosts.length) continue;

        const weight: Record<string, number> = {};
        for (const p of topPosts) {
          for (const h of p.hashtags || []) {
            const tag = String(h).replace(/^#/, '').toLowerCase();
            if (!tag) continue;
            weight[tag] = (weight[tag] || 0) + (p.analytics?.engagementRate || 0);
          }
        }
        const provenHashtags = Object.entries(weight)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([tag]) => tag);

        if (provenHashtags.length) {
          await User.updateOne(
            { _id: userId },
            {
              $set: {
                'socialPersona.topHashtags': provenHashtags,
                'socialPersona.lastAnalyzed': new Date(),
              },
            }
          );
          refined++;
        }
      } catch (e) {
        console.error(`[sync-due] refino persona ${userId}:`, e instanceof Error ? e.message : e);
      }
    }

    return NextResponse.json({
      success: true,
      accounts: { total: accounts.length, synced, failed },
      personasRefinadas: refined,
    });
  } catch (error) {
    console.error('[sync-due]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
