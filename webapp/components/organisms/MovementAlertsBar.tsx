"use client";

import { useEffect, useState } from "react";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Accordion } from "@/components/molecules/Accordion";
import { Badge } from "@/components/atoms/Badge";
import { SectionHeader } from "@/components/atoms/SectionHeader";
import { AlertCard } from "@/components/molecules/AlertCard";
import { StatusBadge } from "@/components/atoms/StatusBadge";

type Props = {
  symbols: string[];
};

type AlertsSummary = {
  bigMovers: number;
  nearHighs: number;
  nearLows: number;
  details: Array<{
    symbol: string;
    alerts: Array<{
      type: string;
      message: string;
      severity: string;
      direction?: "up" | "down";
    }>;
  }>;
};

export function MovementAlertsBar({ symbols }: Props) {
  const [summary, setSummary] = useState<AlertsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }

    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          symbols: symbols.join(","),
        });

        const response = await fetch(`/api/movement-alerts?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch alerts");
        }

        const data = await response.json();
        setSummary(data);
      } catch (error) {
        console.error("Error fetching movement alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [symbols]);

  if (loading || !summary) {
    return null;
  }

  const hasAlerts =
    summary.bigMovers > 0 || summary.nearHighs > 0 || summary.nearLows > 0;

  if (!hasAlerts) {
    return null;
  }

  // Group alerts by type
  const bigMovers = summary.details.filter((d) =>
    d.alerts.some((a) => a.type === "price_move")
  );
  const nearHighs = summary.details.filter((d) =>
    d.alerts.some((a) => a.type === "near_52w_high")
  );
  const nearLows = summary.details.filter((d) =>
    d.alerts.some((a) => a.type === "near_52w_low")
  );

  return (
    <Accordion
      header={
        <>
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-amber-400" size={18} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                Today's Alerts
              </h3>
              <div className="mt-2 flex flex-wrap gap-3">
                {summary.bigMovers > 0 && (
                  <Badge
                    icon={TrendingUp}
                    iconColor="text-amber-400"
                    count={summary.bigMovers}
                    label="hit ±3% moves"
                  />
                )}
                {summary.nearHighs > 0 && (
                  <Badge
                    icon={TrendingUp}
                    iconColor="text-teal-500"
                    count={summary.nearHighs}
                    label="near 52-week highs"
                  />
                )}
                {summary.nearLows > 0 && (
                  <Badge
                    icon={TrendingDown}
                    iconColor="text-rose-400"
                    count={summary.nearLows}
                    label="near 52-week lows"
                  />
                )}
              </div>
            </div>
          </div>
        </>
      }
    >
      <div className="p-6 space-y-6">
        {/* Big Movers */}
        {bigMovers.length > 0 && (
          <div>
            <div className="mb-3">
              <SectionHeader
                icon={TrendingUp}
                iconColor="text-amber-400"
                title="Big Movers"
                count={bigMovers.length}
              />
            </div>
            <div className="space-y-2">
              {bigMovers.map((detail) => {
                const alert = detail.alerts.find(
                  (a) => a.type === "price_move"
                );
                if (!alert) return null;
                const isUp = alert.direction === "up";
                const isLarge = alert.severity === "critical";
                const label = isUp
                  ? isLarge
                    ? "Surging"
                    : "Gaining"
                  : isLarge
                  ? "Plunging"
                  : "Dropping";
                return (
                  <AlertCard
                    key={detail.symbol}
                    symbol={detail.symbol}
                    message={alert.message}
                    type={isUp ? "success" : "critical"}
                    badge={
                      <StatusBadge
                        severity={isUp ? "success" : "critical"}
                        label={label}
                      />
                    }
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Near 52-Week Highs */}
        {nearHighs.length > 0 && (
          <div>
            <div className="mb-3">
              <SectionHeader
                icon={TrendingUp}
                iconColor="text-teal-500"
                title="Near 52-Week High"
                count={nearHighs.length}
              />
            </div>
            <div className="space-y-2">
              {nearHighs.map((detail) => {
                const alert = detail.alerts.find(
                  (a) => a.type === "near_52w_high"
                );
                if (!alert) return null;
                return (
                  <AlertCard
                    key={detail.symbol}
                    symbol={detail.symbol}
                    message={alert.message}
                    type="info"
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Near 52-Week Lows */}
        {nearLows.length > 0 && (
          <div>
            <div className="mb-3">
              <SectionHeader
                icon={TrendingDown}
                iconColor="text-rose-400"
                title="Near 52-Week Low"
                count={nearLows.length}
              />
            </div>
            <div className="space-y-2">
              {nearLows.map((detail) => {
                const alert = detail.alerts.find(
                  (a) => a.type === "near_52w_low"
                );
                if (!alert) return null;
                return (
                  <AlertCard
                    key={detail.symbol}
                    symbol={detail.symbol}
                    message={alert.message}
                    type="critical"
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Accordion>
  );
}
