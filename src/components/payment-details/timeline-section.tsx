import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EventTimeline } from "@/components/event-timeline";
import { fetchPaymentTimeline } from "@/api/paymentTimelineAPI";
import { buildPaymentDetailsTimelineSteps, mergeTimelineSnapshot } from "@/lib/timeline-utils";
import type { TimelineStep } from "@/types/types";

export function PaymentTimelineSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function PaymentTimelineSection({ paymentId }: { paymentId: string }) {
  const [steps, setSteps] = useState<TimelineStep[] | null>(null);
  const [totalTimeMs, setTotalTimeMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(
    (signal?: AbortSignal) => {
      setLoading(true);
      setError(false);
      fetchPaymentTimeline(paymentId, signal)
        .then((dto) => {
          const hasOffer = dto.timeline_steps.some((s) => s.step_name === "OFFER_EVALUATED");
          const skeleton = buildPaymentDetailsTimelineSteps(hasOffer);
          setSteps(mergeTimelineSnapshot(skeleton, dto));
          setTotalTimeMs(dto.status === "SUCCESS" || dto.status === "FAILED" ? dto.total_time : null);
        })
        .catch((err) => {
          if (signal?.aborted) return;
          console.error("Failed to fetch payment timeline:", err);
          setError(true);
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        });
    },
    [paymentId],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (loading) return <PaymentTimelineSkeleton />;

  if (error || !steps) {
    return (
      <div className="rounded-lg border border-border bg-card flex flex-col items-center justify-center gap-3 py-10 px-4">
        <AlertTriangle className="size-5 text-destructive" />
        <p className="text-xs text-muted-foreground text-center">Failed to load timeline</p>
        <Button variant="outline" size="sm" onClick={() => load()}>
          <RotateCw data-icon="inline-start" className="size-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden h-[420px]">
      <EventTimeline steps={steps} isRunning={false} totalTimeMs={totalTimeMs} />
    </div>
  );
}
