import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import SocialPost from '@/models/SocialPost';
import SocialAccount from '@/models/SocialAccount';

// =============================================================================
// GET - List user's social posts
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    await dbConnect();
    const userId = authUser.id;

    const filter: Record<string, unknown> = { userId };
    if (status) filter.status = status;
    if (platform) filter.platform = platform;

    const [posts, total] = await Promise.all([
      SocialPost.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SocialPost.countDocuments(filter),
    ]);

    return NextResponse.json({
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Social Posts] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// POST - Create a new social post
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId, content, mediaUrls, mediaType, hashtags, scheduledFor, status } = body;

    if (!accountId || !content) {
      return NextResponse.json({ error: 'accountId and content are required' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Content must be under 5000 characters' }, { status: 400 });
    }

    await dbConnect();
    const userId = authUser.id;

    // Verify account belongs to user
    const account = await SocialAccount.findOne({ _id: accountId, userId });
    if (!account) {
      return NextResponse.json({ error: 'Social account not found' }, { status: 404 });
    }

    const post = new SocialPost({
      userId,
      accountId,
      platform: account.platform,
      content,
      mediaUrls: mediaUrls || [],
      mediaType: mediaType || 'text',
      hashtags: hashtags || [],
      status: status || (scheduledFor ? 'scheduled' : 'draft'),
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      aiGenerated: body.aiGenerated || false,
      aiModel: body.aiModel,
      aiCost: body.aiCost,
    });

    await post.save();

    return NextResponse.json({ success: true, post: post.toObject() }, { status: 201 });
  } catch (error) {
    console.error('[Social Posts] POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// PUT - Update a post
// =============================================================================

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId, ...updates } = body;

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    await dbConnect();
    const post = await SocialPost.findOne({ _id: postId, userId: authUser.id });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Only allow editing drafts and scheduled posts
    if (!['draft', 'scheduled', 'suggested'].includes(post.status)) {
      return NextResponse.json(
        { error: `Cannot edit post with status: ${post.status}` },
        { status: 400 }
      );
    }

    const allowedFields = ['content', 'mediaUrls', 'mediaType', 'hashtags', 'scheduledFor', 'status'];
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        (post as any)[key] = key === 'scheduledFor' && updates[key] ? new Date(updates[key]) : updates[key];
      }
    }

    await post.save();

    return NextResponse.json({ success: true, post: post.toObject() });
  } catch (error) {
    console.error('[Social Posts] PUT Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// DELETE - Delete a post
// =============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    if (!postId) {
      return NextResponse.json({ error: 'Post id required' }, { status: 400 });
    }

    await dbConnect();
    const post = await SocialPost.findOneAndDelete({ _id: postId, userId: authUser.id });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: postId });
  } catch (error) {
    console.error('[Social Posts] DELETE Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
