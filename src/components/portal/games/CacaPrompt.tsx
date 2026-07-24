"use client";

/**
 * CAÇA AO PROMPT — verbo: MONTAR (construir com as mãos).
 *
 * Reescrito em 24/07/2026. A descrição no Arcade sempre prometeu "escolha e
 * ARRASTE peças para reconstruir a receita" — mas o código era uma fileira de
 * <button onClick={toggle}>: nada arrastava. Agora arrasta de verdade.
 *
 * Mecânica: a imagem-alvo fica à esquerda; os slots (Assunto / Estilo / Luz)
 * esperam peças; as peças — misturadas com intrusos — ficam embaixo. Você
 * arrasta cada peça até o slot certo. Cronômetro não pune: ele vira BÔNUS de
 * velocidade, porque aqui o acerto exige leitura cuidadosa, e punir tempo
 * empurraria para o chute.
 *
 * Acessibilidade: arrastar é o gesto principal, mas tudo funciona no clique
 * (toca a peça para pegar, toca o slot para encaixar) — teclado e leitor de
 * tela inclusos, e é o caminho usado quando prefers-reduced-motion está ligado.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Hand, Play, RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import { PROMPT_HUNTS } from "@/data/games/caca-prompt";
import { useRotatingDeck } from "@/lib/game-rotation";
import { FxConfetti, VocabularyChip } from "@/components/portal/games/GameLearning";
import { PersonaFisher } from "@/components/portal/games/PersonaFisher";
import { HAPTIC, haptic, useHighScore, useReducedMotion } from "@/lib/arcade/engine";

const HUNT_SCENES = [
  "/portal/arcade/caca/mapa.webp",
  "/portal/arcade/caca/lupa.webp",
  "/portal/arcade/caca/bussola.webp",
];

const ROUNDS = 5;
const POINTS_PER_SLOT = 60;
const PERFECT_BONUS = 120;
const SPEED_BONUS_WINDOW = 25; // segundos para ganhar bônus de rapidez

type Phase = "idle" | "playing" | "checked" | "over";

export function CacaPrompt() {
  const { deck, rotate } = useRotatingDeck(PROMPT_HUNTS, ROUNDS, "fayai_seen_caca_prompt");
  const reduced = useReducedMotion();

  const [phase, setPhase] = useState<Phase>("idle");
  const [index, setIndex] = useState(0);
  const [placements, setPlacements] = useState<(string | null)[]>([]);
  const [held, setHeld] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [perfects, setPerfects] = useState(0);
  const [roundStart, setRoundStart] = useState(0);
  const [lastGain, setLastGain] = useState(0);

  const [high, submitHigh] = useHighScore("caca_prompt");
  const [isRecord, setIsRecord] = useState(false);

  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const round = deck[index];

  useEffect(() => {
    if (phase === "over") setIsRecord(submitHigh(score));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Embaralha as peças uma vez por rodada (intrusos misturados aos corretos).
  const shuffled = useMemo(() => {
    if (!round) return [];
    return [...round.pieces].sort(() => Math.random() - 0.5);
    // troca só quando a rodada muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.id]);

  const startRound = useCallback(
    (roundIndex: number) => {
      const target = deck[roundIndex];
      if (!target) return;
      setPlacements(new Array(target.slots.length).fill(null));
      setHeld(null);
      setRoundStart(Date.now());
      setPhase("playing");
    },
    [deck]
  );

  const begin = useCallback(() => {
    rotate();
    setIndex(0);
    setScore(0);
    setPerfects(0);
    setIsRecord(false);
    setLastGain(0);
    startRound(0);
  }, [rotate, startRound]);

  /** Coloca uma peça num slot (vindo do arrasto ou do clique). */
  const place = useCallback(
    (pieceId: string, slotIndex: number) => {
      if (phase !== "playing") return;
      setPlacements((current) => {
        const next = [...current];
        // se a peça já estava em outro slot, tira de lá (não duplica)
        const previous = next.indexOf(pieceId);
        if (previous !== -1) next[previous] = null;
        next[slotIndex] = pieceId;
        return next;
      });
      setHeld(null);
      haptic(HAPTIC.hit);
    },
    [phase]
  );

  const clearSlot = useCallback(
    (slotIndex: number) => {
      if (phase !== "playing") return;
      setPlacements((current) => {
        const next = [...current];
        next[slotIndex] = null;
        return next;
      });
    },
    [phase]
  );

  /** Descobre em qual slot o ponteiro soltou a peça. */
  const slotAtPoint = useCallback((x: number, y: number) => {
    for (let i = 0; i < slotRefs.current.length; i += 1) {
      const node = slotRefs.current[i];
      if (!node) continue;
      const box = node.getBoundingClientRect();
      if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) return i;
    }
    return null;
  }, []);

  const check = useCallback(() => {
    if (!round || phase !== "playing") return;
    const rightCount = placements.reduce<number>(
      (total, pieceId, slot) => (pieceId && pieceId === round.answer[slot] ? total + 1 : total),
      0
    );
    const perfect = rightCount === round.answer.length;
    const elapsed = (Date.now() - roundStart) / 1000;
    const speedBonus = perfect && elapsed < SPEED_BONUS_WINDOW ? 60 : 0;
    const gain = rightCount * POINTS_PER_SLOT + (perfect ? PERFECT_BONUS : 0) + speedBonus;

    setScore((current) => current + gain);
    setLastGain(gain);
    if (perfect) setPerfects((p) => p + 1);
    setPhase("checked");
    haptic(perfect ? HAPTIC.win : HAPTIC.miss);
  }, [round, phase, placements, roundStart]);

  const next = useCallback(() => {
    if (index + 1 >= deck.length) {
      setPhase("over");
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    startRound(nextIndex);
  }, [index, deck.length, startRound]);

  /* ------------------------------- telas ------------------------------- */

  if (phase === "idle") {
    return (
      <div className="py-8 text-center">
        <motion.div
          initial={reduced ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto max-w-sm"
        >
          <img
            src={HUNT_SCENES[0]}
            alt=""
            aria-hidden
            className="mx-auto mb-3 h-28 w-44 rounded-2xl border border-lime-400/25 object-cover"
          />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-400/12 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-lime-300">
            <Hand size={12} /> {ROUNDS} caçadas
          </span>
          <h3 className="mt-3 text-2xl font-black">Monte a receita</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Olhe a imagem e <strong className="text-lime-300">arraste</strong> cada ingrediente para
            o slot certo. Cuidado: tem intruso no meio. Encaixe tudo certo e rápido para o bônus.
          </p>
          {high > 0 && <p className="mt-3 text-xs font-bold text-amber-300">Seu recorde: {high}</p>}
          <button
            onClick={begin}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-lime-400 to-lime-200 px-7 py-3 text-base font-black text-[#0c2a12] transition-transform hover:scale-[1.04]"
          >
            <Play size={16} strokeWidth={3} /> Começar caçada
          </button>
        </motion.div>
      </div>
    );
  }

  if (phase === "over") {
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative py-8 text-center"
      >
        <FxConfetti active={perfects >= 3} />
        <img
          src="/portal/arcade/caca/tesouro.webp"
          alt=""
          aria-hidden
          className="relative mx-auto mb-3 h-32 w-48 rounded-2xl border border-amber-400/25 object-cover"
        />
        {isRecord && (
          <p className="relative mb-1 text-sm font-black uppercase tracking-widest text-lime-300">
            ★ Novo recorde ★
          </p>
        )}
        <p className="relative text-6xl font-black text-amber-400">{score}</p>
        <p className="relative mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {perfects} de {deck.length} receitas montadas sem erro
          {high > 0 && !isRecord && ` · recorde: ${high}`}
        </p>
        <button
          onClick={begin}
          className="relative mt-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-6 py-2.5 text-sm font-black text-[#241a05] transition-transform hover:scale-[1.04]"
        >
          <RefreshCw size={14} /> Novas caçadas
        </button>
        <div className="relative mx-auto mt-3 max-w-md text-left">
          <PersonaFisher source="caca-prompt" />
        </div>
      </motion.div>
    );
  }

  if (!round) return null;
  const checked = phase === "checked";
  const placedIds = placements.filter(Boolean) as string[];
  const tray = shuffled.filter((piece) => !placedIds.includes(piece.id));
  const allFilled = placements.every(Boolean);

  return (
    <div>
      {/* Faixa da caçada */}
      <div className="relative mb-3 h-16 overflow-hidden rounded-2xl border border-lime-400/20">
        <img
          src={HUNT_SCENES[index % HUNT_SCENES.length]}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e1d]/90 via-[#0c0e1d]/55 to-[#0c0e1d]/25" />
        <div className="absolute inset-0 flex items-center justify-between px-4 text-[11px] font-bold uppercase tracking-widest text-white/90">
          <span>
            Caçada {index + 1} de {deck.length}
          </span>
          <span className="text-amber-400">{score} pts</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Alvo */}
        <div>
          <div className="relative aspect-[3/2] overflow-hidden rounded-2xl border border-lime-400/30">
            <img
              src={round.image}
              alt="Resultado cujo prompt será reconstruído"
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{round.mission}</p>
        </div>

        {/* Slots + bandeja */}
        <div>
          <div className="space-y-2">
            {round.slots.map((slotLabel, slotIndex) => {
              const pieceId = placements[slotIndex];
              const piece = shuffled.find((p) => p.id === pieceId);
              const right = checked && pieceId === round.answer[slotIndex];
              const wrong = checked && pieceId !== round.answer[slotIndex];

              return (
                <div
                  key={slotLabel}
                  ref={(node) => {
                    slotRefs.current[slotIndex] = node;
                  }}
                  onClick={() => {
                    if (held) place(held, slotIndex);
                    else if (pieceId) clearSlot(slotIndex);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Slot ${slotLabel}${piece ? `, preenchido com ${piece.text}` : ", vazio"}`}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    if (held) place(held, slotIndex);
                    else if (pieceId) clearSlot(slotIndex);
                  }}
                  className="flex min-h-[54px] cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-3 py-2 transition-colors"
                  style={{
                    borderColor: checked
                      ? right
                        ? "#a3e635"
                        : "#f47276"
                      : held
                        ? "rgba(245,192,78,.6)"
                        : piece
                          ? "rgba(255,255,255,.2)"
                          : "rgba(255,255,255,.13)",
                    background: checked
                      ? right
                        ? "rgba(163,230,53,.07)"
                        : "rgba(244,114,118,.07)"
                      : piece
                        ? "rgba(22,26,54,.55)"
                        : "rgba(255,255,255,.02)",
                    borderStyle: piece ? "solid" : "dashed",
                  }}
                >
                  <span className="w-16 shrink-0 text-[10px] font-black uppercase tracking-wider text-amber-300">
                    {slotLabel}
                  </span>
                  {piece ? (
                    <motion.span
                      layout={!reduced}
                      initial={reduced ? false : { scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-[13px] font-semibold leading-snug"
                    >
                      {piece.text}
                    </motion.span>
                  ) : (
                    <span className="text-[12px] italic text-white/30">
                      {held ? "toque para encaixar aqui" : "arraste um ingrediente"}
                    </span>
                  )}
                  {checked && wrong && (
                    <span className="ml-auto shrink-0 text-[10px] font-black uppercase text-rose-300">
                      era: {shuffled.find((p) => p.id === round.answer[slotIndex])?.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bandeja de peças */}
          {!checked && (
            <div className="mt-3 flex flex-wrap gap-2">
              <AnimatePresence>
                {tray.map((piece) => (
                  <motion.button
                    key={piece.id}
                    layout={!reduced}
                    initial={reduced ? false : { scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={reduced ? undefined : { scale: 0.8, opacity: 0 }}
                    drag={reduced ? false : true}
                    dragSnapToOrigin
                    dragElastic={0.2}
                    whileDrag={{ scale: 1.08, zIndex: 50, cursor: "grabbing" }}
                    onDragEnd={(_, info) => {
                      const slot = slotAtPoint(info.point.x, info.point.y);
                      if (slot !== null) place(piece.id, slot);
                    }}
                    onClick={() => setHeld((current) => (current === piece.id ? null : piece.id))}
                    className="relative cursor-grab touch-none rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors active:cursor-grabbing"
                    style={{
                      borderColor: held === piece.id ? "#f5c04e" : "rgba(255,255,255,.16)",
                      background:
                        held === piece.id ? "rgba(245,192,78,.16)" : "rgba(22,26,54,.6)",
                      color: held === piece.id ? "#f5c04e" : "rgba(255,255,255,.85)",
                    }}
                  >
                    {piece.text}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Ações */}
          {!checked ? (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={check}
                disabled={!allFilled}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-lime-400 to-lime-200 px-5 py-2 text-sm font-black text-[#0c2a12] transition-transform hover:scale-[1.04] disabled:opacity-40 disabled:hover:scale-100"
              >
                <Sparkles size={14} /> Conferir receita
              </button>
              {placedIds.length > 0 && (
                <button
                  onClick={() => setPlacements(new Array(round.slots.length).fill(null))}
                  className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-white/60 hover:text-white"
                >
                  <RotateCcw size={12} /> Limpar
                </button>
              )}
            </div>
          ) : (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <p className="text-sm font-black text-amber-400">+{lastGain} pontos</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {round.explanation}
              </p>
              <div className="mt-1.5">
                <VocabularyChip term={round.term} />
              </div>
              <button
                onClick={next}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-5 py-2 text-sm font-black text-[#241a05]"
              >
                {index + 1 >= deck.length ? "Ver resultado" : "Próxima caçada"}{" "}
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
