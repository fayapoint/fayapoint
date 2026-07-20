import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { SEED_NEWS, type AiNewsItem } from "@/data/landing/seed-news";

export interface AiNewsArticle extends AiNewsItem {
  body?: string[]; // parágrafos da análise FayAI
  sourceImage?: string; // og:image da matéria original (exibida com crédito)
}

// Capas editoriais do Blog IA Hoje — "geradas por nós" (IDENTIDADE_VISUAL.md §12.1)
// FIX 20/07/2026: cada editoria tinha 1 única capa fixa, sempre a mesma para
// toda matéria daquela tag (Ricardo notou repetição). Agora cada editoria tem
// um POOL de capas (a original + 4-6 novas geradas via ComfyUI) e o sorteio é
// por hash do slug do artigo — mesma matéria sempre mostra a mesma capa (sem
// flicker entre renders), mas matérias diferentes da mesma editoria variam.
const BLOG_COVER_POOLS: Record<string, string[]> = {
  "tendencia": [
    "/blog/covers/tendencia.webp",
    "/blog/covers/pool/tendencia-01-radar-tempestade.webp",
    "/blog/covers/pool/tendencia-02-prancha-onda.webp",
    "/blog/covers/pool/tendencia-03-jornal-seta.webp",
    "/blog/covers/pool/tendencia-04-estufa-muda.webp",
  ],
  "ferramentas": [
    "/blog/covers/ferramentas.webp",
    "/blog/covers/pool/ferramentas-01-caixa-ferramentas.webp",
    "/blog/covers/pool/ferramentas-02-batedeira-magica.webp",
    "/blog/covers/pool/ferramentas-03-oficina-bike.webp",
    "/blog/covers/pool/ferramentas-04-prateleira-loja.webp",
  ],
  "negocios": [
    "/blog/covers/negocios.webp",
    "/blog/covers/pool/negocios-01-sala-reuniao.webp",
    "/blog/covers/pool/negocios-02-planilha-grafico.webp",
    "/blog/covers/pool/negocios-03-aperto-mao-contrato.webp",
    "/blog/covers/pool/negocios-04-vitrine-esgotado.webp",
  ],
  "pesquisa": [
    "/blog/covers/pesquisa.webp",
    "/blog/covers/pool/pesquisa-01-laboratorio-proveta.webp",
    "/blog/covers/pool/pesquisa-02-observatorio-constelacao.webp",
    "/blog/covers/pool/pesquisa-03-arquivo-gaveta.webp",
    "/blog/covers/pool/pesquisa-04-microscopio-padrao.webp",
  ],
  "mercado": [
    "/blog/covers/mercado.webp",
    "/blog/covers/pool/mercado-01-feira-etiqueta.webp",
    "/blog/covers/pool/mercado-02-leilao-martelo.webp",
    "/blog/covers/pool/mercado-03-porto-contentor.webp",
    "/blog/covers/pool/mercado-04-tablet-cafe.webp",
  ],
  "futuro": [
    "/blog/covers/futuro.webp",
    "/blog/covers/pool/futuro-01-portal-campo.webp",
    "/blog/covers/pool/futuro-02-relogio-bolso.webp",
    "/blog/covers/pool/futuro-03-rampa-lancamento.webp",
    "/blog/covers/pool/futuro-04-arvore-fruto.webp",
  ],
  "educacao": [
    "/blog/covers/educacao.webp",
    "/blog/covers/pool/educacao-01-quadro-negro.webp",
    "/blog/covers/pool/educacao-02-mochila-saberes.webp",
    "/blog/covers/pool/educacao-03-formatura-gramado.webp",
    "/blog/covers/pool/educacao-04-cantinho-leitura.webp",
  ],
  "saude": [
    "/blog/covers/saude.webp",
    "/blog/covers/pool/saude-01-consultorio-batimento.webp",
    "/blog/covers/pool/saude-02-farmacia-lembrete.webp",
    "/blog/covers/pool/saude-03-corrida-parque.webp",
    "/blog/covers/pool/saude-04-quarto-sono.webp",
  ],
  "etica": [
    "/blog/covers/etica.webp",
    "/blog/covers/pool/etica-01-espelho-antigo.webp",
    "/blog/covers/pool/etica-02-cofre-dados.webp",
    "/blog/covers/pool/etica-03-banco-decisao.webp",
    "/blog/covers/pool/etica-04-farol-bussola.webp",
  ],
  "brasil": [
    "/blog/covers/brasil.webp",
    "/blog/covers/pool/brasil-01-feira-bandeirinha.webp",
    "/blog/covers/pool/brasil-02-onibus-app.webp",
    "/blog/covers/pool/brasil-03-praia-futebol.webp",
    "/blog/covers/pool/brasil-04-cozinha-receita.webp",
  ],
  "criatividade": [
    "/blog/covers/criatividade.webp",
    "/blog/covers/pool/criatividade-01-estudio-musica.webp",
    "/blog/covers/pool/criatividade-02-mesa-costura.webp",
    "/blog/covers/pool/criatividade-03-mural-grafite.webp",
    "/blog/covers/pool/criatividade-04-claquete-cinema.webp",
    "/blog/covers/pool/criatividade-05-abajur-curiosidade.webp",
    "/blog/covers/pool/criatividade-06-caixa-surpresa.webp",
  ],
  "robotica": [
    "/blog/covers/robotica.webp",
    "/blog/covers/pool/robotica-01-oficina-carro.webp",
    "/blog/covers/pool/robotica-02-jardim-drone.webp",
    "/blog/covers/pool/robotica-03-fazenda-rover.webp",
    "/blog/covers/pool/robotica-04-sala-aspirador.webp",
  ],
};
// Tags históricas → categoria mais próxima (sem pool próprio)
const TAG_TO_CATEGORY: Record<string, string> = {
  "modelos": "futuro",
  "treinamento": "educacao",
  "custo": "mercado",
  "infraestrutura": "robotica",
  "voce sabia?": "criatividade",
  "voce sabia": "criatividade",
};
const ALL_COVERS = Object.values(BLOG_COVER_POOLS).flat();

/** Sorteio determinístico (mesma seed → mesma capa, sem flicker entre renders). */
function pickFromPool(pool: string[], seedIndex: number, seedKey: string): string {
  let h = seedIndex + 11;
  for (const c of seedKey) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}

// Pool de artes temáticas para rechear as matérias (2 por artigo, por hash do slug)
const ARTICLE_POOL = [
  "robo-dev", "chip", "foguete", "cerebro", "laptop-magico", "economia", "video", "musica",
  "seguranca", "oculos", "conversa", "apps", "dados", "velocidade", "parceria", "mundo",
].map((s) => `/landing/tags/pool-${s}.webp`);

/** 2 artes extras determinísticas por artigo (não repetem a arte da tag). */
export function extraArtsFor(slug: string): string[] {
  let h = 7;
  for (const c of slug) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  const a = h % ARTICLE_POOL.length;
  const b = (a + 5 + (h >> 8) % 7) % ARTICLE_POOL.length;
  return [ARTICLE_POOL[a], ARTICLE_POOL[b === a ? (a + 1) % ARTICLE_POOL.length : b]];
}

/** Capa editorial da tag — estável por artigo (hash do seed/slug), sorteada dentro do pool da editoria. */
export function artForTag(tag: string, seedIndex = 0, seedKey = ""): string {
  const key = tag
    .toLowerCase()
    .normalize("NFD")
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[̀-ͯ]/g, "");
  const category = TAG_TO_CATEGORY[key] ?? key;
  const pool = BLOG_COVER_POOLS[category];
  if (pool) return pickFromPool(pool, seedIndex, seedKey || key);
  return pickFromPool(ALL_COVERS, seedIndex, seedKey || key);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDoc(d: any, i: number): AiNewsArticle {
  const tag = String(d.tag ?? "IA HOJE");
  return {
    slug: String(d.slug ?? d._id),
    tag,
    title: String(d.title ?? ""),
    summary: String(d.summary ?? ""),
    url: d.url ? String(d.url) : undefined,
    source: d.source ? String(d.source) : undefined,
    image: d.image ? String(d.image) : artForTag(tag, i, String(d.slug ?? '')),
    date: d.publishedAt ? new Date(d.publishedAt).toISOString() : undefined,
    body: Array.isArray(d.body) ? d.body.map(String) : undefined,
    sourceImage: d.sourceImage ? String(d.sourceImage) : undefined,
  };
}

/**
 * Notícias do dia para a landing (últimas 48h, fallback nas seeds).
 * Cards da home linkam para /noticias/[slug] quando o item veio do agente.
 */
export async function getAiNews(limit = 3): Promise<{ items: AiNewsArticle[]; live: boolean }> {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) return { items: SEED_NEWS.slice(0, limit), live: false };

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const docs = await db
      .collection("ainews")
      .find({ publishedAt: { $gte: cutoff } })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .toArray();

    if (docs.length === 0) return { items: SEED_NEWS.slice(0, limit), live: false };
    return { live: true, items: docs.map((d, i) => ({ ...mapDoc(d, i), url: `/noticias/${d.slug}` })) };
  } catch {
    return { items: SEED_NEWS.slice(0, limit), live: false };
  }
}

/** Hub /noticias — histórico (até um trimestre). */
export async function getAllNews(limit = 60): Promise<AiNewsArticle[]> {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) return [];
    const docs = await db
      .collection("ainews")
      .find({})
      .sort({ publishedAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map(mapDoc);
  } catch {
    return [];
  }
}

export async function getNewsBySlug(slug: string): Promise<AiNewsArticle | null> {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) return null;
    const doc = await db.collection("ainews").findOne({ slug });
    return doc ? mapDoc(doc, 0) : null;
  } catch {
    return null;
  }
}
