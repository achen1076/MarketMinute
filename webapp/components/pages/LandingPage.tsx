import Link from "next/link";
import {
  TrendingUp,
  Bell,
  Zap,
  BarChart3,
  ArrowRight,
  Sparkles,
  LineChart,
  Target,
  Clock,
  Shield,
  CheckCircle2,
  Users,
  Calendar,
  ChevronDown,
} from "lucide-react";

function FeatureCard({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-muted/50 border border-border hover:border-teal-500/30 transition-colors">
      <div
        className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  features,
}: {
  number: string;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-card border border-border">
      <div className="shrink-0 w-14 h-14 rounded-full bg-teal-500/10 flex items-center justify-center text-2xl font-bold text-teal-400">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="grid grid-cols-2 gap-2">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExampleStep({
  time,
  action,
  result,
}: {
  time: string;
  action: string;
  result: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 px-3 py-1 h-fit rounded-lg text-sm font-semibold bg-teal-500/10 text-teal-400">
        {time}
      </div>
      <div className="flex-1">
        <p className="font-medium text-foreground mb-1">{action}</p>
        <p className="text-sm text-muted-foreground">{result}</p>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="p-6 rounded-xl bg-muted/50 border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-2">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm mb-8">
            <Zap className="w-4 h-4" />
            AI-Powered Market Intelligence
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Your Markets,{" "}
            <span className="bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Simplified
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
            Stop spending hours reading financial news. MarketMinute uses AI to
            analyze your portfolio and explain exactly why your stocks moved, in
            plain English, delivered in minutes. Custom insights and signals
            tailored to your watchlist using custom trained models.
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
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-muted/50 hover:bg-muted text-foreground font-semibold rounded-xl transition-all border border-border"
            >
              See How It Works
              <ChevronDown className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* What is MarketMinute Section */}
      <section className="px-4 py-16 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              What is MarketMinute?
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              MarketMinute is your personal AI market analyst. We read hundreds
              of news sources, analyze market data, and deliver personalized
              insights tailored specifically to the stocks you own—not generic
              market news you don&apos;t care about.
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
              <div className="text-4xl font-bold text-purple-400 mb-2">
                24/7
              </div>
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

      {/* Core Features Section */}
      <section className="px-4 py-16 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features for Smart Investors
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to stay informed about your portfolio—in one
              intelligent dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Sparkles className="w-6 h-6 text-teal-400" />}
              iconBg="bg-teal-500/10"
              title="AI-Powered Summaries"
              description="Get personalized daily briefs that explain why your stocks moved. Our AI reads news and distills it into clear, actionable insights—no jargon."
            />
            <FeatureCard
              icon={<Bell className="w-6 h-6 text-cyan-400" />}
              iconBg="bg-cyan-500/10"
              title="Smart Alerts"
              description="Never miss important events. Get instant alerts for earnings, unusual volume, price milestones, and breaking news—all tailored to your watchlist."
            />
            <FeatureCard
              icon={<LineChart className="w-6 h-6 text-purple-400" />}
              iconBg="bg-purple-500/10"
              title="Price Forecasts"
              description="Data-driven price forecasts based on decades of market history. See where your stocks might be headed with quantitative models."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6 text-amber-400" />}
              iconBg="bg-amber-500/10"
              title="Quant Analytics"
              description="Access institutional-grade analytics: technical indicators, volatility metrics, momentum scores, and pattern recognition—all in one place."
            />
            <FeatureCard
              icon={<Target className="w-6 h-6 text-rose-400" />}
              iconBg="bg-rose-500/10"
              title="Custom Watchlists"
              description="Create unlimited watchlists and star your most important holdings. Get deeper insights on what matters most to you."
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6 text-indigo-400" />}
              iconBg="bg-indigo-500/10"
              title="Real-Time Data"
              description="Live prices, volume, and market indicators updated every 30 seconds. Stay current without constantly refreshing."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-teal-400" />}
              iconBg="bg-teal-500/10"
              title="Sentinel AI Intelligence"
              description="Your personal market analyst. Sentinel spots unusual patterns, tracks volatility shifts, flags opportunities, and explains market-wide trends affecting your holdings."
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6 text-cyan-400" />}
              iconBg="bg-cyan-500/10"
              title="Economic Calendar & Events"
              description="Track upcoming FOMC meetings, CPI reports, earnings dates, and other market-moving events. Never be caught off-guard by scheduled volatility."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="px-4 py-16 border-t border-border scroll-mt-20"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              How MarketMinute Works
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
              title="Talk With MarketMinute Agent"
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

      {/* Why Choose MarketMinute Section */}
      <section className="px-4 py-16 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose MarketMinute?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
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
                reasons behind price movements with news citations and context
                you can actually understand.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-muted/50 border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Built for Busy Investors
              </h3>
              <p className="text-muted-foreground">
                Get your daily market brief in under 5 minutes. No need to open
                10 tabs or scroll through endless headlines. Everything in one
                place.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-muted/50 border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Institutional Tools, Retail Price
              </h3>
              <p className="text-muted-foreground">
                Access quant analytics, price forecasts, and real-time data that
                used to require expensive professional tools—now accessible to
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
                Start tracking your portfolio immediately. No payment info
                needed to get started.
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
                Institutional-quality insights without the complexity or
                $100+/mo price tags.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Example Section */}
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

      {/* FAQ Section */}
      <section className="px-4 py-16 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            <FAQItem
              question="Is MarketMinute free to use?"
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
              question="What makes MarketMinute different from other apps?"
              answer="Most finance apps show generic market news. MarketMinute focuses exclusively on YOUR portfolio. Every insight, alert, and summary is personalized to the stocks you actually own—no noise, no irrelevant headlines."
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-4 py-20 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Ready to Simplify Your Investing?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of investors who save hours every week with
            MarketMinute. Start tracking your portfolio today, it&apos;s free!.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-linear-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 text-lg"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required • Set up in under 2 minutes
          </p>
        </div>
      </section>
    </div>
  );
}
