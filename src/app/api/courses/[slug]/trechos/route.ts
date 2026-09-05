import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TrechoGuardado from '@/models/TrechoGuardado';
import { getAuthUser } from '@/lib/auth';

/** Um caderno por aluno e por curso. Acima disto, guardar deixa de ser guardar. */
const TETO = 200;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  await dbConnect();
  const trechos = await TrechoGuardado.find({ userId: authUser.id, courseId: slug })
    .sort({ criadoEm: -1 })
    .limit(TETO)
    .lean();

  return NextResponse.json({
    trechos: trechos.map((t) => ({
      id: String(t._id),
      texto: t.texto,
      capitulo: t.capitulo || null,
      criadoEm: t.criadoEm,
    })),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const texto = typeof body?.texto === 'string' ? body.texto.trim().slice(0, 2000) : '';
  if (texto.length < 12) {
    return NextResponse.json({ error: 'Trecho muito curto' }, { status: 400 });
  }

  await dbConnect();

  // Guardar duas vezes o mesmo parágrafo é acidente de clique, não intenção.
  const jaTem = await TrechoGuardado.findOne({ userId: authUser.id, courseId: slug, texto });
  if (jaTem) {
    return NextResponse.json({ id: String(jaTem._id), repetido: true });
  }

  const quantos = await TrechoGuardado.countDocuments({ userId: authUser.id, courseId: slug });
  if (quantos >= TETO) {
    return NextResponse.json({ error: `O caderno deste curso chegou a ${TETO} trechos.` }, { status: 409 });
  }

  const novo = await TrechoGuardado.create({
    userId: authUser.id,
    courseId: slug,
    capitulo: typeof body?.capitulo === 'string' ? body.capitulo.slice(0, 200) : undefined,
    texto,
  });

  return NextResponse.json({ id: String(novo._id) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta o id' }, { status: 400 });

  await dbConnect();
  // O `userId` no filtro não é enfeite: sem ele, um id adivinhado apagaria o
  // grifo de outra pessoa.
  await TrechoGuardado.deleteOne({ _id: id, userId: authUser.id, courseId: slug });
  return NextResponse.json({ success: true });
}
