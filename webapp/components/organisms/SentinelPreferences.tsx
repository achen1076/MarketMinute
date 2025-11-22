"use client";

import { useState, useEffect } from "react";
import Card from "@/components/atoms/Card";
import { Settings, Save } from "lucide-react";

interface Preferences {
  focus: string;
  depth: string;
  vixAlertThreshold: number;
  signalSensitivity: string;
  timeframe: string;
  showMacro: boolean;
  showVolatility: boolean;
}

export default function SentinelPreferences() {
  const [preferences, setPreferences] = useState<Preferences>({
    focus: "balanced",
    depth: "standard",
    vixAlertThreshold: 20,
    signalSensitivity: "moderate",
    timeframe: "daily",
    showMacro: true,
    showVolatility: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load preferences
    fetch("/api/sentinel/preferences")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setPreferences(data.preferences);
        }
      });
  }, []);

  async function savePreferences() {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/sentinel/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Analysis Configuration
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            {/* Focus Preference */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block">
                Analysis Focus
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "balanced", label: "Balanced" },
                  { value: "tech", label: "Tech" },
                  { value: "macro", label: "Macro" },
                  { value: "volatility", label: "Volatility" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setPreferences({ ...preferences, focus: option.value })
                    }
                    className={`p-2 rounded text-xs font-medium transition-all ${
                      preferences.focus === option.value
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-900/50 text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* VIX Alert Threshold */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block">
                VIX Alert Threshold
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="15"
                  max="35"
                  step="1"
                  value={preferences.vixAlertThreshold}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      vixAlertThreshold: parseInt(e.target.value),
                    })
                  }
                  className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-bold text-slate-100 min-w-[40px]">
                  {preferences.vixAlertThreshold}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Alert when VIX crosses this level
              </p>
            </div>

            {/* Timeframe */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block">
                Timeframe
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "intraday", label: "Intraday" },
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        timeframe: option.value,
                      })
                    }
                    className={`p-2 rounded text-xs font-medium transition-all ${
                      preferences.timeframe === option.value
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-900/50 text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            {/* Report Depth */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block">
                Report Depth
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "brief", label: "Brief" },
                  { value: "standard", label: "Standard" },
                  { value: "detailed", label: "Detailed" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setPreferences({ ...preferences, depth: option.value })
                    }
                    className={`p-2 rounded text-xs font-medium transition-all ${
                      preferences.depth === option.value
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-900/50 text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Signal Sensitivity */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block">
                Signal Sensitivity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "low", label: "Low" },
                  { value: "moderate", label: "Moderate" },
                  { value: "high", label: "High" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        signalSensitivity: option.value,
                      })
                    }
                    className={`p-2 rounded text-xs font-medium transition-all ${
                      preferences.signalSensitivity === option.value
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-900/50 text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Threshold for market signal detection
              </p>
            </div>

            {/* Display Toggles */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block">
                Display Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.showMacro}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        showMacro: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-300">
                    Show macro context
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.showVolatility}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        showVolatility: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-300">
                    Show volatility metrics
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={savePreferences}
          disabled={saving}
          className="w-full mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save size={14} />
          {saving
            ? "Saving..."
            : saved
            ? "Preferences Saved"
            : "Save Configuration"}
        </button>
      </div>
    </Card>
  );
}
