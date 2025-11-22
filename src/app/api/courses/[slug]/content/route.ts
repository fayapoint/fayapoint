import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import CourseProgress from '@/models/CourseProgress';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import { getMongoClient } from '@/lib/products';

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
    // Check if user has purchased the course (in Orders) or has progress (started) or has subscription
    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Access logic:
    // - Admin/Instructor: Access all
    // - Plan: 'business' or 'pro' gets all courses (as per dashboard logic)
    // - Purchased: Order exists
    // - Started: CourseProgress exists (maybe free course?)

    let hasAccess = false;

    // Check Role/Plan
    if (user.role === 'admin' || user.role === 'instructor') hasAccess = true;
    if (user.subscription?.plan === 'business' || user.subscription?.plan === 'pro') hasAccess = true;

    // Check Progress (if it exists, they likely have access)
    if (!hasAccess) {
        const progress = await CourseProgress.findOne({ userId, courseId: slug });
        if (progress) hasAccess = true;
    }

    // Check Orders (Internal)
    if (!hasAccess) {
        // Check for "course" type items with the slug
        // Note: Order items might store ID as slug or ID. Usually slug or productID.
        // The dashboard logic maps serviceSlug to ID.
        const order = await Order.findOne({
            userId,
            status: 'completed',
            'items.id': { $regex: new RegExp(slug, 'i') } // Loose match for now
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
        // Allow "intro" courses for free users? 
        // For now, stricter.
        // return NextResponse.json({ error: 'Acesso negado. Adquira o curso para continuar.' }, { status: 403 });
        
        // Allow for now during debugging/development if requested, but better safe.
        // Wait, the user said "provided the fact that we are in a high enough tier, we should have access".
        // I checked tiers above.
        return NextResponse.json({ error: 'Acesso negado. Faça upgrade ou compre o curso.' }, { status: 403 });
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
