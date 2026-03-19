import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Certificate from '@/models/Certificate';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();

    const decoded = await getAuthUser();
    if (!decoded) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const certificates = await Certificate.find({
      userId: decoded.id,
      status: 'issued',
    }).sort({ issuedAt: -1 });

    return NextResponse.json({
      certificates: certificates.map(cert => ({
        _id: cert._id,
        courseTitle: cert.courseTitle,
        courseSlug: cert.courseSlug,
        courseLevel: cert.courseLevel,
        courseCategory: cert.courseCategory,
        certificateNumber: cert.certificateNumber,
        verificationCode: cert.verificationCode,
        verificationUrl: cert.verificationUrl,
        issuedAt: cert.issuedAt,
        completedAt: cert.completedAt,
        totalStudyHours: cert.totalStudyHours,
        quizScore: cert.quizScore,
        pdfUrl: cert.pdfUrl,
        imageUrl: cert.imageUrl,
      })),
      total: certificates.length,
    });
  } catch (error) {
    console.error('Certificates GET error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
