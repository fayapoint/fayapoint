import { FaixaDeVideo } from "@/components/ui/FaixaDeVideo";
import { cookies } from "next/headers";
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
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <div id="hero"><HeroSection /></div>
        {/* A porta que se abre — `DES-01-porta`. Entra aqui, e não dentro do
            `HeroSection`, porque aquele componente é compartilhado com outras
            páginas e este vídeo foi feito para esta. */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <FaixaDeVideo
            src="/descobrir/porta-loop.webm"
            poster="/descobrir/porta-loop.webp"
          />
        </div>
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

      {/* Conversion optimization */}
      <StickyCTA />
      <ExitIntentPopup />
      <WhatsAppButton />
    </div>
  );
}
