"use client";

import { useState, useRef, useEffect } from "react";
import Card from "@/components/atoms/Card";
import {
  Play,
  Terminal,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

type ScriptStatus = "idle" | "running" | "success" | "error";

type Script = {
  id: string;
  name: string;
  description: string;
  order: number;
};

const scripts: Script[] = [
  {
    id: "prep_data",
    name: "1. Data Preparation",
    description:
      "Fetch historical price data for all tickers from SYSTEM_SPEC.yaml",
    order: 1,
  },
  {
    id: "train_model",
    name: "2. Train Models",
    description:
      "Train LightGBM models for each ticker (takes ~30-60 min for 200 tickers)",
    order: 2,
  },
  {
    id: "generate_predictions",
    name: "3. Generate Predictions",
    description: "Generate next-day predictions for all trained models",
    order: 3,
  },
];

export default function QuantScriptRunner() {
  const [activeScript, setActiveScript] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ScriptStatus>>({
    prep_data: "idle",
    train_model: "idle",
    generate_predictions: "idle",
  });
  const [outputs, setOutputs] = useState<Record<string, string>>({
    prep_data: "",
    train_model: "",
    generate_predictions: "",
  });
  const outputRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-scroll to bottom of output
  useEffect(() => {
    if (activeScript && outputRefs.current[activeScript]) {
      const el = outputRefs.current[activeScript];
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [outputs, activeScript]);

  const runScript = async (scriptId: string) => {
    setActiveScript(scriptId);
    setStatuses((prev) => ({ ...prev, [scriptId]: "running" }));
    setOutputs((prev) => ({ ...prev, [scriptId]: "" }));

    try {
      const response = await fetch("/api/quant/run-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: scriptId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.output) {
                setOutputs((prev) => ({
                  ...prev,
                  [scriptId]: prev[scriptId] + data.output,
                }));
              }

              if (data.error) {
                setOutputs((prev) => ({
                  ...prev,
                  [scriptId]: prev[scriptId] + `ERROR: ${data.error}`,
                }));
              }

              if (data.done) {
                if (data.exitCode === 0) {
                  setStatuses((prev) => ({ ...prev, [scriptId]: "success" }));
                } else {
                  setStatuses((prev) => ({ ...prev, [scriptId]: "error" }));
                }
                setActiveScript(null);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Script execution error:", error);
      setStatuses((prev) => ({ ...prev, [scriptId]: "error" }));
      setOutputs((prev) => ({
        ...prev,
        [scriptId]: prev[scriptId] + `\nFailed to execute script: ${error}`,
      }));
      setActiveScript(null);
    }
  };

  const runAllScripts = async () => {
    for (const script of scripts) {
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (statuses[script.id] !== "running") {
            clearInterval(interval);
            resolve(null);
          }
        }, 1000);

        runScript(script.id);
      });

      // Wait for completion
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  };

  const getStatusIcon = (status: ScriptStatus) => {
    switch (status) {
      case "running":
        return <Terminal size={18} className="animate-pulse text-blue-400" />;
      case "success":
        return <CheckCircle size={18} className="text-emerald-400" />;
      case "error":
        return <XCircle size={18} className="text-rose-400" />;
      default:
        return <AlertCircle size={18} className="text-slate-500" />;
    }
  };

  const getStatusColor = (status: ScriptStatus) => {
    switch (status) {
      case "running":
        return "border-blue-500/30 bg-blue-500/5";
      case "success":
        return "border-emerald-500/30 bg-emerald-500/5";
      case "error":
        return "border-rose-500/30 bg-rose-500/5";
      default:
        return "border-slate-700";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">
            ML Pipeline Runner
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Execute quant model training and prediction scripts
          </p>
        </div>
        <button
          onClick={runAllScripts}
          disabled={activeScript !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:bg-slate-700 disabled:text-slate-500 transition-colors text-sm font-semibold"
        >
          <Play size={16} />
          Run All Scripts
        </button>
      </div>

      <div className="space-y-4">
        {scripts.map((script) => (
          <div
            key={script.id}
            className={`border rounded-lg p-4 transition-all ${getStatusColor(
              statuses[script.id]
            )}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                {getStatusIcon(statuses[script.id])}
                <div>
                  <h3 className="font-semibold text-slate-200">
                    {script.name}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {script.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => runScript(script.id)}
                disabled={activeScript !== null}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:text-slate-600 transition-colors text-sm"
              >
                <Play size={14} />
                Run
              </button>
            </div>

            {outputs[script.id] && (
              <div
                ref={(el) => {
                  outputRefs.current[script.id] = el;
                }}
                className="mt-3 p-3 rounded-md bg-slate-950 border border-slate-800 max-h-64 overflow-y-auto font-mono text-xs text-slate-300"
              >
                <pre className="whitespace-pre-wrap">{outputs[script.id]}</pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <div className="flex gap-3">
          <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-200">
            <strong className="block mb-1">Important Notes:</strong>
            <ul className="space-y-1 text-amber-200/80">
              <li>
                • Scripts must be run in order: Data Prep → Train Models →
                Generate Predictions
              </li>
              <li>
                • Training 200 models can take 30-60 minutes depending on your
                hardware
              </li>
              <li>
                • Make sure the quant_app folder is at:
                ~/Desktop/MarketMinute/quant_app
              </li>
              <li>
                • Refresh the Quant Lab page after generating predictions to see
                new results
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}
