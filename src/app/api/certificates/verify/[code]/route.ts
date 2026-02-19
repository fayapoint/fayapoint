import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Certificate from '@/models/Certificate';

/**
 * GET /api/certificates/verify/[code]
 * Public endpoint - verify a certificate by its verification code
 * No authentication required
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    await dbConnect();

    const certificate = await Certificate.findOne({
      verificationCode: code.toUpperCase(),
    }).select(
      'userName courseTitle courseSlug courseLevel courseDuration courseCategory certificateNumber verificationCode verificationUrl issuedAt quizScore totalStudyHours chaptersCompleted totalChapters status revokedAt revokedReason'
    );

    if (!certificate) {
      return NextResponse.json({
        valid: false,
        error: 'Certificado não encontrado. Verifique o código e tente novamente.',
      }, { status: 404 });
    }

    if (certificate.status === 'revoked') {
      return NextResponse.json({
        valid: false,
        status: 'revoked',
        revokedAt: certificate.revokedAt,
        reason: certificate.revokedReason,
        message: 'Este certificado foi revogado.',
      });
    }

    if (certificate.status !== 'issued') {
      return NextResponse.json({
        valid: false,
        status: certificate.status,
        message: 'Este certificado ainda não foi emitido.',
      });
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        studentName: certificate.userName,
        courseTitle: certificate.courseTitle,
        courseLevel: certificate.courseLevel,
        courseDuration: certificate.courseDuration,
        courseCategory: certificate.courseCategory,
        certificateNumber: certificate.certificateNumber,
        issuedAt: certificate.issuedAt,
        quizScore: certificate.quizScore,
        totalStudyHours: certificate.totalStudyHours,
        chaptersCompleted: certificate.chaptersCompleted,
        totalChapters: certificate.totalChapters,
      },
    });
  } catch (error) {
    console.error('Certificate verify error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
