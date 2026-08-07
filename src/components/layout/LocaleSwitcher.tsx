"use client";
import { useT } from "@/i18n/dicionario";

import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IDIOMAS, useTrocarIdioma } from "@/lib/trocar-idioma";

/**
 * O seletor do cabeçalho do site. A mecânica mora em `useTrocarIdioma` porque a
 * home e o portal têm cabeçalho próprio e precisam da mesma decisão com outro
 * visual (ver `BotaoIdioma`).
 */
export function LocaleSwitcher() {
  const T = useT();
  const { locale, trocar, pendente } = useTrocarIdioma();

  const atual = IDIOMAS.find((item) => item.code === locale) ?? {
    code: locale,
    label: locale,
    short: locale.toUpperCase(),
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={pendente}
          aria-label={atual.code === "en" ? T("Change language") : T("Trocar idioma")}
          className="flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground"
        >
          <Globe className="h-4 w-4" />
          <span className="font-semibold tracking-wide">{T(atual.short)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {IDIOMAS.map((item) => (
          <DropdownMenuItem
            key={item.code}
            onClick={() => trocar(item.code)}
            className="flex items-center justify-between gap-2"
          >
            {/* O nome do idioma NÃO se traduz: cada um aparece na própria
                língua. Quem procura o português procura "Português", não
                "Portuguese" — endônimo é a regra de qualquer seletor de idioma. */}
            <span>{T(item.label)}</span>
            {item.code === locale && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
