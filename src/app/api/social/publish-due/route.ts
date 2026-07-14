import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SocialPost from '@/models/SocialPost';
import SocialAccount from '@/models/SocialAccount';
import { publishSocialPost } from '@/lib/social-publisher';

const MAX_PER_RUN = 10;

/**
 * POST /api/social/publish-due — worker de agendamento do USS.
 * Publica todos os posts `scheduled` com `scheduledFor <= agora`.
 * Auth: header x-social-secret === env SOCIAL_CRON_SECRET (fallback AINEWS_SECRET,
 * mesmo padrão do cron de notícias na VPS).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SOCIAL_CRON_SECRET || process.env.AINEWS_SECRET;
  if (!secret || request.headers.get('x-social-secret') !== secret) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    await dbConnect();

    const due = await SocialPost.find({
      status: 'scheduled',
      scheduledFor: { $lte: new Date() },
    })
      .sort({ scheduledFor: 1 })
      .limit(MAX_PER_RUN);

    const results: { id: string; ok: boolean; error?: string }[] = [];

    for (const post of due) {
      const account = await SocialAccount.findOne({
        _id: post.accountId,
        isActive: true,
      }).select('+accessToken');

      if (!account) {
        post.status = 'failed';
        await post.save();
        results.push({ id: String(post._id), ok: false, error: 'conta desconectada' });
        continue;
      }

      const result = await publishSocialPost(account, post);
      if (result.ok) {
        post.status = 'published';
        post.publishedAt = new Date();
        post.platformPostId = result.platformPostId;
      } else {
        post.status = 'failed';
      }
      await post.save();
      results.push({ id: String(post._id), ok: result.ok, error: result.error });
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    console.error('[Social Publish-Due] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
