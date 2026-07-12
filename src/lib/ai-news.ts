import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { SEED_NEWS, type AiNewsItem } from "@/data/landing/seed-news";

/**
 * Notícias do dia para a landing. O agente autônomo (OpenClaw/Hermes) publica
 * documentos na collection `ainews`: { slug, tag, title, summary, date,
 * publishedAt }. Sem documentos das últimas 48h (ou sem banco), cai nas seeds.
 */
export async function getAiNews(limit = 3): Promise<{ items: AiNewsItem[]; live: boolean }> {
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

    return {
      live: true,
      items: docs.map((d) => ({
        slug: String(d.slug ?? d._id),
        tag: String(d.tag ?? "IA HOJE"),
        title: String(d.title ?? ""),
        summary: String(d.summary ?? ""),
        url: d.url ? String(d.url) : undefined,
        source: d.source ? String(d.source) : undefined,
        image: d.image ? String(d.image) : undefined,
        date: d.publishedAt ? new Date(d.publishedAt).toISOString() : undefined,
      })),
    };
  } catch {
    return { items: SEED_NEWS.slice(0, limit), live: false };
  }
}
