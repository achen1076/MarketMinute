"use client";

import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Zap,
  RefreshCw,
  Share2,
  Clock,
  DollarSign,
  GraduationCap,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  Database,
  LineChart,
  FileSpreadsheet,
  BarChart3,
  PieChart,
  Calculator,
} from "lucide-react";

export default function BusinessLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(rgba(245, 158, 11, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(245, 158, 11, 0.3) 1px, transparent 1px)
            `,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-medium">
            <Zap className="w-4 h-4" />
            Built for Financial Professionals
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight tracking-tight">
            Don&apos;t just read the news.
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              Model it.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Turn 10-Ks, earnings transcripts, and financial PDFs into live,
            shareable valuation models. No more copy-pasting. No more outdated
            spreadsheets. Just intelligent analysis.
          </p>

          <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground mb-10">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              PDF to Model in 60 seconds
            </span>
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-400" />
              Auto-updates with new filings
            </span>
            <span className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-amber-400" />
              Share interactive models
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02]"
            >
              Try the Engine
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-muted/50 hover:bg-muted text-foreground font-semibold rounded-xl transition-all border border-border"
            >
              See How It Works
              <ChevronDown className="w-5 h-5" />
            </a>
          </div>

          {/* Terminal-style preview */}
          <div className="max-w-4xl mx-auto rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-4 text-xs text-muted-foreground font-mono">
                AAPL_DCF_Model.mm
              </span>
            </div>
            <div className="p-6 md:p-8 font-mono text-sm">
              <div className="space-y-3 text-left">
                <p className="text-muted-foreground">
                  <span className="text-amber-400">$</span> upload 10-K_2024.pdf
                </p>
                <p className="text-emerald-400">
                  ✓ Extracted revenue segments (5 found)
                </p>
                <p className="text-emerald-400">
                  ✓ Parsed operating expenses breakdown
                </p>
                <p className="text-emerald-400">
                  ✓ Identified capex guidance: $11-13B
                </p>
                <p className="text-emerald-400">✓ Building DCF model...</p>
                <p className="text-foreground mt-4">
                  <span className="text-amber-400">→</span> Implied share price:{" "}
                  <span className="text-amber-400 font-bold">$198.45</span>
                  <span className="text-muted-foreground ml-2">
                    (+12.3% upside)
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-4 py-20 border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              The Problem with Financial Analysis Today
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you&apos;re at a bulge bracket or managing your own
              portfolio, the workflow is broken.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <ProblemCard
              icon={<FileText className="w-8 h-8" />}
              title="Data Friction"
              description="Copy-pasting from 10-Ks to Excel is slow and error-prone. Junior analysts spend 80% of their time on data entry, not analysis."
            />
            <ProblemCard
              icon={<Share2 className="w-8 h-8" />}
              title="Static Sharing"
              description="Screenshots of charts don't let peers test assumptions. Email chains of Excel files create version control nightmares."
            />
            <ProblemCard
              icon={<DollarSign className="w-8 h-8" />}
              title="Pricing Gap"
              description="Bloomberg costs $24k/year. Yahoo Finance is too basic. There's no middle ground for serious analysis on a budget."
            />
          </div>
        </div>
      </section>

      {/* Solution Section */}
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
                      <span className="text-muted-foreground">
                        Implied Price
                      </span>
                      <span className="text-2xl font-bold text-amber-400">
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

              {/* Decorative elements */}
              <div className="absolute -z-10 top-4 -right-4 w-full h-full rounded-2xl border border-amber-500/20 bg-amber-500/5" />
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="px-4 py-20 border-t border-border bg-muted/30">
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

      {/* Features Grid */}
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

      {/* Pricing Teaser */}
      <section className="px-4 py-20 border-t border-border bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Professional Analysis, Accessible Pricing
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            We believe great financial tools shouldn&apos;t require a Bloomberg
            budget.
          </p>

          <div className="inline-flex flex-col sm:flex-row gap-4 items-center justify-center mb-8">
            <div className="flex items-center gap-2 text-muted-foreground line-through">
              <span>Bloomberg Terminal</span>
              <span className="font-semibold">$24,000/yr</span>
            </div>
            <span className="hidden sm:block text-muted-foreground">→</span>
            <div className="flex items-center gap-2 text-foreground">
              <span>Mintalyze Business</span>
              <span className="font-bold text-amber-400">$29/mo</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground mb-10">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              14-day free trial
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-24 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent" />

        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Ready to transform how you analyze?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join analysts at top firms who are already modeling smarter, not
            harder.
          </p>

          <Link
            href="/analyze"
            className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] text-lg"
          >
            Try the Expectation Gap Engine
            <ArrowRight className="w-5 h-5" />
          </Link>

          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required • Setup in 2 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Mintalyze</span>
            <span>Business</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="https://mintalyze.com/terms"
              className="hover:text-foreground transition"
            >
              Terms
            </Link>
            <Link
              href="https://mintalyze.com/privacy"
              className="hover:text-foreground transition"
            >
              Privacy
            </Link>
            <Link
              href="https://mintalyze.com/support"
              className="hover:text-foreground transition"
            >
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component helpers
function ProblemCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card">
      <div className="w-14 h-14 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

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
      <div className="shrink-0 w-12 h-12 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
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
      <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-amber-400 mb-3">{subtitle}</p>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

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
    <div className="p-5 rounded-xl border border-border bg-card hover:border-amber-500/30 transition-colors group">
      <div className="w-10 h-10 rounded-lg bg-muted text-muted-foreground group-hover:bg-amber-500/10 group-hover:text-amber-400 flex items-center justify-center mb-3 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
