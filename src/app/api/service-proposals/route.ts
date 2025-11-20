import { NextResponse } from "next/server";
import { z } from "zod";
import { saveProposal } from "@/lib/proposals";

const selectionSchema = z.object({
  serviceSlug: z.string().min(1),
  unitLabel: z.string().min(1),
  track: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  subtotal: z.number().min(0),
});

const proposalSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  total: z.number().min(0),
  selections: z.array(selectionSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const payload = proposalSchema.parse(json);

    await saveProposal(payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("service-proposals error", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", details: error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Failed to save proposal" }, { status: 500 });
  }
}
