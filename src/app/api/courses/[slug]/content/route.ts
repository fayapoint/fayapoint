import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import CourseProgress from '@/models/CourseProgress';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import { getMongoClient } from '@/lib/products';
import { SubscriptionPlan, TIER_CONFIGS } from '@/lib/course-tiers';

const JWT_SECRET = process.env.JWT_SECRET || '';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await dbConnect();

    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded: { id: string } | string | jwt.JwtPayload;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    if (typeof decoded === 'string' || !decoded.id) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const userId = decoded.id;

    // 1. Check Access
    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const userPlan = (user.subscription?.plan || 'free') as SubscriptionPlan;
    const tierConfig = TIER_CONFIGS[userPlan];

    let hasAccess = false;

    // Check Role - Admin/Instructor always have access
    if (user.role === 'admin' || user.role === 'instructor') hasAccess = true;

    // Check if business plan (unlimited)
    if (tierConfig.limits.unlimited) hasAccess = true;

    // Check enrolled courses (NEW TIER SYSTEM)
    if (!hasAccess) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isEnrolled = user.enrolledCourses?.some((c: any) => c.courseSlug === slug && c.isActive);
        if (isEnrolled) hasAccess = true;
    }

    // Check Progress (backwards compatibility - if progress exists, they have access)
    if (!hasAccess) {
        const progress = await CourseProgress.findOne({ userId, courseId: slug });
        if (progress) hasAccess = true;
    }

    // Check Orders (purchased courses)
    if (!hasAccess) {
        const order = await Order.findOne({
            userId,
            status: 'completed',
            'items.id': { $regex: new RegExp(slug, 'i') }
        });
        if (order) hasAccess = true;
    }

    // Check External Orders (Proposals)
    if (!hasAccess) {
         try {
            const client = await getMongoClient();
            const productsDb = client.db('fayapointProdutos');
            const proposals = await productsDb.collection('service_proposals').findOne({
                email: user.email,
                status: { $in: ['converted', 'closed'] },
                'selections.serviceSlug': slug
            });
            if (proposals) hasAccess = true;
         } catch (e) {
             console.error("Error checking external access", e);
         }
    }

    if (!hasAccess) {
        return NextResponse.json({ 
            error: 'Acesso negado. Matricule-se no curso ou faça upgrade do seu plano.',
            requiresEnrollment: true,
            courseSlug: slug
        }, { status: 403 });
    }

    // 2. Fetch Content
    const client = await getMongoClient();
    const product = await client.db('fayapointProdutos').collection('products').findOne({ slug });

    if (!product) {
        return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
        content: product.courseContent || 'Conteúdo em breve...',
        title: product.name,
        modules: product.detailedCurriculum || [],
        slug: product.slug
    });

  } catch (error) {
    console.error('Course content error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
