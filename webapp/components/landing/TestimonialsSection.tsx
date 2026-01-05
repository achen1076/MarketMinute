export function TestimonialsSection() {
  return (
    <section className="px-4 py-16 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of investors who have simplified their market
            research
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <div className="font-semibold text-foreground">Jordan M.</div>
              </div>
            </div>
            <p className="text-muted-foreground italic">
              &quot;I used to spend 2 hours every morning reading news across
              multiple sites. Now I get everything I need in 5 minutes. The AI
              summaries are incredible and save me so much time.&quot;
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <div className="font-semibold text-foreground">James C.</div>
              </div>
            </div>
            <p className="text-muted-foreground italic">
              &quot;The quant signals and price forecasts have been game
              changers for my trading strategy. Having high quality analytics
              for free is unbelievable. Best tool I&apos;ve found this
              year.&quot;
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <div className="font-semibold text-foreground">Emily R.</div>
              </div>
            </div>
            <p className="text-muted-foreground italic">
              &quot;As someone new to investing, MarketMinute explains
              everything in plain English. No confusing jargon, just clear
              explanations of why my stocks moved. It&apos;s like having a
              personal analyst.&quot;
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <div className="font-semibold text-foreground">David L.</div>
              </div>
            </div>
            <p className="text-muted-foreground italic">
              &quot;I manage multiple portfolios and MarketMinute keeps me
              organized. The custom watchlists and real-time alerts ensure I
              never miss important movements. Worth every penny.&quot;
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <div className="font-semibold text-foreground">Andrew M.</div>
              </div>
            </div>
            <p className="text-muted-foreground italic">
              &quot;With a full-time job, I don&apos;t have time to track
              markets constantly. The daily summaries and Sentinel alerts keep
              me informed without overwhelming me. Perfect for busy investors
              like me.&quot;
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border flex items-center justify-center">
            <p className="text-lg font-semibold text-muted-foreground">
              + many more
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
