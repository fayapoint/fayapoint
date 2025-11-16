"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const THEME_CLASSES = [
  "theme-default",
  "theme-light",
  "theme-dark",
  "theme-aurora",
  "theme-sunset",
  "theme-emerald",
];
const THEME_STORAGE_KEY = "theme-preference";
const DEFAULT_THEME = "dark";

function applyTheme(next: string) {
  const root = document.documentElement;
  // Remove all theme classes
  THEME_CLASSES.forEach((cls) => root.classList.remove(cls));
  // Ensure dark toggler for Tailwind variant support
  const isDarkLike = ["dark", "aurora", "sunset", "emerald"].includes(next);
  if (isDarkLike) {
    root.classList.add(`theme-${next}`, "dark");
  } else {
    root.classList.remove("dark");
    root.classList.add(`theme-${next}`);
  }
}

export function ThemeSwitcher() {
  const options = useMemo(
    () => [
      { value: "default", label: "Padrão" },
      { value: "light", label: "Claro" },
      { value: "dark", label: "Escuro" },
      { value: "aurora", label: "Aurora" },
      { value: "sunset", label: "Pôr do Sol" },
      { value: "emerald", label: "Esmeralda" },
    ],
    []
  );

  const [value, setValue] = useState<string>(DEFAULT_THEME);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(THEME_STORAGE_KEY) : null;
    const isValidStoredTheme = stored && THEME_CLASSES.some((cls) => stored === cls.replace("theme-", ""));
    const initial = isValidStoredTheme ? stored : DEFAULT_THEME;
    setValue(initial);
    if (typeof window !== "undefined") {
      applyTheme(initial);
      if (!isValidStoredTheme) {
        localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME);
      }
    }
  }, []);

  const onChange = (v: string) => {
    setValue(v);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, v);
      applyTheme(v);
    }
  };

  return (
    <div className="min-w-[140px]">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-gray-800/50 border-gray-700 text-foreground">
          <SelectValue placeholder="Tema" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
