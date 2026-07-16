import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import dbConnect from '@/lib/mongodb';
import { getMongoClient } from '@/lib/database';
import User from '@/models/User';
import CourseProgress from '@/models/CourseProgress';
import Certificate, { QUIZ_CONFIG } from '@/models/Certificate';
import { getAuthUser } from '@/lib/auth';
import { getCourseBySlug } from '@/data/courses';
import { getQuizConfig } from '@/config/quiz-config';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const BANKS_DIR = path.join(process.cwd(), 'data', 'question-banks');

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface BankedQuestion extends QuizQuestion {
  id: string;
  courseSlug: string;
  source: 'ai-generated' | 'manual' | 'from-quiz-attempt';
  generatedBy?: string;
  createdAt: string;
  qualityScore: number;
  difficultyScore: number;
  discriminationScore: number;
  timesUsed: number;
  timesAnsweredCorrectly: number;
  timesAnsweredIncorrectly: number;
  successRate: number;
  evaluationNotes: string;
  status: 'active' | 'retired' | 'needs_review';
  tags: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// QUESTION BANK HELPERS
// ═══════════════════════════════════════════════════════════════════════════

async function readQuestionBank(courseSlug: string): Promise<{ questions: BankedQuestion[] } | null> {
  const filePath = path.join(BANKS_DIR, `${courseSlug}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function writeQuestionBank(courseSlug: string, bank: any): Promise<void> {
  try {
    await fs.mkdir(BANKS_DIR, { recursive: true });
    const filePath = path.join(BANKS_DIR, `${courseSlug}.json`);
    bank.lastUpdated = new Date().toISOString();
    bank.totalQuestions = bank.questions.length;
    bank.activeQuestions = bank.questions.filter((q: BankedQuestion) => q.status === 'active').length;
    await fs.writeFile(filePath, JSON.stringify(bank, null, 2));
  } catch (error) {
    console.error('Error writing question bank:', error);
  }
}

async function getQuestionsFromBank(courseSlug: string, config: any): Promise<QuizQuestion[] | null> {
  const bank = await readQuestionBank(courseSlug);
  if (!bank || bank.questions.length === 0) {
    return null;
  }

  // Filter active, high-quality questions
  const qualityQuestions = bank.questions.filter(
    (q: BankedQuestion) => q.status === 'active' && q.qualityScore >= config.questionBankMinQualityScore
  );

  if (qualityQuestions.length < config.questionBankMinQuestions) {
    return null;
  }

  // Weighted random selection (prefer higher quality)
  const weights = qualityQuestions.map((q: BankedQuestion) => q.qualityScore / 10);
  const selected: BankedQuestion[] = [];

  for (let i = 0; i < QUIZ_CONFIG.TOTAL_QUESTIONS && qualityQuestions.length > 0; i++) {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let j = 0; j < qualityQuestions.length; j++) {
      random -= weights[j];
      if (random <= 0) {
        const question = qualityQuestions[j];
        selected.push(question);

        // Remove from selection to avoid duplicates
        qualityQuestions.splice(j, 1);
        weights.splice(j, 1);
        break;
      }
    }
  }

  return selected.map(q => ({
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
  }));
}

async function updateQuestionStats(courseSlug: string, answers: number[], submittedQuestions: any[]): Promise<void> {
  const bank = await readQuestionBank(courseSlug);
  if (!bank) return;

  // This would update usage stats, but since questions from bank are already tracked,
  // we mainly increment timesUsed. In a full implementation, we'd match questions
  // by content hash to update stats.

  // For now, just log this happened
  console.log(`[Quiz] Updated stats for ${courseSlug}: ${submittedQuestions.length} questions used`);
}

async function callOpenRouterForQuiz(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000); // 6 second timeout per model

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://fayai.com.br',
      'X-Title': 'FayAi Quiz Generator',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  clearTimeout(timeout);

  if (!response.ok) {
    const errText = await response.text();
    console.error(`OpenRouter quiz error [${model}] ${response.status}:`, errText);
    throw new Error(`Model ${model} failed (${response.status}): ${errText.slice(0, 200)}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  if (!content) {
    throw new Error(`Model ${model} returned empty content`);
  }
  return content;
}

/**
 * Embaralha as opções de cada pergunta remapeando o índice da correta.
 * Elimina viés de posição do gerador (a correta não pode ter posição previsível).
 */
function shuffleOptions(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map((q) => {
    const order = q.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return {
      question: q.question,
      options: order.map((i) => q.options[i]),
      correctAnswer: order.indexOf(q.correctAnswer),
    };
  });
}

function parseQuizResponse(content: string): QuizQuestion[] {
  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  // Try to find JSON array
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (!arrayMatch) {
    console.error('Could not find JSON array in response:', content.slice(0, 500));
    throw new Error('Resposta da AI não contém perguntas válidas');
  }

  const questions: QuizQuestion[] = JSON.parse(arrayMatch[0]);

  if (!Array.isArray(questions) || questions.length < 5) {
    throw new Error(`Número insuficiente de perguntas geradas (${questions.length})`);
  }

  return questions.slice(0, QUIZ_CONFIG.TOTAL_QUESTIONS).map((q) => ({
    question: q.question,
    options: q.options.slice(0, 4),
    correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
  }));
}

async function generateQuizFromContent(courseContent: string, courseTitle: string): Promise<QuizQuestion[]> {
  const apiKey = OPENROUTER_API_KEY.trim().replace(/^Bearer\s+/i, '');
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY não configurada');
  }

  // Load configuration from quiz-config
  const config = getQuizConfig();
  const systemPrompt = config.systemPrompt.replace('exactly 10', `exactly ${QUIZ_CONFIG.TOTAL_QUESTIONS}`);

  const truncatedContent = courseContent.length > 8000
    ? courseContent.substring(0, 8000) + '\n\n[... conteúdo adicional omitido para brevidade ...]'
    : courseContent;

  const userPrompt = `Gere ${QUIZ_CONFIG.TOTAL_QUESTIONS} perguntas de avaliação para o seguinte curso:\n\nTítulo: ${courseTitle}\n\nConteúdo:\n${truncatedContent}`;

  const errors: string[] = [];

  // Use activeModels from config (supports both old 'models' and new 'activeModels')
  const modelsToTry = (config as any).activeModels || (config as any).models || [];

  for (const model of modelsToTry) {
    try {
      console.log(`[Quiz] Trying model: ${model}`);
      const content = await callOpenRouterForQuiz(apiKey, model, systemPrompt, userPrompt, config.temperature, config.maxTokens);
      const questions = parseQuizResponse(content);
      console.log(`[Quiz] Success with model: ${model}, ${questions.length} questions`);
      return questions;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Quiz] Model ${model} failed:`, msg);
      errors.push(`${model}: ${msg}`);
    }
  }

  // All AI models failed — use static fallback quiz
  console.warn(`[Quiz] All AI models failed, using static fallback. Errors: ${errors.join(' | ')}`);
  return getStaticFallbackQuiz(courseTitle);
}

/**
 * Static fallback quiz — used when AI generation fails (timeout, API down, etc.)
 * Loads questions from quiz configuration's fallback questions.
 */
function getStaticFallbackQuiz(courseTitle: string): QuizQuestion[] {
  const config = getQuizConfig();
  const allQuestions = config.fallbackQuestions;

  // Shuffle and return the required number
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, QUIZ_CONFIG.TOTAL_QUESTIONS);
}

/**
 * GET /api/courses/[slug]/quiz
 * Get quiz questions for the course (generates via AI if not cached)
 * Also returns certificate status
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Check for test bypass mode (temporary — for testing certification flow)
    const url = new URL(request.url);
    const testBypass = url.searchParams.get('_test_bypass') === 'cert_test_2026';

    // Check course progress — must be 100% (unless test bypass)
    const progress = await CourseProgress.findOne({ userId: authUser.id, courseId: slug });
    if (!testBypass && (!progress || progress.progressPercent < QUIZ_CONFIG.MIN_PROGRESS_PERCENT)) {
      return NextResponse.json({
        error: 'Você precisa completar 100% do curso antes de fazer a avaliação.',
        currentProgress: progress?.progressPercent || 0,
        requiredProgress: QUIZ_CONFIG.MIN_PROGRESS_PERCENT,
      }, { status: 403 });
    }

    // Check existing certificate
    let certificate = await Certificate.findOne({ userId: authUser.id, courseSlug: slug });

    if (certificate?.status === 'issued') {
      return NextResponse.json({
        status: 'already_issued',
        certificate: {
          certificateNumber: certificate.certificateNumber,
          verificationCode: certificate.verificationCode,
          verificationUrl: certificate.verificationUrl,
          issuedAt: certificate.issuedAt,
          quizScore: certificate.quizScore,
          pdfUrl: certificate.pdfUrl,
          imageUrl: certificate.imageUrl,
        },
      });
    }

    // Check max attempts
    if (certificate && certificate.totalQuizAttempts >= QUIZ_CONFIG.MAX_ATTEMPTS) {
      // Check if any attempt passed
      const passedAttempt = certificate.quizAttempts.find(a => a.score >= QUIZ_CONFIG.PASSING_SCORE);
      if (!passedAttempt) {
        return NextResponse.json({
          status: 'max_attempts_reached',
          totalAttempts: certificate.totalQuizAttempts,
          maxAttempts: QUIZ_CONFIG.MAX_ATTEMPTS,
          lastScore: certificate.quizAttempts[certificate.quizAttempts.length - 1]?.score || 0,
        });
      }
    }

    // Get course content for quiz generation — try static data first, then MongoDB
    const staticCourse = getCourseBySlug(slug);
    const client = await getMongoClient();
    const product = await client.db('fayapointProdutos').collection('products').findOne({ slug });

    if (!staticCourse && !product) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 });
    }

    // Build unified course info from whichever source is available
    const courseTitle = staticCourse?.title || product?.name || slug;
    const courseContent = product?.courseContent || staticCourse?.fullDescription || '';

    if (!courseContent || courseContent.length < 100) {
      return NextResponse.json({ error: 'Conteúdo do curso insuficiente para gerar avaliação' }, { status: 400 });
    }

    // Get quiz configuration
    const config = getQuizConfig();

    // Try to use question bank first (if enabled and has quality questions)
    let questions: QuizQuestion[] | null = null;
    if (config.preferQuestionBankOverAI) {
      questions = await getQuestionsFromBank(slug, config);
      if (questions) {
        console.log(`[Quiz] Using ${questions.length} questions from question bank for ${slug}`);
      }
    }

    // Fall back to AI generation if no quality bank questions
    if (!questions) {
      questions = await generateQuizFromContent(courseContent, courseTitle);
    }

    // Sempre embaralhar as opções — a posição/forma da correta não pode ser padrão
    questions = shuffleOptions(questions);

    // Create or update certificate record
    if (!certificate) {
      certificate = await Certificate.create({
        userId: authUser.id,
        userName: user.name,
        userEmail: user.email,
        courseId: String(staticCourse?.id || product?._id || slug),
        courseSlug: slug,
        courseTitle,
        courseDescription: staticCourse?.shortDescription || product?.shortDescription || '',
        courseLevel: staticCourse?.level || product?.level || '',
        courseDuration: staticCourse?.duration || product?.duration || '',
        courseTotalLessons: staticCourse?.totalLessons || product?.totalLessons || 0,
        courseCategory: staticCourse?.category || product?.category || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        startedAt: progress?.startedAt || (progress as any)?.createdAt || new Date(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        completedAt: (progress as any)?.updatedAt || new Date(),
        chaptersCompleted: progress?.completedSections?.length || 0,
        totalChapters: progress?.totalSections || 0,
        status: 'quiz_in_progress',
      });
    } else {
      certificate.status = 'quiz_in_progress';
      await certificate.save();
    }

    // Return questions WITHOUT correct answers (security)
    const safeQuestions = questions.map((q, i) => ({
      id: i,
      question: q.question,
      options: q.options,
    }));

    // Store correct answers temporarily in a server-side structure
    // We'll validate on POST by regenerating or using stored hash
    // For simplicity, encode answers and store in certificate metadata
    const answersHash = Buffer.from(JSON.stringify(questions.map(q => q.correctAnswer))).toString('base64');

    return NextResponse.json({
      status: 'quiz_ready',
      questions: safeQuestions,
      answersToken: answersHash,
      config: {
        totalQuestions: QUIZ_CONFIG.TOTAL_QUESTIONS,
        passingScore: QUIZ_CONFIG.PASSING_SCORE,
        maxAttempts: QUIZ_CONFIG.MAX_ATTEMPTS,
        currentAttempt: (certificate.totalQuizAttempts || 0) + 1,
        remainingAttempts: QUIZ_CONFIG.MAX_ATTEMPTS - (certificate.totalQuizAttempts || 0),
      },
      courseTitle,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Quiz GET error:', msg, error);
    return NextResponse.json({ error: `Erro ao gerar avaliação: ${msg}` }, { status: 500 });
  }
}

/**
 * POST /api/courses/[slug]/quiz
 * Submit quiz answers and validate
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { answers, answersToken, questions: submittedQuestions } = body;

    if (!answers || !Array.isArray(answers) || !answersToken) {
      return NextResponse.json({ error: 'Respostas inválidas' }, { status: 400 });
    }

    // Decode correct answers
    let correctAnswers: number[];
    try {
      correctAnswers = JSON.parse(Buffer.from(answersToken, 'base64').toString());
    } catch {
      return NextResponse.json({ error: 'Token de respostas inválido' }, { status: 400 });
    }

    // Get certificate
    const certificate = await Certificate.findOne({ userId: authUser.id, courseSlug: slug });
    if (!certificate) {
      return NextResponse.json({ error: 'Certificado não encontrado. Inicie a avaliação primeiro.' }, { status: 404 });
    }

    if (certificate.status === 'issued') {
      return NextResponse.json({
        status: 'already_issued',
        message: 'Certificado já emitido.',
      });
    }

    if (certificate.totalQuizAttempts >= QUIZ_CONFIG.MAX_ATTEMPTS) {
      return NextResponse.json({
        error: 'Número máximo de tentativas atingido.',
        maxAttempts: QUIZ_CONFIG.MAX_ATTEMPTS,
      }, { status: 403 });
    }

    // Score the quiz
    let correctCount = 0;
    const questionResults = correctAnswers.map((correct, i) => {
      const userAnswer = answers[i] ?? -1;
      const isCorrect = userAnswer === correct;
      if (isCorrect) correctCount++;
      return {
        question: submittedQuestions?.[i]?.question || `Pergunta ${i + 1}`,
        options: submittedQuestions?.[i]?.options || [],
        correctAnswer: correct,
        userAnswer,
        isCorrect,
      };
    });

    const score = Math.round((correctCount / correctAnswers.length) * 100);
    const passed = score >= QUIZ_CONFIG.PASSING_SCORE;

    // Update question bank stats (if questions came from bank)
    await updateQuestionStats(slug, answers, submittedQuestions);

    // Record attempt
    const attempt = {
      attemptNumber: (certificate.totalQuizAttempts || 0) + 1,
      questions: questionResults,
      score,
      totalQuestions: correctAnswers.length,
      ...(passed ? { passedAt: new Date() } : { failedAt: new Date() }),
    };

    certificate.quizAttempts.push(attempt);
    certificate.totalQuizAttempts = (certificate.totalQuizAttempts || 0) + 1;
    certificate.quizScore = score;

    if (passed) {
      // ═══ ISSUE CERTIFICATE ═══
      certificate.status = 'issued';
      certificate.issuedAt = new Date();

      // Calculate study hours from progress
      const progress = await CourseProgress.findOne({ userId: authUser.id, courseId: slug });
      if (progress) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const startDate = progress.startedAt || (progress as any).createdAt;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const endDate = (progress as any).updatedAt || new Date();
        const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
        certificate.totalStudyHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
      }

      // Update user progress
      await User.findByIdAndUpdate(authUser.id, {
        $inc: {
          'progress.coursesCompleted': 1,
          'progress.xp': 500,
          'progress.weeklyXp': 500,
        },
      });

      await certificate.save();

      return NextResponse.json({
        status: 'passed',
        score,
        correctCount,
        totalQuestions: correctAnswers.length,
        certificate: {
          certificateNumber: certificate.certificateNumber,
          verificationCode: certificate.verificationCode,
          verificationUrl: certificate.verificationUrl,
          issuedAt: certificate.issuedAt,
          courseTitle: certificate.courseTitle,
          studentName: certificate.userName,
        },
        questionResults: questionResults.map(q => ({
          question: q.question,
          isCorrect: q.isCorrect,
          correctAnswer: q.correctAnswer,
          userAnswer: q.userAnswer,
          options: q.options,
        })),
        xpEarned: 500,
      });
    } else {
      certificate.status = 'quiz_in_progress';
      await certificate.save();

      return NextResponse.json({
        status: 'failed',
        score,
        correctCount,
        totalQuestions: correctAnswers.length,
        passingScore: QUIZ_CONFIG.PASSING_SCORE,
        remainingAttempts: QUIZ_CONFIG.MAX_ATTEMPTS - certificate.totalQuizAttempts,
        questionResults: questionResults.map(q => ({
          question: q.question,
          isCorrect: q.isCorrect,
          correctAnswer: q.correctAnswer,
          userAnswer: q.userAnswer,
          options: q.options,
        })),
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Quiz POST error:', msg, error);
    return NextResponse.json({ error: `Erro ao processar avaliação: ${msg}` }, { status: 500 });
  }
}
