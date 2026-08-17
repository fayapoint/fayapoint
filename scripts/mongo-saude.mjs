#!/usr/bin/env node
/**
 * A saúde das conexões do cluster, em um comando.
 *
 *     node scripts/mongo-saude.mjs                  # estado agora
 *     node scripts/mongo-saude.mjs --pool           # quanto custa cada cliente
 *     node scripts/mongo-saude.mjs --carga          # rajada em produção, medindo o pico
 *     node scripts/mongo-saude.mjs --carga --base=http://localhost:3000
 *
 * ## Por que isto existe no repositório, e não como script solto
 *
 * Em 13/08/2026 o site ficou lento em tudo — "desde logar até ler um curso" — e
 * a resposta ("228 das 500 conexões abertas com o site parado") só apareceu
 * depois de escrever um script à mão no meio do incêndio. O número que decide
 * este tipo de problema é sempre o mesmo, então ele fica aqui, pronto.
 *
 * O teto do cluster grátis é **500 conexões**, e ele é dividido com todo mundo
 * que mora neste cluster: `mission-control`, `worldforge`, `content_factory_ai`,
 * `n8n_workflows` e os scripts de geração de curso. `available` chegando perto de
 * zero não é problema "do site": é problema de todos ao mesmo tempo.
 *
 * ⚠️ `--carga` bate no site DE PRODUÇÃO. São 5 rotas × N pedidos, uma vez. Não
 * rode em horário de pico e não aumente `--conc` sem motivo.
 */
import { MongoClient } from "mongodb";

import { uriDoMongo, abrirMongo } from "./lib/mongo.mjs";
const arg = (n, padrao) => {
  const a = process.argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split("=").slice(1).join("=") : padrao;
};
const tem = (n) => process.argv.includes(`--${n}`);

const URI = uriDoMongo();
/** O espião usa pool 2: ele mede, não trabalha. */
const cliente = await abrirMongo({ maxPoolSize: 2 });
const admin = cliente.db("admin").admin();
const conexoes = async () => (await admin.serverStatus()).connections;

const TETO_DO_CLUSTER = 500;

async function estado() {
  const c = await conexoes();
  const usado = c.current;
  const pct = Math.round((usado / TETO_DO_CLUSTER) * 100);
  const barra = "█".repeat(Math.round(pct / 2.5)).padEnd(40, "·");
  console.log(`\nCONEXÕES  ${usado}/${TETO_DO_CLUSTER}  (${pct}%)`);
  console.log(`  ${barra}`);
  console.log(`  disponíveis: ${c.available}   criadas desde o boot: ${c.totalCreated}`);
  if (pct >= 70) console.log(`  ⚠️  acima de 70% — a Atlas alerta aqui, e recusa conexão nova nas 500.`);

  /**
   * O que o driver ENTENDEU da URI — e é preciso ler de um cliente SEM opções.
   * `cliente.options` devolve o que este script pediu, não o que a URI diz:
   * opção passada no construtor sobrescreve a da URI. Ler daqui seria relatar o
   * próprio palpite como se fosse a configuração da casa.
   *
   * Construir um MongoClient não conecta nada — dá para inspecionar de graça.
   */
  const semOpcoes = new MongoClient(URI).options;
  console.log(`\nO QUE A URI DECLARA (é o que vale para os ~40 scripts, que não passam opção)`);
  console.log(`  maxPoolSize: ${semOpcoes.maxPoolSize}   minPoolSize: ${semOpcoes.minPoolSize}   maxIdleTimeMS: ${semOpcoes.maxIdleTimeMS}`);
  if (semOpcoes.maxPoolSize >= 100) {
    console.log(`  ⚠️  100 é o PADRÃO do driver, não uma escolha. Um script com pool de 100`);
    console.log(`      pode consumir um quinto do cluster sozinho. Ponha`);
    console.log(`      "&maxPoolSize=5&maxIdleTimeMS=30000" na MONGODB_URI.`);
  }
  return c;
}

async function custoDoPool() {
  console.log(`\n=== CUSTO DE UM CLIENTE (medido, não estimado) ===`);
  const base = (await conexoes()).current;
  const c1 = await abrirMongo();
  await new Promise((r) => setTimeout(r, 1500));
  console.log(`  ocioso, logo após connect(): +${(await conexoes()).current - base}`);
  const db = c1.db("fayapointProdutos").collection("products");
  await Promise.all(Array.from({ length: 8 }, () => db.findOne({}, { projection: { slug: 1 } })));
  console.log(`  sob 8 operações em paralelo: +${(await conexoes()).current - base}`);
  await c1.close();
  console.log(`  (o pool é POR MEMBRO do replica set, e o monitoramento não conta no maxPoolSize —`);
  console.log(`   por isso "maxPoolSize 5" nunca significou 5 conexões)`);
}

async function carga() {
  const BASE = arg("base", "https://fayai.com.br");
  const CONC = Number(arg("conc", 24));
  const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
  const rotas = [
    "/api/public/community-stats",
    "/api/store/featured",
    "/api/public/gallery?page=1&limit=12",
    "/pt-BR/cursos",
    "/",
  ];

  console.log(`\n=== RAJADA em ${BASE} — ${CONC} pedidos paralelos por rota ===`);
  const inicio = await conexoes();
  let pico = inicio.current;
  let parar = false;
  const vigia = (async () => {
    while (!parar) {
      const c = await conexoes();
      if (c.current > pico) pico = c.current;
      await new Promise((r) => setTimeout(r, 400));
    }
  })();

  for (const rota of rotas) {
    const t0 = Date.now();
    const res = await Promise.all(
      Array.from({ length: CONC }, (_, i) =>
        fetch(`${BASE}${rota}${rota.includes("?") ? "&" : "?"}cb=${Date.now()}-${i}`, {
          headers: { "User-Agent": UA },
        })
          .then((r) => ({ ok: r.ok, s: r.status }))
          .catch((e) => ({ ok: false, s: String(e.message).slice(0, 30) }))
      )
    );
    const ruins = res.filter((r) => !r.ok);
    console.log(
      `  ${rota.padEnd(38)} ${String(Date.now() - t0).padStart(6)}ms  ok=${res.length - ruins.length}/${res.length}` +
        (ruins.length ? `  FALHAS: ${JSON.stringify(ruins.slice(0, 3))}` : "")
    );
  }

  await new Promise((r) => setTimeout(r, 3000));
  parar = true;
  await vigia;
  const fim = await conexoes();
  console.log(`\n  PICO: ${pico} conexões (base ${inicio.current})`);
  console.log(`  criadas na rajada: ${fim.totalCreated - inicio.totalCreated}`);
  console.log(`  simultâneos estimados até as 500: ~${Math.floor((TETO_DO_CLUSTER / Math.max(1, pico - inicio.current)) * CONC)}`);
  console.log(`\n  Referência de 17/08/2026, ANTES de consolidar os cinco pools em um:`);
  console.log(`    pico 104 (base 7), 100 criadas, ~120 simultâneos até o teto.`);
}

await estado();
if (tem("pool")) await custoDoPool();
if (tem("carga")) await carga();
await cliente.close();
console.log();
