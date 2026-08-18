/**
 * Invalida o cache do site pelo terminal.
 *
 *     node scripts/invalidar-cache.mjs                 # catálogo inteiro
 *     node scripts/invalidar-cache.mjs chatgpt-zero    # um curso
 *
 * Use depois de qualquer escrita manual no Mongo — inclusive as feitas pelo
 * Compass ou por um script antigo que ainda não chama `invalidarCache`. A
 * mecânica e o porquê estão em `scripts/lib/invalidar-cache.mjs`.
 */
import { invalidarCache } from "./lib/invalidar-cache.mjs";

const slug = process.argv[2];
const ok = await invalidarCache(slug);
process.exit(ok ? 0 : 1);
