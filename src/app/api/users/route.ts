import { NextRequest, NextResponse } from 'next/server';
import { upsertUser } from '@/lib/users';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || '';

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
    const body = await request.json();
    const { name, email, source } = body;
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
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
