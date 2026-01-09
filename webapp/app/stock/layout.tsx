import type { ReactNode } from "react";
import StockSearchBar from "./StockSearchBar";
import { MarketIndices } from "@/components/molecules/MarketIndices";

export default function StockLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-8 lg:w-9/10 mx-auto">
      {/* Market Indices */}
      {/* <MarketIndices /> */}

      {/* Search Bar */}
      <StockSearchBar />

      {/* Stock Content */}
      {children}
    </div>
  );
}
