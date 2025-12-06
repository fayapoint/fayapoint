import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, logAdminAction } from '@/lib/admin-auth';
import User from '@/models/User';
import Order from '@/models/Order';
import AdminLog from '@/models/AdminLog';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    // Get date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // User statistics
    const totalUsers = await User.countDocuments();
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: thisWeek } });
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: thisMonth } });
    const newUsersLastMonth = await User.countDocuments({
      createdAt: { $gte: lastMonth, $lt: thisMonth }
    });

    // Users by plan
    const usersByPlan = await User.aggregate([
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
    ]);

    // Active users (logged in this week)
    const activeUsers = await User.countDocuments({
      lastLoginAt: { $gte: thisWeek }
    });

    // Order statistics
    const totalOrders = await Order.countDocuments();
    const ordersThisMonth = await Order.countDocuments({ createdAt: { $gte: thisMonth } });
    
    // Revenue calculation (assuming orders have totalAmount field)
    const revenueAggregation = await Order.aggregate([
      { $match: { status: { $in: ['completed', 'paid'] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          thisMonthRevenue: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', thisMonth] }, '$totalAmount', 0]
            }
          }
        }
      }
    ]);

    const revenue = revenueAggregation[0] || { totalRevenue: 0, thisMonthRevenue: 0 };

    // Recent admin activity
    const recentLogs = await AdminLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get products count from fayapointProdutos database
    let productsCount = 0;
    try {
      const productsDb = mongoose.connection.useDb('fayapointProdutos');
      const ProductsCollection = productsDb.collection('products');
      productsCount = await ProductsCollection.countDocuments();
    } catch (e) {
      console.error('Failed to count products:', e);
    }

    // Log this action
    await logAdminAction(
      authResult.admin.id,
      authResult.admin.email,
      'Viewed dashboard stats',
      'system'
    );

    const userGrowth = newUsersLastMonth > 0 
      ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
      : 100;

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
          newThisMonth: newUsersThisMonth,
          growth: userGrowth,
          active: activeUsers,
          byPlan: usersByPlan.reduce((acc, item) => {
            acc[item._id || 'free'] = item.count;
            return acc;
          }, {} as Record<string, number>),
        },
        orders: {
          total: totalOrders,
          thisMonth: ordersThisMonth,
        },
        revenue: {
          total: revenue.totalRevenue,
          thisMonth: revenue.thisMonthRevenue,
        },
        products: {
          total: productsCount,
        },
        recentActivity: recentLogs.map(log => ({
          id: log._id,
          action: log.action,
          category: log.category,
          adminEmail: log.adminEmail,
          createdAt: log.createdAt,
          details: log.details,
        })),
      },
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar estatísticas' },
      { status: 500 }
    );
  }
}
