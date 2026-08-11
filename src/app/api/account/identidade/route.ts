import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import SocialAccount from '@/models/SocialAccount';
import { getAuthUser } from '@/lib/auth';
import { emailValido, mascararCpf, normalizarEmail } from '@/lib/cpf';
import { rateLimit } from '@/lib/rate-limit';
import {
  definirCpf,
  definirPrincipal,
  desvincularEmail,
  garantirPrincipalNaLista,
  vincularEmail,
} from '@/lib/identidade';

export const dynamic = 'force-dynamic';

/**
 * A identidade da conta — e-mails, CPF e o vínculo do Google.
 *
 * GET     devolve o quadro inteiro
 * POST    { email }            vincula um e-mail de contato
 * DELETE  ?email=              desvincula
 * PUT     { cpf } | { principal }  grava o CPF ou troca o principal
 *
 * ⚠️ **O CPF nunca volta inteiro.** A tela mostra `123.***.***-09`: para
 * confirmar que está lá basta o começo e o fim, e um documento completo
 * trafegando em toda abertura de página é superfície de vazamento sem
 * contrapartida nenhuma.
 */
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    await dbConnect();
    const user = await User.findById(auth.id).select('email emails cpf cpfVerifiedAt name image emailVerified createdAt billing');
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    // Contas antigas nunca tiveram a lista. Materializar na leitura evita uma
    // migração e deixa a tela com um estado só para desenhar.
    if (garantirPrincipalNaLista(user)) await user.save();

    const google = await SocialAccount.findOne({ userId: String(user._id), platform: 'google' })
      .select('username status metadata scopes')
      .lean();

    return NextResponse.json({
      principal: user.email,
      emails: (user.emails || []).map((e) => ({
        email: e.email,
        verificado: e.verificado,
        origem: e.origem,
        principal: normalizarEmail(e.email) === normalizarEmail(user.email),
      })),
      cpf: user.cpf ? mascararCpf(user.cpf) : null,
      temCpf: !!user.cpf,
      google: google
        ? {
            conectado: true,
            email: google.username || null,
            foto: google.metadata?.profilePictureUrl || null,
            // 'pending' = identidade sim, permissão de publicar não. Ver
            // `lib/social-identity.ts`.
            publicacaoLiberada: google.status === 'active',
          }
        : { conectado: false },
    });
  } catch (error) {
    console.error('[identidade] GET', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    /**
     * ⚠️ Com limite de tentativas, como `check-email` e `login`.
     *
     * A resposta distingue "vinculei" de "já pertence a outra conta" — o que é
     * bom para quem digitou errado e é um oráculo de enumeração para quem
     * quiser varrer endereços. O limite é o que separa as duas coisas. O
     * padrão da casa já existia nas outras rotas de identidade; esta nasceu
     * sem, e o laço de críticos pegou.
     */
    const rl = await rateLimit({
      key: `ratelimit:identidade:email:${auth.id}`,
      limit: 20,
      windowSeconds: 10 * 60,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente de novo em alguns minutos.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } },
      );
    }

    const body = await request.json().catch(() => ({}));
    const email = normalizarEmail(String(body.email || ''));
    if (!emailValido(email)) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(auth.id);
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    // ⚠️ `verificado: false`, sempre. Verificar é provar posse, e uma rota que
    // aceita `verificado` do corpo da requisição é a própria falha.
    const r = await vincularEmail(user, email, { verificado: false, origem: 'manual' });
    if (!r.ok) return NextResponse.json({ error: r.erro, codigo: r.codigo }, { status: 409 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[identidade] POST', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const email = normalizarEmail(new URL(request.url).searchParams.get('email') || '');
    await dbConnect();
    const user = await User.findById(auth.id);
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const r = await desvincularEmail(user, email);
    if (!r.ok) return NextResponse.json({ error: r.erro, codigo: r.codigo }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[identidade] DELETE', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    await dbConnect();
    const user = await User.findById(auth.id);
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    if (typeof body.cpf === 'string') {
      const r = await definirCpf(user, body.cpf);
      if (!r.ok) return NextResponse.json({ error: r.erro, codigo: r.codigo }, { status: 409 });
      return NextResponse.json({ ok: true, cpf: mascararCpf(user.cpf || '') });
    }

    if (typeof body.principal === 'string') {
      const r = await definirPrincipal(user, body.principal);
      if (!r.ok) return NextResponse.json({ error: r.erro, codigo: r.codigo }, { status: 409 });
      return NextResponse.json({ ok: true, principal: user.email });
    }

    return NextResponse.json({ error: 'Nada a fazer' }, { status: 400 });
  } catch (error) {
    console.error('[identidade] PUT', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
