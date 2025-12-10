import { NextRequest, NextResponse } from "next/server";
import { getOrSet, CACHE_TTL, CACHE_KEYS } from '@/lib/redis';

const DEFAULT_USERNAME = "ricardofaya";
const MAX_PER_PAGE = 50;

async function fetchGitHubRepos(username: string, limit: number) {
  const response = await fetch(
    `https://api.github.com/users/${username}/repos?sort=updated&per_page=${limit}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("user") ?? DEFAULT_USERNAME;
    const limit = Math.min(Number(searchParams.get("limit")) || 12, MAX_PER_PAGE);

    // REDIS CACHE: 1 hour TTL - GitHub repos don't change often
    const repos = await getOrSet(
      CACHE_KEYS.GITHUB_REPOS(username, limit),
      () => fetchGitHubRepos(username, limit),
      CACHE_TTL.GITHUB_REPOS
    );

    return NextResponse.json({ repos });
  } catch (error) {
    console.error("Failed to load GitHub repos", error);
    return NextResponse.json({ error: "Failed to load GitHub repos" }, { status: 500 });
  }
}
