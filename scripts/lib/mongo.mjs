/**
 * O cliente Mongo dos SCRIPTS — com teto, e o teto versionado no código.
 *
 * ## Por que isto existe
 *
 * `new MongoClient(uri)` sem opções herda `maxPoolSize: 100` do driver. Não é uma
 * escolha: é o padrão. E o cluster grátis tem **500 conexões no total**,
 * divididas entre o site, o `mission-control`, o `worldforge`, o
 * `content_factory_ai` e todo script rodando na sua máquina.
 *
 * Havia ~30 scripts aqui abrindo cliente sem opção nenhuma. Dois deles rodando
 * ao mesmo tempo em pool cheio já valem 40% do cluster — e foi com o site
 * praticamente parado que a Atlas mandou "nearing the connection limit" em
 * 13/08/2026.
 *
 * Dá para pôr o teto na `MONGODB_URI` (`&maxPoolSize=5&maxIdleTimeMS=30000`) e
 * funciona: opção da URI vale para todo cliente que não passa opção. Mas
 * `.env.local` não vai para o Git — então numa máquina nova, num clone, ou no
 * painel da Netlify, o teto simplesmente não existe. Por isso ele mora AQUI
 * também: quem importa daqui está protegido em qualquer máquina.
 *
 * ## Como usar
 *
 *     import { abrirMongo } from "../lib/mongo.mjs";   // ajuste a profundidade
 *     const cliente = await abrirMongo();
 *     try {
 *       await cliente.db("fayapoint").collection("users").findOne({});
 *     } finally {
 *       await cliente.close();   // no finally: erro no meio não deixa pool aberto
 *     }
 *
 * Ou, sem se lembrar do `finally`:
 *
 *     await comMongo(async (cliente) => { ... });
 *
 * ## O teto
 *
 * 5 conexões. Medido em 17/08/2026: um cliente com `maxPoolSize: 5` sob oito
 * operações em paralelo abriu 4 conexões no primário. Script que faz trabalho em
 * série usa uma ou duas. Se um script precisar de mais paralelismo, aumente NELE
 * (`abrirMongo({ maxPoolSize: 12 })`) e diga por quê — não mexa no padrão daqui.
 *
 * ⚠️ NÃO ponha prazo (`socketTimeoutMS`, `serverSelectionTimeoutMS`) por palpite.
 * Em 13/08 um `socketTimeoutMS: 20_000` escolhido "por parecer generoso" derrubou
 * o site: o trabalho mais longo levava 30s, e teto menor que o trabalho não
 * protege — transforma "lento" em "nunca".
 */
import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const AQUI = dirname(fileURLToPath(import.meta.url));

/** As mesmas opções do site no ar (ver `src/lib/mongo-opcoes.ts`). */
export const OPCOES_DE_SCRIPT = {
  maxPoolSize: 5,
  minPoolSize: 0,
  maxIdleTimeMS: 30_000,
};

/**
 * A URI, do ambiente ou do `.env.local` do repositório — para o script funcionar
 * tanto com `node --env-file=.env.local` quanto sem.
 */
export function uriDoMongo() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  for (const nome of [".env.local", ".env"]) {
    try {
      const txt = readFileSync(resolve(AQUI, "..", "..", nome), "utf8");
      const m = txt.match(/^MONGODB_URI=(.+)$/m);
      if (m) return m[1].trim();
    } catch {
      /* tenta o próximo */
    }
  }
  throw new Error("Sem MONGODB_URI (nem no ambiente, nem em .env.local).");
}

/** Abre um cliente já conectado, com teto. */
export async function abrirMongo(extras = {}) {
  const cliente = new MongoClient(uriDoMongo(), { ...OPCOES_DE_SCRIPT, ...extras });
  await cliente.connect();
  return cliente;
}

/** Abre, entrega, e fecha mesmo se der erro no meio. */
export async function comMongo(trabalho, extras = {}) {
  const cliente = await abrirMongo(extras);
  try {
    return await trabalho(cliente);
  } finally {
    await cliente.close();
  }
}
