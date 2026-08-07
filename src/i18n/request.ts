import {getRequestConfig} from "next-intl/server";
import {hasLocale} from "next-intl";

import {routing} from "./routing";
import {CHAVE_DICIONARIO} from "./dicionario";

export default getRequestConfig(async ({requestLocale}) => {
  const locale = await requestLocale;
  const resolvedLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const messages = (await import(`../../messages/${resolvedLocale}.json`)).default;

  /**
   * O dicionário de interface (ver `dicionario.ts`) entra nas mensagens SÓ em
   * inglês. Em português ele seria a função identidade — 100 KB de JSON para
   * devolver o que entrou. Quem lê o site em português não baixa nada disso.
   */
  const dicionario =
    resolvedLocale === "en"
      ? (await import("../../messages/dicionario.en.json")).default
      : {};

  return {
    locale: resolvedLocale,
    messages: {...messages, [CHAVE_DICIONARIO]: dicionario},
  };
});
