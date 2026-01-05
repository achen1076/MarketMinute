import { ExampleStep } from "./LandingPageHelpers";

export function RealExampleSection() {
  return (
    <section className="px-4 py-16 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            See It In Action
          </h2>
          <p className="text-lg text-muted-foreground">
            Here&apos;s what a typical day looks like with MarketMinute
          </p>
        </div>

        <div className="rounded-2xl bg-card border border-border p-8">
          <div className="space-y-6">
            <ExampleStep
              time="9:30 AM"
              action="Market opens, you check your dashboard"
              result="See NVDA is up 3.2% on earnings beat, MSFT flat, AAPL down 1.1% on analyst downgrade, all at a glance"
            />
            <ExampleStep
              time="9:35 AM"
              action="Click on NVDA explain for 'why' it moved"
              result="AI explains: 'NVDA reported Q4 EPS of $5.16 vs $4.64 expected, beating estimates by 11%. Data center revenue grew 217% YoY on AI demand...'"
            />
            <ExampleStep
              time="11:30 AM"
              action="Check midday summary"
              result="AAPL price soars. News: Apple announces new AI partnership with OpenAI..."
            />
            <ExampleStep
              time="4:00 PM"
              action="Check end-of-day summary"
              result="NVDA (+5.4%). Key takeaway: Semiconductor sector strong on AI demand."
            />
            <ExampleStep
              time="5:00 PM"
              action="Check quant signals"
              result="Check out model powered signals and see what to look out for the next day"
            />
          </div>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Result:</strong> You stayed
              informed all day without constant tab-switching. You understood
              why your portfolio moved and got timely alerts for actionable
              events.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
