"use client";

import { useState } from "react";

export default function SentinelRunner() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  async function runSentinel() {
    setLoading(true);
    setReport(null);

    const res = await fetch("/api/sentinel", {
      method: "POST",
    });

    const data = await res.json();
    setLoading(false);

    if (data.ok) {
      setReport(data.report);
    } else {
      alert("Failed to generate report");
    }
  }

  return (
    <div className="p-6 space-y-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <h1 className="text-2xl font-bold text-slate-100">Sentinel Settings</h1>

      <button
        onClick={runSentinel}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        disabled={loading}
      >
        {loading ? "Running Sentinel..." : "Run Sentinel Report"}
      </button>

      {report && (
        <div className="mt-6 space-y-4">
          <div className="p-4 border border-slate-600 rounded-md bg-slate-900/50">
            <h2 className="text-xl font-semibold mb-3 text-slate-100">
              Summary
            </h2>
            <p className="text-slate-300">{report.summary}</p>
          </div>

          {report.keyDrivers?.length > 0 && (
            <div className="p-4 border border-slate-600 rounded-md bg-slate-900/50">
              <h2 className="text-xl font-semibold mb-3 text-slate-100">
                Key Drivers
              </h2>
              <ul className="space-y-2">
                {report.keyDrivers.map((driver: string, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-slate-300"
                  >
                    <span className="text-blue-400">•</span>
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.macroContext && (
            <div className="p-4 border border-slate-600 rounded-md bg-slate-900/50">
              <h2 className="text-xl font-semibold mb-3 text-slate-100">
                Macro Context
              </h2>
              <p className="text-slate-300">{report.macroContext}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
