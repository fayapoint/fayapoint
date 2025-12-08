import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ImageCreation from '@/models/ImageCreation';

// OPTIMIZATION: Force dynamic to avoid build-time static generation containing secrets (Cloudinary URLs)
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    
    // Get total creations
    const totalCreations = await ImageCreation.countDocuments();
    
    // Get unique creators count
    const uniqueCreators = await ImageCreation.distinct('userId');
    
    // Get today's creations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCreations = await ImageCreation.countDocuments({
      createdAt: { $gte: today }
    });

    // Get top creators (most creations)
    const topCreators = await ImageCreation.aggregate([
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          count: { $sum: 1 },
          latestImage: { $last: '$imageUrl' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    return NextResponse.json({
      totalCreations,
      uniqueCreators: uniqueCreators.length,
      todayCreations,
      topCreators
    });
  } catch (error) {
    console.error('Error fetching community stats:', error);
    return NextResponse.json({ error: 'Error loading stats' }, { status: 500 });
  }
}
