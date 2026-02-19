import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Certificate from '@/models/Certificate';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import { generateCertificateArrayBuffer, CertificateData } from '@/lib/certificate-generator';

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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * GET /api/certificates/[code]/download
 * Generate and download certificate PDF
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    await dbConnect();

    const certificate = await Certificate.findOne({
      verificationCode: code,
      userId: auth.userId,
      status: 'issued',
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 });
    }

    const certData: CertificateData = {
      studentName: certificate.userName,
      courseTitle: certificate.courseTitle,
      courseDescription: certificate.courseDescription || '',
      courseLevel: certificate.courseLevel || '',
      courseDuration: certificate.courseDuration || '',
      courseCategory: certificate.courseCategory || '',
      completionDate: formatDate(certificate.issuedAt || certificate.completedAt || new Date()),
      certificateNumber: certificate.certificateNumber,
      verificationCode: certificate.verificationCode,
      verificationUrl: certificate.verificationUrl,
      quizScore: certificate.quizScore,
      totalStudyHours: certificate.totalStudyHours || 0,
      chaptersCompleted: certificate.chaptersCompleted || 0,
      totalChapters: certificate.totalChapters || 0,
      issuedAt: formatDate(certificate.issuedAt || new Date()),
    };

    const pdfBuffer = generateCertificateArrayBuffer(certData);

    const fileName = `Certificado_FayaPoint_${certificate.courseSlug}_${certificate.certificateNumber}.pdf`;

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Certificate download error:', error);
    return NextResponse.json({ error: 'Erro ao gerar certificado' }, { status: 500 });
  }
}
