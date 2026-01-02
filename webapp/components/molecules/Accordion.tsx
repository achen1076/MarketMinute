"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Card from "@/components/atoms/Card";

type AccordionProps = {
  header: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
};

/**
 * Reusable accordion component with expand/collapse functionality
 */
export function Accordion({
  header,
  children,
  defaultExpanded = false,
  className = "",
}: AccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Header - Clickable to expand/collapse */}
      <div
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">{header}</div>
          <div className="shrink-0 mt-0.5">
            {isExpanded ? (
              <ChevronUp size={18} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={18} className="text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border bg-muted/30">{children}</div>
      )}
    </Card>
  );
}
