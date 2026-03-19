import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Clears the httpOnly authentication cookie.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear the httpOnly token cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  });

  // Also clear fayai_token if it was set as a cookie
  response.cookies.set('fayai_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
