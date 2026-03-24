import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/products';

/**
 * GET /api/courses/[slug]/media
 *
 * Fetches chapter-level media metadata from the Content Forge
 * (mission-control database) for use in the student-facing reader.
 *
 * Returns a map of chapterSlug → media object so the reader can
 * render hero images, videos, thumbnails, audio, and galleries
 * alongside the markdown content.
 */

const MC_DATABASE = 'mission-control';
const CHAPTERS_COLLECTION = 'content-forge-chapters';

export interface ChapterMediaAsset {
  source?: string; // "youtube" | "cloudinary" | "url"
  url?: string;
  publicId?: string;
  videoId?: string;
  caption?: string;
}

export interface ChapterMedia {
  thumbnail?: ChapterMediaAsset | null;
  heroImage?: ChapterMediaAsset | null;
  video?: ChapterMediaAsset | null;
  audio?: ChapterMediaAsset | null;
  gallery?: ChapterMediaAsset[];
  notebooklm?: ChapterMediaAsset | null;
}

export interface ChapterMediaEntry {
  chapterSlug: string;
  chapterNumber?: number;
  title?: string;
  media?: ChapterMedia;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const client = await getMongoClient();
    const db = client.db(MC_DATABASE);
    const chaptersCol = db.collection(CHAPTERS_COLLECTION);

    // Fetch all chapters for this course that have media
    const chapters = await chaptersCol
      .find(
        { courseSlug: slug },
        {
          projection: {
            chapterSlug: 1,
            title: 1,
            media: 1,
            _id: 0,
          },
        }
      )
      .toArray();

    // Build a map: chapterIndex (0-based from slug like "chapter-1") → media
    // Also build a by-slug map for flexible lookup
    const mediaByIndex: Record<number, ChapterMedia> = {};
    const mediaBySlug: Record<string, ChapterMedia> = {};

    for (const ch of chapters) {
      if (!ch.media) continue;

      // Check if ANY media field has a URL
      const m = ch.media as ChapterMedia;
      const hasAnyMedia =
        m.video?.url ||
        m.heroImage?.url ||
        m.thumbnail?.url ||
        m.audio?.url ||
        m.notebooklm?.url ||
        (m.gallery && m.gallery.length > 0 && m.gallery[0]?.url);

      if (!hasAnyMedia) continue;

      const chapterSlug = ch.chapterSlug as string;
      mediaBySlug[chapterSlug] = m;

      // Extract chapter number from slug (e.g., "chapter-1" → 0, "chapter-15" → 14)
      const numMatch = chapterSlug.match(/(\d+)$/);
      if (numMatch) {
        const chapterIndex = parseInt(numMatch[1], 10) - 1; // 0-based
        mediaByIndex[chapterIndex] = m;
      }
    }

    return NextResponse.json({
      success: true,
      courseSlug: slug,
      totalChaptersWithMedia: Object.keys(mediaBySlug).length,
      mediaByIndex,
      mediaBySlug,
    });
  } catch (error) {
    console.error('Course media fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}
