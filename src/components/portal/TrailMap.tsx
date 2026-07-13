"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TrailMap — "Seu caminho para dominar IA" (F3 do PLANO_UX_NAVEGACAO).
 * Substituiu os 4 cards de texto estáticos que expulsavam o aluno do shell
 * (13/07/2026). Estados 100% derivados de progresso REAL (gamificação honesta):
 * nada de contadores falsos — cada nó fica "feito" quando a estatística
 * correspondente do aluno comprova a ação.
 */

interface TrailStats {
  xp: number;
  imagesGenerated: number;
  aiChats: number;
  streak: number;
  longestStreak: number;
}

export interface TrailMapProps {
  stats: TrailStats;
  achievementsCount: number;
  userCourses: { progressPercent: number }[];
  onTabChange: (tab: string) => void;
}

interface TrailNode {
  id: string;
  titulo: string;
  desc: string;
  cor: string;
  tab?: string;
  href?: string;
  done: boolean;
}

export function TrailMap({ stats, achievementsCount, userCourses, onTabChange }: TrailMapProps) {
  const reduce = useReducedMotion();

  const anyCourse = userCourses.length > 0;
  const halfCourse = userCourses.some((c) => c.progressPercent >= 50);
  const fullCourse = userCourses.some((c) => c.progressPercent >= 100);

  const nodes: TrailNode[] = [
    { id: "magica", titulo: "Sinta a mágica", desc: "Jogue o minigame da página inicial", cor: "#38bdf8", href: "/", done: stats.xp >= 50 },
    { id: "primeiro-curso", titulo: "Comece um curso", desc: "Escolha o seu primeiro", cor: "#f5c04e", tab: "courses", done: anyCourse },
    { id: "meio-caminho", titulo: "Chegue à metade", desc: "Avance 50% em um curso", cor: "#a78bfa", tab: "courses", done: halfCourse },
    { id: "primeira-imagem", titulo: "Crie uma imagem", desc: "Sua primeira arte no Studio", cor: "#f472b6", tab: "studio", done: stats.imagesGenerated >= 1 },
    { id: "primeira-conquista", titulo: "Primeira conquista", desc: "Desbloqueie um troféu", cor: "#f5c04e", tab: "achievements", done: achievementsCount >= 1 },
    { id: "sequencia-3-dias", titulo: "3 dias seguidos", desc: "Crie o hábito de aprender", cor: "#fb923c", tab: "challenges", done: Math.max(stats.streak, stats.longestStreak) >= 3 },
    { id: "curso-completo", titulo: "Termine um curso", desc: "Conclua 100% das aulas", cor: "#a3e635", tab: "courses", done: fullCourse },
    { id: "certificado", titulo: "Seu certificado", desc: "Verificável, seu para sempre", cor: "#f5c04e", tab: "certificates", done: fullCourse },
  ];

  const currentIdx = nodes.findIndex((n) => !n.done);
  const doneCount = nodes.filter((n) => n.done).length;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-base font-bold">Seu caminho para dominar IA</h3>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#f5c04e" }}>
          {doneCount} de {nodes.length} passos
        </span>
      </div>

      <div className="flex items-start overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {nodes.map((n, i) => {
          const isCurrent = i === currentIdx;
          const isFuture = currentIdx !== -1 && i > currentIdx;

          const pulse = isCurrent && !reduce;
          const art = (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={pulse ? { opacity: 1, scale: [1, 1.06, 1] } : { opacity: 1, scale: 1 }}
              transition={
                pulse
                  ? { opacity: { delay: i * 0.06, duration: 0.35 }, scale: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }
                  : { delay: i * 0.06, duration: 0.35 }
              }
              className="relative block w-[76px] h-[76px] rounded-full overflow-hidden shrink-0"
              style={{
                border: `2.5px solid ${n.done ? "#f5c04e" : isCurrent ? n.cor : "rgba(255,255,255,.16)"}`,
                boxShadow: n.done
                  ? "0 0 18px -4px rgba(245,192,78,.55)"
                  : isCurrent
                    ? `0 0 22px -4px ${n.cor}aa`
                    : "none",
                filter: isFuture ? "saturate(.35) brightness(.75)" : undefined,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/portal/trail/${n.id}.webp`} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              {n.done && (
                <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#f5c04e" }}>
                  <Check size={14} strokeWidth={3.5} className="text-[#241a05]" />
                </span>
              )}
            </motion.span>
          );

          const label = (
            <span className="block mt-2 w-[108px] text-center">
              <span className={cn("block text-[12px] font-bold leading-tight", isFuture ? "text-muted-foreground" : "text-foreground")}>
                {n.titulo}
              </span>
              <span className="block mt-0.5 text-[10px] text-muted-foreground leading-snug">{n.desc}</span>
              {isCurrent && (
                <span
                  className="inline-block mt-1 text-[9px] font-extrabold uppercase tracking-widest rounded-full px-2 py-0.5"
                  style={{ background: `${n.cor}22`, color: n.cor }}
                >
                  você está aqui
                </span>
              )}
            </span>
          );

          const inner = (
            <span className="flex flex-col items-center group-hover:-translate-y-0.5 transition-transform">
              {art}
              {label}
            </span>
          );

          return (
            <span key={n.id} className="flex items-start shrink-0">
              {i > 0 && (
                <span
                  aria-hidden
                  className="block h-[2.5px] w-6 sm:w-9 mt-[38px] rounded-full shrink-0"
                  style={{
                    background: nodes[i - 1].done
                      ? "linear-gradient(90deg, #f5c04e, #ffd97a)"
                      : "rgba(255,255,255,.12)",
                  }}
                />
              )}
              {n.href ? (
                <Link href={n.href} className="group block">
                  {inner}
                </Link>
              ) : (
                <button type="button" onClick={() => n.tab && onTabChange(n.tab)} className="group block cursor-pointer">
                  {inner}
                </button>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
