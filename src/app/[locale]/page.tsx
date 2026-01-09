import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { WhatWeDoSection } from "@/components/home/WhatWeDoSection";
import { ServicesCarousel } from "@/components/home/ServicesCarousel";
import { ChatGPTAllowlistingBanner } from "@/components/home/ChatGPTAllowlistingBanner";
import { AIToolsMarquee } from "@/components/home/AIToolsMarquee";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { CourseCategoriesSection } from "@/components/home/CourseCategoriesSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CTASection } from "@/components/home/CTASection";
// DISABLED: High serverless usage - triggers API call on every home page visit
// import { CommunityGallery } from "@/components/home/CommunityGallery";
import { ValuePropositionCTA } from "@/components/home/ValuePropositionCTA";
import { StickyCTA } from "@/components/conversion/StickyCTA";
import { ExitIntentPopup } from "@/components/conversion/ExitIntentPopup";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header />
      <main>
        <HeroSection />
        <ValuePropositionCTA />
        {/* DISABLED: High serverless usage - see NETLIFY_ACTION_PLAN.md */}
        {/* <CommunityGallery /> */}
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
    </div>
  );
}
