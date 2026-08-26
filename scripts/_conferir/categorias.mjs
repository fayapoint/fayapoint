import { MongoClient } from 'mongodb';
import fs from 'fs';
import { contarPorCategoria, ehDaCategoria } from '../../src/lib/categoria-de-curso.ts';

const uri = fs.readFileSync('.env.local', 'utf8').match(/MONGODB_URI=(.+)/)[1].trim();
const c = new MongoClient(uri);
await c.connect();
const cursos = await c.db('fayapointProdutos').collection('products')
  .find({ type: 'course', status: 'active', aposentado: { $ne: true } })
  .project({ slug: 1, categoryPrimary: 1, categorySecondary: 1, tags: 1 }).toArray();

const slugs = ['ia-generativa', 'criacao-visual', 'automacao', 'agentes-ia', 'pesquisa-analise', 'ia-negocios'];
for (const s of slugs) {
  const quais = cursos.filter((p) => ehDaCategoria(p, s)).map((p) => p.slug.slice(0, 24));
  console.log(String(contarPorCategoria(cursos, s)).padStart(3), s.padEnd(18), quais.join(', ').slice(0, 96));
}
const alcancados = new Set();
for (const s of slugs) cursos.filter((p) => ehDaCategoria(p, s)).forEach((p) => alcancados.add(p.slug));
console.log(`\nalcançados por alguma categoria: ${alcancados.size}/${cursos.length}`);
console.log('fora:', cursos.filter((p) => !alcancados.has(p.slug)).map((p) => `${p.slug.slice(0, 22)} (${p.categoryPrimary})`).join(' · '));
await c.close();
