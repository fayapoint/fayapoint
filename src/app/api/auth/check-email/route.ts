import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

/**
 * GET /api/auth/check-email?email=user@example.com
 * Check if an email is already registered (for onboarding)
 * Returns only a boolean, not user data (for security)
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('_id');

    return NextResponse.json({
      exists: !!user
    });

  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { error: 'Failed to check email' },
      { status: 500 }
    );
  }
}
