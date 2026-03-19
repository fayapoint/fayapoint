import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero3D } from "@/components/home/Hero3D";
import { WhatWeDoSection } from "@/components/home/WhatWeDoSection";
import { ServicesCarousel } from "@/components/home/ServicesCarousel";
import { ChatGPTAllowlistingBanner } from "@/components/home/ChatGPTAllowlistingBanner";
import { AIToolsMarquee } from "@/components/home/AIToolsMarquee";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { CourseCategoriesSection } from "@/components/home/CourseCategoriesSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CTASection } from "@/components/home/CTASection";
import { ValuePropositionCTA } from "@/components/home/ValuePropositionCTA";
import { FreeOfferBanner } from "@/components/home/FreeOfferBanner";
import { StickyCTA } from "@/components/conversion/StickyCTA";
import { ExitIntentPopup } from "@/components/conversion/ExitIntentPopup";
import { WhatsAppButton } from "@/components/conversion/WhatsAppButton";
import { GateLandingPage } from "@/components/gate/GateLandingPage";
import { SmoothScroll } from "@/components/3d/SmoothScroll";

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
    <SmoothScroll>
      <div className="min-h-screen bg-[#030712] text-foreground">
        <Header />
        <main>
          <Hero3D />
          <FreeOfferBanner />
          <ValuePropositionCTA />
          <ChatGPTAllowlistingBanner />
          <WhatWeDoSection />
          <ServicesCarousel />
          <AIToolsMarquee />
          <FeaturesSection />
          <CourseCategoriesSection />
          <TestimonialsSection />
          <CTASection />
        </main>
        <Footer />

        {/* Conversion optimization */}
        <StickyCTA />
        <ExitIntentPopup />
        <WhatsAppButton />
      </div>
    </SmoothScroll>
  );
}
