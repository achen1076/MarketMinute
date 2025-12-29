"use client";

import { useState, useEffect, useRef } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function AgentTestPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.id) {
          setUserId(data.user.id);
          setConversationId(data.user.id);
        }
      })
      .catch(() => {
        setConversationId("guest-" + Date.now());
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setStreamingContent("");
    setStatus("Thinking...");

    try {
      // Build history from existing messages (exclude the new user message we just added)
      const history = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const res = await fetch("/api/agent/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage.content,
          userId,
          conversationId,
          history,
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.status) {
                  setStatus(parsed.status);
                } else if (parsed.response) {
                  setStatus("");
                  fullResponse = parsed.response;
                }
              } catch {}
            }
          }
        }
      }

      if (fullResponse) {
        const chars = fullResponse.split("");
        let displayed = "";
        for (let i = 0; i < chars.length; i++) {
          displayed += chars[i];
          setStreamingContent(displayed);
          const delay = /[\s.,!?]/.test(chars[i]) ? 2 : 8;
          await new Promise((r) => setTimeout(r, delay));
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fullResponse || "No response",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    } catch (err: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${err.message || "Request failed"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingContent("");
    } finally {
      setLoading(false);
      setStatus("");
      inputRef.current?.focus();
    }
  }

  function handleClearChat() {
    setMessages([]);
    fetch("/api/agent", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
    }).catch(() => {});
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[90vh] overflow-hidden text-white">
      {/* Header */}
      <div className="shrink-0 px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-xs font-bold">
              M
            </div>
            <div>
              <h1 className="text-sm font-medium text-zinc-100">
                MarketMinute Agent
              </h1>
              <p className="text-[10px] text-zinc-500">
                Real-time market intelligence
              </p>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col-reverse">
        <div className="max-w-2xl mx-auto px-4 py-3 w-full">
          {messages.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h2 className="text-base font-medium text-zinc-200 mb-1">
                Ask about the market or your MarketMinute watchlists
              </h2>
              <p className="text-xs text-zinc-500 mb-4">
                Prices, signals, news, and more
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {[
                  "AAPL price",
                  "Compare NVDA vs AMD",
                  "TSLA quant signals",
                  "Upcoming macro events",
                  "News on my tech watchlist",
                  "Create me a watchlist with AAPL, MSFT, and TSLA",
                  "Add TSLA to my tech watchlist",
                  "Tell me about MarketMinute",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-2.5 py-1.5 text-xs bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-md transition-colors text-zinc-400 hover:text-zinc-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-2.5">
                <div
                  className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold ${
                    message.role === "user"
                      ? "bg-blue-600/80"
                      : "bg-emerald-600/80"
                  }`}
                >
                  {message.role === "user" ? "U" : "M"}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="text-[10px] text-zinc-500 mb-0.5">
                    {message.role === "user" ? "You" : "MarketMinute"}
                  </div>
                  <div className="text-[13px] text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming/Loading */}
            {loading && (
              <div className="flex gap-2.5">
                <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold bg-emerald-600/80">
                  M
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="text-[10px] text-zinc-500 mb-0.5">
                    MarketMinute
                  </div>
                  <div className="text-[13px] text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {streamingContent || (
                      <span className="inline-flex items-center gap-1.5 text-zinc-500">
                        <svg
                          className="w-3 h-3 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray="32"
                            strokeDashoffset="12"
                          />
                        </svg>
                        <span className="text-xs">
                          {status || "Thinking..."}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 p-3">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about stocks, prices, signals..."
              className="w-full px-3 py-2.5 pr-20 bg-zinc-800/30 border border-zinc-700/30 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600/50 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-md text-xs font-medium transition-colors"
            >
              {loading ? "Thinking" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
