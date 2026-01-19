import { StepCard } from "./LandingPageHelpers";

export function HowItWorksSection() {
  return (
    <section className="px-4 py-16 border-t border-border scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            How Mintalyze Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get personalized market insights. No complexity, no information
            overload, just the data you need.
          </p>
        </div>

        <div className="space-y-8">
          <StepCard
            number="1"
            title="Create Your Watchlist"
            description="Add the stocks you care about or want to keep up with. Create multiple watchlists for different strategies, portfolios, or sectors."
            features={[
              "Custom watchlists",
              "Star your favorites",
              "Quick search & add",
              "Organize by strategy",
            ]}
          />
          <StepCard
            number="2"
            title="Get AI-Powered Insights"
            description="Every day, our AI reads hundreds of news articles and market data points to explain why your stocks moved. Get a personalized brief tailored to your watchlist."
            features={[
              "Daily market summaries",
              "Plain-English explanations",
              "Key price drivers",
              "Sentiment analysis",
            ]}
          />
          <StepCard
            number="3"
            title="Explain Ticker Movements"
            description="Get ticker specific explainations for why it moved. Based on news, market events, and market sentiment."
            features={[
              "News and event powered",
              "Price movement explanations",
              "Market sentiment analysis",
            ]}
          />
          <StepCard
            number="4"
            title="Model Powered Signals"
            description="Get custom model powered signals for your watchlist. With customized scoring system and statistical and model based predictions."
            features={[
              "Quantitative signals",
              "Model quality transparency",
              "Prediction based scoring",
              "Market forecasting",
            ]}
          />
          <StepCard
            number="5"
            title="Talk With Mintalyze Agent"
            description="Chat with our custom AI agent with 25+ custom tools. Trained to understand your watchlist and provide personalized insights."
            features={[
              "25+ custom tools",
              "Watchlist understanding",
              "Personalized insights",
              "Create and manage watchlists",
            ]}
          />
        </div>
      </div>
    </section>
  );
}
