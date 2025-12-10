import { NextResponse } from "next/server";
import { getNextAvailableSlot } from "@/lib/calendar";
import { getOrSet, CACHE_TTL, CACHE_KEYS } from '@/lib/redis';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // REDIS CACHE: 5 minutes TTL - calendar slot doesn't need real-time accuracy
    const slot = await getOrSet(
      CACHE_KEYS.CALENDAR_SLOT,
      getNextAvailableSlot,
      CACHE_TTL.CALENDAR_SLOT
    );
    
    return NextResponse.json(slot, { status: 200 });
  } catch (error) {
    console.error("Failed to compute next calendar slot", error);
    return NextResponse.json(
      { error: "Não foi possível recuperar horários disponíveis agora." },
      { status: 503 },
    );
  }
}
