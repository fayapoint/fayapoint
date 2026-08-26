import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import GameCompeticao, { type IGameCompeticao } from "@/models/GameCompeticao";
import GameTime, { type IGameTime } from "@/models/GameTime";
import GameConfronto, { type IGameConfronto } from "@/models/GameConfronto";
import { normalizar } from "./ea-api";
import {
  calcularClassificacao,
  type ConfrontoCompeticao,
  type LinhaClassificacao,
  type RegrasCompeticao,
  type TimeCompeticao,
} from "./campeonato";

/**
 * A cola entre o motor puro (`campeonato.ts`) e o banco.
 *
 * O motor não conhece Mongo e o Mongo não conhece as regras — este arquivo faz
 * a tradução nos dois sentidos e concentra o que as rotas repetiriam: carregar
 * a competição inteira, conferir quem é o dono, montar a classificação e somar
 * a artilharia.
 */

/** Vira slug: sem acento, minúsculo, com um sufixo curto para nunca colidir. */
export function gerarSlug(nome: string): string {
  const base = normalizar(nome)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48)
    .replace(/^-|-$/g, "");
  const sufixo = Math.random().toString(36).slice(2, 6);
  return `${base || "campeonato"}-${sufixo}`;
}

export interface CompeticaoCompleta {
  competicao: IGameCompeticao;
  times: IGameTime[];
  confrontos: IGameConfronto[];
}

/** Carrega competição, times e confrontos numa ida só. */
export async function carregarCompeticao(slug: string): Promise<CompeticaoCompleta | null> {
  await dbConnect();
  const competicao = await GameCompeticao.findOne({ slug });
  if (!competicao) return null;
  const [times, confrontos] = await Promise.all([
    GameTime.find({ competicaoId: competicao._id, ativo: true }).sort({ semente: 1, nome: 1 }),
    GameConfronto.find({ competicaoId: competicao._id }).sort({ rodada: 1, chave: 1 }),
  ]);
  return { competicao, times, confrontos };
}

/** O organizador é quem criou. A checagem é sempre no servidor, nunca na tela. */
export function ehOrganizador(competicao: IGameCompeticao, userId: string): boolean {
  return String(competicao.organizadorUserId) === String(userId);
}

/** Documento do Mongo → o que o motor entende. */
export function paraTimeMotor(t: IGameTime): TimeCompeticao {
  return {
    id: String(t._id),
    nome: t.nome,
    sigla: t.sigla ?? null,
    grupo: t.grupo ?? null,
    cor: t.cor ?? null,
  };
}

export function paraConfrontoMotor(c: IGameConfronto): ConfrontoCompeticao {
  return {
    id: String(c._id),
    fase: c.fase,
    rodada: c.rodada,
    grupo: c.grupo ?? null,
    chave: c.chave ?? null,
    mandanteId: c.mandanteId ? String(c.mandanteId) : null,
    visitanteId: c.visitanteId ? String(c.visitanteId) : null,
    golsMandante: c.golsMandante ?? null,
    golsVisitante: c.golsVisitante ?? null,
    perna: (c.perna as 1 | 2) ?? undefined,
    status: c.status,
  };
}

export function paraRegras(competicao: IGameCompeticao): RegrasCompeticao {
  const r = competicao.regras;
  return {
    turnos: (r.turnos === 2 ? 2 : 1) as 1 | 2,
    pontosVitoria: r.pontosVitoria,
    pontosEmpate: r.pontosEmpate,
    pontosDerrota: r.pontosDerrota,
    criteriosDesempate: r.criteriosDesempate as RegrasCompeticao["criteriosDesempate"],
    numGrupos: r.numGrupos,
    classificadosPorGrupo: r.classificadosPorGrupo,
    idaEVoltaMataMata: r.idaEVoltaMataMata,
    vagasAcesso: r.vagasAcesso,
    vagasRebaixamento: r.vagasRebaixamento,
  };
}

/**
 * A classificação pronta para a tela: uma tabela só na liga, uma por grupo
 * quando houver grupos.
 */
export function montarClassificacao(dados: CompeticaoCompleta): {
  geral: LinhaClassificacao[];
  porGrupo: Array<{ grupo: string; linhas: LinhaClassificacao[] }>;
} {
  const times = dados.times.map(paraTimeMotor);
  const confrontos = dados.confrontos.map(paraConfrontoMotor);
  const regras = paraRegras(dados.competicao);

  const grupos = [...new Set(times.map((t) => t.grupo).filter(Boolean))] as string[];
  if (grupos.length > 0) {
    return {
      geral: [],
      porGrupo: grupos.sort().map((g) => ({
        grupo: g,
        linhas: calcularClassificacao(times, confrontos, regras, g),
      })),
    };
  }
  return { geral: calcularClassificacao(times, confrontos, regras), porGrupo: [] };
}

export interface LinhaArtilharia {
  gamertag: string;
  timeId: string | null;
  timeNome: string | null;
  gols: number;
  assistencias: number;
  participacoes: number;
  notaMedia: number | null;
  jogos: number;
}

/**
 * ARTILHARIA e assistências, somadas dos destaques de cada confronto.
 *
 * Sai daqui e não de uma consulta à EA porque o campeonato é NOSSO: um jogador
 * pode marcar num confronto que a EA nunca publicou (time cadastrado na mão), e
 * some da fonte quando troca de clube. O que vale para o troféu é o que
 * aconteceu dentro da competição.
 */
export function montarArtilharia(dados: CompeticaoCompleta): LinhaArtilharia[] {
  const nomePorTime = new Map(dados.times.map((t) => [String(t._id), t.nome]));
  const acc = new Map<string, LinhaArtilharia & { somaNotas: number; comNota: number }>();

  const pegar = (gamertag: string, timeId?: string | null) => {
    const chave = gamertag.toLowerCase();
    let l = acc.get(chave);
    if (!l) {
      l = {
        gamertag,
        timeId: timeId ?? null,
        timeNome: timeId ? nomePorTime.get(timeId) ?? null : null,
        gols: 0,
        assistencias: 0,
        participacoes: 0,
        notaMedia: null,
        jogos: 0,
        somaNotas: 0,
        comNota: 0,
      };
      acc.set(chave, l);
    }
    // O time só é preenchido uma vez: quem trocou de time no meio fica com o
    // primeiro registrado, e a artilharia continua sendo da pessoa.
    if (!l.timeId && timeId) {
      l.timeId = timeId;
      l.timeNome = nomePorTime.get(timeId) ?? null;
    }
    return l;
  };

  for (const c of dados.confrontos) {
    if (c.status !== "confirmado" && c.status !== "wo") continue;
    const d = c.destaques;
    if (!d) continue;
    for (const g of d.gols ?? []) {
      pegar(g.gamertag, g.timeId ? String(g.timeId) : null).gols += g.quantidade ?? 1;
    }
    for (const a of d.assistencias ?? []) {
      pegar(a.gamertag, a.timeId ? String(a.timeId) : null).assistencias += a.quantidade ?? 1;
    }
    for (const n of d.notas ?? []) {
      const l = pegar(n.gamertag, null);
      l.jogos += 1;
      if (typeof n.nota === "number") {
        l.somaNotas += n.nota;
        l.comNota += 1;
      }
    }
  }

  return [...acc.values()]
    .map(({ somaNotas, comNota, ...l }) => ({
      ...l,
      participacoes: l.gols + l.assistencias,
      notaMedia: comNota > 0 ? Number((somaNotas / comNota).toFixed(2)) : null,
    }))
    .sort((a, b) => b.gols - a.gols || b.assistencias - a.assistencias)
    .slice(0, 50);
}

export interface DestaqueSetor {
  setor: "GOL" | "DEF" | "MEI" | "ATA";
  gamertag: string;
  notaMedia: number;
  jogos: number;
}

/**
 * OS MELHORES POR SETOR — o "melhor meio" e a "melhor defesa" do pôster.
 *
 * Sai da média de nota por posição, com um piso de **2 jogos**. Sem o piso, o
 * pódio de um campeonato de 18 rodadas seria decidido por alguém que entrou
 * uma vez, tirou 9,2 e nunca mais jogou — o que é ruim de duas maneiras: é
 * injusto com quem carregou o time e destrói a credibilidade do prêmio na
 * primeira vez que alguém repara.
 */
export function melhoresPorSetor(dados: CompeticaoCompleta): DestaqueSetor[] {
  const MIN_JOGOS = 2;
  const porSetor = new Map<string, Map<string, { soma: number; jogos: number }>>();

  for (const c of dados.confrontos) {
    if (c.status !== "confirmado") continue;
    for (const n of c.destaques?.notas ?? []) {
      const setor = setorDaPosicaoLivre(n.posicao);
      if (!setor) continue;
      const mapa = porSetor.get(setor) ?? new Map();
      const atual = mapa.get(n.gamertag) ?? { soma: 0, jogos: 0 };
      atual.soma += n.nota ?? 0;
      atual.jogos += 1;
      mapa.set(n.gamertag, atual);
      porSetor.set(setor, mapa);
    }
  }

  const saida: DestaqueSetor[] = [];
  for (const setor of ["GOL", "DEF", "MEI", "ATA"] as const) {
    const mapa = porSetor.get(setor);
    if (!mapa) continue;
    const elegiveis = [...mapa.entries()].filter(([, v]) => v.jogos >= MIN_JOGOS);
    if (elegiveis.length === 0) continue;
    const [gamertag, v] = elegiveis.sort(
      (a, b) => b[1].soma / b[1].jogos - a[1].soma / a[1].jogos
    )[0];
    saida.push({
      setor,
      gamertag,
      notaMedia: Number((v.soma / v.jogos).toFixed(2)),
      jogos: v.jogos,
    });
  }
  return saida;
}

/** A posição vem escrita de N formas; aqui vira um dos quatro setores. */
function setorDaPosicaoLivre(pos?: string | null): "GOL" | "DEF" | "MEI" | "ATA" | null {
  if (!pos) return null;
  const p = pos.trim().toLowerCase();
  if (/^(gol|gk|goalkeeper)/.test(p)) return "GOL";
  if (/^(zag|def|cb|lb|rb|lwb|rwb|defender)/.test(p)) return "DEF";
  if (/^(mei|vol|cm|cdm|cam|lm|rm|midfield)/.test(p)) return "MEI";
  if (/^(ata|st|cf|lw|rw|forward|striker|pon)/.test(p)) return "ATA";
  return null;
}

/** Converte com segurança uma string em ObjectId, ou devolve null. */
export function paraObjectId(v: unknown): mongoose.Types.ObjectId | null {
  const s = String(v ?? "");
  return mongoose.Types.ObjectId.isValid(s) ? new mongoose.Types.ObjectId(s) : null;
}
