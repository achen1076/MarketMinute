import Link from "next/link";
import { Zap, ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";

export function HeroSection() {
  return (
    <section className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
          Your Markets,{" "}
          <span className="bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Simplified
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
          Stop spending hours reading financial news. Mintalyze uses AI to
          analyze your portfolio and explain exactly why your stocks moved, in
          plain English, delivered in minutes. Perfect for new investors
          starting out or busy investors who want to make informed decisions.
        </p>

        <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground mb-10">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            Free to start
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            Personalized to your watchlist
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            Hundreds of free models and AI insights
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/signin"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#preview"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-muted/50 hover:bg-muted text-foreground font-semibold rounded-xl transition-all border border-border"
          >
            Take a look
            <ChevronDown className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}
