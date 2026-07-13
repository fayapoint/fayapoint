import type { Metadata } from "next";
import Link from "next/link";
import { getAllNews } from "@/lib/ai-news";
import { SEED_NEWS } from "@/data/landing/seed-news";
import { ExperienceNav } from "@/components/layout/ExperienceNav";

export const metadata: Metadata = {
  title: "IA Hoje — notícias de inteligência artificial | FayAI",
  description:
    "As notícias de IA que importam para brasileiros, selecionadas e explicadas todos os dias pela FayAI — com link para a fonte original.",
};

export const revalidate = 900;

const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;
const GOLD = "#f5c04e";

interface Props {
  searchParams: Promise<{ tag?: string }>;
}

export default async function NoticiasPage({ searchParams }: Props) {
  const { tag } = await searchParams;
  const all = await getAllNews(60);
  const tags = [...new Set(all.map((n) => n.tag))].slice(0, 8);
  const filtered = tag ? all.filter((n) => n.tag === tag) : all;
  const [featured, ...rest] = filtered;

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
        .glass-hover:hover { border-color: rgba(255,255,255,.32); transform: translateY(-4px); }
        .nimg img { transition: transform .5s ease; }
        .nimg:hover img { transform: scale(1.05); }
        .feat { display: grid; grid-template-columns: 1fr; }
        @media (min-width: 760px) { .feat { grid-template-columns: 5fr 4fr; } .feat .fimg { min-height: 100%; aspect-ratio: auto; } }
        .fimg { position: relative; overflow: hidden; aspect-ratio: 16 / 9; }
      ` }} />

      <ExperienceNav />

      <section className="px-4 sm:px-8 pt-6 pb-4 max-w-6xl mx-auto">
        <h1 className="text-5xl sm:text-7xl tracking-wide leading-[0.95]" style={bebas}>
          IA <span style={{ color: GOLD }}>HOJE</span>
        </h1>
        <p className="mt-3 text-base sm:text-lg text-white/65 max-w-2xl">
          As notícias de IA que importam — selecionadas e explicadas todos os dias para quem está
          aprendendo no Brasil. Sempre com o link da fonte original.
        </p>

        {/* Chips de categoria (mix do blog antigo) */}
        {tags.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-5">
            <Link
              href="/noticias"
              className="rounded-full px-4 py-1.5 text-xs font-bold border transition-colors"
              style={
                !tag
                  ? { background: GOLD, color: "#241a05", borderColor: GOLD }
                  : { borderColor: "rgba(255,255,255,.2)", color: "rgba(255,255,255,.7)" }
              }
            >
              Todas
            </Link>
            {tags.map((t) => (
              <Link
                key={t}
                href={`/noticias?tag=${encodeURIComponent(t)}`}
                className="rounded-full px-4 py-1.5 text-xs font-bold border transition-colors"
                style={
                  tag === t
                    ? { background: GOLD, color: "#241a05", borderColor: GOLD }
                    : { borderColor: "rgba(255,255,255,.2)", color: "rgba(255,255,255,.7)" }
                }
              >
                {t}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Destaque */}
      {featured && (
        <section className="px-4 sm:px-8 pb-6 max-w-6xl mx-auto">
          <Link href={`/noticias/${featured.slug}`} className="glass glass-hover nimg feat rounded-3xl overflow-hidden block">
            <span className="fimg block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featured.image ?? "/landing/tags/tendencia.webp"} alt={featured.title} className="absolute inset-0 w-full h-full object-cover" />
            </span>
            <span className="block p-6 sm:p-8">
              <span className="flex items-center gap-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest rounded-full px-2.5 py-1" style={{ background: GOLD, color: "#241a05" }}>
                  DESTAQUE
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: GOLD }}>{featured.tag}</span>
              </span>
              <span className="block mt-3 text-2xl sm:text-4xl tracking-wide leading-tight" style={bebas}>
                {featured.title}
              </span>
              <span className="block mt-3 text-sm sm:text-base text-white/60 leading-relaxed">{featured.summary}</span>
              {featured.source && (
                <span className="block mt-4 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                  Fonte: {featured.source}
                  {featured.date ? ` · ${new Date(featured.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}` : ""}
                </span>
              )}
            </span>
          </Link>
        </section>
      )}

      {/* Grade */}
      {rest.length > 0 && (
        <section className="px-4 sm:px-8 pb-10 max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((item) => (
              <Link key={item.slug} href={`/noticias/${item.slug}`} className="glass glass-hover nimg group rounded-2xl overflow-hidden block">
                <span className="block relative overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image ?? "/landing/tags/tendencia.webp"} alt={item.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                </span>
                <span className="block p-4">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: GOLD }}>{item.tag}</span>
                    {item.date && (
                      <span className="text-[10px] text-white/40">
                        {new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                  </span>
                  <span className="block mt-1.5 text-base font-bold leading-snug">{item.title}</span>
                  <span className="block mt-1.5 text-sm text-white/55 leading-relaxed line-clamp-3">{item.summary}</span>
                  {item.source && (
                    <span className="block mt-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">Fonte: {item.source}</span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <section className="px-4 sm:px-8 pb-10 max-w-6xl mx-auto">
          <p className="text-white/50">Nenhuma notícia nesta categoria ainda — o agente publica todo dia às 7h.</p>
        </section>
      )}

      {/* Guias rápidos (conteúdo evergreen) */}
      <section className="px-4 sm:px-8 pb-16 max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl tracking-wide mb-4" style={bebas}>
          GUIAS <span style={{ color: GOLD }}>RÁPIDOS</span>
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {SEED_NEWS.map((g) => (
            <Link key={g.slug} href={g.url ?? "/cursos"} className="glass glass-hover group rounded-2xl overflow-hidden block">
              <span className="block relative overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.image ?? "/landing/tags/voce-sabia.webp"} alt={g.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              </span>
              <span className="block p-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: GOLD }}>{g.tag}</span>
                <span className="block mt-1 text-sm font-bold leading-snug">{g.title}</span>
                <span className="block mt-1.5 text-xs text-white/55 leading-relaxed line-clamp-2">{g.summary}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="px-4 sm:px-8 pb-6 text-center text-[11px] text-white/35">
        © {new Date().getFullYear()} FayAI — aprenda IA fazendo, não assistindo.
      </footer>
    </div>
  );
}
