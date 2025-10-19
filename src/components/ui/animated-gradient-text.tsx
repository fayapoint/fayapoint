"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnimatedGradientTextProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedGradientText({
  children,
  className,
}: AnimatedGradientTextProps) {
  return (
    <div
      className={cn(
        "group relative mx-auto flex max-w-fit flex-row items-center justify-center rounded-2xl bg-white/5 px-4 py-1.5 text-sm font-medium backdrop-blur-sm transition-shadow duration-500 ease-out hover:bg-white/10",
        className
      )}
    >
      <span className="inline animate-gradient-x bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:200%_auto] bg-clip-text text-transparent">
        {children}
      </span>
    </div>
  );
}
