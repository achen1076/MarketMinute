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
    id: "setup",
    name: "1. Setup Environment",
    description: "Install Python dependencies (pip install -e .)",
    order: 1,
  },
  {
    id: "prep_data",
    name: "2. Data Preparation",
    description:
      "Fetch historical price data for all tickers from SYSTEM_SPEC.yaml",
    order: 2,
  },
  {
    id: "train_model",
    name: "3. Train Models (Optimized)",
    description:
      "Train LightGBM models with NEW optimized parameters (60-68% accuracy expected)",
    order: 3,
  },
  {
    id: "predictions",
    name: "4. Generate Predictions",
    description: "Generate next-day predictions using trained LightGBM models",
    order: 4,
  },
  {
    id: "forecasts",
    name: "5. Generate Distributional Forecasts",
    description: "Generate volatility ranges and probability distributions",
    order: 5,
  },
];

export default function QuantScriptRunner() {
  const [activeScript, setActiveScript] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ScriptStatus>>({
    setup: "idle",
    prep_data: "idle",
    train_model: "idle",
    predictions: "idle",
    forecasts: "idle",
  });
  const [outputs, setOutputs] = useState<Record<string, string>>({
    setup: "",
    prep_data: "",
    train_model: "",
    predictions: "",
    forecasts: "",
  });
  const [progress, setProgress] = useState<Record<string, number>>({
    setup: 0,
    prep_data: 0,
    train_model: 0,
    predictions: 0,
    forecasts: 0,
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

  const parseProgressLine = (line: string): number | null => {
    // Parse lines like "PROGRESS:50:Loading data..."
    const match = line.match(/PROGRESS:(\d+):/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  };

  const runScript = async (scriptId: string) => {
    setActiveScript(scriptId);
    setStatuses((prev) => ({ ...prev, [scriptId]: "running" }));
    setOutputs((prev) => ({ ...prev, [scriptId]: "" }));
    setProgress((prev) => ({ ...prev, [scriptId]: 0 }));

    // Quick scripts (setup, predictions, forecasts) use /api/admin/scripts
    const quickScripts = ["setup", "predictions", "forecasts"];
    const isQuickScript = quickScripts.includes(scriptId);

    try {
      if (isQuickScript) {
        // Use admin/scripts endpoint with streaming
        const response = await fetch("/api/admin/scripts", {
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
                  // Parse progress from output
                  const progressValue = parseProgressLine(data.output);
                  if (progressValue !== null) {
                    setProgress((prev) => ({
                      ...prev,
                      [scriptId]: progressValue,
                    }));
                  }

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
                    setProgress((prev) => ({ ...prev, [scriptId]: 100 }));
                    setStatuses((prev) => ({ ...prev, [scriptId]: "success" }));
                  } else {
                    setProgress((prev) => ({ ...prev, [scriptId]: 0 }));
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
      } else {
        // Use streaming endpoint for long-running scripts
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
                  // Parse progress from output
                  const progressValue = parseProgressLine(data.output);
                  if (progressValue !== null) {
                    setProgress((prev) => ({
                      ...prev,
                      [scriptId]: progressValue,
                    }));
                  }

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
                    setProgress((prev) => ({ ...prev, [scriptId]: 100 }));
                    setStatuses((prev) => ({ ...prev, [scriptId]: "success" }));
                  } else {
                    setProgress((prev) => ({ ...prev, [scriptId]: 0 }));
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
      }
    } catch (error) {
      console.error("Script execution error:", error);
      setProgress((prev) => ({ ...prev, [scriptId]: 0 }));
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
        return <AlertCircle size={18} className="text-muted-foreground" />;
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
        return "border-border";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            ML Pipeline Runner
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete pipeline: Setup → Data Prep → Training → Predictions →
            Forecasts
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
                  <h3 className="font-semibold text-foreground">
                    {script.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {script.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => runScript(script.id)}
                disabled={activeScript !== null}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 disabled:bg-muted/50 disabled:text-muted-foreground transition-colors text-sm"
              >
                <Play size={14} />
                Run
              </button>
            </div>

            {/* Progress Bar */}
            {statuses[script.id] === "running" && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Running...</span>
                  <span>{progress[script.id]}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-teal-500 to-emerald-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress[script.id]}%` }}
                  />
                </div>
              </div>
            )}

            {outputs[script.id] && (
              <div
                ref={(el) => {
                  outputRefs.current[script.id] = el;
                }}
                className="mt-3 p-3 rounded-md bg-background border border-border max-h-64 overflow-y-auto font-mono text-xs text-foreground/80"
              >
                <pre className="whitespace-pre-wrap">{outputs[script.id]}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
