/**
 * A RÉGUA DO `chatgpt-zero` — auditoria estrutural, SÓ LEITURA (16/08/2026).
 *
 * ## Por que existe
 *
 * Ricardo: *"vamos fazer os ajustes em todos os textos, para seguir o padrão do
 * ChatGPT do Zero"*.
 *
 * O plano de 13/08 já tinha os números brutos — `chatgpt-zero` com 36 blocos e
 * 236 mil caracteres contra `prompt-engineering` com 25 e 124 mil — mas número
 * bruto não é padrão. "Escreva mais" não é instrução acionável: o autor precisa
 * saber de QUE o capítulo do `chatgpt-zero` é feito, capítulo a capítulo, para
 * saber o que falta no dele.
 *
 * Este script não escreve nada. Ele extrai a anatomia do curso-régua e mede
 * todos os outros contra ela, produzindo a tabela do que falta em cada um.
 *
 * ## Rodar
 *
 *     cd fayapoint-ai
 *     node --env-file=.env.local scripts/regua-chatgpt-zero.mjs
 *     node --env-file=.env.local scripts/regua-chatgpt-zero.mjs --curso=prompt-engineering
 *
 * ⚠️ Lê `fayapointProdutos.products.courseContent`, que é a fonte da verdade do
 * texto — não os markdowns de `cursos/`, que são rascunho e divergem.
 */

import { MongoClient } from "mongodb";

const REGUA = "chatgpt-zero";

/**
 * Os traços que fazem um capítulo ser material de trabalho e não um artigo.
 *
 * ⚠️ Cada um é uma REGEX sobre o markdown do capítulo, e a escolha de cada
 * regex é uma decisão editorial: `tabela` procura `|---|` porque tabela feita
 * com hífen alinhado é tabela de verdade; `passoAPasso` procura lista numerada
 * de 3+ itens porque "1) faça isso" solto numa frase não é procedimento.
 */
const TRACOS = {
  subtitulos: (t) => (t.match(/^##\s+/gm) || []).length,
  subsubtitulos: (t) => (t.match(/^###\s+/gm) || []).length,
  imagens: (t) => (t.match(/!\[[^\]]*\]\([^)]*\)/g) || []).length,
  videos: (t) => (t.match(/<video|\.webm|\.mp4/g) || []).length,
  tabelas: (t) => (t.match(/^\|[^\n]*\|\s*$\n^\|[\s:|-]+\|\s*$/gm) || []).length,
  blocosDeCodigo: (t) => (t.match(/^```/gm) || []).length / 2,
  citacoes: (t) => (t.match(/^>\s+/gm) || []).length,
  listas: (t) => (t.match(/^\s*[-*]\s+/gm) || []).length,
  passoAPasso: (t) => (t.match(/^\s*\d+[.)]\s+/gm) || []).length,
  negritos: (t) => (t.match(/\*\*[^*]+\*\*/g) || []).length,
  slotsDeExemplo: (t) => (t.match(/<!--\s*exemplo/gi) || []).length,
};

/**
 * ── O QUE DE FATO É "O PADRÃO" ──────────────────────────────────────────
 *
 * A tabela de medianas mostrou que o `chatgpt-zero` não tem uma média: tem um
 * GABARITO. Em todos os 30 blocos, `subtitulos` vai de 8 a 8, `passoAPasso` de
 * 5 a 5, `citacoes` de 1 a 1. Isso não é um curso bem escrito por acaso — é um
 * molde aplicado.
 *
 * Então "seguir o padrão do ChatGPT do Zero" não é "escrever mais". É ter
 * ESTAS oito seções, nesta ordem, com estas seis peças de mídia. Medir
 * caractere sem medir isso diria que `rag-knowledge` (123% da régua) já está
 * pronto — e diria certo pelo motivo errado.
 */
const SECOES_PADRAO = [
  "Visão Geral",
  "Conceitos-Chave",
  "Fluxo de Execução",
  "Cenários Aplicados",
  "Erros Comuns",
  "Exercício Prático",
  "Checklist de Implementação",
  "Resumo do Capítulo",
];

/**
 * ⚠️ O gabarito existe em INGLÊS também, e ignorar isso faz a auditoria mentir.
 *
 * `mastering-ai-with-chatgpt` marcava 0/8 seções e caía no vermelho junto com
 * os cursos de texto corrido — quando na verdade ele é o MESMO molde, com
 * "Overview / Key Concepts / Execution Workflow / …". Mandá-lo para a fila de
 * reestruturação teria reescrito um curso que já está no padrão.
 *
 * Cada posição casa com a mesma posição de `SECOES_PADRAO`.
 */
const SECOES_PADRAO_EN = [
  "Overview",
  "Key Concepts",
  "Execution Workflow",
  "Applied Scenarios",
  "Common Mistakes",
  "Practical Exercise",
  "Implementation Checklist",
  "Chapter Summary",
];

/** As seis peças por capítulo, pelo sufixo do `id` no marcador `<!--media:…-->`. */
const MIDIA_PADRAO = [
  { papel: "sistema", tipo: "img" },
  { papel: "intencao", tipo: "img" },
  { papel: "fluxo", tipo: "video" },
  { papel: "cenario", tipo: "img" },
  { papel: "validacao", tipo: "img" },
  { papel: "dica", tipo: "video" },
];

const normalizar = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

function conformidade(corpo) {
  const secoes = (corpo.match(/^##\s+(.+)$/gm) || []).map((l) => normalizar(l.replace(/^##\s+/, "")));
  // Casa contra os dois idiomas por POSIÇÃO: a seção 3 é "Fluxo de Execução"
  // ou "Execution Workflow", e as duas contam como a mesma seção do gabarito.
  const temSecao = SECOES_PADRAO.map(
    (s, i) => secoes.includes(normalizar(s)) || secoes.includes(normalizar(SECOES_PADRAO_EN[i])),
  );
  const marcadores = corpo.match(/<!--media:(img|video)\s+id="[^"]*"/g) || [];
  const temMidia = MIDIA_PADRAO.map((m) =>
    marcadores.some((x) => x.includes(`-${m.papel}"`) && x.includes(`media:${m.tipo}`)),
  );
  return {
    secoesOk: temSecao.filter(Boolean).length,
    secoesFaltando: SECOES_PADRAO.filter((_, i) => !temSecao[i]),
    // ⚠️ Ordem conta: "Erros Comuns" antes de "Fluxo de Execução" ensina o erro
    // antes de o aluno saber o que é acertar.
    ordemOk:
      secoes.filter((s) => SECOES_PADRAO.some((p) => normalizar(p) === s)).join("|") ===
      SECOES_PADRAO.filter((p) => secoes.includes(normalizar(p))).map(normalizar).join("|"),
    midiaOk: temMidia.filter(Boolean).length,
    midiaFaltando: MIDIA_PADRAO.filter((_, i) => !temMidia[i]).map((m) => m.papel),
    temDicaPro: /^>\s*\*\*Dica Pro/im.test(corpo),
  };
}

function anatomia(corpo) {
  const out = { caracteres: corpo.length, palavras: corpo.split(/\s+/).filter(Boolean).length };
  for (const [nome, fn] of Object.entries(TRACOS)) out[nome] = Math.round(fn(corpo));
  return out;
}

function capitulos(markdown) {
  return markdown
    .replace(/\r\n/g, "\n")
    .split(/(?=^# [^#].*$)/gm)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((corpo) => ({ titulo: (corpo.split("\n")[0] || "").replace(/^#\s+/, "").trim(), corpo }))
    .filter((c) => c.titulo);
}

const mediana = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

function perfil(caps) {
  const p = {};
  for (const chave of ["caracteres", "palavras", ...Object.keys(TRACOS)]) {
    const vals = caps.map((c) => c.anatomia[chave]);
    p[chave] = {
      mediana: mediana(vals),
      min: Math.min(...vals),
      max: Math.max(...vals),
      // Em quantos capítulos o traço aparece pelo menos uma vez. É o número
      // que separa "recurso do curso" de "aconteceu uma vez no capítulo 4".
      presencaPct: Math.round((vals.filter((v) => v > 0).length / vals.length) * 100),
    };
  }
  return p;
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI ausente — rode com `node --env-file=.env.local`.");
  process.exit(1);
}

const alvo = (process.argv.find((a) => a.startsWith("--curso=")) || "").split("=")[1];

const client = new MongoClient(uri);
await client.connect();
const col = client.db("fayapointProdutos").collection("products");

const docs = await col
  .find({ courseContent: { $exists: true, $ne: "" } }, { projection: { slug: 1, name: 1, courseContent: 1 } })
  .toArray();

const cursos = docs
  .map((d) => {
    const caps = capitulos(String(d.courseContent || "")).map((c) => ({
      ...c,
      anatomia: anatomia(c.corpo),
      conformidade: conformidade(c.corpo),
    }));
    return { slug: d.slug, nome: d.name, caps, total: String(d.courseContent || "").length };
  })
  .filter((c) => c.caps.length > 0);

const regua = cursos.find((c) => c.slug === REGUA);
if (!regua) {
  console.error(`Curso-régua "${REGUA}" não encontrado.`);
  process.exit(1);
}
const perfilRegua = perfil(regua.caps);

console.log(`\n═══ A RÉGUA: ${regua.nome} (${regua.slug}) ═══`);
console.log(`${regua.caps.length} blocos · ${regua.total.toLocaleString("pt-BR")} caracteres\n`);
console.log("Por capítulo — mediana (min–max) · em % dos capítulos:");
for (const [k, v] of Object.entries(perfilRegua)) {
  console.log(
    `  ${k.padEnd(16)} ${String(v.mediana).padStart(6)}  (${v.min}–${v.max})`.padEnd(46) +
      `· ${v.presencaPct}%`,
  );
}

if (alvo) {
  const c = cursos.find((x) => x.slug === alvo);
  if (!c) {
    console.error(`\nCurso "${alvo}" não encontrado.`);
    process.exit(1);
  }
  console.log(`\n═══ ${c.nome} (${c.slug}), capítulo a capítulo ═══\n`);
  const cols = ["caracteres", "subtitulos", "imagens", "tabelas", "passoAPasso", "listas", "citacoes"];
  console.log("  # " + cols.map((k) => k.slice(0, 11).padStart(12)).join("") + "  título");
  c.caps.forEach((cap, i) => {
    const linha = cols.map((k) => String(cap.anatomia[k]).padStart(12)).join("");
    const magro = cap.anatomia.caracteres < perfilRegua.caracteres.mediana * 0.6;
    console.log(`${String(i).padStart(3)} ${linha}  ${magro ? "⚠ " : "  "}${cap.titulo.slice(0, 46)}`);
  });
  console.log(`\n⚠ = abaixo de 60% da mediana da régua (${perfilRegua.caracteres.mediana} caracteres)`);
} else {
  console.log(`\n═══ TODOS OS CURSOS CONTRA A RÉGUA ═══\n`);
  const cols = ["caracteres", "subtitulos", "imagens", "tabelas", "passoAPasso"];
  /**
   * ⚠️ A largura vem do slug MAIS LONGO, nunca de um número escrito à mão.
   *
   * A primeira versão cortava em 31 caracteres e produziu uma mentira:
   * `perplexity-pesquisa-inteligente` e
   * `perplexity-pesquisa-inteligente-e-conhecimento-instantaneo` viraram duas
   * linhas com o MESMO nome e números diferentes — o que se lê como slug
   * duplicado no banco. Tabela de auditoria não pode truncar a chave.
   */
  const larg = Math.max(...cursos.map((c) => c.slug.length)) + 2;
  console.log(
    "curso".padEnd(larg + 2) +
      "caps" +
      cols.map((k) => k.slice(0, 10).padStart(12)).join("") +
      "   %régua  seções  mídia",
  );
  const ordenado = cursos
    .map((c) => {
      const p = perfil(c.caps);
      const pct = Math.round((p.caracteres.mediana / perfilRegua.caracteres.mediana) * 100);
      // Conformidade = média, entre os capítulos, de quantas das 8 seções e das
      // 6 peças de mídia existem. É o número que decide o trabalho.
      const sec = mediana(c.caps.map((x) => x.conformidade.secoesOk));
      const mid = mediana(c.caps.map((x) => x.conformidade.midiaOk));
      return { c, p, pct, sec, mid };
    })
    .sort((a, b) => a.sec + a.mid - (b.sec + b.mid) || a.pct - b.pct);

  for (const { c, p, pct, sec, mid } of ordenado) {
    const conforme = sec === 8 && mid === 6;
    const marca = c.slug === REGUA ? "★" : conforme ? "🟢" : sec >= 8 ? "🟡" : "🔴";
    console.log(
      `${marca} ${c.slug.padEnd(larg)}${String(c.caps.length).padStart(4)}` +
        cols.map((k) => String(p[k].mediana).padStart(12)).join("") +
        `${String(pct).padStart(8)}%` +
        `${String(sec).padStart(7)}/8` +
        `${String(mid).padStart(6)}/6`,
    );
  }
  console.log(
    "\n(medianas POR CAPÍTULO · %régua = caracteres vs. chatgpt-zero · seções = das 8 do gabarito · mídia = das 6 peças)",
  );
  console.log("🔴 falta estrutura · 🟡 tem as seções, falta mídia · 🟢 conforme");
  console.log("Para o detalhe de um curso: --curso=<slug>");
}

await client.close();
