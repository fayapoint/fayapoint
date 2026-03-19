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

export const DEFAULT_EDITORIAL_VERIFICATION: EditorialVerification = {
  verifiedAt: "2026-03-19",
  canonModels: ["GPT-5.4", "Claude Opus 4.6"],
  rule: "Conteúdo revisado com fontes oficiais recentes e cobertura real por aula.",
  sourceGroup: "official-current",
  toolLabel: "Mission Control Editorial Engine",
  sourceLinks: [
    "https://openai.com/fi-FI/index/introducing-gpt-5-4/",
    "https://developers.openai.com/api/docs/models/gpt-5.4",
    "https://www.anthropic.com/system-cards/",
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
  const parsed = new Date(dateLike);
  if (Number.isNaN(parsed.getTime())) {
    return dateLike;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}
