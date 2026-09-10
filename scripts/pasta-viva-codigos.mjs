/**
 * Cria os códigos de acesso da Pasta Viva — e sem eles ninguém entra.
 *
 * ## O defeito que este script fecha (10/09/2026)
 *
 * A coleção `pastaVivaCodigos` estava **vazia**: zero documentos. A página de
 * vendas do ebook já prometia "Acesso à Pasta Viva" e dizia, com todas as
 * letras, que o código vem na primeira página do PDF. Quem comprasse não
 * conseguiria entrar em lugar nenhum. Não houve prejudicado só porque o
 * produto é novo.
 *
 * ## ⚠️ Por que o código do PDF é de TIRAGEM, e não individual
 *
 * O desenho original travava o código na primeira conta que o resgatasse
 * (`usadoPor`). Isso só funciona se cada comprador receber um código
 * diferente — e **a Hotmart entrega o mesmo arquivo PDF para todo mundo**. Com
 * um código de uso único impresso nesse arquivo, o primeiro comprador a
 * resgatar deixaria todos os outros de fora, tendo pago.
 *
 * Por isso o código impresso nasce com `tiragem: true`: vale para muitas
 * contas e conta quantas entraram. É **atrito, não segurança** — quem receber
 * o PDF de um amigo resgata igual —, e essa sempre foi a natureza do
 * mecanismo: trava de verdade só existiria com webhook da Hotmart, que não
 * existe.
 *
 * O `lote` existe para o dia em que um vazamento pesar: revoga-se o lote e
 * imprime-se o próximo, sem tirar o acesso de quem já entrou.
 *
 *   node --env-file=.env.local scripts/pasta-viva-codigos.mjs --tiragem
 *   node --env-file=.env.local scripts/pasta-viva-codigos.mjs --individuais 50
 *   node --env-file=.env.local scripts/pasta-viva-codigos.mjs --listar
 */
import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";

const argv = process.argv.slice(2);
const querTiragem = argv.includes("--tiragem");
const quantosIndividuais = argv.includes("--individuais")
  ? Number(argv[argv.indexOf("--individuais") + 1] || 0)
  : 0;
const soListar = argv.includes("--listar");

const LOTE = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" })
  .format(new Date())
  .replace(/-/g, "");

/** Sem 0/O e 1/I/L: o código é lido de um PDF e digitado à mão. */
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function sortear(tamanho) {
  const bytes = randomBytes(tamanho);
  let saida = "";
  for (let i = 0; i < tamanho; i++) saida += ALFABETO[bytes[i] % ALFABETO.length];
  return saida;
}

const grupos = (s, n) => s.match(new RegExp(`.{1,${n}}`, "g")).join("-");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI ausente. Rode com --env-file=.env.local a partir de fayapoint-ai/.");
  process.exit(1);
}

const cliente = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
await cliente.connect();
const col = cliente.db("fayapoint").collection("pastaVivaCodigos");

await col.createIndex({ codigo: 1 }, { unique: true }).catch(() => {});

if (soListar) {
  const todos = await col.find({}).project({ codigo: 1, lote: 1, tiragem: 1, resgates: 1, revogado: 1, usadoPor: 1 }).toArray();
  console.log(`${todos.length} código(s) na coleção:`);
  for (const c of todos) {
    const tipo = c.tiragem ? "TIRAGEM" : "individual";
    const estado = c.revogado ? "REVOGADO" : c.usadoPor ? "usado" : "livre";
    console.log(`  ${c.codigo}  ${tipo.padEnd(11)} lote ${c.lote}  ${estado}  ${c.resgates || 0} resgate(s)`);
  }
  await cliente.close();
  process.exit(0);
}

if (querTiragem) {
  const jaTem = await col.findOne({ tiragem: true, revogado: false });
  if (jaTem) {
    console.log(`Já existe um código de tiragem ativo: ${jaTem.codigo} (lote ${jaTem.lote}).`);
    console.log("Para trocar, revogue o antigo antes — quem já entrou não perde acesso.");
  } else {
    const codigo = `VIVA-${grupos(sortear(8), 4)}`;
    await col.insertOne({
      codigo,
      lote: `tiragem-${LOTE}`,
      criadoEm: new Date(),
      usadoPor: null,
      usadoEm: null,
      revogado: false,
      tiragem: true,
      resgates: 0,
    });
    console.log("");
    console.log("  ┌──────────────────────────────────────────────┐");
    console.log(`  │  ${codigo.padEnd(42)}│`);
    console.log("  └──────────────────────────────────────────────┘");
    console.log("");
    console.log("  ⚠️ ESTE é o código que precisa ser IMPRESSO na primeira página do PDF.");
    console.log("     Sem ele no arquivo, o comprador não tem como entrar na Pasta Viva.");
    console.log("");
  }
}

if (quantosIndividuais > 0) {
  const novos = [];
  const vistos = new Set();
  while (novos.length < quantosIndividuais) {
    const codigo = `VIVA-${grupos(sortear(8), 4)}`;
    if (vistos.has(codigo)) continue;
    vistos.add(codigo);
    novos.push({
      codigo,
      lote: `individual-${LOTE}`,
      criadoEm: new Date(),
      usadoPor: null,
      usadoEm: null,
      revogado: false,
      tiragem: false,
      resgates: 0,
    });
  }
  await col.insertMany(novos, { ordered: false }).catch((e) => {
    console.warn("alguns códigos colidiram e foram ignorados:", e.message);
  });
  console.log(`${novos.length} código(s) individuais criados (lote individual-${LOTE}).`);
}

if (!querTiragem && !quantosIndividuais) {
  console.log("Nada a fazer. Use --tiragem, --individuais N ou --listar.");
}

await cliente.close();
