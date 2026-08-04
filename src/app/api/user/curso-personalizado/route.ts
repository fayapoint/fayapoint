import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserCourseLayer from "@/models/UserCourseLayer";
import { getAuthUser } from "@/lib/auth";
import { getMongoClient } from "@/lib/products";
import { CREDIT_COSTS, TIER_CONFIGS, resolvePlan } from "@/lib/course-tiers";
import { sanitizeCourseContent } from "@/lib/course-content-sanitizer";
import { dividirCapitulos } from "@/lib/curso-personalizado";
import { applyContentFacts, getContentFacts } from "@/lib/content-facts";
import { montarDossie, type PersonaProfunda } from "@/lib/persona";
import { debitar, saldoParaGastar, custoDe } from "@/lib/creditos";
import { MINIMA_CONFIANCA, impressao, escreverCamada } from "@/lib/atelie-servidor";
import { podePersonalizar, motivoSemPersonalizacao } from "@/lib/curso-personalizavel";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * O curso reescrito para UMA pessoa — motor Expert v2 (27/07/2026).
 *
 * GET  ?curso=slug   → estado da camada (quantos capítulos, se envelheceu)
 * POST { curso, refazer? } → gera a camada capítulo a capítulo
 *
 * ## A trava de confiança, e por que ela existe
 *
 * Personalizar com persona rasa produz o pior resultado possível: um texto que
 * AFIRMA falar do negócio do aluno e fala de um negócio genérico. Isso é pior
 * do que não personalizar, porque quebra a promessa na cara dele. Então abaixo
 * de `MINIMA_CONFIANCA` a rota recusa e devolve o que falta preencher — o
 * painel do dossiê usa essa lista para pedir exatamente aquilo.
 */
// ⚠️ A trava, o hash e o prompt saíram deste arquivo em 03/08 e moram em
// `lib/atelie-servidor.ts`. O motivo é o Ateliê: a amostra grátis precisa usar
// o MESMO prompt da geração paga, senão ela vira propaganda enganosa — mostra
// um texto e entrega outro depois do gasto de créditos.

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const curso = new URL(request.url).searchParams.get("curso") || "";

    await dbConnect();
    const user = await User.findById(authUser.id).select("socialPersona name image subscription role enrolledCourses");
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    // Sem `curso`: devolve os cursos do aluno COM título. Nenhuma outra rota
    // faz isso — o progresso guarda só o slug, e "chatgpt-zero" num seletor é
    // pior que não ter seletor.
    if (!curso) {
      const slugs = [...new Set((user.enrolledCourses || []).filter((c) => c.isActive).map((c) => c.courseSlug))];
      if (!slugs.length) return NextResponse.json({ cursos: [] });

      const client = await getMongoClient();
      const produtos = await client
        .db("fayapointProdutos")
        .collection("products")
        .find({ slug: { $in: slugs } }, { projection: { slug: 1, name: 1 } })
        .toArray();

      const titulos = new Map(produtos.map((p) => [p.slug, p.name]));
      return NextResponse.json({
        cursos: slugs.map((s) => ({ slug: s, titulo: titulos.get(s) || s })),
      });
    }

    const persona = (user.socialPersona || {}) as unknown as PersonaProfunda;
    const dossie = montarDossie(persona, { nome: user.name, temFoto: !!user.image, avatar: user.image });
    const camadas = await UserCourseLayer.find({ userId: String(user._id), courseSlug: curso })
      .select("capitulo personaVersion hashCapitulo generatedAt")
      .lean();

    // Para saber se o CURSO mudou desde a camada, é preciso reler o conteúdo e
    // comparar as impressões — é a mesma conta do POST, feita só para relatar.
    let hashAtual = new Map<number, string>();
    try {
      const client = await getMongoClient();
      const prod = await client
        .db("fayapointProdutos")
        .collection("products")
        .findOne({ slug: curso }, { projection: { courseContent: 1 } });
      if (prod?.courseContent) {
        const texto = sanitizeCourseContent(String(prod.courseContent)).content || "";
        hashAtual = new Map(
          dividirCapitulos(texto).map((c) => [c.indice, impressao(c.corpo.slice(0, 2600))])
        );
      }
    } catch {
      // Sem o conteúdo, só não dá para afirmar que envelheceu por curso.
    }

    const versaoAtual = persona.personaVersion || 0;
    return NextResponse.json({
      capitulosComCamada: camadas.length,
      confianca: dossie.confianca,
      minima: MINIMA_CONFIANCA,
      pronto: dossie.confianca >= MINIMA_CONFIANCA,
      // Envelheceu por qualquer um dos dois lados: a persona mudou, ou o
      // capítulo foi reescrito debaixo da camada.
      desatualizada: camadas.some(
        (c) =>
          (c.personaVersion || 0) < versaoAtual ||
          (hashAtual.size > 0 && hashAtual.get(c.capitulo) !== undefined && hashAtual.get(c.capitulo) !== (c.hashCapitulo || ""))
      ),
      faltando: dossie.dimensoes
        .filter((d) => d.confianca < 50)
        .flatMap((d) => d.faltando.slice(0, 1).map((f) => ({ dimensao: d.titulo, ...f }))),
    });
  } catch (error) {
    console.error("[curso-personalizado] GET", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    /**
     * ⚠️ Deixou de ser exclusivo do Expert em 03/08/2026.
     *
     * Trancar a personalização num plano fazia duas coisas ruins ao mesmo
     * tempo. Tirava do Explorador e do Profissional a única razão de existir
     * dos créditos que eles já pagam — 100 e 300 por mês que não compravam
     * nada que valesse a pena. E dava ao Expert de graça aquilo que devia ser
     * a prova de valor do produto, esvaziando o motivo de subir de plano.
     *
     * Agora quem manda é o CRÉDITO. Todo mundo pode personalizar; o plano
     * decide quanto cabe por mês. É o laço que o Ricardo desenhou: crédito
     * útil puxa tier maior, e tier maior não precisa mais trancar leitura.
     */
    const body = await request.json().catch(() => ({}));
    const curso = typeof body.curso === "string" ? body.curso.trim() : "";
    const refazer = body.refazer === true;
    if (!curso) return NextResponse.json({ error: "curso é obrigatório" }, { status: 400 });

    // O livro sagrado não se reescreve — nem por URL montada à mão. Esta é a
    // rota que chama o modelo e debita o crédito, então é aqui que a recusa
    // precisa acontecer, antes de qualquer gasto.
    if (!podePersonalizar(curso)) {
      return NextResponse.json(
        { error: motivoSemPersonalizacao(curso) || "Este curso não aceita personalização" },
        { status: 403 },
      );
    }

    /**
     * ⚠️ Só personaliza curso que a pessoa PODE LER (03/08/2026).
     *
     * Nasceu junto com a paridade crédito↔real. O plano gratuito passou a
     * receber 30 créditos de boas-vindas, e sem esta guarda ele gastaria os 30
     * reescrevendo trinta capítulos dos quais só consegue abrir três. Seria
     * vender o segundo andar de uma casa sem escada — e com o dinheiro dele.
     *
     * A régua é a matrícula (ou o plano que lê tudo), a mesma que o
     * `GET /api/courses/access` usa para liberar o leitor. Quem comprou o curso
     * avulso é matriculado pelo webhook, então entra por aqui também.
     */
    const temNoAcervo = (user.enrolledCourses || []).some(
      (c: { courseSlug: string; isActive: boolean }) => c.courseSlug === curso && c.isActive,
    );
    const planoLeTudo = TIER_CONFIGS[resolvePlan(user.subscription?.plan || "free")].limits.unlimited;
    if (!temNoAcervo && !planoLeTudo && user.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Este curso ainda não está no seu acervo. Adicione-o primeiro — personalizar capítulos que você não pode abrir gastaria crédito à toa.",
          precisaAcervo: true,
        },
        { status: 403 },
      );
    }

    const persona = (user.socialPersona || {}) as unknown as PersonaProfunda;
    const dossie = montarDossie(persona, { nome: user.name, temFoto: !!user.image, avatar: user.image });
    if (dossie.confianca < MINIMA_CONFIANCA) {
      return NextResponse.json(
        {
          error: `Ainda sei pouco sobre você (${dossie.confianca}%) para escrever no seu contexto sem inventar.`,
          confianca: dossie.confianca,
          minima: MINIMA_CONFIANCA,
          faltando: dossie.dimensoes
            .filter((d) => d.confianca < 50)
            .flatMap((d) => d.faltando.slice(0, 1).map((f) => ({ dimensao: d.titulo, ...f }))),
        },
        { status: 422 }
      );
    }

    const client = await getMongoClient();
    const produto = await client
      .db("fayapointProdutos")
      .collection("products")
      .findOne({ slug: curso }, { projection: { courseContent: 1, name: 1 } });
    if (!produto?.courseContent) {
      return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
    }

    const conteudo = sanitizeCourseContent(String(produto.courseContent)).content || "";
    const capitulos = dividirCapitulos(conteudo);
    if (!capitulos.length) {
      return NextResponse.json({ error: "Este curso ainda não tem capítulos" }, { status: 400 });
    }

    const existentes = await UserCourseLayer.find({ userId: String(user._id), courseSlug: curso })
      .select("capitulo personaVersion hashCapitulo")
      .lean();
    const jaTem = new Map(
      existentes.map((e) => [e.capitulo, { versao: e.personaVersion || 0, hash: e.hashCapitulo || "" }])
    );
    const versao = persona.personaVersion || 0;

    /**
     * ── A portaria: confere o orçamento ANTES de acionar o modelo ──────────
     *
     * A caixa registradora (`debitar`) roda no fim, sobre o que foi realmente
     * escrito. Mas se ninguém conferisse o saldo antes, um aluno com zero
     * crédito dispararia trinta chamadas de modelo e pagaria nada — nós é que
     * pagaríamos a conta.
     *
     * A conta é feita sobre os capítulos que FALTAM, não sobre o curso inteiro:
     * quem já gerou 30 e volta para atualizar 4 depois de aprofundar o perfil
     * paga 4. Cobrar os 30 de novo transformaria "melhorei meu perfil" numa
     * punição, e é justamente esse o comportamento que queremos premiar.
     */
    const aulas = capitulos.filter((c) => c.numero !== null);
    const listaPendente = refazer
      ? aulas
      : aulas.filter((cap) => {
          const anterior = jaTem.get(cap.indice);
          if (anterior === undefined) return true;
          if (anterior.versao < versao) return true;
          return anterior.hash !== impressao(cap.corpo.slice(0, 2600));
        });
    const pendentes = listaPendente.length;

    const saldo = await saldoParaGastar(String(user._id));
    const custoPrevisto = custoDe("custom_course_chapter", pendentes);
    if (pendentes > 0 && saldo.total < custoPrevisto) {
      return NextResponse.json(
        {
          error: `Este curso custa ${custoPrevisto} créditos (${pendentes} capítulos × ${CREDIT_COSTS.custom_course_chapter}) e você tem ${saldo.total}.`,
          creditosNecessarios: custoPrevisto,
          creditosDisponiveis: saldo.total,
          faltam: custoPrevisto - saldo.total,
          capitulosPendentes: pendentes,
        },
        { status: 402 },
      );
    }

    /**
     * ── O LOTE: por que isto não escreve o curso inteiro de uma vez ────────
     *
     * ⚠️ Medido em 03/08/2026, com cronômetro: **20 segundos por capítulo**.
     * Um curso de 30 capítulos levava **dez minutos** numa requisição só —
     * contra `maxDuration = 300`. A conta não fechava nem no melhor cenário: a
     * função morria na metade, o aluno via a aba girar por cinco minutos e
     * recebia um erro de rede, sem saber que metade do curso tinha sido
     * escrita e cobrada.
     *
     * Duas mudanças resolvem, e as duas são necessárias:
     *
     * 1. **Lote pequeno.** Cada requisição escreve no máximo `limite`
     *    capítulos e devolve quantos ainda faltam. O cliente chama de novo até
     *    zerar. Nenhuma requisição chega perto do teto, e fechar a aba no meio
     *    não perde nada — a idempotência retoma de onde parou.
     * 2. **Dentro do lote, em paralelo.** Os capítulos de um lote não dependem
     *    uns dos outros: são chamadas independentes ao modelo, com a mesma
     *    persona. Em série, quatro capítulos custam 80s; juntos, 20s. É a
     *    diferença entre três minutos e dez para o curso inteiro.
     *
     * ⚠️ **O padrão é 2, e o número foi medido, não escolhido.** Com
     * cronômetro, em 03/08: lote de 2 → **12s**; lote de 4 → **41s**. O salto
     * é desproporcional porque o provedor estrangula acima de duas chamadas
     * simultâneas, então o lote maior compra pouca velocidade e paga caro em
     * risco: 41s passa do teto de função síncrona de várias hospedagens (a
     * Netlify corta em 26s), e o corte apareceria só em produção, como
     * capítulo faltando sem erro nenhum na tela.
     *
     * Com 2, um curso de 30 capítulos leva ~3 minutos no total, a barra anda a
     * cada 12 segundos e nenhuma requisição chega perto de qualquer limite.
     * Se um dia o provedor ficar mais rápido, subir este número é a única
     * mudança necessária — mas meça antes.
     */
    const limite = Math.min(8, Math.max(1, Number(body.limite) || 2));
    const loteAtual = listaPendente.slice(0, limite);

    // Uma leitura do registry para o lote inteiro — ele já tem cache de 5 min,
    // mas buscar por capítulo seria pedir a mesma coisa quatro vezes.
    const fatos = await getContentFacts();
    const puladas = aulas.length - pendentes;
    const erros: string[] = [];

    const resultados = await Promise.allSettled(
      loteAtual.map(async (cap) => {
        const trecho = cap.corpo.slice(0, 2600);
        // O hash fica sobre o texto CRU, com os `{{fact:…}}` no lugar. Se
        // resolvesse antes de hashear, cada atualização do registry mudaria a
        // impressão de todos os capítulos e mandaria regerar a camada de todos
        // os alunos — uma conta de LLM por trocar o nome de um modelo.
        const hash = impressao(trecho);
        // Já o que vai para o modelo é resolvido: ele não deve ver token, e
        // muito menos copiar um para dentro do texto que o aluno lê.
        const trechoResolvido = applyContentFacts(trecho, fatos);

        // O prompt, o reforço e a cerca de ```json``` moram em
        // `atelie-servidor.ts` — os mesmos que a amostra grátis usa.
        const { abertura, exemplo, tarefa, model } = await escreverCamada({
          persona,
          nomeDoCurso: String(produto.name || curso),
          numero: cap.numero ?? 1,
          titulo: cap.titulo,
          trecho: trechoResolvido,
        });

        await UserCourseLayer.updateOne(
          { userId: String(user._id), courseSlug: curso, capitulo: cap.indice },
          {
            $set: {
              tituloCapitulo: cap.titulo,
              abertura,
              exemplo,
              tarefa,
              personaVersion: versao,
              hashCapitulo: hash,
              modelUsed: model,
              generatedAt: new Date(),
            },
          },
          { upsert: true },
        );
      }),
    );

    resultados.forEach((r, i) => {
      if (r.status === "rejected") {
        // `cap.numero` e não `indice + 1`: com o preâmbulo pulado, o índice
        // deixou de casar com o número que o aluno vê.
        const cap = loteAtual[i];
        erros.push(`cap ${cap.numero}: ${r.reason instanceof Error ? r.reason.message : "erro"}`);
      }
    });

    const geradas = resultados.filter((r) => r.status === "fulfilled").length;
    // O que sobra para as próximas chamadas. Os que falharam continuam
    // pendentes de propósito: o cliente tenta de novo no lote seguinte, e
    // capítulo que não foi escrito não foi cobrado.
    const restantes = pendentes - geradas;

    /**
     * ── A caixa registradora: cobra o que foi ESCRITO ─────────────────────
     *
     * Depois do laço, e sobre `geradas` — não sobre o que foi pedido. Se o
     * modelo falhar no capítulo 12 de 30, o aluno paga 11 e os erros voltam na
     * resposta. É a única ordem honesta: cobrar antes obrigaria a devolver
     * crédito depois, e estorno é a parte que sempre quebra.
     *
     * A portaria lá em cima já garantiu que o saldo cobre o pior caso, então
     * este débito não falha por falta — mas se falhar, o `ok: false` viaja na
     * resposta em vez de derrubar a geração que já foi entregue.
     */
    let cobranca: { gasto: number; restante: number } | null = null;
    if (geradas > 0) {
      const r = await debitar(
        String(user._id),
        "custom_course_chapter",
        geradas,
        `Curso personalizado: ${produto.name || curso} (${geradas} ${geradas === 1 ? "capítulo" : "capítulos"})`,
      );
      if (r.ok) cobranca = { gasto: r.gasto, restante: r.restante };
    }

    return NextResponse.json({
      geradas,
      puladas,
      restantes,
      /** O total de aulas, para o cliente desenhar "12 de 30". */
      capitulos: aulas.length,
      /** Quantas já estão prontas somando o que já existia. */
      prontas: aulas.length - restantes,
      confianca: dossie.confianca,
      creditosGastos: cobranca?.gasto ?? 0,
      creditosRestantes: cobranca?.restante ?? saldo.total,
      erros: erros.length ? erros : undefined,
    });
  } catch (error) {
    console.error("[curso-personalizado] POST", error);
    return NextResponse.json({ error: "Erro ao personalizar o curso" }, { status: 500 });
  }
}
