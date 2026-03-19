import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import SocialAccount from '@/models/SocialAccount';

function requireProPlan(user: any): NextResponse | null {
  const plan = user?.subscription?.plan;
  if (!plan || !['pro', 'business', 'profissional', 'expert'].includes(plan)) {
    return NextResponse.json(
      { error: 'Social media features require Pro or Business plan' },
      { status: 403 }
    );
  }
  return null;
}

// =============================================================================
// GET - List user's connected social accounts
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planError = requireProPlan(user);
    if (planError) return planError;

    const accounts = await SocialAccount.find({ userId: (user as any)._id })
      .sort({ platform: 1 })
      .lean();

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('[Social Accounts] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// POST - Connect a new social account
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planError = requireProPlan(user);
    if (planError) return planError;

    const body = await request.json();
    const { platform, platformUserId, username, profileUrl, accessToken, refreshToken, tokenExpiresAt } = body;

    if (!platform || !platformUserId || !username) {
      return NextResponse.json(
        { error: 'platform, platformUserId, and username are required' },
        { status: 400 }
      );
    }

    const validPlatforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ error: `Invalid platform: ${platform}` }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (user as any)._id;

    // Check if account already exists for this platform
    const existing = await SocialAccount.findOne({ userId, platform });
    if (existing) {
      // Update existing
      existing.platformUserId = platformUserId;
      existing.username = username;
      existing.profileUrl = profileUrl || existing.profileUrl;
      if (accessToken) existing.accessToken = accessToken;
      if (refreshToken) existing.refreshToken = refreshToken;
      if (tokenExpiresAt) existing.tokenExpiresAt = new Date(tokenExpiresAt);
      existing.status = 'active';
      existing.isActive = true;
      await existing.save();

      return NextResponse.json({ success: true, account: existing.toObject(), updated: true });
    }

    const account = new SocialAccount({
      userId,
      platform,
      platformUserId,
      username,
      profileUrl: profileUrl || '',
      accessToken,
      refreshToken,
      tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : undefined,
      status: accessToken ? 'active' : 'pending',
    });

    await account.save();

    return NextResponse.json({ success: true, account: account.toObject() }, { status: 201 });
  } catch (error) {
    console.error('[Social Accounts] POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// DELETE - Disconnect a social account
// =============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');
    if (!accountId) {
      return NextResponse.json({ error: 'Account id required' }, { status: 400 });
    }

    await dbConnect();
    const account = await SocialAccount.findOneAndDelete({
      _id: accountId,
      userId: authUser.id,
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: accountId });
  } catch (error) {
    console.error('[Social Accounts] DELETE Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
