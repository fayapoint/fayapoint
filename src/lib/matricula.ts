import { colecaoMongo } from "@/lib/mongo-cliente";
import { normalizeCourseLevel, type CourseLevel } from "@/lib/course-tiers";

/**
 * A matrícula gravada em `user.enrolledCourses`, montada num lugar só.
 *
 * ## Por que este arquivo existe — o defeito que comeu a única venda real
 *
 * Em 23/03/2026 a Nancy pagou R$ 5,75 pelo `ia-sem-filtro-por-claude`. O PIX
 * caiu, a Asaas confirmou, e a entrega **falhou**:
 *
 *     User validation failed: enrolledCourses.1.level: Path `level` is required.
 *
 * `EnrolledCourseSchema` exige `level` (`src/models/User.ts`), e os três
 * lugares que matriculam alguém depois de um pagamento montavam o objeto **sem
 * ele**: `lib/fulfillment.ts`, `api/payments/webhook/route.ts` (Asaas) e
 * `api/payments/webhook/mercadopago/route.ts`. Ou seja: **toda** compra de
 * curso falhava do mesmo jeito, em qualquer meio de pagamento. O dinheiro
 * entrava e o aluno não recebia nada.
 *
 * Três cópias da mesma regra deram três cópias do mesmo defeito. Agora é uma
 * função só — quem matricula chama isto e não monta o objeto na mão.
 *
 * ## De onde sai o `level`
 *
 * O enum da matrícula é `free | beginner | intermediate | advanced`, mas as
 * duas fontes de verdade falam outra língua:
 *
 * | Fonte | Exemplo do campo `level` |
 * |---|---|
 * | `fayapointProdutos.products` | `"Iniciante a Intermediário"`, `"Todos os níveis"` |
 * | `fayapoint.courses` | `"all"`, `"intermediate"` |
 *
 * `normalizeCourseLevel` já traduz as duas (inclusive `"all"` e
 * `"todos os níveis"` → `beginner`) e já é a função que a biblioteca usa para
 * decidir vaga. Reusar ela é o que impede a matrícula e a biblioteca de
 * discordarem sobre o mesmo curso.
 *
 * A ordem é produto → curso → `beginner`. O padrão cai no nível mais aberto de
 * propósito: um rótulo desconhecido deve virar curso acessível demais, nunca
 * uma matrícula que explode e derruba a entrega inteira de novo.
 *
 * ⚠️ **Nunca deixe `level` indefinido.** Sem ele o `user.save()` inteiro é
 * rejeitado pelo Mongoose — e como a validação roda ANTES do `pre('save')`
 * ([[reference_mongoose_hook_validacao]]), nenhum hook conserta depois.
 */
export async function resolverNivelDoCurso(slug: string): Promise<CourseLevel> {
  if (!slug) return "beginner";

  try {
    const produtos = await colecaoMongo("fayapointProdutos", "products");
    const produto = await produtos.findOne(
      { slug },
      { projection: { level: 1 } },
    );
    if (produto?.level) return normalizeCourseLevel(String(produto.level));

    const cursos = await colecaoMongo("fayapoint", "courses");
    const curso = await cursos.findOne(
      { slug },
      { projection: { level: 1 } },
    );
    if (curso?.level) return normalizeCourseLevel(String(curso.level));
  } catch (erro) {
    // Um curso entregue com o nível errado é um problema de contabilidade de
    // vaga. Um curso NÃO entregue porque o banco piscou é uma venda perdida.
    console.error("[matricula] nível não resolvido para", slug, erro);
  }

  return "beginner";
}

export type OrigemDeMatricula =
  | "subscription"
  | "purchase"
  | "gift"
  | "promotion";

export interface MatriculaMontada {
  courseId: string;
  courseSlug: string;
  level: CourseLevel;
  enrolledAt: Date;
  isActive: boolean;
  source: OrigemDeMatricula;
}

/**
 * Monta a matrícula completa e válida contra o schema.
 *
 * Use SEMPRE isto em vez de escrever o objeto literal — foi o objeto literal,
 * repetido em três arquivos, que custou a única venda que este site já teve.
 */
export async function montarMatricula(params: {
  courseId: string;
  courseSlug: string;
  source: OrigemDeMatricula;
}): Promise<MatriculaMontada> {
  return {
    courseId: params.courseId,
    courseSlug: params.courseSlug,
    level: await resolverNivelDoCurso(params.courseSlug),
    enrolledAt: new Date(),
    isActive: true,
    source: params.source,
  };
}
