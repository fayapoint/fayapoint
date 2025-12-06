import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken } from '@/lib/admin-auth';
import AdminLog from '@/models/AdminLog';

// GET - List admin logs with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const category = searchParams.get('category') || '';
    const adminEmail = searchParams.get('adminEmail') || '';
    const action = searchParams.get('action') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    
    if (category) {
      query.category = category;
    }
    
    if (adminEmail) {
      query.adminEmail = { $regex: adminEmail, $options: 'i' };
    }
    
    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AdminLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdminLog.countDocuments(query),
    ]);

    // Get summary statistics
    const categoryCounts = await AdminLog.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await AdminLog.countDocuments({ createdAt: { $gte: todayStart } });

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        total,
        today: todayCount,
        byCategory: categoryCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
      },
    });

  } catch (error) {
    console.error('Admin logs error:', error);
    return NextResponse.json(
      { error: 'Erro ao listar logs' },
      { status: 500 }
    );
  }
}

// DELETE - Clear old logs (keep last 30 days)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await AdminLog.deleteMany({ createdAt: { $lt: cutoffDate } });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Logs older than ${days} days have been deleted`,
    });

  } catch (error) {
    console.error('Admin logs cleanup error:', error);
    return NextResponse.json(
      { error: 'Erro ao limpar logs' },
      { status: 500 }
    );
  }
}
