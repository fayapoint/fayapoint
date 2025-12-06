import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ConsultationRequest, ICartItemSnapshot } from '@/models/ConsultationRequest';
import { getNextAvailableSlot, BookingDetails } from '@/lib/calendar';
import { upsertUser } from '@/lib/users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      company, 
      role, 
      phone,
      details, 
      source, 
      referrerUrl,
      cartItems = [],
      cartTotal = 0,
    } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Upsert user in users collection
    let userId;
    try {
      const user = await upsertUser({
        name: name.trim(),
        email: email.trim(),
        source: source || 'consultation',
        ...(company && { company: company.trim() }),
        ...(role && { role: role.trim() }),
        ...(phone && { phone: phone.trim() }),
      });
      userId = user._id;
    } catch (error) {
      console.error('Error upserting user:', error);
      // Continue even if user upsert fails - we still want to save the consultation
    }

    // Prepare cart items snapshot
    const cartItemsSnapshot: ICartItemSnapshot[] = cartItems.map((item: ICartItemSnapshot) => ({
      id: item.id,
      type: item.type,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      serviceSlug: item.serviceSlug,
      unitLabel: item.unitLabel,
      track: item.track,
      slug: item.slug,
    }));

    // Get next available slot with booking details
    const bookingDetails: BookingDetails = {
      userName: name.trim(),
      userEmail: email.trim(),
      company: company?.trim(),
      source: source,
      details: details?.trim(),
      cartItems: cartItemsSnapshot.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      cartTotal: cartTotal,
    };

    const slot = await getNextAvailableSlot(bookingDetails);

    // Create consultation request record
    const consultationRequest = new ConsultationRequest({
      userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company?.trim(),
      role: role?.trim(),
      phone: phone?.trim(),
      details: details?.trim(),
      source: source || 'unknown',
      referrerUrl: referrerUrl,
      cartItems: cartItemsSnapshot,
      cartTotal: cartTotal,
      scheduledStartUtc: new Date(slot.startUtc),
      scheduledEndUtc: new Date(slot.endUtc),
      bookingUrl: slot.bookingUrl,
      status: 'pending',
    });

    await consultationRequest.save();

    console.log(`[ConsultationRequest] Saved request from ${email} with ${cartItems.length} cart items, source: ${source}`);

    return NextResponse.json({
      success: true,
      requestId: consultationRequest._id.toString(),
      bookingUrl: slot.bookingUrl,
      startInTimeZone: slot.startInTimeZone,
    });

  } catch (error) {
    console.error('[ConsultationRequest] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process consultation request' },
      { status: 500 }
    );
  }
}

// GET endpoint to check status of a consultation request
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');
    const email = searchParams.get('email');

    if (!requestId && !email) {
      return NextResponse.json(
        { error: 'Request ID or email is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    let consultationRequest;
    if (requestId) {
      consultationRequest = await ConsultationRequest.findById(requestId);
    } else if (email) {
      consultationRequest = await ConsultationRequest.findOne({ 
        email: email.toLowerCase() 
      }).sort({ createdAt: -1 });
    }

    if (!consultationRequest) {
      return NextResponse.json(
        { error: 'Consultation request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: {
        id: consultationRequest._id.toString(),
        name: consultationRequest.name,
        email: consultationRequest.email,
        status: consultationRequest.status,
        source: consultationRequest.source,
        cartItems: consultationRequest.cartItems,
        cartTotal: consultationRequest.cartTotal,
        scheduledStartUtc: consultationRequest.scheduledStartUtc,
        createdAt: consultationRequest.createdAt,
      },
    });

  } catch (error) {
    console.error('[ConsultationRequest] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consultation request' },
      { status: 500 }
    );
  }
}
