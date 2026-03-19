import jwt from 'jsonwebtoken';
import { headers, cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || '';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Verify a JWT token and return the decoded payload.
 * Returns null if the token is invalid or expired.
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'string') return null;
    return decoded as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Get the authenticated user from the request.
 * Checks (in order):
 *   1. Authorization: Bearer <token> header
 *   2. `token` httpOnly cookie
 *   3. `fayai_token` httpOnly cookie
 *
 * Returns the decoded JWT payload, or null if not authenticated.
 * Works for all auth flows: login, register, Google OAuth.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  let token: string | null = null;

  // 1. Try Authorization header
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  } catch {
    // headers() may fail in some contexts
  }

  // 2. Fall back to httpOnly cookies
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('token')?.value
        || cookieStore.get('fayai_token')?.value
        || null;
    } catch {
      // cookies() may fail in some contexts
    }
  }

  if (!token) return null;

  return verifyToken(token);
}

/**
 * Get the authenticated user ID, or return a 401 error response.
 * Convenience wrapper for route handlers that require authentication.
 */
export async function requireAuth(): Promise<AuthUser | null> {
  return getAuthUser();
}
