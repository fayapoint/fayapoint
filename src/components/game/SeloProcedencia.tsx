"use client";

import { Radio, Archive } from "lucide-react";
import type { GameCopy } from "@/lib/game/copy";
import { LIMA, CIANO } from "@/lib/game/tema";

/**
 * SELO DE PROCEDÊNCIA — de onde veio o número que está na tela.
 *
 * Existe porque, desde 25/08/2026, **a mesma tela pode ser servida por duas
 * fontes diferentes**: a API da EA ao vivo (no desenvolvimento, onde ela
 * responde) ou o nosso acervo no Mongo (em produção, onde a EA devolve 403 para
 * IP de datacenter). O usuário não tem como adivinhar qual das duas está vendo,
 * e a diferença importa: uma é do segundo, a outra tem a idade da última coleta.
 *
 * A §4 dos portões do PLANO_GAME é explícita: todo dado público carrega
 * procedência. Um número de acervo sem a data é afirmação sem fonte.
 */
export type FonteDado = "ea" | "espelho" | "vazio";

/** "agora há pouco", "há 2 h", "há 3 d" — a idade em uma expressão só. */
function idade(capturedAt: string | null, copy: GameCopy): string {
  if (!capturedAt) return copy.fonte.justNow;
  const ms = Date.now() - new Date(capturedAt).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 2) return copy.fonte.justNow;
  if (min < 60) return copy.fonte.minutes.replace("{n}", String(min));
  const h = Math.floor(min / 60);
  if (h < 24) return copy.fonte.hours.replace("{n}", String(h));
  return copy.fonte.days.replace("{n}", String(Math.floor(h / 24)));
}

export function SeloProcedencia({
  fonte,
  capturedAt,
  copy,
  className = "",
}: {
  fonte: FonteDado;
  capturedAt: string | null;
  copy: GameCopy;
  className?: string;
}) {
  if (fonte === "vazio") return null;

  const viva = fonte === "ea";
  const cor = viva ? LIMA : CIANO;
  const Icone = viva ? Radio : Archive;
  const texto = viva
    ? copy.fonte.live
    : copy.fonte.mirror.replace("{quando}", idade(capturedAt, copy));

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest ${className}`}
      style={{ borderColor: `${cor}55`, color: cor, background: `${cor}12` }}
      // O "porquê" vive no title: a linha precisa caber ao lado de um título,
      // mas quem se perguntar de onde vem o número tem a resposta a um hover.
      title={viva ? undefined : copy.fonte.mirrorWhy}
    >
      <Icone size={11} />
      {texto}
    </span>
  );
}
