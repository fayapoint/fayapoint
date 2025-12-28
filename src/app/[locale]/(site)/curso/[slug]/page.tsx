import type { Metadata } from "next";
import CourseSalesPage from "./CourseSalesPage";
import { allCourses } from "@/data/courses";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  return allCourses.map((course) => ({
    slug: course.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = allCourses.find((c) => c.slug === slug);
  
  const title = course?.title 
    ? `${course.title} - FayaPoint AI Academy`
    : "Curso - FayaPoint AI Academy";
  const description = course?.shortDescription || "Aprenda IA com cursos práticos e atualizados.";

  return generatePageMetadata({
    locale,
    path: `/curso/${slug}`,
    title,
    description,
  });
}

export default function Page() {
  return <CourseSalesPage />;
}
