import * as fs from 'fs';
import * as path from 'path';
import {
  countCourseContentChapters,
  sanitizeCourseContent,
} from '../src/lib/course-content-sanitizer';

const COURSES_DIR = path.join(__dirname, '..', 'courses');
const FORBIDDEN_HEADING = /^#\s+(TEMPLATE:|EXERC[IÍ]CIO:|PROJETO FINAL:|Recursos Adicionais e Pr[oó]ximos Passos)/im;

function main() {
  const courseDirs = fs
    .readdirSync(COURSES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  let failures = 0;

  for (const slug of courseDirs) {
    const contentPath = path.join(COURSES_DIR, slug, 'CONTENT.md');
    if (!fs.existsSync(contentPath)) {
      continue;
    }

    const raw = fs.readFileSync(contentPath, 'utf-8');
    const sanitized = sanitizeCourseContent(raw);
    const stillHasForbiddenHeadings = FORBIDDEN_HEADING.test(sanitized.content);

    console.log(
      `${slug}: ${countCourseContentChapters(sanitized.content)} capítulos válidos, ${sanitized.relocatedHeadings.length} secções movidas para apoio`
    );

    if (sanitized.relocatedHeadings.length > 0) {
      console.log(`  apoio: ${sanitized.relocatedHeadings.join(' | ')}`);
    }

    if (stillHasForbiddenHeadings) {
      failures += 1;
      console.error(`  ERRO: ainda restaram headings proibidos após sanitização.`);
    }
  }

  if (failures > 0) {
    process.exit(1);
  }
}

main();
