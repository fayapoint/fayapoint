import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserCourseLayer from "@/models/UserCourseLayer";
import AtelieAmostra from "@/models/AtelieAmostra";
import { getAuthUser } from "@/lib/auth";
import { getMongoClient } from "@/lib/products";
import { resolvePlan, TIER_CONFIGS } from "@/lib/course-tiers";
import { sanitizeCourseContent } from "@/lib/course-content-sanitizer";
import { dividirCapitulos } from "@/lib/curso-personalizado";
import { applyContentFacts, getContentFacts } from "@/lib/content-facts";
import { montarDossie, type PersonaProfunda } from "@/lib/persona";
import { saldoDe, garantirCreditos } from "@/lib/creditos";
import { getPrecos } from "@/lib/precos-runtime";
import {
  montarOrcamento,
  calibrar,
  normalizarAjustes,
  EXTENSOES,
  FOCOS,
  PROFUNDIDADES,
  TONS_AJUSTE,
  type Ajustes,
  type IdOpcao,
} from "@/lib/atelie";
import AtelieConfig from "@/models/AtelieConfig";
import { NARRADORES, temNarracaoPronta } from "@/data/narradores";
import { MINIMA_CONFIANCA, primeiroCapituloUtil } from "@/lib/atelie-servidor";
import { podePersonalizar, motivoSemPersonalizacao } from "@/lib/curso-personalizavel";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/atelie?curso=<slug>
 *
 * Tudo o que a página do Ateliê precisa, numa chamada só.
 *
 * ## Por que uma chamada e não cinco
 *
 * A página mostra, ao mesmo tempo: o curso, o quanto conhecemos o aluno, o que
 * falta perguntar, quanto custa, quanto ele tem e o que já foi feito. Buscar
 * isso em cinco rotas produziria cinco estados de carregamento e uma tela que
 * se monta aos pedaços na frente da pessoa — justamente a tela que precisa
 * transmitir cuidado, porque é ela que pede dinheiro.
 *
 * Tudo aqui é LEITURA. Nada é gerado, nada é cobrado: abrir o Ateliê é de
 * graça, sempre. O que custa é o `POST` (amostra, uma vez) e a geração.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const curso = new URL(request.url).searchParams.get("curso")?.trim() || "";
    if (!curso) return NextResponse.json({ error: "curso é obrigatório" }, { status: 400 });

    // ⚠️ O padrão mudou de `texto` para `escrito` em 11/08: as opções viraram
    // degraus (`PACOTES_CURSO`) e um id antigo cairia no primeiro degrau de
    // qualquer jeito — mas cairia calado, e o preço na tela sairia errado.
    const escolhidas = (new URL(request.url).searchParams.get("opcoes") || "escrito")
      .split(",")
      .filter(Boolean) as IdOpcao[];

    await dbConnect();
    const user = await User.findById(authUser.id).select(
      "socialPersona name image subscription role credits enrolledCourses",
    );
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const plano = resolvePlan(user.subscription?.plan || "free");
    const temNoAcervo = (user.enrolledCourses || []).some(
      (c: { courseSlug: string; isActive: boolean }) => c.courseSlug === curso && c.isActive,
    );

    // O Ateliê é a primeira tela que fala de crédito, então é aqui que o
    // crédito de boas-vindas precisa existir — mostrar saldo zero para quem
    // nunca recebeu seria pedir dinheiro antes de dar o primeiro passo. E é
    // aqui também que o ciclo do assinante vira, pelo mesmo motivo.
    //
    // ⚠️ Relê o documento em vez de somar o que foi concedido: o refill mensal
    // **repõe** o saldo (`$set`), não soma. Somar mostraria 800 para um Expert
    // que tinha 400 e virou o ciclo — o dobro do que ele tem para gastar, e a
    // conta só bateria de novo depois que o gasto falhasse.
    const ganhou = await garantirCreditos(String(user._id));
    if (ganhou) {
      const fresco = await User.findById(user._id).select("credits");
      if (fresco?.credits) user.credits = fresco.credits;
    }

    const client = await getMongoClient();
    const produto = await client
      .db("fayapointProdutos")
      .collection("products")
      .findOne(
        { slug: curso, type: "course" },
        { projection: { slug: 1, name: 1, shortName: 1, thumbnail: 1, level: 1, courseContent: 1, tool: 1 } },
      );
    if (!produto) return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });

    const conteudo = sanitizeCourseContent(String(produto.courseContent || "")).content || "";
    const capitulos = dividirCapitulos(conteudo).filter((c) => c.numero !== null);

    const persona = (user.socialPersona || {}) as unknown as PersonaProfunda;
    const dossie = montarDossie(persona, {
      nome: user.name,
      temFoto: !!user.image,
      avatar: user.image,
    });

    const camadas = await UserCourseLayer.find({ userId: String(user._id), courseSlug: curso })
      .select("capitulo personaVersion")
      .lean();
    const versao = persona.personaVersion || 0;
    const camadasValidas = camadas.filter((c) => (c.personaVersion || 0) >= versao);

    const amostra = await AtelieAmostra.findOne({ userId: String(user._id), courseSlug: curso }).lean();

    const saldo = saldoDe(user);

    // Os ajustes deste aluno para ESTE curso. Ausentes, valem os padrões — a
    // tela nunca abre sem uma escolha marcada.
    const configSalva = await AtelieConfig.findOne({ userId: String(user._id), courseSlug: curso }).lean();
    const ajustes = normalizarAjustes(configSalva as Partial<Ajustes> | null);

    const orcamento = montarOrcamento({
      capitulos: capitulos.length,
      capitulosJaFeitos: camadasValidas.length,
      temCadernoDePersonagem: (persona.caderno?.imagens || []).length > 0,
      escolhidas,
      // O degrau que este aluno já comprou neste curso: é ele que faz o segundo
      // lote (e o "refazer") custarem zero, e a subida custar só a diferença.
      pacotePago: (configSalva?.pacotePago?.id as IdOpcao | undefined) || null,
      narracaoPronta: temNarracaoPronta(curso, ajustes.narrador),
      // ⚠️ A tabela VIVA. Sem isto, o Ateliê mostraria o preço compilado e o
      // `POST /api/user/curso-personalizado` cobraria o do Mission Control.
      precos: (await getPrecos()).custos,
    });

    // O capítulo que serve de amostra é escolhido aqui e no POST pela MESMA
    // função — senão a tela promete o antes e depois de um capítulo e o
    // servidor escreve sobre outro.
    const capAmostra = primeiroCapituloUtil(capitulos);

    return NextResponse.json({
      curso: {
        slug: produto.slug,
        titulo: produto.shortName || produto.name || produto.slug,
        nomeCompleto: produto.name || produto.slug,
        capa: produto.thumbnail || null,
        nivel: produto.level || null,
        ferramenta: produto.tool || null,
        capitulos: capitulos.length,
      },
      persona: {
        confianca: dossie.confianca,
        minima: MINIMA_CONFIANCA,
        qualidade: dossie.qualidade,
        resumo: dossie.resumo,
        ...calibrar(dossie.confianca, MINIMA_CONFIANCA),
        // As sete dimensões inteiras: o medidor precisa mostrar o que JÁ
        // sabemos, não só o que falta. Um painel que só cobra é um formulário.
        dimensoes: dossie.dimensoes.map((d) => ({
          id: d.id,
          titulo: d.titulo,
          paraQue: d.paraQue,
          confianca: d.confianca,
          conhecido: d.conhecido.slice(0, 3),
          faltando: d.faltando.slice(0, 2),
        })),
      },
      camada: {
        capitulos: camadasValidas.length,
        desatualizados: camadas.length - camadasValidas.length,
        completo: capitulos.length > 0 && camadasValidas.length >= capitulos.length,
      },
      amostra: amostra
        ? {
            capitulo: amostra.capitulo,
            tituloCapitulo: amostra.tituloCapitulo,
            original: amostra.original,
            abertura: amostra.abertura,
            exemplo: amostra.exemplo,
            tarefa: amostra.tarefa,
            confianca: amostra.confianca,
            envelheceu: (amostra.personaVersion || 0) < versao,
          }
        : null,
      amostraDisponivel: capAmostra
        ? { capitulo: capAmostra.indice, titulo: capAmostra.titulo, numero: capAmostra.numero }
        : null,
      creditos: {
        saldo: saldo.total,
        mensal: saldo.mensal,
        comprado: saldo.comprado,
      },
      orcamento,
      /**
       * Os ajustes e o catálogo inteiro na MESMA resposta.
       *
       * O catálogo poderia ser importado direto no componente — mas ele é a
       * fonte das instruções que vão para o prompt, e mandá-lo do servidor
       * garante que a tela nunca ofereça uma opção que o motor desta versão não
       * sabe interpretar.
       */
      ajustes,
      catalogo: {
        tons: TONS_AJUSTE,
        profundidades: PROFUNDIDADES,
        extensoes: EXTENSOES,
        focos: FOCOS,
        narradores: NARRADORES.map((n) => ({
          ...n,
          jaGravado: temNarracaoPronta(curso, n.id),
        })),
      },
      /** O material que a prévia de estúdio toca — vídeo mudo + voz. */
      previa: {
        video: `/cursos/intro/${curso}.webm`,
        poster: `/cursos/intro/${curso}.webp`,
      },
      plano: plano,
      /**
       * Pode gastar crédito neste curso?
       *
       * Espelha a guarda do `POST /api/user/curso-personalizado`: personalizar
       * capítulo que a pessoa não consegue abrir gastaria o dinheiro dela à
       * toa. A tela precisa saber ANTES do clique — descobrir no 403 seria
       * deixar a pessoa montar o orçamento inteiro para levar não.
       */
      podeGastar: temNoAcervo || TIER_CONFIGS[plano].limits.unlimited,
      temNoAcervo,
    });
  } catch (error) {
    console.error("[atelie] GET", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * PATCH /api/user/atelie — grava os ajustes deste aluno para este curso.
 *
 * Não gera nada e não cobra nada: é só a escolha. A amostra (POST) e a geração
 * paga leem daqui, então trocar o tom e pedir a amostra de novo mostra a
 * diferença de graça — que é o ponto de ter uma prévia.
 */
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const curso = typeof body.curso === "string" ? body.curso.trim() : "";
    if (!curso) return NextResponse.json({ error: "curso é obrigatório" }, { status: 400 });

    // ⚠️ Normaliza SEMPRE: o corpo vem do cliente e uma opção inventada viraria
    // instrução desconhecida no prompt — ou, pior, `undefined` no meio da lista
    // numerada que o modelo lê.
    const ajustes = normalizarAjustes(body.ajustes);
    if (!NARRADORES.some((n) => n.id === ajustes.narrador)) {
      ajustes.narrador = NARRADORES[0].id;
    }

    await dbConnect();
    await AtelieConfig.findOneAndUpdate(
      { userId: authUser.id, courseSlug: curso },
      { $set: { ...ajustes, atualizadoEm: new Date() } },
      { upsert: true, new: true },
    );

    return NextResponse.json({ ok: true, ajustes });
  } catch (error) {
    console.error("[atelie] PATCH", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * POST /api/user/atelie — a amostra grátis.
 *
 * Uma chamada de modelo, cacheada por (aluno, curso). `{ refazer: true }`
 * regenera, e só é oferecido pela tela quando a persona mudou desde a última —
 * do contrário o botão viraria uma torneira aberta de chamadas idênticas.
 *
 * ⚠️ **Roda ABAIXO da confiança mínima de propósito.** É a única coisa no
 * sistema que roda. A trava existe para não injetar texto genérico dentro da
 * aula que o aluno lê; aqui o texto não entra em aula nenhuma — ele fica ao
 * lado do original, rotulado com a confiança que o produziu. Ver o próprio
 * texto sair morno é o argumento mais convincente que existe para completar o
 * perfil, e nenhum texto de marketing nosso faz esse trabalho tão bem.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await dbConnect();
    const user = await User.findById(authUser.id).select("socialPersona name image subscription role");
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const curso = typeof body.curso === "string" ? body.curso.trim() : "";
    const refazer = body.refazer === true;
    if (!curso) return NextResponse.json({ error: "curso é obrigatório" }, { status: 400 });

    // A trava do livro sagrado tem de estar na ROTA, não só no botão. Esconder o
    // link não impede um POST montado à mão, e é este endpoint que chama o
    // modelo, gasta crédito e grava a amostra.
    if (!podePersonalizar(curso)) {
      return NextResponse.json(
        { error: motivoSemPersonalizacao(curso) || "Este curso não aceita personalização" },
        { status: 403 },
      );
    }

    const persona = (user.socialPersona || {}) as unknown as PersonaProfunda;
    const dossie = montarDossie(persona, { nome: user.name, temFoto: !!user.image, avatar: user.image });
    const versao = persona.personaVersion || 0;

    // A amostra usa os MESMOS ajustes da geração paga — é o que a torna prévia
    // em vez de propaganda. Trocar o tom e refazer mostra a diferença real.
    const configAmostra = await AtelieConfig.findOne({ userId: String(user._id), courseSlug: curso }).lean();
    const ajustesAmostra = normalizarAjustes(configAmostra as Partial<Ajustes> | null);

    const jaTem = await AtelieAmostra.findOne({ userId: String(user._id), courseSlug: curso });
    if (jaTem && !refazer) {
      return NextResponse.json({ amostra: jaTem, reaproveitada: true });
    }
    /**
     * Refazer só faz sentido quando há o que mudar. Sem esta guarda, um clique
     * repetido gastaria uma chamada de modelo para reescrever o mesmo texto.
     *
     * São DUAS coisas que podem ter mudado: a persona (`personaVersion`) e os
     * ajustes deste curso (`atualizadoEm` da config). Quando os ajustes entraram
     * (10/08), checar só a persona teria transformado o botão "ver com o novo
     * tom" numa mentira silenciosa: ele devolveria a amostra velha com cara de
     * nova.
     */
    const ajustesMudaram =
      !!configAmostra?.atualizadoEm &&
      !!jaTem?.generatedAt &&
      new Date(configAmostra.atualizadoEm) > new Date(jaTem.generatedAt);
    if (jaTem && refazer && (jaTem.personaVersion || 0) >= versao && !ajustesMudaram) {
      return NextResponse.json({ amostra: jaTem, reaproveitada: true });
    }

    const client = await getMongoClient();
    const produto = await client
      .db("fayapointProdutos")
      .collection("products")
      .findOne({ slug: curso, type: "course" }, { projection: { courseContent: 1, name: 1 } });
    if (!produto?.courseContent) {
      return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
    }

    const conteudo = sanitizeCourseContent(String(produto.courseContent)).content || "";
    const cap = primeiroCapituloUtil(dividirCapitulos(conteudo).filter((c) => c.numero !== null));
    if (!cap) return NextResponse.json({ error: "Este curso ainda não tem capítulos" }, { status: 400 });

    const { escreverCamada } = await import("@/lib/atelie-servidor");
    const fatos = await getContentFacts();
    const trecho = applyContentFacts(cap.corpo.slice(0, 2600), fatos);

    const escrita = await escreverCamada({
      persona,
      nomeDoCurso: String(produto.name || curso),
      numero: cap.numero ?? 1,
      titulo: cap.titulo,
      trecho,
      ajustes: ajustesAmostra,
    });

    // O "antes": as primeiras linhas do capítulo, sem cabeçalho e sem token
    // cru. É o lado esquerdo da comparação e precisa ser o texto REAL que a
    // pessoa leria — não um resumo escrito por nós.
    const original = trecho
      .replace(/^#.*$/gm, "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(" ")
      .slice(0, 420);

    const doc = await AtelieAmostra.findOneAndUpdate(
      { userId: String(user._id), courseSlug: curso },
      {
        $set: {
          capitulo: cap.indice,
          tituloCapitulo: cap.titulo,
          original,
          abertura: escrita.abertura,
          exemplo: escrita.exemplo,
          tarefa: escrita.tarefa,
          confianca: dossie.confianca,
          personaVersion: versao,
          modelUsed: escrita.model,
          generatedAt: new Date(),
        },
      },
      { new: true, upsert: true },
    );

    return NextResponse.json({ amostra: doc, reaproveitada: false });
  } catch (error) {
    console.error("[atelie] POST", error);
    return NextResponse.json(
      { error: "Não deu para escrever a amostra agora. Tente de novo em instantes." },
      { status: 500 },
    );
  }
}
