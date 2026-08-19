/**
 * Traduz o CORPO dos cursos: o markdown das aulas e o currículo detalhado.
 *
 * 4,7 MB em 27 cursos. É a maior peça do projeto de tradução, e a que mais pode
 * dar errado em silêncio — por isso as três decisões abaixo.
 *
 * ── 1. Coleção separada, e não subdocumento ────────────────────────────────
 *
 * A vitrine (`i18n.en`) mora dentro do produto porque tem ~4 KB. O corpo tem
 * 250 KB por curso: enfiado no mesmo documento, TODA leitura de catálogo
 * passaria a carregar o curso inteiro duas vezes — e a `/cursos` já vazou
 * 4,40 MB uma vez por menos que isso. Aqui a tradução vai para
 * `conteudoTraduzido`, lida só por quem realmente abre a aula.
 *
 *   { slug, locale: "en", courseContent, detailedCurriculum, traduzidoEm }
 *
 * ── 2. Corte por CAPÍTULO, não por tamanho ─────────────────────────────────
 *
 * O motor corta por número de caracteres. Num texto corrido isso parte frase no
 * meio e o modelo traduz sem saber do que se falava. Aqui o markdown é
 * quebrado nos cabeçalhos de capítulo ANTES de ir para o motor: cada pedaço é
 * uma unidade que se explica sozinha, e a emenda é exata porque o separador é
 * preservado.
 *
 * ── 3. O que NUNCA é traduzido ─────────────────────────────────────────────
 *
 *   {{fact:...}}    resolvido em tempo de render pelo NOME do token
 *   ```blocos```    é o código que o aluno vai copiar
 *   URLs e imagens
 *
 * O motor já é instruído sobre os três. A verificação depois da tradução
 * confere que batem: tokens `{{fact:}}`, cercas ```, **marcadores de mídia**,
 * **contagem de seções `##`** e a presença da citação. Se não bater, o pedaço
 * é traduzido de novo (duas tentativas, a segunda no modelo caro) e, se ainda
 * assim não bater, fica em português.
 *
 * Uso:
 *   node --env-file=.env.local scripts/i18n/cursos-conteudo.mjs [--so-um slug] [--secar] [--refazer]
 */

import { MongoClient } from "mongodb";
// O teto do pool. Sem ele o driver assume maxPoolSize:100, e o cluster
// grátis inteiro tem 500 — divididas com os outros projetos.
// Ver `scripts/lib/mongo.cjs`.
import { OPCOES_DE_SCRIPT } from "../lib/mongo.mjs";
import { invalidarCache } from "../lib/invalidar-cache.mjs";
import { traduzirMapa, MODELOS, dinheiro } from "./traduzir.mjs";

const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error("Falta MONGODB_URI.");
  process.exit(1);
}

/**
 * Quebra o markdown do curso em pedaços que começam num cabeçalho.
 *
 * Guarda os separadores como parte do pedaço seguinte, então `pedacos.join("")`
 * devolve o original byte a byte. Isso é o que permite remontar sem inventar
 * espaço em branco onde não havia.
 */
function fatiar(markdown, alvo = 9000) {
  const linhas = markdown.split("\n");
  const pedacos = [];
  let atual = [];
  let tamanho = 0;
  let dentroDeCodigo = false;

  for (const linha of linhas) {
    // Cabeçalho dentro de bloco de código é código, não cabeçalho.
    if (/^\s*```/.test(linha)) dentroDeCodigo = !dentroDeCodigo;

    // Corta no cabeçalho quando já passou do alvo — ou em QUALQUER linha em
    // branco quando o pedaço passou de 1,4× o alvo. Sem a segunda condição, um
    // capítulo sem subtítulos vira um pedaço de 13 KB; medido em
    // `perplexity-pesquisa-inteligente`, foi exatamente esse pedaço que o
    // modelo resumiu em vez de traduzir.
    const ehCorte =
      !dentroDeCodigo &&
      (/^#{1,3}\s/.test(linha) ? tamanho >= alvo : tamanho >= alvo * 1.4 && linha.trim() === "");
    if (ehCorte) {
      pedacos.push(atual.join("\n"));
      atual = [];
      tamanho = 0;
    }
    atual.push(linha);
    tamanho += linha.length + 1;
  }
  if (atual.length) pedacos.push(atual.join("\n"));
  return pedacos;
}

const CONTA_FATO = (s) => (s.match(/\{\{fact:[^}]*\}\}/g) ?? []).length;
const CONTA_CERCA = (s) => (s.match(/^\s*```/gm) ?? []).length;
const CONTA_MIDIA = (s) => (s.match(/<!--\s*media:/g) ?? []).length;
const CONTA_SECAO = (s) => (s.match(/^##\s/gm) ?? []).length;
const CONTA_CITACAO = (s) => (s.match(/^>\s/gm) ?? []).length;

/**
 * O pedaço traduzido preserva o que não é texto?
 *
 * Devolve o motivo da rejeição, ou `null` se está bom. Rejeitado fica em
 * português: capítulo com token de fato comido mostra `{{fact:...}}` cru na
 * tela, e capítulo com cerca desbalanceada quebra o markdown inteiro dali para
 * baixo.
 */
function conferir(pt, en) {
  if (!en || !en.trim()) return "vazio";
  if (CONTA_FATO(pt) !== CONTA_FATO(en)) {
    return `tokens {{fact:}}: ${CONTA_FATO(pt)} → ${CONTA_FATO(en)}`;
  }
  if (CONTA_CERCA(pt) !== CONTA_CERCA(en)) {
    return `cercas de código: ${CONTA_CERCA(pt)} → ${CONTA_CERCA(en)}`;
  }
  /**
   * ⚠️ ESTRUTURA — os três que faltavam, e que custaram um curso em 19/08.
   *
   * A tradução do `ia-para-estudar` passou nas conferências acima e mesmo
   * assim entregou dois capítulos estragados, sem nada reclamar:
   *
   *   cap11  8 seções → 9, a citação `> **Dica Pro:**` DESAPARECEU, e o
   *          marcador `dica` foi substituído por uma **segunda cópia** do
   *          `cenario` — seis marcadores no capítulo, o número certo, uma
   *          figura repetida no lugar de outra;
   *   cap28  8 seções → 11 (cabeçalhos duplicados) e 2 marcadores perdidos.
   *
   * Nada disso é "tradução ruim": é conteúdo que sumiu. E o laço de repetição
   * logo abaixo já existia e já funcionava — só nunca era acionado, porque
   * ninguém contava estas três coisas.
   *
   * A citação é conferida por PRESENÇA, não por igualdade: o modelo às vezes
   * quebra o bloco em duas linhas `>` legitimamente, e reprovar isso deixaria
   * o capítulo em português por um detalhe de formatação — troca ruim.
   */
  if (CONTA_MIDIA(pt) !== CONTA_MIDIA(en)) {
    return `marcadores de mídia: ${CONTA_MIDIA(pt)} → ${CONTA_MIDIA(en)}`;
  }
  if (CONTA_SECAO(pt) !== CONTA_SECAO(en)) {
    return `seções "##": ${CONTA_SECAO(pt)} → ${CONTA_SECAO(en)}`;
  }
  if (CONTA_CITACAO(pt) > 0 && CONTA_CITACAO(en) === 0) {
    return "a citação (Dica Pro) sumiu";
  }
  // Tradução que encolhe demais quase sempre é resumo, não tradução.
  if (en.length < pt.length * 0.45) {
    return `encolheu demais: ${pt.length} → ${en.length}`;
  }
  return null;
}

/** Achata as strings de texto do currículo detalhado. */
function extrairCurriculo(dc) {
  const m = {};
  (dc ?? []).forEach((mod, i) => {
    if (mod?.title) m[`${i}.title`] = mod.title;
    if (mod?.description) m[`${i}.description`] = mod.description;
    (mod?.lessons ?? []).forEach((aula, j) => {
      if (aula?.title) m[`${i}.lessons.${j}.title`] = aula.title;
      if (aula?.description) m[`${i}.lessons.${j}.description`] = aula.description;
      if (aula?.content) m[`${i}.lessons.${j}.content`] = aula.content;
    });
  });
  return m;
}

/** Remonta o currículo traduzido sobre a forma do original. */
function remontarCurriculo(dc, plano) {
  return (dc ?? []).map((mod, i) => ({
    ...mod,
    title: plano[`${i}.title`] ?? mod.title,
    description: plano[`${i}.description`] ?? mod.description,
    lessons: (mod?.lessons ?? []).map((aula, j) => ({
      ...aula,
      title: plano[`${i}.lessons.${j}.title`] ?? aula.title,
      description: plano[`${i}.lessons.${j}.description`] ?? aula.description,
      content: plano[`${i}.lessons.${j}.content`] ?? aula.content,
    })),
  }));
}

async function main() {
  const argv = process.argv.slice(2);
  const soUm = argv.includes("--so-um") ? argv[argv.indexOf("--so-um") + 1] : null;
  const secar = argv.includes("--secar");
  const refazer = argv.includes("--refazer");
  const paralelo = argv.includes("--paralelo")
    ? Number(argv[argv.indexOf("--paralelo") + 1])
    : 5;

  const cliente = new MongoClient(URI, OPCOES_DE_SCRIPT);
  await cliente.connect();
  const bd = cliente.db("fayapointProdutos");
  const produtos = bd.collection("products");
  const traduzidos = bd.collection("conteudoTraduzido");
  await traduzidos.createIndex({ slug: 1, locale: 1 }, { unique: true });

  const filtro = { type: "course", ...(soUm ? { slug: soUm } : {}) };
  const cursos = await produtos
    .find(filtro, { projection: { slug: 1, courseContent: 1, detailedCurriculum: 1 } })
    .toArray();

  console.log(`${cursos.length} curso(s).\n`);
  let custoTotal = 0;
  let feitos = 0;

  for (const c of cursos) {
    const jaTem = await traduzidos.findOne({ slug: c.slug, locale: "en" });
    // Curso com pedaço rejeitado é refeito: ficou meio em inglês, meio em
    // português, e é justamente o estado que não pode ir para o ar.
    // ⚠️ `--refazer` existe porque a tradução envelhece com o ORIGINAL, e o
    // script não tem como saber disso sozinho: em 17/08/2026 dois cursos foram
    // reescritos do zero e a coleção continuou servindo, em inglês, o texto oco
    // que eles tinham antes. "Já traduzido" respondia a pergunta errada —
    // traduzido de QUAL versão?
    if (jaTem && !jaTem.rejeitados && !secar && !refazer) {
      console.log(`· ${c.slug} (já traduzido, pulando)`);
      continue;
    }

    const md = typeof c.courseContent === "string" ? c.courseContent : "";
    const pedacos = fatiar(md);
    const curriculo = extrairCurriculo(c.detailedCurriculum);
    const tamCurriculo = Object.values(curriculo).join("").length;

    console.log(
      `→ ${c.slug} — ${(md.length / 1024).toFixed(0)} KB em ${pedacos.length} pedaços` +
        (tamCurriculo ? ` + ${(tamCurriculo / 1024).toFixed(0)} KB de currículo` : ""),
    );
    if (secar) continue;

    // ── o markdown ──────────────────────────────────────────────────────────
    let mdEn = "";
    let rejeitados = 0;
    if (pedacos.length) {
      const mapa = {};
      pedacos.forEach((p, i) => { mapa[`p${i}`] = p; });

      /**
       * O lote inteiro de uma vez; e, se ele morrer, pedaço por pedaço.
       *
       * ⚠️ Isto existe por uma queda real: um pedaço sozinho estourou o teto de
       * saída, o motor tentou partir o lote, viu que o lote tinha UMA chave, e
       * deixou o erro subir. O erro matou o processo — e levou junto os 15
       * cursos que ainda não tinham sido traduzidos naquela rodada. Um pedaço
       * ruim não pode custar a fila; ele fica em português e o resto anda.
       */
      let saida = {};
      let custo = 0;
      try {
        // `limite` alto: os pedaços já vêm cortados por capítulo, e o motor só
        // agrupa. 9500 mantém um pedaço por chamada na maioria dos casos.
        ({ saida, custo } = await traduzirMapa(mapa, {
          modelo: MODELOS.volume,
          limite: 9500,
          paralelo,
        }));
      } catch (e) {
        console.warn(`   ⚠ lote caiu (${e.message}) — indo pedaço a pedaço`);
        for (const [k, v] of Object.entries(mapa)) {
          try {
            const r = await traduzirMapa({ [k]: v }, { modelo: MODELOS.volume, limite: 999999 });
            Object.assign(saida, r.saida);
            custo += r.custo;
          } catch (e2) {
            console.warn(`   ⚠ ${k} não traduzido (${e2.message})`);
          }
        }
      }
      custoTotal += custo;

      const traduzidosPorPedaco = [];
      for (let i = 0; i < pedacos.length; i++) {
        const pt = pedacos[i];
        let en = saida[`p${i}`];
        let problema = conferir(pt, en);

        // Uma rejeição não é falha de rede: é o modelo tendo RESUMIDO em vez de
        // traduzido, ou comido um token. Repetir sozinho resolve na maioria das
        // vezes; a segunda tentativa sobe para o modelo caro, que erra menos.
        for (let t = 0; problema && t < 2; t++) {
          console.warn(`   ↻ pedaço ${i} (${problema}) — tentativa ${t + 2}`);
          try {
            const r = await traduzirMapa(
              { [`p${i}`]: pt },
              { modelo: t === 0 ? MODELOS.volume : MODELOS.vitrine, limite: 999999 },
            );
            custoTotal += r.custo;
            en = r.saida[`p${i}`];
            problema = conferir(pt, en);
          } catch (e) {
            // Mesma razão do lote acima: a repetição é a última chance do
            // pedaço, não da fila. Falhou, fica em português.
            console.warn(`   ⚠ repetição do pedaço ${i} falhou (${e.message})`);
            break;
          }
        }

        if (problema) {
          rejeitados++;
          console.warn(`   ⚠ pedaço ${i} fica em português (${problema})`);
          traduzidosPorPedaco.push(pt);
        } else {
          traduzidosPorPedaco.push(en);
        }
      }
      mdEn = traduzidosPorPedaco.join("\n");
    }

    // ── o currículo detalhado ───────────────────────────────────────────────
    let dcEn = null;
    if (Object.keys(curriculo).length) {
      try {
        // Limite menor que o do markdown: aqui um `lessons[].content` sozinho
        // pode ter milhares de caracteres, e o agrupamento por tamanho junta
        // vários deles. 6000 mantém a resposta longe do teto de saída.
        const { saida, custo } = await traduzirMapa(curriculo, {
          modelo: MODELOS.volume,
          limite: 6000,
          paralelo,
        });
        custoTotal += custo;
        dcEn = remontarCurriculo(c.detailedCurriculum, saida);
      } catch (e) {
        // O currículo é o índice, não a aula. Perdê-lo não pode custar o corpo
        // do curso, que é a parte cara — segue em português e o markdown vai.
        console.warn(`   ⚠ currículo não traduzido (${e.message}) — fica em português`);
      }
    }

    await traduzidos.updateOne(
      { slug: c.slug, locale: "en" },
      {
        $set: {
          slug: c.slug,
          locale: "en",
          ...(mdEn ? { courseContent: mdEn } : {}),
          ...(dcEn ? { detailedCurriculum: dcEn } : {}),
          pedacos: pedacos.length,
          rejeitados,
          traduzidoEm: new Date(),
        },
      },
      { upsert: true },
    );

    feitos++;
    console.log(
      `   gravado (${dinheiro(custoTotal)} acumulado)` +
        (rejeitados ? ` — ${rejeitados} pedaço(s) em português` : ""),
    );
  }

  await cliente.close();
  // A tradução do CORPO é cacheada em `conteudo:en:<slug>` por 10 minutos.
  // Sem isto, a aula em inglês continua servindo a tradução ANTERIOR, e o
  // script já terá dito "gravado".
  if (feitos) await invalidarCache();
  console.log(`\n${feitos} curso(s). Custo total: ${dinheiro(custoTotal)}`);
}

main().catch((e) => {
  console.error("\nFALHOU:", e.message);
  console.error("Cada curso é gravado ao terminar. Rode de novo para continuar.");
  process.exit(1);
});
