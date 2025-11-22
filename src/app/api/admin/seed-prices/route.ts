import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/pricing";

const DATABASE_NAME = "fayapointProdutos";
const COLLECTION_NAME = "products_prices";

const newItems = [
  // --- AUTOMATION (automation-ai) ---
  {
    category: "automation",
    serviceSlug: "automation-ai",
    track: "Discovery",
    unitLabel: "Process Mapping",
    description: "Detailed mapping of current workflows to identify automation opportunities.",
    unitType: "per_workflow",
    minQuantity: 1,
    defaultQuantity: 1,
    priceRange: { currency: "USD", min: 150, recommended: 300, max: 500 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "automation",
    serviceSlug: "automation-ai",
    track: "Implementation",
    unitLabel: "Simple Automation Workflow",
    description: "Linear automation (Zapier/n8n) connecting up to 3 apps.",
    unitType: "per_workflow",
    minQuantity: 1,
    defaultQuantity: 1,
    priceRange: { currency: "USD", min: 100, recommended: 200, max: 350 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "automation",
    serviceSlug: "automation-ai",
    track: "Implementation",
    unitLabel: "Complex Automation Scenario",
    description: "Multi-branch logic, data transformation, and error handling (n8n/Make).",
    unitType: "per_workflow",
    minQuantity: 0,
    defaultQuantity: 0,
    priceRange: { currency: "USD", min: 400, recommended: 600, max: 1000 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "automation",
    serviceSlug: "automation-ai",
    track: "AI Agents",
    unitLabel: "Custom AI Agent Setup",
    description: "Specialized agent with custom knowledge base and tools.",
    unitType: "per_project",
    minQuantity: 0,
    defaultQuantity: 0,
    priceRange: { currency: "USD", min: 800, recommended: 1200, max: 2000 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "automation",
    serviceSlug: "automation-ai",
    track: "Integration",
    unitLabel: "CRM/Database Integration",
    description: "Bi-directional sync between CRM, Airtable, or Databases.",
    unitType: "per_project",
    minQuantity: 0,
    defaultQuantity: 0,
    priceRange: { currency: "USD", min: 500, recommended: 800, max: 1500 },
    lastValidatedAt: new Date().toISOString()
  },

  // --- CONSULTING (consulting) ---
  {
    category: "consulting",
    serviceSlug: "consulting",
    track: "Strategy",
    unitLabel: "AI Readiness Audit",
    description: "Comprehensive analysis of your business readiness for AI adoption.",
    unitType: "per_project",
    minQuantity: 1,
    defaultQuantity: 1,
    priceRange: { currency: "USD", min: 500, recommended: 1000, max: 2000 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "consulting",
    serviceSlug: "consulting",
    track: "Strategy",
    unitLabel: "Strategic AI Roadmap",
    description: "12-month implementation plan with ROI projections.",
    unitType: "per_project",
    minQuantity: 0,
    defaultQuantity: 1,
    priceRange: { currency: "USD", min: 1500, recommended: 2500, max: 5000 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "consulting",
    serviceSlug: "consulting",
    track: "Training",
    unitLabel: "Team Training Session",
    description: "Hands-on workshop for your team (up to 10 people).",
    unitType: "per_hour",
    minQuantity: 2,
    defaultQuantity: 4,
    priceRange: { currency: "USD", min: 300, recommended: 500, max: 800 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "consulting",
    serviceSlug: "consulting",
    track: "Advisory",
    unitLabel: "Executive Advisory",
    description: "1-on-1 strategic guidance for leadership.",
    unitType: "per_hour",
    minQuantity: 1,
    defaultQuantity: 1,
    priceRange: { currency: "USD", min: 400, recommended: 600, max: 1000 },
    lastValidatedAt: new Date().toISOString()
  },

  // --- VIDEO (video-production) - Ensuring granular items exist ---
  {
    category: "video",
    serviceSlug: "video-production",
    track: "Pre-Production",
    unitLabel: "Scriptwriting",
    description: "Professional scriptwriting and storyboarding.",
    unitType: "per_minute",
    minQuantity: 1,
    defaultQuantity: 1,
    priceRange: { currency: "USD", min: 50, recommended: 100, max: 200 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "video",
    serviceSlug: "video-production",
    track: "Production",
    unitLabel: "Shooting Day",
    description: "Full day of filming with professional equipment and crew.",
    unitType: "per_day",
    minQuantity: 0,
    defaultQuantity: 0,
    priceRange: { currency: "USD", min: 1000, recommended: 1500, max: 3000 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "video",
    serviceSlug: "video-production",
    track: "Post-Production",
    unitLabel: "Video Editing",
    description: "Cutting, transitions, and basic sound design.",
    unitType: "per_minute",
    minQuantity: 1,
    defaultQuantity: 1,
    priceRange: { currency: "USD", min: 100, recommended: 200, max: 400 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "video",
    serviceSlug: "video-production",
    track: "Post-Production",
    unitLabel: "Motion Graphics",
    description: "Animated text, logos, and visual effects.",
    unitType: "per_minute",
    minQuantity: 0,
    defaultQuantity: 0,
    priceRange: { currency: "USD", min: 200, recommended: 400, max: 800 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "video",
    serviceSlug: "video-production",
    track: "Production",
    unitLabel: "Audio Engineer",
    description: "Dedicated sound recording specialist with kit.",
    unitType: "per_day",
    minQuantity: 0,
    defaultQuantity: 0,
    priceRange: { currency: "USD", min: 400, recommended: 600, max: 800 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "video",
    serviceSlug: "video-production",
    track: "Post-Production",
    unitLabel: "Color Correction",
    description: "Professional color grading and correction.",
    unitType: "per_minute",
    minQuantity: 0,
    defaultQuantity: 0,
    priceRange: { currency: "USD", min: 50, recommended: 100, max: 200 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "video",
    serviceSlug: "video-production",
    track: "Post-Production",
    unitLabel: "Mastering & Exports",
    description: "Final format delivery for TV, Web, and Social.",
    unitType: "per_project",
    minQuantity: 1,
    defaultQuantity: 1,
    priceRange: { currency: "USD", min: 100, recommended: 200, max: 300 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "video",
    serviceSlug: "video-production",
    track: "Licensing",
    unitLabel: "Usage Rights Extension",
    description: "Commercial usage rights for 1 year+.",
    unitType: "per_project",
    minQuantity: 0,
    defaultQuantity: 0,
    priceRange: { currency: "USD", min: 500, recommended: 1000, max: 5000 },
    lastValidatedAt: new Date().toISOString()
  },

  // --- WEB (website-full) ---
  {
    category: "development",
    serviceSlug: "website-full",
    track: "Discovery",
    unitLabel: "Discovery Workshop",
    description: "Initial requirements gathering and sitemap planning.",
    unitType: "per_project",
    minQuantity: 1,
    defaultQuantity: 1,
    priceRange: { currency: "USD", min: 300, recommended: 500, max: 800 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "development",
    serviceSlug: "website-full",
    track: "Design",
    unitLabel: "UX/UI Design Screen",
    description: "Custom design for one unique page view (Desktop + Mobile).",
    unitType: "per_screen",
    minQuantity: 1,
    defaultQuantity: 5,
    priceRange: { currency: "USD", min: 150, recommended: 250, max: 400 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "development",
    serviceSlug: "website-full",
    track: "Development",
    unitLabel: "Frontend Dev Hour",
    description: "React/Next.js implementation hour.",
    unitType: "per_hour",
    minQuantity: 10,
    defaultQuantity: 20,
    priceRange: { currency: "USD", min: 60, recommended: 100, max: 150 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "development",
    serviceSlug: "website-full",
    track: "Integration",
    unitLabel: "CMS Integration Block",
    description: "Setup of one dynamic content collection (e.g., Blog, Portfolio).",
    unitType: "per_collection",
    minQuantity: 0,
    defaultQuantity: 2,
    priceRange: { currency: "USD", min: 200, recommended: 350, max: 500 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "development",
    serviceSlug: "website-full",
    track: "Optimization",
    unitLabel: "SEO & Performance Pack",
    description: "Basic on-page SEO and Core Web Vitals optimization.",
    unitType: "per_project",
    minQuantity: 1,
    defaultQuantity: 1,
    priceRange: { currency: "USD", min: 400, recommended: 600, max: 1000 },
    lastValidatedAt: new Date().toISOString()
  },

  // --- SOCIAL (social-management) ---
  {
    category: "social",
    serviceSlug: "social-management",
    track: "Strategy",
    unitLabel: "Social Strategy Audit",
    description: "Review of current channels and competitive analysis.",
    unitType: "per_project",
    minQuantity: 1,
    defaultQuantity: 1,
    priceRange: { currency: "USD", min: 250, recommended: 400, max: 600 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "social",
    serviceSlug: "social-management",
    track: "Content Creation",
    unitLabel: "Static Post Design",
    description: "High-quality graphic design for feed/stories.",
    unitType: "per_post",
    minQuantity: 4,
    defaultQuantity: 12,
    priceRange: { currency: "USD", min: 25, recommended: 50, max: 100 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "social",
    serviceSlug: "social-management",
    track: "Content Creation",
    unitLabel: "Reel/Short Editing",
    description: "Editing of vertical video content up to 60s.",
    unitType: "per_video",
    minQuantity: 1,
    defaultQuantity: 4,
    priceRange: { currency: "USD", min: 50, recommended: 100, max: 200 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "social",
    serviceSlug: "social-management",
    track: "Management",
    unitLabel: "Community Management",
    description: "Hours dedicated to replying to comments and DMs.",
    unitType: "per_hour",
    minQuantity: 0,
    defaultQuantity: 5,
    priceRange: { currency: "USD", min: 40, recommended: 75, max: 120 },
    lastValidatedAt: new Date().toISOString()
  },

  // --- LOCAL SEO (local-seo) ---
  {
    category: "seo",
    serviceSlug: "local-seo",
    track: "Optimization",
    unitLabel: "GMB Optimization",
    description: "Complete setup and optimization of Google Business Profile.",
    unitType: "per_location",
    minQuantity: 1,
    defaultQuantity: 1,
    priceRange: { currency: "USD", min: 300, recommended: 500, max: 800 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "seo",
    serviceSlug: "local-seo",
    track: "Reputation",
    unitLabel: "Review Management System",
    description: "Setup of automated review request system.",
    unitType: "per_location",
    minQuantity: 1,
    defaultQuantity: 1,
    priceRange: { currency: "USD", min: 150, recommended: 250, max: 400 },
    lastValidatedAt: new Date().toISOString()
  },
  {
    category: "seo",
    serviceSlug: "local-seo",
    track: "Citations",
    unitLabel: "Local Citation Pack",
    description: "Submission to 30+ local directories.",
    unitType: "per_project",
    minQuantity: 0,
    defaultQuantity: 1,
    priceRange: { currency: "USD", min: 100, recommended: 200, max: 300 },
    lastValidatedAt: new Date().toISOString()
  }
];

export async function GET(req: NextRequest) {
  try {
    const client = await getMongoClient();
    const collection = client.db(DATABASE_NAME).collection(COLLECTION_NAME);

    let added = 0;
    let updated = 0;

    for (const item of newItems) {
      const result = await collection.updateOne(
        { serviceSlug: item.serviceSlug, unitLabel: item.unitLabel },
        { $set: item },
        { upsert: true }
      );
      
      if (result.upsertedCount > 0) added++;
      if (result.modifiedCount > 0) updated++;
    }

    return NextResponse.json({ 
      message: "Prices seeded successfully", 
      added, 
      updated,
      totalItems: newItems.length 
    });
  } catch (error) {
    console.error("Error seeding prices:", error);
    return NextResponse.json(
      { error: "Failed to seed prices" },
      { status: 500 }
    );
  }
}
