import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ResourcesIndexPage() {
  const t = useTranslations("Resources");
  const links = t.raw("links") as { href: string; label: string }[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
          <ul className="list-disc list-inside text-gray-400 space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-purple-400">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
