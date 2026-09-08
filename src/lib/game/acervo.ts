import dbConnect from "@/lib/mongodb";
import GameAcervo, { type EscopoAcervo } from "@/models/GameAcervo";
import GameCompeticao from "@/models/GameCompeticao";
import GameConfronto from "@/models/GameConfronto";
import GameTime from "@/models/GameTime";
import {
  partidasDaCopa,
  agruparEmSeries,
  timePorClube,
  classificacaoPelaEA,
  type LinhaCalculada,
  type SerieDaCopa,
} from "./copa";

/**
 * O ACERVO — fotografar campeonato, seja de quem for. 08/09/2026.
 *
 * ## O melhor dos dois mundos, que é o pedido do Ricardo
 *
 * Existem dois tipos de campeonato aqui, e eles nasceram separados por bons
 * motivos:
 *
 *   **copa** (`GameCopa`) — competição de TERCEIRO que a gente cobre. Tem dado
 *   real da EA, súmula por jogador, e um de-para de clube com evidência. Não
 *   tem regra nossa, nem tabela oficial nossa, nem poder de homologar nada.
 *
 *   **competicao** (`GameCompeticao`) — campeonato que o USUÁRIO organiza aqui.
 *   Tem motor de tabela, chaveamento, desempate, consenso de capitães e
 *   premiação. Não tinha histórico nem acervo de jogador.
 *
 * Este arquivo é a ponte: ele fotografa **os dois** no mesmo formato. A partir
 * daqui, a competição do usuário ganha o acervo e a série histórica que só a
 * copa tinha, e a copa ganha a possibilidade de ser lida pelas mesmas telas.
 *
 * A ponte é de LEITURA, de propósito. Ela não dá à copa o poder de gerar
 * confronto, nem tira da competição o direito de ter as próprias regras. Cada
 * um continua sendo o que é; o que passa a ser comum é o retrato.
 *
 * ## Por que fotografar em vez de calcular na hora
 *
 * Porque o cálculo na hora ENCOLHE. A EA guarda 10 partidas amistosas por
 * clube; uma série MD5 queima cinco numa noite. O acumulado que a gente
 * calcula hoje das partidas visíveis vai dar menos amanhã, quando metade
 * delas sumir da fonte.
 *
 * A fotografia de hoje é a única coisa que amanhã ainda vai saber que
 * aconteceu.
 */

/** O dia de uma data em `AAAA-MM-DD`, que é a granularidade do acervo. */
export function diaDe(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export interface ResumoFotografia {
  times: number;
  jogadores: number;
  dia: string;
}

/**
 * Grava as fotografias de um dia, em lote.
 *
 * `bulkWrite` com upsert por (escopo, ref, tipo, chave, dia): rodar de hora em
 * hora atualiza a mesma linha em vez de criar 24 por dia. É o que deixa o
 * coletor ser frequente sem inflar a coleção.
 */
async function gravar(
  escopo: EscopoAcervo,
  refId: string,
  linhas: Array<{ tipo: "time" | "jogador"; chave: string; time?: string; dados: Record<string, number> }>,
  dia = diaDe()
): Promise<number> {
  if (linhas.length === 0) return 0;
  await dbConnect();
  const ops = linhas.map((l) => ({
    updateOne: {
      filter: { escopo, refId, tipo: l.tipo, chave: l.chave, dia },
      update: { $set: { time: l.time, dados: l.dados, em: new Date(), sourceGrade: "B" } },
      upsert: true,
    },
  }));
  const r = await GameAcervo.bulkWrite(ops, { ordered: false });
  return (r.upsertedCount ?? 0) + (r.modifiedCount ?? 0);
}

/**
 * Fotografa uma COPA de terceiro, a partir do que o espelho tem.
 *
 * Só conta partida que passou no filtro de copa — jogo do dia a dia do clube
 * não entra na artilharia de um campeonato.
 */
export async function fotografarCopa(slug: string): Promise<ResumoFotografia> {
  const { copa, partidas } = await partidasDaCopa(slug);
  if (!copa) return { times: 0, jogadores: 0, dia: diaDe() };

  const nomeDoClube = timePorClube(copa.times);
  const series = agruparEmSeries(partidas as never, nomeDoClube);
  const grupoDoTime = (n: string) => copa.times.find((t) => t.nome === n)?.grupo;
  const tabela = classificacaoPelaEA(series, grupoDoTime);

  const linhas = [
    ...linhasDeTime(tabela),
    ...linhasDeJogador(partidas, nomeDoClube),
  ];
  const n = await gravar("copa", slug, linhas);
  return {
    times: linhas.filter((l) => l.tipo === "time").length,
    jogadores: linhas.filter((l) => l.tipo === "jogador").length,
    dia: diaDe(),
  };
}

function linhasDeTime(tabela: LinhaCalculada[]) {
  return tabela.map((l) => ({
    tipo: "time" as const,
    chave: l.time,
    dados: {
      pontos: l.pontos,
      jogos: l.jogos,
      series: l.series,
      vitorias: l.vitorias,
      empates: l.empates,
      derrotas: l.derrotas,
      golsPro: l.golsPro,
      golsContra: l.golsContra,
      saldo: l.golsPro - l.golsContra,
    },
  }));
}

function linhasDeJogador(
  partidas: Array<{ dados: unknown }>,
  nomeDoClube: (clubId: string) => string
) {
  const acc = new Map<
    string,
    { time: string; gols: number; assistencias: number; jogos: number; somaNota: number; defesas: number; chutes: number; desarmes: number; segundosParado: number }
  >();

  for (const p of partidas) {
    const bruto = p.dados as {
      clubs?: Array<{ clubId?: string | number; players?: Array<Record<string, unknown>> }>;
    };
    for (const c of bruto.clubs ?? []) {
      const time = nomeDoClube(String(c.clubId));
      for (const j of c.players ?? []) {
        const tag = String(j.name ?? "");
        if (!tag) continue;
        const chave = `${time}|${tag}`;
        if (!acc.has(chave)) {
          acc.set(chave, { time, gols: 0, assistencias: 0, jogos: 0, somaNota: 0, defesas: 0, chutes: 0, desarmes: 0, segundosParado: 0 });
        }
        const r = acc.get(chave)!;
        r.gols += Number(j.goals ?? 0);
        r.assistencias += Number(j.assists ?? 0);
        r.defesas += Number(j.saves ?? 0);
        r.chutes += Number(j.shots ?? 0);
        r.desarmes += Number(j.tacklesMade ?? 0);
        r.segundosParado += Number(j.secondsIdle ?? 0);
        r.somaNota += Number(j.rating ?? 0);
        r.jogos++;
      }
    }
  }

  return [...acc.entries()].map(([chave, r]) => ({
    tipo: "jogador" as const,
    chave: chave.split("|")[1],
    time: r.time,
    dados: {
      gols: r.gols,
      assistencias: r.assistencias,
      jogos: r.jogos,
      defesas: r.defesas,
      chutes: r.chutes,
      desarmes: r.desarmes,
      segundosParado: r.segundosParado,
      // Média, não soma: nota somada não quer dizer nada e induz a erro em
      // qualquer tela que ordene por ela.
      nota: r.jogos ? Math.round((r.somaNota / r.jogos) * 100) / 100 : 0,
    },
  }));
}

/**
 * Fotografa uma COMPETIÇÃO do usuário.
 *
 * Aqui a fonte é outra — os confrontos que o próprio motor de campeonato
 * gerou e que os capitães confirmaram — mas o formato gravado é **o mesmo**.
 * É isso que faz a mesma tela servir os dois, e o mesmo gráfico de evolução
 * funcionar para a copa do Coringa e para o campeonato que o Ricardo criar
 * entre amigos.
 */
export async function fotografarCompeticao(competicaoId: string): Promise<ResumoFotografia> {
  await dbConnect();
  const competicao = await GameCompeticao.findById(competicaoId).lean();
  if (!competicao) return { times: 0, jogadores: 0, dia: diaDe() };

  const times = await GameTime.find({ competicaoId, ativo: true }).lean();
  const confrontos = await GameConfronto.find({ competicaoId, status: "confirmado" }).lean();
  const nomePorId = new Map(times.map((t) => [String(t._id), t.nome]));

  const porTime = new Map<string, Record<string, number>>();
  const pegar = (id: string) => {
    if (!porTime.has(id)) {
      porTime.set(id, { pontos: 0, jogos: 0, vitorias: 0, empates: 0, derrotas: 0, golsPro: 0, golsContra: 0, saldo: 0, series: 0 });
    }
    return porTime.get(id)!;
  };

  const regras = competicao.regras ?? { pontosVitoria: 3, pontosEmpate: 1, pontosDerrota: 0 };
  for (const c of confrontos) {
    if (typeof c.golsMandante !== "number" || typeof c.golsVisitante !== "number") continue;
    const m = c.mandanteId ? String(c.mandanteId) : null;
    const v = c.visitanteId ? String(c.visitanteId) : null;
    if (!m || !v) continue;
    const rm = pegar(m);
    const rv = pegar(v);
    rm.jogos++; rv.jogos++;
    rm.golsPro += c.golsMandante; rm.golsContra += c.golsVisitante;
    rv.golsPro += c.golsVisitante; rv.golsContra += c.golsMandante;
    if (c.golsMandante > c.golsVisitante) {
      rm.vitorias++; rv.derrotas++;
      rm.pontos += regras.pontosVitoria ?? 3; rv.pontos += regras.pontosDerrota ?? 0;
    } else if (c.golsMandante < c.golsVisitante) {
      rv.vitorias++; rm.derrotas++;
      rv.pontos += regras.pontosVitoria ?? 3; rm.pontos += regras.pontosDerrota ?? 0;
    } else {
      rm.empates++; rv.empates++;
      rm.pontos += regras.pontosEmpate ?? 1; rv.pontos += regras.pontosEmpate ?? 1;
    }
    rm.saldo = rm.golsPro - rm.golsContra;
    rv.saldo = rv.golsPro - rv.golsContra;
  }

  // Jogador: os destaques que os capitães declararam. Grau de evidência mais
  // baixo que o da copa (lá é a EA que publica), e é por isso que o acervo
  // guarda `sourceGrade` — a tela pode dizer de onde veio.
  const porJogador = new Map<string, { time: string; gols: number; assistencias: number; craque: number }>();
  for (const c of confrontos) {
    const d = c.destaques;
    if (!d) continue;
    const anotar = (tag: string, timeId: string | undefined, campo: "gols" | "assistencias" | "craque", n: number) => {
      const time = timeId ? nomePorId.get(String(timeId)) ?? "" : "";
      const chave = `${time}|${tag}`;
      if (!porJogador.has(chave)) porJogador.set(chave, { time, gols: 0, assistencias: 0, craque: 0 });
      porJogador.get(chave)![campo] += n;
    };
    for (const g of d.gols ?? []) anotar(g.gamertag, g.timeId ? String(g.timeId) : undefined, "gols", g.quantidade ?? 1);
    for (const a of d.assistencias ?? []) anotar(a.gamertag, a.timeId ? String(a.timeId) : undefined, "assistencias", a.quantidade ?? 1);
    if (d.craque?.gamertag) anotar(d.craque.gamertag, undefined, "craque", 1);
  }

  const linhas = [
    ...[...porTime.entries()].map(([id, dados]) => ({
      tipo: "time" as const,
      chave: nomePorId.get(id) ?? id,
      dados,
    })),
    ...[...porJogador.entries()].map(([chave, r]) => ({
      tipo: "jogador" as const,
      chave: chave.split("|")[1],
      time: r.time,
      dados: { gols: r.gols, assistencias: r.assistencias, craque: r.craque, jogos: 0 },
    })),
  ];

  await gravar("competicao", String(competicao._id), linhas);
  return {
    times: porTime.size,
    jogadores: porJogador.size,
    dia: diaDe(),
  };
}

/* ------------------------------------------------------------------ */
/* Leitura do histórico                                                */
/* ------------------------------------------------------------------ */

export interface PontoDaSerie {
  dia: string;
  dados: Record<string, number>;
}

/** A linha do tempo de uma chave (time ou jogador) num campeonato. */
export async function historicoDe(
  escopo: EscopoAcervo,
  refId: string,
  tipo: "time" | "jogador",
  chave: string
): Promise<PontoDaSerie[]> {
  await dbConnect();
  const docs = await GameAcervo.find({ escopo, refId, tipo, chave })
    .sort({ dia: 1 })
    .select("dia dados")
    .lean();
  return docs.map((d) => ({ dia: d.dia, dados: d.dados as Record<string, number> }));
}

/**
 * Quem mais subiu e quem mais caiu entre duas fotografias.
 *
 * É a pergunta que a tabela sozinha não responde — "quem está em alta?" — e
 * que só existe porque há acervo. Sem fotografia, toda tela de campeonato só
 * sabe dizer o presente.
 */
export async function movimento(
  escopo: EscopoAcervo,
  refId: string,
  campo = "pontos",
  dias = 7
): Promise<{
  linhas: Array<{ chave: string; de: number; para: number; delta: number }>;
  /**
   * Quantos dias DISTINTOS de fotografia existem no período.
   *
   * ⚠️ Devolvido porque sem ele a resposta mente por omissão. Com um único
   * dia de acervo, `primeiro` e `ultimo` são a MESMA fotografia, todo delta
   * dá zero, e a tela conclui "onze times parados" — que soa como observação
   * ("ninguém pontuou esta semana") quando na verdade é ausência de medida
   * ("ainda não temos com o que comparar").
   *
   * É o mesmo defeito do painel que declarava faturamento inexistente: um
   * zero calculado apresentado como fato medido. Quem consome esta função tem
   * de poder distinguir os dois, e agora consegue.
   */
  diasComFotografia: number;
}> {
  await dbConnect();
  const limite = diaDe(new Date(Date.now() - dias * 86_400_000));
  const docs = await GameAcervo.find({ escopo, refId, tipo: "time", dia: { $gte: limite } })
    .sort({ dia: 1 })
    .select("chave dia dados")
    .lean();

  const diasDistintos = new Set(docs.map((d) => d.dia));

  const porChave = new Map<string, { primeiro?: number; ultimo?: number }>();
  for (const d of docs) {
    const v = Number((d.dados as Record<string, number>)[campo] ?? 0);
    if (!porChave.has(d.chave)) porChave.set(d.chave, {});
    const r = porChave.get(d.chave)!;
    if (r.primeiro === undefined) r.primeiro = v;
    r.ultimo = v;
  }

  const linhas = [...porChave.entries()]
    .filter(([, r]) => r.primeiro !== undefined && r.ultimo !== undefined)
    .map(([chave, r]) => ({ chave, de: r.primeiro!, para: r.ultimo!, delta: r.ultimo! - r.primeiro! }))
    .sort((a, b) => b.delta - a.delta);

  return { linhas, diasComFotografia: diasDistintos.size };
}
