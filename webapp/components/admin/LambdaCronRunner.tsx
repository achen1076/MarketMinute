"use client";

import { useState } from "react";
import { Play, CheckCircle, XCircle, Clock } from "lucide-react";

export default function LambdaCronRunner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function triggerCron() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/trigger-cron", {
        method: "POST",
      });

      const data = await res.json();

      if (data.ok) {
        setResult(data.result);
      } else {
        setError(data.error || "Failed to trigger cron job");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-4 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Lambda Cron Job (Manual Trigger)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Test the daily analysis workflow (predictions + Sentinel)
          </p>
        </div>
        <Clock className="h-8 w-8 text-blue-400" />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={triggerCron}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={loading}
        >
          <Play className="h-4 w-4" />
          {loading ? "Running Analysis..." : "Trigger Cron Job"}
        </button>
      </div>

      {/* Success Result */}
      {result && !error && (
        <div className="p-4 border border-green-600/50 rounded-md bg-green-900/20">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
            <div className="space-y-2 flex-1">
              <h3 className="text-lg font-semibold text-green-100">
                Cron Job Completed Successfully
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="p-3 bg-muted/50 rounded border border-border">
                  <div className="text-muted-foreground">Predictions</div>
                  <div className="text-2xl font-bold text-foreground">
                    {result.predictions_count}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    tickers analyzed
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded border border-border">
                  <div className="text-muted-foreground">Sentinel</div>
                  <div className="text-lg font-semibold text-foreground">
                    {result.sentinel_status === "success" ? (
                      <span className="text-green-400">✓ Generated</span>
                    ) : result.sentinel_status === "skipped" ? (
                      <span className="text-yellow-400">Skipped</span>
                    ) : (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    market report
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded border border-border">
                  <div className="text-muted-foreground">Timestamp</div>
                  <div className="text-sm font-mono text-foreground">
                    {result.timestamp
                      ? new Date(result.timestamp).toLocaleTimeString()
                      : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    completion time
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 border border-red-600/50 rounded-md bg-red-900/20">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-100 mb-1">
                Error Triggering Cron Job
              </h3>
              <p className="text-sm text-red-200">{error}</p>
              <p className="text-xs text-red-300 mt-2">
                Check that LAMBDA_FUNCTION_URL is set in your .env file
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-3 bg-muted/30 rounded border border-border">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            Automated Schedule:
          </span>{" "}
          This workflow runs automatically every weekday at 4:05 PM EST via
          EventBridge. Use this button to test or manually trigger the analysis
          at any time.
        </p>
      </div>
    </div>
  );
}
