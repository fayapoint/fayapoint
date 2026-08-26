"use client";
import { useT } from "@/i18n/dicionario";

import { IDIOMAS, useTrocarIdioma } from "@/lib/trocar-idioma";

/**
 * O seletor para cabeçalhos de fundo escuro e próprio — a home e o portal.
 *
 * São dois idiomas, então isto é um interruptor `PT | EN` e não um menu: o
 * destino cabe na tela, e um clique resolve. O `LocaleSwitcher` (dropdown)
 * continua no cabeçalho do site, onde ele já está e onde combina.
 *
 * O idioma que NÃO está ativo fica clicável e legível; o ativo fica marcado com
 * `aria-current` para quem usa leitor de tela.
 */
export function BotaoIdioma({ className = "" }: { className?: string }) {
  const T = useT();
  const { locale, trocar, pendente } = useTrocarIdioma();
  const ehIngles = locale === "en";

  return (
    <div
      className={`flex items-center rounded-full border border-white/15 bg-white/5 p-0.5 text-[11px] font-bold tracking-wide backdrop-blur-sm ${className}`}
      role="group"
      aria-label={ehIngles ? T("Language") : T("Idioma")}
    >
      {IDIOMAS.map((item) => {
        const ativo = item.code === locale;
        return (
          <button
            key={item.code}
            type="button"
            disabled={pendente}
            onClick={() => trocar(item.code)}
            aria-current={ativo ? "true" : undefined}
            aria-label={T(item.label)}
            /* ⚠️ `min-h-11` = 44 px, o mínimo de alvo de toque do iOS. Os dois
               botões mediam 34×25 no celular (item 18 do laudo, 26/08/2026).
               A altura é invisível: `inline-flex items-center` mantém o rótulo
               do mesmo tamanho e só amplia o que o dedo acerta. */
            className={
              "inline-flex min-h-11 items-center justify-center sm:min-h-0 " +
              (ativo
                ? "rounded-full bg-white/90 px-2.5 py-1 text-[#12142a]"
                : "rounded-full px-2.5 py-1 text-white/55 transition-colors hover:text-white disabled:opacity-50")
            }
          >
            {T(item.short)}
          </button>
        );
      })}
    </div>
  );
}
