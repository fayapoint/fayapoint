import { cookies } from "next/headers";
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
import { ValuePropositionCTA } from "@/components/home/ValuePropositionCTA";
import { FreeOfferBanner } from "@/components/home/FreeOfferBanner";
import { StickyCTA } from "@/components/conversion/StickyCTA";
import { ExitIntentPopup } from "@/components/conversion/ExitIntentPopup";
import { WhatsAppButton } from "@/components/conversion/WhatsAppButton";

export default async function DescobrirPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-foreground">
      <Header />
      <main>
        <div id="hero"><HeroSection /></div>
        <div id="curso-gratis"><FreeOfferBanner /></div>
        <div id="proposta"><ValuePropositionCTA /></div>
        <div id="chatgpt"><ChatGPTAllowlistingBanner /></div>
        <div id="o-que-fazemos"><WhatWeDoSection /></div>
        <div id="servicos"><ServicesCarousel /></div>
        <div id="ferramentas"><AIToolsMarquee /></div>
        <div id="recursos"><FeaturesSection /></div>
        <div id="cursos"><CourseCategoriesSection /></div>
        <div id="depoimentos"><TestimonialsSection /></div>
        <div id="comece-agora"><CTASection /></div>
      </main>
      <Footer />

      {/* Conversion optimization */}
      <StickyCTA />
      <ExitIntentPopup />
      <WhatsAppButton />
    </div>
  );
}
