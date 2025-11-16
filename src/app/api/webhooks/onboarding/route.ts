import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Call the webhook from server-side
    const response = await fetch('http://host.docker.internal:5678/webhook/322dce18-f93e-4f86-b9b1-3305519b7834/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Webhook call failed');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error calling onboarding webhook:', error);
    // Still return success to not break the user flow
    return NextResponse.json({ success: true, warning: 'Webhook may have failed' });
  }
}
