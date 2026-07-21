import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/utils/currency";
import { PaymentStatusBadge } from "./status-badge";
import type { PaymentDetails } from "@/types/types";

function fmtAmount(amount: number, currency: string) {
  return `${getCurrencySymbol(currency)}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDateTime(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function SummaryRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span
        className={cn(
          "text-xs text-right truncate",
          emphasize ? "font-mono font-bold text-foreground" : "font-mono text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function PaymentIdRow({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex items-center justify-between py-1.5 gap-3">
      <span className="text-xs text-muted-foreground shrink-0">Payment ID</span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-xs font-mono text-foreground hover:text-primary transition-colors min-w-0"
        aria-label="Copy payment ID"
      >
        <span className="truncate">{id}</span>
        {copied ? (
          <Check className="size-3 text-success shrink-0" />
        ) : (
          <Copy className="size-3 text-muted-foreground shrink-0" />
        )}
      </button>
    </div>
  );
}

export function PaymentSummaryCard({ details }: { details: PaymentDetails }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Payment Summary
        </h3>
        <PaymentStatusBadge status={details.status} />
      </div>

      <div className="px-4 py-3 flex flex-col divide-y divide-border/50">
        <SummaryRow
          label="Amount"
          value={fmtAmount(details.amount, details.currency)}
          emphasize
        />
        <SummaryRow label="Sender" value={details.senderName} />
        <SummaryRow label="Receiver" value={details.receiverName} />
        <PaymentIdRow id={details.id} />
        <SummaryRow label="Currency" value={details.currency} />
        <SummaryRow label="Created Time" value={fmtDateTime(details.createdAt)} />
        <SummaryRow label="Completed Time" value={fmtDateTime(details.completedAt)} />
        <SummaryRow label="Payment Method" value={humanize(details.paymentMethod)} />
      </div>
    </div>
  );
}

export function PaymentSummarySkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
