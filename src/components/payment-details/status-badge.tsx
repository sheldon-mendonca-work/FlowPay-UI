import { cn } from "@/lib/utils";
import type { OfferRedemptionStatus, TxStatus } from "@/types/types";

const TX_STATUS_STYLE: Record<TxStatus, string> = {
  COMPLETED:  "border-success/30 text-success bg-success/10",
  SUCCESS:    "border-success/30 text-success bg-success/10",
  PENDING:    "border-warning/30 text-warning bg-warning/10",
  PROCESSING: "border-info/30 text-info bg-info/10",
  FAILED:     "border-destructive/30 text-destructive bg-destructive/10",
};

const OFFER_STATUS_STYLE: Record<OfferRedemptionStatus, string> = {
  REDEEMED: "border-success/30 text-success bg-success/10",
  PENDING:  "border-warning/30 text-warning bg-warning/10",
  FAILED:   "border-destructive/30 text-destructive bg-destructive/10",
};

interface StatusPillProps {
  label: string;
  className?: string;
  size?: "sm" | "md";
}

function StatusPill({ label, className, size = "sm" }: StatusPillProps) {
  return (
    <span
      className={cn(
        "rounded font-bold uppercase border shrink-0",
        size === "sm" ? "text-[9px] px-1.5 py-px" : "text-[11px] px-2 py-0.5",
        className
      )}
    >
      {label}
    </span>
  );
}

export function PaymentStatusBadge({ status, size }: { status: TxStatus; size?: "sm" | "md" }) {
  return <StatusPill label={status} className={TX_STATUS_STYLE[status]} size={size} />;
}

export function OfferStatusBadge({ status, size }: { status: OfferRedemptionStatus; size?: "sm" | "md" }) {
  return <StatusPill label={status} className={OFFER_STATUS_STYLE[status]} size={size} />;
}
