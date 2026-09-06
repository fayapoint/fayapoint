/**
 * O QUE CUSTA, DE VERDADE, UM CRÉDITO CONSUMIDO — 06/09/2026.
 *
 * ## Por que este medidor existe
 *
 * O programa Fundadores dá desconto no PREÇO do plano. O crédito, não: crédito
 * é a entrega, e entrega tem custo. A conta que decide o tamanho do desconto é
 * uma só:
 *
 *     preço de fundador  −  (créditos do plano × consumo × CUSTO POR CRÉDITO)
 *
 * A −50%, o plano Expert (400 créditos por R$83,50) **empata em R$0,268 por
 * crédito consumido**. O portão adotado é **R$0,20**, que deixa 23% de margem
 * no pior plano. Acima disso o desconto encolhe — e essa decisão precisa sair
 * de um número medido, não de uma conversa.
 *
 * Ver `autoresearch/PLANO_FUNDADORES_2026-09-05.md`, §3.2.
 *
 * ## As duas metades da medição, e por que as duas são precisas
 *
 * 1. **O que foi consumido** sai do banco: `credits.history` de cada usuário,
 *    que registra ação, valor e data em todo lançamento. É o denominador.
 * 2. **O que aquilo custou** sai do preço por token dos modelos que a casa usa
 *    (`src/lib/ai/provider.ts`) — copiado aqui embaixo, e conferido contra o
 *    arquivo a cada execução para não envelhecer em silêncio.
 *
 * ⚠️ Arte, vídeo e locução rodam na GPU de casa e **não têm custo de API**.
 * Entram como zero de propósito; o custo delas é energia, e energia não é
 * proporcional ao crédito. Se um dia a geração voltar para serviço pago, a
 * tabela `CUSTO_POR_ACAO` abaixo é o lugar de corrigir — e o portão vai
 * apertar sozinho.
 *
 *     node --env-file=.env.local scripts/medir-custo-do-credito.mjs
 *     node --env-file=.env.local scripts/medir-custo-do-credito.mjs --dias 30
 */

import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** O teto que o plano fixou. Acima disto, o desconto de fundador encolhe. */
const PORTAO_REAIS_POR_CREDITO = 0.2;

/** Câmbio para converter o preço por token, que é em dólar. */
const DOLAR = 5.4;

/**
 * O que CADA ação consome de recurso pago, por unidade de crédito cobrada.
 *
 * `tokensEntrada` e `tokensSaida` são medidos por chamada da ação inteira, não
 * por crédito — a divisão pelo preço em créditos acontece no cálculo.
 *
 * ⚠️ DeepSeek V4 é modelo de raciocínio: os tokens de pensamento saem do mesmo
 * orçamento da saída. Por isso a saída aqui é generosa de propósito — medir por
 * baixo produziria um custo otimista, que é o erro que quebra a conta.
 */
const CUSTO_POR_ACAO = {
  // Personalização de capítulo: janela de 2.600 caracteres na entrada
  // (~750 tokens) e um capítulo reescrito na saída, com raciocínio junto.
  curso_escrito: { creditos: 2, tokensEntrada: 1500, tokensSaida: 3000, modelo: "budget" },
  curso_ilustrado: { creditos: 2, tokensEntrada: 1500, tokensSaida: 3000, modelo: "budget", gpuLocal: true },
  curso_narrado: { creditos: 2, tokensEntrada: 1500, tokensSaida: 3000, modelo: "budget", gpuLocal: true },
  curso_completo: { creditos: 2, tokensEntrada: 1500, tokensSaida: 3000, modelo: "budget", gpuLocal: true },
  // Capítulo avulso de curso personalizado. Vale ZERO crédito desde 11/08 (o
  // pacote é que é cobrado), mas CONSOME token igual — então entra na conta com
  // o custo cheio e crédito 1, senão a divisão por zero esconderia o gasto.
  custom_course_chapter: { creditos: 1, tokensEntrada: 1500, tokensSaida: 3000, modelo: "budget" },
  // Storyboard de uma peça: prompt maior na saída (planos de câmera).
  storyboard_gerar: { creditos: 2, tokensEntrada: 2000, tokensSaida: 4000, modelo: "budget" },
  // Imagem: GPU de casa. Custo de API zero.
  image_generation: { creditos: 1, tokensEntrada: 0, tokensSaida: 0, gpuLocal: true },
  // Certificado: um PDF. O preço é a prova, não o custo.
  certificate_generation: { creditos: 50, tokensEntrada: 0, tokensSaida: 0 },
  // Conversa: não custa crédito (é do plano), mas custa token. Entra na conta
  // do plano por fora — ver `chatMensagensMes` em course-tiers.ts.
  ai_chat_message: { creditos: 0, tokensEntrada: 2000, tokensSaida: 800, modelo: "budget" },
};

/** Preço por milhão de tokens. Conferido contra provider.ts na execução. */
const PRECOS = {
  budget: { entrada: 0.09, saida: 0.18, id: "~deepseek/deepseek-v4-flash-latest" },
  premium: { entrada: 0.44, saida: 0.87, id: "~deepseek/deepseek-v4-pro-latest" },
};

/**
 * O preço do modelo vive em DOIS lugares e some em silêncio se um mudar.
 * Este portão lê o arquivo de verdade e compara. Barulho > número velho.
 */
function conferirPrecoContraProvider() {
  const arquivo = path.join(RAIZ, "src", "lib", "ai", "provider.ts");
  const fonte = fs.readFileSync(arquivo, "utf8");
  const divergencias = [];
  for (const [tier, p] of Object.entries(PRECOS)) {
    const bloco = fonte.split(p.id.replace("~", ""))[1]?.slice(0, 400) ?? "";
    const entrada = Number(bloco.match(/costPer1MInput:\s*([\d.]+)/)?.[1]);
    const saida = Number(bloco.match(/costPer1MOutput:\s*([\d.]+)/)?.[1]);
    if (Number.isFinite(entrada) && entrada !== p.entrada) {
      divergencias.push(`${tier}: entrada ${p.entrada} aqui, ${entrada} no provider.ts`);
    }
    if (Number.isFinite(saida) && saida !== p.saida) {
      divergencias.push(`${tier}: saída ${p.saida} aqui, ${saida} no provider.ts`);
    }
  }
  return divergencias;
}

function custoDaAcao(acao) {
  const c = CUSTO_POR_ACAO[acao];
  if (!c) return null;
  const preco = PRECOS[c.modelo ?? "budget"];
  const dolares =
    (c.tokensEntrada / 1e6) * preco.entrada + (c.tokensSaida / 1e6) * preco.saida;
  return { reais: dolares * DOLAR, creditos: c.creditos, gpuLocal: !!c.gpuLocal };
}

const dias = Number(process.argv[process.argv.indexOf("--dias") + 1]) || 90;

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("sem MONGODB_URI — rode com: node --env-file=.env.local " + process.argv[1]);
  process.exit(1);
}

const divergencias = conferirPrecoContraProvider();
if (divergencias.length) {
  console.error("\n⚠️  PREÇO DIVERGENTE de src/lib/ai/provider.ts:");
  for (const d of divergencias) console.error("   " + d);
  console.error("   Corrija PRECOS neste arquivo antes de confiar no resultado.\n");
} else {
  console.log("✅ preço por token confere com src/lib/ai/provider.ts");
}

const cliente = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
try {
  await cliente.connect();
  const db = cliente.db("fayapoint");
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

  // Um lançamento por linha do extrato, só os GASTOS (valor negativo).
  const gastos = await db
    .collection("users")
    .aggregate([
      { $unwind: "$credits.history" },
      { $match: { "credits.history.amount": { $lt: 0 }, "credits.history.createdAt": { $gte: desde } } },
      {
        $group: {
          _id: "$credits.history.action",
          creditos: { $sum: { $abs: "$credits.history.amount" } },
          lancamentos: { $sum: 1 },
          pessoas: { $addToSet: "$_id" },
        },
      },
      { $sort: { creditos: -1 } },
    ])
    .toArray();

  const usuarios = await db.collection("users").countDocuments();
  const comSaldo = await db.collection("users").countDocuments({ "credits.balance": { $gt: 0 } });

  console.log(`\n── CUSTO DO CRÉDITO · últimos ${dias} dias ──────────────────────`);
  console.log(`contas no banco: ${usuarios}   ·   com saldo: ${comSaldo}\n`);

  if (!gastos.length) {
    console.log("NENHUM crédito consumido no período. O denominador é zero:");
    console.log("não dá para medir custo por crédito com uso real ainda.\n");
  }

  let creditosTotal = 0;
  let reaisTotal = 0;
  const semTabela = [];

  console.log("ação                        créditos   lançam.  pessoas   custo R$");
  console.log("────────────────────────────────────────────────────────────────");
  for (const g of gastos) {
    const c = custoDaAcao(g._id);
    if (!c) {
      semTabela.push(g._id);
      continue;
    }
    // Quantas VEZES a ação rodou = créditos gastos / preço da ação em créditos.
    const vezes = c.creditos > 0 ? g.creditos / c.creditos : 0;
    const reais = vezes * c.reais;
    creditosTotal += g.creditos;
    reaisTotal += reais;
    console.log(
      `${String(g._id).padEnd(26)} ${String(g.creditos).padStart(8)} ${String(g.lancamentos).padStart(8)} ${String(g.pessoas.length).padStart(8)}   ${reais.toFixed(4).padStart(8)}${c.gpuLocal ? "  (GPU local)" : ""}`,
    );
  }

  if (semTabela.length) {
    console.log(`\n⚠️  ações consumidas SEM linha em CUSTO_POR_ACAO: ${semTabela.join(", ")}`);
    console.log("   elas ficaram FORA da conta — acrescente antes de decidir preço.");
  }

  console.log("\n── O NÚMERO QUE DECIDE ──────────────────────────────────────────");
  if (creditosTotal > 0) {
    const porCredito = reaisTotal / creditosTotal;
    console.log(`medido:   R$ ${porCredito.toFixed(4)} por crédito consumido`);
    console.log(`portão:   R$ ${PORTAO_REAIS_POR_CREDITO.toFixed(2)}`);
    console.log(
      porCredito <= PORTAO_REAIS_POR_CREDITO
        ? `\n✅ PASSA — o desconto de fundador pode abrir a −50%.`
        : `\n❌ REPROVA — abra a −40% (ou menos) e refaça a conta do §3.2.`,
    );
  } else {
    console.log("sem consumo medido no período — o limite ANALÍTICO é o que vale:");
  }

  // O teto analítico não depende de haver uso: é o custo da ação mais cara
  // por crédito, com os tokens dimensionados por cima.
  const teto = Object.entries(CUSTO_POR_ACAO)
    .filter(([, c]) => c.creditos > 0)
    .map(([acao, c]) => {
      const custo = custoDaAcao(acao);
      return { acao, porCredito: custo.reais / c.creditos };
    })
    .sort((a, b) => b.porCredito - a.porCredito);

  console.log("\nteto analítico por ação (R$ por crédito, tokens por cima):");
  for (const t of teto) console.log(`   ${t.acao.padEnd(26)} R$ ${t.porCredito.toFixed(4)}`);
  const pior = teto[0];
  console.log(
    `\npior ação: ${pior.acao} a R$ ${pior.porCredito.toFixed(4)} por crédito — ` +
      (pior.porCredito <= PORTAO_REAIS_POR_CREDITO
        ? `${(PORTAO_REAIS_POR_CREDITO / pior.porCredito).toFixed(0)}× abaixo do portão.`
        : `ACIMA do portão.`),
  );
  console.log("");
} finally {
  await cliente.close();
}
