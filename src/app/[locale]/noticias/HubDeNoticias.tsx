import { obterT } from "@/i18n/dicionario-servidor";
import Link from "next/link";
import { getAllNews } from "@/lib/ai-news";
import { SEED_NEWS } from "@/data/landing/seed-news";
import { ExperienceNav } from "@/components/layout/ExperienceNav";
import { comIdioma } from "@/lib/rota-idioma";
import { getTranslations } from "next-intl/server";

/**
 * O hub das notícias — a tela, sem a rota.
 *
 * ⚠️ Ele foi extraído daqui em 26/08/2026 por causa do primeiro byte: a página
 * lia `searchParams` para filtrar por tag, e **ler `searchParams` desliga o
 * ISR**. O `export const revalidate = 900` estava no arquivo desde sempre e
 * nunca valeu: toda visita renderizava o hub inteiro no servidor. Medido no
 * laudo de 26/08 — TTFB de 1.707 ms, contra 95–350 ms do resto do site, 5 a 17
 * vezes mais lento, e a página mais lenta da casa por margem larga.
 *
 * Agora a tag é SEGMENTO (`/noticias/tag/<tag>`), e cada uma é uma rota com
 * cache próprio. Em query não daria: a borda da Netlify ignora todo parâmetro
 * fora do `Netlify-Vary: query=<lista>`, então a versão cacheada de
 * `?tag=MODELOS` seria o hub sem filtro nenhum.
 */

const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;
const GOLD = "#f5c04e";

/**
 * A data no fuso de quem lê, e no idioma da página.
 *
 * Sem `timeZone`, quem formata é o servidor — UTC na Netlify — e uma notícia
 * das 21h de Brasília aparece com a data do dia seguinte. É a mesma armadilha
 * do `formatEditorialDate` (`ca86238`), aqui sem erro de hidratação porque a
 * página é só de servidor: o leitor brasileiro simplesmente vê o dia errado.
 */
function formatarData(data: string, locale: string, mes: "long" | "short") {
  return new Date(data).toLocaleDateString(locale === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: mes,
    timeZone: "America/Sao_Paulo",
  });
}

export async function HubDeNoticias({ locale, tag }: { locale: string; tag?: string }) {
  const T = await obterT(locale);
  const t = await getTranslations({ locale, namespace: "NewsHub" });
  const all = await getAllNews(60, locale);
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
        {/* Hero com vídeo-loop (Liga B §10: 1 por página, ≤400KB, mudo) */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 mb-6">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/blog/covers/hero.webp"
            className="h-44 sm:h-64 w-full object-cover motion-reduce:hidden"
            aria-hidden
          >
            <source src="/blog/hero-loop.webm" type="video/webm" />
          </video>
          {/* eslint-disable-next-line @next/next/no-img-element -- fallback estático p/ reduced-motion */}
          <img src="/blog/covers/hero.webp" alt="" aria-hidden className="hidden h-44 sm:h-64 w-full object-cover motion-reduce:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e1d] via-[#0c0e1d]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5 sm:p-7">
            <h1 className="text-5xl sm:text-7xl tracking-wide leading-[0.95]" style={bebas}>
              {t.rich("title", { destaque: (c) => <span style={{ color: GOLD }}>{c}</span> })}
            </h1>
          </div>
        </div>
        <p className="text-base sm:text-lg text-white/65 max-w-2xl">
          {t("intro")}
        </p>

        {/* Chips de categoria (mix do blog antigo) */}
        {tags.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-5">
            <Link
              href={`/${locale}/noticias`}
              className="rounded-full px-4 py-1.5 text-xs font-bold border transition-colors"
              style={
                !tag
                  ? { background: GOLD, color: "#241a05", borderColor: GOLD }
                  : { borderColor: "rgba(255,255,255,.2)", color: "rgba(255,255,255,.7)" }
              }
            >
              {t("all")}
            </Link>
            {tags.map((t) => (
              <Link
                key={t}
                /* ⚠️ COM o prefixo de idioma, e em SEGMENTO — não em query.
                   O prefixo: sem ele cada chip custava um 308 por clique,
                   medido em 05/08/2026.
                   O segmento: `?tag=` fazia a página inteira ficar dinâmica
                   (ler `searchParams` desliga o ISR), e a borda da Netlify
                   ignora todo parâmetro fora do `Netlify-Vary: query=` — ou
                   seja, se um dia a página fosse cacheada, os oito chips
                   serviriam o mesmo HTML sem filtro. Em caminho, cada tag é
                   uma rota com cache próprio. Ver
                   [[reference_netlify_vary_query]]. */
                href={`/${locale}/noticias/tag/${encodeURIComponent(t)}`}
                className="rounded-full px-4 py-1.5 text-xs font-bold border transition-colors"
                style={
                  tag === t
                    ? { background: GOLD, color: "#241a05", borderColor: GOLD }
                    : { borderColor: "rgba(255,255,255,.2)", color: "rgba(255,255,255,.7)" }
                }
              >
                {T(t)}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Destaque */}
      {featured && (
        <section className="px-4 sm:px-8 pb-6 max-w-6xl mx-auto">
          <Link href={`/${locale}/noticias/${featured.slug}`} className="glass glass-hover nimg feat rounded-3xl overflow-hidden block">
            <span className="fimg block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featured.image ?? "/landing/tags/tendencia.webp"} alt={T(featured.title)} className="absolute inset-0 w-full h-full object-cover" />
            </span>
            <span className="block p-6 sm:p-8">
              <span className="flex items-center gap-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest rounded-full px-2.5 py-1" style={{ background: GOLD, color: "#241a05" }}>
                  {t("featured")}
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: GOLD }}>{T(featured.tag)}</span>
              </span>
              <span className="block mt-3 text-2xl sm:text-4xl tracking-wide leading-tight" style={bebas}>
                {T(featured.title)}
              </span>
              <span className="block mt-3 text-sm sm:text-base text-white/60 leading-relaxed">{T(featured.summary)}</span>
              {featured.source && (
                <span className="block mt-4 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                  {t("source", { source: featured.source })}
                  {featured.date ? ` · ${formatarData(featured.date, locale, "long")}` : ""}
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
              <Link key={item.slug} href={`/${locale}/noticias/${item.slug}`} className="glass glass-hover nimg group rounded-2xl overflow-hidden block">
                <span className="block relative overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image ?? "/landing/tags/tendencia.webp"} alt={T(item.title)} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                </span>
                <span className="block p-4">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: GOLD }}>{T(item.tag)}</span>
                    {item.date && (
                      <span className="text-[10px] text-white/40">
                        {formatarData(item.date, locale, "short")}
                      </span>
                    )}
                  </span>
                  <span className="block mt-1.5 text-base font-bold leading-snug">{T(item.title)}</span>
                  <span className="block mt-1.5 text-sm text-white/55 leading-relaxed line-clamp-3">{T(item.summary)}</span>
                  {item.source && (
                    <span className="block mt-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">{t("source", { source: item.source })}</span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <section className="px-4 sm:px-8 pb-10 max-w-6xl mx-auto">
          <p className="text-white/50">{t("empty")}</p>
        </section>
      )}

      {/* Guias rápidos (conteúdo evergreen) */}
      <section className="px-4 sm:px-8 pb-16 max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl tracking-wide mb-4" style={bebas}>
          
          {T("GUIAS")} <span style={{ color: GOLD }}>{T("RÁPIDOS")}</span>
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {/* O href vem do DADO (`seed-news.ts`), que é escrito sem idioma — por
              isso passa pelo `comIdioma`, em vez de confiar em o autor do dado
              ter lembrado do prefixo. Sem isto, "GUIAS RÁPIDOS" era o único
              ponto de /en/noticias que devolvia o leitor ao português. */}
          {SEED_NEWS.map((g) => (
            <Link key={g.slug} href={comIdioma(g.url ?? "/cursos", locale)} className="glass glass-hover group rounded-2xl overflow-hidden block">
              <span className="block relative overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.image ?? "/landing/tags/voce-sabia.webp"} alt={T(g.title)} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              </span>
              <span className="block p-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: GOLD }}>{T(g.tag)}</span>
                <span className="block mt-1 text-sm font-bold leading-snug">{T(g.title)}</span>
                <span className="block mt-1.5 text-xs text-white/55 leading-relaxed line-clamp-2">{T(g.summary)}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="px-4 sm:px-8 pb-6 text-center text-[11px] text-white/35">
        © {new Date().getFullYear()}  {T("FayAI — aprenda IA fazendo, não assistindo.")}
      </footer>
    </div>
  );
}
