import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PODProvider, { DEFAULT_POD_PROVIDERS } from '@/models/PODProvider';

// GET - List all POD providers
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const specialization = searchParams.get('specialization');
    const status = searchParams.get('status');
    const shipsToBrazil = searchParams.get('shipsToBrazil');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { isActive: true };

    if (specialization && specialization !== 'all') {
      query.specialization = specialization;
    }
    if (status) {
      query.integrationStatus = status;
    }
    if (shipsToBrazil === 'true') {
      query['shipping.shipsToBrazil'] = true;
    }

    const providers = await PODProvider.find(query)
      .sort({ isPremium: -1, qualityScore: -1 })
      .lean();

    // Get stats
    const stats = {
      total: providers.length,
      active: providers.filter(p => p.integrationStatus === 'active').length,
      testing: providers.filter(p => p.integrationStatus === 'testing').length,
      comingSoon: providers.filter(p => p.integrationStatus === 'coming_soon').length,
      withBrazilShipping: providers.filter(p => p.shipping?.shipsToBrazil).length,
    };

    return NextResponse.json({
      providers,
      stats,
    });
  } catch (error) {
    console.error('Error fetching POD providers:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar fornecedores POD' },
      { status: 500 }
    );
  }
}

// POST - Initialize default providers or add new one
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Initialize defaults
    if (body.action === 'initialize') {
      const existingCount = await PODProvider.countDocuments();
      
      if (existingCount === 0) {
        const results = await Promise.all(
          DEFAULT_POD_PROVIDERS.map(async (provider) => {
            try {
              const newProvider = new PODProvider(provider);
              await newProvider.save();
              return { slug: provider.slug, success: true };
            } catch (err) {
              console.error(`Error creating provider ${provider.slug}:`, err);
              return { slug: provider.slug, success: false, error: String(err) };
            }
          })
        );

        const successCount = results.filter(r => r.success).length;
        
        return NextResponse.json({
          message: `${successCount} fornecedores POD inicializados`,
          results,
        });
      } else {
        return NextResponse.json({
          message: `Já existem ${existingCount} fornecedores cadastrados`,
          existingCount,
        });
      }
    }

    // Add single provider
    const { provider } = body;
    if (!provider) {
      return NextResponse.json(
        { error: 'Dados do fornecedor são obrigatórios' },
        { status: 400 }
      );
    }

    const newProvider = new PODProvider(provider);
    await newProvider.save();

    return NextResponse.json({
      message: 'Fornecedor POD criado com sucesso',
      provider: newProvider,
    });
  } catch (error) {
    console.error('Error creating POD provider:', error);
    return NextResponse.json(
      { error: 'Erro ao criar fornecedor POD' },
      { status: 500 }
    );
  }
}
