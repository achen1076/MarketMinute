import { Shield, Clock, Users } from "lucide-react";

export function WhyChooseSection() {
  return (
    <section className="px-4 py-16 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose Mintalyze?
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="p-6 rounded-2xl bg-muted/50 border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Built for New or Busy Investors
            </h3>
            <p className="text-muted-foreground">
              Get your daily market brief in under 5 minutes. No need to open 10
              tabs or scroll through endless headlines. Everything in one place.
              Told to you in simple to understand language.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-muted/50 border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Personalized for Your Watchlist
            </h3>
            <p className="text-muted-foreground">
              Unlike generic market apps, every insight is tailored to the
              stocks you actually own. No clutter, no noise—just relevant
              information that matters to you.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-muted/50 border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              AI That Explains &quot;Why&quot;
            </h3>
            <p className="text-muted-foreground">
              We don&apos;t just show you what happened. Our AI explains the
              reasons behind price movements with news citations and context you
              can actually understand.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-muted/50 border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Institutional Tools, For Free
            </h3>
            <p className="text-muted-foreground">
              Access quant analytics, price forecasts, and real-time data that
              used to require expensive professional tools now accessible to
              everyone.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 p-8 rounded-2xl bg-muted/50 border border-border">
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-teal-400" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              No Credit Card Required
            </h4>
            <p className="text-muted-foreground text-sm">
              Start tracking your portfolio immediately. No payment info needed
              to get started.
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-cyan-400" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Save Hours Every Week
            </h4>
            <p className="text-muted-foreground text-sm">
              Get your daily brief in minutes instead of hours of research
              across multiple sites.
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-purple-400" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Built for Retail Investors
            </h4>
            <p className="text-muted-foreground text-sm">
              Institutional-quality insights without the complexity or $100+/mo
              price tags.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
