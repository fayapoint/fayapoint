"use client";
import { useT } from "@/i18n/dicionario";

/**
 * VITRINE DO ARCADE na home (24/07/2026).
 *
 * Por que existe: o Arcade é o ativo mais incomum do site — 5 jogos completos,
 * jogáveis sem cadastro, que ensinam de verdade. Até hoje ele aparecia na home
 * como um link de 11px no rodapé, espremido entre "Ferramentas" e "Projetos".
 * Um visitante que chega de busca nunca descobria que dava para JOGAR ali.
 *
 * A vitrine resolve isso e, principalmente, anuncia o VERBO de cada jogo —
 * deslizar, deduzir, apostar, montar. É o verbo que diferencia um jogo do
 * outro; sem ele todos pareciam "mais um quiz" e a escolha era aleatória.
 *
 * Cada card faz deep-link para o jogo (`/arcade?jogo=id`), então o visitante
 * cai direto na partida em vez de numa segunda tela de escolha.
 */

import Link from "next/link";
import { comIdioma } from "@/lib/rota-idioma";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight, Gamepad2 } from "lucide-react";
import { ArcadeVisual } from "@/components/portal/ArcadeVisual";
import { useReducedMotion } from "@/lib/arcade/engine";

const GOLD = "#f5c04e";

/**
 * Só o que NÃO é texto mora aqui: o id (que vira deep-link e chave da arte) e a
 * cor. Título, verbo e gancho vêm de `ArcadeShowcase.games.<id>` nas mensagens
 * — a ordem dos cards é a ordem deste array.
 */
const GAMES: { id: string; cor: string }[] = [
  { id: "verdade-ou-mito", cor: "#38bdf8" },
  { id: "qual-prompt", cor: "#a78bfa" },
  { id: "batalha-prompts", cor: "#fb923c" },
  { id: "caca-prompt", cor: "#a3e635" },
  { id: "monte-o-prompt", cor: "#f472b6" },
];

export function ArcadeShowcase() {
  const T = useT();
  const locale = useLocale();
  const t = useTranslations("ArcadeShowcase");
  // Link interno sem `/pt-BR` custa um 308 por clique e some da contagem de
  // link interno das ferramentas de auditoria. Ver [[reference_seo_armadilhas_locale]].
  const rota = (h: string) => comIdioma(h, locale);
  const reduced = useReducedMotion();

  return (
    <section className="relative px-4 sm:px-8 pb-3 shrink-0">
      <div
        aria-hidden
        className="fx-orb"
        style={{
          width: 300,
          height: 300,
          left: "10%",
          top: -50,
          background: "radial-gradient(circle, rgba(245,192,78,.32), transparent 65%)",
          animation: "fx-drift-a 13s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="fx-orb"
        style={{
          width: 260,
          height: 260,
          right: "8%",
          top: 20,
          background: "radial-gradient(circle, rgba(56,189,248,.28), transparent 65%)",
          animation: "fx-drift-b 15s ease-in-out infinite",
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        <div className="flex items-baseline gap-3 mb-1 flex-wrap">
          <h3
            className="text-xl sm:text-2xl tracking-wide"
            style={{ fontFamily: "var(--font-bebas), sans-serif" }}
          >
            {t.rich("title", { destaque: (c) => <span style={{ color: GOLD }}>{c}</span> })}
          </h3>
          <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-lime-300/80">
            <Gamepad2 size={13} /> {t("badge")}
          </span>
        </div>
        <p className="text-sm text-white/55 mb-3 max-w-xl">{t("body")}</p>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {GAMES.map((game, i) => {
            const titulo = t(`games.${game.id}.titulo`);
            return (
            <motion.div
              key={game.id}
              initial={reduced ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: reduced ? 0 : i * 0.05 }}
              className={i === 4 ? "col-span-2 lg:col-span-1" : undefined}
            >
              <Link
                href={rota(`/arcade?jogo=${game.id}`)}
                className="group block h-full overflow-hidden rounded-2xl border transition-all hover:-translate-y-1"
                style={{
                  borderColor: `${game.cor}44`,
                  background: "rgba(22,26,54,.45)",
                  boxShadow: `0 8px 26px -12px ${game.cor}66`,
                }}
              >
                <div className="relative">
                  <ArcadeVisual
                    gameId={game.id as never}
                    alt={t("artAlt", { titulo })}
                    className="aspect-[16/10]"
                    imageClassName="transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* O verbo é o herói do card */}
                  <span
                    className="absolute bottom-0 left-0 right-0 px-2.5 py-1 text-lg font-black leading-none tracking-tight"
                    style={{
                      color: game.cor,
                      background: "linear-gradient(transparent, rgba(12,14,29,.94))",
                      fontFamily: "var(--font-bebas), sans-serif",
                      letterSpacing: ".04em",
                    }}
                  >
                    {t(`games.${game.id}.verbo`).toUpperCase()}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-[13px] font-bold leading-tight">{T(titulo)}</p>
                  <p className="mt-1 text-[11px] leading-snug text-white/45">
                    {t(`games.${game.id}.gancho`)}
                  </p>
                </div>
              </Link>
            </motion.div>
            );
          })}
        </div>

        <Link
          href={rota("/arcade")}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white/55 transition-colors hover:text-white"
        >
          {t("seeAll")} <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}
