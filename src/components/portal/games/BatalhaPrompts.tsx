"use client";
import { useT } from "@/i18n/dicionario";

/**
 * BATALHA DE PROMPTS — verbo: APOSTAR (arriscar com convicção).
 *
 * Reescrito em 24/07/2026. Antes: "clique no prompt melhor" → certo/errado →
 * próxima → 5/5. A escolha não custava nada, então errar não doía e acertar
 * não valia nada.
 *
 * Agora você tem uma BANCA. A cada duelo decide quanto arriscar (25%, 50% ou
 * tudo) e então aponta o vencedor. Acertou, dobra o que apostou; errou, perde.
 * Zerar encerra a partida. Isso troca a pergunta "qual é o melhor prompt?" por
 * "o quanto eu confio na minha leitura?" — que é a que de fato ensina a avaliar.
 *
 * Efeito pedagógico colateral: quem aposta tudo e erra lembra da explicação
 * muito melhor do que quem clicou por clicar.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Coins, Play, RefreshCw, Swords, TrendingDown, TrendingUp } from "lucide-react";
import { PROMPT_BATTLES } from "@/data/games/batalha-prompts";
import { useRotatingDeck } from "@/lib/game-rotation";
import { FxConfetti, VocabularyChip } from "@/components/portal/games/GameLearning";
import { PersonaFisher } from "@/components/portal/games/PersonaFisher";
import { HAPTIC, haptic, useHighScore, useReducedMotion } from "@/lib/arcade/engine";

// Cenários da arena — arte da casa (IDENTIDADE_VISUAL.md §12)
const BATTLE_SCENES = [
  "/portal/arcade/batalha/arena.webp",
  "/portal/arcade/batalha/duelo-oeste.webp",
  "/portal/arcade/batalha/esgrima.webp",
];

const START_BANK = 500;
const ROUNDS = 6;
const STAKES = [
  { label: "25%", fraction: 0.25 },
  { label: "50%", fraction: 0.5 },
  { label: "Tudo", fraction: 1 },
] as const;

type Phase = "idle" | "betting" | "revealed" | "over";

export function BatalhaPrompts() {
  const T = useT();
  const { deck, rotate } = useRotatingDeck(PROMPT_BATTLES, ROUNDS, "fayai_seen_batalha_prompts");
  const reduced = useReducedMotion();

  const [phase, setPhase] = useState<Phase>("idle");
  const [index, setIndex] = useState(0);
  const [bank, setBank] = useState(START_BANK);
  const [stake, setStake] = useState<number>(0.25);
  const [choice, setChoice] = useState<"A" | "B" | null>(null);
  const [delta, setDelta] = useState(0);
  const [peak, setPeak] = useState(START_BANK);

  const [high, submitHigh] = useHighScore("batalha_prompts");
  const [isRecord, setIsRecord] = useState(false);

  const round = deck[index];
  const wager = Math.max(1, Math.round(bank * stake));
  const scene = useMemo(() => BATTLE_SCENES[index % BATTLE_SCENES.length], [index]);

  useEffect(() => {
    if (phase === "over") setIsRecord(submitHigh(bank));
    // roda só na virada de fase — submitHigh muda de identidade a cada recorde
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const begin = useCallback(() => {
    rotate();
    setIndex(0);
    setBank(START_BANK);
    setPeak(START_BANK);
    setStake(0.25);
    setChoice(null);
    setDelta(0);
    setIsRecord(false);
    setPhase("betting");
  }, [rotate]);

  const commit = useCallback(
    (side: "A" | "B") => {
      if (phase !== "betting" || !round) return;
      const right = side === round.winner;
      const change = right ? wager : -wager;

      setChoice(side);
      setDelta(change);
      setBank((current) => {
        const next = Math.max(0, current + change);
        setPeak((p) => Math.max(p, next));
        return next;
      });
      setPhase("revealed");
      haptic(right ? HAPTIC.hit : HAPTIC.miss);
    },
    [phase, round, wager]
  );

  const next = useCallback(() => {
    if (bank <= 0 || index + 1 >= deck.length) {
      setPhase("over");
      return;
    }
    setIndex((i) => i + 1);
    setChoice(null);
    setDelta(0);
    setStake((current) => (bank < START_BANK * 0.3 ? 0.25 : current));
    setPhase("betting");
  }, [bank, index, deck.length]);

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
            src={BATTLE_SCENES[0]}
            alt=""
            aria-hidden
            className="mx-auto mb-3 h-28 w-44 rounded-2xl border border-amber-400/25 object-cover"
          />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/12 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
            <Swords size={12} /> {ROUNDS}  {T("duelos")}
          </span>
          <h3 className="mt-3 text-2xl font-black">{T("Aposte na sua leitura")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            
            {T("Você começa com")} <strong className="text-amber-300">{START_BANK}  {T("fichas")}</strong>{T(". Em cada\r\n            duelo, decida")} <strong>{T("quanto arriscar")}</strong>  {T("e aponte o prompt vencedor. Acertou, dobra\r\n            a aposta. Errou, perde. Zerou, acabou.")}
          </p>
          {high > 0 && (
            <p className="mt-3 text-xs font-bold text-amber-300">{T("Sua melhor banca:")} {high}  {T("fichas")}</p>
          )}
          <button
            onClick={begin}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-7 py-3 text-base font-black text-[#241a05] transition-transform hover:scale-[1.04]"
          >
            <Play size={16} strokeWidth={3} />  {T("Abrir a mesa")}
          </button>
        </motion.div>
      </div>
    );
  }

  if (phase === "over") {
    const broke = bank <= 0;
    const profit = bank - START_BANK;
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative py-8 text-center"
      >
        <FxConfetti active={!broke && profit > 0} />
        <img
          src={broke ? "/portal/arcade/batalha/empate.webp" : "/portal/arcade/batalha/vitoria.webp"}
          alt=""
          aria-hidden
          className="relative mx-auto mb-3 h-32 w-48 rounded-2xl border border-amber-400/25 object-cover"
        />
        {isRecord && !broke && (
          <p className="relative mb-1 text-sm font-black uppercase tracking-widest text-lime-300">
            
            {T("★ Melhor banca ★")}
          </p>
        )}
        <p className="relative text-6xl font-black" style={{ color: broke ? "#f47276" : "#f5c04e" }}>
          {bank}
        </p>
        <p className="relative mt-1 mx-auto max-w-sm text-sm text-muted-foreground">
          {broke
            ? T("Você quebrou — mas cada aposta perdida mostrou um critério novo.")
            : profit > 0
              ? `Saiu no lucro: ${profit} fichas acima da entrada.`
              : T("Sobreviveu à mesa. O olho para prompt afia com o tempo.")}
          {high > 0 && ` · recorde: ${high}`}
        </p>
        <button
          onClick={begin}
          className="relative mt-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-6 py-2.5 text-sm font-black text-[#241a05] transition-transform hover:scale-[1.04]"
        >
          <RefreshCw size={14} />  {T("Nova mesa")}
        </button>
        <div className="relative mx-auto mt-3 max-w-md text-left">
          <PersonaFisher source="batalha-prompts" />
        </div>
      </motion.div>
    );
  }

  if (!round) return null;
  const revealed = phase === "revealed";
  const won = revealed && choice === round.winner;

  return (
    <div>
      {/* Banca */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Coins size={15} className="text-amber-400" />
          <motion.span
            key={bank}
            initial={reduced ? false : { scale: 1.25 }}
            animate={{ scale: 1 }}
            className="text-xl font-black tabular-nums text-amber-400"
          >
            {bank}
          </motion.span>
          <AnimatePresence>
            {delta !== 0 && (
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-0.5 text-sm font-black"
                style={{ color: delta > 0 ? "#a3e635" : "#f47276" }}
              >
                {delta > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {delta > 0 ? `+${delta}` : delta}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          
          {T("Duelo")} {index + 1}/{deck.length}
        </span>
      </div>

      <div
        className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(rgba(12,14,29,.82), rgba(12,14,29,.92)), url(${scene})` }}
      >
        <p className="px-3 py-2.5 text-center text-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            
            {T("Tarefa")}
          </span>
          <br />
          <span className="font-bold">{T(round.task)}</span>
        </p>
      </div>

      {/* Fichas de aposta */}
      {!revealed && (
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            
            {T("Arriscar")}
          </span>
          {STAKES.map((option) => {
            const active = stake === option.fraction;
            return (
              <button
                key={option.label}
                onClick={() => setStake(option.fraction)}
                className="rounded-full border px-3 py-1 text-xs font-extrabold transition-all"
                style={{
                  borderColor: active ? "#f5c04e" : "rgba(255,255,255,.14)",
                  background: active ? "rgba(245,192,78,.16)" : "transparent",
                  color: active ? "#f5c04e" : "rgba(255,255,255,.6)",
                }}
              >
                {T(option.label)}
              </button>
            );
          })}
          <span className="text-xs font-black text-amber-300">= {wager}  {T("fichas")}</span>
        </div>
      )}

      {/* Os dois prompts */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {(["A", "B"] as const).map((letter) => {
          const text = letter === "A" ? round.promptA : round.promptB;
          const isWinner = round.winner === letter;
          const picked = choice === letter;

          return (
            <motion.button
              key={letter}
              onClick={() => commit(letter)}
              disabled={revealed}
              whileHover={revealed || reduced ? undefined : { y: -3 }}
              whileTap={revealed || reduced ? undefined : { scale: 0.98 }}
              animate={
                revealed && picked && !reduced
                  ? won
                    ? { scale: [1, 1.03, 1] }
                    : { x: [0, -7, 6, -3, 0] }
                  : {}
              }
              className="relative rounded-2xl border-2 p-4 pt-5 text-left transition-colors disabled:cursor-default"
              style={{
                borderColor: revealed
                  ? isWinner
                    ? "#a3e635"
                    : picked
                      ? "#f47276"
                      : "rgba(255,255,255,.08)"
                  : "rgba(255,255,255,.14)",
                background: revealed
                  ? isWinner
                    ? "rgba(163,230,53,.08)"
                    : picked
                      ? "rgba(244,114,118,.08)"
                      : "rgba(22,26,54,.3)"
                  : "rgba(22,26,54,.42)",
                opacity: revealed && !isWinner && !picked ? 0.5 : 1,
              }}
            >
              <span
                className="absolute -top-2.5 left-3 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                style={{
                  background: revealed && isWinner ? "#a3e635" : "#f5c04e",
                  color: "#241a05",
                }}
              >
                {T(letter)}
              </span>
              <p className="text-[13px] leading-relaxed">{T(text)}</p>
              {revealed && isWinner && (
                <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-lime-400">
                  
                  {T("vencedor ·")} {T(round.criterion)}
                </p>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Veredito */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl border p-3 text-center"
            style={{
              borderColor: won ? "rgba(163,230,53,.3)" : "rgba(244,114,118,.3)",
              background: won ? "rgba(163,230,53,.06)" : "rgba(244,114,118,.06)",
            }}
          >
            <p
              className="text-sm font-black uppercase tracking-widest"
              style={{ color: won ? "#a3e635" : "#f47276" }}
            >
              {won ? `Ganhou ${wager} fichas` : `Perdeu ${wager} fichas`}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{T(round.why)}</p>
            <div className="mt-1.5">
              <VocabularyChip term={round.term} />
            </div>
            <button
              onClick={next}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-5 py-2 text-sm font-black text-[#241a05]"
            >
              {bank <= 0
                ? T("Ver resultado")
                : index + 1 >= deck.length
                  ? T("Encerrar mesa")
                  : T("Próximo duelo")}{" "}
              <ArrowRight size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        {revealed
          ? `Pico da banca: ${peak} fichas`
          : T("Escolha o quanto arriscar e aponte o vencedor")}
      </p>
    </div>
  );
}
