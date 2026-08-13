import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserCourseLayer from "@/models/UserCourseLayer";
import { getAuthUser } from "@/lib/auth";
import { getMongoClient } from "@/lib/products";
import {
  TIER_CONFIGS,
  resolvePlan,
  PACOTES_CURSO,
  acharPacote,
  diferencaDePacote,
  type IdPacote,
} from "@/lib/course-tiers";
import { getPrecos } from "@/lib/precos-runtime";
import { sanitizeCourseContent } from "@/lib/course-content-sanitizer";
import { dividirCapitulos } from "@/lib/curso-personalizado";
import { getOrSet, CACHE_TTL } from "@/lib/redis";
import { applyContentFacts, getContentFacts } from "@/lib/content-facts";
import { montarDossie, type PersonaProfunda } from "@/lib/persona";
import { debitar, saldoParaGastar, custoDe, saldoDe, garantirCreditos } from "@/lib/creditos";
import { MINIMA_CONFIANCA, impressao, escreverCamada } from "@/lib/atelie-servidor";
import AtelieConfig from "@/models/AtelieConfig";
import { normalizarAjustes, type Ajustes } from "@/lib/atelie";
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
    // ⚠️ `credits` no projection: sem ele `saldoDe` lê `undefined` e a vitrine
    // mostra "0 créditos" ao lado de um selo dizendo 50 — dois números
    // diferentes para a mesma coisa na mesma tela. Um `select` que esquece um
    // campo não dá erro; dá zero, que é pior.
    const user = await User.findById(authUser.id).select(
      "socialPersona name image subscription role enrolledCourses credits",
    );
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    // Sem `curso`: devolve os cursos do aluno COM título. Nenhuma outra rota
    // faz isso — o progresso guarda só o slug, e "chatgpt-zero" num seletor é
    // pior que não ter seletor.
    if (!curso) {
      // A vitrine mostra saldo, então concede antes de ler — é a leitura do
      // saldo que faz o refill acontecer (não há cron). Ver `lib/creditos.ts`.
      await garantirCreditos(String(user._id));

      /**
       * ⚠️ A lista NÃO é a das matrículas ativas. Já foi, e escondia livro pago.
       *
       * Medido na conta do Ricardo em 13/08/2026:
       *
       *     chatgpt-masterclass  isActive: false   pacotePago: 25 créditos
       *                          16 capítulos escritos em usercourselayers
       *
       * Ele pagou, o livro foi escrito inteiro, e o curso **não aparecia nesta
       * lista** — porque a matrícula tinha sido desligada em algum momento
       * depois da compra. A queixa dele foi exatamente essa: *"Na parte dos
       * meus cursos também não vi o curso"*. O livro existia no banco o tempo
       * todo; era a porta que tinha sumido.
       *
       * O erro de fundo é tratar `enrolledCourses.isActive` como se fosse a
       * lista de coisas que a pessoa POSSUI. Ela é a lista do que ela pode
       * LER agora — coisa diferente, e que muda com assinatura, com suporte,
       * com script de manutenção. Um livro escrito e pago é dela para sempre,
       * e a única fonte de verdade sobre isso são as duas coleções abaixo.
       *
       * Por isso a união dos três conjuntos. As matrículas ativas continuam
       * mandando em quem PODE começar um livro novo (a portaria do POST cuida
       * disso); estas duas outras garantem que nada já comprado desapareça.
       */
      const matriculados = (user.enrolledCourses || [])
        .filter((c) => c.isActive)
        .map((c) => c.courseSlug);
      const [comLivro, comPacote] = await Promise.all([
        UserCourseLayer.distinct("courseSlug", { userId: String(user._id) }),
        AtelieConfig.distinct("courseSlug", {
          userId: String(user._id),
          "pacotePago.id": { $exists: true },
        }),
      ]);
      const slugs = [...new Set([...matriculados, ...comLivro, ...comPacote])];
      if (!slugs.length) return NextResponse.json({ cursos: [] });

      const client = await getMongoClient();
      const produtos = await client
        .db("fayapointProdutos")
        .collection("products")
        .find(
          { slug: { $in: slugs } },
          // A vitrine do Ateliê precisa de capa, nível e número de capítulos —
          // sem eles um curso vira uma linha de texto, que foi exatamente o
          // problema do `<select>` que este produto substituiu.
          { projection: { slug: 1, name: 1, thumbnail: 1, level: 1, contentChapters: 1, shortName: 1 } },
        )
        .toArray();

      const porSlug = new Map(produtos.map((p) => [p.slug, p]));
      const saldo = saldoDe(user as never);
      const precosVitrine = await getPrecos();
      // O que cada curso já foi comprado — a vitrine precisa disto para dizer
      // "já é seu" em vez de repetir o preço de quem já pagou.
      const pagos = await AtelieConfig.find({ userId: String(user._id), courseSlug: { $in: slugs } })
        .select("courseSlug pacotePago")
        .lean();
      const pagoPorSlug = new Map(pagos.map((c) => [c.courseSlug, c.pacotePago?.id as IdPacote | undefined]));

      /**
       * Quantos capítulos JÁ existem escritos por curso.
       *
       * ⚠️ É o que dá porta de entrada ao livro. Sem este número a vitrine não
       * tem como distinguir "curso que você pode personalizar" de "livro que já
       * é seu, escrito e pago" — e foi assim que o livro sumiu depois de
       * pronto: *"entrei e não vi o livro no ateliê e nem na minha seção de
       * cursos"*. Uma agregação, não uma consulta por curso.
       */
      const porCurso = await UserCourseLayer.aggregate<{ _id: string; n: number }>([
        { $match: { userId: String(user._id), courseSlug: { $in: slugs } } },
        { $group: { _id: "$courseSlug", n: { $sum: 1 } } },
      ]);
      const escritosPorSlug = new Map(porCurso.map((c) => [c._id, c.n]));

      return NextResponse.json({
        saldo: saldo.total,
        /**
         * ⚠️ `precoPorCapitulo` **acabou** em 11/08. O preço é do curso, e a
         * vitrine passa a mostrar a escada inteira: o mesmo número para todos
         * os cursos, que é justamente o que o preço de tabela compra.
         */
        pacotes: PACOTES_CURSO.map((p) => ({
          id: p.id,
          titulo: precosVitrine.pacotes[p.id].titulo,
          promessa: precosVitrine.pacotes[p.id].promessa,
          imagem: precosVitrine.pacotes[p.id].imagem,
          emBreve: precosVitrine.pacotes[p.id].emBreve,
          emoji: p.emoji,
          creditos: precosVitrine.custos[p.acao],
        })),
        cursos: slugs.map((s) => {
          const p = porSlug.get(s);
          const capitulos = Number(p?.contentChapters) || null;
          const pacoteJaPago = pagoPorSlug.get(s) || null;
          return {
            slug: s,
            titulo: p?.name || s,
            capa: p?.thumbnail || null,
            nivel: p?.level || null,
            capitulos,
            /** > 0 = já existe livro deste curso, e ele precisa aparecer. */
            escritos: escritosPorSlug.get(s) || 0,
            pacotePago: pacoteJaPago,
            // O que falta pagar para o degrau de entrada. Zero = já é dele.
            custo: diferencaDePacote(pacoteJaPago, "escrito", precosVitrine.custos),
          };
        }),
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

    /**
     * ⚠️ Quem JÁ PAGOU este livro sempre pode terminá-lo.
     *
     * Sem esta linha, a matrícula desligando depois da compra prendia o livro
     * pela metade: a lista do Ateliê passou a mostrar o curso (ver o GET), o
     * botão "continuar escrevendo" aparecia, e a chamada voltava 403
     * "ainda não está no seu acervo" — para um livro que a pessoa comprou.
     * Aconteceu de verdade com o `chatgpt-masterclass` do Ricardo.
     *
     * A portaria continua valendo para começar um livro NOVO, que é o gasto
     * que ela existe para evitar. Terminar o que já foi pago não é gasto novo:
     * `custoPrevisto` sai zero mais abaixo, porque `pacotePago` já está lá.
     */
    const jaComprouEsteCurso = Boolean(
      await AtelieConfig.exists({
        userId: String(user._id),
        courseSlug: curso,
        "pacotePago.id": { $exists: true },
      }),
    );

    if (!temNoAcervo && !planoLeTudo && !jaComprouEsteCurso && user.role !== "admin") {
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

    /**
     * ⚠️ Em cache, e o motivo é o laço de escrita.
     *
     * Este POST é chamado uma vez POR LOTE — um livro de 16 capítulos em lotes
     * de 2 são oito chamadas, e cada uma puxava os mesmos **92 KB de
     * `courseContent`** do Mongo e picava o markdown de novo. Somado ao
     * `/api/user/livro`, que o estúdio bate a cada 4 segundos, escrever UM
     * livro fazia dezenas de leituras idênticas de 92 KB em poucos minutos.
     *
     * Era esse tráfego que enchia as conexões do Atlas até o alerta de
     * "nearing the connection limit" em 13/08/2026.
     *
     * O conteúdo do curso não muda durante a escrita. A camada do aluno, que
     * muda, continua vindo direto do banco logo abaixo.
     */
    const emCache = await getOrSet(
      `atelie:capitulos:${curso}`,
      async () => {
        const client = await getMongoClient();
        const produto = await client
          .db("fayapointProdutos")
          .collection("products")
          .findOne({ slug: curso }, { projection: { courseContent: 1, name: 1 } });
        if (!produto?.courseContent) return null;
        const texto = sanitizeCourseContent(String(produto.courseContent)).content || "";
        return { capitulos: dividirCapitulos(texto), nome: (produto.name as string) || curso };
      },
      CACHE_TTL.COURSE_CONTENT,
    );

    if (!emCache) {
      return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
    }

    const produto = { name: emCache.nome };
    const capitulos = emCache.capitulos;
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

    // Os ajustes do Ateliê para ESTE curso. Sem documento, valem os padrões —
    // que reproduzem exatamente o comportamento anterior a 10/08.
    const configCurso = await AtelieConfig.findOne({ userId: String(user._id), courseSlug: curso }).lean();
    const ajustesDoCurso = normalizarAjustes(configCurso as Partial<Ajustes> | null);

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

    /**
     * ── REGERAR UM CAPÍTULO SÓ (13/08/2026) ────────────────────────────────
     *
     * `{ capitulos: [7] }` reescreve exatamente aqueles índices, mesmo que já
     * existam e estejam em dia. É o que faz o botão "regerar este" do painel
     * do livro funcionar.
     *
     * Ricardo: *"deveria ter inclusive quando clicamos no livro, o controle do
     * que foi feito e o que podemos mudar"*. Poder mudar sem poder refazer só
     * aquele capítulo seria uma promessa vazia: até aqui, mudar o tom obrigava
     * a refazer o livro inteiro (`refazer: true`) — dezesseis chamadas de
     * modelo para trocar uma.
     *
     * ⚠️ Não cobra de novo em curso já pago: `custoPrevisto` sai zero quando
     * `pacotePago` existe, e a caixa registradora lá embaixo só roda com
     * `custoPrevisto > 0`. Num curso ainda NÃO pago, regerar compra o pacote —
     * o que está certo, é a primeira escrita.
     */
    const alvos = Array.isArray(body.capitulos)
      ? [...new Set((body.capitulos as unknown[]).map(Number).filter(Number.isInteger))]
      : null;

    const listaPendente = alvos?.length
      ? aulas.filter((cap) => alvos.includes(cap.indice))
      : refazer
      ? aulas
      : aulas.filter((cap) => {
          const anterior = jaTem.get(cap.indice);
          if (anterior === undefined) return true;
          if (anterior.versao < versao) return true;
          return anterior.hash !== impressao(cap.corpo.slice(0, 2600));
        });
    const pendentes = listaPendente.length;

    /**
     * ── O PREÇO É DO CURSO, NÃO DO CAPÍTULO (11/08/2026) ───────────────────
     *
     * Ricardo: *"reescrever capítulo deve mudar para curso. E cobraremos 25"*.
     *
     * Três consequências, e todas mudam esta rota:
     *
     * 1. **Cobra UMA vez por curso.** O aluno paga o degrau escolhido e o curso
     *    inteiro é dele — inclusive os lotes seguintes, e inclusive as
     *    regerações depois de aprofundar o perfil. A memória disso é
     *    `AtelieConfig.pacotePago`; sem ela, um curso de 30 capítulos gerado em
     *    lotes de 2 cobraria 15 vezes.
     * 2. **Subir de degrau paga a diferença.** Quem comprou "escrito" por 25 e
     *    quer "completo" paga 75, não 100.
     * 3. **Cobra na entrada do primeiro lote**, e não capítulo a capítulo — mas
     *    só depois de o primeiro lote ter escrito alguma coisa (mais abaixo).
     *    Nada escrito, nada cobrado, como sempre foi.
     */
    const pacoteDesejado = acharPacote(typeof body.pacote === "string" ? body.pacote : "escrito").id;
    const jaPago = (configCurso?.pacotePago?.id as IdPacote | undefined) || null;
    const precos = await getPrecos();
    const custoPrevisto = diferencaDePacote(jaPago, pacoteDesejado, precos.custos);

    const saldo = await saldoParaGastar(String(user._id));
    if (pendentes > 0 && custoPrevisto > 0 && saldo.total < custoPrevisto) {
      const nome = precos.pacotes[pacoteDesejado]?.titulo || pacoteDesejado;
      return NextResponse.json(
        {
          error: jaPago
            ? `Subir para "${nome}" custa ${custoPrevisto} créditos a mais e você tem ${saldo.total}.`
            : `"${nome}" custa ${custoPrevisto} créditos (= R$${custoPrevisto}) e você tem ${saldo.total}.`,
          creditosNecessarios: custoPrevisto,
          creditosDisponiveis: saldo.total,
          faltam: custoPrevisto - saldo.total,
          pacote: pacoteDesejado,
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
          // Os ajustes do Ateliê (10/08). Se ficassem só na amostra, a prévia
          // grátis sairia com o tom escolhido e o curso pago sairia com o tom
          // padrão — a decepção chegaria depois do gasto, que é o pior momento.
          ajustes: ajustesDoCurso,
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
     * ── A caixa registradora: o CURSO, uma vez só ─────────────────────────
     *
     * Cobra depois do laço e só se o lote escreveu alguma coisa. É a mesma
     * ordem honesta de antes — nada entregue, nada cobrado; cobrar na frente
     * obrigaria a estornar depois, e estorno é a parte que sempre quebra.
     *
     * O que mudou é o QUE se cobra: o degrau do pacote, uma vez, e não os
     * capítulos deste lote. `pacotePago` é gravado junto, na mesma passada, e é
     * ele que faz o segundo lote sair de graça. A portaria lá em cima já
     * garantiu o saldo.
     *
     * ⚠️ A gravação usa `upsert`: o aluno pode nunca ter tocado nos ajustes, e
     * nesse caso não existe documento de `AtelieConfig` para receber a compra.
     * Sem o `upsert`, a compra sumiria e ele seria cobrado a cada lote.
     */
    let cobranca: { gasto: number; restante: number } | null = null;
    if (geradas > 0 && custoPrevisto > 0) {
      const r = await debitar(
        String(user._id),
        acharPacote(pacoteDesejado).acao,
        1,
        jaPago
          ? `Ateliê — subiu para "${acharPacote(pacoteDesejado).titulo}": ${produto.name || curso}`
          : `Ateliê — "${acharPacote(pacoteDesejado).titulo}": ${produto.name || curso}`,
      );
      if (r.ok) {
        cobranca = { gasto: r.gasto, restante: r.restante };
        await AtelieConfig.updateOne(
          { userId: String(user._id), courseSlug: curso },
          {
            $set: {
              pacotePago: {
                id: pacoteDesejado,
                creditos: (configCurso?.pacotePago?.creditos || 0) + r.gasto,
                pagoEm: new Date(),
              },
            },
          },
          { upsert: true },
        );
      }
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
      pacote: pacoteDesejado,
      creditosGastos: cobranca?.gasto ?? 0,
      creditosRestantes: cobranca?.restante ?? saldo.total,
      erros: erros.length ? erros : undefined,
    });
  } catch (error) {
    console.error("[curso-personalizado] POST", error);
    return NextResponse.json({ error: "Erro ao personalizar o curso" }, { status: 500 });
  }
}
