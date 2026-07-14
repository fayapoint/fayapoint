"use client";

import { useCallback, useEffect, useState } from "react";

type Identifiable = { id: string };

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const random = typeof crypto !== "undefined" && "getRandomValues" in crypto
      ? crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
      : Math.random();
    const j = Math.floor(random * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function selectDeck<T extends Identifiable>(
  items: readonly T[],
  count: number,
  storageKey: string,
): T[] {
  if (typeof window === "undefined") return items.slice(0, count);

  let seen = new Set<string>();
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(stored)) seen = new Set(stored.filter((id): id is string => typeof id === "string"));
  } catch {
    localStorage.removeItem(storageKey);
  }

  const unseen = shuffle(items.filter((item) => !seen.has(item.id)));
  const selected = unseen.slice(0, count);

  if (selected.length < count) {
    const alreadySelected = new Set(selected.map((item) => item.id));
    const recycled = shuffle(items.filter((item) => !alreadySelected.has(item.id)));
    selected.push(...recycled.slice(0, count - selected.length));
    seen = new Set(selected.map((item) => item.id));
  } else {
    selected.forEach((item) => seen.add(item.id));
  }

  localStorage.setItem(storageKey, JSON.stringify([...seen]));
  return selected;
}

export function useRotatingDeck<T extends Identifiable>(
  items: readonly T[],
  count: number,
  storageKey: string,
) {
  const [deck, setDeck] = useState<T[]>(() => items.slice(0, count));

  const rotate = useCallback(() => {
    setDeck(selectDeck(items, Math.min(count, items.length), storageKey));
  }, [items, count, storageKey]);

  useEffect(() => {
    rotate();
  }, [rotate]);

  return { deck, rotate };
}

