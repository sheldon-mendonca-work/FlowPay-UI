

import { ArrowDownLeft, Coins, Tag, RotateCcw, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LiveActivityEvent } from "@/types/types";

function eventConfig(type: LiveActivityEvent["type"]) {
  switch (type) {
    case "payment_received":
      return {
        icon: ArrowDownLeft,
        iconClass: "text-success bg-success/15",
        label: "Payment Received",
        valueClass: "text-success",
      };
    case "cashback_received":
      return {
        icon: Coins,
        iconClass: "text-warning bg-warning/15",
        label: "Cashback Credited",
        valueClass: "text-warning",
      };
    case "offer_redeemed":
      return {
        icon: Tag,
        iconClass: "text-info bg-info/15",
        label: "Offer Redeemed",
        valueClass: "text-info",
      };
    case "refund_received":
      return {
        icon: RotateCcw,
        iconClass: "text-muted-foreground bg-muted",
        label: "Refund Received",
        valueClass: "text-muted-foreground",
      };
  }
}

function formatTime(d: Date): string {
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 60_000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  const hrs = Math.floor(diff / 60);
  return `${hrs}h ago`;
}

interface LiveActivityFeedProps {
  events: LiveActivityEvent[];
}

export function LiveActivityFeed({ events }: LiveActivityFeedProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Wifi className="size-3.5 text-success" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Live Activity</h3>
        <div className="flex items-center gap-1 ml-auto">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] text-muted-foreground">live</span>
        </div>
      </div>

      <div className="divide-y divide-border/40">
        {events.slice(0, 8).map((event) => {
          const cfg = eventConfig(event.type);
          const Icon = cfg.icon;

          return (
            <div
              key={event.id}
              className={cn(
                "flex items-start gap-3 px-4 py-3 transition-all",
                event.isNew && "bg-primary/5 animate-pulse-once"
              )}
            >
              <div className={cn("size-7 rounded-md flex items-center justify-center shrink-0 mt-0.5", cfg.iconClass)}>
                <Icon className="size-3.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-foreground">{cfg.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0 tabular-nums">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  {event.message}
                </p>
                {event.amount && (
                  <span className={cn("text-xs font-mono font-semibold mt-1 block", cfg.valueClass)}>
                    +${event.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {event.currency}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
