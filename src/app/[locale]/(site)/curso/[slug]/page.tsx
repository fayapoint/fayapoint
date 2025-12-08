import CourseSalesPage from "./CourseSalesPage";
import { allCourses } from "@/data/courses";

export async function generateStaticParams() {
  return allCourses.map((course) => ({
    slug: course.slug,
  }));
}

export default function Page() {
  return <CourseSalesPage />;
}
