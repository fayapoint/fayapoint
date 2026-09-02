import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import CourseProgress from '@/models/CourseProgress';
import { getAuthUser } from '@/lib/auth';
import { getMongoClient } from '@/lib/products';
import { TIER_CONFIGS, resolvePlan } from '@/lib/course-tiers';
import { isCourseFreeThisMonth } from '@/lib/monthly-course-offers';

/**
 * GET /api/courses/[slug]/audiobook
 *
 * O audiobook do curso, em links ASSINADOS e com prazo.
 *
 * ## Por que esta rota existe, em vez de uma URL no banco
 *
 * O audiobook é um degrau PAGO (`curso_narrado`). O `content-forge-chapters`
 * guarda só o `publicId` do Cloudinary, nunca uma URL tocável — porque um
 * documento de banco que carrega URL pública é uma URL pública. Quem transforma
 * `publicId` em link é esta rota, e só depois de conferir o acesso do aluno.
 *
 * ## ⚠️ Aqui a conferência é NO SERVIDOR, e isso é diferente do resto
 *
 * `/api/courses/<slug>/content` devolve o conteúdo e deixa o bloqueio de
 * capítulo para o cliente (`/api/courses/access`), e `/api/courses/<slug>/media`
 * não confere nada. Isso funciona para texto e ilustração, que já vazam no
 * HTML de qualquer jeito. **Não serve para áudio**: um MP4 de audiobook é o
 * produto inteiro num arquivo, e um link vazado é o produto distribuído.
 *
 * Então esta rota nega por padrão e só assina para quem tem o curso.
 *
 * Prazo curto de propósito: o link serve para tocar agora, não para virar
 * acervo em pasta compartilhada.
 */

const BANCO_MC = 'mission-control';
const COLECAO = 'content-forge-chapters';

/** Um turno de estudo. Curto o bastante para o link não virar distribuição. */
const VALIDADE_S = 6 * 60 * 60;

export const dynamic = 'force-dynamic';

type CapituloAudio = {
  chapterSlug: string;
  chapterNumber: number;
  publicId: string;
  segundos: number;
  narrador?: string;
  linhaDoTempo?: unknown;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const usuario = await getAuthUser();
  if (!usuario) {
    return NextResponse.json(
      { erro: 'entre na sua conta para ouvir', audiobook: null },
      { status: 401 },
    );
  }

  // ── 1. O aluno tem este curso? ────────────────────────────────────────────
  //
  // ⚠️ A MESMA escada de `/api/courses/[slug]/content`, e de propósito. Se esta
  // rota checasse de outro jeito, um aluno com o curso liberado por assinatura
  // ilimitada — ou pelo curso grátis do mês — leria o capítulo e levaria 403 no
  // áudio da mesma página. Duas réguas para a mesma pergunta viram, com o
  // tempo, duas respostas diferentes.
  await dbConnect();
  const conta = await User.findById(usuario.id);
  if (!conta) {
    return NextResponse.json({ erro: 'conta não encontrada', audiobook: null }, { status: 404 });
  }

  const plano = TIER_CONFIGS[resolvePlan(conta.subscription?.plan || 'free')];
  let temAcesso =
    conta.role === 'admin' ||
    conta.role === 'instructor' ||
    plano.limits.unlimited ||
    isCourseFreeThisMonth(slug);

  if (!temAcesso) {
    temAcesso = !!conta.enrolledCourses?.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => c.courseSlug === slug && c.isActive,
    );
  }
  if (!temAcesso) {
    temAcesso = !!(await CourseProgress.findOne({ userId: usuario.id, courseSlug: slug }));
  }

  if (!temAcesso) {
    return NextResponse.json(
      { erro: 'este curso não está na sua conta', audiobook: null },
      { status: 403 },
    );
  }

  const cliente = await getMongoClient();

  // ── 2. Que capítulos têm áudio? ───────────────────────────────────────────
  const documentos = await cliente
    .db(BANCO_MC)
    .collection(COLECAO)
    .find(
      { courseSlug: slug, 'media.audio.publicId': { $exists: true } },
      { projection: { chapterSlug: 1, chapterNumber: 1, title: 1, 'media.audio': 1 } },
    )
    .sort({ chapterNumber: 1 })
    .toArray();

  if (!documentos.length) {
    return NextResponse.json({ audiobook: null, capitulos: [], motivo: 'ainda não narrado' });
  }

  // ── 3. Assina, um a um ────────────────────────────────────────────────────
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.error('audiobook: falta credencial do Cloudinary');
    return NextResponse.json({ erro: 'áudio indisponível', audiobook: null }, { status: 503 });
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const expiraEm = Math.floor(Date.now() / 1000) + VALIDADE_S;

  const capitulos = documentos.map((d) => {
    const a = (d.media as { audio: CapituloAudio }).audio;
    return {
      numero: d.chapterNumber ?? 0,
      slug: d.chapterSlug,
      titulo: d.title ?? null,
      segundos: a.segundos ?? 0,
      narrador: a.narrador ?? null,
      url: cloudinary.url(a.publicId, {
        resource_type: 'video',
        type: 'authenticated',
        format: 'm4a',
        sign_url: true,
        expires_at: expiraEm,
      }),
      // Em que segundo cada frase começa. É o que a lente segue — e vem na
      // MESMA resposta de propósito, para a leitura sincronizada não custar
      // uma segunda ida à rede na abertura da página.
      linhaDoTempo: a.linhaDoTempo ?? null,
    };
  });

  return NextResponse.json(
    {
      audiobook: {
        curso: slug,
        capitulos: capitulos.length,
        segundos: capitulos.reduce((s, c) => s + c.segundos, 0),
        expiraEm,
      },
      capitulos,
    },
    // ⛔ `private` e `no-store`: o link é do aluno e tem prazo. Cache de CDN
    // aqui serviria o link assinado de um aluno para o próximo.
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
