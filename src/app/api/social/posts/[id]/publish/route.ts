import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import SocialPost from '@/models/SocialPost';
import SocialAccount from '@/models/SocialAccount';
import { publishSocialPost } from '@/lib/social-publisher';

/**
 * POST /api/social/posts/[id]/publish — publica AGORA um post do usuário
 * (draft, scheduled ou failed) na plataforma da conta conectada.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const post = await SocialPost.findOne({ _id: id, userId: authUser.id });
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }
    if (post.status === 'published') {
      return NextResponse.json({ error: 'Este post já foi publicado' }, { status: 409 });
    }

    const account = await SocialAccount.findOne({
      _id: post.accountId,
      userId: authUser.id,
      isActive: true,
    }).select('+accessToken');
    if (!account) {
      return NextResponse.json({ error: 'Conta social não encontrada ou desconectada' }, { status: 404 });
    }

    const result = await publishSocialPost(account, post);

    if (result.ok) {
      post.status = 'published';
      post.publishedAt = new Date();
      post.platformPostId = result.platformPostId;
      await post.save();
      return NextResponse.json({ published: true, platformPostId: result.platformPostId, post });
    }

    post.status = 'failed';
    await post.save();
    return NextResponse.json({ published: false, error: result.error }, { status: 502 });
  } catch (error) {
    console.error('[Social Publish] Error:', error);
    return NextResponse.json({ error: 'Erro interno ao publicar' }, { status: 500 });
  }
}
