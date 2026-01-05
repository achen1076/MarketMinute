"use client";

import Link from "next/link";
import Card from "@/components/atoms/Card";

export default function ChatInfo() {
  const features = [
    {
      title: "Personalized Insights and Conversations",
      description:
        "The AI understands your watchlist and provides relevant, tailored responses. Ask questions about stocks in your watchlist, get explanations.",
    },
    {
      title: "Build and modify watchlists",
      description:
        "Have our agent help you create and modify watchlists to track your favorite stocks and get personalized insights",
    },
    {
      title: "Stock Research Assistant",
      description:
        "Get quick summaries, explanations of price movements, and contextual market information supported with news",
    },
    {
      title: "Learning Companion",
      description:
        "Ask about financial terms, market mechanics, and investment concepts. Ask why todays news can cause a stock to move. And so much more!",
    },
  ];

  const mockConversation = [
    {
      role: "user",
      content: "Should I be worried about my tech watchlist?",
    },
    {
      role: "assistant",
      content:
        "Your tech watchlist shows normal volatility today. NVDA is down 2.1%, META up 1.8%, TSLA down 1.3%. Overall market rotation out of mega-cap tech, but fundamentals remain strong with earnings season ahead.",
    },
    {
      role: "user",
      content: "What stocks are similar to ones in my watchlist?",
    },
    {
      role: "assistant",
      content:
        "Based on your watchlist (NVDA, META, TSLA), consider AMD (semiconductors), GOOGL (tech/AI), and RIVN (EV sector). These have similar growth profiles and sector exposure.",
    },
    {
      role: "user",
      content: "Add AMD to my tech watchlist",
    },
    {
      role: "assistant",
      content:
        "Added AMD to your 'Tech' watchlist. You now have 4 stocks: NVDA, META, TSLA, AMD.",
    },
  ];

  return (
    <div className="relative lg:w-[70vw] w-[90vw] mx-auto mt-16 pb-16 space-y-8">
      {/* Hero Section */}
      <div className="relative z-10 text-center space-y-4 mb-20">
        <h1 className="text-4xl font-bold text-foreground">
          MarketMinute Chat
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Your AI-powered market research assistant. Ask questions about stocks,
          get explanations for market movements, and learn about financial
          concepts through natural conversation.
        </p>
      </div>

      {/* Background decorative element */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10" />

      {/* Mini Chat Interface Preview */}
      <div className="relative mb-20">
        <div className="max-w-3xl mx-auto">
          <Card className="overflow-hidden border-blue-500/20 shadow-2xl">
            {/* Chat Header */}
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-sm font-bold text-white">
                  M
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    MarketMinute Agent
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Real-time market intelligence
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="p-6 space-y-4 bg-background/50">
              {mockConversation.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Assistant avatar */}
                  {message.role === "assistant" && (
                    <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold bg-emerald-600/80 text-white">
                      M
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-xl ${
                      message.role === "user"
                        ? "bg-blue-600/80 text-white"
                        : "bg-muted/60 border border-border text-foreground"
                    }`}
                  >
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>

                  {/* User avatar */}
                  {message.role === "user" && (
                    <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold bg-blue-600/80 text-white">
                      U
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Chat Input Preview */}
            <div className="border-t border-border p-4 bg-muted/30">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background border border-border">
                <span className="text-sm text-muted-foreground">
                  Ask about stocks, prices, signals...
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature) => {
          return (
            <Card
              key={feature.title}
              className="p-6 transform hover:scale-102 transition-all duration-300 hover:bg-blue-500/10 hover:border-blue-500"
            >
              <div className="flex items-start gap-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* CTA */}
      <Card className="p-10 text-center  border-blue-500/20">
        <h2 className="text-2xl font-bold mb-3">
          Ready to chat about markets?
        </h2>
        <p className="text-muted-foreground mb-8 text-lg">
          Sign in to start a conversation with your AI market assistant
        </p>
        <Link
          href="/signin"
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
        >
          Sign In to Get Started
        </Link>
      </Card>
    </div>
  );
}
