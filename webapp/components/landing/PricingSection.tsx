import { CheckCircle2 } from "lucide-react";

export function PricingSection() {
  return (
    <section className="px-4 py-20 border-t border-border">
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
          {/* <span className="hidden sm:block text-muted-foreground">→</span>
          <div className="flex items-center gap-2 text-foreground">
            <span>Mintalyze Business</span>
            <span className="font-bold text-emerald-400">$29/mo</span>
          </div> */}
        </div>

        <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground mb-10">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            14-day free trial
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            No credit card required
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
}
