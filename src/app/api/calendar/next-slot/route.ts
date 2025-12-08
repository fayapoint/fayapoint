import { NextResponse } from "next/server";
import { getNextAvailableSlot } from "@/lib/calendar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
