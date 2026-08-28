#!/usr/bin/env node
/**
 * O portão contra credencial publicada.
 *
 * `github.com/fayapoint/fayapoint` é PÚBLICO. Em 27/08/2026 três scripts
 * (`push-course-content.ts`, `seed-admin.ts`, `seed-pod-providers.ts`) estavam
 * no repositório com a MONGODB_URI de produção — usuário e senha em texto
 * puro — e a senha do admin do site junto. O padrão que publicou tudo isso é
 * sempre o mesmo:
 *
 *     process.env.X || "o-segredo-de-verdade"
 *
 * escrito para "funcionar sem configurar nada". Funciona, e publica.
 *
 * Tirar do código não resolve sozinho: a credencial já está no histórico do
 * git e em todo clone e fork. A ordem é sempre ROTACIONAR primeiro, arrumar o
 * fonte depois. Este script só impede a PRÓXIMA vez.
 *
 * Uso:
 *   node scripts/_conferir/varrer-segredos.mjs            # tudo que o git rastreia
 *   node scripts/_conferir/varrer-segredos.mjs --staged   # só o que vai no commit
 *
 * Sai com 1 se achar algo. É o que trava o commit e o CI.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const soStaged = process.argv.includes("--staged");

const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

/**
 * Cada regra descreve um segredo de verdade, não a FORMA de um segredo.
 * `mongodb+srv://host/` sem credencial embutida passa — é assim que a URI
 * aparece em documentação e em exemplo, e barrar isso ensina a desligar o
 * portão.
 */
const REGRAS = [
  {
    nome: "URI de MongoDB com usuário e senha embutidos",
    re: /mongodb(\+srv)?:\/\/[^\s'"`/]+:[^\s'"`@]+@/g,
  },
  {
    nome: 'segredo com valor padrão (`process.env.X || "literal"`)',
    // Só para nomes que denunciam segredo. NEXT_PUBLIC_* fica de fora de
    // propósito: o que vai para o navegador já é público por definição.
    re: /process\.env\.(?!NEXT_PUBLIC_)[A-Z0-9_]*(URI|SECRET|TOKEN|PASSWORD|SENHA|API_KEY|KEY)[A-Z0-9_]*\s*\|\|\s*['"`][^'"`\n]{8,}['"`]/g,
  },
  { nome: "chave da OpenRouter", re: /sk-or-v1-[A-Za-z0-9]{24,}/g },
  { nome: "chave da OpenAI", re: /\bsk-(proj-)?[A-Za-z0-9_-]{32,}/g },
  { nome: "chave viva da Stripe", re: /\b[sr]k_live_[A-Za-z0-9]{16,}/g },
  { nome: "chave da Asaas", re: /\$aact_[A-Za-z0-9_=-]{16,}/g },
  { nome: "token do Mercado Pago", re: /APP_USR-\d{6,}-\d{6}-[a-f0-9]{24,}/g },
  { nome: "token do GitHub", re: /\bgh[pousr]_[A-Za-z0-9]{30,}/g },
  { nome: "token de bot do Slack", re: /xox[baprs]-\d{8,}-[A-Za-z0-9-]{16,}/g },
  { nome: "chave de API do Google", re: /\bAIza[A-Za-z0-9_-]{35}\b/g },
  {
    nome: "URL da Cloudinary com api_secret",
    re: /cloudinary:\/\/\d+:[A-Za-z0-9_-]{12,}@/g,
  },
  {
    nome: "chave privada",
    // A do modelo de `.env` vem com o miolo trocado por reticencias; so a
    // linha inteira revela isso, o marcador casado sozinho nao.
    linhaToda: true,
    re: /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g,
  },
];

// Arquivos que só FALAM sobre o vazamento não podem disparar o portão que
// eles mesmos documentam.
const ISENTOS = new Set([
  "scripts/_conferir/varrer-segredos.mjs",
  ".github/workflows/segredos.yml",
  ".githooks/pre-commit",
]);

// Duas coisas que casam o padrão e não são segredo. Sem elas o portão grita
// no modelo de `.env` da documentação e no COMENTÁRIO que explica o defeito —
// e portão que grita à toa é portão que alguém desliga.
const PLACEHOLDER = /(x{4,}|\.\.\.|<[a-z-]+>|your-|seu-|exemplo|example|placeholder|change-?me|\\n)/i;
const COMENTARIO = /^\s*(\*|\/\/|#|-)/;

const BINARIO =
  /\.(png|jpe?g|gif|webp|avif|mp4|mov|webm|mp3|wav|m4a|pdf|zip|gz|ico|woff2?|ttf|otf|lock)$/i;

const alvos = (
  soStaged
    ? git("diff", "--cached", "--name-only", "--diff-filter=ACMR")
    : git("ls-files")
)
  .split("\n")
  .map((s) => s.trim())
  .filter((s) => s && !ISENTOS.has(s) && !BINARIO.test(s));

const achados = [];
for (const arquivo of alvos) {
  let texto;
  try {
    // No modo --staged lê o BLOB indexado, não o disco: é ele que vai no
    // commit, e ele pode diferir do arquivo aberto no editor.
    texto = soStaged ? git("show", `:${arquivo}`) : readFileSync(arquivo, "utf8");
  } catch {
    continue; // apagado, submódulo, ou binário que escapou da lista de extensões
  }
  if (texto.includes("\u0000")) continue; // binario sem extensao conhecida
  const linhas = texto.split("\n");
  for (const regra of REGRAS) {
    linhas.forEach((linha, i) => {
      regra.re.lastIndex = 0;
      const m = regra.re.exec(linha);
      if (!m) return;
      const alvoDoMarcador = regra.linhaToda ? linha : m[0];
      if (PLACEHOLDER.test(alvoDoMarcador) || COMENTARIO.test(linha)) return;
      achados.push({
        arquivo,
        linha: i + 1,
        regra: regra.nome,
        // Nunca imprime o segredo inteiro: o log do CI é público.
        trecho: m[0].slice(0, 12) + "…",
      });
    });
  }
}

if (achados.length === 0) {
  console.log(
    `✅ nenhuma credencial em ${alvos.length} arquivo(s)${
      soStaged ? " no commit" : " rastreado(s)"
    }.`,
  );
  process.exit(0);
}

console.error(`\n⛔ ${achados.length} credencial(is) no que ia ser publicado:\n`);
for (const a of achados) {
  console.error(`   ${a.arquivo}:${a.linha}`);
  console.error(`     ${a.regra} → ${a.trecho}\n`);
}
console.error("Leia o segredo do ambiente e falhe explícito se faltar:");
console.error("  ✅ const URI = uriDoMongo();            // scripts/lib/mongo.mjs");
console.error('  ⛔ const URI = process.env.X || "…";    // valor padrão é segredo publicado\n');
console.error("Se já foi commitado uma vez: ROTACIONE a credencial primeiro.");
console.error("Tirar do fonte não a apaga do histórico nem dos forks.\n");
process.exit(1);
