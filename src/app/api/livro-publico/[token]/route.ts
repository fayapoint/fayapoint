import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import UserCourseLayer from "@/models/UserCourseLayer";
import LivroCompartilhado from "@/models/LivroCompartilhado";
import { getMongoClient } from "@/lib/products";
import { dividirCapitulos } from "@/lib/curso-personalizado";

export const dynamic = "force-dynamic";

/**
 * A leitura pública de um livro compartilhado — sem login.
 *
 * ⚠️ **Devolve a CAMADA, nunca a aula original.** O que é do aluno é o que ele
 * mandou escrever: a abertura, o exemplo e a tarefa no contexto dele. A aula
 * original é o produto da casa e é o que se vende — publicá-la num endereço
 * sem login por causa de um botão de compartilhar seria abrir o catálogo
 * inteiro para quem tem um link. Ver [progress_creditos_e_pool_0408]: passar
 * produto cru para o cliente já vazou o texto das aulas uma vez.
 *
 * ⚠️ Nenhum dado de conta sai daqui: nome do autor (que ele escolheu exibir) e
 * o conteúdo. Sem e-mail, sem id, sem plano.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    if (!token) return NextResponse.json({ error: "Link inválido" }, { status: 400 });

    await dbConnect();
    const share = await LivroCompartilhado.findOne({ token });
    if (!share || !share.ativo) {
      return NextResponse.json({ error: "Este livro não está mais compartilhado" }, { status: 404 });
    }

    const client = await getMongoClient();
    const produto = await client
      .db("fayapointProdutos")
      .collection("products")
      .findOne(
        { slug: share.courseSlug },
        { projection: { courseContent: 1, name: 1, thumbnail: 1 } }
      );
    if (!produto?.courseContent) return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });

    const capitulos = dividirCapitulos(produto.courseContent as string).filter((c) => c.numero !== null);
    const camadas = await UserCourseLayer.find({
      userId: share.userId,
      courseSlug: share.courseSlug,
    }).select("capitulo abertura exemplo tarefa");
    const porIndice = new Map(camadas.map((c) => [c.capitulo, c]));

    const sumario = capitulos
      .map((c) => {
        const camada = porIndice.get(c.indice);
        if (!camada) return null;
        return {
          numero: c.numero,
          titulo: c.titulo,
          abertura: camada.abertura || "",
          exemplo: camada.exemplo || "",
          tarefa: camada.tarefa || "",
        };
      })
      .filter(Boolean);

    // Contador de leitura: `updateOne` em vez de `save()` para não disputar o
    // documento com quem estiver ligando/desligando o compartilhamento.
    await LivroCompartilhado.updateOne(
      { _id: share._id },
      { $inc: { visitas: 1 }, $set: { ultimaVisita: new Date() } }
    );

    return NextResponse.json({
      autor: share.autor || "",
      curso: {
        nome: (produto.name as string) || share.courseSlug,
        slug: share.courseSlug,
        capa: (produto.thumbnail as string) || "",
      },
      sumario,
    });
  } catch (error) {
    console.error("livro-publico error:", error);
    return NextResponse.json({ error: "Erro ao abrir o livro" }, { status: 500 });
  }
}
