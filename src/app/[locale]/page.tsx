import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { ServicesCarousel } from "@/components/home/ServicesCarousel";
import { AIToolsMarquee } from "@/components/home/AIToolsMarquee";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { CourseCategoriesSection } from "@/components/home/CourseCategoriesSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { PricingSection } from "@/components/home/PricingSection";
import { CTASection } from "@/components/home/CTASection";
import { ServicePackagesSection } from "@/components/home/ServicePackagesSection";
import { ServiceBuilderSection } from "@/components/home/ServiceBuilderSection";
import { ServiceCartProvider } from "@/contexts/ServiceCartContext";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <ServicesCarousel />
        <AIToolsMarquee />
        <FeaturesSection />
        <CourseCategoriesSection />
        <TestimonialsSection />
        <PricingSection />
        <ServiceCartProvider>
          <ServicePackagesSection />
          <ServiceBuilderSection />
        </ServiceCartProvider>
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
