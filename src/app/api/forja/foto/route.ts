import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import dbConnect from "@/lib/mongodb";
import ForjaPersonagem from "@/models/ForjaPersonagem";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const TIPOS_ACEITOS = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REFERENCIAS = 4;

/**
 * A foto de referência de um personagem.
 *
 * ## Por que uma rota própria e não a de fotos da persona
 *
 * `/api/user/persona-fotos` guarda QUATRO vagas com função declarada (perfil,
 * profissional, casual, pessoal) dentro do `socialPersona`. É o retrato da
 * PESSOA. Um personagem da Forja pode ser outra pessoa inteira — o sócio, o
 * cliente típico, o mascote — e enfiar o rosto deles nas vagas da persona faria
 * o gerador de curso e o de post usarem a cara errada.
 *
 * ## O que a foto faz
 *
 * Ela é o que ancora o rosto. Com foto, o caminho de geração vira edição por
 * referência (Qwen Edit) e o rosto sobrevive a vinte quadros. Sem foto, sobra a
 * descrição — que produz "uma pessoa parecida", nunca "esta pessoa".
 *
 * ⚠️ Três tetos, e cada um fecha uma torneira diferente: o tipo do arquivo
 * (só imagem), o tamanho (8 MB) e a quantidade por personagem (4). O último é
 * o que importa — sem ele, uma pessoa sozinha enche o Cloudinary com fotos que
 * nenhum grafo vai usar, porque o Qwen Edit lê no máximo duas referências.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const form = await request.formData();
    const arquivo = form.get("arquivo") as File | null;
    const personagemId = String(form.get("personagemId") || "");

    if (!arquivo) return NextResponse.json({ error: "Nenhum arquivo" }, { status: 400 });
    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      return NextResponse.json({ error: "Mande uma imagem PNG, JPG ou WebP." }, { status: 415 });
    }
    if (arquivo.size > MAX_BYTES) {
      return NextResponse.json({ error: "A imagem passa de 8 MB. Reduza e tente de novo." }, { status: 413 });
    }

    await dbConnect();
    const personagem = await ForjaPersonagem.findOne({ _id: personagemId, userId: authUser.id });
    if (!personagem) return NextResponse.json({ error: "Personagem não encontrado" }, { status: 404 });

    if ((personagem.referencias || []).length >= MAX_REFERENCIAS) {
      return NextResponse.json(
        { error: `Este personagem já tem ${MAX_REFERENCIAS} fotos. Apague uma para mandar outra.` },
        { status: 409 },
      );
    }

    const bytes = Buffer.from(await arquivo.arrayBuffer());
    const enviado = await cloudinary.uploader.upload(`data:${arquivo.type};base64,${bytes.toString("base64")}`, {
      folder: `forja/referencias/${authUser.id}`,
      resource_type: "image",
      /**
       * ⚠️ O corte quadrado de 1024 é deliberado, e é o que faz o caderno
       * funcionar: o Qwen Edit normaliza a entrada de qualquer jeito, e mandar
       * uma foto de 4000 px de corpo inteiro faz o rosto ocupar 60 pixels — de
       * onde não sai referência de rosto nenhuma.
       */
      transformation: [{ width: 1024, height: 1024, crop: "fill", gravity: "face", quality: "auto:good" }],
    });

    personagem.referencias = [...(personagem.referencias || []), enviado.secure_url];
    await personagem.save();

    return NextResponse.json({ url: enviado.secure_url, referencias: personagem.referencias });
  } catch (erro) {
    console.error("[forja foto]", erro);
    return NextResponse.json({ error: "Falha ao enviar a foto" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const url = new URL(request.url);
  const personagemId = url.searchParams.get("personagemId");
  const foto = url.searchParams.get("url");
  if (!personagemId || !foto) return NextResponse.json({ error: "faltam parâmetros" }, { status: 400 });

  await dbConnect();
  const r = await ForjaPersonagem.updateOne(
    { _id: personagemId, userId: authUser.id },
    { $pull: { referencias: foto } },
  );
  return NextResponse.json({ ok: r.modifiedCount > 0 });
}
