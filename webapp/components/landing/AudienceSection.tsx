import { Briefcase, TrendingUp, GraduationCap } from "lucide-react";

function AudienceCard({
  icon,
  title,
  subtitle,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-emerald-400 mb-3">{subtitle}</p>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export function AudienceSection() {
  return (
    <section className="px-4 py-20 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Built for the Financial Prosumer
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you&apos;re on the buyside, sellside, or managing your own
            wealth.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <AudienceCard
            icon={<Briefcase className="w-8 h-8" />}
            title="Junior Analysts"
            subtitle="IB / PE / ER"
            description="Speed up your workflow. Generate models in minutes instead of hours. Impress your MD with faster turnaround."
          />
          <AudienceCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Serious Retail"
            subtitle="FIRE / Tech Workers"
            description="Get institutional-grade analysis without the Bloomberg terminal. Make data-driven decisions for your portfolio."
          />
          <AudienceCard
            icon={<GraduationCap className="w-8 h-8" />}
            title="Students & Academics"
            subtitle="Finance Programs"
            description="Learn valuation with real models, not theoretical examples. Build your skills with professional-grade tools."
          />
        </div>
      </div>
    </section>
  );
}
