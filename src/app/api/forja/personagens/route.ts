import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import ForjaPersonagem from "@/models/ForjaPersonagem";
import { getAuthUser } from "@/lib/auth";
import { generate } from "@/lib/ai/provider";
import { contextoDoUsuario, garantirCriador } from "@/lib/forja/servidor";
import {
  SISTEMA_PERSONAGEM_PUBLICO,
  SISTEMA_ENRIQUECER,
  pedidoDePersonagemPublico,
  pedidoDeEnriquecimento,
  publicoDePersona,
  contribuicaoParaPersona,
  prontidao,
  PELE,
  CABELO_COR,
  CABELO_ESTILO,
  BARBA,
  OLHOS,
  CORPO,
  GENERO_APARENTE,
  type Personagem,
} from "@/lib/forja/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * OS PERSONAGENS DA FORJA.
 *
 * ## O que uma ficha de personagem faz que uma foto não faz
 *
 * O gerador não guarda memória entre chamadas. Se o quadro 1 diz "homem de
 * barba" e o quadro 4 diz "o criador", saem duas pessoas diferentes e o Reel
 * inteiro se perde. A ficha é o que transforma "o criador" numa frase que o
 * gerador entende do mesmo jeito toda vez.
 *
 * ## A direção que importa: do personagem PARA a persona
 *
 * Ricardo pediu que a criação de personagem enriqueça a persona do usuário, e a
 * leitura fácil seria a inversa. O valor está na volta: o construtor de persona
 * pergunta "quem é o seu público?" e recebe um parágrafo genérico, porque a
 * pergunta é abstrata. Pedir para a pessoa DESENHAR o cliente — que idade, o
 * que veste, o que ela diz quando não vai comprar — é a mesma pergunta em forma
 * concreta, e a resposta concreta é a que serve para escrever.
 *
 * ⚠️ O modelo PROPÕE, a pessoa CONFIRMA. Nada entra na persona sem um
 * `contribuir: true` explícito, e mesmo aí a gravação é campo a campo com
 * `$set` — nunca sobrescreve com branco o que a pessoa já respondeu.
 */

const VALORES = {
  genero: GENERO_APARENTE.map((o) => o.valor),
  pele: PELE.map((o) => o.valor),
  cabeloCor: CABELO_COR.map((o) => o.valor),
  cabeloEstilo: CABELO_ESTILO.map((o) => o.valor),
  barba: BARBA.map((o) => o.valor),
  olhos: OLHOS.map((o) => o.valor),
  corpo: CORPO.map((o) => o.valor),
};

/** O vocabulário que a tela precisa para desenhar os seletores. */
const OPCOES = { GENERO_APARENTE, PELE, CABELO_COR, CABELO_ESTILO, BARBA, OLHOS, CORPO };

/**
 * O teto de fichas por pessoa.
 *
 * Não é preço, é higiene: doze é mais do que qualquer criador usa, e sem teto
 * nenhum a coleção vira depósito de rascunho — o que atrapalha justamente quem
 * precisa achar o personagem certo na hora de montar o quadro.
 */
const MAX_PERSONAGENS = 12;

function limparJson(s: string): string {
  return s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
}

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await contextoDoUsuario(authUser.id);
  // a primeira visita cria o personagem do criador — sem ele, nenhum quadro com
  // gente tem rosto para travar
  await garantirCriador(authUser.id, ctx);

  const lista = [...ctx.elenco.values()].map((p) => ({ ...p, prontidao: prontidao(p) }));

  return NextResponse.json({ personagens: lista, opcoes: OPCOES });
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const corpo = (await request.json()) as { origem?: string; nome?: string; papel?: string; comIa?: boolean };
    const origem = corpo.origem === "publico" || corpo.origem === "elenco" ? corpo.origem : "elenco";

    await dbConnect();
    const quantos = await ForjaPersonagem.countDocuments({ userId: authUser.id });
    if (quantos >= MAX_PERSONAGENS) {
      return NextResponse.json(
        { error: `Você já tem ${MAX_PERSONAGENS} personagens. Apague um que não usa mais para criar outro.` },
        { status: 409 },
      );
    }

    const ctx = await contextoDoUsuario(authUser.id);

    /**
     * O cliente típico começa preenchido pelo que a persona JÁ respondeu — e
     * aqui o preenchimento automático é o certo, pelo motivo oposto ao do
     * criador: perguntar de novo o que a pessoa já respondeu é o jeito mais
     * rápido de fazê-la abandonar a tela.
     */
    let base: Personagem =
      origem === "publico"
        ? publicoDePersona(ctx.persona)
        : {
            origem: "elenco",
            nome: String(corpo.nome || "Novo personagem").slice(0, 60),
            papel: String(corpo.papel || "").slice(0, 120),
            aparencia: {},
            figurinos: [],
          };

    if (corpo.comIa && origem === "publico") {
      /**
       * ⚠️ Tier `free` (Gemini 3 Flash) de propósito, e não o `budget`.
       *
       * O `budget` é o DeepSeek V4, modelo de RACIOCÍNIO: os tokens de
       * pensamento saem do mesmo orçamento da resposta, e a chamada leva
       * minutos. Medido em 20/08/2026: com 3.000 tokens ele gastou 2.999
       * pensando e devolveu `content` vazio. Isso não cabe numa tela que a
       * pessoa está olhando, e muito menos no teto de tempo de uma função
       * serverless.
       */
      try {
        const r = await generate({
          messages: [
            { role: "system", content: SISTEMA_PERSONAGEM_PUBLICO },
            { role: "user", content: pedidoDePersonagemPublico(ctx.persona, VALORES) },
          ],
          tier: "free",
          json: true,
          maxTokens: 1500,
        });
        const d = JSON.parse(limparJson(r.content)) as Record<string, unknown>;
        base = {
          ...base,
          nome: String(d.nome || base.nome).slice(0, 60),
          papel: String(d.papel || base.papel || "").slice(0, 120),
          resumo: String(d.resumo || base.resumo || "").slice(0, 300),
          aparencia: { ...base.aparencia, ...(d.aparencia as object) },
          figurinos: d.figurino
            ? [{ id: "f1", padrao: true, ...(d.figurino as object) } as never]
            : base.figurinos,
          psicologia: { ...base.psicologia, ...(d.psicologia as object) },
        };
      } catch (e) {
        // o rascunho da IA é um atalho, não um requisito: se ele falhar, a
        // pessoa recebe a ficha semeada pela persona e preenche à mão
        console.warn("[forja personagens] rascunho por IA falhou", e);
      }
    }

    const doc = await ForjaPersonagem.create({ ...base, userId: authUser.id });
    const p = { ...doc.toObject(), _id: String(doc._id) } as unknown as Personagem;

    return NextResponse.json({ personagem: { ...p, prontidao: prontidao(p) } });
  } catch (erro) {
    console.error("[forja personagens POST]", erro);
    return NextResponse.json({ error: "Falha ao criar o personagem" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const corpo = (await request.json()) as {
      id?: string;
      campos?: Partial<Personagem>;
      /** manda para a persona do usuário o que esta ficha ensinou */
      contribuir?: boolean;
      /** pede ao modelo para completar só os campos vazios */
      completar?: boolean;
    };
    if (!corpo.id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

    await dbConnect();
    const doc = await ForjaPersonagem.findOne({ _id: corpo.id, userId: authUser.id });
    if (!doc) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const c = corpo.campos || {};
    for (const campo of ["nome", "papel", "resumo"] as const) {
      if (c[campo] !== undefined) doc[campo] = String(c[campo]).slice(0, 300);
    }
    if (c.aparencia) doc.aparencia = { ...doc.aparencia?.toObject?.(), ...c.aparencia };
    if (c.figurinos) doc.figurinos = c.figurinos;
    if (c.psicologia) doc.psicologia = { ...doc.psicologia?.toObject?.(), ...c.psicologia };
    if (c.referencias) {
      /**
       * ⚠️ Só https. Uma referência é baixada pelo TRABALHADOR, na máquina do
       * Ricardo — aceitar `file://` ou `http://127.0.0.1` aqui seria deixar
       * qualquer usuário fazer a máquina dele buscar um caminho arbitrário.
       */
      doc.referencias = c.referencias.filter((u) => /^https:\/\//.test(String(u))).slice(0, 8);
    }

    if (corpo.completar) {
      try {
        const r = await generate({
          messages: [
            { role: "system", content: SISTEMA_ENRIQUECER },
            { role: "user", content: pedidoDeEnriquecimento(doc.toObject() as unknown as Personagem, VALORES) },
          ],
          tier: "free",
          json: true,
          maxTokens: 1200,
        });
        const d = JSON.parse(limparJson(r.content)) as Record<string, unknown>;
        // só o que estava VAZIO: o modelo foi instruído a não mexer no
        // preenchido, mas confiar nisso seria deixar a máquina apagar o que a
        // pessoa escreveu
        if (!doc.resumo && d.resumo) doc.resumo = String(d.resumo).slice(0, 300);
        if (d.aparencia && typeof d.aparencia === "object") {
          for (const [k, v] of Object.entries(d.aparencia as Record<string, unknown>)) {
            if (v && !doc.aparencia?.[k]) doc.aparencia[k] = v;
          }
        }
        if (Array.isArray(d.figurinos) && !doc.figurinos?.length) {
          doc.figurinos = (d.figurinos as Array<Record<string, unknown>>)
            .slice(0, 3)
            .map((f, i) => ({ id: `f${i + 1}`, padrao: i === 0, ...f }));
        }
        if (d.psicologia && typeof d.psicologia === "object") {
          for (const [k, v] of Object.entries(d.psicologia as Record<string, unknown>)) {
            if (v && !doc.psicologia?.[k]) doc.psicologia[k] = v;
          }
        }
      } catch (e) {
        console.warn("[forja personagens] completar falhou", e);
      }
    }

    doc.markModified("aparencia");
    doc.markModified("psicologia");
    await doc.save();

    const p = { ...doc.toObject(), _id: String(doc._id) } as unknown as Personagem;

    let foiParaPersona: string[] = [];
    if (corpo.contribuir) {
      const caminhos = contribuicaoParaPersona(p);
      const entradas = Object.entries(caminhos);
      if (entradas.length) {
        const set: Record<string, unknown> = {};
        for (const [k, v] of entradas) set[`socialPersona.${k}`] = v;
        await User.updateOne({ _id: authUser.id }, { $set: set });
        await ForjaPersonagem.updateOne({ _id: doc._id }, { $set: { contribuiuEm: new Date() } });
        foiParaPersona = entradas.map(([k]) => k);
      }
    }

    return NextResponse.json({ personagem: { ...p, prontidao: prontidao(p) }, foiParaPersona });
  } catch (erro) {
    console.error("[forja personagens PATCH]", erro);
    return NextResponse.json({ error: "Falha ao gravar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

  await dbConnect();
  /**
   * O personagem do criador não se apaga: ele é a pessoa. Apagá-lo deixaria
   * toda peça com gente sem rosto para travar, e a tela recriaria um em branco
   * na visita seguinte — o que parece um defeito, e é.
   */
  const alvo = await ForjaPersonagem.findOne({ _id: id, userId: authUser.id }).select("origem").lean();
  if (!alvo) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if ((alvo as unknown as { origem: string }).origem === "criador") {
    return NextResponse.json({ error: "Este é você — dá para editar, não dá para apagar." }, { status: 409 });
  }

  const r = await ForjaPersonagem.deleteOne({ _id: id, userId: authUser.id });
  return NextResponse.json({ apagados: r.deletedCount });
}
