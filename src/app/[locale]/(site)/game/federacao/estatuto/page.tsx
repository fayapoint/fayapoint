import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";
import { atorGestao } from "@/lib/game/gestao-servidor";
import { Lock } from "lucide-react";

/**
 * O ESTATUTO DA FEDERAÇÃO — área fechada. 08/09/2026.
 *
 * ## Por que ele não é público
 *
 * O regulamento do Winners 22 é público: diz como se joga e como se aposta, e
 * quem participa precisa dele. O ESTATUTO é outra coisa — estrutura de órgãos,
 * critérios de reconhecimento de competição, mecânica de apuração de
 * integridade e o desenho da finalidade institucional. Junto, isso é a fórmula
 * de montar uma federação igual a esta.
 *
 * O subconjunto que o público precisa saber está no art. 41 do próprio
 * estatuto, e é o que vai à tela pública da Federação.
 *
 * ## Por que a guarda é de servidor, e não de cliente
 *
 * A verificação roda ANTES de o arquivo ser lido. Quem não é da federação
 * recebe 404 — não recebe a página com o conteúdo escondido por CSS, nem o
 * texto embutido no HTML esperando um `display:none`. O conteúdo nunca sai do
 * servidor para quem não pode vê-lo.
 *
 * ## Onde ele mora, e por que num arquivo
 *
 * `src/content/estatuto-federacao.md`, versionado no repositório. Assim toda
 * alteração tem autor, data e diferença — que é exatamente o que um estatuto
 * precisa ter, e o que um campo de banco editável não daria de graça.
 */

export const metadata: Metadata = {
  title: "Estatuto — Federação FayAI",
  // ⚠️ `noindex, nofollow`: documento interno. Não é higiene de SEO.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EstatutoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const ator = await atorGestao().catch(() => null);
  if (!ator?.federacao) notFound();

  const arquivo = path.join(process.cwd(), "src/content/estatuto-federacao.md");
  const texto = await readFile(arquivo, "utf8").catch(() => null);
  if (!texto) notFound();

  return (
    <div className="min-h-screen bg-[#090e11] px-5 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/game/federacao" locale={locale} className="text-sm text-white/50 hover:text-white">
          ← Federação
        </Link>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] p-4">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-xs leading-relaxed text-white/65">
            <strong className="text-white/85">Documento interno.</strong> Não é o regulamento
            público do Winners 22 — o que o público precisa saber está no art. 41 e já está na
            página da Federação. Para editar, altere{" "}
            <code className="text-white/80">src/content/estatuto-federacao.md</code>: cada
            alteração fica com autor, data e diferença.
          </p>
        </div>

        {/*
          O estilo vai inline porque o projeto não usa plugin de tipografia, e
          um documento normativo precisa de hierarquia legível: título de
          título, artigo destacado, tabela com borda e citação recuada. Sem
          isso, 45 artigos viram um paredão cinza que ninguém revisa.
        */}
        <style>{`
          .estatuto { color: rgba(255,255,255,.72); line-height: 1.75; font-size: 15px; }
          .estatuto h1 { font-size: 1.9rem; font-weight: 700; color: #fff; margin: 2.4rem 0 .6rem; letter-spacing: -.01em; }
          .estatuto h1:first-child { margin-top: 0; }
          .estatuto h2 { font-size: 1.15rem; font-weight: 650; color: #cddc39; margin: 2rem 0 .5rem; }
          .estatuto h3 { font-size: 1rem; font-weight: 650; color: rgba(255,255,255,.9); margin: 1.5rem 0 .4rem; }
          .estatuto p { margin: .7rem 0; }
          .estatuto ol, .estatuto ul { margin: .7rem 0 .7rem 1.3rem; }
          .estatuto ol { list-style: decimal; }
          .estatuto ul { list-style: disc; }
          .estatuto li { margin: .3rem 0; }
          .estatuto strong { color: #fff; font-weight: 650; }
          .estatuto code { background: rgba(255,255,255,.08); padding: .1rem .35rem; border-radius: .3rem; font-size: .88em; }
          .estatuto hr { border: 0; border-top: 1px solid rgba(255,255,255,.12); margin: 2.5rem 0; }
          .estatuto blockquote { border-left: 3px solid rgba(205,220,57,.5); background: rgba(205,220,57,.05); padding: .8rem 1rem; margin: 1.1rem 0; border-radius: 0 .6rem .6rem 0; font-size: 14px; }
          .estatuto blockquote p { margin: .35rem 0; }
          .estatuto table { width: 100%; border-collapse: collapse; margin: 1.1rem 0; font-size: 13.5px; display: block; overflow-x: auto; }
          .estatuto th, .estatuto td { border: 1px solid rgba(255,255,255,.12); padding: .5rem .7rem; text-align: left; vertical-align: top; }
          .estatuto th { background: rgba(255,255,255,.05); color: rgba(255,255,255,.85); font-weight: 600; }
          .estatuto a { color: #cddc39; text-decoration: underline; text-underline-offset: 2px; }
        `}</style>
        <article className="estatuto mt-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{texto}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
