

import { Activity, BarChart3, Zap, AlertTriangle } from "lucide-react";
import { EventTimeline } from "@/components/event-timeline";
import type { TimelineStep } from "@/types/types";

interface KafkaStats {
  paymentsToday: number;
  offersRedeemed: number;
  kafkaEventsProcessed: number;
  failedEvents: number;
}

interface CenterColumnProps {
  steps: TimelineStep[];
  isRunning: boolean;
  stats: KafkaStats;
}

function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: "success" | "info" | "warning" | "destructive";
}) {
  const colorMap = {
    success: "text-success",
    info: "text-info",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-1.5">
        <span className={accent ? colorMap[accent] : "text-muted-foreground"}>{icon}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium truncate">
          {label}
        </span>
      </div>
      <span className="text-lg font-bold font-mono tabular-nums text-foreground">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export function CenterColumn({ steps, isRunning, stats }: CenterColumnProps) {
  return (
    <div className="flex flex-col h-full border-r border-border pb-8">
      {/* Stats row */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            icon={<Activity className="size-3.5" />}
            label="Payments Today"
            value={stats.paymentsToday}
            accent="info"
          />
          <StatTile
            icon={<BarChart3 className="size-3.5" />}
            label="Offers Redeemed"
            value={stats.offersRedeemed}
            accent="success"
          />
          <StatTile
            icon={<Zap className="size-3.5" />}
            label="Kafka Events"
            value={stats.kafkaEventsProcessed}
            accent="warning"
          />
          <StatTile
            icon={<AlertTriangle className="size-3.5" />}
            label="Failed Events"
            value={stats.failedEvents}
            accent="destructive"
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-hidden">
        <EventTimeline steps={steps} isRunning={isRunning} />
      </div>
    </div>
  );
}
