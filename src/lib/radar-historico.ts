import type { Collection } from "mongodb";
import { getMongoClient } from "@/lib/products";
import type { ResultadoRadar } from "@/lib/radar";
import type { TermoRadar } from "@/data/landing/radar-nichos";

/**
 * O histórico do Radar — a peça que faltava para o radar virar tendência.
 *
 * Até 28/07/2026 o Radar media e ESQUECIA: `lib/radar.ts` guardava o resultado
 * num `Map` em memória com 6h de TTL, e um `radar-seed.json` congelado servia de
 * piso. Toda medição morria no restart do processo. Dava para dizer "o que o
 * Brasil procura hoje" e era impossível dizer "o que subiu esta semana" — que é
 * a pergunta que decide pauta.
 *
 * Aqui a medição vira linha do tempo. Um documento por (nicho, dia): medir várias
 * vezes no mesmo dia sobrescreve o documento do dia em vez de empilhar, então o
 * custo de armazenamento é ~1 doc por nicho por dia (10 nichos ≈ 3.650 docs/ano)
 * e não cresce com o tráfego.
 */

const DB = "fayapoint";
const COLECAO = "radar_historico";

/** Um dia de medição de um nicho. */
export interface DiaRadar {
  nicho: string;
  /** `YYYY-MM-DD` em horário de Brasília — é a chave de deduplicação do dia. */
  dia: string;
  geradoEm: string;
  consultas: number;
  termos: TermoRadar[];
}

/** A trajetória de UM termo ao longo dos dias pedidos. */
export interface SerieTermo {
  termo: string;
  formato: string;
  canais: TermoRadar["canais"];
  /** Um ponto por dia da janela; `null` = não apareceu naquele dia. */
  pontos: Array<{ dia: string; score: number | null }>;
  /** Score da medição mais recente em que apareceu. */
  atual: number;
  /** Variação contra o primeiro dia em que aparece na janela. */
  delta: number;
  /** Não existia na primeira metade da janela — entrou agora. */
  estreante: boolean;
}

export interface HistoricoRadar {
  nicho: string;
  /** Eixo X, do mais antigo para o mais recente. */
  dias: string[];
  series: SerieTermo[];
  /** Quantos dias distintos existem guardados para este nicho, no total. */
  diasGuardados: number;
}

async function colecao(): Promise<Collection<DiaRadar>> {
  const client = await getMongoClient();
  return client.db(DB).collection<DiaRadar>(COLECAO);
}

/**
 * O dia em São Paulo, não em UTC.
 *
 * Uma medição às 22h de Brasília é 01h UTC do dia seguinte: com `toISOString()`
 * cru, metade das noites cairia no dia errado e a série ficaria com buracos e
 * dobras que não aconteceram.
 */
export function diaBrasilia(quando: Date | string = new Date()): string {
  const d = typeof quando === "string" ? new Date(quando) : quando;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Grava a medição do dia. Nunca lança.
 *
 * Chamado de dentro do caminho que serve a página do Radar, então falha de banco
 * não pode derrubar o Radar: histórico é ganho, não requisito. Por isso o
 * `catch` engole — quem chama não tem o que fazer com o erro.
 */
export async function salvarMedicao(dado: ResultadoRadar): Promise<void> {
  if (!dado.termos.length) return; // medição vazia = rede caiu; não polui a série

  try {
    const col = await colecao();
    const dia = diaBrasilia(dado.geradoEm);

    await col.updateOne(
      { nicho: dado.nicho, dia },
      {
        $set: {
          nicho: dado.nicho,
          dia,
          geradoEm: dado.geradoEm,
          consultas: dado.consultas,
          // 40 termos por dia cobre com folga o topo que a página mostra e
          // mantém o documento pequeno.
          termos: dado.termos.slice(0, 40),
        },
      },
      { upsert: true }
    );
  } catch (erro) {
    console.error("[radar-historico] não deu para gravar:", erro);
  }
}

/**
 * Monta a série dos termos mais relevantes da janela.
 *
 * `quantos` limita as LINHAS do gráfico, não os dias. O corte é pelo score do
 * dia mais recente: o gráfico responde "o que está em alta agora, e como
 * chegou aqui" — não "o que já foi grande um dia".
 */
export async function getHistorico(
  nicho: string,
  dias = 30,
  quantos = 5
): Promise<HistoricoRadar> {
  const vazio: HistoricoRadar = { nicho, dias: [], series: [], diasGuardados: 0 };

  let registros: DiaRadar[];
  let diasGuardados: number;
  try {
    const col = await colecao();
    registros = await col
      .find({ nicho }, { projection: { _id: 0 } })
      .sort({ dia: -1 })
      .limit(dias)
      .toArray();
    diasGuardados = await col.countDocuments({ nicho });
  } catch (erro) {
    console.error("[radar-historico] não deu para ler:", erro);
    return vazio;
  }

  if (!registros.length) return vazio;

  registros.reverse(); // do mais antigo para o mais recente — a ordem do eixo X
  const eixo = registros.map((r) => r.dia);

  // termo -> dia -> score
  const porTermo = new Map<string, Map<string, number>>();
  const meta = new Map<string, { formato: string; canais: TermoRadar["canais"] }>();

  for (const reg of registros) {
    for (const t of reg.termos) {
      let linha = porTermo.get(t.termo);
      if (!linha) {
        linha = new Map();
        porTermo.set(t.termo, linha);
      }
      linha.set(reg.dia, t.score);
      meta.set(t.termo, { formato: t.formato, canais: t.canais });
    }
  }

  const ultimo = eixo[eixo.length - 1];
  const metade = eixo.slice(0, Math.floor(eixo.length / 2));

  const series: SerieTermo[] = [...porTermo.entries()]
    .map(([termo, linha]) => {
      const pontos = eixo.map((dia) => ({ dia, score: linha.get(dia) ?? null }));
      const presentes = pontos.filter((p) => p.score !== null);
      const atual = linha.get(ultimo) ?? presentes[presentes.length - 1]?.score ?? 0;
      const primeiro = presentes[0]?.score ?? 0;
      const m = meta.get(termo)!;

      return {
        termo,
        formato: m.formato,
        canais: m.canais,
        pontos,
        atual,
        delta: Number((atual - primeiro).toFixed(1)),
        // estreante só faz sentido com janela suficiente para ter "antes"
        estreante:
          metade.length > 0 && metade.every((d) => linha.get(d) === undefined),
      };
    })
    // ordenar pelo score de HOJE, não pelo pico histórico
    .sort((a, b) => b.atual - a.atual)
    .slice(0, quantos);

  return { nicho, dias: eixo, series, diasGuardados };
}
