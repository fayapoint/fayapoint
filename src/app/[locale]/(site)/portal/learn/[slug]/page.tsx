import type { Metadata } from "next";
import CourseReaderPage from "./CourseReaderPage";
import { allCourses } from "@/data/courses";
import { generatePageMetadata } from "@/lib/metadata";

// Force dynamic rendering — avoids 404s when new courses are added
// without requiring a full rebuild/redeploy
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = allCourses.find((c) => c.slug === slug);

  const title = course?.title
    ? `${course.title} - Aprender | FayAi`
    : "Aprender - FayAi AI Academy";
  const description =
    course?.shortDescription ||
    "Aprenda IA com cursos práticos e atualizados.";

  return generatePageMetadata({
    locale,
    path: `/portal/learn/${slug}`,
    title,
    description,
  });
}

export default function Page() {
  return <CourseReaderPage />;
}
