#!/usr/bin/env -S npx tsx
/**
 * O TESTE DE PONTA A PONTA DA FILA.
 *
 * ## O que ele prova, e por que só ele prova
 *
 * O motor já é testado contra o ComfyUI (`worldforge-fayai/engine/_teste`), e as
 * rotas são tipadas. O que nenhum dos dois cobre é o CAMINHO: o site grava um
 * pedido, o trabalhador puxa, roda na GPU, publica, avisa, e o resultado
 * aparece no destino. É uma máquina de estados que atravessa dois processos e
 * um banco — e é exatamente onde moram os defeitos que não aparecem em
 * typecheck: o aluguel que vence cedo demais, a conclusão que não chega, o
 * resultado `pronto` que nunca vira arte na peça.
 *
 * ## Como ele não suja produção
 *
 * O usuário é um `ObjectId` sintético e fixo, marcado no rótulo. O trabalho
 * nasce com `conta: []`, então a caixa registradora não tem o que cobrar. E o
 * `finally` apaga o que criou — inclusive quando o teste falha no meio, que é
 * justamente quando esquecer de limpar dói.
 *
 * Uso (com o site em pé e o ComfyUI ligado):
 *   npx tsx scripts/forja/_teste/ponta-a-ponta.ts
 *   npx tsx scripts/forja/_teste/ponta-a-ponta.ts --so-enfileirar
 */

import { MongoClient, ObjectId } from "mongodb";
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { grafoZImage } from "../../../src/lib/forja/engine/comfy/grafos";
import { montarPromptDeImagem, TAMANHOS } from "../../../src/lib/forja/engine/prompts/imagem";
import { resolverConflitos } from "../../../src/lib/forja/engine/vocabulario";
import type { Personagem } from "../../../src/lib/forja/engine/personagem";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "../../..");

function env(nome: string): string | undefined {
  if (process.env[nome]) return process.env[nome];
  for (const arquivo of [join(RAIZ, ".env.local"), join(AQUI, "../.env.forja")]) {
    if (!existsSync(arquivo)) continue;
    const m = new RegExp(`^${nome}=(.*)$`, "m").exec(readFileSync(arquivo, "utf8"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return undefined;
}

const URI = env("MONGODB_URI");
if (!URI) {
  console.error("Falta MONGODB_URI (procurei no ambiente e em .env.local).");
  process.exit(2);
}

/** Um usuário que não existe. É de propósito: nada a debitar, nada a sujar. */
const USUARIO_DE_TESTE = new ObjectId("000000000000000000000f0a");

const PESSOA: Personagem = {
  origem: "criador",
  nome: "Teste",
  aparencia: { genero: "neutro", idade: 35, pele: "morena", cabeloEstilo: "curto", cabeloCor: "castanho" },
  figurinos: [{ id: "f1", nome: "Do dia", descricao: "avental de trabalho", en: "a work apron", padrao: true }],
};

const soEnfileirar = process.argv.includes("--so-enfileirar");

async function main() {
  const cliente = new MongoClient(URI as string);
  await cliente.connect();
  /**
   * ⚠️ O nome do banco é explícito, e tem de ser.
   *
   * A `MONGODB_URI` da casa não traz caminho de banco (`.../?retryWrites=…`), e
   * `cliente.db()` sem argumento cai no banco `test`. O `lib/mongodb.ts` força
   * `fayapoint` no `dbName` — este teste tem de escrever no MESMO lugar, senão
   * ele grava num banco que ninguém lê e conclui que a fila não funciona.
   */
  const db = cliente.db("fayapoint");
  const trabalhos = db.collection("forjatrabalhos");
  let id: ObjectId | null = null;

  try {
    // ── 1. o site compõe ──────────────────────────────────────────
    const { ajustes, correcoes } = resolverConflitos({
      enquadramento: "flat-lay",
      angulo: "low-angle", // conflito de propósito: `flat-lay` já é um ângulo
      luz: "window",
      lente: "normal-35",
      profundidade: "moderate",
      paleta: "earth",
      estilo: "produto",
    });
    console.log(`conflitos consertados: ${correcoes.length ? correcoes.join(" ") : "(nenhum)"}`);
    if (!correcoes.length) throw new Error("o resolvedor de conflitos não pegou o caso plantado");

    const p = montarPromptDeImagem(
      {
        acao: "Ferramentas de trabalho arrumadas numa bancada de madeira",
        acaoEn: "work tools neatly arranged on a wooden workbench",
        ajustes,
      },
      { aspecto: "1:1", personagens: [{ personagem: PESSOA }] },
    );
    const tam = TAMANHOS["1:1"];
    const params = {
      positivo: p.positivo,
      negativo: p.negativo,
      largura: tam.largura,
      altura: tam.altura,
      prefixo: "forja/pontaaponta",
      seed: 12345,
    };
    const montado = grafoZImage(params);

    const agora = new Date();
    const r = await trabalhos.insertOne({
      userId: USUARIO_DE_TESTE,
      tipo: "imagem",
      onde: "local",
      grafo: "z-image",
      params,
      referencias: [],
      destino: { avulso: true },
      rotulo: "TESTE ponta a ponta (apagável)",
      estado: "esperando",
      prioridade: 999, // na frente de tudo: o teste não pode esperar a fila real
      trabalhador: "",
      tentativas: 0,
      ultimoErro: "",
      creditos: 0,
      conta: [],
      segundosEstimados: montado.segundosEstimados,
      criadoEm: agora,
      atualizadoEm: agora,
    });
    id = r.insertedId;
    console.log(`enfileirado: ${id}\n  prompt: ${p.positivo.slice(0, 130)}…`);

    if (soEnfileirar) {
      console.log("(--so-enfileirar) deixando na fila para o trabalhador que estiver rodando.");
      id = null; // não apaga: alguém vai pegar
      return;
    }

    // ── 2. o trabalhador puxa ─────────────────────────────────────
    console.log("\nchamando o trabalhador…\n");
    const codigo = await new Promise<number>((res) => {
      const filho = spawn(
        process.execPath,
        [join(RAIZ, "node_modules/tsx/dist/cli.mjs"), join(AQUI, "../trabalhador.ts"), "--uma-vez", "--seco"],
        { stdio: "inherit", cwd: RAIZ },
      );
      filho.on("exit", (c) => res(c ?? 1));
    });
    if (codigo !== 0) throw new Error(`o trabalhador saiu com ${codigo}`);

    // ── 3. o resultado voltou? ────────────────────────────────────
    const final = await trabalhos.findOne({ _id: id });
    console.log(`\nestado final: ${final?.estado}`);
    if (final?.estado !== "pronto") {
      throw new Error(`esperava "pronto", veio "${final?.estado}" — ${final?.ultimoErro || "sem motivo"}`);
    }
    if (!final?.resultado?.url) throw new Error("terminou pronto e sem URL");
    console.log(`resultado: ${final.resultado.url}`);
    console.log(`levou: ${final.segundosReais}s (estimado ${final.segundosEstimados}s)`);
    console.log("\n✓ PONTA A PONTA OK");
  } finally {
    if (id) {
      await trabalhos.deleteOne({ _id: id });
      console.log("(trabalho de teste apagado)");
    }
    await cliente.close();
  }
}

main().catch((e) => {
  console.error(`\n✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
