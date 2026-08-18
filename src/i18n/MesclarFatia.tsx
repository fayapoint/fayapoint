"use client";

import { NextIntlClientProvider, useLocale, useMessages } from "next-intl";
import { useMemo } from "react";

import { CHAVE_DICIONARIO } from "./dicionario";

/**
 * Encaixa a fatia de dicionário DESTA rota no provedor que já existe — sem
 * reenviar as mensagens de base.
 *
 * ## Por que a mescla acontece no cliente, e não no servidor
 *
 * O `NextIntlClientProvider` aninhado **substitui** as mensagens do pai; ele não
 * mescla. Está no `IntlProvider` do `use-intl`:
 *
 *     messages: messages === undefined ? prevContext?.messages : messages
 *
 * Ou seja: para dar à rota o seu dicionário por um provedor aninhado do jeito
 * óbvio, seria preciso repassar TAMBÉM `messages/en.json` inteiro — 158 KB que
 * já viajaram no provedor raiz. A rota pesada ficaria pagando duas vezes a
 * mesma coisa.
 *
 * Aqui a fatia é a única coisa que atravessa a rede: `useMessages()` lê o que o
 * provedor raiz já pôs no contexto, a mescla se faz no navegador (e na
 * renderização de servidor, onde o contexto também existe), e só depois o
 * provedor aninhado recebe o objeto pronto.
 *
 * ## Quem monta isso
 *
 * Ninguém chama este componente direto — o ponto de uso é `ProvedorDeRota`
 * (`src/i18n/rota.tsx`), que é Server Component e decide pelo idioma ANTES de
 * serializar a fatia. Ver lá o porquê.
 */
export default function MesclarFatia({
  fatia,
  children,
}: {
  fatia: Record<string, string>;
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const messages = useMessages() as Record<string, unknown>;

  const mescladas = useMemo(
    () => ({ ...messages, [CHAVE_DICIONARIO]: fatia }),
    [messages, fatia],
  );

  return (
    <NextIntlClientProvider locale={locale} messages={mescladas}>
      {children}
    </NextIntlClientProvider>
  );
}
