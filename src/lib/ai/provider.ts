/**
 * Unified AI Provider
 * Ported from USS ConfigurableAIService, adapted for fayapoint-ai
 *
 * Features:
 * - OpenRouter as primary provider
 * - LMStudio as local fallback (saves cost)
 * - Per-request cost tracking
 * - Model tier system (free -> budget -> premium)
 * - Budget limits per tier
 * - Automatic fallback chain
 */

// =============================================================================
// TYPES
// =============================================================================

export type ModelTier = 'free' | 'budget' | 'premium';

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openrouter' | 'lmstudio';
  costPer1MInput: number;
  costPer1MOutput: number;
  tier: ModelTier;
  maxTokens: number;
  enabled: boolean;
}

export interface AIRequest {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  tier?: ModelTier;
  json?: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: 'openrouter' | 'lmstudio';
  tier: ModelTier;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  latencyMs: number;
  fallbacksUsed: number;
}

export interface BudgetStatus {
  daily: Record<ModelTier, { limit: number; spent: number; remaining: number }>;
  totalToday: number;
}

// =============================================================================
// DEFAULT MODELS (March 2026)
// =============================================================================

const DEFAULT_MODELS: ModelConfig[] = [
  // Free tier
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash (Free)',
    provider: 'openrouter',
    costPer1MInput: 0,
    costPer1MOutput: 0,
    tier: 'free',
    maxTokens: 8192,
    enabled: true,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B (Free)',
    provider: 'openrouter',
    costPer1MInput: 0,
    costPer1MOutput: 0,
    tier: 'free',
    maxTokens: 8192,
    enabled: true,
  },
  // Budget tier
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'openrouter',
    costPer1MInput: 0.15,
    costPer1MOutput: 0.6,
    tier: 'budget',
    maxTokens: 8192,
    enabled: true,
  },
  {
    id: 'anthropic/claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    provider: 'openrouter',
    costPer1MInput: 0.8,
    costPer1MOutput: 4,
    tier: 'budget',
    maxTokens: 8192,
    enabled: true,
  },
  // Premium tier
  {
    id: 'anthropic/claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'openrouter',
    costPer1MInput: 3,
    costPer1MOutput: 15,
    tier: 'premium',
    maxTokens: 8192,
    enabled: true,
  },
  {
    id: 'openai/gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openrouter',
    costPer1MInput: 2,
    costPer1MOutput: 8,
    tier: 'premium',
    maxTokens: 8192,
    enabled: true,
  },
  // LMStudio local (zero cost)
  {
    id: 'local',
    name: 'LMStudio Local',
    provider: 'lmstudio',
    costPer1MInput: 0,
    costPer1MOutput: 0,
    tier: 'free',
    maxTokens: 4096,
    enabled: true,
  },
];

const DEFAULT_DAILY_LIMITS: Record<ModelTier, number> = {
  free: 999,   // Unlimited free
  budget: 2.0, // $2/day
  premium: 5.0, // $5/day
};

// =============================================================================
// BUDGET TRACKING (in-memory, resets daily)
// =============================================================================

let dailySpend: Record<ModelTier, number> = { free: 0, budget: 0, premium: 0 };
let lastResetDate = new Date().toDateString();

function resetDailyBudgetIfNeeded() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailySpend = { free: 0, budget: 0, premium: 0 };
    lastResetDate = today;
  }
}

function canAfford(tier: ModelTier): boolean {
  resetDailyBudgetIfNeeded();
  return dailySpend[tier] < DEFAULT_DAILY_LIMITS[tier];
}

function recordSpend(tier: ModelTier, cost: number) {
  resetDailyBudgetIfNeeded();
  dailySpend[tier] += cost;
}

// =============================================================================
// CORE GENERATION
// =============================================================================

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const LMSTUDIO_URL = process.env.LMSTUDIO_URL || 'http://100.84.253.67:1234';

async function callOpenRouter(
  model: string,
  messages: AIRequest['messages'],
  opts: { maxTokens?: number; temperature?: number; json?: boolean }
): Promise<{ content: string; tokensInput: number; tokensOutput: number }> {
  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: opts.maxTokens || 4096,
    temperature: opts.temperature ?? 0.7,
  };
  if (opts.json) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://fayai.com.br',
      'X-Title': 'FayAI',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];

  return {
    content: choice?.message?.content || '',
    tokensInput: data.usage?.prompt_tokens || 0,
    tokensOutput: data.usage?.completion_tokens || 0,
  };
}

async function callLMStudio(
  messages: AIRequest['messages'],
  opts: { maxTokens?: number; temperature?: number; json?: boolean }
): Promise<{ content: string; tokensInput: number; tokensOutput: number }> {
  const body: Record<string, unknown> = {
    messages,
    max_tokens: opts.maxTokens || 2048,
    temperature: opts.temperature ?? 0.7,
    stream: false,
  };
  if (opts.json) {
    body.response_format = { type: 'json_object' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${LMSTUDIO_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`LMStudio ${res.status}`);

    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      tokensInput: data.usage?.prompt_tokens || 0,
      tokensOutput: data.usage?.completion_tokens || 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Generate AI completion with automatic fallback chain.
 * Tries models in order: requested model -> same tier -> lower tier -> LMStudio
 */
export async function generate(request: AIRequest): Promise<AIResponse> {
  const start = Date.now();
  let fallbacksUsed = 0;

  // Build ordered model list
  const models = getModelChain(request.model, request.tier);

  for (const model of models) {
    if (!canAfford(model.tier) && model.tier !== 'free') {
      console.log(`[AI] Budget exceeded for ${model.tier}, skipping ${model.name}`);
      fallbacksUsed++;
      continue;
    }

    try {
      const opts = {
        maxTokens: request.maxTokens || model.maxTokens,
        temperature: request.temperature,
        json: request.json,
      };

      let result;
      if (model.provider === 'lmstudio') {
        result = await callLMStudio(request.messages, opts);
      } else {
        result = await callOpenRouter(model.id, request.messages, opts);
      }

      if (!result.content) {
        fallbacksUsed++;
        continue;
      }

      const cost =
        (result.tokensInput / 1_000_000) * model.costPer1MInput +
        (result.tokensOutput / 1_000_000) * model.costPer1MOutput;

      recordSpend(model.tier, cost);

      return {
        content: result.content,
        model: model.id,
        provider: model.provider,
        tier: model.tier,
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        cost,
        latencyMs: Date.now() - start,
        fallbacksUsed,
      };
    } catch (err) {
      console.error(`[AI] Error with ${model.name}:`, err instanceof Error ? err.message : err);
      fallbacksUsed++;
    }
  }

  throw new Error('All AI models failed. Check API keys and budget limits.');
}

/**
 * Quick helper for simple text generation
 */
export async function ask(
  prompt: string,
  opts?: { system?: string; tier?: ModelTier; model?: string; json?: boolean }
): Promise<string> {
  const messages: AIRequest['messages'] = [];
  if (opts?.system) messages.push({ role: 'system', content: opts.system });
  messages.push({ role: 'user', content: prompt });

  const response = await generate({
    messages,
    tier: opts?.tier || 'budget',
    model: opts?.model,
    json: opts?.json,
  });

  return response.content;
}

/**
 * Get current budget status
 */
export function getBudgetStatus(): BudgetStatus {
  resetDailyBudgetIfNeeded();
  const tiers: ModelTier[] = ['free', 'budget', 'premium'];
  const daily = {} as BudgetStatus['daily'];

  for (const tier of tiers) {
    daily[tier] = {
      limit: DEFAULT_DAILY_LIMITS[tier],
      spent: dailySpend[tier],
      remaining: Math.max(0, DEFAULT_DAILY_LIMITS[tier] - dailySpend[tier]),
    };
  }

  return {
    daily,
    totalToday: tiers.reduce((sum, t) => sum + dailySpend[t], 0),
  };
}

/**
 * Get available models
 */
export function getModels(): ModelConfig[] {
  return DEFAULT_MODELS.filter((m) => m.enabled);
}

// =============================================================================
// INTERNAL
// =============================================================================

function getModelChain(requestedModel?: string, requestedTier?: ModelTier): ModelConfig[] {
  const enabled = DEFAULT_MODELS.filter((m) => m.enabled);

  // If specific model requested, try it first
  if (requestedModel) {
    const specific = enabled.find((m) => m.id === requestedModel);
    if (specific) {
      const rest = enabled.filter((m) => m.id !== requestedModel);
      return [specific, ...rest];
    }
  }

  // Order by tier priority
  const tierOrder: ModelTier[] = requestedTier
    ? [requestedTier, ...(['free', 'budget', 'premium'] as ModelTier[]).filter((t) => t !== requestedTier)]
    : ['budget', 'free', 'premium'];

  const sorted = [...enabled].sort((a, b) => {
    const aIdx = tierOrder.indexOf(a.tier);
    const bIdx = tierOrder.indexOf(b.tier);
    if (aIdx !== bIdx) return aIdx - bIdx;
    // Within same tier, prefer OpenRouter over LMStudio (faster)
    if (a.provider !== b.provider) return a.provider === 'openrouter' ? -1 : 1;
    return 0;
  });

  return sorted;
}
