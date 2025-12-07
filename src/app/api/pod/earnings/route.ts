/**
 * POD Earnings API
 * Manages creator earnings and payouts:
 * - Get earnings summary
 * - Get earnings history
 * - Request payout
 * - Update payout details
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import PODOrder from '@/models/PODOrder';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Minimum payout amount in BRL
const MIN_PAYOUT_AMOUNT = 50;

// Helper to get user from token
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);
    return user;
  } catch {
    return null;
  }
}

// GET - Get earnings summary and history
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await getUserFromToken(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    // Get earnings data from user
    const podEarnings = user.podEarnings || {
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      totalSales: 0,
      totalOrders: 0,
      totalProducts: 0,
      commissionRate: 70,
    };

    // Calculate period-based stats
    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get orders in period
    const periodOrders = await PODOrder.find({
      creatorId: user._id,
      createdAt: { $gte: startDate },
    }).lean();

    const periodStats = {
      orders: periodOrders.length,
      sales: periodOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0),
      commission: periodOrders.reduce((sum, o) => sum + (o.totalCreatorCommission || 0), 0),
    };

    // Get monthly earnings breakdown (last 6 months)
    const monthlyBreakdown = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthOrders = await PODOrder.find({
        creatorId: user._id,
        createdAt: { $gte: monthStart, $lt: monthEnd },
      }).lean();

      monthlyBreakdown.push({
        month: monthStart.toISOString().substring(0, 7), // YYYY-MM
        orders: monthOrders.length,
        sales: monthOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0),
        commission: monthOrders.reduce((sum, o) => sum + (o.totalCreatorCommission || 0), 0),
      });
    }

    // Get top products
    const topProducts = await PODOrder.aggregate([
      { $match: { creatorId: user._id } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.podProductId',
          title: { $first: '$items.title' },
          totalSales: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.sellingPrice' },
          totalCommission: { $sum: '$items.creatorCommission' },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
    ]);

    return NextResponse.json({
      summary: {
        totalEarnings: podEarnings.totalEarnings,
        pendingEarnings: podEarnings.pendingEarnings,
        paidEarnings: podEarnings.paidEarnings,
        availableForPayout: podEarnings.totalEarnings - podEarnings.paidEarnings,
        totalSales: podEarnings.totalSales,
        totalOrders: podEarnings.totalOrders,
        totalProducts: podEarnings.totalProducts,
        commissionRate: podEarnings.commissionRate,
        minPayoutAmount: MIN_PAYOUT_AMOUNT,
        canRequestPayout: (podEarnings.totalEarnings - podEarnings.paidEarnings) >= MIN_PAYOUT_AMOUNT,
      },
      periodStats,
      monthlyBreakdown: monthlyBreakdown.reverse(),
      topProducts,
      payoutDetails: {
        method: podEarnings.payoutMethod,
        pixKey: podEarnings.payoutDetails?.pixKey ? '****' + podEarnings.payoutDetails.pixKey.slice(-4) : null,
        bankAccount: podEarnings.payoutDetails?.bankAccount ? '****' + podEarnings.payoutDetails.bankAccount.slice(-4) : null,
        bankName: podEarnings.payoutDetails?.bankName,
        paypalEmail: podEarnings.payoutDetails?.paypalEmail ? podEarnings.payoutDetails.paypalEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
        lastPayoutDate: podEarnings.lastPayoutDate,
      },
    });

  } catch (error) {
    console.error('[Earnings API] Error:', error);
    return NextResponse.json({ error: 'Erro ao buscar ganhos' }, { status: 500 });
  }
}

// POST - Request payout or update payout details
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await getUserFromToken(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update_payout_details': {
        const { payoutMethod, pixKey, bankAccount, bankAgency, bankName, paypalEmail } = body;

        if (!payoutMethod) {
          return NextResponse.json({ error: 'Método de pagamento é obrigatório' }, { status: 400 });
        }

        // Validate based on method
        if (payoutMethod === 'pix' && !pixKey) {
          return NextResponse.json({ error: 'Chave PIX é obrigatória' }, { status: 400 });
        }
        if (payoutMethod === 'bank_transfer' && (!bankAccount || !bankAgency || !bankName)) {
          return NextResponse.json({ error: 'Dados bancários incompletos' }, { status: 400 });
        }
        if (payoutMethod === 'paypal' && !paypalEmail) {
          return NextResponse.json({ error: 'Email do PayPal é obrigatório' }, { status: 400 });
        }

        await User.findByIdAndUpdate(user._id, {
          'podEarnings.payoutMethod': payoutMethod,
          'podEarnings.payoutDetails': {
            pixKey,
            bankAccount,
            bankAgency,
            bankName,
            paypalEmail,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Dados de pagamento atualizados',
        });
      }

      case 'request_payout': {
        const podEarnings = user.podEarnings || {};
        const availableAmount = (podEarnings.totalEarnings || 0) - (podEarnings.paidEarnings || 0);

        if (availableAmount < MIN_PAYOUT_AMOUNT) {
          return NextResponse.json({
            error: `Saldo mínimo para saque é R$ ${MIN_PAYOUT_AMOUNT}. Seu saldo: R$ ${availableAmount.toFixed(2)}`,
          }, { status: 400 });
        }

        if (!podEarnings.payoutMethod) {
          return NextResponse.json({
            error: 'Configure seus dados de pagamento primeiro',
          }, { status: 400 });
        }

        // In production, this would create a payout request and notify admin
        // For now, we'll just mark the earnings as paid
        
        // Create payout record in orders
        const pendingOrders = await PODOrder.find({
          creatorId: user._id,
          status: 'delivered',
          'commissionPayments.status': { $ne: 'paid' },
        });

        for (const order of pendingOrders) {
          order.commissionPayments.push({
            amount: order.totalCreatorCommission,
            currency: 'BRL',
            status: 'processing',
            notes: `Payout solicitado em ${new Date().toISOString()}`,
          });
          await order.save();
        }

        // Update user earnings (in production, this happens after actual payout)
        await User.findByIdAndUpdate(user._id, {
          $inc: {
            'podEarnings.paidEarnings': availableAmount,
          },
          'podEarnings.lastPayoutDate': new Date(),
        });

        return NextResponse.json({
          success: true,
          message: `Solicitação de saque de R$ ${availableAmount.toFixed(2)} recebida. Processamento em até 5 dias úteis.`,
          payoutAmount: availableAmount,
        });
      }

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

  } catch (error) {
    console.error('[Earnings API] Error:', error);
    return NextResponse.json({ error: 'Erro no processamento' }, { status: 500 });
  }
}
