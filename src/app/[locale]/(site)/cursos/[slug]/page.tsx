import { redirect } from "next/navigation";

export default async function CourseRedirectPage({ params }: { params: { slug: string } }) {
  await redirect(`/curso/${params.slug}`);
}
