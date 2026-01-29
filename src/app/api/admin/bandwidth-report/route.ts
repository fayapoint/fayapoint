import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import redis from '@/lib/redis';

const JWT_SECRET = process.env.JWT_SECRET || '';
const ADMIN_EMAILS = ['ricardofaya@gmail.com', 'admin@fayapoint.com'];

export const dynamic = 'force-dynamic';

interface BandwidthStats {
  topIPs: Array<{ ip: string; requests: number }>;
  blockedIPs: string[];
  recentApiAccess: string[];
  rateLimitHits: number;
}

export async function GET() {
  try {
    // Auth check - admin only
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(decoded.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get bandwidth tracking data from Redis
    const stats: BandwidthStats = {
      topIPs: [],
      blockedIPs: [],
      recentApiAccess: [],
      rateLimitHits: 0,
    };

    // Scan for bandwidth keys
    const bandwidthKeys = await redis.keys('bandwidth:*');
    const ipRequests: Array<{ ip: string; requests: number }> = [];

    for (const key of bandwidthKeys.slice(0, 100)) {
      const count = await redis.get(key);
      const ip = key.replace('bandwidth:', '');
      if (count) {
        ipRequests.push({ ip, requests: parseInt(String(count), 10) });
      }
    }

    // Sort by request count descending
    stats.topIPs = ipRequests.sort((a, b) => b.requests - a.requests).slice(0, 20);

    // Get blocked IPs
    const blockedKeys = await redis.keys('blocked:ip:*');
    stats.blockedIPs = blockedKeys.map(k => k.replace('blocked:ip:', '')).slice(0, 50);

    // Get rate limit strike counts
    const strikeKeys = await redis.keys('strikes:*');
    stats.rateLimitHits = strikeKeys.length;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      message: 'Check Netlify logs for [API_ACCESS] entries to see detailed request patterns',
    });
  } catch (error) {
    console.error('Error fetching bandwidth report:', error);
    return NextResponse.json({ error: 'Error generating report' }, { status: 500 });
  }
}

// POST to manually block an IP
export async function POST(request: Request) {
  try {
    // Auth check - admin only
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(decoded.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { ip, action, duration = 86400 } = body;

    if (!ip) {
      return NextResponse.json({ error: 'IP required' }, { status: 400 });
    }

    if (action === 'block') {
      // Block the IP for specified duration (default 24 hours)
      await redis.setex(`blocked:ip:${ip}`, duration, '1');
      console.warn(`[ADMIN_BLOCK] IP ${ip} blocked for ${duration}s by ${decoded.email}`);
      return NextResponse.json({ success: true, message: `IP ${ip} blocked for ${duration} seconds` });
    } else if (action === 'unblock') {
      await redis.del(`blocked:ip:${ip}`);
      console.log(`[ADMIN_UNBLOCK] IP ${ip} unblocked by ${decoded.email}`);
      return NextResponse.json({ success: true, message: `IP ${ip} unblocked` });
    }

    return NextResponse.json({ error: 'Invalid action. Use "block" or "unblock"' }, { status: 400 });
  } catch (error) {
    console.error('Error managing IP block:', error);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}
