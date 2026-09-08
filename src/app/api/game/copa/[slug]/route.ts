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
          evidencia: t.evidencia,
          // O resultado NEGATIVO da busca também é informação: sem ele a tela
          // não distingue "ninguém procurou" de "procuramos e não é nenhum".
          buscadoEm: t.buscadoEm ? t.buscadoEm.toISOString() : null,
          buscaNota: t.buscaNota ?? null,
        })),
      },
      // O que cada fonte AFIRMA, e as notícias. A divergência entre elas é
      // informação, não ruído: o anúncio original fala em 16 times e os sites
      // de tabela publicam 20. Mostrar as duas é o produto.
      declaracoes: (copa.declaracoes ?? []).map((d) => ({
        fonte: d.fonte,
        url: d.url ?? null,
        afirma: d.afirma,
        lidoEm: d.lidoEm,
      })),
      noticias: (copa.noticias ?? [])
        .slice()
        .sort((a, b) => (b.em?.getTime() ?? 0) - (a.em?.getTime() ?? 0))
        .map((n) => ({ titulo: n.titulo, fonte: n.fonte, url: n.url, em: n.em ?? null, resumo: n.resumo ?? null })),
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
        // A frase que a tela precisa dizer, montada aqui para não divergir.
        aviso:
          "A EA guarda apenas 10 partidas amistosas por clube. O que está aqui é o que conseguimos capturar antes de a fonte descartar — e não distingue jogo oficial de treino entre times da copa.",
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
