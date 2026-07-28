import { permanentRedirect } from "next/navigation";

// A landing foi promovida a home oficial — /nova era a rota de protótipo.
//
// Era `redirect("/")`, que responde 307 (temporário) e ainda perdia o locale,
// virando cadeia de dois saltos. Protótipo aposentado é 308: temporário manda
// o Google guardar a URL antiga no índice (corrigido em 28/07/2026).
export default async function NovaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  permanentRedirect(`/${locale}`);
}
