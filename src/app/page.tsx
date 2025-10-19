import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { AIToolsMarquee } from "@/components/home/AIToolsMarquee";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { CourseCategoriesSection } from "@/components/home/CourseCategoriesSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { PricingSection } from "@/components/home/PricingSection";
import { CTASection } from "@/components/home/CTASection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <AIToolsMarquee />
        <FeaturesSection />
        <CourseCategoriesSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
