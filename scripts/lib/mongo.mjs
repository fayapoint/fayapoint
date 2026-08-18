/**
 * A porta ESM para `mongo.cjs` — onde estão o teto, os números medidos e o
 * porquê de tudo isto existir. Leia lá.
 *
 * Só reexporta: o teto do pool não pode existir em dois arquivos, e a fonte tem
 * que ser o CommonJS porque metade dos scripts é `.cjs` e `require()` não
 * carrega ESM.
 *
 *     import { abrirMongo, comMongo, OPCOES_DE_SCRIPT } from "../lib/mongo.mjs";
 */
import cjs from "./mongo.cjs";

export const OPCOES_DE_SCRIPT = cjs.OPCOES_DE_SCRIPT;
export const uriDoMongo = cjs.uriDoMongo;
export const abrirMongo = cjs.abrirMongo;
export const comMongo = cjs.comMongo;
