import { redirect } from "next/navigation";

// O blog vive agora no hub de notícias IA Hoje, na identidade nova.
// Posts legados continuam acessíveis em /blog/[slug].
export default function BlogPage() {
  redirect("/noticias");
}
