"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

/**
 * Navegação das páginas-experiência (/projetos, /noticias) — elas vivem fora
 * do chrome corporativo do site de propósito (direção de arte própria), mas
 * antes disso eram becos sem saída: só logo→home e "Entrar" (13/07/2026).
 * Auth-aware: logado vê o botão dourado do portal em vez de "Entrar".
 */
const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;
const GOLD = "#f5c04e";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/cursos", label: "Cursos" },
  { href: "/projetos", label: "Projetos" },
  { href: "/noticias", label: "Blog IA Hoje" },
];

export interface ExperienceCrumb {
  href: string;
  label: string;
  current: string;
}

export function ExperienceNav({ crumb }: { crumb?: ExperienceCrumb }) {
  const { user, isLoggedIn, mounted } = useUser();

  return (
    <div className="w-full">
      <header className="flex items-center justify-between gap-4 px-4 sm:px-8 pt-4 pb-2 max-w-6xl mx-auto">
        <Link href="/" className="text-3xl sm:text-4xl tracking-wide select-none shrink-0" style={bebas}>
          FAY<span style={{ color: GOLD }}>AI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-white/60 hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {mounted && isLoggedIn && user ? (
          <Link
            href="/portal"
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-extrabold text-[#1a1405] hover:opacity-90 transition-opacity shrink-0"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #ffdf8e)`, boxShadow: "0 4px 18px rgba(245,192,78,.35)" }}
          >
            <span className="hidden sm:inline">Oi, {(user.name || "aluno").split(" ")[0]}!</span>
            <span>Meu Portal</span>
            <ArrowRight size={15} />
          </Link>
        ) : (
          <Link href="/login" className="text-sm font-semibold text-white/60 hover:text-white transition-colors shrink-0">
            Entrar
          </Link>
        )}
      </header>

      {/* links no mobile: linha rolável abaixo do logo */}
      <nav className="md:hidden flex items-center gap-5 px-4 pb-2 max-w-6xl mx-auto overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-[13px] font-semibold text-white/55 hover:text-white transition-colors whitespace-nowrap"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {crumb && (
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 px-4 sm:px-8 pt-1 max-w-6xl mx-auto text-[13px]">
          <Link href={crumb.href} className="font-semibold text-white/50 hover:text-white transition-colors">
            {crumb.label}
          </Link>
          <ChevronRight size={13} className="text-white/30 shrink-0" />
          <span className="font-semibold text-white/80 truncate">{crumb.current}</span>
        </nav>
      )}
    </div>
  );
}
