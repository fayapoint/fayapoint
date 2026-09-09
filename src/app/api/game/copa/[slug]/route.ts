import { NextResponse } from "next/server";
import { cobrar } from "@/lib/game/limite";
import {
  partidasDaCopa,
  agruparEmSeries,
  timePorClube,
  classificacaoPelaEA,
  conferir,
} from "@/lib/game/copa";

/**
 * GET /api/game/copa/[slug] — tudo da copa numa resposta só.
 *
 * Uma resposta só porque a página é UMA tela: grupos, séries e artilharia
 * saem todos das mesmas partidas espelhadas. Três rotas fariam três vezes a
 * mesma leitura do Mongo e ainda abririam a chance de as três discordarem
 * entre si por meio segundo de diferença.
 *
 * ⚠️ Nada aqui vai à EA. A EA responde 403 para IP de datacenter, e além
 * disso o histórico só existe no espelho — a fonte guarda 10 amistosos por
 * clube e joga o resto fora.
 */
export const dynamic = "force-dynamic";

/**
 * A CAPA DE UMA NOTÍCIA EM VÍDEO — derivada do endereço, não guardada.
 *
 * Notícia de Pro Clubs é quase sempre vídeo, e uma lista de links azuis não diz
 * nada a quem chegou procurando saber da copa. A capa que o YouTube publica
 * para o vídeo é a mesma que aparece quando qualquer pessoa compartilha aquele
 * link — é a representação canônica dele, servida pelo próprio YouTube.
 *
 * Derivada em vez de guardada por dois motivos: uma cópia nossa seria
 * duplicação sem ganho, e envelheceria calada no dia em que o canal trocasse a
 * capa. O campo `imagem` do documento continua existindo para o outro caso —
 * arte NOSSA. Nunca para hospedar imagem de terceiro.
 *
 * Devolve `null` para qualquer endereço que não seja vídeo do YouTube: sem id,
 * sem capa, e a tela mostra a notícia sem imagem em vez de um quadrado quebrado.
 */
function capaDeVideo(url: string): string | null {
  try {
    const u = new URL(url);
    const id =
      u.hostname.endsWith("youtu.be")
        ? u.pathname.slice(1)
        : /(?:^|\.)youtube\.com$/.test(u.hostname)
          ? u.searchParams.get("v")
          : null;
    return id && /^[\w-]{6,20}$/.test(id) ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const teto = await cobrar(req, "aposta-leitura", `copa:${slug}`);
  if (!teto.ok) return teto.resposta!;

  const { copa, partidas } = await partidasDaCopa(slug);
  if (!copa) return NextResponse.json({ error: "copa não encontrada" }, { status: 404 });

  const nomeDoClube = timePorClube(copa.times);
  const series = agruparEmSeries(partidas as never, nomeDoClube);
  const grupoDoTime = (n: string) => copa.times.find((t) => t.nome === n)?.grupo;
  const calculada = classificacaoPelaEA(series, grupoDoTime);
  const conferencia = conferir(copa.classificacaoOficial ?? [], calculada);

  // Artilharia e notas, das súmulas por jogador. Só das partidas que passaram
  // no filtro de copa — jogo do dia a dia do clube não entra na artilharia.
  const porJogador = new Map<
    string,
    { gamertag: string; time: string; gols: number; assistencias: number; jogos: number; somaNota: number; defesas: number }
  >();
  for (const p of partidas) {
    const bruto = p.dados as { clubs?: Array<{ clubId: string | number; players?: Array<Record<string, unknown>> }> };
    for (const c of bruto.clubs ?? []) {
      const time = nomeDoClube(String(c.clubId));
      for (const j of c.players ?? []) {
        const tag = String(j.name ?? "");
        if (!tag) continue;
        const chave = `${time}|${tag}`;
        if (!porJogador.has(chave)) {
          porJogador.set(chave, { gamertag: tag, time, gols: 0, assistencias: 0, jogos: 0, somaNota: 0, defesas: 0 });
        }
        const r = porJogador.get(chave)!;
        r.gols += Number(j.goals ?? 0);
        r.assistencias += Number(j.assists ?? 0);
        r.defesas += Number(j.saves ?? 0);
        r.somaNota += Number(j.rating ?? 0);
        r.jogos++;
      }
    }
  }
  const jogadores = [...porJogador.values()]
    .map((j) => ({ ...j, nota: j.jogos ? Math.round((j.somaNota / j.jogos) * 10) / 10 : 0 }))
    .sort((a, b) => b.gols - a.gols || b.assistencias - a.assistencias);

  return NextResponse.json(
    {
      copa: {
        slug: copa.slug,
        nome: copa.nome,
        edicao: copa.edicao,
        jogo: copa.jogo,
        descricao: copa.descricao,
        organizacao: copa.organizacao,
        formato: copa.formato,
        status: copa.status,
        comecouEm: copa.comecouEm,
        oficialCapturadaEm: copa.oficialCapturadaEm ?? null,
        times: copa.times.map((t) => ({
          nome: t.nome,
          presidente: t.presidente ?? null,
          grupo: t.grupo ?? null,
          eaClubName: t.eaClubName ?? null,
          eaClubId: t.eaClubId ?? null,
          vinculo: t.vinculo,
          /**
           * ⛔ `evidencia` NÃO SAI MAIS AQUI.
           *
           * Ela guarda a prova em texto humano — "9 amistosos 11v11 desde
           * 10/08", "nome 95% parecido", "jogou contra 3 times da copa". Junta,
           * a lista descreve o algoritmo de vinculação inteiro. É o ativo da
           * Federação, e a rota pública deixa de entregá-lo (Estatuto, art. 20).
           *
           * Ela continua inteira no banco e continua saindo na rota da
           * Federação, que é fechada: quem decide precisa da procedência, e
           * auditoria sem trilha é palavra vazia (art. 22).
           *
           * O que fica no público é o GRAU do vínculo e QUANDO foi auditado —
           * o que a medida é e quando, sem como.
           */
          auditadoEm: t.vinculadoEm ? t.vinculadoEm.toISOString() : null,
          // O resultado NEGATIVO da busca também é informação: sem ele a tela
          // não distingue "ninguém procurou" de "procuramos e não é nenhum".
          /**
           * A DATA da auditoria sai; a NOTA dela, não.
           *
           * `buscaNota` diz "40 clubes com nome parecido; nenhum jogou contra
           * time da copa nem tem amistoso 11v11 no período" — que é o critério
           * de decisão escrito por extenso. Fica na rota da Federação.
           *
           * A data sozinha ainda sustenta a frase que importa e que não é
           * método: a auditoria rodou, foi neste dia, e não achou. Sem ela, o
           * vazio voltaria a ler como página quebrada.
           */
          buscadoEm: t.buscadoEm ? t.buscadoEm.toISOString() : null,
        })),
      },
      /**
       * ⛔ `declaracoes` NÃO SAI NA ROTA PÚBLICA.
       *
       * Ela guarda, com URL, todo site que publica tabela desta copa. É mapa de
       * origem: quem tem a lista monta a mesma cobertura. Ativo da Federação
       * (Estatuto, art. 20), e continua inteira na rota da Federação.
       *
       * O que sobrevive no público é o FATO de que as versões publicadas por aí
       * divergem entre si — dito sem nomear ninguém. Esconder a divergência
       * seria deixar o leitor achar que o número desta página é o consenso, e
       * ele não é (art. 21).
       */
      noticias: (copa.noticias ?? [])
        .slice()
        .sort((a, b) => (b.em?.getTime() ?? 0) - (a.em?.getTime() ?? 0))
        .map((n) => ({
          titulo: n.titulo,
          fonte: n.fonte,
          url: n.url,
          em: n.em ?? null,
          resumo: n.resumo ?? null,
          imagem: n.imagem || capaDeVideo(n.url),
        })),
      // O que a EA mostra. NUNCA rotulado como "a tabela da copa" — ver o
      // comentário de `classificacaoPelaEA`.
      pelaEA: calculada,
      series: series.slice(0, 40).map((s) => ({
        timeCasa: s.timeCasa,
        timeFora: s.timeFora,
        vitoriasCasa: s.vitoriasCasa,
        vitoriasFora: s.vitoriasFora,
        comecouEm: s.comecouEm,
        jogos: s.jogos,
      })),
      artilharia: jogadores.filter((j) => j.gols > 0).slice(0, 20),
      goleiros: jogadores.filter((j) => j.defesas >= 3).sort((a, b) => b.defesas - a.defesas).slice(0, 10),
      conferencia,
      cobertura: {
        timesVinculados: copa.times.filter((t) => t.eaClubId).length,
        timesTotal: copa.times.length,
        confrontos: series.length,
        partidas: partidas.length,
        /**
         * O AVISO PÚBLICO — o que a medida É, sem dizer COMO ela é feita.
         *
         * A versão anterior explicava a mecânica da origem ("a EA guarda apenas
         * 10 partidas amistosas por clube…"). Isso é método, e método é ativo da
         * Federação: publicá-lo é entregar a receita de montar uma cobertura
         * igual a esta (Estatuto, art. 20).
         *
         * ⛔ O que NÃO pode sumir junto: o limite do que a medida sustenta.
         * Continuamos dizendo que estes são confrontos REGISTRADOS entre times
         * da copa e que não distinguimos jogo oficial de treino — porque afirmar
         * "estes são os jogos da copa" seria afirmação que não temos como
         * provar. Sigilo de método nunca autoriza afirmação falsa (art. 21).
         */
        aviso:
          "Confrontos entre times da copa registrados e auditados pelos sistemas proprietários da FayAI. A leitura não distingue jogo oficial de treino entre dois times da copa, e por isso não é apresentada como a tabela oficial da competição.",
      },
    },
    {
      headers: {
        /**
         * ⚠️ `Cache-Control` NÃO CHEGA À BORDA — medido em 08/09.
         *
         * `export const dynamic = "force-dynamic"` faz o Next reescrever a
         * resposta com `no-store,no-cache,must-revalidate`, apagando o
         * `s-maxage` que esta linha escrevia. Conferido em produção nas quatro
         * rotas do /game que tentavam cachear: todas saíam com `no-store` e
         * `Cache-Status: "Netlify Durable"; fwd=bypass`. O cabeçalho estava ali
         * havia dias sem cachear nada — a intenção existia, o efeito não.
         *
         * `Netlify-CDN-Cache-Control` é um cabeçalho SEPARADO, que o Next não
         * mexe e a borda da Netlify lê. O navegador continua com `no-store`;
         * quem passa a guardar é a borda.
         *
         * Custava: 16 s no primeiro acesso (função fria), 1,8 a 7,5 s depois —
         * numa página que é uma leitura pública, igual para todo mundo, e cujo
         * conteúdo só muda quando o coletor roda, de hora em hora.
         *
         * ⛔ Isto só vale porque esta rota é PÚBLICA e não varia por usuário.
         * Não copie para `carteira`, `federacao` ou `descobertas`: guardar na
         * borda uma resposta pessoal é entregá-la ao próximo visitante.
         */
        "Netlify-CDN-Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    }
  );
}
