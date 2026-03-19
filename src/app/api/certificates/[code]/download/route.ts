import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Certificate from '@/models/Certificate';
import { getAuthUser } from '@/lib/auth';
import { generateCertificateArrayBuffer, CertificateData } from '@/lib/certificate-generator';

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
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    const certificate = await Certificate.findOne({
      verificationCode: code,
      userId: authUser.id,
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

    const fileName = `Certificado_FayAi_${certificate.courseSlug}_${certificate.certificateNumber}.pdf`;

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
