/**
 * A porta ESM para `invalidar-cache.cjs` — o porquê, a autenticação e o
 * comportamento em caso de falha estão lá. Leia lá.
 *
 * Só reexporta: a fonte tem que ser CommonJS porque metade dos scripts é `.cjs`
 * e `require()` não carrega ESM.
 *
 *     import { invalidarCache } from "../lib/invalidar-cache.mjs";
 */
import cjs from "./invalidar-cache.cjs";

export const invalidarCache = cjs.invalidarCache;
