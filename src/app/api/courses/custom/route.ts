import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import CustomCourse from '@/models/CustomCourse';
import { getAuthUser } from '@/lib/auth';

const PRICE_PER_HOUR = 49; // R$49/hour

// =============================================================================
// POST - Create Custom Course Request
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      topic,
      description,
      duration,
      language,
      level,
      includeVideoScripts,
      includeQuizzes,
      includeExercises,
      includeCertificate,
      additionalNotes,
    } = body;

    // Validate
    if (!topic || topic.length < 3 || topic.length > 200) {
      return NextResponse.json({ error: 'Topic must be 3-200 characters' }, { status: 400 });
    }
    if (!description || description.length < 10 || description.length > 2000) {
      return NextResponse.json({ error: 'Description must be 10-2000 characters' }, { status: 400 });
    }
    const hours = Number(duration);
    if (!hours || hours < 2 || hours > 40) {
      return NextResponse.json({ error: 'Duration must be 2-40 hours' }, { status: 400 });
    }

    // Calculate price
    let pricePerHour = PRICE_PER_HOUR;
    // Discounts for longer courses
    if (hours >= 20) pricePerHour = 39;
    else if (hours >= 10) pricePerHour = 44;
    // Premium add-ons
    if (includeVideoScripts) pricePerHour += 10;

    const totalPrice = pricePerHour * hours;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDoc = user as any;
    const courseRequest = new CustomCourse({
      userId: userDoc._id,
      userEmail: userDoc.email,
      userName: userDoc.name,
      topic,
      description,
      duration: hours,
      language: language || 'pt-BR',
      level: level || 'beginner',
      includeVideoScripts: !!includeVideoScripts,
      includeQuizzes: includeQuizzes !== false,
      includeExercises: includeExercises !== false,
      includeCertificate: includeCertificate !== false,
      additionalNotes,
      pricePerHour,
      totalPrice,
      status: 'pending_payment',
      generationLog: [
        {
          step: 'request_created',
          status: 'completed',
          timestamp: new Date(),
          details: `Custom course request: "${topic}" (${hours}h, ${language})`,
        },
      ],
    });

    await courseRequest.save();

    return NextResponse.json({
      success: true,
      requestId: courseRequest._id,
      topic,
      duration: hours,
      pricePerHour,
      totalPrice,
      currency: 'BRL',
      status: 'pending_payment',
      pricing: {
        base: PRICE_PER_HOUR,
        discount: hours >= 20 ? '20%' : hours >= 10 ? '10%' : null,
        videoScriptsSurcharge: includeVideoScripts ? 10 : 0,
        perHour: pricePerHour,
        total: totalPrice,
      },
    });
  } catch (error) {
    console.error('[CustomCourse] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// GET - List User's Custom Course Requests
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const requests = await CustomCourse.find({ userId: authUser.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('[CustomCourse] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
