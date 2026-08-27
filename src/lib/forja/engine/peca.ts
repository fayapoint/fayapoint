/* ⚠️ ARQUIVO GERADO — NÃO EDITE AQUI.
 * Fonte: worldforge-fayai/engine/peca.ts
 * Edite lá e rode: node scripts/forja/sincronizar-engine.mjs
 * Conferir se a cópia está em dia: node scripts/forja/sincronizar-engine.mjs --conferir
 */
/**
 * A PEÇA — o plano de filmagem, e a leitura do que o modelo devolveu.
 *
 * Um gerador de post devolve texto. Uma peça devolve **quadro a quadro**: o que
 * aparece, de que ângulo, com que luz, o que está escrito na tela, o que a
 * pessoa fala e por quanto tempo. É a diferença entre uma legenda e algo que dá
 * para produzir.
 */

import { resolverConflitos, type Ajustes } from "./vocabulario";
import { montarPromptDeImagem, type ModeloImagem } from "./prompts/imagem";
import { montarPromptDeVideo } from "./prompts/video";
import type { Formato } from "./formatos";
import type { Personagem } from "./personagem";

export interface Quadro {
  numero: number;
  titulo: string;
  /** o que se vê, em português — é o dono que lê */
  acao: string;
  /** a mesma frase em inglês — é ela que vira prompt */
  acaoEn?: string;
  cenarioEn?: string;
  /** ids dos personagens que aparecem */
  quemAparece?: string[];
  /** o que está escrito na tela — camada de edição, não pixel (salvo se `textoNaArte`) */
  textoNaTela?: string;
  fala?: string;
  duracao?: number;
  ajustes: Ajustes;

  /** o prompt de imagem, composto */
  prompt: string;
  negativo: string;
  /** o mesmo em português, para conferência */
  leitura?: string;
  /** o que o motor consertou sozinho na câmera — a tela mostra, o prompt não */
  correcoes?: string[];

  /** a arte gerada */
  arte?: string;
  /** o clipe gerado a partir da arte */
  video?: string;
  /** a semente que produziu a arte — repetir a semente repete o rosto */
  semente?: number;

  estado?: "planejado" | "na-fila" | "gerado" | "aprovado";
  /** o trabalho na fila, enquanto ele existe */
  trabalhoId?: string;
}

export interface Peca {
  _id?: string;
  userId: string;
  formato: string;
  tema: string;
  observacao?: string;
  titulo: string;
  legenda: string;
  hashtags: string[];
  quadros: Quadro[];
  /** os personagens usados, pelo id — para a tela poder mostrar quem está na peça */
  personagens?: string[];
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export interface ContextoDaPeca {
  formato: Formato;
  /** os personagens disponíveis, por id */
  elenco: Map<string, Personagem>;
  coresDaMarca?: string;
  modelo?: ModeloImagem;
  textoNaArte?: boolean;
}

function personagensDoQuadro(q: { quemAparece?: string[] }, ctx: ContextoDaPeca) {
  return (q.quemAparece || [])
    .map((id) => ctx.elenco.get(id))
    .filter((p): p is Personagem => !!p)
    .map((personagem) => ({ personagem }));
}

/** Recompõe o prompt de um quadro. Chamado sempre que a ação ou a câmera mudam. */
export function recomporQuadro(q: Quadro, ctx: ContextoDaPeca): Quadro {
  const p = montarPromptDeImagem(
    { acao: q.acao, acaoEn: q.acaoEn, ajustes: q.ajustes, textoNaTela: q.textoNaTela, cenarioEn: q.cenarioEn },
    {
      aspecto: ctx.formato.aspecto,
      personagens: personagensDoQuadro(q, ctx),
      coresDaMarca: ctx.coresDaMarca,
      textoNaArte: ctx.textoNaArte,
      modelo: ctx.modelo,
    },
  );
  return { ...q, prompt: p.positivo, negativo: p.negativo, leitura: p.leitura };
}

/** O plano de vídeo de um quadro — só quando ele já tem arte aprovada. */
export function planoDeVideo(q: Quadro, ctx: ContextoDaPeca, imagemDePartida?: string) {
  return montarPromptDeVideo(
    { acao: q.acao, acaoEn: q.acaoEn, ajustes: q.ajustes, fala: q.fala, textoNaTela: q.textoNaTela, duracao: q.duracao, cenarioEn: q.cenarioEn },
    {
      aspecto: ctx.formato.aspecto,
      personagens: personagensDoQuadro(q, ctx),
      coresDaMarca: ctx.coresDaMarca,
      imagemDePartida,
      falaSincronizada: !!q.fala,
    },
  );
}

/**
 * O texto do modelo → peça pronta, com os prompts já compostos.
 *
 * ⚠️ Tolerante de propósito. O modelo às vezes devolve a cerca de código, às
 * vezes um campo a menos, às vezes um valor de câmera que não existe. Recusar a
 * peça inteira por causa de um campo faria a pessoa pagar de novo pelo mesmo
 * pedido. Então: limpa a cerca, `resolverConflitos` descarta o que é inválido e
 * conserta o que é impossível, e o que falta vira o padrão do formato.
 */
export function normalizar(bruto: string, ctx: ContextoDaPeca): Omit<Peca, "userId" | "tema"> {
  const limpo = bruto
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");

  const dado = JSON.parse(limpo) as {
    titulo?: string;
    legenda?: string;
    hashtags?: unknown;
    quadros?: Array<Record<string, unknown>>;
  };

  const usados = new Set<string>();

  const quadros: Quadro[] = (dado.quadros || []).map((q, i) => {
    const { ajustes, correcoes } = resolverConflitos(q.ajustes);
    const quemAparece = Array.isArray(q.quemAparece)
      ? (q.quemAparece as unknown[]).map(String).filter((id) => ctx.elenco.has(id))
      : [];
    quemAparece.forEach((id) => usados.add(id));

    const base: Quadro = {
      numero: i + 1,
      titulo: String(q.titulo || `Quadro ${i + 1}`).trim(),
      acao: String(q.acao || q.titulo || "").trim(),
      acaoEn: q.acaoEn ? String(q.acaoEn).trim() : undefined,
      cenarioEn: q.cenarioEn ? String(q.cenarioEn).trim() : undefined,
      quemAparece,
      textoNaTela: q.textoNaTela ? String(q.textoNaTela).trim().split(/\s+/).slice(0, 7).join(" ") : undefined,
      fala: q.fala ? String(q.fala).trim() : undefined,
      duracao: ctx.formato.temTempo ? Math.max(1, Math.min(15, Number(q.duracao) || 4)) : undefined,
      ajustes,
      correcoes: correcoes.length ? correcoes : undefined,
      prompt: "",
      negativo: "",
      estado: "planejado",
    };

    return recomporQuadro(base, ctx);
  });

  return {
    formato: ctx.formato.id,
    titulo: String(dado.titulo || "Peça").trim(),
    legenda: String(dado.legenda || "").trim(),
    hashtags: Array.isArray(dado.hashtags)
      ? dado.hashtags.map((h) => String(h).replace(/^#/, "").trim()).filter(Boolean).slice(0, 8)
      : [],
    quadros,
    personagens: [...usados],
  };
}
