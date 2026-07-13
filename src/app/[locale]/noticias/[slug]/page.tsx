import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsBySlug, getAllNews, extraArtsFor } from "@/lib/ai-news";

export const revalidate = 900;

const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;
const GOLD = "#f5c04e";

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);
  if (!item) return {};
  return { title: `${item.title} — IA Hoje | FayAI`, description: item.summary };
}

export default async function NoticiaPage({ params }: Props) {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);
  if (!item) notFound();

  const others = (await getAllNews(7)).filter((n) => n.slug !== slug).slice(0, 3);
  const paragraphs = item.body && item.body.length > 0 ? item.body : [item.summary];
  const [artA, artB] = extraArtsFor(slug);

  return (
    <div
      className="min-h-dvh overflow-x-hidden text-[#f3f1ff]"
      style={{
        background:
          "radial-gradient(900px 500px at 12% -8%, rgba(167,139,250,.22), transparent 60%)," +
          "radial-gradient(800px 480px at 96% 30%, rgba(56,189,248,.16), transparent 55%)," +
          "#0c0e1d",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .glass {
          position: relative;
          background: linear-gradient(160deg, rgba(255,255,255,.06), rgba(255,255,255,0) 38%), rgba(22, 26, 54, 0.42);
          backdrop-filter: blur(18px) saturate(1.7);
          -webkit-backdrop-filter: blur(18px) saturate(1.7);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.22), 0 12px 40px -14px rgba(0,0,0,.55);
        }
        .glass-hover { transition: border-color .3s ease, transform .3s ease; }
        .glass-hover:hover { border-color: rgba(255,255,255,.32); transform: translateY(-3px); }
      ` }} />

      <header className="flex items-center justify-between px-4 sm:px-8 pt-4 pb-2 max-w-3xl mx-auto">
        <Link href="/" className="text-3xl tracking-wide select-none" style={bebas}>
          FAY<span style={{ color: GOLD }}>AI</span>
        </Link>
        <Link href="/noticias" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
          ← IA Hoje
        </Link>
      </header>

      <article className="px-4 sm:px-8 pt-6 pb-10 max-w-3xl mx-auto">
        <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: GOLD }}>
          {item.tag}
          {item.date &&
            ` · ${new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`}
        </span>
        <h1 className="mt-2 text-4xl sm:text-6xl tracking-wide leading-[0.95]" style={bebas}>
          {item.title}
        </h1>
        <p className="mt-3 text-lg text-white/75 leading-relaxed font-medium">{item.summary}</p>

        {/* Arte da casa */}
        <div className="glass rounded-3xl overflow-hidden mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image ?? "/landing/tags/tendencia.webp"}
            alt={item.title}
            className="w-full object-cover"
            style={{ aspectRatio: "16 / 9" }}
          />
          <p className="px-4 py-2 text-[10px] uppercase tracking-wider text-white/35">
            Ilustração: FayAI Studio
          </p>
        </div>

        {/* Análise FayAI — com ilustrações intercaladas */}
        <div className="mt-7 space-y-5">
          {paragraphs.map((p, i) => (
            <div key={i} className="space-y-5">
              <p className={`leading-relaxed ${i === 0 ? "text-base sm:text-lg text-white/85" : "text-base text-white/70"}`}>
                {p}
              </p>
              {i === 0 && paragraphs.length > 1 && (
                <figure className="glass rounded-2xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={artA} alt="" loading="lazy" className="w-full object-cover" style={{ aspectRatio: "16 / 8" }} />
                  <figcaption className="px-4 py-2 text-[10px] uppercase tracking-wider text-white/35">Ilustração: FayAI Studio</figcaption>
                </figure>
              )}
              {i === 2 && paragraphs.length > 3 && (
                <figure className="glass rounded-2xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={artB} alt="" loading="lazy" className="w-full object-cover" style={{ aspectRatio: "16 / 8" }} />
                  <figcaption className="px-4 py-2 text-[10px] uppercase tracking-wider text-white/35">Ilustração: FayAI Studio</figcaption>
                </figure>
              )}
            </div>
          ))}
          {paragraphs.length > 1 && paragraphs.length <= 3 && (
            <figure className="glass rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={artB} alt="" loading="lazy" className="w-full object-cover" style={{ aspectRatio: "16 / 8" }} />
              <figcaption className="px-4 py-2 text-[10px] uppercase tracking-wider text-white/35">Ilustração: FayAI Studio</figcaption>
            </figure>
          )}
        </div>

        {/* Fonte original */}
        {item.url && item.url.startsWith("http") && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass glass-hover mt-8 flex items-center gap-4 rounded-2xl p-4"
          >
            {item.sourceImage && (
              <span className="block relative overflow-hidden rounded-xl shrink-0 w-28 sm:w-36" style={{ aspectRatio: "16 / 10" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.sourceImage} alt={`Imagem original: ${item.source ?? "fonte"}`} className="absolute inset-0 w-full h-full object-cover" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-white/40">
                Matéria original{item.sourceImage ? " · imagem da fonte" : ""}
              </span>
              <span className="block mt-1 text-sm font-bold" style={{ color: GOLD }}>
                Ler em {item.source ?? "fonte original"} ↗
              </span>
            </span>
          </a>
        )}
      </article>

      {/* Mais notícias */}
      {others.length > 0 && (
        <section className="px-4 sm:px-8 pb-16 max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl tracking-wide mb-4" style={bebas}>
            MAIS <span style={{ color: GOLD }}>IA HOJE</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {others.map((n) => (
              <Link key={n.slug} href={`/noticias/${n.slug}`} className="glass glass-hover group rounded-2xl overflow-hidden block">
                <span className="block relative overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={n.image ?? "/landing/tags/tendencia.webp"} alt={n.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                </span>
                <span className="block p-3.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: GOLD }}>{n.tag}</span>
                  <span className="block mt-1 text-sm font-bold leading-snug">{n.title}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="px-4 sm:px-8 pb-6 text-center text-[11px] text-white/35">
        © {new Date().getFullYear()} FayAI — aprenda IA fazendo, não assistindo.
      </footer>
    </div>
  );
}
