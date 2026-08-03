import { getAuthUser } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { resolvePlan, TIER_CONFIGS, type SubscriptionPlan } from "@/lib/course-tiers";
import type { Microcurso } from "@/data/microcursos/tipos";

/**
 * Escalonamento dos microcursos por plano.
 *
 * A regra de negócio: o microcurso completo é do Expert. Free vê só a
 * identificação da ferramenta, e os dois planos do meio sobem degrau a degrau
 * — sempre com o degrau que falta visível, para que a distância até o Expert
 * seja óbvia e mensurável.
 *
 * ── Onde o corte é feito, e por quê ────────────────────────────────────────
 *
 * O corte acontece NO SERVIDOR: o conteúdo pago não é renderizado e não sai no
 * HTML. Esconder com CSS seria inútil — qualquer pessoa lê o código-fonte da
 * página com dois cliques.
 *
 * ── A calibragem da fatia gratuita ─────────────────────────────────────────
 *
 * O free recebe a "ficha de identificação" da ferramenta (o que é, ficha
 * técnica, a fonte) e ZERO aulas. Nenhum passo, nenhum critério de escolha,
 * nenhum "quando usar" — a parte que ensina fica inteira do outro lado do
 * portão.
 *
 * A fatia livre não é menor do que isso por um motivo medido, não por
 * generosidade: quem chega anônimo do Google é tratado como free, então é a
 * versão gratuita que vira a página indexada. Em 28/07/2026 vinte páginas de
 * curso serviam 624 chars idênticos e o Google as classificou como soft 404 —
 * páginas que anunciam a própria ausência somem do índice, e uma página que
 * sumiu não vende plano nenhum. A fatia gratuita precisa se sustentar como
 * conteúdo de verdade; o que ela não pode conter é o produto.
 */

/**
 * Quantas aulas cada plano abre na versão COMPLETA (`/inventando/<slug>/completo`).
 *
 * A primeira aula não conta como benefício de plano: ela é pública na página
 * curta e todo mundo já a leu antes de chegar aqui. O `free: 1` existe só para
 * a versão completa não parecer vazia para quem clicou sem ter plano — ele
 * reencontra o que já viu, e vê nomeado o que falta.
 */
const AULAS_POR_PLANO: Record<SubscriptionPlan, number> = {
  free: 1,
  explorador: 2,
  profissional: 3,
  expert: Number.POSITIVE_INFINITY,
};

/** Ordem dos planos, do menor para o maior. */
const ESCADA: SubscriptionPlan[] = ["free", "explorador", "profissional", "expert"];

export interface AcessoMicrocurso {
  plano: SubscriptionPlan;
  /** Nome de exibição do plano atual ("Gratuito", "Expert"…). */
  planoNome: string;
  /** Usuário está autenticado? Free anônimo e free logado veem o mesmo. */
  autenticado: boolean;

  /** Aulas efetivamente liberadas neste microcurso. */
  aulasLiberadas: number;
  aulasBloqueadas: number;
  totalAulas: number;

  /** Blocos liberados. */
  vePorQueImportaCompleto: boolean;
  veLimites: boolean;
  vePraQuemServe: boolean;
  veProximosPassos: boolean;

  /** Verdadeiro só no Expert: nada bloqueado. */
  completo: boolean;
  /** O degrau imediatamente acima, ou null se já está no topo. */
  proximoPlano: SubscriptionPlan | null;
  proximoPlanoNome: string | null;
  proximoPlanoPreco: number | null;
  /** Quantas aulas o degrau seguinte destrava a mais que o atual. */
  aulasNoProximoPlano: number;
}

/**
 * Plano do usuário da requisição atual.
 *
 * Anônimo → 'free'. Qualquer falha (token inválido, banco fora do ar) também
 * cai em 'free': o portão fecha por padrão, nunca abre.
 */
export async function getPlanoAtual(): Promise<{
  plano: SubscriptionPlan;
  autenticado: boolean;
}> {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return { plano: "free", autenticado: false };

    await dbConnect();
    // `.lean()` e `select` estreito de propósito: esta consulta roda em toda
    // visita a um microcurso e só precisa de um campo.
    const user = await User.findById(authUser.id)
      .select("subscription.plan")
      .lean<{ subscription?: { plan?: string } } | null>();

    if (!user) return { plano: "free", autenticado: true };

    return {
      plano: resolvePlan(user.subscription?.plan || "free"),
      autenticado: true,
    };
  } catch {
    return { plano: "free", autenticado: false };
  }
}

/** Traduz plano + microcurso em "o que esta pessoa pode ver". */
export function calcularAcesso(
  plano: SubscriptionPlan,
  microcurso: Microcurso,
  autenticado = false,
): AcessoMicrocurso {
  const totalAulas = microcurso.aulas.length;
  const liberadas = Math.min(AULAS_POR_PLANO[plano], totalAulas);

  const indice = ESCADA.indexOf(plano);
  const proximoPlano = indice >= 0 && indice < ESCADA.length - 1 ? ESCADA[indice + 1] : null;
  const config = TIER_CONFIGS[plano];
  const proximoConfig = proximoPlano ? TIER_CONFIGS[proximoPlano] : null;

  return {
    plano,
    planoNome: config.displayName,
    autenticado,

    aulasLiberadas: liberadas,
    aulasBloqueadas: totalAulas - liberadas,
    totalAulas,

    vePorQueImportaCompleto: plano !== "free",
    veLimites: plano !== "free",
    vePraQuemServe: plano === "profissional" || plano === "expert",
    veProximosPassos: plano === "expert",

    completo: plano === "expert",
    proximoPlano,
    proximoPlanoNome: proximoConfig?.displayName ?? null,
    proximoPlanoPreco: proximoConfig?.monthlyPrice ?? null,
    aulasNoProximoPlano: proximoPlano
      ? Math.min(AULAS_POR_PLANO[proximoPlano], totalAulas)
      : totalAulas,
  };
}

/** Preço mensal do Expert — usado nas chamadas de upgrade. */
export const PRECO_EXPERT = TIER_CONFIGS.expert.monthlyPrice;

/**
 * Recorta o microcurso para o que o plano pode ver.
 *
 * O que sai daqui é o que vira HTML. O que não sai daqui não existe para o
 * navegador — é esse o ponto.
 */
export function recortarMicrocurso(microcurso: Microcurso, acesso: AcessoMicrocurso) {
  return {
    ...microcurso,
    // O primeiro item do "por que importa" fica de isca para o free; o resto
    // é o argumento completo.
    porQueImporta: acesso.vePorQueImportaCompleto
      ? microcurso.porQueImporta
      : microcurso.porQueImporta.slice(0, 1),
    aulas: microcurso.aulas.slice(0, acesso.aulasLiberadas),
    limites: acesso.veLimites ? microcurso.limites : [],
    praQuemServe: acesso.vePraQuemServe ? microcurso.praQuemServe : [],
    proximosPassos: acesso.veProximosPassos ? microcurso.proximosPassos : [],
  };
}

/**
 * Títulos das aulas bloqueadas — mostrados como lista trancada.
 *
 * Mostrar o título do que está trancado converte melhor do que esconder a
 * existência: a pessoa precisa saber o que está perdendo para querer pagar.
 * Só o título sai; o conteúdo da aula não é serializado.
 */
export function titulosBloqueados(
  microcurso: Microcurso,
  acesso: AcessoMicrocurso,
): Array<{ titulo: string; duracao: string }> {
  return microcurso.aulas
    .slice(acesso.aulasLiberadas)
    .map((a) => ({ titulo: a.titulo, duracao: a.duracao }));
}
