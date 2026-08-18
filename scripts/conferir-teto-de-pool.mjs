/**
 * A guarda que impede o teto de pool de sumir outra vez.
 *
 *     node scripts/conferir-teto-de-pool.mjs
 *
 * ## O que ela procura
 *
 * `new MongoClient(uri)` — sem segundo argumento. Sem opções, o driver assume
 * `maxPoolSize: 100`, e o cluster grátis inteiro tem **500 conexões**,
 * compartilhadas com `mission-control`, `worldforge`, `content_factory_ai` e
 * todo script rodando na máquina. Dois scripts assim ao mesmo tempo valem 40%
 * do cluster.
 *
 * ## Por que uma guarda, e não só o conserto
 *
 * Porque isto já voltou. Em 13/08/2026 o teto foi posto em cinco lugares e o
 * problema continuou (eram cinco POOLS, não um sem teto). Em 17/08 os scripts
 * ficaram protegidos só pela `MONGODB_URI` do `.env.local` — que **não vai para
 * o Git**, então o teto não existia num clone, numa máquina nova, nem para
 * ninguém além do Ricardo. Um arquivo novo escrito daqui a três meses, copiando
 * o padrão do vizinho, reabre o buraco sem que ninguém perceba: o sintoma não é
 * erro, é o site ficando lento numa terça-feira.
 *
 * ## Quando um cliente PODE não ter opções
 *
 * Ponha `// sem-teto-de-proposito:` na linha de cima, com o motivo. Hoje existe
 * um caso: `mongo-saude.mjs` constrói um cliente só para LER o que a URI
 * declara (opção do construtor esconderia justamente o que ele quer medir), e
 * esse cliente nunca chama `connect()`.
 *
 * ⚠️ Em código de RUNTIME (`src/`) não há exceção: peça o cliente compartilhado
 * a `src/lib/mongo-cliente.ts`. Um `MongoClient` novo numa rota custa 4
 * conexões por instância da Netlify.
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const PASTAS = ["scripts", "src", "netlify"];
const PERMISSAO = "sem-teto-de-proposito";

/** `new MongoClient(` sem vírgula de topo antes do fecho = sem opções. */
const SEM_OPCOES = /new MongoClient\(([^(),]*(?:\([^()]*\))?[^(),]*)\)/;

function arquivos() {
  const saida = execSync(
    `git ls-files ${PASTAS.join(" ")}`,
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  return saida.split("\n").filter((f) => /\.(m?js|cjs|ts|tsx)$/.test(f));
}

const achados = [];
for (const arquivo of arquivos()) {
  if (arquivo.startsWith("scripts/lib/mongo.")) continue;      // é a própria fonte
  if (arquivo === "scripts/conferir-teto-de-pool.mjs") continue; // e este, que descreve o padrão

  let linhas;
  try {
    linhas = readFileSync(arquivo, "utf8").split("\n");
  } catch {
    continue; // arquivo versionado mas ausente na árvore
  }

  linhas.forEach((linha, i) => {
    if (!linha.includes("new MongoClient(")) return;
    if (!SEM_OPCOES.test(linha)) return;                 // tem segundo argumento
    if (linha.trimStart().startsWith("*")) return;       // exemplo dentro de comentário
    const acima = (linhas[i - 1] || "") + linha;
    if (acima.includes(PERMISSAO)) return;
    achados.push({ arquivo, n: i + 1, linha: linha.trim() });
  });
}

if (achados.length === 0) {
  console.log("✅ nenhum MongoClient sem teto de pool.");
  process.exit(0);
}

console.error(`\n⛔ ${achados.length} cliente(s) Mongo SEM teto de pool:\n`);
for (const a of achados) {
  console.error(`   ${a.arquivo}:${a.n}`);
  console.error(`      ${a.linha}`);
}
console.error(
  `\n   Conserto num script:  importe OPCOES_DE_SCRIPT de scripts/lib/mongo.cjs (ou .mjs)` +
    `\n                         e passe como 2º argumento — a URI do script fica como está.` +
    `\n   Conserto no site:     use clienteMongo() de src/lib/mongo-cliente.ts. NÃO abra cliente novo.` +
    `\n   Exceção legítima:     comente "// ${PERMISSAO}: <motivo>" na linha de cima.\n`,
);
process.exit(1);
