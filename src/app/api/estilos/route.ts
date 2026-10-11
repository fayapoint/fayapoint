import { NextResponse } from "next/server";
import { clienteMongo } from "@/lib/mongo-cliente";
import { IDS_DE_ESTILO } from "@/lib/estilos";

/**
 * /api/estilos — quantas vezes cada estilo do Atlas foi copiado.
 *
 * GET devolve `{ usos: { [id]: n } }`; POST `{ id }` soma um.
 *
 * ## O número é real, e é aproximado
 *
 * A regra da casa é "contador falso, nunca": aqui não há semente, o estilo
 * começa em zero. Quem segura a inflação é o navegador — ele só manda o POST na
 * PRIMEIRA cópia de cada estilo (guarda em `localStorage`). Isso é cortesia,
 * não prova: dá para forjar com `curl`. Serve para ordenar a galeria, não para
 * pagar ninguém. O limitador de API do `proxy.ts` é o teto de quem insiste.
 *
 * ⚠️ O `id` é conferido contra a lista — sem isso qualquer um escreveria
 * documento com a chave que quisesse na coleção.
 */
export const runtime = "nodejs";

type Linha = { _id: string; n: number; em?: Date };

async function colecao() {
  return (await clienteMongo()).db("fayapoint").collection<Linha>("estilos_uso");
}

export async function GET() {
  try {
    const linhas = await (await colecao()).find({}, { projection: { n: 1 } }).toArray();
    const usos: Record<string, number> = {};
    for (const l of linhas) if (IDS_DE_ESTILO.has(l._id)) usos[l._id] = l.n;
    return NextResponse.json(
      { usos },
      {
        headers: {
          // O `Cache-Control` da rota não chega à borda da Netlify; este chega.
          "Netlify-CDN-Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
          "Cache-Control": "public, max-age=0, must-revalidate",
        },
      },
    );
  } catch (erro) {
    // Sem banco a galeria continua de pé, só sem os números.
    console.error("[estilos] não li os usos:", erro);
    return NextResponse.json({ usos: {}, semBanco: true }, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  const id = typeof corpo?.id === "string" ? corpo.id : "";
  if (!IDS_DE_ESTILO.has(id)) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    await (await colecao()).updateOne({ _id: id }, { $inc: { n: 1 }, $set: { em: new Date() } }, { upsert: true });
    return NextResponse.json({ ok: true });
  } catch (erro) {
    console.error("[estilos] não gravei o uso:", erro);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
