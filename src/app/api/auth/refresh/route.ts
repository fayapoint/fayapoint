import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || '';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/refresh
 * Re-issues the session cookies from any still-valid credential (httpOnly
 * cookie OR Authorization: Bearer from localStorage). This is the recovery
 * path that heals "ghost logouts": when the cookie is lost/blocked but the
 * client still holds a valid token, the session is restored server-side
 * instead of forcing a re-login.
 *
 * Returns { user } on success, 401 when no valid credential exists.
 */
export async function POST() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(authUser.id).select('-password -savedCards');
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Sliding renewal: fresh 7-day token on every successful refresh
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userObject: any = user.toObject();
    if (userObject.billing) {
      delete userObject.billing.asaasCustomerId;
    }

    const response = NextResponse.json({ token, user: userObject });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    };

    response.cookies.set('token', token, cookieOptions);
    response.cookies.set('fayai_token', token, cookieOptions);

    return response;
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
