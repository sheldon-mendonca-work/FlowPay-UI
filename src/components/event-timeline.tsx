

import { useState } from "react";
import {
  CheckCircle2, Loader2, Circle, XCircle, ChevronDown,
  Activity, Eye, X, Copy, Check,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { TimelineStep, TimelineStepState } from "@/lib/types";

const SERVICE_STYLES: Record<string, { label: string; className: string }> = {
  "payment-service": { label: "Payment Service", className: "bg-primary/12 text-primary border-primary/20" },
  "offer-service":   { label: "Offer Service",   className: "bg-info/12 text-info border-info/20" },
  "kafka-broker":    { label: "Kafka",            className: "bg-warning/12 text-warning border-warning/20" },
  "ledger-service":  { label: "Ledger Service",   className: "bg-success/12 text-success border-success/20" },
  "outbox-worker":   { label: "Outbox Worker",    className: "bg-secondary text-secondary-foreground border-border" },
  "promo-service":   { label: "Promo Service",    className: "bg-purple-500/12 text-purple-400 border-purple-500/20" },
};

function ServiceBadge({ service }: { service: string }) {
  const config = SERVICE_STYLES[service] ?? {
    label: service,
    className: "bg-secondary text-secondary-foreground border-border",
  };
  return (
    <span className={cn(
      "text-[9px] font-mono font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border",
      config.className
    )}>
      {config.label}
    </span>
  );
}

function StateIcon({ state }: { state: TimelineStepState }) {
  switch (state) {
    case "success":    return <CheckCircle2 className="size-[18px] text-success shrink-0" />;
    case "processing": return <Loader2 className="size-[18px] text-info shrink-0 animate-spin" />;
    case "failed":     return <XCircle className="size-[18px] text-destructive shrink-0" />;
    default:           return <Circle className="size-[18px] text-border shrink-0" />;
  }
}

function StateLabel({ state }: { state: TimelineStepState }) {
  const map: Record<TimelineStepState, { label: string; className: string }> = {
    success:    { label: "Completed",  className: "text-success" },
    processing: { label: "Processing", className: "text-info" },
    failed:     { label: "Failed",     className: "text-destructive" },
    pending:    { label: "Pending",    className: "text-muted-foreground/50" },
  };
  const { label, className } = map[state];
  return <span className={cn("text-[10px] font-mono font-medium", className)}>{label}</span>;
}

function MetaRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-1">
      <span className="text-[10px] text-muted-foreground w-24 shrink-0 font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="text-[11px] font-mono text-foreground/80 break-all">{value}</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
    >
      {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/** Side drawer — shows raw JSON event payload */
function EventInspectorDrawer({
  step,
  open,
  onClose,
}: {
  step: TimelineStep | null;
  open: boolean;
  onClose: () => void;
}) {
  const json = step?.rawPayload
    ? JSON.stringify(step.rawPayload, null, 2)
    : null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col gap-0 border-l border-border bg-background"
      >
        <SheetHeader className="px-5 py-4 border-b border-border shrink-0 flex flex-row items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <SheetTitle className="text-sm font-bold text-left">Event Inspector</SheetTitle>
            {step && (
              <p className="text-xs text-muted-foreground font-mono">{step.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Close inspector"
          >
            <X className="size-4" />
          </button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto flex flex-col gap-0 min-h-0">
          {step && (
            <>
              {/* Step metadata */}
              <div className="px-5 py-4 border-b border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Trace Metadata
                </p>
                <div className="divide-y divide-border/40">
                  <MetaRow label="Event ID"    value={step.eventId} />
                  <MetaRow label="Trace ID"    value={step.traceId} />
                  <MetaRow label="Request ID"  value={step.requestId} />
                  <MetaRow label="Payment ID"  value={step.paymentId} />
                  <MetaRow label="Offer ID"    value={step.offerId} />
                  <MetaRow label="Reservation" value={step.reservationId} />
                  <MetaRow label="Redemption"  value={step.redemptionId} />
                  <MetaRow label="Idempotency" value={step.idempotencyKey} />
                  {step.timestamp && (
                    <MetaRow
                      label="Timestamp"
                      value={step.timestamp.toISOString()}
                    />
                  )}
                </div>
              </div>

              {/* Raw JSON payload */}
              {json ? (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Raw Event Payload
                    </p>
                    <CopyButton text={json} />
                  </div>
                  <div className="flex-1 overflow-auto bg-muted/30 p-4">
                    <pre className="text-[11px] font-mono text-foreground/85 leading-relaxed whitespace-pre-wrap break-all">
                      {json}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-6 text-xs text-muted-foreground">
                  No raw payload available for this step.
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface EventTimelineProps {
  steps: TimelineStep[];
  isRunning: boolean;
}

export function EventTimeline({ steps, isRunning }: EventTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [inspectorStep, setInspectorStep] = useState<TimelineStep | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const completedCount = steps.filter((s) => s.state === "success").length;
  const totalCount = steps.length;

  function openInspector(step: TimelineStep) {
    setInspectorStep(step);
    setInspectorOpen(true);
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Distributed Event Timeline
            </h2>
            {isRunning && (
              <span className="flex items-center gap-1 text-[10px] text-info font-mono">
                <Loader2 className="size-3 animate-spin" />
                processing
              </span>
            )}
          </div>
          {totalCount > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>

        {/* Empty state */}
        {steps.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="size-12 rounded-full border border-border/60 flex items-center justify-center">
              <Activity className="size-5 text-muted-foreground/30" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-muted-foreground">No active payment</p>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                Initiate a payment from the sender panel to observe the distributed event trace
              </p>
            </div>
          </div>
        )}

        {/* Timeline */}
        {steps.length > 0 && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="relative">
              {/* Vertical guide line */}
              <div className="absolute left-[9px] top-3 bottom-3 w-px bg-border/40" />

              <div className="flex flex-col gap-1.5">
                {steps.map((step) => {
                  const isExpanded = expandedId === step.id;
                  const isActive = step.state === "processing";
                  const isSuccess = step.state === "success";
                  const hasPayload = isSuccess && !!step.rawPayload;

                  return (
                    <div key={step.id} className="relative pl-7">
                      {/* Icon on the line */}
                      <div className="absolute left-0 top-[14px] -translate-y-1/2">
                        <StateIcon state={step.state} />
                      </div>

                      <div
                        className={cn(
                          "rounded-lg border px-3 py-2.5 transition-all duration-200",
                          isActive
                            ? "border-info/40 bg-info/6 ring-1 ring-info/20 shadow-sm"
                            : isSuccess
                            ? "border-border/50 bg-card"
                            : step.state === "failed"
                            ? "border-destructive/30 bg-destructive/5"
                            : "border-border/25 bg-card/30"
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center gap-2",
                            isSuccess && "cursor-pointer"
                          )}
                          onClick={() => isSuccess && setExpandedId(isExpanded ? null : step.id)}
                        >
                          <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                            <span
                              className={cn(
                                "text-xs font-semibold leading-tight",
                                isActive      ? "text-info"
                                : isSuccess   ? "text-foreground"
                                : step.state === "failed" ? "text-destructive"
                                : "text-muted-foreground/60"
                              )}
                            >
                              {step.name}
                            </span>

                            <div className="flex items-center gap-2 flex-wrap">
                              <ServiceBadge service={step.service} />
                              <StateLabel state={step.state} />
                              {step.timestamp && step.state !== "pending" && (
                                <span className="text-[10px] font-mono text-muted-foreground/60 tabular-nums">
                                  {step.timestamp.toLocaleTimeString("en-US", {
                                    hour12: false,
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right-side controls */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* View Event button — opens raw JSON drawer */}
                            {hasPayload && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInspector(step);
                                }}
                                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors px-1.5 py-0.5 rounded hover:bg-primary/10 border border-transparent hover:border-primary/20"
                                aria-label={`View raw event for ${step.name}`}
                              >
                                <Eye className="size-3" />
                                <span className="hidden sm:block">View Event</span>
                              </button>
                            )}

                            {isSuccess && (
                              <ChevronDown
                                className={cn(
                                  "size-3.5 text-muted-foreground transition-transform shrink-0",
                                  isExpanded && "rotate-180"
                                )}
                              />
                            )}
                          </div>
                        </div>

                        {/* Expanded trace metadata (inline) */}
                        {isExpanded && isSuccess && (
                          <div className="mt-2.5 pt-2.5 border-t border-border/50 divide-y divide-border/30">
                            <MetaRow label="Event ID"    value={step.eventId} />
                            <MetaRow label="Trace ID"    value={step.traceId} />
                            <MetaRow label="Request ID"  value={step.requestId} />
                            <MetaRow label="Payment ID"  value={step.paymentId} />
                            <MetaRow label="Offer ID"    value={step.offerId} />
                            <MetaRow label="Reservation" value={step.reservationId} />
                            <MetaRow label="Redemption"  value={step.redemptionId} />
                            <MetaRow label="Idempotency" value={step.idempotencyKey} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Raw event inspector side drawer */}
      <EventInspectorDrawer
        step={inspectorStep}
        open={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
      />
    </>
  );
}
