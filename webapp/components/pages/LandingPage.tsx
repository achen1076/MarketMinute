import {
  HeroSection,
  DashboardPreviewSection,
  WhatIsMarketMinuteSection,
  WhyChooseSection,
  CoreFeaturesSection,
  HowItWorksSection,
  RealExampleSection,
  TestimonialsSection,
  FAQSection,
  FinalCTASection,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col">
      <HeroSection />
      <DashboardPreviewSection />
      <WhatIsMarketMinuteSection />
      <WhyChooseSection />
      <CoreFeaturesSection />
      <HowItWorksSection />
      <RealExampleSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
    </div>
  );
}
