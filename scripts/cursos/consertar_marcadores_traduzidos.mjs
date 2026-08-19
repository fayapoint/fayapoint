/**
 * Conserta os marcadores de mídia que a TRADUÇÃO quebrou.
 *
 * ── Por que isto existe ───────────────────────────────────────────────────────
 *
 * O marcador de mídia é encanamento: `<!--media:img id="…" src="…" caption="…"-->`.
 * Só a legenda é texto. Mas o tradutor recebe a linha inteira e traduz o que
 * parece palavra — inclusive `img` (vira `image`), o `id` (`intencao` vira
 * `intention`), e às vezes troca `caption=` por `alt=`, o espaço por `|`, ou
 * come o `-->` do fim.
 *
 * ⚠️ **Nada disso dá erro.** O leitor (`src/lib/curso-previa.ts`) renderiza
 * linha que COMEÇA com `<!--media:` E fecha com `-->` na mesma linha. Qualquer
 * desvio cai no `continue`: a figura não aparece, e a legenda — que é um
 * parágrafo que ENSINA e é texto indexável — some junto. E quando o desvio é no
 * começo (`<!-- media:image`), a linha nem entra no ramo de mídia: ela é
 * impressa como PARÁGRAFO, e o aluno em inglês lê um comentário HTML cru no
 * meio da aula.
 *
 * Medido em 18/08/2026 sobre `fayapointProdutos.conteudoTraduzido`:
 * **20 marcadores quebrados em 5 cursos [en]**, todos ATIVOS, incluindo o
 * gabarito `chatgpt-zero` com 7. Os originais em português: **zero**. O defeito
 * nasce na tradução e nunca foi varrido, porque o português está sempre certo.
 *
 * ── Como conserta ─────────────────────────────────────────────────────────────
 *
 * O `src` sobrevive à tradução em todos os 20 casos — é caminho, não palavra.
 * Então o `src` é a chave: acha o marcador equivalente no PORTUGUÊS, reaproveita
 * dele o encanamento inteiro (tipo, id, src, poster) e mantém do inglês só a
 * legenda traduzida. Assim as duas árvores passam a apontar para o mesmo id,
 * que é o que faltava.
 *
 *   node --env-file=.env.local scripts/cursos/consertar_marcadores_traduzidos.mjs
 *   node --env-file=.env.local scripts/cursos/consertar_marcadores_traduzidos.mjs --gravar
 */
import { MongoClient } from "mongodb";

const DB = "fayapointProdutos";
const GRAVAR = process.argv.includes("--gravar");
const CARIMBO = new Date().toISOString().slice(0, 10).replace(/-/g, "");

/** O que o leitor aceita: começa com `<!--media:` e fecha com `-->` na mesma linha. */
const CANONICO = /^<!--media:(img|video)\s[\s\S]*-->$/;
/** Qualquer coisa que TENTOU ser marcador — inclusive as formas que vazam como texto. */
const TENTATIVA = /<!--\s*media[:|]/i;

function atributo(linha, nome) {
  return linha.match(new RegExp(`${nome}\\s*=\\s*"([^"]*)"`))?.[1] ?? null;
}

/** O `src` é a única coisa que a tradução nunca mexeu — é caminho, não palavra. */
function src(linha) {
  return atributo(linha, "src") ?? linha.match(/(\/cursos\/media\/[^\s"'|]+)/)?.[1] ?? null;
}

function legenda(linha) {
  // `caption` é o certo; `alt` aparece quando o tradutor trocou o nome do atributo.
  const bruta = atributo(linha, "caption") ?? atributo(linha, "alt");
  return bruta?.replace(/"+$/, "").trim() ?? null;
}

/** O cabeçalho de capítulo, nas duas árvores. É ele que diz onde a figura está. */
const CABECALHO = /^#\s*(?:Cap[íi]tulo|Chapter)\s*(\d+)\s*[::]/i;

const SLOTS = ["sistema", "intencao", "fluxo", "cenario", "validacao", "dica"];
/** O tradutor traduz o slot dentro do id: `intencao` vira `intention`. */
const SLOT_EN = { system: "sistema", intention: "intencao", flow: "fluxo", scenario: "cenario", validation: "validacao", tip: "dica" };

function slotDe(linha) {
  const bruto =
    linha.match(/cap\d+-([a-zA-Z]+)\./)?.[1]?.toLowerCase() ??
    linha.match(/id\s*=?\s*"?[\w-]*-([a-zA-Z]+)"/)?.[1]?.toLowerCase();
  if (!bruto) return null;
  const s = SLOT_EN[bruto] ?? bruto;
  return SLOTS.includes(s) ? s : null;
}

/**
 * ⚠️ A CHAVE É O CAPÍTULO EM QUE A LINHA ESTÁ, NÃO O NÚMERO ESCRITO NO `src`.
 *
 * Esta foi a armadilha desta varredura, e ela passa por consertada. No
 * `ia-producao [en]`, os cinco marcadores do **capítulo 30** chegaram
 * numerados como `cap6-*` — o tradutor renumerou o caminho junto com o texto,
 * e um deles ainda inventou a pasta (`/covers/media/ia/iproducao/`). Casar
 * pelo número do `src` mandaria a arte do capítulo 6 para dentro do 30 E
 * duplicaria as figuras do 6, com o relatório dizendo "20 consertados".
 *
 * O cabeçalho `# Chapter N:` é a única âncora que a tradução preserva, porque
 * é conteúdo visível. Dele sai o capítulo; do `src`/`id` sai só o slot.
 */
function chavear(texto) {
  const linhas = texto.split("\n");
  const mapa = new Map();
  let capitulo = null;
  for (let i = 0; i < linhas.length; i++) {
    const t = linhas[i].trim();
    const cab = t.match(CABECALHO);
    if (cab) { capitulo = Number(cab[1]); continue; }
    if (!TENTATIVA.test(t)) continue;
    const slot = slotDe(t);
    if (capitulo == null || !slot) continue;
    mapa.set(i, `cap${capitulo}-${slot}`);
  }
  return mapa;
}

/** Índice do português: chave (capítulo+slot) → marcador inteiro, correto por definição. */
function indexarPt(texto) {
  const linhas = texto.split("\n");
  const chaves = chavear(texto);
  const mapa = new Map();
  for (const [i, k] of chaves) {
    const t = linhas[i].trim();
    if (CANONICO.test(t) && !mapa.has(k)) mapa.set(k, t);
  }
  return mapa;
}

function consertar(textoEn, mapaPt) {
  const linhas = textoEn.split("\n");
  const chaves = chavear(textoEn);
  const saida = [];
  const relato = { consertados: [], removidos: [], semPar: [] };
  const jaVistos = new Set();

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const t = linha.trim();
    if (!TENTATIVA.test(t)) {
      saida.push(linha);
      continue;
    }

    const k = chaves.get(i);
    const modelo = k ? mapaPt.get(k) : null;
    const cap = legenda(t);

    /**
     * Já está bom? Três coisas, não uma — e faltavam duas.
     *
     * ⚠️ Esta condição deixava passar o pior caso da varredura, e ele estava no
     * GABARITO. Em `chatgpt-zero [en]`, dois marcadores do capítulo 25 eram
     * canônicos e apontavam para o `src` certo, então caíam aqui e saíam
     * "consertados" sem ninguém tocar neles. Só que o tradutor havia trocado
     * `caption=` por `alt=` — e `curso-previa.ts` lê `caption`. A figura
     * aparecia com `<figcaption>` VAZIO: a legenda, que é um parágrafo que
     * ensina e é o único texto indexável daquela figura, sumia da árvore /en
     * sem nada quebrar.
     *
     * O `id` entra pelo mesmo motivo de fundo: `q-25-flow` no lugar de
     * `chatgp-cap25-fluxo` não muda o que se vê hoje, mas faz as duas árvores
     * pararem de casar id a id — e é assim que `conferir_marcadores_pt_en.mjs`
     * descobre marcador APAGADO pela tradução. Id que não bate transforma o
     * conferidor em alarme falso, e alarme falso é como se para de olhar.
     */
    if (
      CANONICO.test(t) &&
      modelo &&
      src(t) === src(modelo) &&
      atributo(t, "caption") &&
      atributo(t, "id") === atributo(modelo, "id") &&
      // ⚠️ E não pode ser a SEGUNDA vez que esta figura aparece. A remoção de
      // cópia vazada vivia depois deste `if`, então a cópia PERFEITA passava
      // por aqui e nunca chegava lá. Foi o que aconteceu em `ia-para-estudar
      // [en]`: o capítulo 11 tinha o `cenario` duas vezes, com legendas
      // diferentes, e o `dica` em lugar nenhum — seis marcadores no capítulo,
      // o número certo, e uma figura repetida no lugar de outra.
      !jaVistos.has(k)
    ) {
      jaVistos.add(k);
      saida.push(linha);
      continue;
    }

    if (!modelo || !cap) {
      relato.semPar.push(`${k ?? "?"} · ${t.slice(0, 90)}`);
      saida.push(linha);
      continue;
    }

    // A cópia vazada: a mesma figura do mesmo capítulo, de novo. Não repõe, remove.
    if (jaVistos.has(k)) {
      relato.removidos.push(`${k} · ${t.slice(0, 70)}`);
      continue;
    }

    // Encanamento do português, legenda do inglês.
    const certo = modelo.replace(/caption="[^"]*"/, `caption="${cap.replace(/"/g, "'")}"`);
    if (certo !== t) relato.consertados.push({ chave: k, de: t.slice(0, 64), para: certo.slice(0, 64) });
    jaVistos.add(k);
    saida.push(certo);
  }
  return { texto: saida.join("\n"), relato };
}

const cliente = new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 3 });
await cliente.connect();
const db = cliente.db(DB);

const produtos = new Map(
  (await db.collection("products").find({ type: "course" }, { projection: { slug: 1, courseContent: 1 } }).toArray())
    .filter((p) => typeof p.courseContent === "string")
    .map((p) => [p.slug, p.courseContent]),
);

let totalConsertos = 0;
let totalRemovidos = 0;
const paraGravar = [];

for (const d of await db.collection("conteudoTraduzido").find({}).toArray()) {
  if (typeof d.courseContent !== "string") continue;
  const pt = produtos.get(d.slug ?? d.courseSlug);
  if (!pt) {
    console.log(`⚠️  ${d.slug} [${d.locale}] — sem original em português, pulado`);
    continue;
  }
  const { texto, relato } = consertar(d.courseContent, indexarPt(pt));
  if (!relato.consertados.length && !relato.removidos.length && !relato.semPar.length) continue;

  console.log(`\n${d.slug} [${d.locale}]`);
  for (const c of relato.consertados) console.log(`   ✔ [${c.chave}] ${c.de}…\n     → ${c.para}…`);
  for (const r of relato.removidos) console.log(`   ✂ cópia vazada removida: ${r}…`);
  for (const s of relato.semPar) console.log(`   ⚠ sem par no português, deixado como está: ${s}…`);

  // Conferência: depois do conserto, os dois lados têm de ter os mesmos marcadores.
  const contar = (x) => (x.split("\n").filter((l) => CANONICO.test(l.trim()))).length;
  console.log(`   marcadores: ${contar(d.courseContent)} → ${contar(texto)}  (português: ${contar(pt)})`);

  /**
   * ⚠️ O que sobra aqui não é marcador torto: é marcador que a tradução APAGOU.
   *
   * Consertar a forma não traz de volta o que não veio. Estes ficam listados
   * para a re-tradução (`scripts/i18n/cursos-conteudo.mjs --refazer`), porque
   * repor a linha do português colocaria legenda EM PORTUGUÊS na árvore /en —
   * troca um buraco silencioso por um erro visível, que é pior.
   */
  const renderizaveis = (x) => {
    const ls = x.split("\n");
    return new Set([...chavear(x)].filter(([i]) => CANONICO.test(ls[i].trim())).map(([, k]) => k));
  };
  const faltam = [...renderizaveis(pt)].filter((k) => !renderizaveis(texto).has(k));
  if (faltam.length) console.log(`   ⛔ ${faltam.length} marcador(es) que a tradução APAGOU, não dá para consertar aqui: ${faltam.join(", ")}`);

  totalConsertos += relato.consertados.length;
  totalRemovidos += relato.removidos.length;
  paraGravar.push({ _id: d._id, slug: d.slug, locale: d.locale, texto });
}

console.log(`\n${totalConsertos} marcador(es) consertado(s), ${totalRemovidos} cópia(s) vazada(s) removida(s), em ${paraGravar.length} documento(s).`);

if (!GRAVAR) {
  console.log("\nEnsaio. Nada foi gravado. Use --gravar.");
} else if (paraGravar.length) {
  const backup = `conteudoTraduzido_backup_marcadores_${CARIMBO}`;
  const originais = await db.collection("conteudoTraduzido").find({ _id: { $in: paraGravar.map((x) => x._id) } }).toArray();
  await db.collection(backup).insertMany(originais.map(({ _id, ...r }) => ({ ...r, _idOriginal: _id })));
  console.log(`backup: ${DB}.${backup} (${originais.length} documento(s))`);
  for (const x of paraGravar) {
    await db.collection("conteudoTraduzido").updateOne({ _id: x._id }, { $set: { courseContent: x.texto, marcadoresConsertadosEm: new Date() } });
    console.log(`gravado: ${x.slug} [${x.locale}]`);
  }
}

await cliente.close();
