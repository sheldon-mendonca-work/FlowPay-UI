

import { X, Percent, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Offer } from "@/lib/types";

interface OfferSelectorProps {
  offers: Offer[];
  selectedOfferId: string | null;
  onSelect: (offerId: string | null) => void;
  paymentAmount: number;
}

function BudgetBar({ remaining, total }: { remaining: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
  return (
    <div className="w-full h-1 rounded-full bg-muted overflow-hidden mt-1.5">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          pct > 40 ? "bg-success" : pct > 15 ? "bg-warning" : "bg-destructive"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function OfferSelector({ offers, selectedOfferId, onSelect, paymentAmount }: OfferSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        Available Offers
      </label>
      <div className="flex flex-col gap-2">
        {offers.map((offer) => {
          const isSelected = selectedOfferId === offer.id;
          const eligible = paymentAmount >= offer.minPaymentAmount;

          return (
            <div
              key={offer.id}
              onClick={() => eligible && onSelect(isSelected ? null : offer.id)}
              className={cn(
                "relative rounded-lg border p-3 cursor-pointer transition-all select-none",
                isSelected
                  ? "border-primary/60 bg-primary/8 shadow-[0_0_0_1px_oklch(0.660_0.175_213/0.3)]"
                  : eligible
                  ? "border-border bg-card hover:border-border/80 hover:bg-accent/40"
                  : "border-border/40 bg-card/50 opacity-50 cursor-not-allowed"
              )}
            >
              {/* Remove button */}
              {isSelected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(null);
                  }}
                  className="absolute top-2 right-2 size-4 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Remove offer"
                >
                  <X className="size-3" />
                </button>
              )}

              <div className="flex items-start gap-2">
                <div
                  className={cn(
                    "size-6 rounded flex items-center justify-center shrink-0 mt-px",
                    offer.type === "DISCOUNT"
                      ? "bg-info/15 text-info"
                      : "bg-success/15 text-success"
                  )}
                >
                  {offer.type === "DISCOUNT" ? (
                    <Percent className="size-3.5" />
                  ) : (
                    <DollarSign className="size-3.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-foreground">{offer.code}</span>
                    <span
                      className={cn(
                        "text-[9px] px-1 py-px rounded font-mono font-bold uppercase border",
                        offer.type === "DISCOUNT"
                          ? "border-info/30 text-info bg-info/10"
                          : "border-success/30 text-success bg-success/10"
                      )}
                    >
                      {offer.type}
                    </span>
                    {!eligible && (
                      <span className="text-[9px] text-muted-foreground">
                        min ${offer.minPaymentAmount}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                    {offer.description}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">
                      Benefit:{" "}
                      <span className="text-foreground font-medium">
                        {offer.type === "DISCOUNT" && offer.benefitAmount < 20
                          ? `${offer.benefitAmount}%`
                          : `$${offer.benefitAmount}`}
                      </span>
                    </span>
                    <span className="text-muted-foreground font-mono">
                      ${offer.remainingBudget.toLocaleString()} left
                    </span>
                  </div>
                  <BudgetBar remaining={offer.remainingBudget} total={offer.totalBudget} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
