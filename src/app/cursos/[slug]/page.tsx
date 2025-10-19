import { redirect } from "next/navigation";

export default function CourseRedirectPage({ params }: { params: { slug: string } }) {
  redirect(`/curso/${params.slug}`);
}
