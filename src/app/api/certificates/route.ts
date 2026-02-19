import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Certificate from '@/models/Certificate';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || '';

async function requireAuth(): Promise<{ userId: string } | { error: NextResponse }> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (typeof decoded === 'string' || !decoded || !(decoded as { id: string }).id) {
      return { error: NextResponse.json({ error: 'Token inválido' }, { status: 401 }) };
    }
    return { userId: (decoded as { id: string }).id };
  } catch {
    return { error: NextResponse.json({ error: 'Token inválido' }, { status: 401 }) };
  }
}

/**
 * GET /api/certificates
 * List all certificates for the authenticated user
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    await dbConnect();

    const certificates = await Certificate.find({
      userId: auth.userId,
      status: 'issued',
    })
      .select('courseTitle courseSlug courseLevel courseDuration certificateNumber verificationCode verificationUrl issuedAt quizScore totalStudyHours chaptersCompleted totalChapters courseCategory')
      .sort({ issuedAt: -1 })
      .lean();

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error('Certificates list error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
