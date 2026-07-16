/**
 * Quiz Configuration
 * Updated: 2026-04-27
 *
 * This is the master configuration for the quiz system.
 * It includes:
 * - Model catalog (free and premium tiers)
 * - Active models selection
 * - Question bank configuration
 * - Autoresearch evaluator settings
 * - Quiz parameters
 */

// ═══════════════════════════════════════════════════════════════════════════
// MODEL CATALOG
// ═══════════════════════════════════════════════════════════════════════════

export const FREE_MODELS = [
  'openrouter/free',                                    // Smart router — auto-selects best free model
  'google/gemini-3-flash-preview-20251217:free',       // Gemini 3 Flash Preview — academic/science
  'anthropic/claude-sonnet-4-6:free',                  // Claude Sonnet 4.6 — BR Portuguese, balanced
  'anthropic/claude-opus-4-7:free',                    // Claude Opus 4.7 — adaptive cognition
  'deepseek/deepseek-v3.2-20251201:free',              // DeepSeek V3.2 — GPT-5 class reasoning
  'google/gemini-2.5-flash:free',                      // Gemini 2.5 Flash — versatile, 1M context
  'openai/gpt-oss-120b:free',                          // GPT-OSS 120B — OpenAI open-weight
  'openai/gpt-4.1-mini-2025-04-14:free',              // GPT-4.1 Mini — efficient, reliable
  'x-ai/grok-4.1-fast:free',                           // Grok 4.1 Fast — multi-domain, creative
  'xiaomi/mimo-v2-pro-20260318:free',                  // MiMo V2 Pro — 1T+ params, agentic
  'xiaomi/mimo-v2-flash-20251210:free',                // MiMo V2 Flash — fast, good quality
  'stepfun/step-3.5-flash:free',                       // Step 3.5 Flash — MoE, 256K context
  'google/gemini-2.5-flash-lite:free',                 // Gemini 2.5 Flash Lite — ultra fast
];

export const PREMIUM_MODELS = [
  'openai/gpt-5.5',                                    // GPT-5.5 — frontier intelligence
  'google/gemini-3.1-pro-preview',                     // Gemini 3.1 Pro Preview — 2M context
  'google/gemini-3.1-flash-lite-preview',              // Gemini 3.1 Flash Lite — high efficiency
  'anthropic/claude-opus-4-7',                         // Claude Opus 4.7 — adaptive cognition
  'anthropic/claude-sonnet-4.6',                       // Claude Sonnet 4.6 — best value premium
  'openai/gpt-5.4',                                    // GPT-5.4 — affordable frontier fallback
  'deepseek/deepseek-v3.2',                            // DeepSeek V3.2 — STEM, math, competition
  'google/gemini-3-flash-preview',                     // Gemini 3 Flash Preview — fast reasoning
  'openai/gpt-5.4-mini',                               // GPT-5.4 Mini — near-frontier, cost efficient
  'anthropic/claude-opus-4.5',                         // Claude Opus 4.5 — legacy fallback
  'anthropic/claude-sonnet-4.5',                       // Claude Sonnet 4.5 — proven, Portuguese
  'openai/gpt-5.2',                                    // GPT-5.2 — legacy fallback, consistent
  'openai/gpt-5',                                      // GPT-5 — core reasoning
  'x-ai/grok-4.20-beta',                               // Grok 4.20 Beta — creative, unconventional
  'google/gemini-2.5-pro',                             // Gemini 2.5 Pro — professional, 1M context
  'qwen/qwen3.5-397b-a17b',                           // Qwen 3.5 397B — massive, analytical
  'openai/gpt-5.4-nano',                               // GPT-5.4 Nano — cheapest premium
  'xiaomi/mimo-v2-pro',                                // MiMo V2 Pro — 1T+ params, agentic
  'deepseek/deepseek-r1',                              // DeepSeek R1 — chain-of-thought reasoning
  'mistralai/mistral-large-2411',                      // Mistral Large — multilingual, structured
];

export const MODEL_CATALOG = {
  free: FREE_MODELS,
  premium: PREMIUM_MODELS,
};

// ═══════════════════════════════════════════════════════════════════════════
// AUTORESEARCH EVALUATOR RUBRIC
// ═══════════════════════════════════════════════════════════════════════════

export const EVALUATOR_RUBRIC = `You are a question quality evaluator. Evaluate each question on these criteria (1-10 scale):

1. **Clarity** (1-10): Is the question clear and unambiguous? No confusing wording?
2. **Difficulty** (1-10): Is it appropriately challenging? (not trivially obvious, not impossible)
3. **Discrimination** (1-10): Do all options seem plausible? Are wrong answers tempting but incorrect?
4. **Relevance** (1-10): Does it test real understanding of the course content?
5. **Language** (1-10): Is the Portuguese natural, correct, and professional?

Return as JSON array:
[
  {
    "questionId": "...",
    "clarity": 8,
    "difficulty": 7,
    "discrimination": 9,
    "relevance": 8,
    "language": 9,
    "overallScore": 8.2,
    "notes": "Strong question, good discrimination between answer options."
  }
]`;

// ═══════════════════════════════════════════════════════════════════════════
// QUIZ CONFIG INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export interface QuizConfig {
  // Model selection
  activeModels: string[];                        // Currently enabled models to use
  modelCatalog: { free: string[]; premium: string[] };

  // System prompt and generation settings
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  evaluatorPrompt: string;

  // Question bank settings
  preferQuestionBankOverAI: boolean;             // Use bank when available and high quality
  questionBankMinQualityScore: number;           // Min score (0-10) for questions in bank
  questionBankMinQuestions: number;              // Min questions in bank before preferring bank
  qualityThresholds: {
    activeThreshold: number;                     // Min score to mark as 'active'
    retireThreshold: number;                     // Score below this auto-retires
  };

  // Fallback questions (legacy support)
  fallbackQuestions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;

  // Quiz parameters
  TOTAL_QUESTIONS: number;
  PASSING_SCORE: number;
  MAX_ATTEMPTS: number;
  MIN_PROGRESS_PERCENT: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_SYSTEM_PROMPT = `You are an expert academic assessment specialist. Your task is to generate high-quality multiple-choice questions that evaluate students' deep understanding of course content.

REQUIREMENTS:
- Generate exactly 10 multiple-choice questions
- Each question must have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Questions must test genuine understanding, not just memorization
- Questions should cover different topics from the course content
- Difficulty should range from moderate to challenging
- All text must be in Portuguese (Brazilian)
- Wrong answer options must be plausible and tempting (good discrimination)
- CRITICAL — the correct answer must NOT be identifiable without reading the course content:
  * All 4 options must have SIMILAR LENGTH (within ~20% of each other) and the same grammatical structure and level of detail
  * NEVER make the correct option the longest, most elaborate, most nuanced or most "textbook-sounding" one
  * Each wrong option must be a real misconception a student could hold (a common confusion, an outdated fact, a subtly wrong number or term) — never absurd, jokey or obviously off-topic
  * At least 2 questions should have a correct answer that is SHORTER than some wrong options
  * A reader who never saw the course must score ~25% (chance level) on these questions
- Return ONLY valid JSON, no markdown, no explanations

Return this JSON format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

correctAnswer is the 0-based index (0-3) of the correct option.`;

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT FALLBACK QUESTIONS
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_FALLBACK_QUESTIONS = [
  {
    question: "Qual é a principal vantagem de usar prompts bem estruturados ao interagir com uma IA?",
    options: ["Maior velocidade de resposta", "Respostas mais precisas e relevantes", "Menor uso de tokens", "Interface mais bonita"],
    correctAnswer: 1,
  },
  {
    question: "O que significa 'context window' em modelos de linguagem?",
    options: ["A janela do navegador", "O limite de texto que o modelo pode processar de uma vez", "O tempo de resposta", "A tela de configurações"],
    correctAnswer: 1,
  },
  {
    question: "Qual técnica consiste em pedir ao modelo que mostre seu raciocínio passo a passo?",
    options: ["Few-Shot Learning", "Chain-of-Thought", "Negative Prompting", "Role Prompting"],
    correctAnswer: 1,
  },
  {
    question: "O que é 'temperature' no contexto de modelos de IA?",
    options: ["A velocidade de processamento", "Um parâmetro que controla a criatividade/aleatoriedade das respostas", "A temperatura do servidor", "O nível de dificuldade das perguntas"],
    correctAnswer: 1,
  },
  {
    question: "Qual é a melhor prática ao dar contexto para uma IA?",
    options: ["Escrever o máximo possível sem filtrar", "Fornecer informações específicas e relevantes para a tarefa", "Não dar contexto nenhum", "Usar apenas emojis"],
    correctAnswer: 1,
  },
  {
    question: "O que é Few-Shot Learning?",
    options: ["Aprender com poucos recursos computacionais", "Dar exemplos do resultado esperado antes de pedir a tarefa", "Treinar o modelo do zero", "Usar a IA sem internet"],
    correctAnswer: 1,
  },
  {
    question: "Qual é o risco principal de confiar cegamente nas respostas de uma IA?",
    options: ["O custo financeiro", "Alucinações — a IA pode gerar informações falsas com confiança", "A lentidão das respostas", "Problemas de conexão"],
    correctAnswer: 1,
  },
  {
    question: "O que é um 'system prompt'?",
    options: ["Uma mensagem de erro do sistema", "Uma instrução inicial que define o comportamento e personalidade da IA", "O prompt que o sistema gera automaticamente", "Uma atualização do software"],
    correctAnswer: 1,
  },
  {
    question: "Qual a importância da iteração em prompt engineering?",
    options: ["Nenhuma — o primeiro prompt deve ser perfeito", "Permite refinar progressivamente os resultados até atingir a qualidade desejada", "Serve apenas para testes", "É uma prática obsoleta"],
    correctAnswer: 1,
  },
  {
    question: "Como a LGPD afeta o uso de IA no Brasil?",
    options: ["Não tem relação com IA", "Proíbe completamente o uso de IA", "Exige cuidado ao enviar dados pessoais para modelos de IA", "Só afeta empresas de tecnologia"],
    correctAnswer: 2,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_QUIZ_CONFIG: QuizConfig = {
  // Use the most reliable free models by default
  activeModels: [
    'openrouter/free',
    'stepfun/step-3.5-flash:free',
  ],

  modelCatalog: MODEL_CATALOG,

  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  temperature: 0.7,
  maxTokens: 4000,
  evaluatorPrompt: EVALUATOR_RUBRIC,

  preferQuestionBankOverAI: true,
  questionBankMinQualityScore: 7,
  questionBankMinQuestions: 15,
  qualityThresholds: {
    activeThreshold: 7,
    retireThreshold: 5,
  },

  fallbackQuestions: DEFAULT_FALLBACK_QUESTIONS,

  TOTAL_QUESTIONS: 10,
  PASSING_SCORE: 70,
  MAX_ATTEMPTS: 3,
  MIN_PROGRESS_PERCENT: 100,
};

/**
 * Get current quiz configuration.
 * In the future, this will load from Mission Control's data store.
 * For now, it returns the default configuration.
 */
export function getQuizConfig(): QuizConfig {
  return { ...DEFAULT_QUIZ_CONFIG };
}
