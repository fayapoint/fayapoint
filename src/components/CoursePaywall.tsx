"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Lock,
  BookOpen,
  Award,
  Zap,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CoursePaywallProps {
  courseName: string;
  coursePrice: number | null;
  courseSlug: string;
  plan: string | null;
  locale?: string;
  /** Blurred preview text from the locked chapter */
  previewText?: string;
}

const benefits = [
  { icon: BookOpen, text: "Acesso a todos os capitulos" },
  { icon: Award, text: "Certificado de conclusao" },
  { icon: Zap, text: "Exercicios praticos" },
  { icon: Sparkles, text: "Atualizacoes gratuitas" },
];

export function CoursePaywall({
  courseName,
  coursePrice,
  courseSlug,
  plan,
  locale = "pt-BR",
  previewText,
}: CoursePaywallProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animated entrance: fade-in from bottom
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const priceLabel =
    coursePrice != null && coursePrice > 0
      ? `R$${coursePrice.toFixed(2).replace(".", ",")}`
      : null;

  return (
    <div
      className={cn(
        "relative rounded-3xl overflow-hidden transition-all duration-700 ease-out",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-[#12131c] to-purple-900/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-transparent" />

      {/* Accent border glow */}
      <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-violet-500/30 via-purple-500/10 to-transparent pointer-events-none" />

      <div className="relative p-8 sm:p-10">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Lock size={12} />
            Conteudo Premium
          </span>
        </div>

        {/* Blurred preview */}
        {previewText && (
          <div className="relative mb-8 overflow-hidden rounded-2xl">
            <div className="p-6 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
              <p className="text-white/20 text-sm leading-relaxed line-clamp-3 blur-[2px] select-none">
                {previewText}
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#12131c]/60 to-[#12131c]/95" />
          </div>
        )}

        {/* Heading */}
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
          Continue aprendendo
        </h3>
        <p className="text-white/40 text-sm mb-8 max-w-md">
          Desbloqueie todos os capitulos de{" "}
          <span className="text-white/60 font-medium">{courseName}</span> e
          acelere seu aprendizado.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Link href={`/${locale}/portal/planos`} className="flex-1">
            <Button className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-semibold shadow-lg shadow-violet-600/25 text-sm transition-all duration-300 hover:shadow-violet-500/30 hover:scale-[1.01]">
              Assine por R$19,90/mes
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </Link>
          {priceLabel && (
            <Link
              href={`/${locale}/curso/${courseSlug}`}
              className="flex-1"
            >
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-white/80 font-semibold text-sm transition-all duration-300"
              >
                Compre este curso por {priceLabel}
              </Button>
            </Link>
          )}
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
            >
              <b.icon size={15} className="text-violet-400/70 flex-shrink-0" />
              <span className="text-xs text-white/50">{b.text}</span>
            </div>
          ))}
        </div>

        {/* Guarantee badge */}
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10">
          <ShieldCheck size={16} className="text-emerald-400/70" />
          <span className="text-xs font-medium text-emerald-400/70">
            Garantia de 7 dias — devolucao sem perguntas
          </span>
        </div>

        {/* Login link */}
        {!plan && (
          <p className="text-center mt-6 text-xs text-white/25">
            Ja tem uma conta?{" "}
            <Link
              href={`/${locale}/login`}
              className="text-violet-400/70 hover:text-violet-400 underline underline-offset-2 transition-colors"
            >
              Faca login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
