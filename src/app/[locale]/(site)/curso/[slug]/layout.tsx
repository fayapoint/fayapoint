import fatia from "../../../../../../messages/rotas/curso.json";
import { ProvedorDeRota } from "@/i18n/rota";

/**
 * Layout só para entregar a fatia de dicionário desta rota — e de tudo que
 * pendura debaixo dela (`/meu`, `/meu/ajustes`, `/previa`, `/continuar`,
 * `/livro`).
 *
 * A página de venda do curso é a terceira mais pesada em texto de interface
 * (141 KB, 1.454 entradas). Ver `src/i18n/rota.tsx`.
 *
 * ⚠️ `generateStaticParams` continua em `page.tsx`, e é de lá que o Next tira
 * os `slug` das 453 páginas geradas. Este arquivo não declara nenhum, de
 * propósito: layout não precisa, e duplicar a lista criaria uma segunda fonte
 * da verdade para os cursos publicados.
 */
export default async function CursoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale } = await params;
  return (
    <ProvedorDeRota locale={locale} fatia={fatia}>
      {children}
    </ProvedorDeRota>
  );
}
