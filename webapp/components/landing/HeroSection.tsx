import Link from "next/link";
import {
  ArrowRight,
  Clock,
  RefreshCw,
  Share2,
  ChevronDown,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
          Built for Financial Professionals
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight tracking-tight">
          Don&apos;t just read the news.
          <br />
          <span className="text-emerald-400">Model it.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Turn 10-Ks, earnings transcripts, and financial PDFs into live,
          shareable valuation models. No more copy-pasting. No more outdated
          spreadsheets. Just intelligent analysis.
        </p>

        <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground mb-10">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            PDF to Model in 60 seconds
          </span>
          <span className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            Auto-updates with new filings
          </span>
          <span className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            Share interactive models
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/analyze"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]"
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

        <div className="max-w-4xl mx-auto rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <div className="w-3 h-3 rounded-full bg-teal-500" />
            <span className="ml-4 text-xs text-muted-foreground font-mono">
              AAPL_DCF_Model.mm
            </span>
          </div>
          <div className="p-6 md:p-8 font-mono text-sm">
            <div className="space-y-3 text-left">
              <p className="text-muted-foreground">
                <span className="text-emerald-400">$</span> upload 10-K_2024.pdf
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
                <span className="text-emerald-400">→</span> Implied share price:{" "}
                <span className="text-emerald-400 font-bold">$198.45</span>
                <span className="text-muted-foreground ml-2">
                  (+12.3% upside)
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
