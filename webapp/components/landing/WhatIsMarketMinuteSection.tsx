export function WhatIsMarketMinuteSection() {
  return (
    <section className="px-4 py-16 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            What is MarketMinute?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            MarketMinute is your personal AI market analyst. We read hundreds of
            news sources, analyze market data, and deliver personalized insights
            tailored specifically to the stocks you own—not generic market news
            you don&apos;t care about.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-6">
            <div className="text-4xl font-bold text-teal-400 mb-2">5 min</div>
            <div className="text-muted-foreground">
              Average time to get your daily market brief
            </div>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl font-bold text-cyan-400 mb-2">
              1000+ daily
            </div>
            <div className="text-muted-foreground">
              News sources analyzed per summary
            </div>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl font-bold text-purple-400 mb-2">24/7</div>
            <div className="text-muted-foreground">
              Real-time price tracking & alerts
            </div>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl font-bold text-amber-400 mb-2">513</div>
            <div className="text-muted-foreground">
              Trained models on tickers for signals and predictions
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
