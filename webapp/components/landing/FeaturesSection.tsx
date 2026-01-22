import {
  FileSpreadsheet,
  BarChart3,
  PieChart,
  Calculator,
  RefreshCw,
  Share2,
} from "lucide-react";

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-5 rounded-xl border border-border bg-card hover:border-emerald-500/30 transition-colors group">
      <div className="w-10 h-10 rounded-lg bg-muted text-muted-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-400 flex items-center justify-center mb-3 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section className="px-4 py-20 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Model
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional-grade tools at a fraction of the cost.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<FileSpreadsheet className="w-6 h-6" />}
            title="DCF Builder"
            description="Full 5-year projections with automatic WACC calculation and sensitivity tables."
          />
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="Comparable Analysis"
            description="Auto-pull comps from our database. Customize peer groups and multiples."
          />
          <FeatureCard
            icon={<PieChart className="w-6 h-6" />}
            title="Segment Analysis"
            description="Break down revenue by geography, product, or customer. Track mix shifts over time."
          />
          <FeatureCard
            icon={<Calculator className="w-6 h-6" />}
            title="Scenario Modeling"
            description="Bull, base, bear cases with probability weighting. Monte Carlo simulations coming soon."
          />
          <FeatureCard
            icon={<RefreshCw className="w-6 h-6" />}
            title="Auto-Updates"
            description="Models refresh when new 10-Qs/Ks are filed. Never work with stale data again."
          />
          <FeatureCard
            icon={<Share2 className="w-6 h-6" />}
            title="Collaborative Links"
            description="Share models with a URL. Let others adjust assumptions without editing your version."
          />
        </div>
      </div>
    </section>
  );
}
