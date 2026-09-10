import { getAuthUser } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { resolvePlan, TIER_CONFIGS } from "@/lib/course-tiers";

/**
 * Quem entra na Pasta Viva, e por qual porta.
 *
 * ── As duas portas, e por que são duas ─────────────────────────────────────
 *
 * A Pasta Viva é o acervo que acompanha o ebook "Ganhar dinheiro com IA". Ela
 * tem **duas** populações que nunca se encontram em lugar nenhum do sistema:
 *
 * 1. **Assinante Expert** da FayAI — existe no nosso banco, tem sessão, tem
 *    plano. Reconhecer é ler `subscription.plan`.
 * 2. **Comprador do ebook na Hotmart** — comprou fora daqui, num sistema que
 *    não fala com o nosso. A Hotmart não nos manda webhook, então **não existe
 *    nenhuma forma automática de saber que essa pessoa comprou**. O que existe
 *    é o código que ela recebe junto do PDF e resgata uma vez
 *    (`/pasta-viva/entrar`), o que cria a matrícula no nosso lado.
 *
 * Depois do resgate as duas portas viram a mesma coisa: uma matrícula em
 * `enrolledCourses`. Daí para frente ninguém precisa digitar código de novo.
 *
 * ⚠️ **O corte é no SERVIDOR.** O conteúdo pago não é renderizado e não sai no
 * HTML — esconder com CSS entrega tudo a quem abre o código-fonte, e este é o
 * material que sustenta o preço do produto.
 *
 * ⚠️ **O portão fecha por padrão.** Qualquer falha — token inválido, banco
 * fora do ar, usuário sumido — cai em `false`. Um erro de infraestrutura nunca
 * pode virar acesso liberado.
 */

/** Slug do curso/ebook que dá direito à Pasta Viva. */
export const CURSO_DA_PASTA = "ganhar-dinheiro-com-ia";

export interface AcessoPastaViva {
  /** Pode ver o acervo inteiro? */
  liberado: boolean;
  /** Por qual porta entrou — muda a mensagem que a página mostra. */
  porta: "expert" | "compra" | "nenhuma";
  autenticado: boolean;
  /** Nome do plano atual, para a chamada de upgrade. */
  planoNome: string;
  /** Preço mensal do Expert, para a chamada de upgrade. */
  expertPreco: number;
}

const FECHADO: AcessoPastaViva = {
  liberado: false,
  porta: "nenhuma",
  autenticado: false,
  planoNome: TIER_CONFIGS.free.displayName,
  expertPreco: TIER_CONFIGS.expert.monthlyPrice,
};

export async function getAcessoPastaViva(): Promise<AcessoPastaViva> {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return FECHADO;

    await dbConnect();
    const user = await User.findById(authUser.id)
      .select("subscription.plan enrolledCourses.courseSlug enrolledCourses.isActive")
      .lean<{
        subscription?: { plan?: string };
        enrolledCourses?: { courseSlug?: string; isActive?: boolean }[];
      } | null>();

    if (!user) return { ...FECHADO, autenticado: true };

    const plano = resolvePlan(user.subscription?.plan || "free");
    const planoNome = TIER_CONFIGS[plano].displayName;

    if (plano === "expert") {
      return {
        liberado: true,
        porta: "expert",
        autenticado: true,
        planoNome,
        expertPreco: TIER_CONFIGS.expert.monthlyPrice,
      };
    }

    const comprou = (user.enrolledCourses || []).some(
      (c) => c.courseSlug === CURSO_DA_PASTA && c.isActive !== false,
    );

    return {
      liberado: comprou,
      porta: comprou ? "compra" : "nenhuma",
      autenticado: true,
      planoNome,
      expertPreco: TIER_CONFIGS.expert.monthlyPrice,
    };
  } catch {
    return FECHADO;
  }
}
