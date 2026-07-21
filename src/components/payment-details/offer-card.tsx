import { Percent, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/utils/currency";
import { OfferStatusBadge } from "./status-badge";
import type { Currency, PaymentOfferDetails } from "@/types/types";

function fmt(amount: number, currency: string) {
  return `${getCurrencySymbol(currency)}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function OfferCard({ offer, currency }: { offer: PaymentOfferDetails; currency: Currency }) {
  const isDiscount = offer.type === "DISCOUNT";

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Offer
        </h3>
        <OfferStatusBadge status={offer.status} />
      </div>

      <div className="px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "size-9 rounded-lg flex items-center justify-center shrink-0",
              isDiscount ? "bg-info/15 text-info" : "bg-success/15 text-success"
            )}
          >
            {isDiscount ? <Percent className="size-4" /> : <DollarSign className="size-4" />}
          </div>
          <span className="text-sm font-mono font-bold text-foreground tracking-wide">
            {offer.code}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1 border-t border-border/40">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
              Discount
            </p>
            <p className={cn("text-xs font-mono tabular-nums", offer.discountAmount > 0 ? "text-info font-semibold" : "text-muted-foreground")}>
              {offer.discountAmount > 0 ? `-${fmt(offer.discountAmount, currency)}` : fmt(0, currency)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
              Cashback
            </p>
            <p className={cn("text-xs font-mono tabular-nums", offer.cashbackAmount > 0 ? "text-success font-semibold" : "text-muted-foreground")}>
              {offer.cashbackAmount > 0 ? `+${fmt(offer.cashbackAmount, currency)}` : fmt(0, currency)}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
              Redeemed
            </p>
            <p className="text-xs font-mono text-foreground">
              {offer.redeemedAt
                ? offer.redeemedAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
                : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
