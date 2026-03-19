import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Certificate from '@/models/Certificate';
import { getAuthUser } from '@/lib/auth';

/**
 * GET /api/certificates
 * List all certificates for the authenticated user
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    const certificates = await Certificate.find({
      userId: authUser.id,
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
