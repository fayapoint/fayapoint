"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, Shield, Search, Check } from "lucide-react";
import { comIdioma } from "@/lib/rota-idioma";
import { useReducedMotion } from "@/lib/arcade/engine";
import { getGameCopy } from "@/lib/game/copy";
import { VideoAmbiente } from "@/components/game/VideoAmbiente";
import { LIMA, VIOLETA, bebas, FUNDO, TEXTO } from "@/lib/game/tema";

/**
 * VITRINE DO /game (Winners 22 Championship) na home — 23/08/2026.
 *
 * Por que existe: exatamente o defeito que o `ArcadeShowcase` corrigiu para o
 * Arcade, repetido. A seção /game nasceu completa (busca ao vivo contra a API
 * pública da EA, central do clube, fila da liga) e a única porta de entrada era
 * digitar a URL — não havia link na home nem no menu. Ricardo, 23/08: "não vejo
 * nada na página principal nem no menu, não adianta ter e não chegar."
 *
 * Fica logo depois do Arcade por vizinhança temática: as duas seções são o
 * convite de menor compromisso do site — jogar e conectar o clube não pedem
 * cadastro nem cartão.
 *
 * O texto vem de `lib/game/copy.ts`, não do dicionário global de 7.7k chaves —
 * mesma decisão da rota (chave que falta no dicionário some calada, e a home é
 * o pior lugar possível para uma frase em português aparecer na versão inglesa).
 */
export function GameShowcase() {
  const locale = useLocale();
  const rota = (h: string) => comIdioma(h, locale);
  const reduced = useReducedMotion();
  const copy = getGameCopy(locale);
  const s = copy.showcase;

  return (
    <section className="relative shrink-0 px-4 pb-3 sm:px-8">
      <div
        aria-hidden
        className="fx-orb"
        style={{
          width: 320,
          height: 320,
          left: "12%",
          top: -60,
          background: `radial-gradient(circle, ${LIMA}42, transparent 65%)`,
          animation: "fx-drift-a 14s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="fx-orb"
        style={{
          width: 260,
          height: 260,
          right: "8%",
          top: 30,
          background: `radial-gradient(circle, ${VIOLETA}4d, transparent 65%)`,
          animation: "fx-drift-b 16s ease-in-out infinite",
        }}
      />

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.4 }}
        className="relative mx-auto max-w-5xl"
      >
        <Link
          href={rota("/game")}
          className="group block overflow-hidden rounded-3xl border transition-transform hover:-translate-y-1"
          style={{
            borderColor: `${LIMA}3a`,
            background: "rgba(22,26,54,.5)",
            boxShadow: `0 16px 44px -20px ${LIMA}88`,
          }}
        >
          {/* As linhas do campo, discretas: dão a leitura de "futebol" sem
              precisar de foto de gramado nem de arte gerada. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              background:
                "repeating-linear-gradient(90deg, transparent 0 62px, rgba(255,255,255,.9) 62px 63px)",
            }}
          />

          <div className="relative flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:gap-8">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest"
                  style={{ background: `${LIMA}1f`, color: LIMA, border: `1px solid ${LIMA}55` }}
                >
                  <Trophy size={11} /> {s.badge}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">
                  EA SPORTS FC™ Clubs
                </span>
              </div>

              <h3 className="mt-2.5 text-2xl leading-none sm:text-4xl" style={bebas}>
                {s.title.toUpperCase()}{" "}
                <span style={{ color: LIMA }}>{s.highlight.toUpperCase()}</span>
              </h3>

              <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-white/60">
                {s.body}
              </p>

              <span
                className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-transform group-hover:translate-x-0.5"
                style={{ background: LIMA, color: FUNDO }}
              >
                <Search size={14} />
                {s.cta}
                <ArrowRight size={14} />
              </span>
            </div>

            {/* O painel da direita DIZ o que a central entrega, em palavras.
                A primeira versão era uma maquete de barras cinzas — e, ao lado
                do ArcadeShowcase logo acima (que tem arte contextual real), ela
                não lia como produto: lia como wireframe esquecido. Texto real
                custa zero GPU e é honesto: não simula estatística que ainda não
                existe para este visitante (§8, nada de dado inventado). */}
            <div className="w-full shrink-0 lg:w-80">
              <div
                className="overflow-hidden rounded-2xl border"
                style={{ borderColor: `${LIMA}26`, background: "rgba(12,14,29,.6)" }}
              >
                {/* O meio-campo desenhado. Os vizinhos deste bloco na home (o
                    Arcade acima, o Radar abaixo) têm arte e mapa; sem nenhuma
                    peça gráfica, esta seção lia como caixa de texto no meio de
                    seções ilustradas. É geometria — não custa GPU, não inventa
                    estatística, e diz "futebol" antes de qualquer palavra. */}
                <div className="relative overflow-hidden">
                  {/* A foto por trás do letreiro. Era aqui que a vitrine
                      perdia para o ArcadeShowcase logo acima, que tem arte
                      contextual: três rodadas de crítica apontaram o mesmo
                      buraco. O campo desenhado continua por cima da foto —
                      ele é o que dá a leitura de "campeonato" em 200ms. */}
                  <VideoAmbiente
                    nome="video-vitrine"
                    className="absolute inset-0 h-full w-full object-cover opacity-55 transition-transform duration-700 group-hover:scale-105"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(160deg, ${LIMA}1f, rgba(12,14,29,.72) 65%)` }}
                  />
                  <svg
                    viewBox="0 0 320 132"
                    className="block w-full"
                    aria-hidden
                    fill="none"
                    stroke={LIMA}
                    strokeOpacity="0.4"
                    strokeWidth="1"
                  >
                    <rect x="8" y="8" width="304" height="116" rx="4" />
                    <line x1="160" y1="8" x2="160" y2="124" />
                    <circle cx="160" cy="66" r="30" />
                    <circle cx="160" cy="66" r="2.5" fill={LIMA} fillOpacity="0.55" stroke="none" />
                    <rect x="8" y="30" width="46" height="72" rx="2" />
                    <rect x="266" y="30" width="46" height="72" rx="2" />
                    <rect x="8" y="50" width="18" height="32" rx="2" />
                    <rect x="294" y="50" width="18" height="32" rx="2" />
                  </svg>
                  <span className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className="text-[2.6rem] leading-none"
                      style={{
                        ...bebas,
                        color: TEXTO,
                        textShadow: `0 0 26px ${LIMA}77`,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {copy.brandShort}
                    </span>
                    <span
                      className="mt-0.5 text-[0.72rem]"
                      style={{ ...bebas, color: `${LIMA}e6`, letterSpacing: "0.36em", textIndent: "0.36em" }}
                    >
                      {copy.brandLine2}
                    </span>
                  </span>
                </div>

                <div className="border-t p-4" style={{ borderColor: `${LIMA}1f` }}>
                <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-white/45">
                  <Shield size={12} style={{ color: LIMA }} />
                  {s.deliversTitle}
                </p>

                <ul className="mt-3 space-y-2">
                  {s.delivers.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[12.5px] leading-snug text-white/70">
                      <Check size={13} className="mt-0.5 shrink-0" style={{ color: LIMA }} />
                      {item}
                    </li>
                  ))}
                </ul>

                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.08] pt-3">
                  {s.stats.map((st) => (
                    <div key={st.label} className="text-center">
                      <dt className="sr-only">{st.label}</dt>
                      <dd>
                        <span
                          className="block text-xl leading-none"
                          style={{ ...bebas, color: LIMA }}
                        >
                          {st.value}
                        </span>
                        <span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-white/45">
                          {st.label}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </section>
  );
}
