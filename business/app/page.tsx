import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { HeroSection } from "@shared/components/landing/HeroSection";
import { ProblemSection } from "@shared/components/landing/ProblemSection";
import { SolutionSection } from "@shared/components/landing/SolutionSection";
import { AudienceSection } from "@shared/components/landing/AudienceSection";
import { FeaturesSection } from "@shared/components/landing/FeaturesSection";
import { PricingSection } from "@shared/components/landing/PricingSection";
import { CTASection } from "@shared/components/landing/CTASection";
import { Footer } from "@shared/components/landing/Footer";

export default async function BusinessLandingPage() {
  const session = await auth();

  if (session?.user?.email) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <AudienceSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
