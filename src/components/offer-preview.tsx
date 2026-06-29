

import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Offer } from "@/types/types";

interface OfferPreviewProps {
  offer: Offer | null;
  amount: number;
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-xs font-mono font-medium tabular-nums",
          highlight ? "text-success" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function OfferPreview({ offer, amount }: OfferPreviewProps) {
  if (!offer) {
    return (
      <div className="rounded-lg border border-border/50 border-dashed bg-card/50 p-4 flex items-center gap-3">
        <Tag className="size-4 text-muted-foreground/50 shrink-0" />
        <p className="text-xs text-muted-foreground">No offer applied</p>
      </div>
    );
  }

  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (offer.type === "DISCOUNT") {
    const discountAmount =
      offer.benefitAmount < 20
        ? amount * (offer.benefitAmount / 100)
        : offer.benefitAmount;
    const netAmount = Math.max(0, amount - discountAmount);

    return (
      <div className="rounded-lg border border-info/25 bg-info/5 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="size-1.5 rounded-full bg-info" />
          <span className="text-[10px] uppercase tracking-wider text-info font-semibold">Discount Applied</span>
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">{offer.code}</span>
        </div>
        <div className="divide-y divide-border/50">
          <Row label="Original Amount" value={fmt(amount)} />
          <Row label="Discount" value={`-${fmt(discountAmount)}`} highlight />
          <Row label="Net Amount" value={fmt(netAmount)} />
        </div>
      </div>
    );
  }

  // CASHBACK
  const cashbackAmount =
    offer.benefitAmount >= 20
      ? offer.benefitAmount
      : amount * (offer.benefitAmount / 100);

  return (
    <div className="rounded-lg border border-success/25 bg-success/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="size-1.5 rounded-full bg-success" />
        <span className="text-[10px] uppercase tracking-wider text-success font-semibold">Cashback Applied</span>
        <span className="text-[10px] font-mono text-muted-foreground ml-auto">{offer.code}</span>
      </div>
      <div className="divide-y divide-border/50">
        <Row label="Payment Amount" value={fmt(amount)} />
        <Row label="Expected Cashback" value={`+${fmt(cashbackAmount)}`} highlight />
        <Row label="Final Cashback" value={fmt(cashbackAmount)} highlight />
      </div>
    </div>
  );
}
