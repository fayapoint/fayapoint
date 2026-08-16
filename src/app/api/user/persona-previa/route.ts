import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";
import { getMongoClient } from "@/lib/products";
import { parseExampleSlots } from "@/lib/course-examples";
import { generate } from "@/lib/ai/provider";
import { blocoDePersona, gruposDePrompt, personaVazia, type PersonaProfunda } from "@/lib/persona";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/user/persona-previa — a prova viva do Console da Persona.
 *
 * ## Por que existe
 *
 * O console pedia 27 respostas e não mostrava NADA em troca. Ricardo, em 12/08:
 *
 * > *"deveria resumir o que temos sobre nós, e como isso se aplicaria em tempo
 * > real (…) utilizar exemplos reais de trechos que temos nos cursos e
 * > exatamente o que eles mudariam caso fossem inseridas as informações que o
 * > usuário acabou de informar."*
 *
 * Então esta rota devolve, a cada resposta: um trecho **real** de um curso do
 * acervo da pessoa e a versão dele reescrita com o que já sabemos. Não é
 * maquete — é o mesmo `generate()` que a camada paga do Ateliê usa.
 *
 * ## As decisões que não dá para desfazer sem quebrar a promessa
 *
 * 1. **O trecho é real e vem do curso da pessoa.** Um texto inventado para a
 *    demonstração seria propaganda: a decepção chegaria depois do gasto.
 * 2. **Roda sem confiança mínima, de propósito.** É o único lugar do sistema
 *    que roda abaixo do piso — o texto morno com 3 respostas é o melhor
 *    argumento que existe para dar a quarta.
 * 3. **Os trechos que só existem por causa do perfil vêm marcados com «».** Sem
 *    isso a pessoa lê dois parágrafos parecidos e não vê o que mudou — que é
 *    exatamente a pergunta que ela tem na cabeça.
 */

/** O que o modelo devolve marcado com «» vira destaque na tela. */
const SISTEMA =
  "Você reescreve um trecho de curso de IA para o contexto REAL do aluno.\n" +
  "REGRAS:\n" +
  "- Mesma função didática, mesmo formato e comprimento parecido com o original.\n" +
  "- Português do Brasil, tom de quem conversa, sem jargão de consultoria.\n" +
  "- Use o que o perfil diz de forma CONCRETA (a cidade, o que vende, o ticket, a objeção que ouve). Nunca genérico.\n" +
  "- Envolva em «guilhemets» APENAS os trechos que só existem por causa do perfil. O resto do texto fica sem marcação.\n" +
  "- Não invente dado que o perfil não tem. O que não sabemos, não afirme.\n" +
  // ⚠️ 16/08/2026 — a mesma regra que entrou no Ateliê, pelo mesmo motivo: o
  // bloco do perfil descreve DUAS pessoas (o aluno e os clientes dele), e sem
  // esta linha o modelo escreve para a mais vívida das duas. Ver
  // `gruposDePrompt` em `lib/persona.ts`.
  "- O ALUNO e o PÚBLICO DO ALUNO são pessoas diferentes. Jamais atribua ao aluno o gênero, a idade, a profissão ou as dores listadas no bloco do PÚBLICO. Se o gênero ou a idade dele não estiverem declarados, escreva sem citar nenhum dos dois.\n" +
  "- Devolva SÓ o trecho reescrito: sem título, sem saudação, sem comentário.";

/** Um parágrafo de verdade do capítulo, quando o curso não tem slot de exemplo. */
function primeiroParagrafo(markdown: string): string | null {
  const limpo = markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^#{1,6} .*$/gm, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  for (const bloco of limpo.split(/\n{2,}/)) {
    const t = bloco.trim();
    if (t.length > 220 && t.length < 1200 && !t.startsWith("```") && !t.startsWith("|")) return t;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await dbConnect();
    const user = await User.findById(authUser.id).select("socialPersona enrolledCourses name");
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const persona = (user.socialPersona || {}) as unknown as PersonaProfunda;
    const perfil = blocoDePersona(persona, "curso", { nome: user.name });

    /**
     * Sem nenhuma resposta não há o que provar — o cliente mostra o convite.
     *
     * ⚠️ Era `perfil.trim().length < 12`, e essa medida MORREU em 16/08/2026:
     * o bloco passou a emitir sempre duas linhas de segurança ("não sabemos o
     * gênero", "não sabemos a idade"), então o tamanho nunca mais é pequeno e o
     * atalho nunca mais dispararia — gastando uma chamada de modelo para
     * reescrever um trecho com persona vazia. `personaVazia` olha os campos,
     * não o comprimento.
     */
    if (personaVazia(persona)) {
      return NextResponse.json({ vazio: true });
    }

    const body = await request.json().catch(() => ({}));
    const pedido = typeof body.courseSlug === "string" ? body.courseSlug.trim() : "";

    // O curso é o DA PESSOA. Só cai no padrão quem ainda não tem acervo — e aí
    // o trecho continua sendo de um curso real, não de um texto de vitrine.
    const doAcervo: string[] = Array.isArray(user.enrolledCourses)
      ? user.enrolledCourses
          .map((c: { courseSlug?: string; slug?: string }) => c?.courseSlug || c?.slug)
          .filter((s: unknown): s is string => typeof s === "string" && s.length > 0)
      : [];
    const slug = pedido || doAcervo[0] || "chatgpt-masterclass";

    const client = await getMongoClient();
    const product = await client
      .db("fayapointProdutos")
      .collection("products")
      .findOne({ slug }, { projection: { courseContent: 1, name: 1, title: 1 } });

    const conteudo = typeof product?.courseContent === "string" ? product.courseContent : "";
    if (!conteudo) return NextResponse.json({ error: "Curso sem conteúdo" }, { status: 404 });

    const slots = parseExampleSlots(conteudo);
    const original = slots.length ? slots[0].body.trim() : primeiroParagrafo(conteudo);
    if (!original) return NextResponse.json({ error: "Sem trecho utilizável" }, { status: 404 });

    const curso = (product?.name as string) || (product?.title as string) || slug;
    // ⚠️ 450, não 900. Medido em produção: com o trecho longo e o tier budget a
    // resposta levava >30s e a plataforma devolvia 504 antes de o modelo
    // terminar — a tela mostrava "a prévia não veio" em toda resposta.
    const recorte = original.length > 450 ? `${original.slice(0, 450)}…` : original;

    const res = await generate({
      // ⚠️ `free` (Gemini 3 Flash), não `budget`: o DeepSeek raciocina antes de
      // escrever e estourava o teto de tempo da plataforma. Aqui o que importa
      // é chegar ANTES de a pessoa responder a próxima pergunta — uma prévia
      // boa que chega depois do 504 não vale nada.
      tier: "free",
      // Piso de segurança do provedor: abaixo de ~1500 o `content` pode voltar
      // VAZIO sem erro nenhum, porque o raciocínio sai do mesmo orçamento.
      maxTokens: 1600,
      temperature: 0.7,
      messages: [
        { role: "system", content: SISTEMA },
        {
          role: "user",
          content: `PERFIL DO ALUNO (só isto se sabe até agora):\n${perfil}\n\nTRECHO ORIGINAL DO CURSO "${curso}":\n${recorte}\n\nReescreva o trecho para este aluno.`,
        },
      ],
    });

    const personalizado = res.content?.trim();
    if (!personalizado) return NextResponse.json({ error: "Resposta vazia do modelo" }, { status: 502 });

    return NextResponse.json({
      curso,
      slug,
      original: recorte,
      personalizado,
      /**
       * Os rótulos das linhas do bloco de persona: é o "com o que fizemos
       * isto", e é o que dá à pessoa a régua do quanto falta.
       *
       * ⚠️ Sai de `gruposDePrompt`, não de um `split("\n")` do texto montado. O
       * bloco agora tem cabeçalhos, avisos entre parênteses e duas linhas que
       * dizem o que NÃO sabemos — fatiar o texto cru transformaria "Idade dele:
       * NÃO SABEMOS" numa etiqueta anunciando que sabemos a idade dele.
       */
      usados: gruposDePrompt(persona, "curso", { nome: user.name })
        .flatMap((g) => g.linhas)
        .filter((l) => !!l.campo || ["Nome", "Área", "Nível com IA"].includes(l.rotulo))
        .map((l) => l.rotulo)
        .filter((l) => l.length < 40),
      modelo: res.model,
    });
  } catch (error) {
    console.error("persona-previa error:", error);
    return NextResponse.json({ error: "Erro ao gerar a prévia" }, { status: 500 });
  }
}
