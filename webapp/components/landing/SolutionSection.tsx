import { Database, LineChart, Share2 } from "lucide-react";

function SolutionFeature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ModelRow({
  label,
  value,
  delta,
  negative = false,
}: {
  label: string;
  value: string;
  delta: string;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono font-medium text-foreground">{value}</span>
        <span
          className={`text-xs ${
            delta.startsWith("+") && !negative
              ? "text-emerald-400"
              : delta.startsWith("-") || negative
              ? "text-rose-400"
              : "text-muted-foreground"
          }`}
        >
          {delta}
        </span>
      </div>
    </div>
  );
}

export function SolutionSection() {
  return (
    <section
      id="how-it-works"
      className="px-4 py-20 border-t border-border scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            The Solution: AI-Powered Financial Modeling
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We&apos;re not just a ChatGPT wrapper. We&apos;re building the
            infrastructure for live, intelligent financial models.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <SolutionFeature
              icon={<Database className="w-6 h-6" />}
              title="AI Ingestion Engine"
              description="Upload PDFs, transcripts, or 10-Ks. Our AI reads unstructured text and maps it to structured financial fields—revenue segments, margins, capex, working capital."
            />
            <SolutionFeature
              icon={<LineChart className="w-6 h-6" />}
              title="Live Valuation Models"
              description="Web-based DCF and Comps models that update automatically when new data is ingested. Change an assumption and watch the valuation recalculate instantly."
            />
            <SolutionFeature
              icon={<Share2 className="w-6 h-6" />}
              title="Share & Collaborate"
              description="Send a link, not a file. Recipients can adjust assumptions and see how the valuation changes—real collaboration, not static screenshots."
            />
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">
                  DCF Analysis: AAPL
                </h3>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                  Live
                </span>
              </div>

              <div className="space-y-4">
                <ModelRow label="Revenue Growth" value="8.5%" delta="+0.5%" />
                <ModelRow
                  label="Operating Margin"
                  value="31.2%"
                  delta="-0.3%"
                />
                <ModelRow label="WACC" value="9.1%" delta="+0.2%" negative />
                <ModelRow label="Terminal Growth" value="2.5%" delta="0.0%" />

                <div className="pt-4 mt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Implied Price</span>
                    <span className="text-2xl font-bold text-emerald-400">
                      $198.45
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-muted-foreground">
                      vs. Current
                    </span>
                    <span className="text-emerald-400">+12.3% upside</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -z-10 top-4 -right-4 w-full h-full rounded-2xl border border-emerald-500/20 bg-emerald-500/5" />
          </div>
        </div>
      </div>
    </section>
  );
}
