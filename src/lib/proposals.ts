import { getMongoClient } from "@/lib/database";
import { ObjectId } from "mongodb";

const DATABASE_NAME = "fayapointProdutos";
const PROPOSALS_COLLECTION = "service_proposals";
const USERS_COLLECTION = "usuarios";

export interface ProposalSelection {
  serviceSlug: string;
  unitLabel: string;
  track: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ProposalSubmission {
  userId?: ObjectId;
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
  const db = client.db(DATABASE_NAME);
  const proposals = db.collection<ProposalSubmission>(PROPOSALS_COLLECTION);
  const users = db.collection(USERS_COLLECTION);

  const now = new Date().toISOString();

  // 1. Find or Create User
  let userId: ObjectId | undefined;
  const normalizedEmail = submission.email.toLowerCase().trim();
  const existingUser = await users.findOne({ email: normalizedEmail });

  if (existingUser) {
    userId = existingUser._id;
    // Update user details if needed (optional, but good for keeping names up to date)
    await users.updateOne(
      { _id: existingUser._id },
      { 
        $set: { 
          name: submission.name,
          updatedAt: now 
        } 
      }
    );
  } else {
    const newUser = await users.insertOne({
      name: submission.name,
      email: normalizedEmail,
      role: "lead", // Default role
      interest: "service-builder",
      source: submission.source ?? "website-builder",
      createdAt: now,
      updatedAt: now,
    });
    userId = newUser.insertedId;
  }

  // 2. Save Proposal with userId
  await proposals.insertOne({
    ...submission,
    email: normalizedEmail, // Ensure stored email is also normalized
    userId,
    status: submission.status ?? "new",
    createdAt: now,
    updatedAt: now,
  });
}
