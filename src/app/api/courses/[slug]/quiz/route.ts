import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import dbConnect from '@/lib/mongodb';
import { getMongoClient } from '@/lib/database';
import User from '@/models/User';
import CourseProgress from '@/models/CourseProgress';
import Certificate, { QUIZ_CONFIG } from '@/models/Certificate';
import { getAuthUser } from '@/lib/auth';
import { debitar, saldoParaGastar } from '@/lib/creditos';
import { CREDIT_PACKS, TIER_CONFIGS, resolvePlan } from '@/lib/course-tiers';
import { precoDe } from '@/lib/precos-runtime';
import { getCourseBySlug } from '@/data/courses';
import { getQuizConfig } from '@/config/quiz-config';
import { resolveContentFacts } from '@/lib/content-facts';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const BANKS_DIR = path.join(process.cwd(), 'data', 'question-banks');

/**
 * Quanto tempo uma prova aberta continua valendo: **2 horas**.
 *
 * Longo o bastante para quem foi almoçar no meio, curto o bastante para que
 * uma prova esquecida numa aba não vire um gabarito guardado. Depois disso, o
 * próximo `GET` monta uma prova nova — sem consumir tentativa, porque tentativa
 * só é consumida quando a prova é ENTREGUE.
 */
const VALIDADE_PROVA_MS = 2 * 60 * 60 * 1000;

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

  /**
   * ── A MISTURA DE DIFICULDADE (17/08/2026) ────────────────────────────────
   *
   * Antes, a seleção sorteava ponderando **só por `qualityScore`** e ignorava o
   * `difficultyScore` que cada questão carrega. Consequência: duas provas do
   * mesmo curso podiam sair uma fácil e outra impossível, por sorteio — com a
   * MESMA nota de corte de 70% para as duas. Isso não é rigor, é ruído, e ainda
   * por cima num portão que emite certificado.
   *
   * A cota é a do plano de 16/08: **4 fáceis · 2 médias · 4 difíceis** em cada
   * prova de 10. Se uma faixa não tiver questões suficientes, o que falta é
   * preenchido com o resto do banco — devolver uma prova de 7 perguntas seria
   * pior que devolver uma prova com a mistura torta.
   *
   * A ponderação por qualidade continua valendo DENTRO de cada faixa.
   */
  const FAIXAS = {
    facil: (q: BankedQuestion) => q.difficultyScore <= 4,
    media: (q: BankedQuestion) => q.difficultyScore > 4 && q.difficultyScore <= 7,
    dificil: (q: BankedQuestion) => q.difficultyScore > 7,
  };
  const COTA: Array<[keyof typeof FAIXAS, number]> = [
    ['dificil', 4],
    ['media', 2],
    ['facil', 4],
  ];

  const selected: BankedQuestion[] = [];
  const sortearDe = (pool: BankedQuestion[], quantas: number) => {
    const pesos = pool.map((q) => Math.max(0.1, q.qualityScore / 10));
    for (let i = 0; i < quantas && pool.length > 0; i++) {
      const total = pesos.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      for (let j = 0; j < pool.length; j++) {
        r -= pesos[j];
        if (r <= 0) {
          selected.push(pool[j]);
          pool.splice(j, 1);
          pesos.splice(j, 1);
          break;
        }
      }
    }
  };

  const restante = [...qualityQuestions];
  for (const [faixa, quantas] of COTA) {
    const antes = selected.length;
    sortearDe(restante.filter(FAIXAS[faixa]), quantas);
    // Tira do restante o que já entrou, para o preenchimento não repetir.
    for (const q of selected.slice(antes)) {
      const i = restante.indexOf(q);
      if (i !== -1) restante.splice(i, 1);
    }
  }
  // Faixa magra: completa com o que sobrou, mantendo as 10 perguntas.
  if (selected.length < QUIZ_CONFIG.TOTAL_QUESTIONS) {
    sortearDe(restante, QUIZ_CONFIG.TOTAL_QUESTIONS - selected.length);
  }

  // Sem embaralhar, a prova sairia sempre na mesma ordem — 4 difíceis, 2 médias,
  // 4 fáceis — e o aluno aprenderia a ORDEM em vez do conteúdo.
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
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
  // 02/08: 6s -> 25s. Medido com o DeepSeek V4 Flash, que agora encabeça a
  // lista: um quiz de 5 perguntas leva ~10s porque ele raciocina antes de
  // escrever (786 tokens de pensamento nessa medição). Com 6s TODA tentativa
  // era abortada pelo cliente e o quiz caía no banco de questões sem que
  // nenhum log dissesse "estourou o tempo" — só "modelo falhou".
  const timeout = setTimeout(() => controller.abort(), 25000);

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

  /**
   * ⚠️ **O QUIZ GENÉRICO DEIXOU DE EMITIR CERTIFICADO** (11/08/2026).
   *
   * Aqui havia `getStaticFallbackQuiz()`: quando todos os modelos falhavam, a
   * rota devolvia dez perguntas fixas do `quiz-config` — sobre *prompt
   * engineering*, LGPD e "o que é temperature" — **para qualquer curso**. Quem
   * pegasse esse momento respondia perguntas de ChatGPT e recebia um
   * certificado de "Leonardo AI: criação visual", verificável em endereço
   * público, com o nome dele e o nome do curso errado dentro.
   *
   * Era tolerável quando o certificado custava 15 e ninguém cobrava. Não é
   * tolerável a R$50 com a palavra *verificável* na vitrine: o certificado vale
   * pela prova, e uma prova que não fala do curso não é prova de nada.
   *
   * Falhar aqui é a resposta certa. A rota devolve 503 e o aluno tenta de novo
   * em alguns minutos, sem ter consumido tentativa nem crédito — o pior que
   * acontece é um adiamento, contra um documento falso que fica de pé para
   * sempre.
   */
  console.error(`[Quiz] Nenhum modelo respondeu para "${courseTitle}". Erros: ${errors.join(' | ')}`);
  throw new QuizIndisponivel(
    'Não consegui montar a avaliação deste curso agora. Tente de novo em alguns minutos — nada foi cobrado.',
  );
}

/** Falha temporária de geração: vira 503, não 500 nem certificado genérico. */
class QuizIndisponivel extends Error {}

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

    /**
     * ⚠️ O ATALHO DE TESTE FOI REMOVIDO (11/08/2026).
     *
     * Havia aqui `?_test_bypass=cert_test_2026`, que pulava a exigência de ter
     * lido 100% do curso. A senha estava no código que vai para o navegador,
     * então não era um atalho nosso: era um atalho de **qualquer pessoa**.
     * Com o certificado a R$50 e vendido como verificável, um parâmetro de URL
     * que dispensa o curso é o oposto do que o preço promete.
     *
     * A regra da casa, de 29/07: **parâmetro de teste pode ENDURECER, nunca
     * afrouxar.** Para testar o fluxo, marque o progresso do curso — que é o
     * que o aluno faz.
     */
    const progress = await CourseProgress.findOne({ userId: authUser.id, courseId: slug });
    if (!progress || progress.progressPercent < QUIZ_CONFIG.MIN_PROGRESS_PERCENT) {
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

    /**
     * ── A PROVA ABERTA É REAPROVEITADA (11/08/2026) ────────────────────────
     *
     * Antes, cada `GET` gerava um conjunto novo de perguntas e nenhuma
     * tentativa era consumida por isso. Dava para recarregar a página até
     * aparecer um conjunto fácil — e, como o gabarito viajava junto, nem era
     * preciso: bastava ler. O limite de 3 tentativas media a coisa errada.
     *
     * Agora, enquanto houver prova aberta e dentro da validade, o `GET`
     * devolve **a mesma prova**. Recarregar a página deixa de ser uma jogada.
     */
    if (certificate?.provaPendente && certificate.provaPendente.expiraEm > new Date()) {
      const aberta = certificate.provaPendente;
      return NextResponse.json({
        status: 'quiz_ready',
        questions: aberta.perguntas.map((q, i) => ({ id: i, question: q.question, options: q.options })),
        answersToken: aberta.nonce,
        expiraEm: aberta.expiraEm,
        config: {
          totalQuestions: aberta.perguntas.length,
          passingScore: QUIZ_CONFIG.PASSING_SCORE,
          maxAttempts: QUIZ_CONFIG.MAX_ATTEMPTS,
          currentAttempt: (certificate.totalQuizAttempts || 0) + 1,
          remainingAttempts: QUIZ_CONFIG.MAX_ATTEMPTS - (certificate.totalQuizAttempts || 0),
          custoCertificado: await precoDe('certificate_generation'),
        },
        courseTitle: certificate.courseTitle,
      });
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
    // Fatos voláteis resolvidos: o quiz é gerado com os nomes/valores ATUAIS
    const courseContent = await resolveContentFacts(
      product?.courseContent || staticCourse?.fullDescription || ''
    );

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

    /**
     * ── O GABARITO FICA AQUI, NÃO NO NAVEGADOR ─────────────────────────────
     *
     * O que sai daqui são as perguntas e as opções. As respostas certas vão
     * para `certificate.provaPendente`, no banco, e o cliente recebe apenas um
     * `nonce` aleatório — um número de senha que identifica a prova e não
     * carrega informação nenhuma sobre ela.
     *
     * Ver o comentário de `IProvaPendente` em `models/Certificate.ts` para o
     * que existia antes (o gabarito em base64, e o `POST` confiando nele).
     */
    const nonce = crypto.randomBytes(24).toString('hex');
    certificate.provaPendente = {
      nonce,
      perguntas: questions,
      criadaEm: new Date(),
      expiraEm: new Date(Date.now() + VALIDADE_PROVA_MS),
    };
    await certificate.save();

    return NextResponse.json({
      status: 'quiz_ready',
      questions: questions.map((q, i) => ({ id: i, question: q.question, options: q.options })),
      answersToken: nonce,
      expiraEm: certificate.provaPendente.expiraEm,
      config: {
        totalQuestions: questions.length,
        passingScore: QUIZ_CONFIG.PASSING_SCORE,
        maxAttempts: QUIZ_CONFIG.MAX_ATTEMPTS,
        currentAttempt: (certificate.totalQuizAttempts || 0) + 1,
        remainingAttempts: QUIZ_CONFIG.MAX_ATTEMPTS - (certificate.totalQuizAttempts || 0),
        // O aluno precisa saber o preço ANTES de responder. Descobrir que o
        // certificado custa 50 depois de passar na prova é a pior hora.
        custoCertificado: await precoDe('certificate_generation'),
      },
      courseTitle,
    });
  } catch (error) {
    // Indisponibilidade temporária do gerador é 503, e a mensagem já é a do
    // aluno: 500 com "Erro ao gerar avaliação: …" convidaria a recarregar sem
    // parar, e escondia que o certificado ficou intacto.
    if (error instanceof QuizIndisponivel) {
      return NextResponse.json({ error: error.message, temporario: true }, { status: 503 });
    }
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
    const { answers, answersToken } = body;

    if (!answers || !Array.isArray(answers) || typeof answersToken !== 'string') {
      return NextResponse.json({ error: 'Respostas inválidas' }, { status: 400 });
    }

    // Get certificate
    const certificate = await Certificate.findOne({ userId: authUser.id, courseSlug: slug });
    if (!certificate) {
      return NextResponse.json({ error: 'Certificado não encontrado. Inicie a avaliação primeiro.' }, { status: 404 });
    }

    /**
     * ── A PROVA VEM DO BANCO, NÃO DO CORPO DA REQUISIÇÃO ───────────────────
     *
     * As três linhas que existiam aqui — `JSON.parse(base64(answersToken))` —
     * eram o defeito inteiro. O cliente mandava o gabarito e o servidor
     * acreditava; um `POST` com `answersToken` de uma pergunta só e
     * `answers: [aquela]` valia 100% e emitia o certificado.
     *
     * Agora `answersToken` é só um nonce, e tudo que decide a nota (as
     * perguntas, as respostas certas e **quantas perguntas existem**) sai de
     * `certificate.provaPendente`. O denominador em particular importa: com ele
     * vindo do cliente, encolher a prova era encolher o que era preciso acertar.
     *
     * ⚠️ `timingSafeEqual` e não `===`. O ganho prático é pequeno aqui, mas
     * comparar segredo com `===` é o hábito que, no lugar errado, vira o
     * vazamento — e o custo de fazer certo é uma linha.
     */
    const pendente = certificate.provaPendente;
    if (!pendente || pendente.expiraEm <= new Date()) {
      return NextResponse.json({
        error: 'Esta avaliação expirou ou não foi iniciada. Abra a avaliação de novo — nenhuma tentativa foi consumida.',
        expirada: true,
      }, { status: 409 });
    }
    const esperado = Buffer.from(pendente.nonce);
    const recebido = Buffer.from(answersToken);
    if (esperado.length !== recebido.length || !crypto.timingSafeEqual(esperado, recebido)) {
      return NextResponse.json({ error: 'Token de avaliação inválido' }, { status: 400 });
    }

    const perguntasDaProva = pendente.perguntas;
    const correctAnswers = perguntasDaProva.map((q) => q.correctAnswer);

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

    /**
     * ── UM PREÇO SÓ, E ELE É O DO CERTIFICADO (11/08/2026) ─────────────────
     *
     * Ricardo: *"emitir certificado, é onde está o quiz (...) e deve custar
     * 50 (...) tentativa no quiz, mudou para emitir certificado"*.
     *
     * Até 10/08 havia dois preços: R$5 por tentativa e R$15 pela emissão. A
     * tentativa cobrada era o pior dos dois — quem errava pagava e não levava
     * nada, e o aluno que mais precisava tentar de novo era o mais penalizado.
     * Agora **tentar é de graça** (dentro do limite de tentativas) e o preço
     * único vive na emissão, cobrado só de quem passou.
     *
     * ⚠️ Preço lido de `getPrecos()`: é o número que o Ricardo mexe no Mission
     * Control. `quizDiscount` (10/20/50% conforme o plano) continua valendo por
     * cima dele — é parte do que a assinatura compra.
     */
    const plano = resolvePlan(user.subscription?.plan || 'free');
    const descontoQuiz = TIER_CONFIGS[plano].quizDiscount;
    const precoCertificado = await precoDe('certificate_generation');
    const custoEmissao = Math.round(precoCertificado * (1 - descontoQuiz));

    // Score the quiz — contra a prova GUARDADA, não contra a que o cliente diz
    // ter recebido. `submittedQuestions` do corpo é ignorado de propósito: era
    // o cliente escrevendo o enunciado que vai para dentro do certificado.
    let correctCount = 0;
    const questionResults = perguntasDaProva.map((q, i) => {
      const userAnswer = typeof answers[i] === 'number' ? answers[i] : -1;
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer,
        isCorrect,
      };
    });

    const score = Math.round((correctCount / correctAnswers.length) * 100);
    const passed = score >= QUIZ_CONFIG.PASSING_SCORE;

    /**
     * ⚠️ A prova aberta é QUEIMADA aqui, antes de qualquer resposta.
     *
     * Sem isto, o mesmo nonce serviria para reenviar respostas até acertar —
     * o limite de tentativas contaria, mas o aluno já teria visto o gabarito no
     * resultado da tentativa anterior e responderia a MESMA prova de novo.
     * Cada entrega consome a prova; a próxima tentativa monta outra.
     */
    // `set(path, undefined)` e não `= undefined`: a atribuição direta depende
    // de o Mongoose interpretar `undefined` como remoção, o que já variou entre
    // versões. Aqui a intenção é explícita e o `$unset` é garantido — e se ela
    // falhasse, o nonce continuaria válido e a prova seria reenviável.
    certificate.set('provaPendente', undefined);

    // Update question bank stats (if questions came from bank)
    await updateQuestionStats(slug, answers, perguntasDaProva);

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
      /**
       * ⚠️ A conferência de saldo acontece AQUI, depois da correção.
       *
       * Cobrar na entrada faria quem reprova pagar pelo certificado que não
       * recebeu. Só quem passou paga — que é o que a tabela de preços diz.
       *
       * E se o saldo não der, **a prova continua aprovada**: a nota é do aluno
       * e ele não deve nada por ela. O que fica pendente é o documento, e a
       * resposta leva ao pacote de créditos. Anular a aprovação por falta de
       * saldo seria transformar uma venda perdida numa punição.
       */
      const saldoPosTentativa = await saldoParaGastar(authUser.id);

      if (custoEmissao > 0 && saldoPosTentativa.total < custoEmissao) {
        certificate.status = 'quiz_in_progress';
        await certificate.save();
        return NextResponse.json({
          status: 'passed_pending_credits',
          score,
          correctCount,
          totalQuestions: correctAnswers.length,
          message: 'Você passou! Faltam créditos para emitir o certificado.',
          required: custoEmissao,
          available: saldoPosTentativa.total,
          faltam: custoEmissao - saldoPosTentativa.total,
          packs: CREDIT_PACKS,
          checkoutUrl: '/checkout/cart',
          creditosGastos: 0,
        }, { status: 402 });
      }

      let gastoEmissao = 0;
      if (custoEmissao > 0) {
        // ⚠️ `debitar` cobra `preço × quantidade`. Passar 1 aqui ignoraria o
        // desconto do plano e cobraria do Expert o mesmo que do gratuito. A
        // razão devolve exatamente `custoEmissao`, que já é inteiro.
        const r = await debitar(
          authUser.id,
          'certificate_generation',
          precoCertificado > 0 ? custoEmissao / precoCertificado : 0,
          `Certificado de ${certificate.courseTitle || slug}`
            + (descontoQuiz > 0 ? ` (−${Math.round(descontoQuiz * 100)}% do plano)` : ''),
        );
        gastoEmissao = r.gasto;
      }

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
        creditosGastos: gastoEmissao,
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
        // Reprovar não custa nada desde 11/08 — o preço mora na emissão.
        creditosGastos: 0,
        custoCertificado: custoEmissao,
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
