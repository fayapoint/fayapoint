import type { Metadata } from "next";
import Link from "next/link";
import { getAllNews } from "@/lib/ai-news";
import { SEED_NEWS } from "@/data/landing/seed-news";

export const metadata: Metadata = {
  title: "IA Hoje — notícias de inteligência artificial | FayAI",
  description:
    "As notícias de IA que importam para brasileiros, selecionadas e explicadas todos os dias pela FayAI — com link para a fonte original.",
};

export const revalidate = 900;

const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;
const GOLD = "#f5c04e";

export default async function NoticiasPage() {
  const news = await getAllNews(30);
  const items = news.length > 0 ? news : SEED_NEWS;

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
      ` }} />

      <header className="flex items-center justify-between px-4 sm:px-8 pt-4 pb-2 max-w-5xl mx-auto">
        <Link href="/" className="text-3xl sm:text-4xl tracking-wide select-none" style={bebas}>
          FAY<span style={{ color: GOLD }}>AI</span>
        </Link>
        <Link href="/login" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
          Entrar
        </Link>
      </header>

      <section className="px-4 sm:px-8 pt-6 pb-4 max-w-5xl mx-auto">
        <h1 className="text-5xl sm:text-7xl tracking-wide leading-[0.95]" style={bebas}>
          IA <span style={{ color: GOLD }}>HOJE</span>
        </h1>
        <p className="mt-3 text-base sm:text-lg text-white/65 max-w-2xl">
          As notícias de inteligência artificial que importam — selecionadas e explicadas todos os
          dias para quem está aprendendo IA no Brasil. Sempre com o link da fonte original.
        </p>
      </section>

      <section className="px-4 sm:px-8 pb-16 max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={news.length > 0 ? `/noticias/${item.slug}` : item.url || "/"}
              className="glass glass-hover nimg group rounded-2xl overflow-hidden block"
            >
              <span className="block relative overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image ?? "/landing/tags/tendencia.webp"}
                  alt={item.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </span>
              <span className="block p-4">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: GOLD }}>
                    {item.tag}
                  </span>
                  {item.date && (
                    <span className="text-[10px] text-white/40">
                      {new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                </span>
                <span className="block mt-1.5 text-base font-bold leading-snug">{item.title}</span>
                <span className="block mt-1.5 text-sm text-white/55 leading-relaxed line-clamp-3">
                  {item.summary}
                </span>
                {item.source && (
                  <span className="block mt-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                    Fonte: {item.source}
                  </span>
                )}
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
