/**
 * O retrato de prontidão do catálogo — o que decide o preço.
 *
 * Não inventa nota: mede seis sinais que existem no documento e no conteúdo.
 */
import { MongoClient } from 'mongodb';
import fs from 'fs';

const uri = fs.readFileSync('.env.local', 'utf8').match(/MONGODB_URI=(.+)/)[1].trim();
const c = new MongoClient(uri);
await c.connect();
const col = c.db('fayapointProdutos').collection('products');

const cursos = await col
  .find({ type: 'course', status: 'active', aposentado: { $ne: true } })
  .project({
    slug: 1, courseContent: 1, contentChapters: 1, metrics: 1, pricing: 1,
    honestMetrics: 1, contentComplete: 1, contentUpdatedAt: 1, updatedAt: 1,
    faqs: 1, testimonials: 1, curriculum: 1, 'i18n.en.name': 1,
  })
  .toArray();

const semMarcadores = (t) => (t || '').replace(new RegExp('<' + '!--[\\s\\S]*?--' + '>', 'g'), '');

const linhas = cursos.map((p) => {
  const cc = p.courseContent || '';
  const chars = semMarcadores(cc).length;
  const caps = p.contentChapters ?? 0;
  const midia = [...cc.matchAll(/\.(mp4|webm|webp|png|jpg)\b/gi)].length;
  const exercicios = [...cc.matchAll(/^##\s+.*(Exerc[íi]cio|Practice)/gim)].length;
  const passos = [...cc.matchAll(/^###?\s+.*(Passo|Step)\s+\d/gim)].length;
  const atualizado = p.contentUpdatedAt || p.updatedAt;
  return {
    slug: p.slug,
    caps,
    chars,
    porCap: caps ? Math.round(chars / caps) : 0,
    midia,
    exercicios,
    faqs: (p.faqs || []).length,
    honesto: p.honestMetrics === true,
    completo: p.contentComplete === true,
    en: !!p.i18n?.en?.name,
    atualizado: atualizado ? new Date(atualizado).toISOString().slice(0, 10) : '—',
    preco: p.pricing?.price,
  };
});

linhas.sort((a, b) => b.chars - a.chars);
console.log('caps  chars  por/cap  mídia  exerc  faq  honesto completo  en  atualizado   preço  curso');
for (const l of linhas) {
  console.log(
    String(l.caps).padStart(4),
    String(Math.round(l.chars / 1000) + 'k').padStart(6),
    String(l.porCap).padStart(8),
    String(l.midia).padStart(6),
    String(l.exercicios).padStart(6),
    String(l.faqs).padStart(4),
    String(l.honesto).padStart(8),
    String(l.completo).padStart(9),
    String(l.en).padStart(4),
    l.atualizado.padStart(12),
    ('R$' + l.preco).padStart(7),
    ' ', l.slug,
  );
}
await c.close();
