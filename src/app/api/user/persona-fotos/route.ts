import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { comTeto } from '@/lib/com-teto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { TIPOS_FOTO, type TipoFoto } from '@/lib/persona';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const TIPOS_ACEITOS = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * As fotos do usuário, por CONTEXTO DE USO (27/07/2026).
 *
 * Não é uma galeria: são quatro vagas com função declarada. "Profissional"
 * abre a capa do certificado, "casual" abre o Story, "pessoal" abre o post de
 * bastidor. Guardar dez fotos sem função obrigaria alguém a escolher na hora
 * da geração — e quem gera é a IA, que não sabe escolher rosto.
 *
 * A vaga `perfil` é especial: ela normalmente já vem preenchida pelo avatar do
 * Google, e o GET a materializa a partir de `user.image` quando ainda não
 * existe registro. Pedir para o usuário enviar de novo uma foto que já temos
 * é o tipo de atrito que faz a pessoa fechar a aba.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    await dbConnect();
    const user = await User.findById(authUser.id).select('socialPersona.fotos image');
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const fotos = [...(user.socialPersona?.fotos || [])];

    // O avatar da conta conta como foto de perfil — ela já é nossa, e mostrá-la
    // é a diferença entre "envie 4 fotos" e "já tenho a sua, faltam 3".
    if (user.image && !fotos.some((f) => f.tipo === 'perfil')) {
      fotos.unshift({
        tipo: 'perfil',
        url: user.image,
        origem: user.image.includes('googleusercontent') ? 'google' : 'conta',
        addedAt: undefined as unknown as Date,
      } as (typeof fotos)[number]);
    }

    return NextResponse.json({ fotos, vagas: TIPOS_FOTO });
  } catch (error) {
    console.error('[persona-fotos] GET', error);
    return NextResponse.json({ error: 'Erro ao listar fotos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const form = await request.formData();
    const file = form.get('file') as File | null;
    const tipo = String(form.get('tipo') || '') as TipoFoto;

    if (!file) return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 });
    if (!TIPOS_FOTO.includes(tipo)) {
      return NextResponse.json({ error: `Tipo inválido — use ${TIPOS_FOTO.join(', ')}` }, { status: 400 });
    }
    if (!TIPOS_ACEITOS.includes(file.type)) {
      return NextResponse.json({ error: 'Formato não aceito. Use PNG, JPG ou WebP.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Imagem acima de 8 MB — reduza antes de enviar.' }, { status: 400 });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      // Falhar dizendo o que está faltando: sem isto o sintoma é um erro 500
      // mudo, e o Studio já quebrou uma vez exatamente por esta variável.
      return NextResponse.json({ error: 'Armazenamento de imagens não configurado (CLOUDINARY_*)' }, { status: 503 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const enviado = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `fayapoint/persona/${user._id}`,
            resource_type: 'image',
            // Rosto para uso em peça gráfica: 1024 no maior lado é o teto útil
            // e corta o custo de banda de uma foto de celular moderna.
            transformation: [{ width: 1024, height: 1024, crop: 'limit' }, { quality: 'auto:good' }],
          },
          (err, res) => (err || !res ? reject(err) : resolve(res as { secure_url: string; public_id: string }))
        )
        .end(buffer);
    });

    const fotos = user.socialPersona.fotos || [];
    const anterior = fotos.find((f) => f.tipo === tipo);
    if (anterior?.publicId) {
      // Uma vaga, uma foto: trocar sem apagar a antiga deixaria lixo pago no
      // Cloudinary para sempre.
      //
      // ⚠️ E "para sempre" era o resultado real, porque isto estava SEM `await`:
      // numa função serverless a instância é congelada quando a resposta sai e a
      // chamada pendente pode ser descartada (mesmo erro de `rate-limit.ts:77`).
      // O `.catch` continua: falhar em apagar não pode impedir a troca da foto.
      // Teto: esta rota tem `maxDuration = 60`, e esperar sem teto por um
      // Cloudinary pendurado trocaria "lixo pago" por "tela girando um minuto".
      await comTeto(cloudinary.uploader.destroy(anterior.publicId), 5000, 'apagar foto anterior')
        .catch((e) => console.error('[persona-fotos] não apagou a foto anterior no Cloudinary:', e?.message));
    }

    const restantes = fotos.filter((f) => f.tipo !== tipo);
    restantes.push({ tipo, url: enviado.secure_url, origem: 'upload', publicId: enviado.public_id, addedAt: new Date() });
    user.socialPersona.fotos = restantes;
    user.markModified('socialPersona');
    await user.save();

    return NextResponse.json({ ok: true, foto: { tipo, url: enviado.secure_url, origem: 'upload' } });
  } catch (error) {
    console.error('[persona-fotos] POST', error);
    return NextResponse.json({ error: 'Erro ao enviar foto' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const tipo = new URL(request.url).searchParams.get('tipo') as TipoFoto | null;
    if (!tipo || !TIPOS_FOTO.includes(tipo)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const fotos = user.socialPersona.fotos || [];
    const alvo = fotos.find((f) => f.tipo === tipo);
    // `await` pelo mesmo motivo do POST: sem ele, o arquivo pago fica no
    // Cloudinary depois de a pessoa ter apagado a foto aqui.
    if (alvo?.publicId) {
      await comTeto(cloudinary.uploader.destroy(alvo.publicId), 5000, 'apagar foto')
        .catch((e) => console.error('[persona-fotos] não apagou a foto no Cloudinary:', e?.message));
    }

    user.socialPersona.fotos = fotos.filter((f) => f.tipo !== tipo);
    user.markModified('socialPersona');
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[persona-fotos] DELETE', error);
    return NextResponse.json({ error: 'Erro ao remover foto' }, { status: 500 });
  }
}
