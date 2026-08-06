import { Languages } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ehIngles } from "@/lib/idioma";

/**
 * O aviso de que este curso é uma TRADUÇÃO.
 *
 * ── Por que só um curso, e por que ele ──────────────────────────────────────
 *
 * `ia-sem-filtro-por-claude` é o livro escrito em primeira pessoa por uma IA,
 * assinado por ela, com honestidade radical como premissa declarada. O texto
 * original é português, e foi o Claude que o escreveu em português.
 *
 * Servir a versão inglesa sem dizer nada seria o livro afirmando ser algo que
 * não é — uma IA que promete honestidade radical apresentando texto de máquina
 * como se fosse a voz original. O aviso não é uma nota de rodapé legal: é a
 * única forma de a tradução não contradizer o próprio conteúdo do livro.
 *
 * Os outros cursos são material didático, e material didático traduzido não faz
 * essa promessa. Por isso a lista tem um item só — e crescer é decisão, não
 * descuido.
 */
const PRECISAM_DE_AVISO = new Set(["ia-sem-filtro-por-claude"]);

export async function AvisoTraducao({ slug, locale }: { slug: string; locale: string }) {
  if (!ehIngles(locale) || !PRECISAM_DE_AVISO.has(slug)) return null;

  const t = await getTranslations({ locale, namespace: "TranslationNotice" });

  return (
    <div
      role="note"
      className="mx-auto mb-6 flex max-w-3xl items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] px-5 py-4"
    >
      <Languages className="mt-0.5 shrink-0 text-amber-300" size={18} />
      <div>
        <p className="text-sm font-bold text-amber-100">{t("title")}</p>
        <p className="mt-1 text-sm leading-relaxed text-amber-100/75">{t("body")}</p>
      </div>
    </div>
  );
}
