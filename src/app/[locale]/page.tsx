import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewHomepage } from "@/components/home-v2/NewHomepage";
import { StickyCTA } from "@/components/conversion/StickyCTA";
import { ExitIntentPopup } from "@/components/conversion/ExitIntentPopup";
import { WhatsAppButton } from "@/components/conversion/WhatsAppButton";
import { GateLandingPage } from "@/components/gate/GateLandingPage";

export default async function Home() {
  const cookieStore = await cookies();
  const gateToken = cookieStore.get("fayai_gate")?.value;
  const authToken = cookieStore.get("fayai_token")?.value;

  // Show gate for unverified, non-logged-in visitors
  const showGate = !gateToken && !authToken;

  if (showGate) {
    return <GateLandingPage />;
  }

  return (
    <div className="min-h-screen bg-[#030712] text-foreground">
      <Header />
      <main>
        <NewHomepage />
      </main>
      <Footer />

      {/* Conversion optimization */}
      <StickyCTA />
      <ExitIntentPopup />
      <WhatsAppButton />
    </div>
  );
}
