import {
  MockTickerListClient,
  MockMintalyzeSummary,
  MockEventsTimeline,
  MockMovementAlertsBar,
} from "@/components/landing";

export function DashboardPreviewSection() {
  return (
    <section className="py-16" id="preview">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            Your Personalized Dashboard
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your favorite stocks, get AI-powered insights, and see market
            movements, all in one place. Give it a try below!
          </p>
        </div>

        <div className="md:rounded-2xl bg-background lg:border-y-2 md:border-2 border-border shadow-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-[400px] lg:border-r lg:border-border">
              <MockTickerListClient />
            </div>

            <div className="flex-1 py-6 lg:px-6 space-y-6">
              <MockMintalyzeSummary />
              <MockEventsTimeline />
              <MockMovementAlertsBar />
            </div>
          </div>
        </div>
      </div>
      <p className="text-muted-foreground text-sm text-center mt-4">
        * This is a mock dashboard preview, data and information are not live
      </p>
    </section>
  );
}
