import { NextRequest, NextResponse } from "next/server";

const DEFAULT_USERNAME = "ricardofaya";
const MAX_PER_PAGE = 50;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("user") ?? DEFAULT_USERNAME;
    const limit = Math.min(Number(searchParams.get("limit")) || 12, MAX_PER_PAGE);

    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=${limit}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "GitHub API responded with an error" },
        { status: response.status }
      );
    }

    const repos = await response.json();
    return NextResponse.json({ repos });
  } catch (error) {
    console.error("Failed to load GitHub repos", error);
    return NextResponse.json({ error: "Failed to load GitHub repos" }, { status: 500 });
  }
}
