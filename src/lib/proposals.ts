import { getMongoClient } from "@/lib/database";

const DATABASE_NAME = "fayapointProdutos";
const COLLECTION_NAME = "service_proposals";

export interface ProposalSelection {
  serviceSlug: string;
  unitLabel: string;
  track: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ProposalSubmission {
  name: string;
  email: string;
  company?: string;
  notes?: string;
  total: number;
  selections: ProposalSelection[];
  createdAt: string;
  updatedAt: string;
  status: "new" | "contacted" | "converted" | "closed";
  source?: string;
}

export async function saveProposal(
  submission: Omit<ProposalSubmission, "createdAt" | "updatedAt" | "status"> & {
    status?: ProposalSubmission["status"];
  },
): Promise<void> {
  const client = await getMongoClient();
  const collection = client.db(DATABASE_NAME).collection<ProposalSubmission>(COLLECTION_NAME);

  const now = new Date().toISOString();
  await collection.insertOne({
    ...submission,
    status: submission.status ?? "new",
    createdAt: now,
    updatedAt: now,
  });
}
