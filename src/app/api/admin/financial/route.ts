import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Payment from '@/models/Payment';
import Subscription from '@/models/Subscription';
import asaas, { asaasConfig } from '@/lib/asaas';

const JWT_SECRET = process.env.JWT_SECRET || 'fayapoint-secret';

// =============================================================================
// HELPER
// =============================================================================

async function getAdminFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    await dbConnect();
    const user = await User.findById(decoded.id);
    if (user?.role !== 'admin') return null;
    return user;
  } catch {
    return null;
  }
}

// =============================================================================
// GET - Financial Dashboard
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromToken(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem acessar' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, year

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    await dbConnect();

    // Get local database stats
    const [
      paymentsInPeriod,
      paidPayments,
      pendingPayments,
      failedPayments,
      activeSubscriptions,
      totalSubscriptions,
    ] = await Promise.all([
      Payment.countDocuments({ createdAt: { $gte: startDate } }),
      Payment.find({ status: 'paid', paidAt: { $gte: startDate } }).lean(),
      Payment.find({ status: 'pending', createdAt: { $gte: startDate } }).lean(),
      Payment.find({ status: { $in: ['failed', 'expired'] }, createdAt: { $gte: startDate } }).lean(),
      Subscription.countDocuments({ status: 'active' }),
      Subscription.countDocuments(),
    ]);

    // Calculate local stats
    const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.total || 0), 0);
    const pendingRevenue = pendingPayments.reduce((sum, p) => sum + (p.total || 0), 0);
    const failedRevenue = failedPayments.reduce((sum, p) => sum + (p.total || 0), 0);

    // Group payments by method
    const paymentsByMethod = {
      pix: paidPayments.filter(p => p.method === 'pix'),
      boleto: paidPayments.filter(p => p.method === 'boleto'),
      credit_card: paidPayments.filter(p => p.method === 'credit_card'),
    };

    // Get Asaas stats if available
    let asaasStats = null;
    let asaasBalance = null;
    let asaasFees = null;
    
    if (asaasConfig.isConfigured) {
      try {
        const [stats, balance, fees] = await Promise.all([
          asaas.getPaymentStatistics(),
          asaas.getAccountBalance(),
          asaas.getAccountFees(),
        ]);
        asaasStats = stats;
        asaasBalance = balance;
        asaasFees = fees;
      } catch (error) {
        console.error('[Financial] Error fetching Asaas stats:', error);
      }
    }

    // Calculate daily revenue for chart
    const dailyRevenue = [];
    const daysInPeriod = Math.min(30, Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
    
    for (let i = 0; i < daysInPeriod; i++) {
      const dayStart = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayRevenue = paidPayments
        .filter(p => {
          const paidAt = new Date(p.paidAt!);
          return paidAt >= dayStart && paidAt < dayEnd;
        })
        .reduce((sum, p) => sum + (p.total || 0), 0);
      
      dailyRevenue.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayRevenue,
      });
    }

    // Get recent transactions
    const recentTransactions = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber status method total createdAt paidAt userName')
      .lean();

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      
      // Summary
      summary: {
        totalRevenue,
        pendingRevenue,
        failedRevenue,
        totalPayments: paymentsInPeriod,
        paidPayments: paidPayments.length,
        pendingPayments: pendingPayments.length,
        failedPayments: failedPayments.length,
        activeSubscriptions,
        totalSubscriptions,
        averageTicket: paidPayments.length > 0 ? totalRevenue / paidPayments.length : 0,
      },
      
      // By payment method
      byMethod: {
        pix: {
          count: paymentsByMethod.pix.length,
          total: paymentsByMethod.pix.reduce((sum, p) => sum + (p.total || 0), 0),
        },
        boleto: {
          count: paymentsByMethod.boleto.length,
          total: paymentsByMethod.boleto.reduce((sum, p) => sum + (p.total || 0), 0),
        },
        credit_card: {
          count: paymentsByMethod.credit_card.length,
          total: paymentsByMethod.credit_card.reduce((sum, p) => sum + (p.total || 0), 0),
        },
      },
      
      // Asaas account info
      asaas: asaasStats ? {
        income: asaasStats.income,
        incomeCount: asaasStats.incomeCount,
        pending: asaasStats.pending,
        pendingCount: asaasStats.pendingCount,
        overdue: asaasStats.overdue,
        overdueCount: asaasStats.overdueCount,
        balance: asaasBalance?.balance || 0,
        blockedBalance: asaasBalance?.blocked || 0,
        fees: asaasFees,
      } : null,
      
      // Charts
      charts: {
        dailyRevenue,
      },
      
      // Recent transactions
      recentTransactions: recentTransactions.map(t => ({
        orderNumber: t.orderNumber,
        status: t.status,
        method: t.method,
        total: t.total,
        createdAt: t.createdAt,
        paidAt: t.paidAt,
        userName: t.userName,
      })),
    });

  } catch (error) {
    console.error('[Financial] GET Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
