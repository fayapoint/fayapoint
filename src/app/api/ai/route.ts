import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { generate, getBudgetStatus, getModels, type AIRequest } from '@/lib/ai/provider';

// =============================================================================
// POST - Generate AI completion
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messages, maxTokens, temperature, model, tier, json } = body as AIRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    const response = await generate({
      messages,
      maxTokens,
      temperature,
      model,
      tier: tier || 'budget',
      json,
    });

    return NextResponse.json({
      content: response.content,
      model: response.model,
      provider: response.provider,
      tier: response.tier,
      usage: {
        input: response.tokensInput,
        output: response.tokensOutput,
        cost: response.cost,
      },
      latencyMs: response.latencyMs,
    });
  } catch (error) {
    console.error('[AI API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI generation failed' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Budget status & available models
// =============================================================================

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    budget: getBudgetStatus(),
    models: getModels().map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      tier: m.tier,
      maxTokens: m.maxTokens,
    })),
  });
}
