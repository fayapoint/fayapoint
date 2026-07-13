"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles, Wrench } from "lucide-react";
import { FAY_PROJECTS, SERVICES, STATUS_LABEL, type ProjectStatus } from "@/data/landing/projects";
import { ExperienceNav } from "@/components/layout/ExperienceNav";

const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;
const GOLD = "#f5c04e";

const STATUS_COLOR: Record<ProjectStatus, string> = {
  "no-ar": "#a3e635",
  "beta": "#38bdf8",
  "construindo": "#f5c04e",
  "pesquisa": "#a78bfa",
};

// Marcos reais da trajetória (fonte: currículo público do Ricardo)
const TIMELINE = [
  {
    era: "ANOS 90 — O COMEÇO",
    image: "/landing/sobre-era-90s.webp",
    accent: "#38bdf8",
    title: "Do 386 à primeira empresa aos 16",
    text:
      "São José dos Campos, era do 386. Enquanto configurava e 'afinava' os micros que abasteciam o Vale do Paraíba, Ricardo abria a própria loja de RPG — a Tales of the Vale — criando do zero a marca e um método visual de ensinar o jogo com Photoshop e 3D Studio 1. Depois vieram o intercâmbio nos EUA, o técnico industrial e Ciência da Computação na UNIVAP.",
  },
  {
    era: "1995–2018 — O BROADCAST",
    image: "/landing/sobre-era-tv.webp",
    accent: "#f5c04e",
    title: "28 anos editando para milhões",
    text:
      "Editor profissional com passagens por MultiRio, FGV (editor-chefe), Jockey Club (liderou a transição SD→HD da emissora) e TV alemã ZDF/ARD — editando em equipamentos inteiramente em alemão. O ápice: Fox Sports e Fox International Channels, cortando Copa do Mundo e Olimpíadas para mais de 20 milhões de espectadores DIÁRIOS.",
  },
  {
    era: "2023–HOJE — A ERA DA IA",
    image: "/landing/sobre-era-ia.webp",
    accent: "#a78bfa",
    title: "Uma vida inteira apontando para cá",
    text:
      "Certificações Google Cloud em IA generativa, LLMs e Prompt Design. O USS apresentado no RioWebSummit. E o FayAI: um ecossistema onde agentes de IA escrevem, editam, publicam e ensinam — construído por quem passou 30 anos aprendendo cada tecnologia no dia em que ela nascia. Nada aqui é moda: é a continuação natural de uma história.",
  },
];

export function ProjetosPage() {
  return (
    <div
      className="min-h-dvh overflow-x-hidden text-[#f3f1ff]"
      style={{
        background:
          "radial-gradient(900px 500px at 12% -8%, rgba(167,139,250,.22), transparent 60%)," +
          "radial-gradient(800px 480px at 96% 30%, rgba(56,189,248,.16), transparent 55%)," +
          "radial-gradient(700px 500px at 50% 115%, rgba(244,114,182,.14), transparent 60%)," +
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
        .glass::before {
          content: ""; position: absolute; inset: 0; z-index: 2; pointer-events: none;
          border-radius: inherit;
          background: radial-gradient(420px 140px at 18% -8%, rgba(255,255,255,.16), transparent 60%);
        }
        .glass-hover { transition: border-color .3s ease, background .3s ease, transform .3s ease, box-shadow .3s ease; }
        .glass-hover:hover {
          border-color: rgba(255,255,255,.32);
          transform: perspective(900px) rotateX(1.6deg) translateY(-4px);
        }
        @media (prefers-reduced-motion: reduce) { .glass-hover:hover { transform: none; } }
        .era-card { display: grid; grid-template-columns: 1fr; }
        .era-img { position: relative; overflow: hidden; aspect-ratio: 16 / 9; }
        @media (min-width: 700px) {
          .era-card { grid-template-columns: 2fr 3fr; }
          .era-card--flip { grid-template-columns: 3fr 2fr; }
          .era-card--flip .era-img { order: 2; }
          .era-img { aspect-ratio: auto; min-height: 260px; height: 100%; }
        }
      ` }} />

      {/* ============================== HEADER ============================== */}
      <ExperienceNav />

      {/* ============================== HERO ============================== */}
      <section className="px-4 sm:px-8 pt-6 pb-10 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-7xl tracking-wide leading-[0.95]" style={bebas}>
            PROJETOS <span style={{ color: GOLD }}>FAYAI</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
            Cada projeto abaixo é fruto de uma vida inteira dedicada à tecnologia — do 386 à
            inteligência artificial, sem pular nenhum capítulo.
          </p>
          <div className="glass rounded-3xl overflow-hidden mt-8">
            <img
              src="/landing/projetos-hero.webp"
              alt="A jornada da tecnologia: do computador antigo à inteligência artificial"
              className="w-full object-cover"
              style={{ aspectRatio: "21 / 9" }}
            />
          </div>
        </div>
      </section>

      {/* ============================== PROJETOS ============================== */}
      <section className="px-4 sm:px-8 pb-14">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-5">
            {FAY_PROJECTS.map((p) => {
              const inner = (
                <>
                  <span className="block relative overflow-hidden" style={{ aspectRatio: "3 / 2" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span
                      className="absolute top-3 right-3 z-[3] text-[10px] font-extrabold tracking-widest rounded-full px-2.5 py-1"
                      style={{ background: STATUS_COLOR[p.status], color: "#0c0e1d" }}
                    >
                      {STATUS_LABEL[p.status]}
                    </span>
                  </span>
                  <span className="block p-5">
                    <span className="block text-2xl tracking-wide" style={{ ...bebas, color: p.accent }}>
                      {p.name}
                    </span>
                    <span className="block mt-0.5 text-sm font-bold text-white/85">{p.tagline}</span>
                    <span className="block mt-2 text-sm text-white/60 leading-relaxed">{p.description}</span>
                    <span className="flex flex-wrap gap-1.5 mt-3">
                      {p.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 border"
                          style={{ borderColor: `${p.accent}55`, color: p.accent }}
                        >
                          {t}
                        </span>
                      ))}
                    </span>
                    <span className="inline-flex items-center gap-1 mt-3 text-sm font-bold" style={{ color: GOLD }}>
                      Conhecer o projeto <ArrowUpRight size={15} />
                    </span>
                  </span>
                </>
              );
              const cls = "glass glass-hover group rounded-3xl overflow-hidden block";
              const styleBorder = { borderColor: `${p.accent}44` };
              return (
                <Link key={p.id} href={`/projetos/${p.id}`} className={cls} style={styleBorder}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================== SERVIÇOS ============================== */}
      <section className="px-4 sm:px-8 pb-14">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Wrench size={22} style={{ color: GOLD }} />
            <h2 className="text-3xl sm:text-4xl tracking-wide" style={bebas}>
              O QUE EU FAÇO <span style={{ color: GOLD }}>PARA VOCÊ</span>
            </h2>
          </div>
          <p className="text-sm sm:text-base text-white/60 max-w-2xl mb-6">
            Tudo que existe nesses projetos — sites, automação, IA, vídeo — também está disponível
            como serviço para a sua empresa, feito por quem constrói isso todos os dias.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {SERVICES.map((s) => (
              <Link key={s.href} href={s.href} className="glass glass-hover group rounded-2xl p-4 block">
                <span className="flex items-center justify-between">
                  <span className="text-sm font-bold">{s.label}</span>
                  <ArrowUpRight size={14} className="text-white/30 group-hover:text-white/70 transition-colors" />
                </span>
                <span className="block mt-1 text-xs text-white/55 leading-relaxed">{s.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== SOBRE ============================== */}
      <section className="px-4 sm:px-8 pb-14">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={22} style={{ color: GOLD }} />
            <h2 className="text-3xl sm:text-4xl tracking-wide" style={bebas}>
              UMA VIDA EM <span style={{ color: GOLD }}>TECNOLOGIA</span>
            </h2>
          </div>
          <p className="text-sm sm:text-base text-white/60 max-w-2xl mb-8">
            Ricardo Faya, carioca de 1976. Antes de a IA existir como a conhecemos, ele já estava
            lá — em cada virada da tecnologia, aprendendo a ferramenta nova no dia em que ela
            chegava. Esta é a história por trás do FayAI.
          </p>
          <div className="space-y-6">
            {TIMELINE.map((t, i) => (
              <div
                key={t.era}
                className={`glass rounded-3xl overflow-hidden era-card ${i % 2 === 1 ? "era-card--flip" : ""}`}
                style={{ borderColor: `${t.accent}44` }}
              >
                <div className="era-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image} alt={t.era} className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="p-5 sm:p-7 flex flex-col justify-center">
                  <span className="text-[11px] font-extrabold tracking-widest" style={{ color: t.accent }}>
                    {t.era}
                  </span>
                  <h3 className="mt-1 text-2xl sm:text-3xl tracking-wide" style={bebas}>
                    {t.title}
                  </h3>
                  <p className="mt-2 text-sm sm:text-base text-white/65 leading-relaxed">{t.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* credenciais */}
          <div className="glass rounded-3xl p-6 sm:p-8 mt-6 text-center">
            <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-3xl mx-auto">
              <span className="font-bold text-white">Credenciais ao longo do caminho:</span>{" "}
              Ciência da Computação (UNIVAP) · Técnico Cinematográfico registrado · Copa do Mundo e
              Olimpíadas pela Fox · Editor-chefe na FGV · Transição SD→HD do Jockey Club · TV alemã
              ZDF e ARD · Harvard ManageMentor · Certificações Google Cloud em IA Generativa, LLMs e
              Prompt Design · Palestrante no RioWebSummit com o Ultimate Social Suite.
            </p>
            <Link
              href="/agendar-consultoria"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 font-extrabold hover:opacity-90 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #ffd97a)`, color: "#241a05", boxShadow: "0 10px 30px rgba(245,192,78,.35)" }}
            >
              Trabalhe comigo <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-4 sm:px-8 pb-6 text-center text-[11px] text-white/35">
        © {new Date().getFullYear()} FayAI — aprenda IA fazendo, não assistindo.
      </footer>
    </div>
  );
}
