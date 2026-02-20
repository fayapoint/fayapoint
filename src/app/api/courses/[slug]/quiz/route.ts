import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getMongoClient } from '@/lib/database';
import User from '@/models/User';
import CourseProgress from '@/models/CourseProgress';
import Certificate, { QUIZ_CONFIG } from '@/models/Certificate';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import { getCourseBySlug } from '@/data/courses';

const JWT_SECRET = process.env.JWT_SECRET || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

async function requireAuth(): Promise<{ userId: string } | { error: NextResponse }> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (typeof decoded === 'string' || !decoded || !(decoded as { id: string }).id) {
      return { error: NextResponse.json({ error: 'Token inválido' }, { status: 401 }) };
    }
    return { userId: (decoded as { id: string }).id };
  } catch {
    return { error: NextResponse.json({ error: 'Token inválido' }, { status: 401 }) };
  }
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

const QUIZ_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-2.5-flash-preview',
  'meta-llama/llama-3.3-70b-instruct:free',
];

async function callOpenRouterForQuiz(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://fayapoint.com',
      'X-Title': 'FayaPoint Quiz Generator',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

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

  const systemPrompt = `You are an academic assessment expert. Generate exactly ${QUIZ_CONFIG.TOTAL_QUESTIONS} multiple-choice questions to evaluate a student's understanding of the course content provided. 

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

  const truncatedContent = courseContent.length > 8000
    ? courseContent.substring(0, 8000) + '\n\n[... conteúdo adicional omitido para brevidade ...]'
    : courseContent;

  const userPrompt = `Gere ${QUIZ_CONFIG.TOTAL_QUESTIONS} perguntas de avaliação para o seguinte curso:\n\nTítulo: ${courseTitle}\n\nConteúdo:\n${truncatedContent}`;

  const errors: string[] = [];

  for (const model of QUIZ_MODELS) {
    try {
      console.log(`[Quiz] Trying model: ${model}`);
      const content = await callOpenRouterForQuiz(apiKey, model, systemPrompt, userPrompt);
      const questions = parseQuizResponse(content);
      console.log(`[Quiz] Success with model: ${model}, ${questions.length} questions`);
      return questions;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Quiz] Model ${model} failed:`, msg);
      errors.push(`${model}: ${msg}`);
    }
  }

  throw new Error(`Todos os modelos de IA falharam ao gerar o quiz. Detalhes: ${errors.join(' | ')}`);
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
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    await dbConnect();

    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Check course progress — must be 100%
    const progress = await CourseProgress.findOne({ userId: auth.userId, courseId: slug });
    if (!progress || progress.progressPercent < QUIZ_CONFIG.MIN_PROGRESS_PERCENT) {
      return NextResponse.json({
        error: 'Você precisa completar 100% do curso antes de fazer a avaliação.',
        currentProgress: progress?.progressPercent || 0,
        requiredProgress: QUIZ_CONFIG.MIN_PROGRESS_PERCENT,
      }, { status: 403 });
    }

    // Check existing certificate
    let certificate = await Certificate.findOne({ userId: auth.userId, courseSlug: slug });

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

    // Get course content for quiz generation
    const courseData = getCourseBySlug(slug);
    if (!courseData) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 });
    }

    // Fetch course content from MongoDB
    const client = await getMongoClient();
    const product = await client.db('fayapointProdutos').collection('products').findOne({ slug });
    const courseContent = product?.courseContent || courseData.fullDescription || '';

    if (!courseContent || courseContent.length < 100) {
      return NextResponse.json({ error: 'Conteúdo do curso insuficiente para gerar avaliação' }, { status: 400 });
    }

    // Generate quiz questions via AI
    const questions = await generateQuizFromContent(courseContent, courseData.title);

    // Create or update certificate record
    if (!certificate) {
      certificate = await Certificate.create({
        userId: auth.userId,
        userName: user.name,
        userEmail: user.email,
        courseId: String(courseData.id),
        courseSlug: slug,
        courseTitle: courseData.title,
        courseDescription: courseData.shortDescription || '',
        courseLevel: courseData.level || '',
        courseDuration: courseData.duration || '',
        courseTotalLessons: courseData.totalLessons || 0,
        courseCategory: courseData.category || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        startedAt: progress.startedAt || (progress as any).createdAt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        completedAt: (progress as any).updatedAt,
        chaptersCompleted: progress.completedSections?.length || 0,
        totalChapters: progress.totalSections || 0,
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
      courseTitle: courseData.title,
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
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    await dbConnect();

    const user = await User.findById(auth.userId);
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
    const certificate = await Certificate.findOne({ userId: auth.userId, courseSlug: slug });
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
      const progress = await CourseProgress.findOne({ userId: auth.userId, courseId: slug });
      if (progress) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const startDate = progress.startedAt || (progress as any).createdAt;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const endDate = (progress as any).updatedAt || new Date();
        const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
        certificate.totalStudyHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
      }

      // Update user progress
      await User.findByIdAndUpdate(auth.userId, {
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
