/**
 * Quiz Configuration
 * Centralized quiz generation settings used by the quiz API route.
 * This file acts as the default configuration. In the future, this can be
 * loaded from Mission Control's quiz-config.json file.
 *
 * Updated: 2026-03-23
 */

export interface QuizConfig {
  models: string[];
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  fallbackQuestions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
  TOTAL_QUESTIONS: number;
  PASSING_SCORE: number;
  MAX_ATTEMPTS: number;
  MIN_PROGRESS_PERCENT: number;
}

// Default fallback questions (generic but valid, used when AI fails)
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

const DEFAULT_SYSTEM_PROMPT = `You are an academic assessment expert. Generate exactly 10 multiple-choice questions to evaluate a student's understanding of the course content provided.

Rules:
- Questions must test genuine understanding, not just memorization
- Each question must have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Questions should cover different topics from the content
- Difficulty should be moderate to challenging
- Questions should be in Portuguese (Brazilian)
- Return ONLY valid JSON, no markdown

Return format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

correctAnswer is the 0-based index of the correct option.`;

/**
 * Default quiz configuration.
 * These values are used by the quiz generation API route.
 * To update, edit this file or configure via Mission Control's Quiz Configuration page.
 */
export const DEFAULT_QUIZ_CONFIG: QuizConfig = {
  // OpenRouter model IDs to try (in order of preference)
  models: [
    'openrouter/free',                      // Smart router — auto-selects best available free model
    'stepfun/step-3.5-flash:free',          // 196B MoE (11B active), 256k ctx, strong reasoning
  ],

  // System prompt for quiz generation
  systemPrompt: DEFAULT_SYSTEM_PROMPT,

  // Temperature: controls creativity/randomness (0-1, where 0 is deterministic, 1 is very random)
  temperature: 0.7,

  // Max tokens per response
  maxTokens: 4000,

  // Static fallback questions used when AI generation fails
  fallbackQuestions: DEFAULT_FALLBACK_QUESTIONS,

  // ─── Quiz Configuration Constants ─────────────────────────────────────
  // Number of questions in each quiz
  TOTAL_QUESTIONS: 10,

  // Minimum score (%) required to pass the quiz
  PASSING_SCORE: 70,

  // Maximum number of attempts allowed per course per user
  MAX_ATTEMPTS: 3,

  // Minimum course completion (%) before user can take quiz
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
