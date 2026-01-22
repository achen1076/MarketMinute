import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="px-4 py-24 border-t border-border relative overflow-hidden">
      <div className="absolute inset-0 bg-emerald-500/5" />

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
          className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] text-lg"
        >
          Try the Expectation Gap Engine
          <ArrowRight className="w-5 h-5" />
        </Link>

        <p className="mt-6 text-sm text-muted-foreground">
          No credit card required • Setup in 2 minutes
        </p>
      </div>
    </section>
  );
}
