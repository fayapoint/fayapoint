/**
 * Conserta as duas frases do `ia-no-whatsapp` que dependiam de tokens que nunca
 * existiram (03/08/2026).
 *
 * ── O que aconteceu ────────────────────────────────────────────────────────
 *
 * O laço escreveu `{{fact:token}}` e `{{fact:meta-precos}}` no conteúdo do
 * curso. Nenhuma das duas chaves foi jamais criada em
 * `fayapointProdutos.content_facts`, então o aluno via a chave crua no meio da
 * frase. Em 03/08 o `applyContentFacts` passou a APAGAR token órfão em vez de
 * exibi-lo — o que impede servir o defeito, mas não conserta o texto:
 *
 *   antes do conserto do resolvedor:  "...o que foi dito. {{fact:token}} não se aplica aqui — a dica..."
 *   depois:                           "...o que foi dito.não se aplica aqui — a dica..."
 *
 * ⚠️ Repare que ficou PIOR de ler, não melhor: o regex do resolvedor consome o
 * espaço antes do token (`\s*\{\{fact:`), então o ponto final gruda na palavra
 * seguinte e a oração perde o sujeito. Só a reescrita do texto resolve.
 *
 * ── As duas correções ──────────────────────────────────────────────────────
 *
 * 1. A frase do ManyChat perdeu o sujeito. A oração "X não se aplica aqui" só
 *    existia para negar o token; sem ele, a informação útil é a segunda metade.
 *    Vira uma frase direta, sem prótese.
 *
 * 2. A frase da tabela da Meta já está completa sem o token — ele era um
 *    apêndice no fim do parágrafo. Basta remover o resto pendurado.
 *
 * Nenhuma das duas cita modelo de IA, então não precisa de token novo nem de
 * pesquisa: o conserto é de redação, não de fato.
 *
 *   node --env-file=.env.local scripts/consertar-frases-orfas.mjs           # ensaio
 *   node --env-file=.env.local scripts/consertar-frases-orfas.mjs --gravar
 */

import { MongoClient } from "mongodb";
// O teto do pool. Sem ele o driver assume maxPoolSize:100, e o cluster
// grátis inteiro tem 500 — divididas com os outros projetos.
// Ver `scripts/lib/mongo.cjs`.
import { OPCOES_DE_SCRIPT } from "./lib/mongo.mjs";
import { invalidarCache } from "./lib/invalidar-cache.mjs";

const SLUG = "ia-no-whatsapp";

/**
 * As substituições, literais.
 *
 * ⚠️ Buscar pelo texto EXATO e não por regex sobre o token: apagar só o token
 * deixaria "não se aplica aqui" órfão, que é exatamente o defeito. O que se
 * conserta aqui é a frase inteira.
 */
const TROCAS = [
  {
    de: "{{fact:token}} não se aplica aqui — a dica vale para qualquer versão do ManyChat.",
    para: "A dica vale para qualquer versão do ManyChat.",
  },
  {
    de: " {{fact:meta-precos}}",
    para: "",
  },
];

const gravar = process.argv.includes("--gravar");

/**
 * Aplica as trocas em todo campo de texto da estrutura, seja qual for o
 * formato.
 *
 * ⚠️ O `courseContent` tem três formatos diferentes no catálogo (herança de
 * três gerações do gerador). Percorrer a árvore genericamente evita ter que
 * saber em qual deles este curso está — e evita o conserto funcionar hoje e
 * calar amanhã, quando alguém regerar o curso noutro formato.
 */
function trocarNaArvore(no, contador) {
  if (typeof no === "string") {
    let s = no;
    for (const t of TROCAS) {
      if (s.includes(t.de)) {
        contador[t.de] = (contador[t.de] || 0) + 1;
        s = s.split(t.de).join(t.para);
      }
    }
    return s;
  }
  if (Array.isArray(no)) return no.map((x) => trocarNaArvore(x, contador));
  if (no && typeof no === "object") {
    const saida = {};
    for (const [k, v] of Object.entries(no)) saida[k] = trocarNaArvore(v, contador);
    return saida;
  }
  return no;
}

const cli = new MongoClient(process.env.MONGODB_URI_PRODUTOS || process.env.MONGODB_URI, OPCOES_DE_SCRIPT);
await cli.connect();
try {
  const col = cli.db("fayapointProdutos").collection("products");
  const doc = await col.findOne({ slug: SLUG }, { projection: { courseContent: 1, slug: 1 } });
  if (!doc) throw new Error(`curso ${SLUG} não encontrado`);

  const contador = {};
  const novo = trocarNaArvore(doc.courseContent, contador);

  for (const t of TROCAS) {
    const n = contador[t.de] || 0;
    console.log(`${n > 0 ? "✓" : "·"} ${n} ocorrência(s)  ${JSON.stringify(t.de.slice(0, 70))}`);
  }

  const total = Object.values(contador).reduce((a, b) => a + b, 0);
  if (total === 0) {
    console.log("\nNada a fazer — as frases já estão consertadas (ou o texto mudou).");
  } else if (!gravar) {
    console.log(`\nEnsaio: ${total} troca(s) prontas. Rode com --gravar para aplicar.`);
  } else {
    await col.updateOne({ slug: SLUG }, { $set: { courseContent: novo } });
    await invalidarCache(SLUG);
    console.log(`\nGravado: ${total} troca(s) em ${SLUG}.`);
  }

  // A prova: nenhum token órfão sobrou. Contar os que ficaram é mais confiável
  // que confiar no número de trocas — se o laço escrever um terceiro órfão
  // amanhã, esta linha o denuncia.
  const restantes = [...JSON.stringify(novo).matchAll(/\{\{fact:([a-z0-9-]+)\}\}/g)].map((m) => m[1]);
  const unicos = [...new Set(restantes)];
  console.log(`Tokens {{fact:}} restantes neste curso: ${restantes.length} (${unicos.join(", ") || "nenhum"})`);
} finally {
  await cli.close();
}
