/**
 * Alinha `src/data/courses/*.ts` com o banco — preço, aulas e duração.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `@/data/courses` é o catálogo escrito à mão. Ele existe como rede de
 * segurança para banco vazio, mas NÃO é só isso: a home importa `allCourses`
 * direto no navegador para a marquise de ferramentas e para o cartão do curso
 * grátis do mês — e mostra os números de lá.
 *
 * Medido em 26/08/2026, depois de o banco passar a dizer a verdade:
 *
 *   curso                  arquivo              banco
 *   ─────────────────────  ───────────────────  ──────────────
 *   openclaw               180 aulas, R$ 167     16 capítulos, R$ 79
 *   make-integracao        150 aulas, R$  97     15 capítulos, R$ 79
 *   claude-ia-segura       170 aulas, R$  97     16 capítulos, R$ 79
 *   chatgpt-allowlisting    45 aulas, R$  57 (de R$ 397)  13 capítulos, R$ 49
 *
 * O preço do arquivo não é só velho: ele é OUTRO. `/chatgpt-allowlisting` tem
 * página própria, que lê o arquivo, e anunciava R$ 397 riscado para cobrar
 * R$ 57 enquanto o checkout cobrava R$ 49.
 *
 * ⚠️ Só toca em curso ATIVO e não aposentado. Os aposentados
 * (`chatgpt-masterclass`, `n8n-automacao-avancada`, `midjourney-arte-…`,
 * `perplexity-pesquisa-inteligente`) e o rascunho `banana-dev-deploy-ia` ficam
 * como estão: não aparecem na vitrine, e mexer neles só criaria diferença sem
 * leitor.
 *
 * ⚠️ `originalPrice` não é apagado — o tipo o exige. Ele passa a ser IGUAL ao
 * preço, e todo cartão do site já compara `originalPrice > price` antes de
 * riscar. Sem desconto para mostrar, nada é riscado.
 *
 * Uso:
 *   node scripts/sincronizar-cursos-estaticos.mjs           (simula)
 *   node scripts/sincronizar-cursos-estaticos.mjs --gravar
 */
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const GRAVAR = process.argv.includes('--gravar');
const DIR = 'src/data/courses';

const uri = fs.readFileSync('.env.local', 'utf8').match(/MONGODB_URI=(.+)/)[1].trim();
const cliente = new MongoClient(uri);
await cliente.connect();
const col = cliente.db('fayapointProdutos').collection('products');

const doBanco = Object.fromEntries(
  (
    await col
      .find({ type: 'course', status: 'active', aposentado: { $ne: true } })
      .project({ slug: 1, 'metrics.lessons': 1, 'metrics.duration': 1, 'pricing.price': 1, 'pricing.originalPrice': 1 })
      .toArray()
  ).map((p) => [p.slug, p])
);

/** Troca `campo: valor` no topo do objeto, uma vez, preservando a indentação. */
const trocar = (texto, campo, valor, aspas) => {
  const rx = new RegExp(`^(\\s*${campo}:\\s*)(?:"[^"]*"|'[^']*'|[\\d.]+)(,?)$`, 'm');
  if (!rx.test(texto)) return { texto, mudou: false };
  const novo = aspas ? `"${valor}"` : String(valor);
  let mudou = false;
  const saida = texto.replace(rx, (todo, prefixo, virgula) => {
    const linha = `${prefixo}${novo}${virgula}`;
    mudou = linha !== todo;
    return linha;
  });
  return { texto: saida, mudou };
};

let arquivosMudados = 0;
for (const arquivo of fs.readdirSync(DIR).filter((f) => f.endsWith('.ts') && f !== 'index.ts')) {
  const caminho = path.join(DIR, arquivo);
  let texto = fs.readFileSync(caminho, 'utf8');
  const slug = (texto.match(/^\s*slug:\s*['"]([^'"]+)['"]/m) || [])[1];
  const p = slug && doBanco[slug];
  if (!p) {
    console.log(`  ·  ${(slug || arquivo).padEnd(34)} fora da vitrine — intocado`);
    continue;
  }

  const preco = p.pricing?.price ?? 0;
  const antes = {
    aulas: (texto.match(/^\s*totalLessons:\s*(\d+)/m) || [])[1],
    duracao: (texto.match(/^\s*duration:\s*['"]([^'"]+)['"]/m) || [])[1],
    preco: (texto.match(/^\s*price:\s*([\d.]+)/m) || [])[1],
    de: (texto.match(/^\s*originalPrice:\s*([\d.]+)/m) || [])[1],
  };

  let mudou = false;
  for (const [campo, valor, aspas] of [
    ['totalLessons', p.metrics?.lessons ?? 0, false],
    ['duration', p.metrics?.duration ?? '', true],
    ['price', preco, false],
    ['originalPrice', preco, false],
  ]) {
    const r = trocar(texto, campo, valor, aspas);
    texto = r.texto;
    mudou = mudou || r.mudou;
  }

  if (!mudou) {
    console.log(`  =  ${slug.padEnd(34)} já alinhado`);
    continue;
  }
  arquivosMudados += 1;
  console.log(
    `  ✎  ${slug.padEnd(34)} ${antes.aulas}→${p.metrics?.lessons}  ` +
      `"${antes.duracao}"→"${p.metrics?.duration}"  R$${antes.preco}→R$${preco}  (de R$${antes.de}→R$${preco})`
  );
  if (GRAVAR) fs.writeFileSync(caminho, texto);
}

console.log(`\narquivos alterados: ${arquivosMudados}`);
console.log(GRAVAR ? 'GRAVADO.' : '(simulação — use --gravar para gravar)');
await cliente.close();
