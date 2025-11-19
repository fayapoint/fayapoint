"use client";

import { useTransition } from "react";
import { Check, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const locales = [
  { code: "pt-BR", label: "Português (BR)", short: "PT" },
  { code: "en", label: "English", short: "EN" },
];

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const current = locales.find((item) => item.code === locale) ?? {
    code: locale,
    label: locale,
    short: locale.toUpperCase(),
  };

  const buildLocalizedPath = (currentPath: string, nextLocale: string) => {
    const cleaned = currentPath.split("?")[0];
    const segments = cleaned.split("/").filter(Boolean);
    if (segments.length > 0 && locales.some((item) => item.code === segments[0])) {
      segments[0] = nextLocale;
    } else {
      segments.unshift(nextLocale);
    }
    const nextPath = `/${segments.join("/")}`;
    const query = currentPath.includes("?") ? currentPath.slice(currentPath.indexOf("?")) : "";
    return `${nextPath}${query}`;
  };

  const handleSelect = (nextLocale: string) => {
    if (nextLocale === locale) return;

    startTransition(() => {
      try {
        document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${ONE_YEAR_SECONDS}`;
        window.localStorage.setItem("preferredLocale", nextLocale);
      } catch {
        // noop - storage not available (SSR or private mode)
      }

      const targetPath = buildLocalizedPath(pathname ?? "/", nextLocale);
      router.replace(targetPath);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          className="flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground"
        >
          <Globe className="h-4 w-4" />
          <span className="font-semibold tracking-wide">{current.short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {locales.map((item) => (
          <DropdownMenuItem
            key={item.code}
            onClick={() => handleSelect(item.code)}
            className="flex items-center justify-between gap-2"
          >
            <span>{item.label}</span>
            {item.code === locale && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
