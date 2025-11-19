import { NextRequest, NextResponse } from "next/server";
import {
  getAllServicePrices,
  getServicePricesBySlug,
} from "@/lib/pricing";

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("serviceSlug");

    const prices = slug
      ? await getServicePricesBySlug(slug)
      : await getAllServicePrices();

    return NextResponse.json({ prices, count: prices.length });
  } catch (error) {
    console.error("Error fetching service prices", error);
    return NextResponse.json(
      { error: "Failed to fetch service prices" },
      { status: 500 },
    );
  }
}
