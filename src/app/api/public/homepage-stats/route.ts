import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Certificate from '@/models/Certificate';
import { allCourses } from '@/data/courses';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();

    const [totalUsers, totalCertificates] = await Promise.all([
      User.countDocuments(),
      Certificate.countDocuments(),
    ]);

    const totalCourses = allCourses.length;
    const totalChapters = allCourses.reduce((acc, c) => {
      return acc + (c.totalLessons || 0);
    }, 0);

    return NextResponse.json({
      totalUsers,
      totalCertificates,
      totalCourses,
      totalChapters,
    });
  } catch (error) {
    console.error('Error fetching homepage stats:', error);
    // Return safe fallback so homepage always renders
    return NextResponse.json({
      totalUsers: 0,
      totalCertificates: 0,
      totalCourses: allCourses.length,
      totalChapters: 0,
    });
  }
}
