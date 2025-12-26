"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";

type CacheStats = {
  explanations: { size: number; registered: boolean };
  summaries: { size: number; registered: boolean };
  events: { size: number; registered: boolean };
};

export function AdminSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/cache");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch cache stats:", err);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchStats();
  };

  const handleClearCache = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(
          `✓ Cleared ${data.totalCleared} cache entries successfully!`
        );
        fetchStats(); // Refresh stats
      } else {
        setMessage("✗ Failed to clear cache");
      }
    } catch (err) {
      console.error("Failed to clear cache:", err);
      setMessage("✗ Error clearing cache");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-300 shadow-lg transition-all hover:bg-slate-700 hover:scale-110"
        title="Admin Settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-100">Cache Settings</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 transition-colors hover:text-slate-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-200">
              Cache Management
            </h3>
            <p className="mb-4 text-xs text-slate-400">
              Clear all cached API responses to force fresh data on next
              request. Useful for testing.
            </p>

            {stats && (
              <div className="mb-4 rounded-lg bg-slate-800/50 p-3 text-sm">
                <div className="mb-2 flex justify-between">
                  <span className="text-slate-400">Explain Cache:</span>
                  <span className="font-medium text-slate-200">
                    {stats.explanations.size} entries
                  </span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span className="text-slate-400">Summary Cache:</span>
                  <span className="font-medium text-slate-200">
                    {stats.summaries.size} entries
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Events Cache:</span>
                  <span className="font-medium text-slate-200">
                    {stats.events.size} entries
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleClearCache}
                disabled={loading}
              >
                {loading ? "Clearing..." : "Clear All Caches"}
              </Button>
              <Button
                variant="secondary"
                className="px-4"
                onClick={fetchStats}
                disabled={loading}
                title="Refresh Stats"
              >
                ↻
              </Button>
            </div>

            {message && (
              <p
                className={`mt-3 text-sm ${
                  message.startsWith("✓") ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-700 pt-4">
          <button
            onClick={() => setIsOpen(false)}
            className="text-sm text-slate-400 transition-colors hover:text-slate-200"
          >
            Close
          </button>
        </div>
      </Card>
    </div>
  );
}
