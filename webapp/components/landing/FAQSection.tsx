import { FAQItem } from "./LandingPageHelpers";

export function FAQSection() {
  return (
    <section className="px-4 py-16 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          <FAQItem
            question="Is Mintalyze free to use?"
            answer="Yes! You can get started for free with no credit card required. Create watchlists, get AI summaries, and track your portfolio. Premium features are available for power users who want additional analytics and forecasts."
          />
          <FAQItem
            question="How does the AI summary work?"
            answer="Our AI reads thousands of news sources, earnings reports, and market data every day. It identifies news specifically relevant to YOUR watchlist stocks and synthesizes it into a clear, jargon-free summary explaining why each stock moved."
          />
          <FAQItem
            question="How often is data updated?"
            answer="Price data updates every second during market hours. AI summaries are generated hourly on demand."
          />
          <FAQItem
            question="Can I track any stock?"
            answer="Yes! You can add any US-listed stock to your watchlists. We support all major exchanges including NYSE, NASDAQ, and AMEX. Add as many stocks as you want—there are no limits."
          />
          <FAQItem
            question="What makes Mintalyze different from other apps?"
            answer="Most finance apps show generic market news. Mintalyze focuses exclusively on YOUR portfolio. Every insight, alert, and summary is personalized to the stocks you actually own—no noise, no irrelevant headlines."
          />
        </div>
      </div>
    </section>
  );
}
