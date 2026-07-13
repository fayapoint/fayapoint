import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { SEED_NEWS, type AiNewsItem } from "@/data/landing/seed-news";

export interface AiNewsArticle extends AiNewsItem {
  body?: string[]; // parágrafos da análise FayAI
  sourceImage?: string; // og:image da matéria original (exibida com crédito)
}

// Arte da casa por categoria — "geradas por nós" (IDENTIDADE_VISUAL.md §4a)
const TAG_ART: Record<string, string> = {
  "tendencia": "/landing/tags/tendencia.webp",
  "ferramentas": "/landing/tags/ferramentas.webp",
  "modelos": "/landing/tags/modelos.webp",
  "negocios": "/landing/tags/negocios.webp",
  "pesquisa": "/landing/tags/pesquisa.webp",
  "voce sabia?": "/landing/tags/voce-sabia.webp",
  "voce sabia": "/landing/tags/voce-sabia.webp",
  "custo": "/landing/tags/custo.webp",
  "infraestrutura": "/landing/tags/infraestrutura.webp",
};
const TAG_ART_POOL = Object.values(TAG_ART);

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

export function artForTag(tag: string, seedIndex = 0): string {
  const key = tag
    .toLowerCase()
    .normalize("NFD")
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[̀-ͯ]/g, "");
  if (TAG_ART[key]) return TAG_ART[key];
  let h = seedIndex;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TAG_ART_POOL[h % TAG_ART_POOL.length];
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
    image: d.image ? String(d.image) : artForTag(tag, i),
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
