import CourseProgress from '@/models/CourseProgress';
import { limiteSimultaneo, type SubscriptionPlan } from '@/lib/course-tiers';

/**
 * Quantas vagas de curso ABERTO a pessoa ainda tem (03/08/2026).
 *
 * ## Por que isto virou função compartilhada
 *
 * A regra nasceu dentro do `POST /api/courses/enroll`, que a aplica na hora de
 * matricular. A biblioteca não a conhecia — e depois que o Expert deixou de
 * ver "Exige upgrade", passou a exibir dezessete cursos com o botão "Liberar
 * no plano" que o servidor recusaria com 409, um a um. Trocar um cadeado por
 * um botão que mente não é conserto; é a mesma frustração com outra roupa.
 *
 * Então a contagem sai daqui, e os dois lados leem o mesmo número: o servidor
 * para decidir, a biblioteca para não prometer.
 *
 * ## As duas exclusões, que não são detalhe
 *
 * - **Curso concluído não ocupa vaga.** O limite é sobre o que está em
 *   andamento. Sem isso, o aluno aplicado — o que termina — seria o mais
 *   punido, que é o oposto do que o limite existe para fazer.
 * - **Curso comprado avulso não ocupa vaga.** Quem pagou por aquele curso
 *   comprou o curso, não uma vaga na fila da assinatura. Contá-lo faria o
 *   cliente que mais gasta perder acesso ao que a assinatura promete.
 *
 * A conta é feita contra o `CourseProgress` e **não** contra
 * `user.progress.coursesInProgress`: aquele contador é incrementado à mão em
 * vários pontos do código e dessincroniza. Número aproximado não governa
 * portão.
 */
export interface VagasSimultaneas {
  limite: number;
  emAndamento: number;
  disponiveis: number;
  /** Os slugs que ocupam vaga — o que a UI mostra ao explicar o bloqueio. */
  cursosEmAndamento: string[];
}

export async function calcularVagasSimultaneas(
  userId: string,
  plan: SubscriptionPlan,
  enrolledCourses: Array<{ courseSlug: string; isActive: boolean; source?: string }>,
): Promise<VagasSimultaneas> {
  const limite = limiteSimultaneo(plan);

  const slugsAtivos = enrolledCourses
    .filter((c) => c.isActive && (c.source ?? 'subscription') === 'subscription')
    .map((c) => c.courseSlug);

  const concluidos = await CourseProgress.find({
    userId,
    courseId: { $in: slugsAtivos },
    isCompleted: true,
  })
    .select('courseId')
    .lean<Array<{ courseId: string }>>();

  const slugsConcluidos = new Set(concluidos.map((p) => p.courseId));
  const cursosEmAndamento = slugsAtivos.filter((s) => !slugsConcluidos.has(s));

  return {
    limite,
    emAndamento: cursosEmAndamento.length,
    disponiveis: Math.max(0, limite - cursosEmAndamento.length),
    cursosEmAndamento,
  };
}
