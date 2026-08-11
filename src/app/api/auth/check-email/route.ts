import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { rateLimit, getClientIpFromRequest } from '@/lib/rate-limit';
import { filtroPorQualquerEmail } from '@/lib/identidade';

/**
 * GET /api/auth/check-email?email=user@example.com
 * Check if an email is already registered (for onboarding).
 * Rate-limited to prevent email enumeration attacks.
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: 20 checks per 10 minutes per IP
    const ip = getClientIpFromRequest(request);
    const rl = await rateLimit({
      key: `check-email:${ip}`,
      limit: 20,
      windowSeconds: 600,
    });

    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde alguns minutos.' },
        { status: 429 }
      );
    }

    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Mesma regra do cadastro: em uso = posse provada (principal ou
    // verificado). E-mail apenas listado como contato por alguém não ocupa
    // endereço nenhum — ver `lib/identidade.ts`.
    const user = await User.findOne(filtroPorQualquerEmail(email)).select('_id');

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
