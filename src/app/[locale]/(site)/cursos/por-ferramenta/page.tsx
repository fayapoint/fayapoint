import { useT } from "@/i18n/dicionario";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

type Tool = string;

export default function CoursesByToolPage() {
  const T = useT();
  const t = useTranslations("CoursesByTool");
  const tools = t.raw("tools") as Tool[];
  const formatSlug = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-6">{t("title")}</h1>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Link key={tool} href={`/cursos/${formatSlug(tool)}`}>
                <Card className="p-6 bg-secondary border-border hover:bg-white/10 transition cursor-pointer">
                  <h3 className="text-xl font-semibold">{T(tool)}</h3>
                  <p className="text-muted-foreground text-sm">{t("cta", { tool })}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
