import { NextResponse } from "next/server";
import { getNextAvailableSlot } from "@/lib/calendar";

// OPTIMIZATION: Cache for 5 minutes - calendar slots don't change that fast
export const revalidate = 300;

export async function GET() {
  try {
    const slot = await getNextAvailableSlot();
    return NextResponse.json(slot, { status: 200 });
  } catch (error) {
    console.error("Failed to compute next calendar slot", error);
    return NextResponse.json(
      { error: "Não foi possível recuperar horários disponíveis agora." },
      { status: 503 },
    );
  }
}
