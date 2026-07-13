import { redirect } from "next/navigation";

// A landing foi promovida a home oficial — /nova era a rota de protótipo.
export default function NovaPage() {
  redirect("/");
}
