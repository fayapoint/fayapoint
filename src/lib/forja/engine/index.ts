/* ⚠️ ARQUIVO GERADO — NÃO EDITE AQUI.
 * Fonte: worldforge-fayai/engine/index.ts
 * Edite lá e rode: node scripts/forja/sincronizar-engine.mjs
 * Conferir se a cópia está em dia: node scripts/forja/sincronizar-engine.mjs --conferir
 */
/**
 * A FORJA — o motor.
 *
 * ## O que é isto
 *
 * O WorldForge (o estúdio que montou a série TCH) afinado para o criador da
 * FayAI. O que ele trouxe: personagem com ficha física fechada, trava de
 * identidade repetida em todo prompt, vocabulário de direção de fotografia,
 * composição de prompt por CÓDIGO e não por pedido ao modelo. O que mudou: os
 * prompts falam com dono de negócio brasileiro em vez de com roteirista de
 * série sobrenatural, a geração roda na GPU de casa de graça, e o vídeo é
 * LTX 2.5 com áudio sincronizado.
 *
 * ## ⚠️ FONTE ÚNICA
 *
 * Este diretório é a FONTE. A cópia que vive no site
 * (`fayapoint-ai/src/lib/forja/engine/`) é GERADA por
 * `scripts/forja/sincronizar-engine.mjs` e carimbada como tal. Editar a cópia é
 * perder a edição no próximo sync — e é exatamente o defeito que já custou um
 * mês neste repositório, quando a mesma função existia em duas cópias e foi
 * consertada só numa.
 *
 * O motor é TypeScript PURO: nada de React, nada de Next, nada de Mongo. Ele
 * roda dentro da função serverless, dentro do trabalhador local e dentro do
 * teste — e é isso que permite validar os grafos contra o ComfyUI sem subir o
 * site.
 */

export * from "./vocabulario";
export * from "./personagem";
export * from "./formatos";
export * from "./peca";
export * from "./fila";
export * from "./custos";
export * from "./prompts/imagem";
export * from "./prompts/video";
export * from "./prompts/llm";
export * from "./comfy/grafos";
export * from "./comfy/cliente";
