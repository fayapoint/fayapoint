import { NextRequest, NextResponse } from 'next/server';
import { upsertUser } from '@/lib/users';
import { getClientIpFromRequest, rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/users - REMOVED for security
 * User data should not be publicly queryable
 * Use /api/auth/check-email for email existence check
 * Use /api/user/dashboard for authenticated user data
 */
export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint has been deprecated for security. Use /api/auth/check-email or /api/user/dashboard instead.' },
    { status: 410 }
  );
}

/**
 * POST /api/users - Create or update user
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromRequest(request);
    const ua = request.headers.get('user-agent') ?? '';
    const origin = request.headers.get('origin') ?? '';

    if (!ua || /bot|crawler|spider|headless/i.test(ua)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rl = await rateLimit({
      key: `ratelimit:users:ip:${ip}`,
      limit: 25,
      windowSeconds: 60 * 60,
    });

    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.resetSeconds) },
        }
      );
    }

    const body = await request.json();
    const { name, email, source } = body;
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    if (origin) {
      const allowedOrigin =
        origin.includes('fayai.shop') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('.netlify.app');

      if (!allowedOrigin) {
        return NextResponse.json(
          { error: 'Invalid origin' },
          { status: 403 }
        );
      }
    }
    
    // Pass the entire body to upsertUser, allowing it to handle all profile fields
    const user = await upsertUser({
      ...body,
      source: source || 'onboarding',
    });
    
    return NextResponse.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    );
  }
}
