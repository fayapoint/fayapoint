"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { STATUS_LABEL, type FayProject } from "@/data/landing/projects";
import type { ProjectDetail } from "@/data/landing/project-details";

const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;
const GOLD = "#f5c04e";

const STATUS_COLOR: Record<FayProject["status"], string> = {
  "no-ar": "#a3e635",
  "beta": "#38bdf8",
  "construindo": "#f5c04e",
  "pesquisa": "#a78bfa",
};

export function ProjectDetailPage({ project, detail }: { project: FayProject; detail: ProjectDetail }) {
  const base = `/landing/photos/${project.id}`;
  const gallery = detail.captions.map((caption, i) => ({ src: `${base}-g${i + 1}.webp`, caption }));

  return (
    <div className="min-h-dvh overflow-x-hidden text-[#f3f1ff]" style={{ background: "#0c0e1d" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes kenburns { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }
        .kb { animation: kenburns 18s ease-out both; transform-origin: 60% 40%; }
        .glass {
          position: relative;
          background: linear-gradient(160deg, rgba(255,255,255,.06), rgba(255,255,255,0) 38%), rgba(22, 26, 54, 0.5);
          backdrop-filter: blur(18px) saturate(1.7);
          -webkit-backdrop-filter: blur(18px) saturate(1.7);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.2), 0 12px 40px -14px rgba(0,0,0,.55);
        }
        .ph { position: relative; overflow: hidden; border-radius: 1.25rem; }
        .ph img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0;
                  transition: transform .6s cubic-bezier(.2,.6,.2,1); }
        .ph:hover img { transform: scale(1.06); }
        .ph .cap {
          position: absolute; inset: auto 0 0 0; z-index: 2; padding: 2.2rem .9rem .7rem;
          background: linear-gradient(180deg, transparent, rgba(6,8,20,.88));
          font-size: .78rem; font-weight: 600; color: rgba(255,255,255,.92);
          opacity: 0; transform: translateY(8px); transition: opacity .35s ease, transform .35s ease;
        }
        .ph:hover .cap { opacity: 1; transform: translateY(0); }
        @media (hover: none) { .ph .cap { opacity: 1; transform: none; } }
        .gal { display: grid; gap: .8rem; grid-template-columns: 1fr; }
        @media (min-width: 640px) {
          .gal { grid-template-columns: repeat(3, 1fr); }
          .gal .ph:nth-child(1) { grid-column: span 2; grid-row: span 2; }
        }
        .gal .ph { aspect-ratio: 3 / 2; }
        @media (prefers-reduced-motion: reduce) { .kb, .ph img { animation: none; transition: none; } }
      ` }} />

      {/* ============================== HERO ============================== */}
      <section className="relative" style={{ height: "min(72vh, 640px)" }}>
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${base}-hero.webp`} alt={project.name} className="kb w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(12,14,29,.55) 0%, rgba(12,14,29,.15) 40%, rgba(12,14,29,.92) 88%, #0c0e1d 100%)",
            }}
          />
        </div>
        <div className="relative z-10 h-full max-w-5xl mx-auto px-4 sm:px-8 flex flex-col">
          <header className="flex items-center justify-between pt-4">
            <Link href="/" className="text-3xl tracking-wide select-none" style={bebas}>
              FAY<span style={{ color: GOLD }}>AI</span>
            </Link>
            <Link
              href="/projetos"
              className="flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft size={15} /> Projetos
            </Link>
          </header>
          <div className="mt-auto pb-10">
            <span
              className="inline-block text-[10px] font-extrabold tracking-widest rounded-full px-3 py-1"
              style={{ background: STATUS_COLOR[project.status], color: "#0c0e1d" }}
            >
              {STATUS_LABEL[project.status]}
            </span>
            <h1 className="mt-3 text-5xl sm:text-7xl md:text-8xl leading-[0.9] tracking-wide" style={bebas}>
              {project.name.toUpperCase()}
            </h1>
            <p className="mt-3 text-base sm:text-xl text-white/85 max-w-2xl font-medium">{detail.lead}</p>
          </div>
        </div>
      </section>

      {/* ============================== HISTÓRIA ============================== */}
      <section className="px-4 sm:px-8 py-12">
        <div className="max-w-3xl mx-auto space-y-5">
          {detail.story.map((p, i) => (
            <p key={i} className={`leading-relaxed ${i === 0 ? "text-lg sm:text-xl text-white/85" : "text-base text-white/65"}`}>
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* ============================== FEATURES ============================== */}
      <section className="px-4 sm:px-8 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {detail.features.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-4" style={{ borderColor: `${project.accent}44` }}>
                <span className="flex items-center gap-2">
                  <span
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{ background: `${project.accent}22`, color: project.accent, width: 26, height: 26 }}
                  >
                    <Check size={14} />
                  </span>
                  <span className="text-sm font-bold">{f.title}</span>
                </span>
                <p className="mt-1.5 text-xs text-white/55 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== GALERIA ============================== */}
      <section className="px-4 sm:px-8 pb-14">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl tracking-wide mb-5" style={bebas}>
            EM <span style={{ color: project.accent }}>IMAGENS</span>
          </h2>
          <div className="gal">
            {gallery.map((g) => (
              <figure key={g.src} className="ph">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.src} alt={g.caption} loading="lazy" />
                <figcaption className="cap">{g.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== CTA ============================== */}
      <section className="px-4 sm:px-8 pb-16">
        <div className="max-w-3xl mx-auto glass rounded-3xl p-7 sm:p-10 text-center" style={{ borderColor: `${project.accent}44` }}>
          <h2 className="text-3xl sm:text-4xl tracking-wide" style={bebas}>
            {project.appUrl ? "ENTRE NO PROJETO" : "QUER ACOMPANHAR DE PERTO?"}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-white/65">
            {project.appUrl
              ? "Use agora — e aprenda a dominar a ferramenta com o curso que combina com ela."
              : "Crie sua conta grátis e seja avisado de cada novidade deste projeto — antes de todo mundo."}
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            {project.appUrl ? (
              <a
                href={project.appUrl}
                target={project.appUrl.startsWith("http") ? "_blank" : undefined}
                rel={project.appUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 font-extrabold hover:opacity-90 transition-opacity"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #ffd97a)`, color: "#241a05", boxShadow: "0 10px 30px rgba(245,192,78,.35)" }}
              >
                Usar agora <ArrowRight size={18} />
              </a>
            ) : (
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 font-extrabold hover:opacity-90 transition-opacity"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #ffd97a)`, color: "#241a05", boxShadow: "0 10px 30px rgba(245,192,78,.35)" }}
              >
                Quero ser avisado <ArrowRight size={18} />
              </Link>
            )}
            {project.learnHref && (
              <Link
                href={project.learnHref}
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 font-bold transition-colors"
                style={{ border: `2px solid ${project.accent}66`, color: project.accent }}
              >
                {project.learnLabel ?? "Aprender a usar"} <ArrowUpRight size={16} />
              </Link>
            )}
            <Link
              href="/projetos"
              className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-white/15 px-6 py-3.5 font-semibold text-white/70 hover:text-white hover:border-white/35 transition-colors"
            >
              Outros projetos <ArrowUpRight size={16} />
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
