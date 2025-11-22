import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, upsertUser } from '@/lib/users';

/**
 * GET /api/users?email=user@example.com - Get user by email
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }
    
    const user = await getUserByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { exists: false, user: null },
        { status: 200 }
      );
    }
    
    return NextResponse.json({
      exists: true,
      user
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
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
