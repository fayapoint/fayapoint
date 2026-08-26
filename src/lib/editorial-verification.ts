export interface EditorialVerification {
  verifiedAt: string;
  canonModels: string[];
  rule: string;
  sourceGroup?: string;
  toolLabel?: string;
  sourceLinks?: string[];
}

export interface LessonContentCoverage {
  totalLessons: number;
  lessonsWithContent: number;
  coveragePercent: number;
}

type CourseModuleLike = {
  lessons?: Array<{
    content?: string | null;
    hasContent?: boolean | null;
  }>;
};

/**
 * ⚠️ `canonModels` não é mais exibido em lugar nenhum, e é de propósito.
 *
 * Até 03/08/2026 esta lista aparecia em seis telas — a faixa do leitor, a
 * faixa de confiança da /cursos, o curso em destaque, o selo de cada card da
 * vitrine, dois pontos da página de vendas e a home. Em todas com o mesmo
 * defeito: o documento do produto sobrescrevia o padrão daqui, e os 27
 * produtos carregavam "GPT-5.4 / Claude Opus 4.6" com data de 19/03. Dois
 * canons, os dois velhos, e o que o visitante lia era sempre o pior dos dois.
 *
 * As seis faixas foram trocadas por fatos que o visitante confere sozinho —
 * número de capítulos e `contentUpdatedAt`, que o laço escreve de verdade a
 * cada reescrita, ao contrário do `verifiedAt`, que ficou parado em 19/03.
 *
 * O canon vivo mora hoje no registry `content_facts` (ver `content-facts.ts`),
 * de onde o texto dos cursos o lê por token `{{fact:…}}`. Os valores abaixo
 * são a cópia de segurança para os tipos continuarem fechando; se alguma tela
 * voltar a exibir canon, leia do registry, não daqui — dois lugares foi
 * exatamente o que produziu o problema acima.
 */
export const DEFAULT_EDITORIAL_VERIFICATION: EditorialVerification = {
  // A data fica na última verificação editorial de verdade. Adiantá-la para
  // hoje seria afirmar uma revisão que não houve — o defeito que as seis
  // faixas cometiam.
  verifiedAt: "2026-04-27",
  canonModels: ["GPT-5.6", "Claude Opus 5", "Gemini 3.5 Pro"],
  rule: "Conteúdo revisado com fontes oficiais recentes e cobertura real por aula.",
  sourceGroup: "official-current",
  toolLabel: "Mission Control Editorial Engine",
  sourceLinks: [
    "https://developers.openai.com/api/docs/models",
    "https://developers.openai.com/api/docs/guides/latest-model",
    "https://platform.claude.com/docs/en/about-claude/models/overview",
    "https://ai.google.dev/gemini-api/docs/models",
  ],
};

export function normalizeEditorialVerification(
  value?: Partial<EditorialVerification> | null
): EditorialVerification {
  return {
    ...DEFAULT_EDITORIAL_VERIFICATION,
    ...value,
    canonModels:
      Array.isArray(value?.canonModels) && value.canonModels.length > 0
        ? value.canonModels
        : DEFAULT_EDITORIAL_VERIFICATION.canonModels,
    sourceLinks:
      Array.isArray(value?.sourceLinks) && value.sourceLinks.length > 0
        ? value.sourceLinks
        : DEFAULT_EDITORIAL_VERIFICATION.sourceLinks,
  };
}

export function computeLessonContentCoverage(
  modules?: CourseModuleLike[] | null
): LessonContentCoverage {
  const safeModules = Array.isArray(modules) ? modules : [];
  const totalLessons = safeModules.reduce(
    (sum, module) => sum + (Array.isArray(module.lessons) ? module.lessons.length : 0),
    0
  );
  const lessonsWithContent = safeModules.reduce(
    (sum, module) =>
      sum +
      (Array.isArray(module.lessons)
        ? module.lessons.filter(
            (lesson) =>
              lesson.hasContent === true ||
              typeof lesson.content === "string" && lesson.content.trim().length > 0
          ).length
        : 0),
    0
  );

  return {
    totalLessons,
    lessonsWithContent,
    coveragePercent:
      totalLessons > 0 ? Math.round((lessonsWithContent / totalLessons) * 100) : 0,
  };
}

export function formatEditorialDate(dateLike: string, locale = "pt-BR") {
  const normalizedInput =
    /^\d{4}-\d{2}-\d{2}$/.test(dateLike)
      ? `${dateLike}T12:00:00`
      : /T00:00:00(\.000)?Z$/.test(dateLike)
        ? dateLike.replace(/T00:00:00(\.000)?Z$/, "T12:00:00Z")
        : dateLike;

  const parsed = new Date(normalizedInput);
  if (Number.isNaN(parsed.getTime())) {
    return dateLike;
  }

  /**
   * ⚠️ O fuso é FIXO, e isso não é detalhe.
   *
   * Sem `timeZone`, o `Intl` usa o fuso de quem está formatando: o servidor
   * roda em UTC na Netlify e o leitor está em UTC−3. Um `updatedAt` como
   * `2026-08-26T02:30:00Z` vira "26 de ago." no servidor e "25 de ago." no
   * navegador — texto diferente no mesmo lugar, que é exatamente o que o React
   * chama de erro de hidratação. Em produção ele aparece minificado como
   * `Minified React error #418` na página de venda (medido em 26/08/2026), e o
   * preço de um mismatch é o React descartar a árvore e desenhar tudo de novo.
   *
   * São Paulo porque o público é brasileiro e a data editorial é a nossa, não
   * a de quem lê.
   */
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);
}
