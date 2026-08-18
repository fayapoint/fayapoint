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

/**
 * `process.exitCode`, e não `process.exit()`.
 *
 * Com `process.exit()` logo depois do `fetch`, o Node no Windows aborta:
 *
 *     Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), src\winsync.c:76
 *
 * e sai com 127 — o que faria um script que chamasse este parecer ter falhado
 * quando a invalidação deu certo. Derrubar o processo enquanto o libuv ainda
 * está fechando o socket do `undici` é pedir isso. Marcando o código e deixando
 * o laço de eventos esvaziar sozinho, o valor de saída é o mesmo e não há crash.
 */
process.exitCode = ok ? 0 : 1;
