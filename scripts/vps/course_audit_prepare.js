#!/usr/bin/env node
// Prepara a auditoria de qualidade de um curso FayAI (19/07/2026 — FIX).
//
// BUG CORRIGIDO: a versão anterior exportava fayapoint.courses.modules[].lessons[].content,
// que é DADO MORTO para a maioria do catálogo — o reader real (/api/courses/[slug]/content)
// SEMPRE renderiza fayapointProdutos.products.courseContent, dividido em capítulos só pelos
// H1 de topo (ver src/lib/course-content-sanitizer.ts). Cursos "editoriais" (a maioria do
// catálogo) têm um courseContent totalmente diferente das lessons[].content — o auditor
// vinha avaliando ~150-250 "aulas" de boilerplate morto que nenhum aluno nunca leu (ex.:
// chatgpt-masterclass: 790KB de lixo morto vs. 65KB de conteúdo real em 16 seções). Isso
// também explica o hang em cursos grandes: 12x mais texto que o necessário.
//
// - Escolhe o curso: argv[2] OU o ativo com auditoria mais antiga (rotação)
// - Exporta meta.json + outline.md + lessons/*.md (1 arquivo por H1 real) para
//   /root/.hermes/course-audit/<slug>/ (= /opt/data/course-audit/<slug>/ no container kirmes)
// - Resolve tokens {{fact:...}} pro valor atual (mesma lógica do reader) — sem isso o
//   auditor veria "peça ao {{fact:openai-flagship}}" e não teria como avaliar atualidade.
// - Imprime o slug escolhido no stdout (consumido pelo shell)
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('/root/openclaw/task-executor/node_modules/mongodb');

const OUT_BASE = '/root/.hermes/course-audit';
const TOP_LEVEL_HEADING_SPLIT = /(?=^# [^#].*$)/gm;

function loadUri() {
  const env = fs.readFileSync('/root/openclaw/task-executor/.env', 'utf8');
  const m = env.match(/^MONGODB_URI=(.+)$/m);
  if (!m) throw new Error('MONGODB_URI não encontrado no .env do executor');
  return m[1].trim();
}

function slugify(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

function splitTopLevelSections(markdown) {
  return markdown.replace(/\r\n/g, '\n').split(TOP_LEVEL_HEADING_SPLIT)
    .map((s) => s.trim()).filter(Boolean);
}

function applyContentFacts(text, facts) {
  if (!text || !text.includes('{{fact:')) return text;
  return text.replace(/\{\{fact:([a-z0-9-]+)\}\}/g, (raw, key) => facts.get(key) ?? raw);
}

(async () => {
  const client = await MongoClient.connect(loadUri());
  try {
    const prods = client.db('fayapointProdutos').collection('products');
    const audits = client.db('mission-control').collection('courseaudits');
    const factsColl = client.db('fayapointProdutos').collection('content_facts');

    let slug = process.argv[2];
    if (!slug) {
      const active = await prods
        .find({ status: 'active', type: 'course' }, { projection: { slug: 1 } })
        .toArray();
      const lastBySlug = {};
      for (const a of await audits
        .aggregate([{ $group: { _id: '$slug', last: { $max: '$createdAt' } } }])
        .toArray()) {
        lastBySlug[a._id] = a.last;
      }
      active.sort((x, y) => {
        const lx = lastBySlug[x.slug] ? new Date(lastBySlug[x.slug]).getTime() : 0;
        const ly = lastBySlug[y.slug] ? new Date(lastBySlug[y.slug]).getTime() : 0;
        return lx - ly;
      });
      if (active.length === 0) throw new Error('Nenhum produto ativo de curso');
      slug = active[0].slug;
    }

    const course = await client.db('fayapoint').collection('courses').findOne({ slug });
    if (!course) throw new Error(`Curso não encontrado em fayapoint.courses: ${slug}`);
    const product = await prods.findOne({ slug }, { projection: { name: 1, title: 1, tool: 1, courseContent: 1, 'pricing.price': 1 } });
    if (!product || typeof product.courseContent !== 'string' || !product.courseContent.trim()) {
      throw new Error(`courseContent ausente/vazio em fayapointProdutos.products para: ${slug}`);
    }

    const facts = new Map((await factsColl.find({}).toArray()).map((d) => [d.key, d.value]));
    const resolvedContent = applyContentFacts(product.courseContent, facts);
    const sections = splitTopLevelSections(resolvedContent);
    if (sections.length === 0) throw new Error(`courseContent não produziu nenhuma seção H1 para: ${slug}`);

    const dir = path.join(OUT_BASE, slug);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(path.join(dir, 'lessons'), { recursive: true });

    const meta = {
      slug,
      title: product.name || product.title || course.title,
      subtitle: course.subtitle || '',
      description: course.description || '',
      tool: product?.tool || course.tools || '',
      level: course.level || '',
      price: product?.pricing?.price ?? course.price?.amount ?? null,
      updatedAt: course.updatedAt || null,
      modules: (course.modules || []).length,
      lessons: sections.length, // agora = nº real de seções H1, não o curriculum vendido
    };
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));

    let outline = `# ${meta.title}\n\n${meta.subtitle}\n\n`;
    sections.forEach((section, i) => {
      const heading = section.split('\n')[0].replace(/^#\s+/, '').trim();
      const file = `lessons/${String(i + 1).padStart(2, '0')}-${slugify(heading)}.md`;
      outline += `- ${heading} → ${file}\n`;
      fs.writeFileSync(path.join(dir, file), section + '\n');
    });
    fs.writeFileSync(path.join(dir, 'outline.md'), outline);

    process.stdout.write(slug);
  } finally {
    await client.close();
  }
})().catch((e) => {
  console.error('PREPARE_ERROR:', e.message);
  process.exit(1);
});
