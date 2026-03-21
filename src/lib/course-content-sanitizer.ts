const TOP_LEVEL_HEADING_SPLIT = /(?=^# [^#].*$)/gm;
const SUPPORT_SECTION_PATTERNS = [
  { type: "template", pattern: /^#\s+TEMPLATE:\s*(.+)$/i },
  { type: "exercise", pattern: /^#\s+EXERC[IÍ]CIO:\s*(.+)$/i },
  { type: "finalProject", pattern: /^#\s+PROJETO FINAL:\s*(.+)$/i },
  {
    type: "resources",
    pattern: /^#\s+Recursos Adicionais e Pr[oó]ximos Passos\s*$/i,
  },
] as const;

type SupportSectionType = (typeof SUPPORT_SECTION_PATTERNS)[number]["type"];

export interface SanitizedCourseContent {
  content: string;
  removedHeadings: string[];
  relocatedHeadings: string[];
}

function splitTopLevelSections(markdown: string) {
  return markdown
    .replace(/\r\n/g, "\n")
    .split(TOP_LEVEL_HEADING_SPLIT)
    .map((section) => section.trim())
    .filter(Boolean);
}

function getSectionHeading(section: string) {
  return section.split("\n")[0]?.trim() || "";
}

function classifySupportSection(heading: string): {
  type: SupportSectionType;
  match: RegExpMatchArray;
} | null {
  for (const entry of SUPPORT_SECTION_PATTERNS) {
    const match = heading.match(entry.pattern);
    if (match) {
      return { type: entry.type, match };
    }
  }

  return null;
}

function toSupportHeadingTitle(
  supportSection: ReturnType<typeof classifySupportSection>
) {
  if (!supportSection) return "";

  switch (supportSection.type) {
    case "template":
      return `Template aplicado: ${supportSection.match[1]?.trim() || "Material de apoio"}`;
    case "exercise":
      return `Exercício guiado: ${supportSection.match[1]?.trim() || "Prática"}`;
    case "finalProject":
      return `Projeto final orientado: ${supportSection.match[1]?.trim() || "Entrega final"}`;
    case "resources":
      return "Recursos e próximos passos";
    default:
      return supportSection.match[0].replace(/^#\s+/, "").trim();
  }
}

function buildSupportSection(section: string, supportSection: NonNullable<ReturnType<typeof classifySupportSection>>) {
  const lines = section.replace(/\r\n/g, "\n").split("\n");
  lines[0] = `## ${toSupportHeadingTitle(supportSection)}`;
  return lines.join("\n").trim();
}

function buildSupportAppendix(sections: string[]) {
  return [
    "# Materiais de apoio e aplicação",
    "Este bloco reúne templates, exercícios, projeto final e próximos passos para aprofundar a implementação sem quebrar o fluxo principal de leitura.",
    ...sections.flatMap((section, index) =>
      index === 0 ? [section] : ["---", section]
    ),
  ]
    .join("\n\n")
    .trim();
}

export function sanitizeCourseContent(markdown: string): SanitizedCourseContent {
  const sections = splitTopLevelSections(markdown);
  const keptSections: string[] = [];
  const removedHeadings: string[] = [];
  const relocatedHeadings: string[] = [];
  const supportSections: string[] = [];

  for (const section of sections) {
    const heading = getSectionHeading(section);
    const supportSection = classifySupportSection(heading);

    if (supportSection) {
      relocatedHeadings.push(heading);
      supportSections.push(buildSupportSection(section, supportSection));
      continue;
    }

    if (!heading) {
      continue;
    }

    keptSections.push(section);
  }

  if (supportSections.length > 0) {
    keptSections.push(buildSupportAppendix(supportSections));
  }

  return {
    content: keptSections.join("\n\n---\n\n").trim(),
    removedHeadings,
    relocatedHeadings,
  };
}

export function countCourseContentChapters(markdown: string) {
  return splitTopLevelSections(markdown).length;
}
