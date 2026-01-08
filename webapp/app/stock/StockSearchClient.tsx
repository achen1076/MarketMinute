"use client";

import { Search, TrendingUp, BarChart2, Zap } from "lucide-react";
import Card from "@/components/atoms/Card";

export default function StockSearchClient() {
  return (
    <div className="flex flex-col items-center justify-center py-16 w-3/4 mx-auto">
      <div className="text-center max-w-xl mx-auto space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Search className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Search for a stock to get started
          </h2>
          <p className="text-muted-foreground">
            Enter a ticker symbol or company name in the search bar above
          </p>
        </div>
      </div>
    </div>
  );
}
