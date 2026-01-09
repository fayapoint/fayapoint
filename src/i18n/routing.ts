import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt-BR", "en"],
  // Changed to "en" as default for international traffic
  // Geo-IP detection in middleware will route Portuguese speakers to pt-BR
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
